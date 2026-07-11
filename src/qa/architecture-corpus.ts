import * as THREE from 'three';

import {
  createAssetIntentV1,
  stampSemanticMetadataV1,
  type AssetIntentV1,
  type ArchitectureIntentV1Input,
} from '../contracts';

export type ArchitectureCorpusKind = 'failure' | 'control' | 'false-positive';

export interface ArchitectureCorpusPayload {
  intent: AssetIntentV1;
  scene: THREE.Object3D;
}

export interface ArchitectureCorpusDescriptor {
  id: string;
  kind: ArchitectureCorpusKind;
  description: string;
  pairId?: string;
  expectedPrimaryCode?: string;
  forbiddenCodes: readonly string[];
  build: () => ArchitectureCorpusPayload;
}

export interface ArchitectureCorpusFixtureOptions {
  ridgeAxis?: 'x' | 'z';
  panelAxis?: 'correct' | 'rotated-90' | 'none';
  sameFacing?: boolean;
  gables?: 'complete' | 'missing' | 'sparse';
  ridgeGap?: number;
  envelopeGap?: number;
  sealedPortal?: boolean;
  sealedBox?: boolean;
  overhang?: number;
  pavilion?: boolean;
  stylized?: boolean;
}

const CANONICAL_ARCHITECTURE_CODES = Object.freeze([
  'ARCH_ROOF_AXIS',
  'ARCH_OPEN_GABLE',
  'ARCH_RIDGE_GAP',
  'ARCH_ENVELOPE_GAP',
  'ARCH_BLOCKED_PORTAL',
]);

function semantic<T extends THREE.Object3D>(node: T, role: string): T {
  return stampSemanticMetadataV1(node, { roles: [role] });
}

function part(
  root: THREE.Object3D,
  name: string,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  role: string,
  position: [number, number, number],
  rotation: [number, number, number] = [0, 0, 0],
): THREE.Mesh {
  const mesh = semantic(new THREE.Mesh(geometry, material), role);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  root.add(mesh);
  return mesh;
}

function gableGeometry(span: number, rise: number): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute([0, 0, -span / 2, 0, 0, span / 2, 0, rise, 0], 3),
  );
  geometry.setIndex([0, 1, 2]);
  geometry.computeVertexNormals();
  return geometry;
}

