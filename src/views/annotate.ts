/**
 * Per-cell annotation shared by BOTH view-grid producers.
 *
 * A contact-sheet cell carries two pieces of context the pixels alone do not:
 * which camera it is (`stampLabel`) and which way the world axes point from
 * here (`stampAxisGnomon`). The CPU rasterizer stamped both; the GPU render
 * port composited raw PNGs and stamped neither, so the model's visual context
 * quietly lost its labels whenever a GPU happened to be reachable.
 *
 * That difference is not a useful degrade signal — `renderDegraded` and
 * `viewsRendererId` report the producer as structured fields, which is where a
 * consumer should read it from. So both producers now call
 * {@link annotateViewCell}, and this module exists so they cannot drift: the
 * label scale, the corner anchors and the gnomon basis are written once.
 *
 * Dependency-free apart from the bitmap font, so the grid compositor can import
 * it without pulling in the rasterizer.
 */

import { stampLabel } from './pose';

// H-30: kiln-frame axis gnomon colors (+X fwd red, +Y up green, +Z right blue).
const GNOMON_AXES: Array<{
  label: string;
  axis: [number, number, number];
  color: [number, number, number];
}> = [
  { label: 'X', axis: [1, 0, 0], color: [235, 80, 70] },
  { label: 'Y', axis: [0, 1, 0], color: [90, 205, 90] },
  { label: 'Z', axis: [0, 0, 1], color: [90, 145, 245] },
];

/**
 * Stamp a small world-axis gnomon into a rasterized cell (bottom-left corner),
 * using the SAME camera basis as rasterizeView so the arrows are exact
 * (3DAxisPrompt: ticked/annotated axes measurably improve VLM 3D localization).
 * Axes nearly perpendicular to the image plane (projected length < 0.25) are
 * skipped — only in-plane axes disambiguate a view.
 */
export function stampAxisGnomon(rgb: Uint8Array, size: number, viewDir: readonly number[]): void {
  // rasterizeView's basis, duplicated deliberately (raster.ts keeps it private).
  const zl = Math.hypot(viewDir[0]!, viewDir[1]!, viewDir[2]!) || 1;
  const z = [viewDir[0]! / zl, viewDir[1]! / zl, viewDir[2]! / zl] as const;
  const up = Math.abs(z[1]) > 0.99 ? ([0, 0, -1] as const) : ([0, 1, 0] as const);
  const cx = [
    up[1] * z[2] - up[2] * z[1],
    up[2] * z[0] - up[0] * z[2],
    up[0] * z[1] - up[1] * z[0],
  ];
  const xl = Math.hypot(cx[0]!, cx[1]!, cx[2]!) || 1;
  const bx = [cx[0]! / xl, cx[1]! / xl, cx[2]! / xl] as const;
  const by = [
    z[1] * bx[2] - z[2] * bx[1],
    z[2] * bx[0] - z[0] * bx[2],
    z[0] * bx[1] - z[1] * bx[0],
  ] as const;

  const len = Math.max(12, Math.round(size * 0.055));
  // Inset the origin by the arrow length so leftward/downward projections
  // (e.g. +Z in the Front view) aren't clipped at the cell edge.
  const ox = len + 10;
  const oy = size - len - 10;
  for (const { label, axis, color } of GNOMON_AXES) {
    const dx = axis[0] * bx[0] + axis[1] * bx[1] + axis[2] * bx[2];
    const dy = axis[0] * by[0] + axis[1] * by[1] + axis[2] * by[2];
    if (Math.hypot(dx, dy) < 0.25) continue;
    const ex = ox + dx * len;
    const ey = oy - dy * len; // screen y is flipped vs the camera's up
    const steps = Math.ceil(Math.hypot(ex - ox, ey - oy));
    for (let s = 0; s <= steps; s++) {
      const px = Math.round(ox + ((ex - ox) * s) / steps);
      const py = Math.round(oy + ((ey - oy) * s) / steps);
      for (let ty = 0; ty < 2; ty++) {
        for (let tx = 0; tx < 2; tx++) {
          const x = px + tx;
          const y = py + ty;
          if (x < 0 || y < 0 || x >= size || y >= size) continue;
          const p = (y * size + x) * 3;
          rgb[p] = color[0];
          rgb[p + 1] = color[1];
          rgb[p + 2] = color[2];
        }
      }
    }
    stampLabel(rgb, size, size, Math.round(ex) + 2, Math.round(ey) - 6, label, 1);
  }
}

/**
 * Annotate one square RGB cell in place: view name in the top-left corner, axis
 * gnomon in the bottom-left. Both are corner-anchored, away from the centered
 * silhouette (SeeAct caveat: overlays that cross the subject cost more accuracy
 * than they add).
 *
 * The label scale is derived from the cell size rather than passed in, because
 * the two producers measure size differently — the rasterizer is told it, the
 * port reads it off a decoded PNG — and a mismatch would show up as
 * differently-sized text on otherwise identical sheets.
 */
export function annotateViewCell(
  rgb: Uint8Array,
  size: number,
  view: { name: string; dir: readonly number[] },
): void {
  const inset = Math.max(2, Math.round(size / 96));
  const width = size - inset * 2;
  // stampLabel's 3x5 font occupies (4*n + 1)*scale including its backdrop.
  // Keep ordinary labels byte-for-byte identical; only fit overflowing names.
  // Tiny injected port cells may not fit even one 7px row. Preserve their
  // legacy clipped stamp instead of computing zero rows and losing annotation.
  if (width < 7 || (4 * view.name.length + 1) * inset <= width) {
    stampLabel(rgb, size, size, inset, inset, view.name, inset);
  } else {
    const minimumScale = size >= 128 ? 2 : 1;
    const scale = Math.max(minimumScale, Math.floor(width / (4 * view.name.length + 1)));
    const columns = Math.max(1, Math.floor((width / scale - 1) / 4));
    const rows = Math.min(3, Math.floor((size - inset * 2) / (7 * scale)));
    let remaining = view.name.toUpperCase();
    for (let row = 0; row < rows && remaining; row++) {
      let line = remaining;
      if (remaining.length > columns) {
        if (row === rows - 1) {
          // Names are unbounded in the schema. Show an explicit continuation
          // rather than clipping or letting the overlay consume the scene.
          line = `${remaining.slice(0, Math.max(0, columns - 3)).trimEnd()}${'.'.repeat(Math.min(3, columns))}`;
          remaining = '';
        } else {
          const space = remaining.lastIndexOf(' ', columns);
          const end = space > 0 ? space : columns;
          line = remaining.slice(0, end);
          remaining = remaining.slice(end).trimStart();
        }
      } else remaining = '';
      stampLabel(rgb, size, size, inset, inset + row * 7 * scale, line, scale);
    }
  }
  stampAxisGnomon(rgb, size, view.dir);
}
