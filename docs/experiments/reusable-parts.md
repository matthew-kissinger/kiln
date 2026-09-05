# Reusable parts: ordinary JavaScript first

The X4 trial compares a parameterized portal-frame function with the same assembly code expanded at every call site. Both use the same Kiln primitives, validation, names, materials, and transforms. Source byte counts use LF line endings. No provider or rendering service is involved.

Run `bun scripts/experiment-reusable-parts.ts` from the checkout. The [machine-readable receipt](reusable-parts-results.json) records the output. The [shipped recipe](../../skills/kiln-author-asset/references/reusable-frame.kiln.js) works directly as a Kiln program and illustrates named attachment pivots.

| Assemblies | Function source bytes | Expanded source bytes | Reduction |
| --- | ---: | ---: | ---: |
| 1 | 1,327 | 1,160 | -14.4% |
| 3 | 1,591 | 3,164 | 49.7% |
| 16 | 3,335 | 16,218 | 79.4% |

The function has overhead for a single use. At three repeated assemblies, source is roughly halved. The trial verifies identical named-node transforms and mesh positions for each representation. A 101-byte exact-edit argument changes one height; its top attachment follows from 2.6 to 3.1, and all other assemblies retain their geometry and transforms. These byte counts describe this fixture, not token usage or a measured improvement in model success.

**Adopt ordinary parameterized functions and named child pivots in the skills.** They already express reusable parts, local attachment points, and controlled variants without engine changes or hidden dependencies. The recipe uses JSDoc for a readable parameter contract and validates dimensions at runtime; generated source remains JavaScript.

Do not add a reusable-part DSL or cross-program module handle yet. This trial finds no missing language feature for reuse within one asset. It does not measure duplication across independent projects, so it does not justify a claim that shared modules are unnecessary everywhere. Reopen versioned recipe references when matched tasks show repeated cross-program maintenance that copying a small local function cannot reasonably solve. A candidate must pin recipe content, expose inspectable source, preserve clean-room reproducibility, and reduce repairs or source transfer without hidden dependencies.

`programRef` addresses a whole source revision. It solves retransmission between tools independently of whether that program uses reusable functions. Named anchors are regular scene nodes selected by returned paths; inspect measurements can reference their origins or local points. Camera suggestions remain a separate, advisory experiment.

The skill resource test also builds the shipped recipe and checks the parameter-driven attachment. This is semantic validation; visual appeal and harness usability still require the parent project's clean-room dogfood runs.
