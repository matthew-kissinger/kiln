/** Common access to an authored subtree, and explicit hierarchy replication.
 * Descriptions are snapshots. References to nodes/resources remain live; replication
 * always revalidates the current subtree rather than trusting an earlier snapshot. */
import * as THREE from 'three';
import { checkedTrs } from './assembly-transform';
import {
  KILN_SEMANTIC_EXTRAS_KEY,
  readSemanticMetadataV1,
  stampSemanticMetadataV1,
  hasSemanticRole,
  KILN_SEMANTIC_ROLES,
  type SemanticLocalFrameV1,
  type SemanticMetadataV1,
  type SemanticSocketV1,
} from './contracts/semantic';
import {
  KILN_CHARACTER_JOINT_EXTRAS_KEY,
  KILN_CHARACTER_RIG_EXTRAS_KEY,
  readCharacterJointDescriptorV1,
  readCharacterRigGraphV1,
  validateCharacterJointDescriptorV1,
  validateCharacterRigGraphV1,
  type CharacterJointDescriptorV1,
  type CharacterRigGraphV1,
} from './character';
import { createClip } from './primitives';

export const ASSEMBLY_LIMITS = Object.freeze({ nodes: 10_000, positionSamples: 2_000_000 });
type Triple = [number, number, number];
export interface AssemblyBounds {
  space: 'root-local';
  /** AABB of position-buffer samples, including unused vertices. No deformation/displacement evidence. */
  min: Triple;
  max: Triple;
  size: Triple;
}
export interface AssemblyFrame {
  node: THREE.Object3D;
  nodeId: string;
  frame: SemanticLocalFrameV1;
  /** Snapshot of the frame's affine matrix in assembly-root coordinates; may include inherited scale/shear. */
  matrix: readonly number[];
}
export interface AssemblySocket {
  node: THREE.Object3D;
  nodeId: string;
  socket: SemanticSocketV1;
}
export interface AssemblyMaterialBinding {
  node: THREE.Mesh;
  nodeId: string;
  index: number;
  material: THREE.Material;
}
export interface AssemblyJoint {
  node: THREE.Object3D;
  /** Snapshot ID distinguishes nodes with duplicate or empty names. */
  nodeId: string;
  kinds: readonly ('articulated' | 'wheel-spin' | 'steering')[];
  roles: readonly string[];
  /** Validated, detached metadata when the joint has an articulated descriptor. */
  descriptor?: CharacterJointDescriptorV1;
}
export interface AssemblyOwnership {
  hierarchy: 'borrowed' | 'owned';
  geometry: 'borrowed' | 'shared' | 'owned';
  materials: 'borrowed' | 'shared' | 'owned';
  textures: 'borrowed' | 'shared';
  clips: 'borrowed' | 'owned';
}
export interface AssemblyView {
  version: 'kiln.assembly.v1';
  root: THREE.Object3D;
  /** Preorder snapshot. Local node IDs are n0, n1, ...; describe again after hierarchy edits. */
  nodes: readonly THREE.Object3D[];
  roles: ReadonlyMap<string, readonly THREE.Object3D[]>;
  frames: readonly AssemblyFrame[];
  sockets: readonly AssemblySocket[];
  /** Semantic joints only. getJointNames remains the separate Joint_ prefix query. */
  joints: readonly AssemblyJoint[];
  materials: readonly AssemblyMaterialBinding[];
  bounds: AssemblyBounds | null;
  clips: readonly THREE.AnimationClip[];
  ownership: AssemblyOwnership;
}
export interface DescribeAssemblyOptions {
  /** Additional clips. Clips attached to any subtree node are included, never silently dropped. */
  clips?: readonly THREE.AnimationClip[];
}
export interface ReplicateAssemblyOptions {
  /** Explicit lowercase namespace; never guessed or randomly selected. */
  namespace: string;
  parent?: THREE.Object3D;
  /** local (default) keeps root-local TRS. world reparents only when the resulting local matrix is lossless TRS. */
  space?: 'local' | 'world';
  geometry?: 'share' | 'copy';
  materials?: 'share' | 'copy';
  /** preserve retains unresolved strings and reports them. The caller owns their external meaning/binding. */
  externalReferences?: 'reject' | 'preserve';
  /** Opaque JSON is not presumed reference-safe; no identity remapping is attempted inside it. */
  unknownMetadata?: 'reject' | 'copy-json';
}
export interface AssemblyExternalReference {
  kind: 'semantic' | 'animation' | 'character-parent';
  source: string;
  target: string;
  targetType: string;
}
export interface AssemblyReplica extends AssemblyView {
  nodeMap: ReadonlyMap<THREE.Object3D, THREE.Object3D>;
  /** Duplicate original names retain all corresponding names; no arbitrary first match. */
  nameMap: ReadonlyMap<string, readonly string[]>;
  jointRoleMap: ReadonlyMap<string, string>;
  clipMap: ReadonlyMap<THREE.AnimationClip, THREE.AnimationClip>;
  externalReferences: readonly AssemblyExternalReference[];
}

