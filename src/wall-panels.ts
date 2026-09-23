/** Internal shared rectangular-wall subdivision for room and gable scaffolds. */
export interface WallAperture {
  id?: string;
  kind?: 'door' | 'window';
  offset?: number;
  width?: number;
  height?: number;
  sill?: number;
  depth?: number;
}

export interface WallPanel {
  suffix: string;
  left: number;
  right: number;
  bottom: number;
  top: number;
}

function positive(value: number, field: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`wall: ${field} must be finite and positive.`);
  }
  return value;
}

/**
 * Tile the solid complement of nonoverlapping rectangular apertures. Shared
 * horizontal spans are allowed for stacked openings. Apertures may touch;
 * their interiors may not overlap. Sides and tops fit strictly inside the
 * wall, while doors reach its base. All validation precedes panel allocation.
 */
export function buildWallPanels(
  length: number,
  height: number,
  thickness: number,
  apertures: readonly WallAperture[],
) {
  positive(length, 'length');
  positive(height, 'height');
  positive(thickness, 'thickness');
  const openings = apertures.map((opening, index) => {
    const kind = opening.kind ?? 'door';
    if (kind !== 'door' && kind !== 'window')
      throw new RangeError('wall: unsupported opening kind.');
    const offset = opening.offset ?? 0;
    if (!Number.isFinite(offset)) throw new RangeError('wall: opening.offset must be finite.');
    const width = positive(opening.width ?? (kind === 'window' ? 1 : 1.1), 'opening.width');
    const openingHeight = positive(
      opening.height ?? (kind === 'window' ? 1 : 2.1),
      'opening.height',
    );
    const sill = kind === 'window' ? (opening.sill ?? 1) : 0;
    if (!Number.isFinite(sill) || sill < 0)
      throw new RangeError('wall: opening.sill must be finite and nonnegative.');
    const depth = positive(opening.depth ?? thickness, 'opening.depth');
    const left = offset - width / 2;
    const right = offset + width / 2;
    const top = sill + openingHeight;
    if (left <= -length / 2 || right >= length / 2 || top >= height) {
      throw new RangeError(
        'wall: opening must fit strictly inside the wall boundary (except the base).',
      );
    }
    return {
      id: opening.id ?? `${kind}-${index + 1}`,
      kind,
      offset,
      width,
      height: openingHeight,
      sill,
      depth,
      left,
      right,
      top,
    };
  });
  for (let i = 0; i < openings.length; i++) {
    const a = openings[i]!;
    for (let j = i + 1; j < openings.length; j++) {
      const b = openings[j]!;
      if (a.left < b.right && b.left < a.right && a.sill < b.top && b.sill < a.top) {
        throw new RangeError(`wall: openings ${a.id} and ${b.id} overlap.`);
      }
    }
  }

  const cuts = [
    ...new Set([
      -length / 2,
      length / 2,
      ...openings.flatMap((opening) => [opening.left, opening.right]),
    ]),
  ].sort((a, b) => a - b);
  const panels: WallPanel[] = [];
  const add = (left: number, right: number, bottom: number, top: number) => {
    if (right <= left || top <= bottom) return;
    let suffix = `_Panel${panels.length + 1}`;
    if (openings.length === 0) suffix = '';
    else if (openings.length === 1) {
      const opening = openings[0]!;
      suffix =
        right <= opening.left
          ? '_L'
          : left >= opening.right
            ? '_R'
            : top <= opening.sill
              ? '_Sill'
              : '_Lintel';
    }
    panels.push({ suffix, left, right, bottom, top });
  };
  for (let i = 1; i < cuts.length; i++) {
    const left = cuts[i - 1]!;
    const right = cuts[i]!;
    const active = openings
      .filter((opening) => opening.left < right && opening.right > left)
      .sort((a, b) => a.sill - b.sill);
    let bottom = 0;
    for (const opening of active) {
      add(left, right, bottom, opening.sill);
      bottom = opening.top;
    }
    add(left, right, bottom, height);
  }
  return { openings, panels };
}
