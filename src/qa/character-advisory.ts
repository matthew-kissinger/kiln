import * as THREE from 'three';

import {
  collectCharacterJointNodes,
  type CharacterJointDescriptorV1,
  type CharacterJointNodeEvidenceV1,
} from '../character';
import type { AssetIntentV1, CharacterIntentV1 } from '../contracts';
import { KILN_ENGINE_QA_OWNER, type QaRule } from './registry';
import type { QaContext, QaFinding } from './types';

const SKELETON_VIEWS = ['character.skeleton.front', 'character.skeleton.right'];
const MOTION_VIEWS = ['character.motion-strip.front', 'character.motion-strip.right'];
const REST_SYMMETRY_RATIO = 0.08;
const REST_ORDER_RATIO = 0.01;
const FORWARD_ANGLE_DEGREES = 45;
const LATERAL_ENERGY_RATIO = 1.5;
const PHASE_CORRELATION_THRESHOLD = 0.25;
const REVERSE_BEND_DEGREES = 15;
const FOOT_SLIDE_RATIO = 0.05;
const SAMPLE_FRACTIONS = [0, 0.25, 0.5, 0.75, 1] as const;

interface TrackLike {
  name: string;
  times: ArrayLike<number>;
  values: ArrayLike<number>;
  createInterpolant?: () => { evaluate(time: number): ArrayLike<number> };
}

interface ClipLike {
  name: string;
  duration: number;
  tracks: TrackLike[];
}

interface JointPoint {
  evidence: CharacterJointNodeEvidenceV1;
  local: THREE.Vector3;
}

function isClipLike(value: unknown): value is ClipLike {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<ClipLike>;
  return (
    typeof candidate.name === 'string' &&
    typeof candidate.duration === 'number' &&
    Array.isArray(candidate.tracks)
  );
}

function characterIntent(intent: AssetIntentV1): CharacterIntentV1 | undefined {
  return intent.character;
}

function advisory(
  context: QaContext,
  value: Omit<QaFinding, 'profile' | 'dimension' | 'disposition'>,
): QaFinding {
  return {
    ...value,
    disposition: 'warn',
    dimension: 'categoryReadiness',
    profile: context.intent.qaProfile,
  };
}

function rootInverse(root: THREE.Object3D): THREE.Matrix4 {
  root.updateMatrixWorld(true);
  return root.matrixWorld.clone().invert();
}

function jointPoints(root: THREE.Object3D): JointPoint[] {
  const inverse = rootInverse(root);
  return collectCharacterJointNodes(root).map((evidence) => ({
    evidence,
    local: evidence.node.getWorldPosition(new THREE.Vector3()).applyMatrix4(inverse),
  }));
}

function characterScale(points: readonly JointPoint[]): number {
  if (points.length === 0) return 1;
  const bounds = new THREE.Box3();
  for (const point of points) bounds.expandByPoint(point.local);
  const size = bounds.getSize(new THREE.Vector3());
  return Math.max(size.x, size.y, size.z, 1);
}

function pairKey(descriptor: CharacterJointDescriptorV1): string {
  return descriptor.role
    .split(/[._-]/)
    .filter((token) => token !== 'left' && token !== 'right')
    .join('.');
}

function bilateralSymmetryFindings(context: QaContext, root: THREE.Object3D): QaFinding[] {
  const points = jointPoints(root);
  const scale = characterScale(points);
  const threshold = Math.max(0.02, scale * REST_SYMMETRY_RATIO);
  const left = new Map(
    points
      .filter((point) => point.evidence.descriptor.side === 'left')
      .map((point) => [pairKey(point.evidence.descriptor), point] as const),
  );
  const right = new Map(
    points
      .filter((point) => point.evidence.descriptor.side === 'right')
      .map((point) => [pairKey(point.evidence.descriptor), point] as const),
  );
  const findings: QaFinding[] = [];
  for (const key of [...new Set([...left.keys(), ...right.keys()])].sort()) {
    const a = left.get(key);
    const b = right.get(key);
    if (!a || !b) continue;
    const mirrorDelta = Math.hypot(
      a.local.x - b.local.x,
      a.local.y - b.local.y,
      a.local.z + b.local.z,
    );
    const sideSwapped = a.local.z > b.local.z;
    if (!sideSwapped && mirrorDelta <= threshold) continue;
    findings.push(
      advisory(context, {
        code: 'CHAR_REST_BILATERAL_SYMMETRY',
        message:
          `Bilateral rest pair ${a.evidence.descriptor.role} / ${b.evidence.descriptor.role} ` +
          `${sideSwapped ? 'appears left/right swapped' : 'is grossly asymmetric'} ` +
          `(mirror delta ${mirrorDelta.toFixed(6)} m).`,
        affected: {
          node: b.evidence.node.name,
          nodePath: b.evidence.nodePath,
        },
        measurement: {
          name: 'bilateralMirrorDelta',
          actual: mirrorDelta,
          expected: 0,
          threshold,
          unit: 'm',
        },
        viewHints: [...SKELETON_VIEWS],
      }),
    );
  }
  return findings;
}

