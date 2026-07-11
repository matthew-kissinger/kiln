import { describe, expect, test } from 'bun:test';
import { BoxGeometry, Group, Mesh, MeshStandardMaterial, PlaneGeometry } from 'three';
import { createAssetIntentV1, stampSemanticMetadataV1, type AssetCategory } from '../../contracts';
import { SIX_VIEWS } from '../raster';
import {
  GENERIC_DIAGNOSTIC_BUFFER_IDS,
  GENERIC_DIAGNOSTIC_CAMERAS,
  GENERIC_DIAGNOSTIC_REQUESTS,
  planDiagnosticViews,
  renderDiagnosticView,
  renderDiagnosticViews,
  type DiagnosticViewRequest,
} from '../diagnostic';

function intent(
  category: AssetCategory,
  materialMode: 'flatOptimized' | 'pbrRecipe' | 'texturedHero' = 'flatOptimized',
) {
  return createAssetIntentV1({
    category,
    qaProfile: `${category}.test`,
    material: { mode: materialMode },
  });
}

function semanticPart(name: string, role: string, position: [number, number, number]): Group {
  const part = new Group();
  part.name = name;
  part.position.set(...position);
  stampSemanticMetadataV1(part, { roles: [role] });
  const mesh = new Mesh(
    new BoxGeometry(1, 1, 1),
    new MeshStandardMaterial({ color: role.startsWith('roof.') ? 0xb54a42 : 0x4f83cc }),
  );
  mesh.name = `${name}Mesh`;
  part.add(mesh);
  return part;
}

function fixtureScene(): Group {
  const root = new Group();
  root.name = 'Asset';
  root.position.set(0.25, 0.5, -0.15);
  root.rotation.y = 0.12;
  root.add(semanticPart('Chassis', 'chassis.main', [0, 0.5, 0]));
  root.add(semanticPart('WheelFrontLeft', 'wheel.front-left', [0.5, 0, 0.9]));
  root.add(semanticPart('Roof', 'roof.slope.left', [0, 1.5, 0]));
  root.updateMatrixWorld(true);
  return root;
}

function sourceFingerprint(root: Group): string {
  const nodes: unknown[] = [];
  root.traverse((node) => {
    const mesh = node as Mesh;
    const materials = mesh.isMesh
      ? (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).map((material) => {
          const color = (material as { color?: { toArray(): number[] } }).color;
          return { visible: material.visible, color: color?.toArray() };
        })
      : undefined;
    nodes.push({
      name: node.name,
      visible: node.visible,
      position: node.position.toArray(),
      quaternion: node.quaternion.toArray(),
      scale: node.scale.toArray(),
      matrix: node.matrix.toArray(),
      matrixWorld: node.matrixWorld.toArray(),
      userData: node.userData,
      materials,
    });
  });
  return JSON.stringify(nodes);
}

