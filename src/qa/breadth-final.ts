import { WebIO } from '@gltf-transform/core';
import { EXTMeshGPUInstancing } from '@gltf-transform/extensions';
import * as THREE from 'three';

import {
  readSemanticMetadataV1FromExtras,
  type AssetIntentV1,
  type VfxAxisDirection,
  type VfxFacingMode,
  type VfxTransparencyMode,
} from '../contracts';
import { createAssetQaReportV1, type AssetQaReportV1, type QaFinding } from './types';

export interface FinalVfxMaterialEvidenceV1 {
  id: string;
  effectSurface: boolean;
  alphaMode: VfxTransparencyMode;
  alphaData: boolean;
  doubleSided: boolean;
  alphaCutoff?: number;
}

export interface FinalVfxGlbEvidenceV1 {
  schemaVersion: 1;
  meshCount: number;
  primitiveCount: number;
  triangleCount: number;
  materials: FinalVfxMaterialEvidenceV1[];
  facingSemantics: VfxFacingMode[];
  normalAxis?: VfxAxisDirection;
  directionAxis?: VfxAxisDirection;
  clips: Array<{ name: string; durationSeconds: number }>;
}

const stable = (value: number): number => Math.round(value * 1_000_000) / 1_000_000;

function bytesContainAscii(bytes: Uint8Array, value: string): boolean {
  const needle = new TextEncoder().encode(value);
  outer: for (let index = 0; index <= bytes.length - needle.length; index++) {
    for (let offset = 0; offset < needle.length; offset++) {
      if (bytes[index + offset] !== needle[offset]) continue outer;
    }
    return true;
  }
  return false;
}

/** Inspect alpha-bearing structure in the exact embedded final-byte image. */
function encodedTextureHasAlpha(mimeType: string, bytes: Uint8Array): boolean {
  if (mimeType === 'image/png') {
    // PNG IHDR color type: 4/6 carry alpha directly; tRNS adds it to
    // grayscale/RGB/indexed images. Byte 25 is stable after the 8-byte
    // signature + IHDR length/type + width/height/bit-depth fields.
    const colorType = bytes[25];
    return colorType === 4 || colorType === 6 || bytesContainAscii(bytes, 'tRNS');
  }
  if (mimeType === 'image/webp') {
    // Lossless/extended WebP signals alpha with ALPH or the VP8X alpha flag.
    if (bytesContainAscii(bytes, 'ALPH')) return true;
    const vp8xIndex = (() => {
      const marker = new TextEncoder().encode('VP8X');
      for (let index = 0; index <= bytes.length - marker.length; index++) {
        if (marker.every((value, offset) => bytes[index + offset] === value)) return index;
      }
      return -1;
    })();
    return vp8xIndex >= 0 && ((bytes[vp8xIndex + 8] ?? 0) & 0x10) !== 0;
  }
  return false;
}

function animationDuration(animation: import('@gltf-transform/core').Animation): number {
  let duration = 0;
  for (const sampler of animation.listSamplers()) {
    const max = sampler.getInput()?.getMax([]);
    if (max && typeof max[0] === 'number' && Number.isFinite(max[0])) {
      duration = Math.max(duration, max[0]);
    }
  }
  return stable(duration);
}

function signedAxis(vector: THREE.Vector3): VfxAxisDirection {
  const values = [
    { axis: 'X', value: vector.x },
    { axis: 'Y', value: vector.y },
    { axis: 'Z', value: vector.z },
  ] as const;
  const dominant = [...values].sort((a, b) => Math.abs(b.value) - Math.abs(a.value))[0]!;
  return `${dominant.value < 0 ? '-' : '+'}${dominant.axis}` as VfxAxisDirection;
}

