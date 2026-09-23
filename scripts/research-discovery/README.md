# Discovery retrieval experiment

This is an isolated research dependency set, not a shipped runtime choice.

```powershell
npm ci --prefix scripts/research-discovery --ignore-scripts --no-audit --no-fund
bun scripts/research-discovery/benchmark.ts
bun scripts/research-discovery/benchmark.ts --heldout
bun scripts/research-discovery/benchmark.ts --independent
```

Versions are locked. The first experiment used Bun 1.4.2 and Node 22.23.2 on Windows; the dependency installation used npm 10.9.8, so it is not a pinned-toolchain release receipt. The renderer research workspace has a separate pinned npm 12.0.2 installation for subsequent integrated qualification.

The benchmark compares the current substring algorithm with Orama, MiniSearch and FlexSearch using the same current catalog and curated intent metadata for each new retriever. Four scheduled-for-removal helpers are excluded from every corpus. The baseline retains its existing raw-field/AND behavior, so measured improvement combines preprocessing, metadata and retrieval changes; it does not isolate a search-library causal effect.

The initial 30 judgments were written before the first benchmark. Development and reserved queries are separated, but one author wrote both the metadata and judgments. These reserved queries are not an independent blind set. Obtain additional independent judgments before selecting a default. No tuning has been performed after reading the reserved results.

Each report contains catalog/judgment hashes, raw ranked IDs, recall, reciprocal rank, unsupported-query behavior, response bytes, initialization and query timings. Timings are local observations, not a cross-platform performance claim. Exact lookup, abstention and related-result policies are not implemented in these bare retrievers.

The independent 34-query set was authored by another agent without access to the earlier judgments, metadata, benchmark code or results. It is now observed and must not be reused as a fresh final holdout after tuning.

The optional research scripts `export-documents.ts`, `neural-sparse.py` and `neural-rerank.py` produced `results-sparseup.json` and `results-qwen.json`. They are not installation steps or dependencies of Kiln. Python 3.13.15, torch 2.10.0+cpu and transformers 5.3.0 ran in an isolated temporary virtual environment. Both scripts pin model revisions and disable implicit Hugging Face credentials, download only public files, then load staged files locally. SPARSEUP's custom `modeling_splade.py` was inspected before its execution; its hash is in the receipt. Reproduction needs these research-only downloads and sufficient CPU/RAM. The Python environment snapshot is `neural-environment.txt`; it records exact installed package versions, not a platform-independent wheel lock. Qwen uses the lexical/sparse result files as candidate inputs, so run those first. No authoring queries are uploaded to a provider.

The default product decision is in `docs/reviews/2026-09-21-discovery-offline-decision.md`: in-process lexical search, with no shipped neural backend in this pass. Model experiments do not qualify low-power runtime behavior; actual packaged offline/CPU acceptance remains separate.

Integrated lexical regression and isolated index measurements use the actual current catalog and service. Each scale sample runs in a fresh process; its memory delta excludes imported modules and catalog text, and is not total or peak process memory. Five repetitions per size are retained. Synthetic copies at 500 and 1,000 entries measure index growth, not relevance on new concepts.

```powershell
bun scripts/research-discovery/production-benchmark.ts
bun scripts/research-discovery/production-scale.ts
bun build scripts/research-discovery/production-benchmark.ts --target=node --outfile scripts/research-discovery/production-benchmark.mjs
bun build scripts/research-discovery/production-scale.ts --target=node --outfile scripts/research-discovery/production-scale.mjs
node --expose-gc scripts/research-discovery/production-benchmark.mjs
node --expose-gc scripts/research-discovery/production-scale.mjs
```

The Node benchmark bundles are generated locally and ignored. Results record runtime, CPU and catalog hash. The existing judgments are observed regression cases; a file/split named `heldout` does not become a fresh holdout again after its results have been seen.