export function buildArchitectureCorpusFixture(
  options: ArchitectureCorpusFixtureOptions = {},
): ArchitectureCorpusPayload {
  const stylized = options.stylized === true;
  const pavilion = options.pavilion === true;
  const ridgeAxis = options.ridgeAxis ?? 'x';
  const spanX = stylized ? 0.8 : 6;
  const spanZ = stylized ? 0.7 : 4;
  const wallHeight = stylized ? 0.8 : 3;
  const rise = stylized ? 0.35 : 1.5;
  const overhang = options.overhang ?? (stylized ? 0.08 : 0.3);
  const portal = stylized
    ? { width: 0.25, height: 0.5, depth: 0.06 }
    : { width: 1.1, height: 2.1, depth: 0.15 };
  const halfRun = (ridgeAxis === 'x' ? spanZ : spanX) / 2;
  const pitch = Math.atan2(rise, halfRun);
  const architecture: ArchitectureIntentV1Input = {
    subtype: pavilion ? 'open pavilion' : 'gable building',
    enterable: !pavilion && !stylized,
    footprint: { spanX, spanZ, units: 'm' },
    wallHeight,
    scaleMode: stylized ? 'stylized' : 'realistic',
    roof: {
      type: 'gable',
      ridgeAxis,
      rise,
      pitchDegrees: THREE.MathUtils.radToDeg(pitch),
      overhang,
      closedEnds: !pavilion,
    },
    ...(!pavilion && !stylized ? { portal } : {}),
  };
  const intent = createAssetIntentV1({ category: 'architecture', architecture });
  const root = semantic(new THREE.Group(), 'architecture.shell.gable');
  root.name = `ArchitectureCorpus_${ridgeAxis}`;
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xc8ad82 });
  const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x59616d });
  const markerMaterial = new THREE.MeshStandardMaterial({ color: 0x39424d });
  const thickness = stylized ? 0.03 : 0.15;
  const roofThickness = stylized ? 0.02 : 0.06;

  if (!pavilion) {
    part(
      root,
      'Floor',
      new THREE.BoxGeometry(spanX, stylized ? 0.03 : 0.08, spanZ),
      wallMaterial,
      'floor',
      [0, stylized ? 0.015 : 0.04, 0],
    );

    const addFullWall = (
      name: string,
      role: string,
      size: [number, number, number],
      position: [number, number, number],
    ): void => {
      part(root, name, new THREE.BoxGeometry(...size), wallMaterial, role, position);
    };
    addFullWall(
      'WallBack',
      'wall.back',
      [thickness, wallHeight, spanZ],
      [-spanX / 2, wallHeight / 2, 0],
    );
    addFullWall(
      'WallLeft',
      'wall.left',
      [spanX, wallHeight, thickness],
      [0, wallHeight / 2, -spanZ / 2],
    );
    addFullWall(
      'WallRight',
      'wall.right',
      [spanX, wallHeight, thickness],
      [0, wallHeight / 2, spanZ / 2],
    );

    if (!stylized && options.sealedBox) {
      addFullWall(
        'WallFrontSolid',
        'wall.front',
        [thickness, wallHeight, spanZ],
        [spanX / 2, wallHeight / 2, 0],
      );
    } else if (!stylized) {
      const sideWidth = (spanZ - portal.width) / 2;
      const sideOffset = portal.width / 2 + sideWidth / 2;
      addFullWall(
        'WallFrontLeft',
        'wall.front',
        [thickness, wallHeight, sideWidth],
        [spanX / 2, wallHeight / 2, -sideOffset],
      );
      addFullWall(
        'WallFrontRight',
        'wall.front',
        [thickness, wallHeight, sideWidth],
        [spanX / 2, wallHeight / 2, sideOffset],
      );
      const lintelHeight = wallHeight - portal.height;
      addFullWall(
        'WallFrontLintel',
        'wall.front',
        [thickness, lintelHeight, portal.width],
        [spanX / 2, portal.height + lintelHeight / 2, 0],
      );
      const opening = semantic(new THREE.Object3D(), 'opening.front.door');
      opening.name = 'Opening_front_door';
      opening.position.set(spanX / 2, portal.height / 2, 0);
      opening.scale.set(portal.depth, portal.height, portal.width);
      root.add(opening);
      if (options.sealedPortal) {
        part(
          root,
          'PaintedDoorOnSolidOpening',
          new THREE.BoxGeometry(portal.depth, portal.height, portal.width),
          markerMaterial,
          'door.painted',
          [spanX / 2, portal.height / 2, 0],
        );
      }
    } else {
      addFullWall(
        'WallFront',
        'wall.front',
        [thickness, wallHeight, spanZ],
        [spanX / 2, wallHeight / 2, 0],
      );
    }
  }

  const ridgeSpan = (ridgeAxis === 'x' ? spanX : spanZ) + overhang * 2;
  const totalRun = halfRun + overhang;
  const totalDrop = Math.tan(pitch) * totalRun;
  const slopeLength = totalRun / Math.cos(pitch);
  const centerY = wallHeight + rise - totalDrop / 2 + (options.envelopeGap ?? 0);
  const positiveLateral = totalRun / 2 + (options.ridgeGap ?? 0);
  const negativeLateral = -totalRun / 2 - (options.ridgeGap ?? 0);
  const slopeGeometry =
    ridgeAxis === 'x'
      ? new THREE.BoxGeometry(ridgeSpan, roofThickness, slopeLength)
      : new THREE.BoxGeometry(slopeLength, roofThickness, ridgeSpan);
  const positivePosition: [number, number, number] =
    ridgeAxis === 'x' ? [0, centerY, positiveLateral] : [positiveLateral, centerY, 0];
  const negativePosition: [number, number, number] =
    ridgeAxis === 'x' ? [0, centerY, negativeLateral] : [negativeLateral, centerY, 0];
  const positiveRotation: [number, number, number] =
    ridgeAxis === 'x' ? [pitch, 0, 0] : [0, 0, -pitch];
  const negativeRotation: [number, number, number] = options.sameFacing
    ? positiveRotation
    : ridgeAxis === 'x'
      ? [-pitch, 0, 0]
      : [0, 0, pitch];
  part(
    root,
    'SlopePositive',
    slopeGeometry,
    roofMaterial,
    'roof.slope.positive',
    positivePosition,
    positiveRotation,
  );
  part(
    root,
    'SlopeNegative',
    slopeGeometry.clone(),
    roofMaterial,
    'roof.slope.negative',
    negativePosition,
    negativeRotation,
  );

  if (!pavilion && options.gables !== 'missing') {
    const scale = options.gables === 'sparse' ? 0.3 : 1;
    const lateralSpan = (ridgeAxis === 'x' ? spanZ : spanX) * scale;
    const gableRise = rise * scale;
    const gable = gableGeometry(lateralSpan, gableRise);
    const positiveEnd: [number, number, number] =
      ridgeAxis === 'x' ? [spanX / 2, wallHeight, 0] : [0, wallHeight, spanZ / 2];
    const negativeEnd: [number, number, number] =
      ridgeAxis === 'x' ? [-spanX / 2, wallHeight, 0] : [0, wallHeight, -spanZ / 2];
    const gableRotation: [number, number, number] =
      ridgeAxis === 'x' ? [0, 0, 0] : [0, Math.PI / 2, 0];
    part(
      root,
      'GablePositive',
      gable,
      wallMaterial,
      'roof.gable.positive',
      positiveEnd,
      gableRotation,
    );
    part(
      root,
      'GableNegative',
      gable.clone(),
      wallMaterial,
      'roof.gable.negative',
      negativeEnd,
      gableRotation,
    );
  }

  if (options.panelAxis && options.panelAxis !== 'none') {
    const correct = options.panelAxis === 'correct';
    const panelRidge = correct ? Math.min(0.7, ridgeSpan * 0.2) : slopeLength * 0.75;
    const panelDownhill = correct ? slopeLength * 0.75 : Math.min(0.7, slopeLength * 0.25);
    const panelGeometry =
      ridgeAxis === 'x'
        ? new THREE.BoxGeometry(panelRidge, roofThickness / 2, panelDownhill)
        : new THREE.BoxGeometry(panelDownhill, roofThickness / 2, panelRidge);
    part(
      root,
      'RoofPanelPositive',
      panelGeometry,
      roofMaterial,
      'roof.panel.positive',
      positivePosition,
      positiveRotation,
    );
    part(
      root,
      'RoofPanelNegative',
      panelGeometry.clone(),
      roofMaterial,
      'roof.panel.negative',
      negativePosition,
      negativeRotation,
    );
  }

  root.updateMatrixWorld(true);
  return { intent, scene: root };
}