const metadataKeys = new Set<string>([
  KILN_SEMANTIC_EXTRAS_KEY,
  KILN_CHARACTER_JOINT_EXTRAS_KEY,
  KILN_CHARACTER_RIG_EXTRAS_KEY,
]);
const threeConstructors: ReadonlySet<unknown> = new Set(Object.values(THREE));
const object = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

function jsonData(value: unknown, label: string, ancestors = new Set<object>()): void {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number' && Number.isFinite(value)) return;
  if (typeof value !== 'object' || value === null)
    throw new Error(`${label}: metadata must be inert finite JSON data.`);
  if (ancestors.has(value)) throw new Error(`${label}: cyclic metadata is unsupported.`);
  if (
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) !== Object.prototype &&
    Object.getPrototypeOf(value) !== null
  )
    throw new Error(`${label}: non-JSON metadata object is unsupported.`);
  if (Object.getOwnPropertySymbols(value).length)
    throw new Error(`${label}: symbol metadata is unsupported.`);
  ancestors.add(value);
  for (const key of Object.getOwnPropertyNames(value)) {
    if (Array.isArray(value) && key === 'length') continue;
    const property = Object.getOwnPropertyDescriptor(value, key)!;
    if (!('value' in property)) throw new Error(`${label}: metadata getters are unsupported.`);
    if (!property.enumerable) throw new Error(`${label}: non-enumerable metadata is unsupported.`);
    jsonData(property.value, label, ancestors);
  }
  if (Array.isArray(value)) {
    const keys = Object.keys(value);
    if (keys.length !== value.length || keys.some((key, index) => key !== String(index)))
      throw new Error(`${label}: sparse or extended metadata arrays are unsupported.`);
  }
  ancestors.delete(value);
}

function canonicalJson(value: unknown): string {
  const sort = (entry: unknown): unknown => {
    if (Array.isArray(entry)) return entry.map(sort);
    if (object(entry))
      return Object.fromEntries(
        Object.keys(entry)
          .sort()
          .map((key) => [key, sort(entry[key])]),
      );
    return entry;
  };
  return JSON.stringify(sort(value));
}

function knownMetadata(source: unknown, parsed: unknown, label: string): void {
  if (canonicalJson(source) !== canonicalJson(parsed))
    throw new Error(
      `${label}: unsupported fields in known metadata would be lost during remapping.`,
    );
}