function finalEffectAxis(
  nodes: readonly import('@gltf-transform/core').Node[],
  mode: 'normal' | 'length',
): VfxAxisDirection | undefined {
  let best: { score: number; direction: THREE.Vector3 } | undefined;
  for (const node of nodes) {
    const semantic = readSemanticMetadataV1FromExtras(node.getExtras());
    if (!(semantic?.roles ?? []).some((role) => /^vfx\.effect\.surface(?:\.|$)/.test(role))) {
      continue;
    }
    const matrix = new THREE.Matrix4().fromArray(node.getWorldMatrix());
    const scale = node.getWorldScale();
    const scaleMagnitude = Math.hypot(scale[0], scale[1], scale[2]);
    for (const primitive of node.getMesh()?.listPrimitives() ?? []) {
      const position = primitive.getAttribute('POSITION');
      if (!position) continue;
      const min = position.getMin([]);
      const max = position.getMax([]);
      const axes = [
        { score: (max[0] ?? 0) - (min[0] ?? 0), direction: new THREE.Vector3(1, 0, 0) },
        { score: (max[1] ?? 0) - (min[1] ?? 0), direction: new THREE.Vector3(0, 1, 0) },
        { score: (max[2] ?? 0) - (min[2] ?? 0), direction: new THREE.Vector3(0, 0, 1) },
      ];
      const selected = axes.reduce((candidate, value) =>
        mode === 'length'
          ? value.score > candidate.score
            ? value
            : candidate
          : value.score < candidate.score
            ? value
            : candidate,
      );
      const candidate = {
        score: selected.score * scaleMagnitude,
        direction: selected.direction.transformDirection(matrix),
      };
      if (
        !best ||
        (mode === 'length' ? candidate.score > best.score : candidate.score < best.score)
      ) {
        best = candidate;
      }
    }
  }
  return best ? signedAxis(best.direction) : undefined;
}

/**
 * Re-open the exact serialized GLB bytes and derive VFX evidence from resources
 * that survived bridge + dedup/optimization. This deliberately does not trust
 * the pre-export Three.js scene.
 */
export async function analyzeFinalVfxGlbBytesV1(bytes: Uint8Array): Promise<FinalVfxGlbEvidenceV1> {
  const io = new WebIO().registerExtensions([EXTMeshGPUInstancing]);
  const document = await io.readBinary(bytes);
  const root = document.getRoot();
  const renderableNodes = root.listNodes().filter((node) => node.getMesh() !== null);
  const meshes = [...new Set(renderableNodes.map((node) => node.getMesh()).filter(Boolean))];
  const primitives = meshes.flatMap((mesh) => mesh?.listPrimitives() ?? []);
  let triangleCount = 0;
  for (const primitive of primitives) {
    const indices = primitive.getIndices();
    const position = primitive.getAttribute('POSITION');
    triangleCount += indices ? indices.getCount() / 3 : (position?.getCount() ?? 0) / 3;
  }

  const effectSurfaceMaterials = new Set<import('@gltf-transform/core').Material>();
  for (const node of renderableNodes) {
    const semantic = readSemanticMetadataV1FromExtras(node.getExtras());
    if (!(semantic?.roles ?? []).some((role) => /^vfx\.effect\.surface(?:\.|$)/.test(role))) {
      continue;
    }
    for (const primitive of node.getMesh()?.listPrimitives() ?? []) {
      const material = primitive.getMaterial();
      if (material) effectSurfaceMaterials.add(material);
    }
  }

  const materials = [
    ...new Set(primitives.map((primitive) => primitive.getMaterial()).filter(Boolean)),
  ].map((material, index): FinalVfxMaterialEvidenceV1 => {
    const baseColor = material!.getBaseColorFactor();
    const texture = material!.getBaseColorTexture();
    const image = texture?.getImage();
    const mimeType = texture?.getMimeType() ?? '';
    const mode = material!.getAlphaMode().toLowerCase() as VfxTransparencyMode;
    return {
      id: material!.getName() || `material.${index}`,
      effectSurface: effectSurfaceMaterials.has(material!),
      alphaMode: mode,
      alphaData:
        (baseColor[3] ?? 1) < 1 ||
        (image !== null && image !== undefined && encodedTextureHasAlpha(mimeType, image)),
      doubleSided: material!.getDoubleSided(),
      ...(mode === 'mask' ? { alphaCutoff: material!.getAlphaCutoff() } : {}),
    };
  });

  const facingSemantics = new Set<VfxFacingMode>();
  for (const node of renderableNodes) {
    const semantic = readSemanticMetadataV1FromExtras(node.getExtras());
    for (const role of semantic?.roles ?? []) {
      const match = /^vfx\.facing\.(fixed|camera-spherical|camera-y-axis)$/.exec(role);
      if (match) facingSemantics.add(match[1] as VfxFacingMode);
    }
  }
  const normalAxis = finalEffectAxis(renderableNodes, 'normal');
  const directionAxis = finalEffectAxis(renderableNodes, 'length');

  return {
    schemaVersion: 1,
    meshCount: meshes.length,
    primitiveCount: primitives.length,
    triangleCount: Math.floor(triangleCount),
    materials,
    facingSemantics: [...facingSemantics].sort(),
    ...(normalAxis ? { normalAxis } : {}),
    ...(directionAxis ? { directionAxis } : {}),
    clips: root.listAnimations().map((animation) => ({
      name: animation.getName(),
      durationSeconds: animationDuration(animation),
    })),
  };
}

