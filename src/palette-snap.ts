/**
 * Palette snap — the pure OKLab nearest-slot algorithm, generalized to ANY
 * caller-supplied palette.
 *
 * This is the server/core mirror anticipated by the Kiln City frontend palette
 * (`packages/kiln-studio/frontend/src/city/palette.ts` — "the configurable-palettes
 * arc generalizes it… a server/core mirror of the slot DATA gets a parity test").
 * The city snaps THREE materials at render time to the fixed 30-slot Kiln City set;
 * this snaps a finished GLB's materials at BAKE time to a user-defined scene palette.
 * Same perceptual math, so a given hex routes to the same slot in both worlds.
 *
 * PURE: no `three`, no node, no gltf-transform. The sRGB→linear transfer function
 * is reproduced inline (it's exactly what THREE.Color + ColorManagement applies),
 * so a slot hex converts to the identical linear OKLab the city computes. The
 * caller (render.ts `snapGlbToPalette`) reads gltf-transform's LINEAR baseColor /
 * emissive factors and feeds them straight in.
 */

export type SnapSlotKind = 'opaque' | 'glass' | 'glow';

/** The minimum a slot needs for the snap: a color + an optional kind. */
export interface SnapSlot {
  /** sRGB hex (e.g. `#9fc9a3`). */
  color: string;
  /** Defaults to 'opaque'. transparent→glass, emissive→glow. */
  kind?: SnapSlotKind;
}

export type Vec3 = [number, number, number];