const BIPED_CHAINS = [
  ['shoulder.left', 'elbow.left', 'wrist.left'],
  ['shoulder.right', 'elbow.right', 'wrist.right'],
  ['hip.left', 'knee.left', 'ankle.left'],
  ['hip.right', 'knee.right', 'ankle.right'],
] as const;

const QUADRUPED_CHAINS = [
  ['shoulder.fore.left', 'elbow.fore.left', 'paw.fore.left'],
  ['shoulder.fore.right', 'elbow.fore.right', 'paw.fore.right'],
  ['hip.hind.left', 'knee.hind.left', 'paw.hind.left'],
  ['hip.hind.right', 'knee.hind.right', 'paw.hind.right'],
] as const;

function restChainFindings(context: QaContext, root: THREE.Object3D): QaFinding[] {
  const trusted = characterIntent(context.intent);
  if (trusted?.bodyPlan !== 'biped' && trusted?.bodyPlan !== 'quadruped') return [];
  const points = jointPoints(root);
  const byRole = new Map(points.map((point) => [point.evidence.descriptor.role, point] as const));
  const scale = characterScale(points);
  const minimumSegment = Math.max(0.01, scale * REST_ORDER_RATIO);
  const chains = trusted.bodyPlan === 'biped' ? BIPED_CHAINS : QUADRUPED_CHAINS;
  const findings: QaFinding[] = [];
  for (const roles of chains) {
    const chain = roles
      .map((role) => byRole.get(role))
      .filter((value): value is JointPoint => !!value);
    if (chain.length !== roles.length) continue;
    for (let index = 1; index < chain.length; index++) {
      const parent = chain[index - 1]!;
      const child = chain[index]!;
      const verticalDrop = parent.local.y - child.local.y;
      if (verticalDrop >= minimumSegment) continue;
      findings.push(
        advisory(context, {
          code: 'CHAR_REST_CHAIN_ORDER',
          message:
            `Rest chain ${roles.join(' -> ')} is vertically inverted or collapsed at ` +
            `${parent.evidence.descriptor.role} -> ${child.evidence.descriptor.role}.`,
          affected: { node: child.evidence.node.name, nodePath: child.evidence.nodePath },
          measurement: {
            name: 'parentToChildVerticalDrop',
            actual: verticalDrop,
            expected: `>=${minimumSegment}`,
            threshold: minimumSegment,
            unit: 'm',
          },
          viewHints: [...SKELETON_VIEWS],
        }),
      );
    }
    const lengths = [
      chain[0]!.local.distanceTo(chain[1]!.local),
      chain[1]!.local.distanceTo(chain[2]!.local),
    ];
    const ratio = Math.max(...lengths) / Math.max(Math.min(...lengths), 1e-9);
    if (Math.min(...lengths) >= minimumSegment && ratio <= 2.5) continue;
    findings.push(
      advisory(context, {
        code: 'CHAR_REST_SEGMENT_LENGTH',
        message: `Rest chain ${roles.join(' -> ')} has collapsed or grossly unmatched segment lengths.`,
        affected: { node: chain[1]!.evidence.node.name, nodePath: chain[1]!.evidence.nodePath },
        measurement: {
          name: 'chainSegmentLengthRatio',
          actual: ratio,
          expected: '<=2.5',
          threshold: 2.5,
        },
        viewHints: [...SKELETON_VIEWS],
      }),
    );
  }
  return findings;
}