function localMatrix(node: THREE.Object3D): THREE.Matrix4 {
  return node.matrixAutoUpdate
    ? new THREE.Matrix4().compose(node.position, node.quaternion, node.scale)
    : node.matrix.clone();
}
function worldMatrix(node: THREE.Object3D): THREE.Matrix4 {
  const chain: THREE.Object3D[] = [],
    seen = new Set<THREE.Object3D>();
  for (let cursor: THREE.Object3D | null = node; cursor; cursor = cursor.parent) {
    if (seen.has(cursor)) throw new Error('Assembly ancestor hierarchy contains a cycle.');
    seen.add(cursor);
    chain.push(cursor);
  }
  const result = new THREE.Matrix4();
  for (const entry of chain.reverse()) result.multiply(localMatrix(entry));
  return result;
}
function addIndex<T>(map: Map<string, T[]>, key: string, value: T): void {
  map.set(key, [...(map.get(key) ?? []), value]);
}
interface Census {
  nodes: THREE.Object3D[];
  matrices: Map<THREE.Object3D, THREE.Matrix4>;
  semantics: Map<THREE.Object3D, SemanticMetadataV1>;
  joints: Map<THREE.Object3D, CharacterJointDescriptorV1>;
  rigs: Map<THREE.Object3D, CharacterRigGraphV1>;
}
function census(root: THREE.Object3D): Census {
  const nodes: THREE.Object3D[] = [],
    matrices = new Map<THREE.Object3D, THREE.Matrix4>();
  const semantics = new Map<THREE.Object3D, SemanticMetadataV1>();
  const joints = new Map<THREE.Object3D, CharacterJointDescriptorV1>();
  const rigs = new Map<THREE.Object3D, CharacterRigGraphV1>();
  const stack = [root];
  while (stack.length) {
    const node = stack.pop()!;
    if (
      !(node instanceof THREE.Object3D) ||
      ![THREE.Object3D, THREE.Group, THREE.Mesh].includes(node.constructor as typeof THREE.Object3D)
    )
      throw new Error(
        'Unsupported assembly node: only ordinary Object3D, Group and Mesh hierarchies are qualified; no skins, instances or custom node classes.',
      );
    if (matrices.has(node))
      throw new Error('Assembly must be a tree; duplicate/cyclic children are unsupported.');
    if (nodes.length >= ASSEMBLY_LIMITS.nodes)
      throw new Error(`Assembly node limit exceeded (${ASSEMBLY_LIMITS.nodes}).`);
    if (typeof node.name !== 'string') throw new Error('Assembly node names must be strings.');
    if (!node.matrixWorldAutoUpdate)
      throw new Error(
        'Assembly nodes with externally managed matrixWorldAutoUpdate=false world matrices are unsupported.',
      );
    if (node.matrixAutoUpdate && Math.abs(node.quaternion.lengthSq() - 1) > 1e-6)
      throw new Error('Assembly source quaternion must be unit length.');
    const matrix = localMatrix(node);
    checkedTrs(matrix, node.name || 'unnamed node');
    nodes.push(node);
    matrices.set(node, matrix);
    if (
      node.onBeforeRender !== THREE.Object3D.prototype.onBeforeRender ||
      node.onAfterRender !== THREE.Object3D.prototype.onAfterRender ||
      node.onBeforeShadow !== THREE.Object3D.prototype.onBeforeShadow ||
      node.onAfterShadow !== THREE.Object3D.prototype.onAfterShadow
    )
      throw new Error('Custom node render callbacks are unsupported in assembly replication.');
    if (node instanceof THREE.Mesh) {
      if (
        !(node.geometry instanceof THREE.BufferGeometry) ||
        node.geometry instanceof THREE.InstancedBufferGeometry
      )
        throw new Error('Unsupported assembly geometry type.');
      if (
        Object.values(node.geometry.morphAttributes).some((attributes) => attributes?.length) ||
        node.morphTargetInfluences?.length
      )
        throw new Error('Assembly morph target replication is unsupported.');
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      if (
        materials.length === 0 ||
        materials.some((material) => !(material instanceof THREE.Material))
      )
        throw new Error('Assembly mesh materials must be Material instances.');
    }
    if (!object(node.userData)) throw new Error('Assembly node metadata must be an object.');
    jsonData(node.userData, node.name);
    if (
      !Array.isArray(node.animations) ||
      node.animations.some((clip) => !(clip instanceof THREE.AnimationClip))
    )
      throw new Error('Assembly node animations must contain AnimationClip instances.');
    if (node.userData[KILN_SEMANTIC_EXTRAS_KEY] !== undefined) {
      const metadata = readSemanticMetadataV1(node);
      if (!metadata) throw new Error(`Invalid semantic metadata on ${node.name}.`);
      knownMetadata(node.userData[KILN_SEMANTIC_EXTRAS_KEY], metadata, node.name);
      semantics.set(node, metadata);
    }
    if (node.userData[KILN_CHARACTER_JOINT_EXTRAS_KEY] !== undefined) {
      const descriptor = readCharacterJointDescriptorV1(node);
      if (!descriptor) throw new Error(`Invalid character joint metadata on ${node.name}.`);
      knownMetadata(node.userData[KILN_CHARACTER_JOINT_EXTRAS_KEY], descriptor, node.name);
      joints.set(node, descriptor);
    }
    if (node.userData[KILN_CHARACTER_RIG_EXTRAS_KEY] !== undefined) {
      const graph = readCharacterRigGraphV1(node);
      if (!graph) throw new Error(`Invalid character rig metadata on ${node.name}.`);
      knownMetadata(node.userData[KILN_CHARACTER_RIG_EXTRAS_KEY], graph, node.name);
      rigs.set(node, graph);
    }
    for (const child of [...node.children].reverse()) {
      if (child.parent !== node) throw new Error('Assembly child/parent links disagree.');
      stack.push(child);
    }
  }
  return { nodes, matrices, semantics, joints, rigs };
}