function buildNonGableControl(
  subtype: 'bridge' | 'shed' | 'hip-roof building',
  roofType: 'none' | 'shed' | 'hip',
): ArchitectureCorpusPayload {
  const spanX = subtype === 'bridge' ? 12 : 6;
  const spanZ = subtype === 'bridge' ? 3 : 5;
  const wallHeight = subtype === 'bridge' ? 1.2 : 3;
  const intent = createAssetIntentV1({
    category: 'architecture',
    architecture: {
      subtype,
      enterable: false,
      footprint: { spanX, spanZ, units: 'm' },
      wallHeight,
      roof: { type: roofType, closedEnds: false },
    },
  });
  const root = semantic(new THREE.Group(), `architecture.${subtype.replaceAll(' ', '-')}`);
  root.name = `ArchitectureControl_${roofType}`;
  const wall = new THREE.MeshStandardMaterial({ color: 0xa58e71 });
  const roof = new THREE.MeshStandardMaterial({ color: 0x4f5965 });
  part(
    root,
    subtype === 'bridge' ? 'BridgeDeck' : 'Floor',
    new THREE.BoxGeometry(spanX, 0.12, spanZ),
    wall,
    subtype === 'bridge' ? 'bridge.deck' : 'floor',
    [0, 0.06, 0],
  );
  if (subtype === 'bridge') {
    for (const side of [-1, 1] as const) {
      part(
        root,
        `BridgeRail_${side}`,
        new THREE.BoxGeometry(spanX, 1, 0.08),
        wall,
        'bridge.railing',
        [0, 0.55, side * (spanZ / 2)],
      );
    }
  } else {
    part(root, 'WallFront', new THREE.BoxGeometry(0.15, wallHeight, spanZ), wall, 'wall.front', [
      spanX / 2,
      wallHeight / 2,
      0,
    ]);
    part(root, 'WallBack', new THREE.BoxGeometry(0.15, wallHeight, spanZ), wall, 'wall.back', [
      -spanX / 2,
      wallHeight / 2,
      0,
    ]);
    if (roofType === 'shed') {
      part(
        root,
        'ShedRoofSurface',
        new THREE.BoxGeometry(spanX + 0.6, 0.08, spanZ + 0.6),
        roof,
        'roof.shed.surface',
        [0, wallHeight + 0.45, 0],
        [0.12, 0, 0],
      );
    } else {
      for (const side of ['front', 'back', 'left', 'right'] as const) {
        part(
          root,
          `HipRoof_${side}`,
          new THREE.BoxGeometry(spanX * 0.55, 0.08, spanZ * 0.55),
          roof,
          `roof.hip.${side}`,
          [0, wallHeight + 0.65, 0],
          [
            side === 'front' ? 0.18 : side === 'back' ? -0.18 : 0,
            0,
            side === 'left' ? 0.18 : side === 'right' ? -0.18 : 0,
          ],
        );
      }
    }
  }
  root.updateMatrixWorld(true);
  return { intent, scene: root };
}