function forwardMarkerFindings(context: QaContext, root: THREE.Object3D): QaFinding[] {
  root.updateMatrixWorld(true);
  const expected = new THREE.Vector3(1, 0, 0).transformDirection(root.matrixWorld);
  const markers = collectCharacterJointNodes(root).filter((joint) =>
    /(?:^|[._-])(?:toe|muzzle|head)(?:$|[._-])/i.test(joint.descriptor.role),
  );
  return markers.flatMap((marker) => {
    const quaternion = marker.node.getWorldQuaternion(new THREE.Quaternion());
    const actual = new THREE.Vector3(...marker.descriptor.localForwardAxis)
      .applyQuaternion(quaternion)
      .normalize();
    const angle = THREE.MathUtils.radToDeg(
      Math.acos(THREE.MathUtils.clamp(actual.dot(expected), -1, 1)),
    );
    if (angle <= FORWARD_ANGLE_DEGREES) return [];
    return [
      advisory(context, {
        code: 'CHAR_FORWARD_MARKER',
        message:
          `Declared forward marker ${marker.descriptor.role} differs from canonical +X by ` +
          `${angle.toFixed(3)} degrees.`,
        affected: { node: marker.node.name, nodePath: marker.nodePath },
        measurement: {
          name: 'forwardMarkerAngle',
          actual: angle,
          expected: 0,
          threshold: FORWARD_ANGLE_DEGREES,
          unit: 'degrees',
        },
        viewHints: [...SKELETON_VIEWS],
      }),
    ];
  });
}

function trackTarget(trackName: string): string | undefined {
  const dot = trackName.lastIndexOf('.');
  return dot > 0 ? trackName.slice(0, dot) : undefined;
}

function trackProperty(trackName: string): string | undefined {
  const dot = trackName.lastIndexOf('.');
  return dot > 0 ? trackName.slice(dot + 1) : undefined;
}

function applyTrack(root: THREE.Object3D, track: TrackLike, time: number): void {
  const target = trackTarget(track.name);
  const property = trackProperty(track.name);
  const node = target ? root.getObjectByName(target) : undefined;
  if (!node || !property || !track.createInterpolant) return;
  const value = track.createInterpolant().evaluate(time);
  if (property === 'position') node.position.fromArray(value);
  else if (property === 'scale') node.scale.fromArray(value);
  else if (property === 'quaternion') node.quaternion.fromArray(value).normalize();
}

interface MotionSample {
  fraction: number;
  byRole: Map<string, { point: THREE.Vector3; evidence: CharacterJointNodeEvidenceV1 }>;
}

function sampleClip(root: THREE.Object3D, clip: ClipLike): MotionSample[] {
  const inverse = rootInverse(root);
  return SAMPLE_FRACTIONS.map((fraction) => {
    const clone = root.clone(true);
    for (const track of clip.tracks) applyTrack(clone, track, fraction * clip.duration);
    clone.updateMatrixWorld(true);
    return {
      fraction,
      byRole: new Map(
        collectCharacterJointNodes(clone).map((evidence) => [
          evidence.descriptor.role,
          {
            point: evidence.node.getWorldPosition(new THREE.Vector3()).applyMatrix4(inverse),
            evidence,
          },
        ]),
      ),
    };
  });
}

function locomotionClips(context: QaContext): ClipLike[] {
  const trusted = characterIntent(context.intent);
  if (!trusted || trusted.locomotion === 'stationary') return [];
  const names = new Set(
    trusted.clips.filter((clip) => clip.playback === 'loop').map((clip) => clip.name),
  );
  return (context.clips ?? [])
    .filter(isClipLike)
    .filter((clip) => names.size === 0 || names.has(clip.name));
}

function limbRole(role: string): boolean {
  return /(?:shoulder|elbow|wrist|hip|knee|ankle|paw|toe|wing)/i.test(role);
}

function lateralEnergyFindings(
  context: QaContext,
  root: THREE.Object3D,
  clips: readonly ClipLike[],
): QaFinding[] {
  const rest = jointPoints(root);
  const scale = characterScale(rest);
  const minimumEnergy = scale * scale * 1e-4;
  const findings: QaFinding[] = [];
  for (const clip of clips) {
    const samples = sampleClip(root, clip);
    const roles = [...samples[0]!.byRole.keys()].filter(limbRole).sort();
    for (const role of roles) {
      let sagittal = 0;
      let lateral = 0;
      let maximumLateral = 0;
      let maximumFraction = 0;
      for (let index = 1; index < samples.length; index++) {
        const before = samples[index - 1]!.byRole.get(role)?.point;
        const after = samples[index]!.byRole.get(role)?.point;
        if (!before || !after) continue;
        const delta = after.clone().sub(before);
        sagittal += delta.x * delta.x + delta.y * delta.y;
        lateral += delta.z * delta.z;
        if (Math.abs(delta.z) > maximumLateral) {
          maximumLateral = Math.abs(delta.z);
          maximumFraction = samples[index]!.fraction;
        }
      }
      if (lateral + sagittal < minimumEnergy || lateral <= sagittal * LATERAL_ENERGY_RATIO)
        continue;
      const evidence = samples[0]!.byRole.get(role)!.evidence;
      findings.push(
        advisory(context, {
          code: 'CHAR_GAIT_LATERAL_ENERGY',
          message:
            `Locomotion chain ${role} in ${clip.name} is lateral-motion dominant; ` +
            `largest offending step ends at phase ${maximumFraction}.`,
          affected: { node: evidence.node.name, nodePath: evidence.nodePath, clip: clip.name },
          measurement: {
            name: 'lateralToSagittalEnergy',
            actual: lateral / Math.max(sagittal, minimumEnergy),
            expected: `<=${LATERAL_ENERGY_RATIO}`,
            threshold: LATERAL_ENERGY_RATIO,
          },
          viewHints: [...MOTION_VIEWS],
        }),
      );
    }
  }
  return findings;
}

