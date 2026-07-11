import * as THREE from 'three';

import {
  collectCharacterJointNodes,
  type CharacterJointDescriptorV1,
  type CharacterVector3,
} from '../character';
import type { CharacterIntentV1 } from '../contracts';
import type { QaFinding } from '../qa/types';

const CHAIN_COLORS = Object.freeze([
  '#4fc3f7',
  '#ff8a65',
  '#81c784',
  '#ba68c8',
  '#ffd54f',
  '#4db6ac',
  '#f06292',
  '#90a4ae',
]);
const AXIAL_ROLES = new Set(['root', 'hips', 'spine', 'neck', 'head']);

export interface CharacterDiagnosticJointV1 {
  role: string;
  aliases: string[];
  side: CharacterJointDescriptorV1['side'];
  nodeName: string;
  nodePath: string;
  label: string;
  chainId: string;
  color: string;
  assetPosition: CharacterVector3;
  forwardAxisEnd: CharacterVector3;
  bendAxisEnd: CharacterVector3;
  endEffector: boolean;
  contact: boolean;
}

export interface CharacterDiagnosticEdgeV1 {
  parentRole: string;
  childRole: string;
  parentNodePath?: string;
  childNodePath: string;
  valid: boolean;
  color: string;
}

export interface CharacterDiagnosticDescriptorV1 {
  schemaVersion: 1;
  joints: CharacterDiagnosticJointV1[];
  edges: CharacterDiagnosticEdgeV1[];
  contacts: Array<{ role: string; nodePath: string; assetPosition: CharacterVector3 }>;
  canonicalForwardArrow: { start: CharacterVector3; end: CharacterVector3; label: '+X forward' };
  invalidFindingNodePaths: string[];
}

function rounded(value: number): number {
  const result = Math.round(value * 1e9) / 1e9;
  return Object.is(result, -0) ? 0 : result;
}

function tuple(vector: THREE.Vector3): CharacterVector3 {
  return [rounded(vector.x), rounded(vector.y), rounded(vector.z)];
}

function chainIdFor(
  descriptor: CharacterJointDescriptorV1,
  byRole: ReadonlyMap<string, CharacterJointDescriptorV1>,
): string {
  if (AXIAL_ROLES.has(descriptor.role)) return 'axial';
  let current = descriptor;
  const seen = new Set([current.role]);
  while (current.parentRole && !AXIAL_ROLES.has(current.parentRole)) {
    const parent = byRole.get(current.parentRole);
    if (!parent || seen.has(parent.role)) break;
    seen.add(parent.role);
    current = parent;
  }
  return current.role;
}

function colorFor(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return CHAIN_COLORS[Math.abs(hash) % CHAIN_COLORS.length]!;
}

/**
 * Build the node-addressable overlay payload used by front/right skeleton
 * views. All positions and axes are asset-local, so transformed parents do not
 * rotate the canonical +X evidence frame.
 */
export function buildCharacterDiagnosticDescriptor(
  root: THREE.Object3D,
  findings: readonly QaFinding[] = [],
): CharacterDiagnosticDescriptorV1 {
  root.updateMatrixWorld(true);
  const rootInverse = root.matrixWorld.clone().invert();
  const evidence = collectCharacterJointNodes(root);
  const descriptorByRole = new Map(
    evidence.map((joint) => [joint.descriptor.role, joint.descriptor]),
  );
  const evidenceByRole = new Map(evidence.map((joint) => [joint.descriptor.role, joint]));
  const invalidFindingNodePaths = [
    ...new Set(
      findings
        .filter((finding) => finding.code === 'CHAR_PARENT_EDGE')
        .map((finding) => finding.affected?.nodePath)
        .filter((path): path is string => Boolean(path)),
    ),
  ].sort();
  const invalidPaths = new Set(invalidFindingNodePaths);

  const joints = evidence.map((joint): CharacterDiagnosticJointV1 => {
    const relative = rootInverse.clone().multiply(joint.node.matrixWorld);
    const position = new THREE.Vector3().setFromMatrixPosition(relative);
    const forward = new THREE.Vector3(...joint.descriptor.localForwardAxis)
      .transformDirection(relative)
      .multiplyScalar(0.2)
      .add(position);
    const bend = new THREE.Vector3(...joint.descriptor.localBendAxis)
      .transformDirection(relative)
      .multiplyScalar(0.2)
      .add(position);
    const chainId = chainIdFor(joint.descriptor, descriptorByRole);
    return {
      role: joint.descriptor.role,
      aliases: [...joint.descriptor.aliases],
      side: joint.descriptor.side,
      nodeName: joint.node.name,
      nodePath: joint.nodePath,
      label: joint.descriptor.role,
      chainId,
      color: colorFor(chainId),
      assetPosition: tuple(position),
      forwardAxisEnd: tuple(forward),
      bendAxisEnd: tuple(bend),
      endEffector: joint.descriptor.endEffector,
      contact: joint.descriptor.contact,
    };
  });

  const edges = evidence
    .filter((joint) => joint.descriptor.parentRole)
    .map((joint): CharacterDiagnosticEdgeV1 => {
      const parentRole = joint.descriptor.parentRole!;
      const parent = evidenceByRole.get(parentRole);
      const chainId = chainIdFor(joint.descriptor, descriptorByRole);
      return {
        parentRole,
        childRole: joint.descriptor.role,
        ...(parent ? { parentNodePath: parent.nodePath } : {}),
        childNodePath: joint.nodePath,
        valid: Boolean(parent) && !invalidPaths.has(joint.nodePath),
        color: colorFor(chainId),
      };
    })
    .sort((a, b) =>
      `${a.parentRole}:${a.childRole}`.localeCompare(`${b.parentRole}:${b.childRole}`),
    );

  return {
    schemaVersion: 1,
    joints,
    edges,
    contacts: joints
      .filter((joint) => joint.contact)
      .map((joint) => ({
        role: joint.role,
        nodePath: joint.nodePath,
        assetPosition: joint.assetPosition,
      })),
    canonicalForwardArrow: { start: [0, 0, 0], end: [1, 0, 0], label: '+X forward' },
    invalidFindingNodePaths,
  };
}

