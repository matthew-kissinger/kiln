---
name: kiln-compose-scene
description: Arrange existing GLB assets into a scene with explicit placement, integration manifests, overlap checks, and a reviewed scene export.
license: MIT
---

# Compose a scene from existing assets

Use this optional workflow when the task concerns several assets. Keep placement separate from individual source authoring so moving an object does not regenerate its geometry.

Read the [composition API notes](references/composition-api.md) when using the library. These are host/project APIs, not tools automatically added to the Kiln MCP surface.

Inspect each GLB with `inspectGlbIntegration(bytes)` and confirm it returned a usable manifest. Use units, axes, bounds, and ground information to place the object deliberately. Give instances stable names and explicit transforms.

Start with the layout's major structures, routes and useful sightlines, then place smaller objects. Use world-space AABB checks to find candidate collisions; inspect reported intersections instead of treating every overlap as an error. Intentional embedding and empty space inside bounds both matter.

Export with `composeSceneGLB(parts, options)`. Select material optimization and animation retention deliberately. Review skipped-part warnings and confirm required inputs survived. Inspect the result in its destination scene, including traversal, collision, contact, and relevant camera paths.

Report input assets, important transforms, intentional intersections, exporter warnings, and interactions actually checked. Do not infer playability from an overlap-free layout alone.
