# Discovery search candidates: current engineering and research options

Checked 2026-09-21. This refines the [implementation plan](../plans/2026-09-21-kiln-discovery-and-unified-authoring.md). No dependency was installed, model downloaded, inference run, or ranking benchmark executed. These are candidates, not a measured winner.

## Maintenance evidence

Public GitHub repository metadata returned these `pushed_at` values. A repository push is not necessarily a default-branch code change or a package release, and inactivity alone does not establish abandonment.

| Repository | Last repository push | Latest entry returned by GitHub releases API |
| --- | --- | --- |
| [MiniSearch](https://api.github.com/repos/lucaong/minisearch) | 2025-09-16 | No release entry returned; this does not mean there are no npm versions or tags |
| [Orama](https://api.github.com/repos/oramasearch/orama) | 2026-09-11 | v3.1.18, published 2025-12-19 |
| [FlexSearch](https://api.github.com/repos/nextapps-de/flexsearch) | 2026-06-28 | 0.8.2, published 2025-05-21 |

The user's concern about MiniSearch's visible age is supported. It should be a baseline candidate, not the default winner chosen before comparing alternatives. Recent engine activity and recent neural-ranking research are different dimensions.

## Candidate layers

| Option | What it contributes | Fit and limitations for Kiln |
| --- | --- | --- |
| Orama JS | Local TypeScript full-text retrieval with vector/hybrid extension points | Strong practical candidate for the shared Node/Bun catalog service. Using its lexical engine does not require generating embeddings. Vector mode does require query/document vectors; a hybrid API alone does not create semantic understanding. |
| FlexSearch | Local full-text indexing, configurable encoding/tokenization and contextual search | Useful lexical performance/normalization challenger. Better indexing does not itself bridge arbitrary paraphrases; catalog intent metadata still matters. |
| MiniSearch | Small in-memory ranked full-text baseline with field weighting and fuzzy matching | Retain as a control. Its simpler surface might still win the measured task, but the maintenance concern belongs in dependency selection. |
| SPARSEUP | Recent learned sparse semantic expansion | Research challenger for lexical gaps. It uses sparse embeddings and model inference, not just a synonym file, so it has model/runtime cost even without a dense-vector database. |
| Qwen3 reranker family | Instruction-aware model scoring of query/candidate pairs | Can rank short API/recipe descriptions against an intended modeling operation without maintaining a dense index. Query-time inference and packaging integration remain costs to measure. |
| Jina reranker v3.5 | Recent listwise reranking that considers candidate documents together | Quality reference for distinguishing similar helpers. Released weights have a noncommercial license; not a straightforward default dependency for a generally reusable open-source package. |
| Voyage rerank-2.5 / lite | Hosted instruction-aware reranking | Useful optional hosted comparison if explicitly authorized; adds network, credentials and usage costs to a normally local operation. |

Primary sources: [Orama source and full-text/vector examples](https://github.com/oramasearch/orama), [FlexSearch source](https://github.com/nextapps-de/flexsearch), [MiniSearch source](https://github.com/lucaong/minisearch), [Qwen3 embedding/reranking source](https://github.com/QwenLM/Qwen3-Embedding), [Voyage reranker documentation](https://docs.voyageai.com/docs/reranker). These sources establish capabilities, not comparative Kiln performance.

## Recent frontier examples

**SPARSEUP, September 17, 2026:** Linkup introduced a 149M-parameter ModernBERT-based SPLADE-style model with learned term expansion and an Apache 2.0 release. This is directly relevant to finding related words without manually listing every synonym. The authors describe known imperfections and results on retrieval benchmarks, not procedural-tool discovery. Their sub-millisecond index-search claim must not be mistaken for full query encoding plus retrieval latency. [Primary announcement](https://www.linkup.so/blog/introducing-sparseup-by-linkup), [model card](https://huggingface.co/Linkup-Platform/linkup-sparseup-embed-v1).

**Jina reranker v3.5, July 2026:** a 0.6B listwise model using hybrid attention and self-distillation. It jointly ranks candidates and targets structured-data/domain robustness. Published weights are CC BY-NC 4.0. Treat vendor comparisons as their reported evaluation, not independent proof of a universal winner. [Paper](https://arxiv.org/abs/2607.18152), [model card and license](https://huggingface.co/jinaai/jina-reranker-v3.5).

**Late-interaction retrieval:** token-level query/document matching preserves detail that a single document vector can lose. The recent LightOn family is another research comparison, with models/benchmarks described in its primary materials. This adds multi-vector storage/scoring and model inference. For a small catalog, evaluate direct scoring before assuming a specialized large-scale index is necessary. [LightOn model documentation](https://huggingface.co/lightonai/LateOn-unsupervised). That linked checkpoint is explicitly unsupervised; select the appropriate evaluated checkpoint before an experiment.

These developments show why the shortlist should include more than older JavaScript lexical libraries. They do not establish that a model runtime is justified for roughly a hundred short helper contracts plus recipes.

## Proposed comparison

Evaluate three architectures on the same judged, held-out queries:

1. Local weighted lexical retrieval using Orama, FlexSearch and MiniSearch as implementation candidates, with identical catalog metadata and concept mappings.
2. Lexical retrieval combined with learned sparse or dense retrieval, with a model selected for licensing, host compatibility and practical resource cost.
3. High-recall lexical candidates followed by an instruction-aware reranker. For this small corpus, also measure scoring the full compact catalog as a quality reference; reranking cannot recover an entry omitted from its candidate set.

Treat generated intent phrases as an optional offline catalog-authoring aid, reviewed and shipped as ordinary metadata. This can capture common language without a live model call on every search. Hold out independently written paraphrases so the benchmark does not simply reward memorizing the generated phrases.

Compare useful-result recall and ordering, wrong near-matches, cold startup, warm query latency, memory, installation/download size, Windows/Linux/macOS behavior, offline operation, license suitability and maintenance. Keep exact lookup reliable in every architecture. Do not transfer web-search leaderboard scores directly to API discovery.

My practical front-runner to benchmark is **Orama with strong intent metadata**, while learned sparse retrieval and reranking are **quality challengers**, not categorically deferred until after shipping. MiniSearch stays a baseline. Choose the default from measurements; retain an optional richer backend only if its improvement warrants its operating cost. No hosted retrieval system or model backend is approved merely by this comparison plan.
