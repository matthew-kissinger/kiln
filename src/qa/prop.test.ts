import { describe, expect, test } from 'bun:test';
import * as THREE from 'three';

import { createAssetIntentV1, stampSemanticMetadataV1 } from '../contracts';
import { buildPropEnvironmentSemanticGuidance } from './prop-environment-prompt';
import {
  evaluatePropArticulationQa,
  evaluatePropCircularAssemblyQa,
  evaluatePropContainerQa,
  evaluatePropScalePivotQa,
} from './prop';
import {
  evaluatePropHelperAblation,
  PROP_HELPER_ABLATION_MINIMUM_LIFT,
  type PropHelperAblationEvidenceV1,
} from './prop-helper-policy';
import type { QaContext } from './types';

const material = new THREE.MeshStandardMaterial({ color: '#777777' });

function mesh(name: string, size: [number, number, number], position: [number, number, number]) {
  const value = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  value.name = name;
  value.position.set(...position);
  return value;
}

function marker(
  name: string,
  role: string,
  position: [number, number, number],
  scale: [number, number, number],
) {
  const value = new THREE.Group();
  value.name = name;
  value.position.set(...position);
  value.scale.set(...scale);
  stampSemanticMetadataV1(value, { roles: [role] });
  return value;
}

function context(
  root: THREE.Object3D,
  options: {
    subtype?: string;
    capabilities?: Array<'articulated' | 'openable' | 'grounded'>;
    bounds?: { x?: number; y?: number; z?: number; units: 'm' };
    clips?: THREE.AnimationClip[];
    qaProfile?: string;
  } = {},
): QaContext {
  const intent = createAssetIntentV1({
    category: 'prop',
    subtype: options.subtype,
    capabilities: options.capabilities ?? [],
    bounds: options.bounds,
    qaProfile: options.qaProfile,
    animation: options.clips
      ? { clips: options.clips.map((clip) => clip.name), loop: false }
      : undefined,
  });
  return { intent, scene: root, clips: options.clips ?? [] };
}

function codes(findings: readonly { code: string }[]): string[] {
  return findings.map((finding) => finding.code);
}

function validHinge(): THREE.Group {
  const root = new THREE.Group();
  root.name = 'SemanticChest';
  root.add(mesh('StaticBody', [1, 0.8, 0.8], [-1.2, 0.4, 0]));
  const pivot = new THREE.Group();
  pivot.name = 'Joint_Lid';
  stampSemanticMetadataV1(pivot, {
    roles: ['prop.pivot.hinge.lid'],
    frames: [{ id: 'axis.+x', translation: [0, 0, 0], rotation: [0, 0, 0, 1] }],
  });
  const moving = mesh('Lid', [0.8, 0.12, 0.5], [0, 0.2, 0]);
  stampSemanticMetadataV1(moving, { roles: ['prop.motion.hinge.lid'] });
  pivot.add(moving);
  root.add(pivot, marker('LidSweep', 'prop.clearance.hinge.lid', [0, 0.6, 0], [1, 1, 1]));
  return root;
}

