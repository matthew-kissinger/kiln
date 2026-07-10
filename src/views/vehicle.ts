/** Renderable vehicle diagnostic evidence without mutating the authored scene. */
import * as THREE from 'three';

import { readSemanticMetadataV1, stampSemanticMetadataV1, type AssetIntentV1 } from '../contracts';
import { resolveVehicleWheelAssemblies } from '../vehicle';
import {
  planDiagnosticViews,
  renderDiagnosticView,
  type DiagnosticOverlayRegion,
  type DiagnosticViewRequest,
} from './diagnostic';

export interface VehicleDiagnosticWheelV1 {
  id: string;
  center: [number, number, number];
  radius: number;
  width: number;
  axle: [number, number, number];
  loadBearing: boolean;
}

export interface VehicleDiagnosticAxleV1 {
  id: string;
  start: [number, number, number];
  end: [number, number, number];
}

export interface VehicleDiagnosticViewV1 {
  id: string;
  label: string;
  cameraDirection: [number, number, number];
  focus?: string;
}

export interface VehicleDiagnosticDescriptorV1 {
  schemaVersion: 1;
  forwardArrow: { start: [number, number, number]; end: [number, number, number] };
  chassisBox?: { min: [number, number, number]; max: [number, number, number] };
  axles: VehicleDiagnosticAxleV1[];
  wheels: VehicleDiagnosticWheelV1[];
  supportPlaneY?: number;
  views: VehicleDiagnosticViewV1[];
}

export interface VehicleCapturedDiagnosticV1 {
  id: string;
  label: string;
  cameraId: 'underside' | 'right';
  kind: 'underbody' | 'wheel-section';
  buffer: 'semantic-overlay';
  width: number;
  height: number;
  png: Buffer;
  regions: DiagnosticOverlayRegion[];
  /** Exact metric/axis evidence rendered into this capture. */
  descriptor: VehicleDiagnosticDescriptorV1;
}

const tuple = (value: THREE.Vector3): [number, number, number] => [value.x, value.y, value.z];

function hasRole(node: THREE.Object3D, prefix: string): boolean {
  return (
    readSemanticMetadataV1(node)?.roles.some(
      (role) => role === prefix || role.startsWith(`${prefix}.`),
    ) ?? false
  );
}

function chassisBounds(root: THREE.Object3D, inverse: THREE.Matrix4): THREE.Box3 | undefined {
  const bounds = new THREE.Box3();
  let found = false;
  root.traverse((node) => {
    if (!hasRole(node, 'chassis')) return;
    node.traverse((part) => {
      if (!(part instanceof THREE.Mesh) || !(part.geometry instanceof THREE.BufferGeometry)) return;
      part.geometry.computeBoundingBox();
      const box = part.geometry.boundingBox;
      if (!box) return;
      const matrix = inverse.clone().multiply(part.matrixWorld);
      for (const x of [box.min.x, box.max.x])
        for (const y of [box.min.y, box.max.y])
          for (const z of [box.min.z, box.max.z]) {
            bounds.expandByPoint(new THREE.Vector3(x, y, z).applyMatrix4(matrix));
            found = true;
          }
    });
  });
  return found ? bounds : undefined;
}