describe('QA-018 deterministic generic diagnostic buffers', () => {
  test('uses the unchanged six named cameras and stable request IDs', () => {
    expect(GENERIC_DIAGNOSTIC_CAMERAS).toHaveLength(6);
    expect(GENERIC_DIAGNOSTIC_CAMERAS.map(({ name, dir }) => ({ name, dir }))).toEqual(SIX_VIEWS);
    expect(GENERIC_DIAGNOSTIC_REQUESTS).toHaveLength(30);
    expect(new Set(GENERIC_DIAGNOSTIC_REQUESTS.map((view) => view.id)).size).toBe(30);
    expect(GENERIC_DIAGNOSTIC_REQUESTS.slice(0, 5).map((view) => view.id)).toEqual(
      GENERIC_DIAGNOSTIC_BUFFER_IDS.map((buffer) => `generic.front.${buffer}`),
    );
    expect(Object.isFrozen(GENERIC_DIAGNOSTIC_CAMERAS)).toBe(true);
    expect(Object.isFrozen(GENERIC_DIAGNOSTIC_CAMERAS[0]!.dir)).toBe(true);
  });

  test('renders all five buffers byte-deterministically from one named camera', () => {
    const root = fixtureScene();
    const requests = GENERIC_DIAGNOSTIC_REQUESTS.filter((view) => view.cameraId === 'front');
    const first = renderDiagnosticViews(root, requests, { size: 64 });
    const second = renderDiagnosticViews(root, requests, { size: 64 });

    expect(first.map((frame) => frame.id)).toEqual(requests.map((view) => view.id));
    for (let index = 0; index < first.length; index++) {
      expect(first[index]!.camera).toBe(GENERIC_DIAGNOSTIC_CAMERAS[0]!);
      expect(first[index]!.rgb).toEqual(second[index]!.rgb);
      expect(first[index]!.png.equals(second[index]!.png)).toBe(true);
      expect(first[index]!.png.subarray(1, 4).toString()).toBe('PNG');
    }
    expect(new Set(first.map((frame) => Buffer.from(frame.rgb).toString('base64'))).size).toBe(5);
  });

  test('localizes semantic overlays to stable node paths and pixel bounds', () => {
    const root = fixtureScene();
    const overlayRequest = GENERIC_DIAGNOSTIC_REQUESTS.find(
      (view) => view.id === 'generic.right.semantic-overlay',
    )!;
    const frame = renderDiagnosticView(root, overlayRequest, { size: 80 });
    const chassis = frame.regions.find((region) => region.nodeName === 'ChassisMesh');
    const wheel = frame.regions.find((region) => region.nodeName === 'WheelFrontLeftMesh');

    expect(chassis?.nodePath).toBe('Asset[0]/Chassis[0]/ChassisMesh[0]');
    expect(wheel?.nodePath).toBe('Asset[0]/WheelFrontLeft[1]/WheelFrontLeftMesh[0]');
    // Roles stamped on semantic parent groups address their rendered descendants.
    expect(chassis?.semanticRoles).toEqual(['chassis.main']);
    expect(wheel?.semanticRoles).toEqual(['wheel.front-left']);
    for (const region of frame.regions) {
      const [minX, minY, maxX, maxY] = region.pixelBounds;
      expect(minX).toBeGreaterThanOrEqual(0);
      expect(minY).toBeGreaterThanOrEqual(0);
      expect(maxX).toBeLessThan(80);
      expect(maxY).toBeLessThan(80);
      expect(maxX).toBeGreaterThanOrEqual(minX);
      expect(maxY).toBeGreaterThanOrEqual(minY);
      expect(region.triangleCount).toBeGreaterThan(0);
    }
  });

  test('colors inherited semantic overlays by the most-specific rendered role', () => {
    const root = new Group();
    root.name = 'Vehicle';
    stampSemanticMetadataV1(root, { roles: ['vehicle.frame'] });

    const tire = semanticPart('Tire', 'wheel.tire.right.front', [0, 0, 0]);
    const hub = semanticPart('Hub', 'wheel.hub.right.front', [0, 0, 0.1]);
    root.add(tire, hub);

    const overlayRequest = GENERIC_DIAGNOSTIC_REQUESTS.find(
      (view) => view.id === 'generic.right.semantic-overlay',
    )!;
    const frame = renderDiagnosticView(root, overlayRequest, { size: 80 });
    const tireRegion = frame.regions.find((region) => region.nodeName === 'TireMesh');
    const hubRegion = frame.regions.find((region) => region.nodeName === 'HubMesh');

    expect(tireRegion?.semanticRoles).toEqual(['vehicle.frame', 'wheel.tire.right.front']);
    expect(hubRegion?.semanticRoles).toEqual(['vehicle.frame', 'wheel.hub.right.front']);
    expect(tireRegion?.color).not.toEqual(hubRegion?.color);
  });

  test('shows explicit backfaces and ground contact in their dedicated buffers', () => {
    const reversed = new Group();
    reversed.name = 'Reversed';
    const planeGeometry = new PlaneGeometry(1, 1);
    planeGeometry.rotateY(-Math.PI / 2);
    const plane = new Mesh(planeGeometry, new MeshStandardMaterial({ color: 0xffffff }));
    plane.name = 'BackFacingPlane';
    reversed.add(plane);
    const normals = renderDiagnosticView(
      reversed,
      GENERIC_DIAGNOSTIC_REQUESTS.find((view) => view.id === 'generic.front.normals-backface')!,
      { size: 48 },
    );
    let redPixels = 0;
    for (let index = 0; index < normals.rgb.length; index += 3) {
      if (
        normals.rgb[index] === 238 &&
        normals.rgb[index + 1] === 48 &&
        normals.rgb[index + 2] === 64
      ) {
        redPixels++;
      }
    }
    expect(redPixels).toBeGreaterThan(0);

    const grounded = new Group();
    const box = new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial());
    box.position.y = 0.5;
    grounded.add(box);
    const contact = renderDiagnosticView(
      grounded,
      GENERIC_DIAGNOSTIC_REQUESTS.find((view) => view.id === 'generic.front.depth-contact')!,
      { size: 64 },
    );
    let contactPixels = 0;
    for (let index = 0; index < contact.rgb.length; index += 3) {
      if (
        contact.rgb[index] === 58 &&
        contact.rgb[index + 1] === 220 &&
        contact.rgb[index + 2] === 126
      ) {
        contactPixels++;
      }
    }
    expect(contactPixels).toBeGreaterThan(0);
  });
});

