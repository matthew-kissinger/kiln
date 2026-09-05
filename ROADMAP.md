# Kiln roadmap

The active plan is [Engine and OSS experience](docs/plans/2026-09-05-engine-and-oss-experience.md), accepted in direction on 2026-09-05. It covers engine correctness, more expressive geometry, camera control, retained-program workflows, packaging, model evaluation, and a redesigned README and website.

The delivery order is:

1. Establish the baseline and fix geometry ownership, camera framing, export diagnostics and discovery.
2. Add shared part-relative cameras, custom surfaces, deformation, profile sweeps and lofts.
3. Preserve Boolean attributes, reuse evaluated artifacts, and ship a verified local setup.
4. Evaluate the workflow across current models and redesign the README/site around stronger examples.
5. Resolve bounded experiments in SDFs, beveling, shelling, remeshing and reusable parts.
6. Update and package the skills, dogfood the integrated result with Astra, Gemini through Antigravity (`agy`), and Meta Muse Spark through OpenCode, fix the findings, and retest before delivering the local release candidate.

Final dogfooding uses fresh workspaces and conversations with the candidate's skills and runtime. Every required route must complete authoring, targeted inspection, a source-reference edit and export. Earlier pilot runs or substitute models do not satisfy this gate.

These are planned capabilities, not a list of features already shipped. Task dependencies, acceptance criteria and completion checklists live in the linked plan.