describe('PROP-002 articulated capability profile', () => {
  test('accepts a semantic hinge with pivot, axis, moving subtree, and clear sweep', () => {
    expect(
      evaluatePropArticulationQa(context(validHinge(), { capabilities: ['articulated'] })),
    ).toEqual([]);
  });

  test('localizes missing axis, wrong subtree, missing clearance, and blocked clearance', () => {
    const root = validHinge();
    const pivot = root.getObjectByName('Joint_Lid')!;
    stampSemanticMetadataV1(pivot, { roles: ['prop.pivot.hinge.lid'] });
    const moving = root.getObjectByName('Lid')!;
    root.attach(moving);
    const sweep = root.getObjectByName('LidSweep')!;
    root.remove(sweep);
    expect(
      codes(evaluatePropArticulationQa(context(root, { capabilities: ['articulated'] }))),
    ).toEqual([
      'PROP_ARTICULATION_AXIS_MISSING',
      'PROP_ARTICULATION_SUBTREE_INVALID',
      'PROP_ARTICULATION_CLEARANCE_MISSING',
    ]);

    const blocked = validHinge();
    blocked.add(mesh('SolidFiller', [0.3, 0.3, 0.3], [0, 0.6, 0]));
    expect(
      codes(evaluatePropArticulationQa(context(blocked, { capabilities: ['articulated'] }))),
    ).toContain('PROP_ARTICULATION_CLEARANCE_BLOCKED');
  });

  test('allows only explicitly declared stationary hinge support inside the sweep', () => {
    const root = validHinge();
    const body = root.getObjectByName('StaticBody')!;
    body.position.x = 0;
    stampSemanticMetadataV1(body, { roles: ['prop.articulation.support.lid'] });
    const pivot = root.getObjectByName('Joint_Lid')!;
    stampSemanticMetadataV1(pivot, {
      roles: ['prop.pivot.hinge.lid'],
      frames: [{ id: 'axis.+x', translation: [0, 0, 0], rotation: [0, 0, 0, 1] }],
      relationships: [
        {
          kind: 'mountedTo',
          target: 'prop.articulation.support.lid',
          targetType: 'role',
        },
      ],
    });
    expect(evaluatePropArticulationQa(context(root, { capabilities: ['articulated'] }))).toEqual(
      [],
    );

    root.add(mesh('UndeclaredFiller', [0.2, 0.2, 0.2], [0, 0.6, 0]));
    expect(
      codes(evaluatePropArticulationQa(context(root, { capabilities: ['articulated'] }))),
    ).toContain('PROP_ARTICULATION_CLEARANCE_BLOCKED');
  });

  test('preserves the narrow W5 Joint_Lid + Open-clip legacy fallback', () => {
    const root = new THREE.Group();
    root.name = 'PropControlAnimatedFieldChest';
    root.add(mesh('Mesh_Base', [1.3, 0.66, 0.78], [0, 0.33, 0]));
    const pivot = new THREE.Group();
    pivot.name = 'Joint_Lid';
    pivot.add(mesh('Mesh_Lid', [1.34, 0.16, 0.82], [0, 0.08, 0.39]));
    root.add(pivot);
    const clip = new THREE.AnimationClip('Open', 1, [
      new THREE.QuaternionKeyframeTrack(
        'Joint_Lid.quaternion',
        [0, 1],
        [0, 0, 0, 1, Math.SQRT1_2, 0, 0, Math.SQRT1_2],
      ),
    ]);
    const value = context(root, {
      subtype: 'field-chest',
      capabilities: ['grounded', 'articulated', 'openable'],
      clips: [clip],
      qaProfile: 'prop.legacy-control',
    });
    expect(evaluatePropArticulationQa(value)).toEqual([]);
    expect(evaluatePropContainerQa(value)).toEqual([]);

    const newOutput = context(root, {
      subtype: 'field-chest',
      capabilities: ['grounded', 'articulated', 'openable'],
      clips: [clip],
    });
    expect(codes(evaluatePropArticulationQa(newOutput))).toEqual(['PROP_ARTICULATION_MISSING']);
    expect(codes(evaluatePropContainerQa(newOutput))).toEqual(['PROP_CONTAINER_OPENING_MISSING']);
  });
});

describe('PROP-003 container negative-space profile', () => {
  function containerScene(blocked = false): THREE.Group {
    const root = new THREE.Group();
    root.name = 'OpenContainer';
    const shell = mesh('Shell', [1.2, 0.7, 0.8], [0, 0.35, 0]);
    stampSemanticMetadataV1(shell, { roles: ['prop.container.shell'] });
    root.add(
      shell,
      marker('Interior', 'prop.container.interior.main', [0, 0.4, 0], [0.8, 0.45, 0.5]),
      marker('Opening', 'prop.container.opening.main', [0, 0.72, 0], [0.8, 0.16, 0.5]),
    );
    if (blocked) root.add(mesh('SolidFiller', [0.6, 0.12, 0.35], [0, 0.72, 0]));
    return root;
  }

  test('accepts measurable interior/opening markers and rejects a solid filler', () => {
    expect(
      evaluatePropContainerQa(
        context(containerScene(), { subtype: 'open-container', capabilities: ['openable'] }),
      ),
    ).toEqual([]);
    expect(
      codes(
        evaluatePropContainerQa(
          context(containerScene(true), { subtype: 'open-container', capabilities: ['openable'] }),
        ),
      ),
    ).toContain('PROP_CONTAINER_OPENING_BLOCKED');
  });

  test('rejects missing or unusably thin negative space when semantic evidence is claimed', () => {
    const root = new THREE.Group();
    root.add(marker('Opening', 'prop.container.opening.main', [0, 0.5, 0], [0.5, 0.2, 0.5]));
    expect(
      codes(
        evaluatePropContainerQa(
          context(root, { subtype: 'open-container', capabilities: ['openable'] }),
        ),
      ),
    ).toContain('PROP_CONTAINER_INTERIOR_MISSING');
    root.add(marker('Interior', 'prop.container.interior.main', [0, 0.3, 0], [0.5, 0.02, 0.5]));
    expect(
      codes(
        evaluatePropContainerQa(
          context(root, { subtype: 'open-container', capabilities: ['openable'] }),
        ),
      ),
    ).toContain('PROP_CONTAINER_INTERIOR_UNUSABLE');
  });
});