function finalFinding(intent: AssetIntentV1, value: Omit<QaFinding, 'profile'>): QaFinding {
  return { ...value, profile: intent.qaProfile || 'vfx.w7.final-glb' };
}

/** Exact VFX-002/003 checks against the final serialized artifact. */
export function evaluateFinalVfxGlbEvidenceV1(
  intent: AssetIntentV1,
  evidence: FinalVfxGlbEvidenceV1,
): QaFinding[] {
  if (intent.category !== 'vfx' || !intent.vfx) return [];
  const contract = intent.vfx;
  const findings: QaFinding[] = [];
  if (evidence.meshCount === 0 || evidence.primitiveCount === 0 || evidence.triangleCount === 0) {
    findings.push(
      finalFinding(intent, {
        code: 'VFX_GLTF_RENDERABLE_MISSING',
        disposition: 'block',
        dimension: 'exportIntegrity',
        message: 'Final GLB contains no renderable VFX geometry.',
        measurement: {
          name: 'finalVfxTriangles',
          actual: evidence.triangleCount,
          expected: '>=1',
        },
        repairText: 'Export the effect surface as portable geometry before final-byte approval.',
      }),
    );
  }
  const effectMaterials = evidence.materials.filter((material) => material.effectSurface);
  if (effectMaterials.length === 0) {
    findings.push(
      finalFinding(intent, {
        code: 'VFX_GLTF_EFFECT_SURFACE_MISSING',
        disposition: 'block',
        dimension: 'exportIntegrity',
        message: 'Final GLB contains no material attached to a vfx.effect.surface.* node.',
        repairText:
          'Preserve an explicit vfx.effect.surface.* semantic on each renderable effect node; use vfx.support.* for opaque support geometry.',
      }),
    );
  }
  for (const material of effectMaterials) {
    if (material.alphaMode !== contract.transparency) {
      findings.push(
        finalFinding(intent, {
          code: 'VFX_GLTF_TRANSPARENCY_MODE_MISMATCH',
          disposition: 'block',
          dimension: 'exportIntegrity',
          message: `${material.id} final GLB alpha mode is ${material.alphaMode}; expected ${contract.transparency}.`,
          affected: { material: material.id },
          measurement: {
            name: 'finalAlphaMode',
            actual: material.alphaMode,
            expected: contract.transparency,
          },
        }),
      );
    }
    if (contract.transparency !== 'opaque' && !material.alphaData) {
      findings.push(
        finalFinding(intent, {
          code: 'VFX_GLTF_ALPHA_DATA_MISSING',
          disposition: 'block',
          dimension: 'exportIntegrity',
          message: `${material.id} final GLB has no alpha-bearing factor or embedded texture.`,
          affected: { material: material.id },
          measurement: { name: 'finalAlphaData', actual: false, expected: true },
          repairText:
            'Pack a standalone alphaMap into the exported base-color texture alpha channel, or use an alpha-bearing base-color factor.',
        }),
      );
    }
    if (material.doubleSided !== contract.doubleSided) {
      findings.push(
        finalFinding(intent, {
          code: 'VFX_GLTF_SIDEDNESS_MISMATCH',
          disposition: 'block',
          dimension: 'exportIntegrity',
          message: `${material.id} final GLB sidedness differs from trusted VFX intent.`,
          affected: { material: material.id },
          measurement: {
            name: 'finalDoubleSided',
            actual: material.doubleSided,
            expected: contract.doubleSided,
          },
        }),
      );
    }
    if (
      contract.transparency === 'mask' &&
      (material.alphaCutoff === undefined || material.alphaCutoff <= 0 || material.alphaCutoff > 1)
    ) {
      findings.push(
        finalFinding(intent, {
          code: 'VFX_GLTF_ALPHA_CUTOFF_INVALID',
          disposition: 'block',
          dimension: 'exportIntegrity',
          message: `${material.id} final GLB MASK cutoff is outside (0, 1].`,
          affected: { material: material.id },
        }),
      );
    }
  }

  if (
    contract.facing.mode !== 'fixed' &&
    !evidence.facingSemantics.includes(contract.facing.mode)
  ) {
    findings.push(
      finalFinding(intent, {
        code: 'VFX_GLTF_FACING_SEMANTIC_MISSING',
        disposition: 'block',
        dimension: 'exportIntegrity',
        message: `Final GLB does not carry the ${contract.facing.mode} runtime-facing semantic.`,
        measurement: {
          name: 'finalFacingSemantics',
          actual: evidence.facingSemantics.join(',') || null,
          expected: contract.facing.mode,
        },
        repairText: 'Preserve the exporter-derived billboard semantic on the renderable quad node.',
      }),
    );
  }

  if (
    contract.facing.source === 'explicit' &&
    contract.facing.mode === 'fixed' &&
    contract.facing.normalAxis !== evidence.normalAxis
  ) {
    findings.push(
      finalFinding(intent, {
        code: 'VFX_GLTF_NORMAL_AXIS_MISMATCH',
        disposition: 'block',
        dimension: 'exportIntegrity',
        message: 'Final GLB effect-surface normal axis differs from explicit VFX intent.',
        measurement: {
          name: 'finalNormalAxis',
          actual: evidence.normalAxis ?? null,
          expected: contract.facing.normalAxis ?? null,
        },
      }),
    );
  }
  if (
    contract.facing.source === 'explicit' &&
    contract.facing.directionAxis !== undefined &&
    contract.facing.directionAxis !== evidence.directionAxis
  ) {
    findings.push(
      finalFinding(intent, {
        code: 'VFX_GLTF_DIRECTION_AXIS_MISMATCH',
        disposition: 'block',
        dimension: 'exportIntegrity',
        message: 'Final GLB effect-surface direction axis differs from explicit VFX intent.',
        measurement: {
          name: 'finalDirectionAxis',
          actual: evidence.directionAxis ?? null,
          expected: contract.facing.directionAxis,
        },
      }),
    );
  }

  if (contract.animation.driver === 'clip') {
    const clip = evidence.clips.find((candidate) => candidate.name === contract.animation.clipName);
    if (!clip || Math.abs(clip.durationSeconds - contract.animation.durationSeconds) > 0.000001) {
      findings.push(
        finalFinding(intent, {
          code: 'VFX_GLTF_REQUIRED_CLIP_MISSING',
          disposition: 'block',
          dimension: 'exportIntegrity',
          message: 'Final GLB dropped or changed the declared VFX animation clip.',
          affected: { clip: contract.animation.clipName ?? '<missing>' },
          measurement: {
            name: 'finalClipDurationSeconds',
            actual: clip?.durationSeconds ?? null,
            expected: contract.animation.durationSeconds,
            threshold: 0.000001,
            unit: 's',
          },
        }),
      );
    }
  }
  return findings;
}

