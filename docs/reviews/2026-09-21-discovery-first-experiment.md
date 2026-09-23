# Discovery first retrieval experiment

Status: intermediate evidence for D13-D18. The [offline decision](2026-09-21-discovery-offline-decision.md) selects the lightweight lexical direction, with MiniSearch leading the implementation. Public tool cutover and final qualification remain open.

The runnable [benchmark](../../scripts/research-discovery/benchmark.ts) compares 101 retained helper entries using pinned Orama 3.1.18, FlexSearch 0.8.212 and MiniSearch 7.2.0. Dependency licenses from npm metadata: Orama/FlexSearch Apache-2.0; MiniSearch MIT. Their published unpacked sizes were 2,192,356 / 2,334,755 / 826,513 bytes respectively; these are package metadata, not installed application overhead. Primary API references: [Orama](https://github.com/oramasearch/orama), [FlexSearch](https://github.com/nextapps-de/flexsearch), [MiniSearch](https://lucaong.github.io/minisearch/).

All new candidates receive common normalized fields and weights; FlexSearch combines field ranks with weighted reciprocal rank fusion because its document result shape differs. The existing baseline uses its actual all-words substring behavior. Improvement therefore includes metadata and preprocessing, not merely library replacement.

| Candidate | Development recall@5 | Reserved recall@5 | Reserved MRR@5 | Unsupported reserved queries returning results |
| --- | ---: | ---: | ---: | ---: |
| Current substring | .188 | .000 | .000 | 0/2 |
| Orama | .925 | .967 | .645 | 1/2 |
| MiniSearch | .988 | .967 | .950 | 1/2 |
| FlexSearch with weighted field fusion | .938 | .967 | .783 | 1/2 |

There are 18 development queries (16 with relevant entries) and 12 reserved queries (10 with relevant entries). Recall measures the fraction of judged relevant entries appearing among the first five; MRR is the reciprocal rank of the first relevant result, averaged over supported queries. A zero for unsupported cases can mean useful abstention, while zero for a supported case is failure. The obsolete `cloneGeometry` query still retrieves results through partial matches in all new bare retrievers; the final interface must distinguish retired exact identifiers from useful related suggestions rather than implying that helper remains callable.

These initial results are small, author-curated experiments. The same author wrote metadata and judgments. The follow-ups below add independent queries and model challengers; node-runtime timing, fresh-index growth, memory measurement, agent-use trials and production unsupported-request handling remain unqualified. Library freshness did not predict the ordering here.

Raw results and reproducibility limitations: [development](../../scripts/research-discovery/results-development.json), [reserved](../../scripts/research-discovery/results-heldout.json), [instructions](../../scripts/research-discovery/README.md). The new typed catalog schema separately rejects invalid discriminants, mismatched executable IDs, missing ownership, unknown fields, duplicate IDs and dangling references. Its focused checks pass; population and integration are still open.

## Independent query follow-up

A separate agent then authored 34 queries using only the public helper catalog. It did not inspect the initial queries, intent metadata, ranking implementation or results. The frozen retrievers were run without further tuning against these judgments: 29 supported queries and five unsupported requests, covering 35 distinct relevant helpers. [Independent judgments](../../scripts/research-discovery/queries-independent.json), [raw results](../../scripts/research-discovery/results-independent.json).

| Candidate | Independent recall@5 | Independent MRR@5 | Unsupported queries returning results |
| --- | ---: | ---: | ---: |
| Current substring | .112 | .138 | 0/5 |
| Orama | .649 | .456 | 5/5 |
| MiniSearch | .799 | .743 | 5/5 |
| FlexSearch with weighted field fusion | .641 | .471 | 5/5 |

The harder independent set materially weakens the initial impression of near-perfect retrieval. All new bare retrievers return something for unsupported tasks, so their results must not imply supported capability. Qualification still needs unsupported-request handling, recipe coverage and broader runtime evidence. This set is now observed and must not be presented as an untouched final holdout after subsequent tuning.

## Local neural challengers

Pinned [SPARSEUP](https://huggingface.co/Linkup-Platform/linkup-sparseup-embed-v1) and [Qwen3-Reranker-0.6B](https://huggingface.co/Qwen/Qwen3-Reranker-0.6B) were run locally using public model downloads, no provider calls and no query uploads. Actual versions and revisions are in the [sparse receipt](../../scripts/research-discovery/results-sparseup.json) and [reranking receipt](../../scripts/research-discovery/results-qwen.json). Inference used Python 3.13.15, torch 2.10.0+cpu, transformers 5.3.0 and four CPU threads on this Windows workstation.

| Candidate | Independent recall@5 | Independent MRR@5 | Query timing | Unsupported queries returning results |
| --- | ---: | ---: | --- | ---: |
| MiniSearch | .799 | .743 | .268 ms median of warmed per-query medians | 5/5 |
| SPARSEUP | .839 | .794 | 79.45 ms mean, no repeated warm measurements | 5/5 |
| Qwen over union candidate pool | .856 | .829 | 7.646 seconds mean, excluding candidate generation | 5/5 |

The timing summaries use different repetition methods and are not a matched latency contest. They identify deployment costs to qualify, not general speed ratios. SPARSEUP spent 14.612 seconds encoding the 101 documents and downloaded 753,780,968 model-weight bytes plus tokenizer/custom class files. Its reference implementation stores vocabulary vectors densely in memory; this experiment does not establish production sparse-index memory. Qwen ran float32 with batches of four and a 512-token cap, without quantization. Its candidate pool is the union of the top five results from each lexical retriever and SPARSEUP; independent candidate recall was .868, so the reranker could not recover every relevant helper. A full-catalog reference was not run. Qwen's uncalibrated 0.5 diagnostic still accepted candidates for three of the five unsupported independent queries.

The measured semantic improvement supports continued research but does not justify shipping model infrastructure, even as an optional feature without further evidence. The user explicitly requires useful search on machines unable to run models. Adopt the lexical default and preserve these reproducible challengers as research. Neither embeddings nor LLM query rewriting runs inside Discovery. A future enhancement requires a separate decision and cannot become the baseline's prerequisite.