function correlation(a: readonly number[], b: readonly number[]): number | undefined {
  if (a.length !== b.length || a.length < 3) return undefined;
  const meanA = a.reduce((sum, value) => sum + value, 0) / a.length;
  const meanB = b.reduce((sum, value) => sum + value, 0) / b.length;
  let numerator = 0;
  let varianceA = 0;
  let varianceB = 0;
  for (let index = 0; index < a.length; index++) {
    const da = a[index]! - meanA;
    const db = b[index]! - meanB;
    numerator += da * db;
    varianceA += da * da;
    varianceB += db * db;
  }
  const denominator = Math.sqrt(varianceA * varianceB);
  return denominator > 1e-9 ? numerator / denominator : undefined;
}

function phaseOppositionFindings(
  context: QaContext,
  root: THREE.Object3D,
  clips: readonly ClipLike[],
): QaFinding[] {
  const trusted = characterIntent(context.intent);
  if (trusted?.bodyPlan !== 'biped' || !/(?:walk|run)/i.test(trusted.locomotion)) return [];
  const findings: QaFinding[] = [];
  for (const clip of clips) {
    const samples = sampleClip(root, clip);
    const left = samples.map((sample) => sample.byRole.get('ankle.left')?.point.x);
    const right = samples.map((sample) => sample.byRole.get('ankle.right')?.point.x);
    if (left.some((value) => value === undefined) || right.some((value) => value === undefined)) {
      continue;
    }
    const phaseCorrelation = correlation(left as number[], right as number[]);
    if (phaseCorrelation === undefined || phaseCorrelation <= PHASE_CORRELATION_THRESHOLD) continue;
    const evidence = samples[0]!.byRole.get('ankle.right')!.evidence;
    findings.push(
      advisory(context, {
        code: 'CHAR_GAIT_SAME_PHASE',
        message:
          `Biped ${clip.name} drives left and right legs in the same phase ` +
          `(correlation ${phaseCorrelation.toFixed(6)}).`,
        affected: { node: evidence.node.name, nodePath: evidence.nodePath, clip: clip.name },
        measurement: {
          name: 'leftRightLegPhaseCorrelation',
          actual: phaseCorrelation,
          expected: '<=0.25',
          threshold: PHASE_CORRELATION_THRESHOLD,
        },
        viewHints: [...MOTION_VIEWS],
      }),
    );
  }
  return findings;
}

function signedBendDegrees(
  descriptor: CharacterJointDescriptorV1,
  quaternion: THREE.Quaternion,
): number {
  const rest = new THREE.Quaternion(...descriptor.rest.rotation);
  const delta = rest.invert().multiply(quaternion).normalize();
  const axis = new THREE.Vector3(delta.x, delta.y, delta.z);
  const signedMagnitude = axis.dot(new THREE.Vector3(...descriptor.localBendAxis));
  const angle = 2 * Math.atan2(signedMagnitude, delta.w);
  return THREE.MathUtils.radToDeg(
    THREE.MathUtils.euclideanModulo(angle + Math.PI, Math.PI * 2) - Math.PI,
  );
}