/** Return a nonmutating snapshot. Bounds exclude the root's own transform and all ancestors. */
export function describeAssembly(
  root: THREE.Object3D,
  options: DescribeAssemblyOptions = {},
): AssemblyView {
  if (!object(options)) throw new Error('Assembly description options must be an object.');
  if (Object.keys(options).some((key) => key !== 'clips'))
    throw new Error('Unknown describeAssembly option.');
  if (options.clips !== undefined && !Array.isArray(options.clips))
    throw new Error('Assembly clips must be an array.');
  const state = census(root),
    roles = new Map<string, THREE.Object3D[]>();
  const frames: AssemblyFrame[] = [],
    sockets: AssemblySocket[] = [],
    joints: AssemblyJoint[] = [],
    materials: AssemblyMaterialBinding[] = [];
  const relative = new Map<THREE.Object3D, THREE.Matrix4>();
  const bounds = new THREE.Box3(),
    point = new THREE.Vector3();
  let positionSamples = 0;
  for (const [index, node] of state.nodes.entries()) {
    const nodeId = `n${index}`;
    const matrix =
      node === root
        ? new THREE.Matrix4()
        : relative.get(node.parent!)!.clone().multiply(state.matrices.get(node)!);
    relative.set(node, matrix);
    const metadata = state.semantics.get(node);
    const descriptor = state.joints.get(node);
    const kinds: Array<AssemblyJoint['kinds'][number]> = [];
    if (descriptor) kinds.push('articulated');
    if (hasSemanticRole(metadata?.roles ?? [], KILN_SEMANTIC_ROLES.wheelPivot))
      kinds.push('wheel-spin');
    if (hasSemanticRole(metadata?.roles ?? [], KILN_SEMANTIC_ROLES.steeringPivot))
      kinds.push('steering');
    if (kinds.length)
      joints.push({
        node,
        nodeId,
        kinds,
        roles: [...(metadata?.roles ?? [])],
        ...(descriptor ? { descriptor: structuredClone(descriptor) } : {}),
      });
    for (const role of metadata?.roles ?? []) addIndex(roles, role, node);
    for (const frame of metadata?.frames ?? []) {
      const local = new THREE.Matrix4().compose(
        new THREE.Vector3(...frame.translation),
        new THREE.Quaternion(...frame.rotation),
        new THREE.Vector3(1, 1, 1),
      );
      frames.push({
        node,
        nodeId,
        frame: structuredClone(frame),
        matrix: matrix.clone().multiply(local).toArray(),
      });
    }
    for (const socket of metadata?.sockets ?? [])
      sockets.push({ node, nodeId, socket: structuredClone(socket) });
    if (!(node instanceof THREE.Mesh)) continue;
    for (const [materialIndex, material] of (Array.isArray(node.material)
      ? node.material
      : [node.material]
    ).entries())
      materials.push({ node, nodeId, index: materialIndex, material });
    const positions = node.geometry.getAttribute('position');
    if (!positions) continue;
    if (positions.itemSize !== 3)
      throw new Error('Assembly position attributes must contain triples.');
    positionSamples += positions.count;
    if (positionSamples > ASSEMBLY_LIMITS.positionSamples)
      throw new Error(
        `Assembly position-sample limit exceeded (${ASSEMBLY_LIMITS.positionSamples}).`,
      );
    for (let i = 0; i < positions.count; i++) {
      point.fromBufferAttribute(positions, i).applyMatrix4(matrix);
      if (![point.x, point.y, point.z].every(Number.isFinite))
        throw new Error('Assembly bounds require finite transformed positions.');
      bounds.expandByPoint(point);
    }
  }
  const clips = [
    ...new Set([...state.nodes.flatMap((node) => node.animations), ...(options.clips ?? [])]),
  ];
  return {
    version: 'kiln.assembly.v1',
    root,
    nodes: state.nodes,
    roles,
    frames,
    sockets,
    joints,
    materials,
    bounds: bounds.isEmpty()
      ? null
      : {
          space: 'root-local',
          min: bounds.min.toArray(),
          max: bounds.max.toArray(),
          size: bounds.getSize(new THREE.Vector3()).toArray(),
        },
    clips,
    ownership: {
      hierarchy: 'borrowed',
      geometry: 'borrowed',
      materials: 'borrowed',
      textures: 'borrowed',
      clips: 'borrowed',
    },
  };
}