/** Stable overlay/view descriptor in vehicle-root local meters. */
export function describeVehicleDiagnostics(root: THREE.Object3D): VehicleDiagnosticDescriptorV1 {
  root.updateWorldMatrix(true, true);
  const inverse = root.matrixWorld.clone().invert();
  const assemblies = resolveVehicleWheelAssemblies(root);
  const wheels = assemblies.map((wheel) => ({
    id: wheel.id,
    center: tuple(wheel.centerWorld.clone().applyMatrix4(inverse)),
    radius: wheel.radius ?? 0,
    width: wheel.width ?? 0,
    axle: tuple(wheel.spinAxisWorld.clone().transformDirection(inverse)),
    loadBearing: wheel.loadBearing,
  }));
  const byAxle = new Map<string, VehicleDiagnosticWheelV1[]>();
  for (let index = 0; index < assemblies.length; index++) {
    const key = assemblies[index]!.index ?? assemblies[index]!.id;
    const group = byAxle.get(key) ?? [];
    group.push(wheels[index]!);
    byAxle.set(key, group);
  }
  const axles = [...byAxle].flatMap(([id, members]) => {
    if (members.length < 2) return [];
    const sorted = [...members].sort((a, b) => a.center[2] - b.center[2]);
    return [{ id, start: sorted[0]!.center, end: sorted.at(-1)!.center }];
  });
  const contacts = wheels
    .filter((wheel) => wheel.loadBearing && wheel.radius > 0)
    .map((wheel) => wheel.center[1] - wheel.radius);
  const supportPlaneY =
    contacts.length > 0
      ? contacts.reduce((sum, value) => sum + value, 0) / contacts.length
      : undefined;
  const chassis = chassisBounds(root, inverse);
  const views: VehicleDiagnosticViewV1[] = [
    { id: 'vehicle.front-direction', label: '+X front and chassis', cameraDirection: [1, 0.15, 0] },
    {
      id: 'vehicle.axles.top',
      label: 'Chassis and axle projection',
      cameraDirection: [0.001, 1, 0],
    },
    {
      id: 'vehicle.underbody',
      label: 'Underbody support plane',
      cameraDirection: [-0.3, -0.8, 0.5],
    },
    ...wheels.slice(0, 2).map((wheel) => ({
      id: `vehicle.wheel-section.${wheel.id.replace(/[^a-zA-Z0-9.-]/g, '-')}`,
      label: `Wheel section ${wheel.id}`,
      cameraDirection: [0, 0, wheel.center[2] < 0 ? -1 : 1] as [number, number, number],
      focus: wheel.id,
    })),
  ];
  return {
    schemaVersion: 1,
    forwardArrow: { start: [0, 0, 0], end: [1, 0, 0] },
    ...(chassis ? { chassisBox: { min: tuple(chassis.min), max: tuple(chassis.max) } } : {}),
    axles,
    wheels,
    ...(supportPlaneY !== undefined ? { supportPlaneY } : {}),
    views,
  };
}

function tagDiagnostic(node: THREE.Object3D, role: string): void {
  stampSemanticMetadataV1(node, { roles: [role] });
}

function rod(
  name: string,
  start: readonly [number, number, number],
  end: readonly [number, number, number],
  radius: number,
  color: number,
  role: string,
): THREE.Mesh {
  const from = new THREE.Vector3(...start);
  const to = new THREE.Vector3(...end);
  const direction = to.clone().sub(from);
  const length = direction.length();
  const geometry =
    length > 1e-9
      ? new THREE.CylinderGeometry(radius, radius, length, 8)
      : new THREE.SphereGeometry(radius, 8, 6);
  const result = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color }));
  result.name = name;
  result.position.copy(from).add(to).multiplyScalar(0.5);
  if (length > 1e-9) {
    result.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.multiplyScalar(1 / length),
    );
  }
  tagDiagnostic(result, role);
  return result;
}

