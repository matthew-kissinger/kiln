# Discovery runs without a model

Decision: the supported Discovery implementation is local, in-process ranked text search. A user needs no GPU, local model, inference service, network access or provider key to discover Kiln's operations, assemblies and recipes. This requirement applies equally to CLI, MCP and native Strands tools. It is explicit owner direction, not an optimization to relax when retrieval is difficult.

Use weighted lexical ranking, identifier normalization, reviewed intent phrases and aliases, bounded typo/prefix handling, and typed related-entry links. These provide useful natural-language retrieval without a second agent inside the tools. Keep exact IDs/names strict. Similar words and related construction guidance must not imply that an unsupported operation exists.

MiniSearch 7.2.0 is now the implemented lexical engine, selected from the [first experiments](2026-09-21-discovery-first-experiment.md). It supports local ranking, field boosts, prefixes and fuzzy matches with no external dependencies ([primary documentation](https://lucaong.github.io/minisearch/), checked September 21, 2026). Its release age alone is not a reason to discard stronger measured results. This is a choice for this compact catalog; it is not a general claim that lexical retrieval beats modern semantic search.

The independent 29-supported-query set gave MiniSearch recall@5 .799 and MRR@5 .743. The SPARSEUP prototype achieved .839/.794 and Qwen reranking .856/.829. The Qwen candidate union had recall .868, limiting its possible recovery, and CPU query time averaged 7.646 seconds on this workstation. The sparse prototype downloaded 753,780,968 bytes of model weights; the Qwen prototype adds its own larger model and runtime. All three returned candidates for every one of the five unsupported queries. These small experiments show some semantic gain, not a qualified reason to impose model infrastructure on every user.

Do not ship a neural runtime/backend in this pass. Preserve the bounded internal index interface and the runnable research artifacts. An optional future backend would require an explicit adoption decision based on independent helper/recipe queries, agent-use success and installation/latency/memory costs. Its absence must not diminish the supported default; if explicitly selected and unavailable, report failure rather than silently switching modes.

Current measured evidence and remaining qualification:

The integrated 103-entry catalog now yields recall@5 .940 and MRR@5 .891 on the previously observed independent set, identically under Node and Bun. This includes fuller reviewed metadata and is regression evidence, not a new blind comparison with the earlier neural prototypes. All five unsupported requests still receive candidates; useful related construction guidance must not be mistaken for an implemented capability. Raw results are in `scripts/research-discovery/results-production-{node,bun}.json`.

Fresh-process index measurements at 1,000 synthetic entries (five repetitions per runtime) have worst observed initialization 59.8 ms, retained heap growth 5.42 MB and warm/first-query-inclusive p95 1.18 ms across Node 22.23.2 and Bun 1.4.2 on this Windows desktop. These are index-only measurements: catalog/module memory, whole CLI startup and peak RSS are excluded. `results-scale-{node,bun}.json` retain raw samples. Low-power hardware, fresh recipe judgments and installed offline acceptance remain outstanding.

- Integrate complete typed catalog metadata, including new recipes, and validate relevance on fresh judgments after tuning. Keep the observed independent set as a regression set, not a fresh holdout.
- Measure unsupported requests separately from partial useful guidance. A low score is not a calibrated capability verdict. Retired exact names must fail with migration guidance; related suggestions remain clearly labeled.
- Measure CPU-only Node/Bun startup and warm queries, incremental memory, installed overhead and growing indexes. Record reference hardware and raw distributions. Initial engineering budgets for the index alone are p95 warm query below 25 ms, initialization below 250 ms and additional heap below 32 MiB at 1,000 entries; these are qualification targets, not measured product claims or total-process budgets.
- Test the actual packed package with network access blocked, no model cache and no inference dependencies. Assert that discovery neither downloads files nor starts child services, even when optional renderer/model tools are absent.
- Generate a compact orientation map from the catalog. Skills should teach natural-language operation queries and exact contract retrieval rather than a memorized inventory or a dependency on query-rewriting calls.

Better reviewed metadata can be authored with development tools and shipped as plain text. That does not make model inference part of installation or search. Precomputed document embeddings alone still require a way to encode novel queries; they do not satisfy the baseline requirement by themselves.

This decision amends D15/D18 and the shared Discovery design. The public tool cutover is implemented; migration, fresh-query and installed qualification remain separate. The later Node-support additions bring the current plan to 136 tasks. See the [checkpoint](../plans/2026-09-22-progress-checkpoint.md) for current scope and status.
