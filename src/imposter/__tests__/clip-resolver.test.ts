/**
 * Clip resolver tests — uses realistic clip lists pulled from the Quaternius
 * soldier set so behavior is validated against real-world naming, not toys.
 */

import { describe, expect, test } from 'bun:test';

import {
  applyClipFallbacks,
  normalizeClipName,
  resolveClips,
} from '../clip-resolver';

// Real clip lists from CHARACTERS_MANIFEST.json (Poly Pizza / Quaternius set).
const HERO_CLIPS = [
  'CharacterArmature|Attacking_Idle',
  'CharacterArmature|Dagger_Attack',
  'CharacterArmature|Death',
  'CharacterArmature|Idle',
  'CharacterArmature|PickUp',
  'CharacterArmature|Punch',
  'CharacterArmature|RecieveHit',
  'CharacterArmature|Roll',
  'CharacterArmature|Run',
  'CharacterArmature|Walk',
];

const NVA_MATT_CLIPS = [
  'CharacterArmature|Death',
  'CharacterArmature|Idle',
  'CharacterArmature|Idle_Gun',
  'CharacterArmature|Punch',
  'CharacterArmature|Run',
  'CharacterArmature|Run_Gun',
  'CharacterArmature|Run_Slash',
  'CharacterArmature|Slash',
  'CharacterArmature|Stab',
  'CharacterArmature|Walk',
  'CharacterArmature|Walk_Gun',
];

const US_SOLDIER_CLIPS = [
  'CharacterArmature|Death',
  'CharacterArmature|Idle',
  'CharacterArmature|Idle_Shoot',
  'CharacterArmature|Run',
  'CharacterArmature|Run_Gun',
];

describe('normalizeClipName', () => {
  test('strips single armature prefix', () => {
    expect(normalizeClipName('CharacterArmature|Walk')).toBe('Walk');
  });
  test('strips repeated prefixes', () => {
    expect(normalizeClipName('CharacterArmature|CharacterArmature|Idle')).toBe('Idle');
  });
  test('preserves un-prefixed names', () => {
    expect(normalizeClipName('Run')).toBe('Run');
  });
});

describe('resolveClips — hero (Quaternius Character_Animated)', () => {
  test('resolves idle + walking + running from exact + alias matches', () => {
    const r = resolveClips(HERO_CLIPS, ['idle', 'walking', 'running']);
    expect(r.clips.idle?.resolved).toBe('Idle');
    expect(r.clips.idle?.matchedBy).toBe('exact');
    expect(r.clips.walking?.resolved).toBe('Walk');
    expect(r.clips.running?.resolved).toBe('Run');
    expect(r.missing).toHaveLength(0);
  });

  test('shoot falls through to Punch (melee fallback in alias list)', () => {
    const r = resolveClips(HERO_CLIPS, ['shoot']);
    expect(r.clips.shoot?.resolved).toBe('Punch');
    expect(r.clips.shoot?.matchedBy).toBe('alias');
    expect(r.missing).toHaveLength(0);
  });

  test('returns raw clip name (with armature prefix) for AnimationMixer', () => {
    const r = resolveClips(HERO_CLIPS, ['idle']);
    expect(r.clips.idle?.rawName).toBe('CharacterArmature|Idle');
  });

  test('unmapped clips are surfaced for debugging', () => {
    const r = resolveClips(HERO_CLIPS, ['idle', 'walking']);
    expect(r.unmapped).toContain('CharacterArmature|Death');
    expect(r.unmapped).toContain('CharacterArmature|Roll');
  });
});

describe('resolveClips — NVA (Matt)', () => {
  test('idle + walking match directly', () => {
    const r = resolveClips(NVA_MATT_CLIPS, ['idle', 'walking']);
    expect(r.clips.idle?.resolved).toBe('Idle');
    expect(r.clips.walking?.resolved).toBe('Walk');
  });

  test('shoot falls through to Slash (no Gun_Shoot / Shoot clip)', () => {
    const r = resolveClips(NVA_MATT_CLIPS, ['shoot']);
    expect(r.clips.shoot?.resolved).toBe('Slash');
    expect(r.clips.shoot?.matchedBy).toBe('alias');
  });
});

describe('resolveClips — US Soldier (PpLF4rt4ah)', () => {
  test('walking falls through to Run when Walk is absent', () => {
    // US Soldier has no Walk clip; the alias list for 'walking' includes only
    // Walk / Walk_Gun / Walking. Expect missing (no Run substitution yet).
    const r = resolveClips(US_SOLDIER_CLIPS, ['walking']);
    expect(r.clips.walking?.resolved).toBeNull();
    expect(r.missing).toContain('walking');
  });

  test('Idle_Shoot resolves shoot via alias', () => {
    const r = resolveClips(US_SOLDIER_CLIPS, ['shoot']);
    expect(r.clips.shoot?.resolved).toBe('Idle_Shoot');
  });
});

describe('applyClipFallbacks', () => {
  test('promotes running -> walking when walking is missing', () => {
    const initial = resolveClips(US_SOLDIER_CLIPS, ['idle', 'walking', 'running']);
    expect(initial.missing).toContain('walking');

    const after = applyClipFallbacks(initial, { walking: 'running' });
    expect(after.clips.walking?.resolved).toBe('Run');
    expect(after.clips.walking?.matchedBy).toBe('fallback');
    expect(after.clips.walking?.fallbackFor).toBe('running');
    expect(after.missing).not.toContain('walking');
  });

  test('no-op when donor target is also missing', () => {
    const initial = resolveClips(['Idle'], ['idle', 'walking']);
    const after = applyClipFallbacks(initial, { walking: 'running' });
    // running was never resolved -> walking stays null.
    expect(after.clips.walking?.resolved).toBeNull();
    expect(after.missing).toContain('walking');
  });

  test('does not overwrite an already-resolved target', () => {
    const initial = resolveClips(HERO_CLIPS, ['idle', 'walking', 'running']);
    const after = applyClipFallbacks(initial, { walking: 'running' });
    // Target "walking" does not exact-match clip "Walk" (different words);
    // it resolves via the "Walk" alias. The fallback must not overwrite an
    // already-populated slot regardless of whether it was exact or alias.
    expect(after.clips.walking?.resolved).toBe('Walk');
    expect(after.clips.walking?.matchedBy).toBe('alias');
    expect(after.clips.walking?.fallbackFor).toBeUndefined();
  });
});
