import {
  conformancePromotionAuthorization,
  KILN_ENGINE_QA_OWNER,
  QaRegistry,
  type QaRule,
} from './registry';
import type { QaAffectedEntity, QaContext, QaFinding } from './types';

interface VectorLike {
  x: number;
  y: number;
  z: number;
}

interface QuaternionLike extends VectorLike {
  w: number;
}

interface AttributeLike {
  array?: ArrayLike<number>;
  count?: number;
  itemSize?: number;
}

interface GeometryLike {
  attributes?: Record<string, AttributeLike>;
  index?: AttributeLike | null;
}

interface SceneNodeLike {
  name?: string;
  parent?: SceneNodeLike | null;
  children?: SceneNodeLike[];
  traverse?: (visitor: (node: SceneNodeLike) => void) => void;
  position?: VectorLike;
  quaternion?: QuaternionLike;
  scale?: VectorLike;
  matrix?: { elements?: ArrayLike<number> };
  geometry?: GeometryLike;
  isMesh?: boolean;
  isSprite?: boolean;
  isLine?: boolean;
  isPoints?: boolean;
}

interface AnimationTrackLike {
  name?: string;
}

interface AnimationClipLike {
  name?: string;
  tracks?: AnimationTrackLike[];
}

const ZERO_SCALE_EPSILON = 1e-8;

function isSceneNode(value: unknown): value is SceneNodeLike {
  return typeof value === 'object' && value !== null;
}

function sceneNodes(context: QaContext): SceneNodeLike[] {
  if (!isSceneNode(context.scene)) return [];
  const nodes: SceneNodeLike[] = [];
  const seen = new Set<SceneNodeLike>();
  const add = (node: SceneNodeLike) => {
    if (!seen.has(node)) {
      seen.add(node);
      nodes.push(node);
    }
  };

  if (typeof context.scene.traverse === 'function') {
    context.scene.traverse(add);
    return nodes;
  }

  const pending = [context.scene];
  while (pending.length > 0) {
    const node = pending.shift()!;
    add(node);
    for (const child of node.children ?? []) pending.push(child);
  }
  return nodes;
}

function nodeName(node: SceneNodeLike): string {
  return node.name?.trim() || '(unnamed)';
}

function nodePath(node: SceneNodeLike): string {
  const names: string[] = [];
  const seen = new Set<SceneNodeLike>();
  let cursor: SceneNodeLike | null | undefined = node;
  while (cursor && !seen.has(cursor)) {
    seen.add(cursor);
    names.unshift(nodeName(cursor));
    cursor = cursor.parent;
  }
  return names.join('/');
}

function affectedNode(node: SceneNodeLike, extra: QaAffectedEntity = {}): QaAffectedEntity {
  return { node: nodeName(node), nodePath: nodePath(node), ...extra };
}

function isRenderable(node: SceneNodeLike): boolean {
  // Three.js Sprite has no BufferGeometry in the source scene; Kiln's bridge
  // deterministically materializes it as a two-triangle semantic quad.
  if (node.isSprite) return true;
  if (!(node.isMesh || node.isLine || node.isPoints)) return false;
  const position = node.geometry?.attributes?.position;
  return typeof position?.count === 'number'
    ? position.count > 0
    : Boolean(position?.array?.length);
}

function descendantsContainRenderable(node: SceneNodeLike): boolean {
  const pending = [...(node.children ?? [])];
  while (pending.length > 0) {
    const child = pending.shift()!;
    if (isRenderable(child)) return true;
    pending.push(...(child.children ?? []));
  }
  return false;
}

function finiteComponents(value: VectorLike | QuaternionLike | undefined): boolean {
  if (!value) return true;
  const values = 'w' in value ? [value.x, value.y, value.z, value.w] : [value.x, value.y, value.z];
  return values.every(Number.isFinite);
}

function iterableValues(value: ArrayLike<number> | undefined): number[] {
  if (!value) return [];
  const out: number[] = [];
  for (let i = 0; i < value.length; i++) out.push(value[i]!);
  return out;
}

