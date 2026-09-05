---
name: kiln-qa-asset
description: Check a Kiln asset's geometry, views, export fidelity, and behavior in its destination project. Use for delivery review, loading, materials, animation, collision, or runtime defects.
license: MIT
---

# Verify an asset for its intended use

Match the checks to the requested delivery. A source build, an image review, a GLB export, and a working asset in a game are different pieces of evidence.

## Before integration

Read validation/build findings and export warnings. `kiln_validate` only checks source; render and inspect the actual geometry when that is the task. Choose broad or part-specific views that reveal the suspected defect. Copy the returned `programRef` exactly for every view, whether it is a short `p_` handle or a full SHA-256 reference; request source text only when a repair needs it. A handle identifies a revision in its store; use full source and artifact hashes for integrity evidence.

Distinguish expected open sheets from invalid solid topology. `geometryDiagnostics` reports boundary edges, non-manifold edges, orientation conflicts and degenerates; it does not prove absence of self-intersection. A capped loft, shell-like surface, or sampled field is not automatically a manufacturing-grade solid.

Check material and camera fidelity independently. A fallback image may still answer a geometry question, but it cannot establish faithful PBR appearance. Keep unresolved export or material findings visible in the delivery report.

## In the destination

Use the project's existing loader and renderer. Read the [integration checks](references/integration-checks.md) for manifests, frames, composition options, and limits.

Confirm scale alongside existing objects, forward direction, ground contact, placement, and useful viewing distance. Check textures and lighting in the destination renderer. Exercise relevant animation, interaction, and collision; sample intermediate poses when checking motion. For web projects use the actual browser view, and for native projects use the destination runtime.

Reproduce defects before fixing them. Correct placement/loader/lighting problems in integration code; change asset source for a geometry or rig defect. Recheck the affected behavior after a repair.

Report the exact artifacts tested, what you ran and saw, repaired defects, and checks left unperformed. Validation, `visualQa: not_assessed`, an AABB overlap test, or a low triangle count is not a substitute for visual or runtime verification.