// ── sRGB → linear. Matches three's SRGBToLinear (the gamma transfer function),
//    so a slot hex yields the same linear value the GLB's linear factors carry. ──
function srgbChannelToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Parse an sRGB hex (`#rrggbb` or `rrggbb`) to LINEAR RGB in [0..1]. */
export function hexToLinearRgb(hex: string): Vec3 {
  const h = hex.trim().replace(/^#/, '');
  const full = h.length === 3 ? h[0]! + h[0]! + h[1]! + h[1]! + h[2]! + h[2]! : h;
  const n = Number.parseInt(full.slice(0, 6).padEnd(6, '0'), 16);
  const r = ((n >> 16) & 0xff) / 255;
  const g = ((n >> 8) & 0xff) / 255;
  const b = (n & 0xff) / 255;
  return [srgbChannelToLinear(r), srgbChannelToLinear(g), srgbChannelToLinear(b)];
}

// ── OKLab (Björn Ottosson). Inputs are LINEAR sRGB [0..1]. Ported verbatim from
//    the Kiln City palette so the two snaps agree. ──
export function linToOklab(r: number, g: number, b: number): Vec3 {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = Math.cbrt(l),
    m_ = Math.cbrt(m),
    s_ = Math.cbrt(s);
  return [
    0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  ];
}

const dE2 = (a: Vec3, b: Vec3): number => {
  const dl = a[0] - b[0],
    da = a[1] - b[1],
    db = a[2] - b[2];
  return dl * dl + da * da + db * db;
};
// CHROMATIC distance with lightness DOWN-WEIGHTED — full OKLab over-weights L, so a
// dark desaturated green matched a dark BROWN of similar lightness instead of a dark
// GREEN. Weighting hue/chroma above L makes "what colour is it" win over "how bright".
const L_WEIGHT_CHROMA = 0.3;
const dE2Chroma = (a: Vec3, b: Vec3): number => {
  const dl = a[0] - b[0],
    da = a[1] - b[1],
    db = a[2] - b[2];
  return L_WEIGHT_CHROMA * dl * dl + da * da + db * db;
};
const chroma = (lab: Vec3): number => Math.hypot(lab[1], lab[2]);
// Lightness-compensated chroma gate — OKLab chroma compresses at low lightness, so an
// absolute gate misreads dark muted colors (dark green leaf / brown bark read as "grey"
// and snap to black). Normalizing by lightness keeps "is this colored?" stable dark↔light.
const REL_CHROMA_GATE = 0.04;
const relChroma = (lab: Vec3): number => chroma(lab) / Math.max(lab[0], 0.25);

interface SlotLab {
  i: number;
  lab: Vec3;
}

/** Precomputed OKLab partition of a palette — built once per snap, reused per material. */
export interface SlotIndex {
  slots: readonly SnapSlot[];
  /** All opaque slots (fallback when a partition is empty). */
  opaque: SlotLab[];
  /** Opaque NEUTRAL slots (greys/white/black) — snapped by full dE2 (lightness IS the discriminator). */
  neutral: SlotLab[];
  /** Opaque CHROMATIC slots — snapped by hue-weighted dE2Chroma (so greens→greens). */
  chromatic: SlotLab[];
  /** Glass (transparent) slot indices. */
  glass: number[];
  /** Glow (emissive) slots — snapped by base/emissive color. */
  glow: SlotLab[];
}

/** Partition a palette into neutral/chromatic/glass/glow OKLab candidate lists. */
export function buildSlotIndex(slots: readonly SnapSlot[]): SlotIndex {
  const opaque: SlotLab[] = [];
  const neutral: SlotLab[] = [];
  const chromatic: SlotLab[] = [];
  const glass: number[] = [];
  const glow: SlotLab[] = [];
  slots.forEach((s, i) => {
    const kind = s.kind ?? 'opaque';
    const [r, g, b] = hexToLinearRgb(s.color);
    const lab = linToOklab(r, g, b);
    if (kind === 'glass') {
      glass.push(i);
      return;
    }
    if (kind === 'glow') {
      glow.push({ i, lab });
      return;
    }
    opaque.push({ i, lab });
    if (relChroma(lab) >= REL_CHROMA_GATE) chromatic.push({ i, lab });
    else neutral.push({ i, lab });
  });
  return { slots, opaque, neutral, chromatic, glass, glow };
}

function nearestIn(cands: SlotLab[], lab: Vec3, dist: (a: Vec3, b: Vec3) => number): number {
  let best = cands[0]!.i,
    bd = Infinity;
  for (const c of cands) {
    const d = dist(c.lab, lab);
    if (d < bd) {
      bd = d;
      best = c.i;
    }
  }
  return best;
}

/** Nearest OPAQUE slot index for a LINEAR-RGB color (OKLab + chroma gate). */
export function nearestOpaqueSlot(idx: SlotIndex, lin: Vec3): number | undefined {
  if (idx.opaque.length === 0) return undefined;
  const lab = linToOklab(lin[0], lin[1], lin[2]);
  if (relChroma(lab) >= REL_CHROMA_GATE) {
    return idx.chromatic.length
      ? nearestIn(idx.chromatic, lab, dE2Chroma)
      : nearestIn(idx.opaque, lab, dE2);
  }
  return idx.neutral.length ? nearestIn(idx.neutral, lab, dE2) : nearestIn(idx.opaque, lab, dE2);
}

/** Nearest GLOW slot index for a linear emissive color (or `undefined` if the palette has none). */
export function nearestGlowSlot(idx: SlotIndex, emissiveLin: Vec3): number | undefined {
  if (idx.glow.length === 0) return undefined;
  return nearestIn(idx.glow, linToOklab(emissiveLin[0], emissiveLin[1], emissiveLin[2]), dE2);
}

/** Classification inputs read off a material (all LINEAR). */
export interface MaterialColor {
  baseLinear: Vec3;
  emissiveLinear?: Vec3;
  transparent?: boolean;
}

/**
 * Choose the palette slot a material snaps to, kind-aware:
 * emissive (with a glow slot) → nearest glow; transparent (with a glass slot) → glass;
 * else → nearest opaque. Returns the slot index, or `undefined` when the palette has
 * no eligible slot (caller leaves the material unchanged).
 */
export function chooseSlot(idx: SlotIndex, m: MaterialColor): number | undefined {
  const emi = m.emissiveLinear;
  const isEmissive = !!emi && (emi[0] > 0.0025 || emi[1] > 0.0025 || emi[2] > 0.0025);
  if (isEmissive) {
    const g = nearestGlowSlot(idx, emi!);
    if (g !== undefined) return g;
  }
  if (m.transparent && idx.glass.length > 0) {
    // Pick the glass slot nearest the source base color (palettes rarely have >1).
    if (idx.glass.length === 1) return idx.glass[0];
    const lab = linToOklab(m.baseLinear[0], m.baseLinear[1], m.baseLinear[2]);
    let best = idx.glass[0]!,
      bd = Infinity;
    for (const gi of idx.glass) {
      const [r, g, b] = hexToLinearRgb(idx.slots[gi]!.color);
      const d = dE2(linToOklab(r, g, b), lab);
      if (d < bd) {
        bd = d;
        best = gi;
      }
    }
    return best;
  }
  return nearestOpaqueSlot(idx, m.baseLinear);
}