function buildPorchIntersectionControl(): ArchitectureCorpusPayload {
  const payload = buildArchitectureCorpusFixture();
  const porchMaterial = new THREE.MeshStandardMaterial({ color: 0x59616d });
  part(
    payload.scene,
    'PorchRoofIntersection',
    new THREE.BoxGeometry(2.4, 0.08, 1.5),
    porchMaterial,
    'roof.porch.intersection',
    [2.8, 2.45, 1.8],
    [0.08, 0, -0.12],
  );
  payload.scene.updateMatrixWorld(true);
  return payload;
}

const failure = (
  id: string,
  pairId: string,
  description: string,
  code: string,
  options: ArchitectureCorpusFixtureOptions,
): ArchitectureCorpusDescriptor => ({
  id,
  kind: 'failure',
  pairId,
  description,
  expectedPrimaryCode: code,
  forbiddenCodes: [],
  build: () => buildArchitectureCorpusFixture(options),
});

const control = (
  id: string,
  pairId: string,
  description: string,
  options: ArchitectureCorpusFixtureOptions = {},
): ArchitectureCorpusDescriptor => ({
  id,
  kind: 'control',
  pairId,
  description,
  forbiddenCodes: CANONICAL_ARCHITECTURE_CODES,
  build: () => buildArchitectureCorpusFixture(options),
});