function emptyOutputFindings(context: QaContext): QaFinding[] {
  const nodes = sceneNodes(context);
  if (nodes.some(isRenderable)) return [];
  return [
    {
      code: 'UNIVERSAL_EMPTY_OUTPUT',
      disposition: 'block',
      dimension: 'exportIntegrity',
      profile: 'universal',
      message: 'The generated scene contains no renderable geometry.',
      measurement: { name: 'renderableNodeCount', actual: 0, expected: 1 },
      repairText: 'Return at least one non-empty renderable mesh or Sprite from build().',
    },
  ];
}

function finiteDataFindings(context: QaContext): QaFinding[] {
  const findings: QaFinding[] = [];
  for (const node of sceneNodes(context)) {
    const badTransform =
      !finiteComponents(node.position) ||
      !finiteComponents(node.quaternion) ||
      !finiteComponents(node.scale) ||
      iterableValues(node.matrix?.elements).some((value) => !Number.isFinite(value));
    if (badTransform) {
      findings.push({
        code: 'UNIVERSAL_NONFINITE_TRANSFORM',
        disposition: 'block',
        dimension: 'exportIntegrity',
        profile: 'universal',
        message: `Node ${JSON.stringify(nodeName(node))} contains a non-finite transform value.`,
        affected: affectedNode(node),
        repairText: 'Replace NaN/Infinity transform components with finite numbers.',
      });
    }

    for (const [attributeName, attribute] of Object.entries(node.geometry?.attributes ?? {})) {
      const values = iterableValues(attribute.array);
      const badIndex = values.findIndex((value) => !Number.isFinite(value));
      if (badIndex >= 0) {
        findings.push({
          code: 'UNIVERSAL_NONFINITE_ATTRIBUTE',
          disposition: 'block',
          dimension: 'exportIntegrity',
          profile: 'universal',
          message: `Geometry attribute ${attributeName} on ${JSON.stringify(nodeName(node))} contains a non-finite value.`,
          affected: affectedNode(node, { attribute: attributeName }),
          measurement: { name: 'arrayIndex', actual: badIndex },
          repairText: `Rebuild the ${attributeName} attribute with finite numeric data.`,
        });
      }
    }
  }
  return findings;
}

function invalidIndexFindings(context: QaContext): QaFinding[] {
  const findings: QaFinding[] = [];
  for (const node of sceneNodes(context)) {
    const index = node.geometry?.index;
    if (!index?.array) continue;
    const vertexCount = node.geometry?.attributes?.position?.count ?? 0;
    const values = iterableValues(index.array);
    const badPosition = values.findIndex(
      (value) => !Number.isInteger(value) || value < 0 || value >= vertexCount,
    );
    if (badPosition >= 0) {
      findings.push({
        code: 'UNIVERSAL_INVALID_INDEX',
        disposition: 'block',
        dimension: 'exportIntegrity',
        profile: 'universal',
        message: `Geometry index on ${JSON.stringify(nodeName(node))} references an invalid vertex.`,
        affected: affectedNode(node, { attribute: 'index' }),
        measurement: {
          name: 'indexValue',
          actual: values[badPosition] ?? null,
          threshold: vertexCount - 1,
        },
        repairText: 'Rebuild the index so every value is an integer within the POSITION accessor.',
      });
    }
  }
  return findings;
}

function zeroScaleFindings(context: QaContext): QaFinding[] {
  const required = new Set(context.intent.requiredParts);
  const findings: QaFinding[] = [];
  for (const node of sceneNodes(context)) {
    const scale = node.scale;
    if (!scale) continue;
    const zeroAxes = (['x', 'y', 'z'] as const).filter(
      (axis) => Number.isFinite(scale[axis]) && Math.abs(scale[axis]) <= ZERO_SCALE_EPSILON,
    );
    if (zeroAxes.length === 0) continue;
    const outputBearing =
      isRenderable(node) || descendantsContainRenderable(node) || required.has(nodeName(node));
    findings.push({
      code: outputBearing
        ? 'UNIVERSAL_ZERO_SCALE_RENDERABLE'
        : 'UNIVERSAL_ZERO_SCALE_ORGANIZATIONAL',
      disposition: outputBearing ? 'block' : 'warn',
      dimension: outputBearing ? 'exportIntegrity' : 'categoryReadiness',
      profile: 'universal',
      message: outputBearing
        ? `Renderable or required node ${JSON.stringify(nodeName(node))} has zero scale.`
        : `Organizational node ${JSON.stringify(nodeName(node))} has zero scale.`,
      affected: affectedNode(node),
      measurement: { name: 'zeroScaleAxes', actual: zeroAxes.join(',') },
      repairText: outputBearing
        ? 'Use a finite non-zero scale for geometry and required semantic nodes.'
        : 'Remove the zero scale unless the organizational node is intentionally disabled.',
    });
  }
  return findings;
}

