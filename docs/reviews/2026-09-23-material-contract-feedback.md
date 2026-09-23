# Material contract feedback from held-out authoring

Heldout02 encountered three opaque execution rejections while trying material
recipes and portable materials. The valid fallback used approved textures with
`pbrMaterial`. Discovery did not clearly distinguish the input forms, and the
evaluator discarded the useful validation reason.

The shared contracts now state that:

- `materialRecipe.textureResources` maps portable slots such as `baseColor` to
  approved ID strings. `albedo` belongs to `pbrMaterial`.
- `compilePortableMaterialSpecV2.textures` requires tagged resource or procedural
  references. Bare ID strings are invalid.
- Portable `baseColor` and `emissive` require numeric color integers. Recipe
  hex-string overrides and CSS material arguments are different contracts.

These failures now return closed, engine-owned repair advice through the worker,
CLI and MCP. Invalid input remains invalid; there is no coercion or compatibility
alias. Authored messages, values and stacks remain private, and forged diagnostic
tags remain generic rejections. The unsupported claim that `gameMaterial` should
be used for 95% of parts was also removed from Discovery.

Worker-boundary tests reproduced the texture failures, then the color failures.
The final focused suite passes 33 tests. Actual compiled Node 22 CLI and standalone
MCP checks agree on three invalid forms, two valid corrected controls and a forged
error. Valid controls export byte-identical GLBs across both interfaces. Discovery
exposes the exact distinctions in both interfaces. This checks material inputs
and exports, not appearance; CPU rendering was sufficient for those checks.

The original scored authoring and frozen held-out runtime are unchanged. Earlier
reviewer attempts are retained: one expected an MCP hash at the wrong JSON path;
another fixed texture references but left an invalid string color in its control.
Neither is counted as successful qualification or an additional model failure.

Evidence under `C:/Users/Mattm/X/kiln-dogfood/unification-2026-09-22/`:
`material-resource-contract-review-qualified/receipt.json`, the diagnostic
red/green logs, and `material-contract-qualified-gate.log`. Current runtime:
`sha256:e1139f4a80db56091f3d906242e8f8658e32bd04790f64b7d8552712589af53e`.
Pinned toolchain, skill checks, build, typecheck, lint and coverage pass: 2,641
tests passed, two Windows skips, zero failures; 95.16% functions / 92.20% lines.
No thresholds changed. Package/install qualification remains later.
