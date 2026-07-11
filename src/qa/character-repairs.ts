import type { QaFinding } from './types';

export const CHARACTER_REPAIR_CODES = [
  'CHAR_DUPLICATE_ANIMATED_NODE_NAME',
  'CHAR_DUPLICATE_JOINT_ROLE',
  'CHAR_PARENT_EDGE',
  'CHAR_BIPED_REQUIRED_ROLE',
  'CHAR_QUADRUPED_REQUIRED_ROLE',
  'CHAR_CUSTOM_GRAPH_MISSING',
  'CHAR_CUSTOM_REQUIRED_ROLE',
  'CHAR_HELD_ITEM_MISSING',
  'CHAR_HELD_ITEM_ATTACHMENT',
  'CHAR_HELD_ITEM_GRIP_BREAK',
  'CHAR_CONTACT_MISSING',
  'CHAR_CONTACT_FLOATING',
  'CHAR_CONTACT_BURIED',
  'CHAR_CLIP_MISSING',
  'CHAR_CLIP_DUPLICATE',
  'CHAR_CLIP_UNEXPECTED',
  'CHAR_CLIP_DURATION',
  'CHAR_ANIMATION_NONFINITE',
  'CHAR_KEY_TIME_ORDER',
  'CHAR_KEY_OUT_OF_RANGE',
  'CHAR_TRACK_VALUE_COUNT',
  'CHAR_LOOP_ENDPOINT',
  'CHAR_ROOT_MOTION_BACKWARD',
  'CHAR_ROOT_MOTION_LATERAL',
] as const;

export type CharacterRepairCode = (typeof CHARACTER_REPAIR_CODES)[number];

export interface CharacterRepairRecipe {
  code: CharacterRepairCode;
  repairText: string;
  viewHints: readonly string[];
}

const skeletonViews = Object.freeze(['character.skeleton.front', 'character.skeleton.right']);
const motionViews = Object.freeze(['character.motion-strip.front', 'character.motion-strip.right']);

const recipe = (
  code: CharacterRepairCode,
  repairText: string,
  viewHints: readonly string[],
): CharacterRepairRecipe =>
  Object.freeze({ code, repairText, viewHints: Object.freeze([...viewHints]) });

export const CHARACTER_REPAIR_RECIPES: Readonly<
  Record<CharacterRepairCode, CharacterRepairRecipe>
