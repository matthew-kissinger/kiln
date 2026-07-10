import * as THREE from 'three';

import type { CharacterIntentV1 } from '../contracts';
import type { QaFinding } from '../qa/types';
import { buildCharacterDiagnosticDescriptor, planCharacterDiagnosticRequests } from './character';
import {
  renderDiagnosticView,
  type DiagnosticOverlayRegion,
  type DiagnosticViewRequest,
} from './diagnostic';
import { encodePng } from './png';
import { renderClipAnimation } from './index';
import { stampLabel, type DuckClip } from './pose';

export interface CharacterCapturedDiagnosticV1 {
  id: string;
  label: string;
  cameraId: 'front' | 'right';
  kind: 'skeleton' | 'motion-strip';
  width: number;
  height: number;
  png: Buffer;
  regions: DiagnosticOverlayRegion[];
  clipName?: string;
  phaseFractions?: readonly number[];
}

type Point2 = [number, number];

const rgbFromHex = (value: string): [number, number, number] => {
  const parsed = Number.parseInt(value.replace(/^#/, ''), 16);
  return [(parsed >>> 16) & 255, (parsed >>> 8) & 255, parsed & 255];
};

function drawLine(
  rgb: Uint8Array,
  width: number,
  height: number,
  from: Point2,
  to: Point2,
  color: [number, number, number],
): void {
  let x0 = Math.round(from[0]);
  let y0 = Math.round(from[1]);
  const x1 = Math.round(to[0]);
  const y1 = Math.round(to[1]);
  const dx = Math.abs(x1 - x0);
  const sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0);
  const sy = y0 < y1 ? 1 : -1;
  let error = dx + dy;
  while (true) {
    if (x0 >= 0 && x0 < width && y0 >= 0 && y0 < height) {
      const offset = (y0 * width + x0) * 3;
      rgb[offset] = color[0];
      rgb[offset + 1] = color[1];
      rgb[offset + 2] = color[2];
    }
    if (x0 === x1 && y0 === y1) break;
    const doubled = 2 * error;
    if (doubled >= dy) {
      error += dy;
      x0 += sx;
    }
    if (doubled <= dx) {
      error += dx;
      y0 += sy;
    }
  }
}

function drawCross(
  rgb: Uint8Array,
  width: number,
  height: number,
  point: Point2,
  color: [number, number, number],
  radius = 3,
): void {
  drawLine(rgb, width, height, [point[0] - radius, point[1]], [point[0] + radius, point[1]], color);
  drawLine(rgb, width, height, [point[0], point[1] - radius], [point[0], point[1] + radius], color);
}

function projector(
  root: THREE.Object3D,
  cameraId: 'front' | 'right',
  size: number,
): (assetPoint: readonly [number, number, number]) => Point2 {
  root.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(root);
  if (bounds.isEmpty())
    bounds.set(new THREE.Vector3(-0.5, 0, -0.5), new THREE.Vector3(0.5, 1, 0.5));
  const center = bounds.getCenter(new THREE.Vector3());
  const camera = cameraId === 'front' ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1);
  const upHint = new THREE.Vector3(0, 1, 0);
  const xAxis = new THREE.Vector3().crossVectors(upHint, camera).normalize();
  const yAxis = new THREE.Vector3().crossVectors(camera, xAxis).normalize();
  let extent = 1e-6;
  for (let corner = 0; corner < 8; corner++) {
    const point = new THREE.Vector3(
      corner & 1 ? bounds.max.x : bounds.min.x,
      corner & 2 ? bounds.max.y : bounds.min.y,
      corner & 4 ? bounds.max.z : bounds.min.z,
    ).sub(center);
    extent = Math.max(extent, Math.abs(point.dot(xAxis)), Math.abs(point.dot(yAxis)));
  }
  const scale = (size * 0.45) / extent;
  return (assetPoint) => {
    const world = new THREE.Vector3(...assetPoint).applyMatrix4(root.matrixWorld).sub(center);
    return [size / 2 + world.dot(xAxis) * scale, size / 2 - world.dot(yAxis) * scale];
  };
}

