// Ambient module shims for xatlasjs's Node build — the package ships JS
// only, so we declare the surface we actually touch in uv.ts.
declare module 'xatlasjs/dist/node/api.mjs' {
  export const Api: (createModule: unknown) => new (
    onLoad: () => void,
    locateFile: unknown,
    onProgress: unknown
  ) => unknown;
}

declare module 'xatlasjs/dist/node/xatlas.js' {
  const createXAtlasModule: unknown;
  export default createXAtlasModule;
}