export const ARCHITECTURE_REGRESSION_CORPUS = Object.freeze([
  failure(
    'roof-panels-rotated-90',
    'roof-panels-axis-control',
    'Individual roof panels run along the ridge instead of ridge-to-eave.',
    'ARCH_ROOF_AXIS',
    { panelAxis: 'rotated-90' },
  ),
  control(
    'roof-panels-axis-control',
    'roof-panels-rotated-90',
    'Equivalent panels run in the declared roof-local downhill direction.',
    { panelAxis: 'correct' },
  ),
  failure(
    'same-facing-slopes',
    'opposing-slopes-control',
    'Both slopes use the same downhill frame instead of mirroring.',
    'ARCH_ROOF_AXIS',
    { sameFacing: true },
  ),
  control(
    'opposing-slopes-control',
    'same-facing-slopes',
    'The two slope normals have opposite lateral components.',
  ),
  failure(
    'missing-gables',
    'complete-gables-control',
    'closedEnds=true has neither semantic gable closure.',
    'ARCH_OPEN_GABLE',
    { gables: 'missing' },
  ),
  control(
    'complete-gables-control',
    'missing-gables',
    'Both gable boundaries cover the full wall-top-to-ridge cross-section.',
  ),
  failure(
    'sparse-gables',
    'dense-gables-control',
    'Tagged end panels cover only a small central triangle.',
    'ARCH_OPEN_GABLE',
    { gables: 'sparse' },
  ),
  control(
    'dense-gables-control',
    'sparse-gables',
    'Equivalent tagged end panels cover the requested boundaries.',
  ),
  failure(
    'ridge-gap',
    'ridge-contact-control',
    'Both slope high edges are displaced away from the ridge.',
    'ARCH_RIDGE_GAP',
    { ridgeGap: 0.14 },
  ),
  control(
    'ridge-contact-control',
    'ridge-gap',
    'Equivalent slope high edges share the ridge within tolerance.',
  ),
  failure(
    'wall-roof-gap',
    'wall-roof-contact-control',
    'The complete roof is lifted above the wall bearing line.',
    'ARCH_ENVELOPE_GAP',
    { envelopeGap: 0.18 },
  ),
  control(
    'wall-roof-contact-control',
    'wall-roof-gap',
    'Equivalent wall-top samples meet the roof underside.',
  ),
  failure(
    'sealed-doorway',
    'clear-portal-control',
    'A painted door mesh occupies the requested portal clearance.',
    'ARCH_BLOCKED_PORTAL',
    { sealedPortal: true },
  ),
  control(
    'clear-portal-control',
    'sealed-doorway',
    'The semantic clearance prism connects exterior to interior.',
  ),
  failure(
    'sealed-enterable-box',
    'clear-box-portal-control',
    'An enterable sealed box has no semantic or geometric portal.',
    'ARCH_BLOCKED_PORTAL',
    { sealedBox: true },
  ),
  control(
    'clear-box-portal-control',
    'sealed-enterable-box',
    'Equivalent architecture has a real exterior-to-interior clearance prism.',
  ),
  {
    id: 'valid-large-overhang',
    kind: 'false-positive',
    description: 'A large overhang still meets the wall at the bearing line.',
    forbiddenCodes: CANONICAL_ARCHITECTURE_CODES,
    build: () => buildArchitectureCorpusFixture({ overhang: 0.9 }),
  },
  {
    id: 'intentional-open-pavilion',
    kind: 'false-positive',
    description: 'An explicit open pavilion has no walls or closed end requirement.',
    forbiddenCodes: ['ARCH_OPEN_GABLE', 'ARCH_ENVELOPE_GAP', 'ARCH_BLOCKED_PORTAL'],
    build: () => buildArchitectureCorpusFixture({ pavilion: true }),
  },
  {
    id: 'explicit-stylized-scale',
    kind: 'false-positive',
    description: 'Explicit stylized scale suppresses realistic dimension-band observations.',
    forbiddenCodes: [
      'ARCH_SCALE_CEILING_HEIGHT',
      'ARCH_SCALE_FOOTPRINT_X',
      'ARCH_SCALE_FOOTPRINT_Z',
      'ARCH_SCALE_DOOR_WIDTH',
      'ARCH_SCALE_DOOR_HEIGHT',
      'ARCH_SCALE_WALL_THICKNESS',
    ],
    build: () => buildArchitectureCorpusFixture({ stylized: true }),
  },
  {
    id: 'roofless-bridge-control',
    kind: 'false-positive',
    description: 'A roofless bridge has no gable, ridge, closure, or portal contract to enforce.',
    forbiddenCodes: CANONICAL_ARCHITECTURE_CODES,
    build: () => buildNonGableControl('bridge', 'none'),
  },
  {
    id: 'shed-roof-control',
    kind: 'false-positive',
    description: 'A declared shed roof is not misclassified as an incomplete gable.',
    forbiddenCodes: CANONICAL_ARCHITECTURE_CODES,
    build: () => buildNonGableControl('shed', 'shed'),
  },
  {
    id: 'hip-roof-control',
    kind: 'false-positive',
    description: 'A declared hip roof is not misclassified as an incomplete gable.',
    forbiddenCodes: CANONICAL_ARCHITECTURE_CODES,
    build: () => buildNonGableControl('hip-roof building', 'hip'),
  },
  {
    id: 'porch-roof-intersection-control',
    kind: 'false-positive',
    description: 'A correctly intersecting porch roof does not invalidate the complete main gable.',
    forbiddenCodes: CANONICAL_ARCHITECTURE_CODES,
    build: buildPorchIntersectionControl,
  },
] satisfies readonly ArchitectureCorpusDescriptor[]);