function clipList(context: QaContext): AnimationClipLike[] {
  return (context.clips ?? []).filter(
    (clip): clip is AnimationClipLike => typeof clip === 'object' && clip !== null,
  );
}

function trackTarget(trackName: string): string | undefined {
  const dot = trackName.indexOf('.');
  if (dot <= 0) return undefined;
  const path = trackName.slice(0, dot);
  const slash = path.lastIndexOf('/');
  return path.slice(slash + 1) || undefined;
}

function requiredTrackTargets(context: QaContext): Set<string> {
  const requested = new Set(context.intent.animation?.clips ?? []);
  const targets = new Set<string>();
  for (const clip of clipList(context)) {
    if (!clip.name || !requested.has(clip.name)) continue;
    for (const track of clip.tracks ?? []) {
      if (track.name) {
        const target = trackTarget(track.name);
        if (target) targets.add(target);
      }
    }
  }
  return targets;
}

function duplicateNameFindings(context: QaContext): QaFinding[] {
  const byName = new Map<string, SceneNodeLike[]>();
  for (const node of sceneNodes(context)) {
    const name = node.name?.trim();
    if (!name) continue;
    const nodes = byName.get(name) ?? [];
    nodes.push(node);
    byName.set(name, nodes);
  }

  const required = new Set([...context.intent.requiredParts, ...requiredTrackTargets(context)]);
  const findings: QaFinding[] = [];
  for (const [name, nodes] of byName) {
    if (nodes.length < 2) continue;
    const contractCritical = required.has(name);
    findings.push({
      code: contractCritical
        ? 'UNIVERSAL_DUPLICATE_REQUIRED_NODE_NAME'
        : 'UNIVERSAL_DUPLICATE_NODE_NAME',
      disposition: contractCritical ? 'block' : 'warn',
      dimension: 'categoryReadiness',
      profile: 'universal',
      message: `${nodes.length} scene nodes share the name ${JSON.stringify(name)}.`,
      affected: { node: name, nodePath: nodes.map(nodePath).join(' | ') },
      measurement: { name: 'duplicateCount', actual: nodes.length, expected: 1 },
      repairText: contractCritical
        ? 'Give every required or animated target a unique name.'
        : 'Use unique names when nodes must be addressed independently.',
    });
  }
  return findings;
}

function animationTargetFindings(context: QaContext): QaFinding[] {
  const animation = context.intent.animation;
  if (!animation || animation.clips.length === 0) return [];
  const nodes = sceneNodes(context);
  const names = new Set(nodes.map((node) => node.name?.trim()).filter(Boolean) as string[]);
  const clips = clipList(context);
  const byName = new Map(clips.map((clip) => [clip.name, clip]));
  const findings: QaFinding[] = [];

  for (const requiredClip of animation.clips) {
    const clip = byName.get(requiredClip);
    if (!clip) {
      findings.push({
        code: 'UNIVERSAL_REQUIRED_CLIP_MISSING',
        disposition: 'block',
        dimension: 'exportIntegrity',
        profile: 'universal',
        message: `Required animation clip ${JSON.stringify(requiredClip)} is missing.`,
        affected: { clip: requiredClip },
        repairText: `Create and return the required ${requiredClip} clip from animate().`,
      });
      continue;
    }
    for (const track of clip.tracks ?? []) {
      const trackName = track.name ?? '';
      const target = trackTarget(trackName);
      if (!target || !names.has(target)) {
        findings.push({
          code: 'UNIVERSAL_REQUIRED_ANIMATION_TARGET_UNRESOLVED',
          disposition: 'block',
          dimension: 'exportIntegrity',
          profile: 'universal',
          message: `Required clip ${JSON.stringify(requiredClip)} has an unresolved track target.`,
          affected: { clip: requiredClip, track: trackName, ...(target ? { node: target } : {}) },
          repairText: 'Rename the track target to exactly match one unique scene node.',
        });
      }
    }
  }
  return findings;
}