function bendDirectionFindings(
  context: QaContext,
  root: THREE.Object3D,
  clips: readonly ClipLike[],
): QaFinding[] {
  const joints = collectCharacterJointNodes(root).filter((joint) =>
    /(?:^|[._-])(?:knee|elbow)(?:$|[._-])/i.test(joint.descriptor.role),
  );
  const findings: QaFinding[] = [];
  for (const clip of clips) {
    for (const joint of joints) {
      const track = clip.tracks.find(
        (candidate) =>
          trackTarget(candidate.name) === joint.node.name &&
          trackProperty(candidate.name) === 'quaternion' &&
          candidate.createInterpolant,
      );
      if (!track?.createInterpolant) continue;
      let maximum = 0;
      let maximumFraction = 0;
      for (const fraction of SAMPLE_FRACTIONS) {
        const value = track.createInterpolant().evaluate(fraction * clip.duration);
        const bend = signedBendDegrees(
          joint.descriptor,
          new THREE.Quaternion().fromArray(value).normalize(),
        );
        if (Math.abs(bend) > Math.abs(maximum)) {
          maximum = bend;
          maximumFraction = fraction;
        }
      }
      if (maximum >= -REVERSE_BEND_DEGREES) continue;
      findings.push(
        advisory(context, {
          code: 'CHAR_JOINT_REVERSE_BEND',
          message:
            `${joint.descriptor.role} bends opposite its declared local bend axis at ` +
            `${clip.name} phase ${maximumFraction}.`,
          affected: {
            node: joint.node.name,
            nodePath: joint.nodePath,
            clip: clip.name,
            track: track.name,
          },
          measurement: {
            name: 'signedMaximumFlexion',
            actual: maximum,
            expected: `>=-${REVERSE_BEND_DEGREES}`,
            threshold: REVERSE_BEND_DEGREES,
            unit: 'degrees',
          },
          viewHints: [...MOTION_VIEWS],
        }),
      );
    }
  }
  return findings;
}

function footSlideFindings(
  context: QaContext,
  root: THREE.Object3D,
  clips: readonly ClipLike[],
): QaFinding[] {
  const trusted = characterIntent(context.intent);
  if (!trusted?.grounded) return [];
  const rest = jointPoints(root);
  const threshold = Math.max(0.02, characterScale(rest) * FOOT_SLIDE_RATIO);
  const contactTolerance = Math.max(0.02, threshold * 0.4);
  const contacts = rest
    .filter((point) => point.evidence.descriptor.contact)
    .map((point) => point.evidence.descriptor.role);
  const findings: QaFinding[] = [];
  for (const clip of clips) {
    const samples = sampleClip(root, clip);
    for (const role of contacts) {
      let anchor: THREE.Vector3 | undefined;
      let maximum = 0;
      let maximumFraction = 0;
      for (const sample of samples) {
        const entry = sample.byRole.get(role);
        if (!entry || entry.point.y > contactTolerance) {
          anchor = undefined;
          continue;
        }
        anchor ??= entry.point.clone();
        const slide = Math.hypot(entry.point.x - anchor.x, entry.point.z - anchor.z);
        if (slide > maximum) {
          maximum = slide;
          maximumFraction = sample.fraction;
        }
      }
      if (maximum <= threshold) continue;
      const evidence = samples[0]!.byRole.get(role)?.evidence;
      findings.push(
        advisory(context, {
          code: 'CHAR_FOOT_SLIDE',
          message:
            `Planted contact ${role} slides ${maximum.toFixed(6)} m horizontally in ` +
            `${clip.name} by phase ${maximumFraction}.`,
          affected: {
            node: evidence?.node.name ?? role,
            ...(evidence ? { nodePath: evidence.nodePath } : {}),
            clip: clip.name,
          },
          measurement: {
            name: 'plantedContactHorizontalSlide',
            actual: maximum,
            expected: 0,
            threshold,
            unit: 'm',
          },
          viewHints: [...MOTION_VIEWS, 'generic.front.depth-contact'],
        }),
      );
    }
  }
  return findings;
}

/** W6 anatomy and motion measurements. Every result remains heuristic and nonblocking. */
export function evaluateCharacterAdvisoryQa(context: QaContext): QaFinding[] {
  if (context.intent.category !== 'character' || !(context.scene instanceof THREE.Object3D)) {
    return [];
  }
  const root = context.scene;
  const clips = locomotionClips(context);
  return [
    ...bilateralSymmetryFindings(context, root),
    ...restChainFindings(context, root),
    ...forwardMarkerFindings(context, root),
    ...lateralEnergyFindings(context, root, clips),
    ...phaseOppositionFindings(context, root, clips),
    ...bendDirectionFindings(context, root, clips),
    ...footSlideFindings(context, root, clips),
  ].sort((a, b) =>
    `${a.code}:${a.affected?.nodePath ?? ''}:${a.affected?.clip ?? ''}`.localeCompare(
      `${b.code}:${b.affected?.nodePath ?? ''}:${b.affected?.clip ?? ''}`,
    ),
  );
}

export const CHARACTER_ADVISORY_QA_RULE: QaRule = Object.freeze({
  id: 'CHARACTER_ADVISORY_PROFILE',
  profile: 'character.advisory',
  scope: { kind: 'category' as const, category: 'character' as const },
  ruleClass: 'heuristic',
  owner: KILN_ENGINE_QA_OWNER,
  defaultMode: 'observe',
  evaluate: evaluateCharacterAdvisoryQa,
});