/** Replicate supported subtrees atomically. Sharing/copying concerns resources, never hierarchy.
 * Metadata classification roles stay meaningful; resolved internal relationship targets become
 * concrete replica identities. Unknown JSON strings are not interpreted as references. */
export function replicateAssembly(
  source: AssemblyView,
  options: ReplicateAssemblyOptions,
): AssemblyReplica {
  if (source?.version !== 'kiln.assembly.v1')
    throw new Error('replicateAssembly requires a describeAssembly result.');
  if (
    !object(options) ||
    typeof options.namespace !== 'string' ||
    options.namespace.length > 64 ||
    !/^[a-z][a-z0-9]*(?:[_-][a-z0-9]+)*$/.test(options.namespace)
  )
    throw new Error(
      'Assembly namespace must be 1-64 lowercase letters/digits with single internal underscores or hyphens, starting with a letter.',
    );
  const allowedOptions = new Set([
    'namespace',
    'parent',
    'space',
    'geometry',
    'materials',
    'externalReferences',
    'unknownMetadata',
  ]);
  if (Object.keys(options).some((key) => !allowedOptions.has(key)))
    throw new Error('Unknown replicateAssembly option/policy.');
  for (const [key, choices] of Object.entries({
    space: ['local', 'world'],
    geometry: ['share', 'copy'],
    materials: ['share', 'copy'],
    externalReferences: ['reject', 'preserve'],
    unknownMetadata: ['reject', 'copy-json'],
  })) {
    const value = options[key as keyof ReplicateAssemblyOptions];
    if (value !== undefined && !choices.includes(value as string))
      throw new Error(`Unsupported assembly ${key} policy.`);
  }
  if (options.parent !== undefined && !(options.parent instanceof THREE.Object3D))
    throw new Error('Assembly parent must be an Object3D.');
  const fresh = describeAssembly(source.root, { clips: source.clips }),
    state = census(source.root);
  if (options.parent && state.nodes.includes(options.parent))
    throw new Error('A replica parent cannot be inside its source subtree.');
  const { namespace } = options;
  const byName = new Map<string, THREE.Object3D[]>(),
    byRole = new Map<string, THREE.Object3D[]>(),
    byUuid = new Map<string, THREE.Object3D[]>();
  const bySocket = new Map<string, Array<{ node: THREE.Object3D; socket: SemanticSocketV1 }>>();
  const names = new Map<THREE.Object3D, string>(),
    ids = new Map<THREE.Object3D, string>();
  const jointRoles = new Map<string, THREE.Object3D>(),
    jointRoleMap = new Map<string, string>();
  for (const [index, node] of state.nodes.entries()) {
    ids.set(node, `n${index}`);
    names.set(
      node,
      `${namespace}__${(node.name || 'Node').replace(/[^A-Za-z0-9_-]/g, '_')}__n${index}`,
    );
    if (node.name) addIndex(byName, node.name, node);
    addIndex(byUuid, node.uuid, node);
    const metadata = state.semantics.get(node);
    for (const role of metadata?.roles ?? []) addIndex(byRole, role, node);
    for (const socket of metadata?.sockets ?? []) addIndex(bySocket, socket.id, { node, socket });
    const joint = state.joints.get(node);
    if (joint) {
      if (jointRoles.has(joint.role))
        throw new Error(`Ambiguous character joint role: ${joint.role}.`);
      jointRoles.set(joint.role, node);
      jointRoleMap.set(joint.role, `${namespace}.${joint.role}`);
    }
    for (const key of Object.keys(node.userData)) {
      if (!metadataKeys.has(key) && options.unknownMetadata !== 'copy-json')
        throw new Error(
          `Unsupported custom metadata ${key} on ${node.name}; use copy-json only for inert data whose references you own.`,
        );
    }
    jsonData(node.userData, node.name);
    if (node instanceof THREE.Mesh) {
      if (options.geometry === 'copy') {
        jsonData(node.geometry.userData, `${node.name} geometry`);
        if (
          node.geometry.clone !== THREE.BufferGeometry.prototype.clone ||
          !threeConstructors.has(node.geometry.constructor)
        )
          throw new Error(
            'Copying custom geometry classes/clone implementations is unsupported; explicitly share the resource.',
          );
      }
      if (options.materials === 'copy')
        for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
          jsonData(material.userData, `${node.name} material`);
          if (
            material.onBeforeCompile !== THREE.Material.prototype.onBeforeCompile ||
            material.onBeforeRender !== THREE.Material.prototype.onBeforeRender ||
            material.clone !== THREE.Material.prototype.clone ||
            !threeConstructors.has(material.constructor) ||
            material.customProgramCacheKey !== THREE.Material.prototype.customProgramCacheKey ||
            material instanceof THREE.ShaderMaterial
          )
            throw new Error(
              'Copying custom/shader materials is unsupported; explicit sharing preserves their existing implementation.',
            );
        }
    }
  }
  const externalReferences: AssemblyExternalReference[] = [];
  const external = (reference: AssemblyExternalReference) => {
    if (options.externalReferences !== 'preserve')
      throw new Error(
        `Unresolved external ${reference.kind} reference ${reference.target}; explicitly preserve it only when the caller owns that binding.`,
      );
    externalReferences.push(reference);
  };
  const unique = <T>(matches: readonly T[] | undefined, label: string): T | undefined => {
    if (matches && matches.length > 1) throw new Error(`Ambiguous assembly reference: ${label}.`);
    return matches?.[0];
  };
  const resolveNode = (target: string) =>
    unique(
      [...new Set([...(byName.get(target) ?? []), ...(byUuid.get(target) ?? [])])],
      `node name/UUID ${target}`,
    );
  const socketName = (node: THREE.Object3D, id: string) => `${namespace}.${ids.get(node)!}.${id}`;
  const mappedSemantic = new Map<THREE.Object3D, SemanticMetadataV1>();
  const mappedJoints = new Map<THREE.Object3D, CharacterJointDescriptorV1>();
  const mappedRigs = new Map<THREE.Object3D, CharacterRigGraphV1>();
  for (const node of state.nodes) {
    const metadata = state.semantics.get(node),
      joint = state.joints.get(node);
    if (metadata) {
      const mapped = structuredClone(metadata);
      if (joint)
        mapped.roles = mapped.roles.map((role) =>
          role === `joint.${joint.role}`
            ? `joint.${jointRoleMap.get(joint.role)!}`
            : joint.aliases.some((alias) => role === `joint.alias.${alias}`)
              ? `joint.alias.${namespace}.${role.slice('joint.alias.'.length)}`
              : role,
        );
      mapped.sockets = mapped.sockets.map((socket) => ({
        ...socket,
        id: socketName(node, socket.id),
      }));
      mapped.relationships = mapped.relationships.map((relationship) => {
        const { target, targetType } = relationship;
        if (targetType === 'socket') {
          const match = unique(bySocket.get(target), `socket ${target}`);
          if (match) return { ...relationship, target: socketName(match.node, match.socket.id) };
        } else {
          const match =
            targetType === 'node'
              ? resolveNode(target)
              : unique(byRole.get(target), `role ${target}`);
          if (match)
            return { ...relationship, targetType: 'node' as const, target: names.get(match)! };
        }
        external({ kind: 'semantic', source: node.name, target, targetType });
        return relationship;
      });
      mappedSemantic.set(node, mapped);
    }
    const mapJoint = (descriptor: CharacterJointDescriptorV1): CharacterJointDescriptorV1 => {
      const role = jointRoleMap.get(descriptor.role);
      if (!role)
        throw new Error(
          `Rig graph joint ${descriptor.role} is not backed by a subtree joint node.`,
        );
      let parentRole = descriptor.parentRole;
      if (parentRole) {
        if (jointRoleMap.has(parentRole)) parentRole = jointRoleMap.get(parentRole)!;
        else
          external({
            kind: 'character-parent',
            source: node.name,
            target: parentRole,
            targetType: 'joint-role',
          });
      }
      return {
        ...structuredClone(descriptor),
        role,
        aliases: descriptor.aliases.map((alias) => `${namespace}.${alias}`),
        ...(parentRole ? { parentRole } : {}),
      };
    };
    if (joint) {
      const mapped = mapJoint(joint);
      if (!validateCharacterJointDescriptorV1(mapped).valid)
        throw new Error('Replicated joint descriptor is invalid.');
      mappedJoints.set(node, mapped);
    }
    const rig = state.rigs.get(node);
    if (rig) {
      const mapped = { ...structuredClone(rig), joints: rig.joints.map(mapJoint) };
      if (!validateCharacterRigGraphV1(mapped).valid)
        throw new Error('Replicated rig graph is invalid.');
      mappedRigs.set(node, mapped);
    }
  }
  const clipNames = new Set<string>();
  const trackTargets = new Map<THREE.KeyframeTrack, string>();
  const animatedNodes = new Set<THREE.Object3D>();
  for (const clip of fresh.clips) {
    if (!(clip instanceof THREE.AnimationClip))
      throw new Error('Assembly clips must be AnimationClip instances.');
    if (clip.blendMode !== THREE.NormalAnimationBlendMode)
      throw new Error(
        'Additive/other animation blend modes are unsupported in assembly replication.',
      );
    jsonData(clip.userData, `Clip ${clip.name}`);
    if (Object.keys(clip.userData).length && options.unknownMetadata !== 'copy-json')
      throw new Error(
        `Clip ${clip.name} contains custom metadata; explicitly select copy-json to preserve opaque data.`,
      );
    // Constructor validation is also applied to clips changed after description.
    createClip(clip.name, clip.duration, clip.tracks);
    if (clipNames.has(clip.name)) throw new Error(`Ambiguous assembly clip name: ${clip.name}.`);
    clipNames.add(clip.name);
    for (const track of clip.tracks) {
      const dot = track.name.lastIndexOf('.'),
        target = track.name.slice(0, dot);
      const match = resolveNode(target);
      if (match) {
        if (!match.matrixAutoUpdate)
          throw new Error(
            'Animation of manual matrixAutoUpdate=false nodes is unsupported in assembly replication.',
          );
        trackTargets.set(track, `${names.get(match)!}${track.name.slice(dot)}`);
        animatedNodes.add(match);
      } else {
        external({ kind: 'animation', source: clip.name, target, targetType: 'node' });
        trackTargets.set(track, track.name);
      }
    }
  }
  let rootMatrix = state.matrices.get(source.root)!.clone();
  if (options.space === 'world') {
    if (state.joints.has(source.root))
      throw new Error(
        'World placement of a declared joint root requires rest-transform rebasing; wrap it in an assembly root or use local placement.',
      );
    const parentWorld = options.parent ? worldMatrix(options.parent) : new THREE.Matrix4();
    if (!Number.isFinite(parentWorld.determinant()) || parentWorld.determinant() === 0)
      throw new Error('World placement requires an invertible, nonsingular parent transform.');
    rootMatrix = parentWorld.invert().multiply(worldMatrix(source.root));
    checkedTrs(rootMatrix, 'Replica world placement');
    if (animatedNodes.has(source.root))
      throw new Error(
        'World placement of an animated assembly root requires explicit track rebasing, which is unsupported; animate a child pivot or use local placement.',
      );
  }
  if (options.parent) {
    let scene = options.parent;
    const ancestors = new Set<THREE.Object3D>();
    while (scene.parent) {
      if (ancestors.has(scene)) throw new Error('Parent hierarchy cycle.');
      ancestors.add(scene);
      scene = scene.parent;
    }
    const stack = [scene],
      seen = new Set<THREE.Object3D>();
    while (stack.length) {
      const node = stack.pop()!;
      if (seen.has(node)) throw new Error('Destination hierarchy is not a tree.');
      seen.add(node);
      if (node.name.startsWith(`${namespace}__`))
        throw new Error(`Replica namespace collision at ${node.name}. Choose another namespace.`);
      const joint = readCharacterJointDescriptorV1(node);
      if (joint && [...jointRoleMap.values()].includes(joint.role))
        throw new Error(`Replica joint-role collision: ${joint.role}. Choose another namespace.`);
      stack.push(...node.children);
    }
  }
  // All reference/placement/metadata checks precede allocation and parent mutation.
  const nodeMap = new Map<THREE.Object3D, THREE.Object3D>(),
    nameMap = new Map<string, string[]>();
  const geometries = new Map<THREE.BufferGeometry, THREE.BufferGeometry>(),
    materials = new Map<THREE.Material, THREE.Material>();
  const copyMaterial = (material: THREE.Material) => {
    if (options.materials !== 'copy') return material;
    if (!materials.has(material)) materials.set(material, material.clone());
    return materials.get(material)!;
  };
  for (const node of state.nodes) {
    const copy =
      node instanceof THREE.Mesh
        ? new THREE.Mesh(node.geometry, node.material)
        : node instanceof THREE.Group
          ? new THREE.Group()
          : new THREE.Object3D();
    copy.copy(node, false);
    copy.name = names.get(node)!;
    copy.animations = [];
    const matrix = node === source.root ? rootMatrix : state.matrices.get(node)!;
    // Equivalent TRS decompositions can change signed scale/rotation components and
    // therefore animation behavior. Preserve authored components whenever possible.
    if (!node.matrixAutoUpdate || (node === source.root && options.space === 'world')) {
      const trs = checkedTrs(matrix, node.name);
      copy.position.copy(trs.position);
      copy.quaternion.copy(trs.quaternion);
      copy.scale.copy(trs.scale);
    }
    copy.matrix.copy(matrix);
    copy.matrixWorldNeedsUpdate = true;
    if (node instanceof THREE.Mesh && copy instanceof THREE.Mesh) {
      if (options.geometry === 'copy') {
        if (!geometries.has(node.geometry)) geometries.set(node.geometry, node.geometry.clone());
        copy.geometry = geometries.get(node.geometry)!;
      } else copy.geometry = node.geometry;
      copy.material = Array.isArray(node.material)
        ? node.material.map(copyMaterial)
        : copyMaterial(node.material);
    }
    if (mappedSemantic.has(node)) stampSemanticMetadataV1(copy, mappedSemantic.get(node)!);
    if (mappedJoints.has(node))
      copy.userData[KILN_CHARACTER_JOINT_EXTRAS_KEY] = structuredClone(mappedJoints.get(node)!);
    if (mappedRigs.has(node))
      copy.userData[KILN_CHARACTER_RIG_EXTRAS_KEY] = structuredClone(mappedRigs.get(node)!);
    nodeMap.set(node, copy);
    addIndex(nameMap, node.name, copy.name);
    if (node !== source.root) nodeMap.get(node.parent!)!.add(copy);
  }
  const clipMap = new Map<THREE.AnimationClip, THREE.AnimationClip>();
  for (const clip of fresh.clips) {
    const tracks = clip.tracks.map((track) => {
      const copied = track.clone();
      copied.name = trackTargets.get(track)!;
      return copied;
    });
    const copied = createClip(`${namespace}__${clip.name}`, clip.duration, tracks);
    copied.userData = structuredClone(clip.userData);
    clipMap.set(clip, copied);
  }
  for (const node of state.nodes)
    nodeMap.get(node)!.animations = node.animations.map((clip) => clipMap.get(clip)!);
  const root = nodeMap.get(source.root)!;
  const result = describeAssembly(root, { clips: [...clipMap.values()] });
  if (options.parent) options.parent.add(root);
  return {
    ...result,
    nodeMap,
    nameMap,
    jointRoleMap,
    clipMap,
    externalReferences,
    ownership: {
      hierarchy: 'owned',
      geometry: options.geometry === 'copy' ? 'owned' : 'shared',
      materials: options.materials === 'copy' ? 'owned' : 'shared',
      textures: 'shared',
      clips: 'owned',
    },
  };
}
