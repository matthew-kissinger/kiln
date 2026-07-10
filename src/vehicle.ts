/** Frame-owning vehicle and wheel scaffolds for Kiln's +X-forward asset frame. */
import * as THREE from 'three';

import {
  readSemanticMetadataV1,
  stampSemanticMetadataV1,
  type SemanticMetadataV1Input,
  type SemanticSocketV1,
  type VehicleIntentV1,
} from './contracts';

export const VEHICLE_AXES = Object.freeze({
  forward: Object.freeze([1, 0, 0] as const),
  up: Object.freeze([0, 1, 0] as const),
  right: Object.freeze([0, 0, 1] as const),
  wheelAxle: Object.freeze([0, 0, 1] as const),
} as const);

export type VehicleSocketKind = 'chassis' | 'axle' | 'seat' | 'contact' | 'steering' | 'propulsion';

export interface VehicleSocketInput {
  id: string;
  position: [number, number, number];
  rotation?: [number, number, number, number];
  compatibleTypes?: readonly string[];
}

export interface VehicleFrameOptions {
  chassis?: VehicleSocketInput;
  axles?: readonly VehicleSocketInput[];
  seats?: readonly VehicleSocketInput[];
  contacts?: readonly VehicleSocketInput[];
  steering?: readonly VehicleSocketInput[];
  propulsion?: readonly VehicleSocketInput[];
  parent?: THREE.Object3D;
}

export interface VehicleFrameResult {
  root: THREE.Object3D;
  chassis: THREE.Object3D;
  axles: THREE.Object3D[];
  seats: THREE.Object3D[];
  contacts: THREE.Object3D[];
  steering: THREE.Object3D[];
  propulsion: THREE.Object3D[];
}

export type WheelSide = 'left' | 'right';

export interface WheelGeometrySet {
  tire: THREE.BufferGeometry;
  rim: THREE.BufferGeometry;
  hub: THREE.BufferGeometry;
}

export interface WheelMaterialSet {
  tire: THREE.Material;
  rim: THREE.Material;
  hub?: THREE.Material;
}

export interface WheelAssemblyOptions {
  radius: number;
  width: number;
  side: WheelSide;
  /** Axle index or stable axle label shared by its left/right pair. */
  index: number | string;
  position?: [number, number, number];
  rimRadius?: number;
  hubRadius?: number;
  rimWidth?: number;
  hubWidth?: number;
  steering?: boolean;
  loadBearing?: boolean;
  geometries?: Partial<WheelGeometrySet>;
  parent?: THREE.Object3D;
}

export interface WheelAssemblyResult {
  root: THREE.Object3D;
  steeringPivot?: THREE.Object3D;
  spinPivot: THREE.Object3D;
  tire: THREE.Mesh;
  rim: THREE.Mesh;
  hub: THREE.Mesh;
  contact: THREE.Object3D;
  radius: number;
  width: number;
  side: WheelSide;
  index: string;
  spinAxis: readonly [0, 0, 1];
}

export interface ResolvedWheelAssembly {
  id: string;
  source: 'semantic' | 'legacy';
  side?: WheelSide;
  index?: string;
  root: THREE.Object3D;
  pivot: THREE.Object3D;
  steeringPivot?: THREE.Object3D;
  tire?: THREE.Object3D;
  rim?: THREE.Object3D;
  hub?: THREE.Object3D;
  contact?: THREE.Object3D;
  centerWorld: THREE.Vector3;
  pivotCenterWorld: THREE.Vector3;
  tireCenterWorld?: THREE.Vector3;
  rimCenterWorld?: THREE.Vector3;
  hubCenterWorld?: THREE.Vector3;
  spinAxisWorld: THREE.Vector3;
  radius?: number;
  width?: number;
  rimRadius?: number;
  rimWidth?: number;
  hubRadius?: number;
  hubWidth?: number;
  loadBearing: boolean;
}

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

function assertId(value: string, name: string): string {
  if (!ID_PATTERN.test(value)) throw new TypeError(`${name} must be a stable identifier`);
  return value;
}

