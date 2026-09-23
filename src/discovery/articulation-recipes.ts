import type { DiscoveryEntry } from './catalog-schema';

type RecipeEntry = Extract<DiscoveryEntry, { kind: 'recipe' }>;

export const articulationRecipes: readonly RecipeEntry[] = [
  {
    version: 'kiln.catalog-entry.v1',
    id: 'recipe:steerable-wheel-v1',
    kind: 'recipe',
    name: 'Steerable wheel with a local fork',
    summary:
      'Compose a wheel, fork and axle around separate steering and spin pivots. Resize from shared dimensions and inspect actual animated geometry; usable as a caster or mechanism without selecting a vehicle category.',
    family: 'articulation',
    tags: ['wheel', 'caster', 'steering', 'spin', 'local frame', 'animation'],
    aliases: ['swivel support', 'steer and spin a caster wheel', 'rotating wheel fork'],
    intents: ['add an editable rolling support', 'separate steering from wheel rotation'],
    stability: 'experimental',
    related: [
      { id: 'assembly:createWheelAssembly', relation: 'prerequisite' },
      { id: 'recipe:editable-assembly-v1', relation: 'companion' },
    ],
    references: ['src/vehicle.ts', 'docs/geometry.md'],
    limitations: [
      'A teaching assembly, not a suspension, physics model or load certificate. Spin is in place; translation is not synchronized to rolling distance.',
      'The contact marker is a rest-pose reference under the spin pivot. Evaluate actual tire geometry over motion; nominal radius or marker position cannot certify rolling contact.',
      'The host mounting surface is not included. Bind external support relationships when integrating into the host, and check mounting contact and clearance independently.',
    ],
    recipe: {
      prerequisites: [
        'assembly:createWheelAssembly',
        'operation:createRoot',
        'operation:createPart',
        'operation:rotationTrack',
        'operation:createClip',
      ],
      steps: [
        'Choose the axle datum and dimensions. This example uses +Y up, +Z spin and +Y steering; put the assembly placement on a parent root.',
        'Parent the fork and axle to the steering pivot and the tire, rim, hub and spin marker to the spin pivot. Keep the fork out of wheel rotation.',
        'Derive fork spacing, axle length, clearance and placement from radius and width. Rebuild after a dimension edit rather than scaling hardware thickness.',
        'Use intermediate quaternion keys for a full spin. Export and inspect both clips, sampled tread bounds and fork clearance before attaching a host.',
      ],
      example: `const meta = { name: 'SteerableCaster' };
const radius = 0.25;
const width = 0.12;
function build() {
  const root = createRoot(meta.name);
  const steel = gameMaterial('#7894a3');
  const wheel = createWheelAssembly('Caster', {
    tire: gameMaterial('#252b30'), rim: steel
  }, { radius, width, side: 'center', index: 'caster', steering: true,
    position: [0, radius, 0], parent: root,
    geometries: { tire: torusGeo(radius - width / 2, width / 2, 12, 64) } });
  const fork = createRoot('Fork');
  wheel.steeringPivot.add(fork);
  const legZ = width / 2 + 0.04, top = radius + 0.10;
  for (const side of [-1, 1]) createPart('ForkLeg' + side,
    boxGeo(0.08, top, 0.04), steel,
    { parent: fork, position: [0, top / 2, side * legZ] });
  createPart('ForkCap', boxGeo(0.10, 0.05, 2 * legZ + 0.04), steel,
    { parent: fork, position: [0, top + 0.025, 0] });
  createPart('Axle', cylinderZGeo(0.025, 0.025, 2 * legZ + 0.06, 20), steel,
    { parent: fork, semantic: { roles: ['axle.caster'] } });
  createPart('SpinMarker', boxGeo(radius * 0.2, 0.015, 0.008), gameMaterial('#edbd54'),
    { parent: wheel.spinPivot, position: [radius * 0.43, 0, width * 0.4 + 0.002] });
  return root;
}
function animate(root) {
  const steering = root.getObjectByName('SteeringPivot_center_caster');
  const spin = root.getObjectByName('WheelPivot_center_caster');
  return [
    createClip('Steer', 1, [rotationTrack(steering.name, [
      { time: 0, rotation: [0, 0, 0] },
      { time: 0.5, rotation: [0, 40, 0] },
      { time: 1, rotation: [0, 0, 0] }
    ])]),
    createClip('Spin', 1, [rotationTrack(spin.name,
      [0, 90, 180, 270, 360].map((angle, i) => ({ time: i / 4, rotation: [0, 0, angle] })))])
  ];
}`,
      adaptations: [
        'Use center identity for a wheel on the host centerline. A single-sided fork is an explicit design alternative: preserve the axle-to-hub connection and inspect it; the wheel helper does not choose the support arrangement.',
        'Change radius or width and rebuild. Preserve the declared axle frame when replacing tire geometry; check the helper geometryChecks advisory and actual exported bounds.',
        'Replicate describeAssembly(root, { clips }) with a unique namespace and an explicit external-reference decision; use the returned remapped clips and nodeMap.',
        'For a real rolling assembly, account for tread protrusions, wheel profile and sampled rotation when choosing center height. A smooth polygonal tire is still a contact approximation.',
      ],
      checks: [
        'Verify fork and spin are siblings beneath steering, and the entire assembly moves together under a transformed parent.',
        'Sample exported spin and steering independently. The tire must not rotate the fork; steering must carry both.',
        'Inspect the actual axle/fork/hub interface, ground clearance and host attachment. Semantic roles and matching bounding boxes do not prove physical mating.',
      ],
    },
  },
  {
    version: 'kiln.catalog-entry.v1',
    id: 'recipe:branched-articulation-v1',
    kind: 'recipe',
    name: 'Branched articulation with preserved rest frames',
    summary:
      'Build a two-branch mechanical gripper with local links, explicit parent roles and nonzero rest rotations. Animate bends without resetting joint offsets or assuming a humanoid skeleton.',
    family: 'articulation',
    tags: ['rig', 'branch', 'gripper', 'rest frame', 'local rotation', 'animation'],
    aliases: ['branching articulated gripper', 'non humanoid mechanism', 'jointed appendages'],
    intents: ['animate a branching mechanism', 'retain rest offsets during a bend'],
    stability: 'experimental',
    related: [
      { id: 'assembly:createJointChain', relation: 'prerequisite' },
      { id: 'recipe:rig-custom-v1', relation: 'companion' },
    ],
    references: ['src/character.ts', 'docs/geometry.md'],
    limitations: [
      'Rigid articulated teaching geometry, without skinning, inverse kinematics, grasp constraints or collision avoidance. Inspect each intended pose and edited proportion.',
      'The animation demonstrates local bending only. A graph label does not establish locomotion, stable contact or a functional grasp.',
    ],
    recipe: {
      prerequisites: [
        'assembly:createJointChain',
        'operation:createRoot',
        'operation:createPart',
        'operation:rotationTrack',
        'operation:createClip',
      ],
      steps: [
        'Place a shared core, then parent each branch explicitly with parentRole. Give every role a unique name and author links in each joint local frame.',
        'Set rest rotations as quaternions and derive geometry and downstream offsets from the same lengths. Record the returned descriptors on the root graph.',
        'Rotation tracks are absolute local rotations, not deltas. Start from the rest orientation; leave translations untouched unless intentionally changing them.',
        'Export the graph and clips; verify parent edges, rest frames and moving geometry. For replication, remap the full assembly and its clips together.',
      ],
      example: `const meta = { name: 'BranchedGripper' };
const upperLength = 0.4;
const lowerLength = 0.28;
function build() {
  const root = createRoot(meta.name);
  const metal = gameMaterial('#748e9c'), jointMaterial = gameMaterial('#35464f');
  const core = createJointChain('Fork', [{ role: 'core', offset: [0, 0.3, 0] }], { parent: root });
  createPart('Core', boxGeo(0.32, 0.18, 0.18), metal, { parent: core.root });
  const descriptors = [...core.descriptors];
  function zRotation(degrees) {
    const half = degrees * Math.PI / 360;
    return [0, 0, Math.sin(half), Math.cos(half)];
  }
  for (const side of [-1, 1]) {
    const label = side < 0 ? 'left' : 'right';
    const branch = createJointChain('Fork', [
      { role: label + '.shoulder', offset: [side * 0.1, 0, 0],
        restRotation: zRotation(-side * 35), localBendAxis: [0, 0, 1] },
      { role: label + '.elbow', offset: [0, upperLength, 0],
        restRotation: zRotation(side * 15), localBendAxis: [0, 0, 1] },
      { role: label + '.tip', offset: [0, lowerLength, 0], endEffector: true }
    ], { parent: core.end, parentRole: 'core' });
    descriptors.push(...branch.descriptors);
    createPart(label + 'Upper', boxGeo(0.08, upperLength, 0.08), metal,
      { parent: branch.nodes[0], position: [0, upperLength / 2, 0] });
    createPart(label + 'Lower', boxGeo(0.07, lowerLength, 0.07), metal,
      { parent: branch.nodes[1], position: [0, lowerLength / 2, 0] });
    for (let i = 0; i < 2; i++) createPart(label + 'Hinge' + i,
      cylinderZGeo(0.055, 0.055, 0.1, 16), jointMaterial, { parent: branch.nodes[i] });
    createPart(label + 'Pad', boxGeo(0.11, 0.06, 0.12), jointMaterial, { parent: branch.end });
  }
  root.userData.kilnCharacterRig = { schemaVersion: 1, bodyPlan: 'custom', joints: descriptors };
  return root;
}
function animate(root) {
  const tracks = [];
  root.traverse(node => {
    const descriptor = node.userData.kilnCharacterJoint;
    if (!descriptor || !descriptor.role.endsWith('.elbow')) return;
    const rest = descriptor.rest.rotation;
    const degrees = 2 * Math.atan2(rest[2], rest[3]) * 180 / Math.PI;
    const bend = descriptor.role.startsWith('left.') ? -45 : 45;
    tracks.push(rotationTrack(node.name, [
      { time: 0, rotation: [0, 0, degrees] },
      { time: 0.5, rotation: [0, 0, degrees + bend] },
      { time: 1, rotation: [0, 0, degrees] }
    ]));
  });
  return [createClip('Bend', 1, tracks)];
}`,
      adaptations: [
        'Change upperLength or lowerLength, rebuilding links and child offsets together. The core and the opposite branch need not change for a one-branch edit.',
        'Add branches with distinct roles and explicit parent edges. No body-plan preset or asset category is required.',
        'This example bends about local Z only. For arbitrary rest frames, compose rest and delta quaternions in the intended order rather than adding Euler angles.',
      ],
      checks: [
        'Every graph role must resolve to one exported joint and parentRole must match the real hierarchy.',
        'At time zero, sampled animation must agree with the declared rest frame. Bending must retain translations and move the attached links and end effectors.',
        'Review open and bent views, hinge contact, self-intersection and the intended destination playback. Structural validity alone cannot certify useful motion.',
      ],
    },
  },
];