export const CHARACTER_MOTION_DIAGNOSTIC_PHASES = Object.freeze([0, 0.2, 0.4, 0.6, 0.8, 1]);

export interface CharacterDiagnosticRequestV1 {
  id: string;
  label: string;
  cameraId: 'front' | 'right';
  buffer: 'semantic-overlay' | 'silhouette-unlit';
  variant: 'character-skeleton' | 'character-motion-strip';
  clipName?: string;
  phaseFractions?: readonly number[];
  focusRolePrefixes: readonly string[];
  automatic: true;
}

const diagnosticRequest = (value: CharacterDiagnosticRequestV1): CharacterDiagnosticRequestV1 =>
  Object.freeze({
    ...value,
    focusRolePrefixes: Object.freeze([...value.focusRolePrefixes]),
    ...(value.phaseFractions ? { phaseFractions: Object.freeze([...value.phaseFractions]) } : {}),
  });

function safeClipId(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Automatically request both skeleton elevations and fixed-phase strips for
 *  the resolved locomotion and primary one-shot action clips. */
export function planCharacterDiagnosticRequests(
  intent: CharacterIntentV1,
): readonly CharacterDiagnosticRequestV1[] {
  const requests: CharacterDiagnosticRequestV1[] = [
    diagnosticRequest({
      id: 'character.skeleton.front',
      label: 'Character skeleton front',
      cameraId: 'front',
      buffer: 'semantic-overlay',
      variant: 'character-skeleton',
      focusRolePrefixes: ['skeleton.', 'joint.', 'contact.'],
      automatic: true,
    }),
    diagnosticRequest({
      id: 'character.skeleton.right',
      label: 'Character skeleton right',
      cameraId: 'right',
      buffer: 'semantic-overlay',
      variant: 'character-skeleton',
      focusRolePrefixes: ['skeleton.', 'joint.', 'contact.'],
      automatic: true,
    }),
  ];
  const locomotion =
    intent.clips.find(
      (clip) =>
        clip.playback === 'loop' &&
        new RegExp(intent.locomotion === 'stationary' ? 'idle' : intent.locomotion, 'i').test(
          clip.name,
        ),
    ) ?? intent.clips.find((clip) => clip.playback === 'loop');
  const action = intent.clips.find((clip) => clip.playback === 'oneShot');
  const selected = [locomotion, action].filter(
    (clip, index, values): clip is NonNullable<typeof clip> =>
      Boolean(clip) && values.findIndex((candidate) => candidate?.name === clip?.name) === index,
  );
  for (const clip of selected) {
    for (const cameraId of ['front', 'right'] as const) {
      requests.push(
        diagnosticRequest({
          id: `character.motion-strip.${cameraId}.${safeClipId(clip.name)}`,
          label: `${clip.name} fixed-phase ${cameraId} strip`,
          cameraId,
          buffer: 'silhouette-unlit',
          variant: 'character-motion-strip',
          clipName: clip.name,
          phaseFractions: CHARACTER_MOTION_DIAGNOSTIC_PHASES,
          focusRolePrefixes: ['skeleton.', 'joint.', 'limb.', 'held-item'],
          automatic: true,
        }),
      );
    }
  }
  return Object.freeze(requests);
}