/** A separate renderable overlay group; source visibility/transforms stay untouched. */
export function createVehicleDiagnosticOverlay(
  root: THREE.Object3D,
  descriptor = describeVehicleDiagnostics(root),
): THREE.Group {
  const overlay = new THREE.Group();
  overlay.name = 'VehicleDiagnosticOverlay';
  const chassisSpan = descriptor.chassisBox
    ? Math.max(
        descriptor.chassisBox.max[0] - descriptor.chassisBox.min[0],
        descriptor.chassisBox.max[1] - descriptor.chassisBox.min[1],
        descriptor.chassisBox.max[2] - descriptor.chassisBox.min[2],
      )
    : 1;
  const thickness = Math.max(0.01, chassisSpan * 0.008);

  const arrow = new THREE.Group();
  arrow.name = 'Diagnostic_Forward_+X';
  tagDiagnostic(arrow, 'diagnostic.vehicle.forward');
  arrow.add(
    rod(
      'Diagnostic_Forward_Shaft',
      descriptor.forwardArrow.start,
      [descriptor.forwardArrow.end[0] - 0.12, 0, 0],
      thickness,
      0xff3344,
      'diagnostic.vehicle.forward',
    ),
  );
  const arrowHead = new THREE.Mesh(
    new THREE.ConeGeometry(thickness * 3.2, 0.24, 10),
    new THREE.MeshBasicMaterial({ color: 0xff3344 }),
  );
  arrowHead.name = 'Diagnostic_Forward_Head';
  arrowHead.position.set(descriptor.forwardArrow.end[0] - 0.12, 0, 0);
  arrowHead.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0));
  tagDiagnostic(arrowHead, 'diagnostic.vehicle.forward');
  arrow.add(arrowHead);
  overlay.add(arrow);

  for (const axle of descriptor.axles) {
    overlay.add(
      rod(
        `Diagnostic_Axle_${axle.id}`,
        axle.start,
        axle.end,
        thickness,
        0x33aaff,
        `diagnostic.vehicle.axle.${axle.id}`,
      ),
    );
  }
  for (const wheel of descriptor.wheels) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(wheel.radius, Math.min(thickness, wheel.radius * 0.15), 6, 32),
      new THREE.MeshBasicMaterial({ color: 0xffcc33 }),
    );
    ring.name = `Diagnostic_Wheel_${wheel.id}`;
    ring.position.set(...wheel.center);
    const axle = new THREE.Vector3(...wheel.axle);
    if (axle.lengthSq() > 1e-12) {
      ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), axle.normalize());
    }
    tagDiagnostic(ring, `diagnostic.vehicle.wheel.${wheel.id}`);
    overlay.add(ring);
  }
  if (descriptor.chassisBox) {
    const chassis = new THREE.Group();
    chassis.name = 'Diagnostic_ChassisBox';
    tagDiagnostic(chassis, 'diagnostic.vehicle.chassis');
    const { min, max } = descriptor.chassisBox;
    const corners: Array<[number, number, number]> = [
      [min[0], min[1], min[2]],
      [max[0], min[1], min[2]],
      [max[0], max[1], min[2]],
      [min[0], max[1], min[2]],
      [min[0], min[1], max[2]],
      [max[0], min[1], max[2]],
      [max[0], max[1], max[2]],
      [min[0], max[1], max[2]],
    ];
    const edges = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 4],
      [0, 4],
      [1, 5],
      [2, 6],
      [3, 7],
    ] as const;
    for (const [index, edge] of edges.entries()) {
      chassis.add(
        rod(
          `Diagnostic_ChassisEdge_${index}`,
          corners[edge[0]]!,
          corners[edge[1]]!,
          thickness,
          0x55ff77,
          'diagnostic.vehicle.chassis',
        ),
      );
    }
    overlay.add(chassis);
  }
  if (descriptor.supportPlaneY !== undefined) {
    const plane = new THREE.Group();
    plane.name = 'Diagnostic_SupportPlane';
    tagDiagnostic(plane, 'diagnostic.vehicle.support-plane');
    const halfX =
      Math.max(
        1,
        ...(descriptor.chassisBox
          ? [Math.abs(descriptor.chassisBox.min[0]), Math.abs(descriptor.chassisBox.max[0])]
          : []),
        ...descriptor.wheels.map((wheel) => Math.abs(wheel.center[0]) + wheel.radius),
      ) + 0.2;
    const halfZ =
      Math.max(
        0.8,
        ...(descriptor.chassisBox
          ? [Math.abs(descriptor.chassisBox.min[2]), Math.abs(descriptor.chassisBox.max[2])]
          : []),
        ...descriptor.wheels.map((wheel) => Math.abs(wheel.center[2]) + wheel.width / 2),
      ) + 0.2;
    const y = descriptor.supportPlaneY;
    const planeLines: Array<[[number, number, number], [number, number, number]]> = [
      [
        [-halfX, y, -halfZ],
        [halfX, y, -halfZ],
      ],
      [
        [halfX, y, -halfZ],
        [halfX, y, halfZ],
      ],
      [
        [halfX, y, halfZ],
        [-halfX, y, halfZ],
      ],
      [
        [-halfX, y, halfZ],
        [-halfX, y, -halfZ],
      ],
      [
        [-halfX, y, 0],
        [halfX, y, 0],
      ],
      [
        [0, y, -halfZ],
        [0, y, halfZ],
      ],
    ];
    for (const [index, [start, end]] of planeLines.entries()) {
      plane.add(
        rod(
          `Diagnostic_SupportLine_${index}`,
          start,
          end,
          thickness * 0.7,
          0x66ffff,
          'diagnostic.vehicle.support-plane',
        ),
      );
    }
    overlay.add(plane);
  }
  return overlay;
}