function skeletonCapture(
  root: THREE.Object3D,
  request: ReturnType<typeof planCharacterDiagnosticRequests>[number],
  findings: readonly QaFinding[],
  size: number,
): CharacterCapturedDiagnosticV1 {
  const baseRequest: DiagnosticViewRequest = {
    id: request.id,
    label: request.label,
    cameraId: request.cameraId,
    buffer: 'semantic-overlay',
    scope: 'category',
    variant: 'character-skeleton',
    focusRolePrefixes: request.focusRolePrefixes,
  };
  const frame = renderDiagnosticView(root, baseRequest, { size });
  const descriptor = buildCharacterDiagnosticDescriptor(root, findings);
  const project = projector(root, request.cameraId, size);
  const byRole = new Map(descriptor.joints.map((joint) => [joint.role, joint]));

  for (const edge of descriptor.edges) {
    const parent = byRole.get(edge.parentRole);
    const child = byRole.get(edge.childRole);
    if (!parent || !child) continue;
    drawLine(
      frame.rgb,
      frame.width,
      frame.height,
      project(parent.assetPosition),
      project(child.assetPosition),
      edge.valid ? rgbFromHex(edge.color) : [255, 62, 72],
    );
  }

  for (const joint of descriptor.joints) {
    const point = project(joint.assetPosition);
    const color = rgbFromHex(joint.color);
    drawCross(frame.rgb, frame.width, frame.height, point, joint.contact ? [55, 235, 130] : color);
    drawLine(
      frame.rgb,
      frame.width,
      frame.height,
      point,
      project(joint.forwardAxisEnd),
      [64, 220, 255],
    );
    drawLine(
      frame.rgb,
      frame.width,
      frame.height,
      point,
      project(joint.bendAxisEnd),
      [255, 105, 210],
    );
    stampLabel(
      frame.rgb,
      frame.width,
      frame.height,
      Math.max(0, Math.min(frame.width - 2, Math.round(point[0] + 3))),
      Math.max(0, Math.min(frame.height - 7, Math.round(point[1] - 6))),
      joint.label
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, ' ')
        .slice(0, 18),
      1,
    );
    frame.regions.push({
      nodeName: joint.nodeName,
      nodePath: joint.nodePath,
      semanticRoles: [`joint.${joint.role}`, ...(joint.contact ? ['contact.character'] : [])],
      pixelBounds: [
        Math.max(0, Math.round(point[0]) - 4),
        Math.max(0, Math.round(point[1]) - 4),
        Math.min(frame.width - 1, Math.round(point[0]) + 4),
        Math.min(frame.height - 1, Math.round(point[1]) + 4),
      ],
      color,
      triangleCount: 0,
    });
  }
  const arrow = descriptor.canonicalForwardArrow;
  drawLine(
    frame.rgb,
    frame.width,
    frame.height,
    project(arrow.start),
    project(arrow.end),
    [255, 220, 64],
  );
  frame.regions.sort((a, b) => a.nodePath.localeCompare(b.nodePath));
  return {
    id: frame.id,
    label: frame.label,
    cameraId: request.cameraId,
    kind: 'skeleton',
    width: frame.width,
    height: frame.height,
    png: encodePng(frame.rgb, frame.width, frame.height),
    regions: frame.regions,
  };
}

/** Actual automatic capture path: two labeled skeleton overlays plus front/right
 * fixed-phase strips for resolved locomotion and primary one-shot clips. */
export async function captureCharacterDiagnosticViews(
  root: THREE.Object3D,
  clips: readonly DuckClip[],
  intent: CharacterIntentV1,
  findings: readonly QaFinding[] = [],
  size = 256,
): Promise<CharacterCapturedDiagnosticV1[]> {
  const transforms: Array<{
    node: THREE.Object3D;
    position: THREE.Vector3;
    quaternion: THREE.Quaternion;
    scale: THREE.Vector3;
  }> = [];
  root.traverse((node) => {
    transforms.push({
      node,
      position: node.position.clone(),
      quaternion: node.quaternion.clone(),
      scale: node.scale.clone(),
    });
  });
  const requests = planCharacterDiagnosticRequests(intent);
  const captures: CharacterCapturedDiagnosticV1[] = [];
  try {
    for (const request of requests) {
      if (request.variant === 'character-skeleton') {
        captures.push(skeletonCapture(root, request, findings, size));
        continue;
      }
      if (!request.clipName) continue;
      const strip = await renderClipAnimation(root, clips, {
        clip: request.clipName,
        camera: request.cameraId,
        frames: request.phaseFractions?.length ?? 6,
        size,
      });
      if (!strip.ok || !strip.png || !strip.width || !strip.height) continue;
      captures.push({
        id: request.id,
        label: request.label,
        cameraId: request.cameraId,
        kind: 'motion-strip',
        width: strip.width,
        height: strip.height,
        png: strip.png,
        regions: [],
        clipName: request.clipName,
        phaseFractions: request.phaseFractions,
      });
    }
  } finally {
    for (const saved of transforms) {
      saved.node.position.copy(saved.position);
      saved.node.quaternion.copy(saved.quaternion);
      saved.node.scale.copy(saved.scale);
    }
    root.updateMatrixWorld(true);
  }
  return captures;
}