export async function appendFinalVfxGlbQa(
  intent: AssetIntentV1,
  report: AssetQaReportV1,
  bytes: Uint8Array,
): Promise<AssetQaReportV1> {
  if (intent.category !== 'vfx') return report;
  const evidence = await analyzeFinalVfxGlbBytesV1(bytes);
  const findings = Object.values(report.dimensions).flatMap((dimension) => dimension.findings);
  findings.push(...evaluateFinalVfxGlbEvidenceV1(intent, evidence));
  const evaluatedDimensions = Object.entries(report.dimensions)
    .filter(([, dimension]) => dimension.status !== 'notEvaluated')
    .map(([dimension]) => dimension as keyof AssetQaReportV1['dimensions']);
  if (!evaluatedDimensions.includes('exportIntegrity')) evaluatedDimensions.push('exportIntegrity');
  const metrics = Object.fromEntries(
    Object.entries(report.dimensions).flatMap(([dimension, result]) =>
      result.metrics ? [[dimension, result.metrics]] : [],
    ),
  ) as Partial<
    Record<keyof AssetQaReportV1['dimensions'], Record<string, number | string | boolean | null>>
  >;
  metrics.exportIntegrity = {
    ...(metrics.exportIntegrity ?? {}),
    finalVfxMeshCount: evidence.meshCount,
    finalVfxPrimitiveCount: evidence.primitiveCount,
    finalVfxTriangles: evidence.triangleCount,
    finalVfxMaterialCount: evidence.materials.length,
    finalVfxEffectMaterialCount: evidence.materials.filter((material) => material.effectSurface)
      .length,
    finalVfxFacingSemantics: evidence.facingSemantics.join(','),
    finalVfxNormalAxis: evidence.normalAxis ?? null,
    finalVfxDirectionAxis: evidence.directionAxis ?? null,
    finalVfxClipCount: evidence.clips.length,
  };
  return createAssetQaReportV1(intent, { findings, evaluatedDimensions, metrics });
}