export const UNIVERSAL_QA_RULES: readonly QaRule[] = [
  {
    id: 'UNIVERSAL_SCENE_CONTENT_RULE',
    profile: 'universal',
    scope: { kind: 'universal' },
    ruleClass: 'exact',
    owner: KILN_ENGINE_QA_OWNER,
    promotion: conformancePromotionAuthorization(
      'universal-qa-v1',
      'src/qa/universal.test.ts',
      '82c1b26db0a7900141aa44fd40e90fb858e80c51347dc6975ef1691f62730c78',
    ),
    defaultMode: 'enforce',
    evaluate: emptyOutputFindings,
  },
  {
    id: 'UNIVERSAL_FINITE_DATA_RULE',
    profile: 'universal',
    scope: { kind: 'universal' },
    ruleClass: 'exact',
    owner: KILN_ENGINE_QA_OWNER,
    promotion: conformancePromotionAuthorization(
      'universal-qa-v1',
      'src/qa/universal.test.ts',
      '82c1b26db0a7900141aa44fd40e90fb858e80c51347dc6975ef1691f62730c78',
    ),
    defaultMode: 'enforce',
    evaluate: finiteDataFindings,
  },
  {
    id: 'UNIVERSAL_INDEX_RULE',
    profile: 'universal',
    scope: { kind: 'universal' },
    ruleClass: 'exact',
    owner: KILN_ENGINE_QA_OWNER,
    promotion: conformancePromotionAuthorization(
      'universal-qa-v1',
      'src/qa/universal.test.ts',
      '82c1b26db0a7900141aa44fd40e90fb858e80c51347dc6975ef1691f62730c78',
    ),
    defaultMode: 'enforce',
    evaluate: invalidIndexFindings,
  },
  {
    id: 'UNIVERSAL_ZERO_SCALE_RULE',
    profile: 'universal',
    scope: { kind: 'universal' },
    ruleClass: 'exact',
    owner: KILN_ENGINE_QA_OWNER,
    promotion: conformancePromotionAuthorization(
      'universal-qa-v1',
      'src/qa/universal.test.ts',
      '82c1b26db0a7900141aa44fd40e90fb858e80c51347dc6975ef1691f62730c78',
    ),
    defaultMode: 'enforce',
    evaluate: zeroScaleFindings,
  },
  {
    id: 'UNIVERSAL_NODE_NAME_RULE',
    profile: 'universal',
    scope: { kind: 'universal' },
    ruleClass: 'exact',
    owner: KILN_ENGINE_QA_OWNER,
    promotion: conformancePromotionAuthorization(
      'universal-qa-v1',
      'src/qa/universal.test.ts',
      '82c1b26db0a7900141aa44fd40e90fb858e80c51347dc6975ef1691f62730c78',
    ),
    defaultMode: 'enforce',
    evaluate: duplicateNameFindings,
  },
  {
    id: 'UNIVERSAL_ANIMATION_TARGET_RULE',
    profile: 'universal',
    scope: { kind: 'universal' },
    ruleClass: 'exact',
    owner: KILN_ENGINE_QA_OWNER,
    promotion: conformancePromotionAuthorization(
      'universal-qa-v1',
      'src/qa/universal.test.ts',
      '82c1b26db0a7900141aa44fd40e90fb858e80c51347dc6975ef1691f62730c78',
    ),
    defaultMode: 'enforce',
    evaluate: animationTargetFindings,
  },
] as const;

export function createUniversalQaRegistry(): QaRegistry {
  return new QaRegistry(UNIVERSAL_QA_RULES);
}