> = Object.freeze({
  CHAR_DUPLICATE_ANIMATED_NODE_NAME: recipe(
    'CHAR_DUPLICATE_ANIMATED_NODE_NAME',
    'Rename only the reported duplicate Joint_* pivot and update its animation-track target so every animated node name is unique.',
    skeletonViews,
  ),
  CHAR_DUPLICATE_JOINT_ROLE: recipe(
    'CHAR_DUPLICATE_JOINT_ROLE',
    'Give the reported joint its intended unique semantic role; do not remove or merge unrelated branches.',
    skeletonViews,
  ),
  CHAR_PARENT_EDGE: recipe(
    'CHAR_PARENT_EDGE',
    'Reparent only the reported joint directly under its declared parent role while preserving its asset-local rest pose.',
    skeletonViews,
  ),
  CHAR_BIPED_REQUIRED_ROLE: recipe(
    'CHAR_BIPED_REQUIRED_ROLE',
    'Add the reported missing biped joint role and declared parent edge without redesigning already-valid chains.',
    skeletonViews,
  ),
  CHAR_QUADRUPED_REQUIRED_ROLE: recipe(
    'CHAR_QUADRUPED_REQUIRED_ROLE',
    'Add the reported missing quadruped joint role and declared parent edge without changing the other three limb chains.',
    skeletonViews,
  ),
  CHAR_CUSTOM_GRAPH_MISSING: recipe(
    'CHAR_CUSTOM_GRAPH_MISSING',
    'Declare the requested custom rig graph before authoring animation; do not substitute biped assumptions.',
    skeletonViews,
  ),
  CHAR_CUSTOM_REQUIRED_ROLE: recipe(
    'CHAR_CUSTOM_REQUIRED_ROLE',
    'Add only the reported role from the trusted custom graph and attach it to its declared parent.',
    skeletonViews,
  ),
  CHAR_HELD_ITEM_MISSING: recipe(
    'CHAR_HELD_ITEM_MISSING',
    'Add the declared held item as its own node under the requested grip end effector.',
    skeletonViews,
  ),
  CHAR_HELD_ITEM_ATTACHMENT: recipe(
    'CHAR_HELD_ITEM_ATTACHMENT',
    'Reparent only the held-item node under the reported hand, wrist, or grip end effector; never attach it to a shoulder or elbow.',
    skeletonViews,
  ),
  CHAR_HELD_ITEM_GRIP_BREAK: recipe(
    'CHAR_HELD_ITEM_GRIP_BREAK',
    'Keep the reported held item under its declared grip end effector and remove only the item-local animation keys that change its grip distance.',
    motionViews,
  ),
  CHAR_CONTACT_MISSING: recipe(
    'CHAR_CONTACT_MISSING',
    'Tag the requested foot, paw, or terminal support as a ground contact without changing body plan.',
    ['character.skeleton.front', 'generic.front.depth-contact'],
  ),
  CHAR_CONTACT_FLOATING: recipe(
    'CHAR_CONTACT_FLOATING',
    'Move only the reported contact down to asset-local Y=0 while preserving its parent chain and lateral placement.',
    ['character.skeleton.front', 'generic.front.depth-contact'],
  ),
  CHAR_CONTACT_BURIED: recipe(
    'CHAR_CONTACT_BURIED',
    'Move only the reported contact up to asset-local Y=0 while preserving its parent chain and lateral placement.',
    ['character.skeleton.front', 'generic.front.depth-contact'],
  ),
  CHAR_CLIP_MISSING: recipe(
    'CHAR_CLIP_MISSING',
    'Author exactly the reported requested clip name using existing unique Joint_* targets.',
    motionViews,
  ),
  CHAR_CLIP_DUPLICATE: recipe(
    'CHAR_CLIP_DUPLICATE',
    'Keep one clip with the requested name and remove or correctly rename the duplicate; preserve requested clip names exactly.',
    motionViews,
  ),
  CHAR_CLIP_UNEXPECTED: recipe(
    'CHAR_CLIP_UNEXPECTED',
    'Remove the unrequested clip without changing any requested clip.',
    motionViews,
  ),
  CHAR_CLIP_DURATION: recipe(
    'CHAR_CLIP_DURATION',
    'Set the reported clip to one finite positive duration and keep all keys inside it.',
    motionViews,
  ),
  CHAR_ANIMATION_NONFINITE: recipe(
    'CHAR_ANIMATION_NONFINITE',
    'Replace only the reported non-finite key time or value with the intended finite value.',
    motionViews,
  ),
  CHAR_KEY_TIME_ORDER: recipe(
    'CHAR_KEY_TIME_ORDER',
    'Sort the reported track keys into strictly increasing unique times without changing their poses.',
    motionViews,
  ),
  CHAR_KEY_OUT_OF_RANGE: recipe(
    'CHAR_KEY_OUT_OF_RANGE',
    'Move only the reported key inside the inclusive [0, clip duration] interval.',
    motionViews,
  ),
  CHAR_TRACK_VALUE_COUNT: recipe(
    'CHAR_TRACK_VALUE_COUNT',
    'Provide exactly one complete value tuple for every reported key time.',
    motionViews,
  ),
  CHAR_LOOP_ENDPOINT: recipe(
    'CHAR_LOOP_ENDPOINT',
    'For the declared looping clip, make the reported track end pose equal its start pose; do not change one-shot clips.',
    motionViews,
  ),
  CHAR_ROOT_MOTION_BACKWARD: recipe(
    'CHAR_ROOT_MOTION_BACKWARD',
    'Reverse only the declared locomotion root translation so net travel is toward canonical +X.',
    motionViews,
  ),
  CHAR_ROOT_MOTION_LATERAL: recipe(
    'CHAR_ROOT_MOTION_LATERAL',
    'Rotate or rewrite only the declared locomotion root translation so +X travel dominates Z travel.',
    motionViews,
  ),
});

export function characterRepairRecipe(code: string): CharacterRepairRecipe | undefined {
  return (CHARACTER_REPAIR_RECIPES as Readonly<Record<string, CharacterRepairRecipe>>)[code];
}

export function withCharacterRepair(finding: QaFinding): QaFinding {
  const found = characterRepairRecipe(finding.code);
  if (!found) return finding;
  return {
    ...finding,
    repairText: finding.repairText ?? found.repairText,
    viewHints: [...new Set([...(finding.viewHints ?? []), ...found.viewHints])],
  };
}
