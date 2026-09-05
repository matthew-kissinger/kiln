/**
 * Three's public output-target path renders into its HalfFloat HDR framebuffer,
 * then applies tone mapping/exposure and the display color-space conversion.
 * An ordinary byte render target bypasses that pass and clips linear highlights.
 */
export function renderDisplayTarget(renderer, scene, camera, target) {
  const previousTarget = renderer.getRenderTarget();
  const previousOutput = renderer.getOutputRenderTarget();
  try {
    renderer.setOutputRenderTarget(target);
    // A null ordinary target is required to enable Three's internal output pass.
    renderer.setRenderTarget(null);
    renderer.render(scene, camera);
  } finally {
    renderer.setRenderTarget(previousTarget);
    renderer.setOutputRenderTarget(previousOutput);
  }
}
