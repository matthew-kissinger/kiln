/**
 * kiln/retex — character diffuse-texture swap (faction retex).
 *
 *   import { kiln } from '@pixel-forge/core';
 *   const { glb, meta } = await kiln.retexCharacter(sourceGlbBuffer, {
 *     diffuse: og107PngBuffer,
 *     presetName: 'OG-107-jungle',
 *   });
 */

export { retexCharacter, FACTION_PRESETS } from './retex';
export type { RetexCharacterOptions, RetexCharacterResult, FactionPreset } from './retex';