function compositeForCapture(root: THREE.Object3D, overlay: THREE.Object3D): unknown {
  if (root.matrixAutoUpdate === false) {
    overlay.matrix.copy(root.matrix);
    overlay.matrixAutoUpdate = false;
  } else {
    overlay.position.copy(root.position);
    overlay.quaternion.copy(root.quaternion);
    overlay.scale.copy(root.scale);
  }
  return {
    name: 'VehicleDiagnosticCaptureRoot',
    type: 'Group',
    visible: true,
    position: { x: 0, y: 0, z: 0 },
    quaternion: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
    children: [root, overlay],
  };
}

function selectWheelSectionRequest(
  requestValue: DiagnosticViewRequest,
  descriptor: VehicleDiagnosticDescriptorV1,
): DiagnosticViewRequest {
  const target =
    descriptor.wheels.find((wheel) => /right.*front|front.*right/i.test(wheel.id)) ??
    descriptor.wheels.find((wheel) => /right/i.test(wheel.id)) ??
    descriptor.wheels[0];
  if (!target?.id.startsWith('wheel.assembly.')) return requestValue;
  const suffix = target.id.replace(/[^a-zA-Z0-9.-]/g, '-');
  return {
    ...requestValue,
    id: `vehicle.wheel-section.${suffix}`,
    label: `Vehicle wheel section ${target.id}`,
    focusRolePrefixes: [target.id],
  };
}

/** Production capture for the exact final source scene. The source is only read; the
 *  metric overlay is rendered through a detached sibling with the same local transform. */
export function captureVehicleDiagnosticViews(
  root: THREE.Object3D,
  intent: AssetIntentV1,
  size = 256,
): VehicleCapturedDiagnosticV1[] {
  if (intent.category !== 'vehicle') return [];
  const descriptor = describeVehicleDiagnostics(root);
  const overlay = createVehicleDiagnosticOverlay(root, descriptor);
  const composite = compositeForCapture(root, overlay);
  const requests = planDiagnosticViews(intent).extra.filter(
    (value) => value.variant === 'vehicle-underbody' || value.variant === 'vehicle-wheel-section',
  );
  return requests.map((baseRequest) => {
    const requestValue =
      baseRequest.variant === 'vehicle-wheel-section'
        ? selectWheelSectionRequest(baseRequest, descriptor)
        : baseRequest;
    const frame = renderDiagnosticView(composite, requestValue, { size });
    return {
      id: frame.id,
      label: frame.label,
      cameraId: frame.camera.id as 'underside' | 'right',
      kind: requestValue.variant === 'vehicle-underbody' ? 'underbody' : 'wheel-section',
      buffer: 'semantic-overlay',
      width: frame.width,
      height: frame.height,
      png: frame.png,
      regions: frame.regions,
      descriptor,
    };
  });
}
