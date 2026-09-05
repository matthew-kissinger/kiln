/**
 * The shape `scripts/build-assets.mjs` writes. Every number in it came out of
 * the engine's own integration manifest while the GLB beside it was being made,
 * so nothing on the page is a figure somebody typed.
 */
export interface Specimen {
  name: string;
  file: string;
  thumb: string;
  bytes: number;
  category: string;
  caption: string;
  /** The model that wrote the program, named the way prose names it. */
  model: string;
  /** The agent harness it wrote through. */
  harness: string;
  /** Written with no access to this repository and no example to copy from. */
  cleanRoom: boolean;
  tris: number;
  drawCalls: number;
  materials: number;
  textures: number;
  /** Metres, on the engine's axes: +X forward, +Y up, +Z right. */
  size: [number, number, number];
  grounded: boolean;
  warnings: number;
}