function positive(value: number, name: string): number {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${name} must be finite and > 0`);
  return value;
}

function normalizedQuaternion(
  value: readonly [number, number, number, number] | undefined,
): [number, number, number, number] {
  const source = value ?? [0, 0, 0, 1];
  const length = Math.hypot(source[0], source[1], source[2], source[3]);
  if (!Number.isFinite(length) || length <= 1e-9)
    throw new TypeError('socket rotation must be a finite quaternion');
  return [source[0] / length, source[1] / length, source[2] / length, source[3] / length];
}

function semantic(
  roles: readonly string[],
  options: Omit<SemanticMetadataV1Input, 'roles'> = {},
): SemanticMetadataV1Input {
  return {
    roles,
    relationships: options.relationships ?? [],
    frames: options.frames ?? [],
    sockets: options.sockets ?? [],
  };
}

function socketRole(kind: VehicleSocketKind, id: string): string {
  if (kind === 'chassis') return 'chassis.main';
  if (kind === 'axle') return `axle.${id}`;
  return `${kind}.${id}`;
}

function createTypedSocket(
  kind: VehicleSocketKind,
  input: VehicleSocketInput,
  parent: THREE.Object3D,
): THREE.Object3D {
  const id = assertId(input.id, `${kind} socket id`);
  if (!input.position.every(Number.isFinite))
    throw new TypeError(`${kind}.${id} position must be finite`);
  const rotation = normalizedQuaternion(input.rotation);
  const node = new THREE.Object3D();
  node.name = `Socket_${kind}_${id}`;
  node.position.set(...input.position);
  node.quaternion.set(...rotation);
  const socket: SemanticSocketV1 = {
    id,
    type: `vehicle.${kind}`,
    frame: 'socket',
    compatibleTypes: [...(input.compatibleTypes ?? [`vehicle.${kind}`])],
  };
  stampSemanticMetadataV1(
    node,
    semantic([`socket.${kind}.${id}`, socketRole(kind, id)], {
      frames: [{ id: 'socket', translation: [0, 0, 0], rotation: [0, 0, 0, 1] }],
      sockets: [socket],
      relationships: [{ kind: 'owned-by', target: 'vehicle.frame', targetType: 'role' }],
    }),
  );
  parent.add(node);
  return node;
}

/** Create a typed vehicle socket frame whose local basis is always +X/+Y/+Z. */
export function createVehicleFrame(
  name: string,
  options: VehicleFrameOptions = {},
): VehicleFrameResult {
  const root = new THREE.Object3D();
  root.name = name;
  stampSemanticMetadataV1(
    root,
    semantic(['vehicle.frame', 'vehicle.front.+x'], {
      frames: [
        { id: 'origin', translation: [0, 0, 0], rotation: [0, 0, 0, 1] },
        { id: 'forward.+x', translation: [0, 0, 0], rotation: [0, 0, 0, 1] },
        { id: 'up.+y', translation: [0, 0, 0], rotation: [0, 0, 0, 1] },
        { id: 'right.+z', translation: [0, 0, 0], rotation: [0, 0, 0, 1] },
      ],
    }),
  );
  if (options.parent) options.parent.add(root);

  const chassis = createTypedSocket(
    'chassis',
    options.chassis ?? { id: 'main', position: [0, 0, 0] },
    root,
  );
  const build = (
    kind: Exclude<VehicleSocketKind, 'chassis'>,
    values: readonly VehicleSocketInput[] | undefined,
  ) => (values ?? []).map((value) => createTypedSocket(kind, value, root));
  return {
    root,
    chassis,
    axles: build('axle', options.axles),
    seats: build('seat', options.seats),
    contacts: build('contact', options.contacts),
    steering: build('steering', options.steering),
    propulsion: build('propulsion', options.propulsion),
  };
}

function cylinderZ(radius: number, width: number, segments = 16): THREE.CylinderGeometry {
  const geometry = new THREE.CylinderGeometry(radius, radius, width, segments);
  geometry.rotateX(Math.PI / 2);
  return geometry;
}

/** Shared geometry can be passed to every wheel to preserve GLB instancing. */
export function createWheelGeometrySet(radius: number, width: number): WheelGeometrySet {
  positive(radius, 'radius');
  positive(width, 'width');
  if (width >= radius * 2) throw new RangeError('wheel width must be less than its diameter');
  const tube = width / 2;
  return {
    tire: new THREE.TorusGeometry(radius - tube, tube, 8, 20),
    rim: cylinderZ(radius * 0.68, width * 0.8),
    hub: cylinderZ(radius * 0.34, width * 0.94),
  };
}

/** One axle-centered wheel hierarchy, optionally nested below a +Y steering pivot. */
export function createWheelAssembly(
  name: string,
  materials: WheelMaterialSet,
  options: WheelAssemblyOptions,
): WheelAssemblyResult {
  const radius = positive(options.radius, 'radius');
  const width = positive(options.width, 'width');
  const rimRadius = positive(options.rimRadius ?? radius * 0.68, 'rimRadius');
  const hubRadius = positive(options.hubRadius ?? radius * 0.34, 'hubRadius');
  const rimWidth = positive(options.rimWidth ?? width * 0.8, 'rimWidth');
  const hubWidth = positive(options.hubWidth ?? width * 0.94, 'hubWidth');
  if (rimRadius >= radius || hubRadius >= rimRadius)
    throw new RangeError('wheel radii must satisfy hub < rim < tire');
  if (rimWidth > width || hubWidth > width)
    throw new RangeError('rim/hub width must not exceed tire width');
  const index = assertId(String(options.index), 'wheel index');
  const key = `${options.side}.${index}`;
  const parent = options.parent;
  const root = new THREE.Object3D();
  root.name = `${name}_Assembly_${options.side}_${index}`;

  let steeringPivot: THREE.Object3D | undefined;
  if (options.steering) {
    steeringPivot = new THREE.Object3D();
    steeringPivot.name = `SteeringPivot_${options.side}_${index}`;
    steeringPivot.position.set(...(options.position ?? [0, 0, 0]));
    stampSemanticMetadataV1(
      steeringPivot,
      semantic([`steering.pivot.${key}`], {
        frames: [{ id: 'steering-axis.+y', translation: [0, 0, 0], rotation: [0, 0, 0, 1] }],
        relationships: [{ kind: 'steers', target: `wheel.assembly.${key}`, targetType: 'role' }],
      }),
    );
    root.add(steeringPivot);
  }

  const spinPivot = new THREE.Object3D();
  spinPivot.name = `WheelPivot_${options.side}_${index}`;
  if (!steeringPivot) spinPivot.position.set(...(options.position ?? [0, 0, 0]));
  stampSemanticMetadataV1(
    spinPivot,
    semantic(
      [
        `wheel.assembly.${key}`,
        `wheel.pivot.${key}`,
        ...(options.loadBearing === false ? [] : [`wheel.load-bearing.${key}`]),
      ],
      {
        frames: [
          { id: 'axle-center', translation: [0, 0, 0], rotation: [0, 0, 0, 1] },
          { id: 'spin-axis.+z', translation: [0, 0, 0], rotation: [0, 0, 0, 1] },
        ],
        relationships: [
          { kind: 'mounted-on', target: `axle.${index}`, targetType: 'role' },
          { kind: 'contains', target: `wheel.tire.${key}`, targetType: 'role' },
          { kind: 'contains', target: `wheel.rim.${key}`, targetType: 'role' },
          { kind: 'contains', target: `wheel.hub.${key}`, targetType: 'role' },
        ],
      },
    ),
  );
  (steeringPivot ?? root).add(spinPivot);

  const defaults = createWheelGeometrySet(radius, width);
  const tire = new THREE.Mesh(options.geometries?.tire ?? defaults.tire, materials.tire);
  const rim = new THREE.Mesh(
    options.geometries?.rim ?? cylinderZ(rimRadius, rimWidth),
    materials.rim,
  );
  const hub = new THREE.Mesh(
    options.geometries?.hub ?? cylinderZ(hubRadius, hubWidth),
    materials.hub ?? materials.rim,
  );
  tire.name = `Tire_${options.side}_${index}`;
  rim.name = `Rim_${options.side}_${index}`;
  hub.name = `Hub_${options.side}_${index}`;
  stampSemanticMetadataV1(
    tire,
    semantic([`wheel.tire.${key}`], {
      relationships: [{ kind: 'descends-from', target: `wheel.pivot.${key}`, targetType: 'role' }],
    }),
  );
  stampSemanticMetadataV1(
    rim,
    semantic([`wheel.rim.${key}`], {
      relationships: [{ kind: 'contained-by', target: `wheel.tire.${key}`, targetType: 'role' }],
    }),
  );
  stampSemanticMetadataV1(
    hub,
    semantic([`wheel.hub.${key}`], {
      relationships: [{ kind: 'contained-by', target: `wheel.rim.${key}`, targetType: 'role' }],
    }),
  );
  spinPivot.add(tire, rim, hub);

  const contact = new THREE.Object3D();
  contact.name = `Contact_${options.side}_${index}`;
  contact.position.y = -radius;
  stampSemanticMetadataV1(
    contact,
    semantic([`wheel.contact.${key}`, `contact.${key}`], {
      frames: [{ id: 'contact', translation: [0, 0, 0], rotation: [0, 0, 0, 1] }],
      relationships: [{ kind: 'supports', target: 'vehicle.frame', targetType: 'role' }],
    }),
  );
  spinPivot.add(contact);
  if (parent) parent.add(root);
  return {
    root,
    ...(steeringPivot ? { steeringPivot } : {}),
    spinPivot,
    tire,
    rim,
    hub,
    contact,
    radius,
    width,
    side: options.side,
    index,
    spinAxis: VEHICLE_AXES.wheelAxle,
  };
}

function roles(node: THREE.Object3D): readonly string[] {
  return readSemanticMetadataV1(node)?.roles ?? [];
}

function descendantWithRole(root: THREE.Object3D, prefix: string): THREE.Object3D | undefined {
  let found: THREE.Object3D | undefined;
  root.traverse((node) => {
    if (!found && roles(node).some((role) => role.startsWith(prefix))) found = node;
  });
  return found;
}

function ancestorWithRole(node: THREE.Object3D, prefix: string): THREE.Object3D | undefined {
  let current = node.parent;
  while (current) {
    if (roles(current).some((role) => role.startsWith(prefix))) return current;
    current = current.parent;
  }
  return undefined;
}

function parseWheelRole(role: string): { side?: WheelSide; index?: string } {
  const parts = role.split('.');
  const side = parts.at(-2);
  return {
    ...(side === 'left' || side === 'right' ? { side } : {}),
    ...(parts.at(-1) ? { index: parts.at(-1)! } : {}),
  };
}

function objectBoundsInFrame(
  object: THREE.Object3D,
  frame: THREE.Object3D,
): THREE.Box3 | undefined {
  object.updateWorldMatrix(true, true);
  frame.updateWorldMatrix(true, false);
  const worldToFrame = frame.matrixWorld.clone().invert();
  const bounds = new THREE.Box3();
  let found = false;
  object.traverse((node) => {
    if (!(node instanceof THREE.Mesh) || !(node.geometry instanceof THREE.BufferGeometry)) return;
    node.geometry.computeBoundingBox();
    const local = node.geometry.boundingBox;
    if (!local) return;
    const matrix = worldToFrame.clone().multiply(node.matrixWorld);
    for (const x of [local.min.x, local.max.x])
      for (const y of [local.min.y, local.max.y])
        for (const z of [local.min.z, local.max.z]) {
          bounds.expandByPoint(new THREE.Vector3(x, y, z).applyMatrix4(matrix));
          found = true;
        }
  });
  return found ? bounds : undefined;
}

function dimensions(
  object: THREE.Object3D | undefined,
  frame: THREE.Object3D,
): { center: THREE.Vector3; radius: number; width: number } | undefined {
  if (!object) return undefined;
  const bounds = objectBoundsInFrame(object, frame);
  if (!bounds) return undefined;
  const size = bounds.getSize(new THREE.Vector3());
  return {
    center: bounds.getCenter(new THREE.Vector3()),
    radius: Math.max(size.x, size.y) / 2,
    width: size.z,
  };
}

function resolved(
  source: 'semantic' | 'legacy',
  id: string,
  root: THREE.Object3D,
  pivot: THREE.Object3D,
  parts: {
    side?: WheelSide;
    index?: string;
    tire?: THREE.Object3D;
    rim?: THREE.Object3D;
    hub?: THREE.Object3D;
    contact?: THREE.Object3D;
    steeringPivot?: THREE.Object3D;
  },
): ResolvedWheelAssembly {
  pivot.updateWorldMatrix(true, false);
  const tire = dimensions(parts.tire, pivot);
  const rim = dimensions(parts.rim, pivot);
  const hub = dimensions(parts.hub, pivot);
  const centerLocal = tire?.center ?? rim?.center ?? hub?.center ?? new THREE.Vector3();
  const toWorld = (value: THREE.Vector3): THREE.Vector3 =>
    value.clone().applyMatrix4(pivot.matrixWorld);
  return {
    id,
    source,
    ...(parts.side ? { side: parts.side } : {}),
    ...(parts.index ? { index: parts.index } : {}),
    root,
    pivot,
    ...(parts.steeringPivot ? { steeringPivot: parts.steeringPivot } : {}),
    ...(parts.tire ? { tire: parts.tire } : {}),
    ...(parts.rim ? { rim: parts.rim } : {}),
    ...(parts.hub ? { hub: parts.hub } : {}),
    ...(parts.contact ? { contact: parts.contact } : {}),
    centerWorld: toWorld(centerLocal),
    pivotCenterWorld: new THREE.Vector3().setFromMatrixPosition(pivot.matrixWorld),
    ...(tire ? { tireCenterWorld: toWorld(tire.center) } : {}),
    ...(rim ? { rimCenterWorld: toWorld(rim.center) } : {}),
    ...(hub ? { hubCenterWorld: toWorld(hub.center) } : {}),
    spinAxisWorld: new THREE.Vector3(0, 0, 1).transformDirection(pivot.matrixWorld),
    ...(tire ? { radius: tire.radius, width: tire.width } : {}),
    ...(rim ? { rimRadius: rim.radius, rimWidth: rim.width } : {}),
    ...(hub ? { hubRadius: hub.radius, hubWidth: hub.width } : {}),
    loadBearing: roles(pivot).some((role) => role.startsWith('wheel.load-bearing.')),
  };
}

function semanticAssemblies(root: THREE.Object3D): ResolvedWheelAssembly[] {
  const result: ResolvedWheelAssembly[] = [];
  root.traverse((node) => {
    const assemblyRole = roles(node).find((role) => role.startsWith('wheel.assembly.'));
    if (!assemblyRole) return;
    const parsed = parseWheelRole(assemblyRole);
    result.push(
      resolved('semantic', assemblyRole, node, node, {
        ...parsed,
        tire: descendantWithRole(node, 'wheel.tire.'),
        rim: descendantWithRole(node, 'wheel.rim.'),
        hub: descendantWithRole(node, 'wheel.hub.'),
        contact: descendantWithRole(node, 'wheel.contact.'),
        steeringPivot: ancestorWithRole(node, 'steering.pivot.'),
      }),
    );
  });
  return result;
}

function legacyCorner(name: string): { key: string; side?: WheelSide; index?: string } | undefined {
  const value = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  if (!/(wheel|tire|rim|hub)/.test(value)) return undefined;
  const side: WheelSide | undefined = /(?:left|(^|-)l($|-)|fl|rl)/.test(value)
    ? 'left'
    : /(?:right|(^|-)r($|-)|fr|rr)/.test(value)
      ? 'right'
      : undefined;
  const index = /(?:front|(^|-)f($|-)|fl|fr)/.test(value)
    ? 'front'
    : /(?:rear|back|(^|-)r[lr]($|-)|rl|rr)/.test(value)
      ? 'rear'
      : value.match(/\d+/)?.[0];
  return {
    key: `${side ?? 'unknown'}.${index ?? value}`,
    ...(side ? { side } : {}),
    ...(index ? { index } : {}),
  };
}

function legacyAssemblies(root: THREE.Object3D): ResolvedWheelAssembly[] {
  const groups = new Map<
    string,
    {
      side?: WheelSide;
      index?: string;
      pivot?: THREE.Object3D;
      tire?: THREE.Object3D;
      rim?: THREE.Object3D;
      hub?: THREE.Object3D;
    }
  >();
  root.traverse((node) => {
    const corner = legacyCorner(node.name);
    if (!corner) return;
    const entry = groups.get(corner.key) ?? {
      ...(corner.side ? { side: corner.side } : {}),
      ...(corner.index ? { index: corner.index } : {}),
    };
    const lower = node.name.toLowerCase();
    if (lower.includes('pivot')) entry.pivot = node;
    else if (lower.includes('rim')) entry.rim = node;
    else if (lower.includes('hub')) entry.hub = node;
    else entry.tire = node;
    groups.set(corner.key, entry);
  });
  return [...groups.entries()].map(([key, parts]) => {
    const pivot =
      parts.pivot ?? parts.tire?.parent ?? parts.rim?.parent ?? parts.hub?.parent ?? root;
    return resolved('legacy', key, pivot, pivot, parts);
  });
}

/** Semantic grouping wins completely; canonical names are legacy-only fallback. */
export function resolveVehicleWheelAssemblies(root: THREE.Object3D): ResolvedWheelAssembly[] {
  const semantic = semanticAssemblies(root);
  return semantic.length > 0 ? semantic : legacyAssemblies(root);
}

export function hasCanonicalVehicleFront(root: THREE.Object3D): boolean {
  let found = false;
  root.traverse((node) => {
    const metadata = readSemanticMetadataV1(node);
    if (
      metadata?.roles.includes('vehicle.frame') &&
      metadata.roles.includes('vehicle.front.+x') &&
      metadata.frames.some((frame) => frame.id === 'forward.+x')
    ) {
      found = true;
    }
  });
  return found;
}

/** Resolved subtype guidance; one recipe is injected and unrelated noun helpers stay absent. */
export function vehicleSubtypeRecipe(intent: VehicleIntentV1): string {
  const contract =
    `Resolved vehicle subtype: ${intent.subtype.toUpperCase()}. Canonical front is +X, up is +Y, ` +
    `and wheel/rail axles run across +Z. Support policy: ${intent.supportPolicy}; supports: ` +
    `${intent.supportAssemblies.join(', ') || 'none'}; propulsion: ` +
    `${intent.propulsionAssemblies.join(', ') || 'none'}.`;
  if (intent.subtype === 'wheeled') {
    return (
      `${contract} Build exactly ${intent.wheelCount} axle-centered semantic wheel assemblies across ` +
      `${intent.axleCount} axles with createVehicleFrame() and createWheelAssembly(). Keep each tire, ` +
      'rim, and hub concentric and nested; mirror left/right centers, radii, and widths; never stack two assemblies at one corner; place every load-bearing tire on Y=0.'
    );
  }
  if (intent.subtype === 'tracked') {
    return (
      `${contract} Author complete closed track.loop.left/right geometry, keep every road wheel inside ` +
      'its loop, tag support.track.* and track.road-wheel.* roles, and place both track support sets on one Y=0 contact plane. Do not invent ordinary car-wheel rules.'
    );
  }
  if (intent.subtype === 'rail') {
    return (
      `${contract} Keep rail-wheel/support assemblies paired on +Z axles, centered under the chassis, ` +
      'and coplanar at Y=0. Preserve a longitudinal +X body and do not apply tire/fender assumptions.'
    );
  }
  if (intent.subtype === 'watercraft') {
    return (
      `${contract} Build a watertight longitudinal +X hull with an explicit waterline. Center each ` +
      'propeller on its +X shaft and place the rudder behind it. Do not add wheels, axles, tires, hubs, or ground-contact rules.'
    );
  }
  if (intent.subtype === 'fixed-wing') {
    return (
      `${contract} Wingspan may exceed body length and must not be mistaken for sideways orientation. ` +
      'Keep fuselage/cockpit front +X, center propeller or jet propulsion on declared shaft/pivots, and tag landing gear independently from airborne policy.'
    );
  }
  if (intent.subtype === 'rotorcraft') {
    return (
      `${contract} Wingspan-style bounds do not determine front. Center each rotor pivot at its mast, ` +
      'declare the correct propulsion axis, keep blades coplanar, and author skids/landing gear as explicit support sets without inheriting car-wheel rules.'
    );
  }
  if (intent.subtype === 'hover') {
    return (
      `${contract} Keep hover pads/thrusters as explicit centered assemblies, preserve readable +X ` +
      'travel, and do not add wheels or force airborne supports onto Y=0.'
    );
  }
  if (intent.subtype === 'walking') {
    return (
      `${contract} Declare each load-bearing leg/contact set and put grounded contacts on one stable ` +
      'Y=0 plane; keep propulsion/joints distinct from wheeled-vehicle axle assumptions.'
    );
  }
  return (
    `${contract} Follow only the declared support and propulsion semantics, preserve +X front, and ` +
    'avoid adding wheel, track, rotor, or waterline assumptions not present in trusted intent.'
  );
}