describe('PROP-004/005 advisory evidence', () => {
  function ring(options: { missing?: boolean; radial?: boolean } = {}): THREE.Group {
    const root = new THREE.Group();
    root.name = 'Barrel';
    stampSemanticMetadataV1(root, { roles: ['prop.circular.assembly'] });
    const count = options.missing ? 7 : 8;
    for (let index = 0; index < count; index++) {
      const sourceIndex = options.missing && index >= 4 ? index + 1 : index;
      const angle = (sourceIndex / 8) * Math.PI * 2;
      const stave = mesh(`Stave_${index}`, [0.45, 1, 0.1], [Math.cos(angle), 0.5, Math.sin(angle)]);
      const desired = options.radial
        ? new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle))
        : new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle));
      stave.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), desired);
      stampSemanticMetadataV1(stave, { roles: [`prop.circular.member.${index}`] });
      root.add(stave);
    }
    return root;
  }

  test('finds incomplete and radial-vs-tangent rings but ignores arbitrary radial art', () => {
    expect(
      codes(
        evaluatePropCircularAssemblyQa(context(ring({ missing: true }), { subtype: 'barrel' })),
      ),
    ).toContain('PROP_CIRCULAR_RING_INCOMPLETE');
    expect(
      codes(evaluatePropCircularAssemblyQa(context(ring({ radial: true }), { subtype: 'barrel' }))),
    ).toContain('PROP_CIRCULAR_MEMBER_ORIENTATION');
    const art = ring({ radial: true });
    art.traverse((node) => {
      if (node.userData.kilnSemantic) delete node.userData.kilnSemantic;
    });
    expect(evaluatePropCircularAssemblyQa(context(art, { subtype: 'abstract-sunburst' }))).toEqual(
      [],
    );
  });

  test('reports declared scale, ground, and placement-pivot deltas without blocking', () => {
    const root = new THREE.Group();
    root.add(mesh('Body', [2, 1, 1], [0, 0.7, 0]));
    root.add(marker('Placement', 'prop.pivot.placement', [2, 0.8, 0], [0.01, 0.01, 0.01]));
    const findings = evaluatePropScalePivotQa(
      context(root, {
        capabilities: ['grounded'],
        bounds: { x: 1, y: 1, z: 1, units: 'm' },
      }),
    );
    expect(codes(findings)).toEqual([
      'PROP_SCALE_BOUNDS_MISMATCH',
      'PROP_GROUND_MISMATCH',
      'PROP_PLACEMENT_PIVOT_OFF_BASE',
    ]);
    expect(findings.every((finding) => finding.disposition === 'warn')).toBe(true);
  });
});

describe('PROP-006 capability-first helper policy and prompt guidance', () => {
  const evidence: PropHelperAblationEvidenceV1 = {
    schemaVersion: 1,
    experimentId: 'kiln.prop-capability-scaffold.v1',
    candidateKind: 'capability-scaffold',
    fixedCorpusId: 'kiln.prop-capability-defects.v1',
    baseline: { passedCases: 4, evaluatedCases: 8 },
    capabilityScaffold: { passedCases: 8, evaluatedCases: 8 },
    candidate: { passedCases: 8, evaluatedCases: 8 },
    propControlCorpusId: 'kiln.prop-control.v1',
    propControlCases: 4,
    propControlRegressions: 0,
  };

  test('approves the generic capability scaffold and closes regressing/noun-only candidates', () => {
    const approved = evaluatePropHelperAblation(evidence);
    expect(approved.approved).toBe(true);
    expect(approved.lift).toBe(0.5);
    expect(approved.lift).toBeGreaterThanOrEqual(PROP_HELPER_ABLATION_MINIMUM_LIFT);

    expect(evaluatePropHelperAblation({ ...evidence, propControlRegressions: 1 }).approved).toBe(
      false,
    );
    expect(
      evaluatePropHelperAblation({
        ...evidence,
        candidateKind: 'noun-specific-helper',
        candidate: { passedCases: 8, evaluatedCases: 8 },
      }).approved,
    ).toBe(false);
  });

  test('emits capability vocabulary instead of noun-specific construction recipes', () => {
    const intent = createAssetIntentV1({
      category: 'prop',
      subtype: 'barrel',
      capabilities: ['articulated', 'openable', 'grounded'],
      bounds: { x: 1, y: 1.2, z: 1, units: 'm' },
    });
    const guidance = buildPropEnvironmentSemanticGuidance(intent);
    expect(guidance).toContain('hinge, slider, or spinner');
    expect(guidance).toContain('prop.container.interior.main');
    expect(guidance).toContain('prop.circular.member.<id>');
    expect(guidance).not.toContain('createBarrel');
  });
});
