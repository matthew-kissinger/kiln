import type { AssetIntentV1 } from '../contracts';
import { resolveEnvironmentIntentProfile } from '../contracts/environment';

/**
 * Semantic construction guidance appended only for the resolved category.
 * This owns capability vocabulary, not noun-specific geometry recipes.
 */
export function buildPropEnvironmentSemanticGuidance(intent: AssetIntentV1): string {
  if (intent.category === 'prop') {
    const sections: string[] = [
      '## Prop capability contract',
      'Keep +X forward, +Y up, +Z right, meters, and asset-local ground Y=0.',
    ];
    if (intent.capabilities.includes('articulated')) {
      sections.push(
        'For each moving assembly choose hinge, slider, or spinner. Tag the real pivot as prop.pivot.<kind>.<id>, the moving subtree as prop.motion.<kind>.<id>, add a normalized axis.+x/+y/+z local frame, and add a scaled non-rendered prop.clearance.<id> (or prop.clearance.<kind>.<id>) sweep marker. Parent only the moving meshes beneath the pivot. If a stationary hinge mount legitimately touches that sweep, give only that support prop.articulation.support.<id> and declare a mountedTo or allowsClearanceContact relationship from the pivot/clearance marker to that exact role.',
      );
    }
    if (intent.capabilities.includes('openable')) {
      sections.push(
        'Openable containers must have real negative space: tag non-rendered scaled prop.container.interior.main and prop.container.opening.main prisms, keep solid filler out of the opening, and keep the lid/door a distinct moving subtree.',
      );
    }
    if (intent.bounds) {
      sections.push(
        `Honor declared bounds ${JSON.stringify(intent.bounds)} and place prop.pivot.placement on the support base.`,
      );
    }
    if (/(?:barrel|drum)/i.test(intent.subtype ?? '')) {
      sections.push(
        'For a circular barrel/drum assembly, tag prop.circular.assembly and prop.circular.member.<id>, distribute members around a complete ring, and keep stave width tangent to the ring unless prop.circular.expected.radial is explicitly tagged.',
      );
    }
    return sections.join('\n');
  }

  if (intent.category === 'environment') {
    const profile = resolveEnvironmentIntentProfile(intent)!;
    const sections = [
      '## Environment capability contract',
      `Resolved subtype: ${profile.subtype}. Keep +X forward, +Y up, +Z right, meters, and asset-local ground Y=0.`,
      'Use semantic socket frames, not guessed node origins: requested tile axes use environment.tile.x-negative/x-positive or environment.tile.z-negative/z-positive; requested road and bridge joins use environment.road.start/end or environment.bridge.start/end; requested wall/gate joins use environment.wall.left/right or environment.gate.left/right; dressing clusters may declare environment.scatter-zone. Every axis or join you declare must include its complete opposing pair; do not invent unrequested axes or joins.',
      'Tag intentional terrain volume as environment.ground.* or environment.terrain.volume.*. Tag functional surfaces/layers explicitly so below-ground terrain is not confused with a buried road, deck, gate, or unsupported floating layer.',
    ];
    if (profile.tileable) {
      sections.push(
        'For each explicitly requested tile axis, make its opposing boundaries agree in sampled height, vertex normal, and portable material role, and put the paired socket frames at matching boundary locations. Do not assume both X and Z axes were requested.',
      );
    }
    if (profile.navigable) {
      sections.push(
        'Add a scaled non-rendered environment.navigation.corridor.<id> prism along every requested path/cave/bridge route and keep it free of renderable blockers. Size it to explicit user/gameplay dimensions; when none are declared, 0.8 m width and 1.8 m headroom are advisory review heuristics only.',
      );
    }
    return sections.join('\n');
  }
  return '';
}