describe('QA-019 additive category diagnostic profiles', () => {
  test('selects required extras without changing the generic six or their buffers', () => {
    const expected: Record<AssetCategory, string[]> = {
      prop: [],
      vfx: [],
      environment: [],
      architecture: [
        'architecture.gable.positive',
        'architecture.gable.negative',
        'architecture.cutaway.plan',
        'architecture.cutaway.dollhouse',
        'architecture.portal.eye',
      ],
      character: ['character.skeleton.front', 'character.skeleton.right'],
      vehicle: ['vehicle.underbody', 'vehicle.wheel-section.right'],
      vegetation: ['vegetation.canopy-underside'],
    };
    for (const category of Object.keys(expected) as AssetCategory[]) {
      const plan = planDiagnosticViews(intent(category));
      expect(plan.category).toBe(category);
      expect(plan.qaProfile).toBe(`${category}.test`);
      expect(plan.generic).toBe(GENERIC_DIAGNOSTIC_REQUESTS);
      expect(plan.genericCameraIds).toEqual([
        'front',
        'right',
        'back',
        'left',
        'top',
        'three-quarter',
      ]);
      expect(plan.extra.map((view) => view.id)).toEqual(expected[category]);
    }
  });

  test('requests deterministic motion phases, underside, wheel section, and grazing light', () => {
    const character = planDiagnosticViews(
      createAssetIntentV1({
        category: 'character',
        character: {
          bodyPlan: 'biped',
          grounded: true,
          locomotion: 'walk',
          clips: [{ name: 'Walk', playback: 'loop' }],
        },
      }),
    );
    const motion = character.extra.filter((view) => view.variant === 'character-motion-strip');
    expect(motion.map((view) => view.id)).toEqual([
      'character.motion-strip.front.walk',
      'character.motion-strip.right.walk',
    ]);
    expect(motion.every((view) => view.phaseFractions?.join(',') === '0,0.2,0.4,0.6,0.8,1')).toBe(
      true,
    );

    const vegetation = planDiagnosticViews(intent('vegetation'));
    expect(
      vegetation.extra.find((view) => view.id === 'vegetation.canopy-underside')?.cameraId,
    ).toBe('underside');

    const vehicle = planDiagnosticViews(intent('vehicle'));
    expect(vehicle.extra.find((view) => view.id === 'vehicle.underbody')?.cameraId).toBe(
      'underside',
    );
    expect(
      vehicle.extra.find((view) => view.id === 'vehicle.wheel-section.right')?.focusRolePrefixes,
    ).toEqual(['wheel.', 'axle.', 'hub.', 'tire.']);

    const materialPlan = planDiagnosticViews(intent('prop', 'pbrRecipe'));
    expect(materialPlan.extra.map((view) => view.id)).toEqual(['material.grazing-light']);
  });

  test('binds both gable elevations to the trusted ridge axis and keeps non-gables separate', () => {
    const ridgeZ = createAssetIntentV1({
      category: 'architecture',
      architecture: { roof: { ridgeAxis: 'z' } },
    });
    const ridgeZPlan = planDiagnosticViews(ridgeZ);
    expect(
      ridgeZPlan.extra.find((view) => view.id === 'architecture.gable.positive')?.cameraId,
    ).toBe('right');
    expect(
      ridgeZPlan.extra.find((view) => view.id === 'architecture.gable.negative')?.cameraId,
    ).toBe('left');

    const bridge = createAssetIntentV1({
      category: 'architecture',
      architecture: {
        subtype: 'bridge',
        enterable: false,
        roof: { type: 'none', rise: 0, pitchDegrees: 0, closedEnds: false },
      },
    });
    const bridgeIds = planDiagnosticViews(bridge).extra.map((view) => view.id);
    expect(bridgeIds).not.toContain('architecture.gable.positive');
    expect(bridgeIds).not.toContain('architecture.gable.negative');
    expect(bridgeIds).not.toContain('architecture.portal.eye');
  });

  test('renders a semantic roof-off cutaway without mutating the source scene', () => {
    const root = fixtureScene();
    // A spoofed model-authored category cannot influence trusted intent selection.
    root.userData.category = 'vehicle';
    const before = sourceFingerprint(root);
    const plan = planDiagnosticViews(intent('architecture', 'pbrRecipe'));
    expect(plan.extra.map((view) => view.id)).toEqual([
      'architecture.gable.positive',
      'architecture.gable.negative',
      'architecture.cutaway.plan',
      'architecture.cutaway.dollhouse',
      'architecture.portal.eye',
      'material.grazing-light',
    ]);

    const frame = renderDiagnosticView(
      root,
      plan.extra.find((view) => view.id === 'architecture.cutaway.dollhouse')!,
      { size: 72 },
    );
    expect(frame.regions.some((region) => region.semanticRoles.includes('roof.slope.left'))).toBe(
      false,
    );
    expect(frame.regions.some((region) => region.semanticRoles.includes('chassis.main'))).toBe(
      true,
    );
    expect(sourceFingerprint(root)).toBe(before);
  });

  test('grazing-light rendering is deterministic and keeps a stable custom camera', () => {
    const root = fixtureScene();
    const grazingRequest = planDiagnosticViews(intent('prop', 'texturedHero')).extra[0];
    const actual = planDiagnosticViews(intent('vehicle', 'pbrRecipe')).extra.find(
      (view) => view.id === 'material.grazing-light',
    )!;
    expect(grazingRequest?.id).toBe('material.grazing-light');
    const first = renderDiagnosticView(root, actual, { size: 48 });
    const second = renderDiagnosticView(root, actual, { size: 48 });
    expect(first.variant).toBe('material-grazing-light');
    expect(first.camera.id).toBe('grazing');
    expect(first.rgb).toEqual(second.rgb);
    expect(first.png.equals(second.png)).toBe(true);
  });

  test('rejects an unregistered camera rather than silently changing evidence', () => {
    const invalid: DiagnosticViewRequest = {
      id: 'invalid.camera',
      label: 'Invalid',
      cameraId: 'model-invented-camera',
      buffer: 'silhouette-unlit',
      scope: 'generic',
    };
    expect(() => renderDiagnosticView(fixtureScene(), invalid)).toThrow(
      'Unknown diagnostic camera',
    );
  });
});
