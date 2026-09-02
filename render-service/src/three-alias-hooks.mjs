// three/addons import bare 'three', which resolves to the WebGL build and splits
// class identity against 'three/webgpu'. Alias every bare 'three' to the WebGPU build.
export function resolve(specifier, context, next) {
  if (specifier === 'three') return next('three/webgpu', context);
  return next(specifier, context);
}
