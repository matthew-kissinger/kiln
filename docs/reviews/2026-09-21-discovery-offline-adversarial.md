# Discovery offline review

Reviewed the checked-in lexical, SPARSEUP and Qwen experiment receipts and their runners on 2026-09-21. Recommendation: ship the first Discovery implementation with deterministic local lexical retrieval and no optional model backend. Keep the index boundary replaceable. The evidence supports better lexical discovery; it does not yet justify production model dependencies.

| Independent set: 29 supported, 5 unsupported queries | Recall at 5 | MRR at 5 | Queries with any relevant top-5 result |
| --- | ---: | ---: | ---: |
| MiniSearch 7.2.0 | 0.799 | 0.743 | 24/29 |
| SPARSEUP | 0.839 | 0.794 | 26/29 |
| Qwen reranking a combined candidate pool | 0.856 | 0.829 | 26/29 |

SPARSEUP improves recall on two independent queries and reduces it on two others. Both neural approaches still miss the L-profile handrail sweep, corresponding-profile loft and UV-preserving recess requests. Qwen's result is not a MiniSearch-plus-reranker experiment: its candidate pool combines all four lexical results and SPARSEUP. Candidate generation cost is excluded from Qwen's timing. Missing candidates cannot be recovered by reranking; the measured combined pool has a recall ceiling of 0.868 on this set.

All three return results for all five unsupported queries. Nearby helpers can be useful if their limitations remain visible, so returning something is not itself a failure of Discovery. It becomes a failure if a result is presented as implementing the requested capability. Qwen's uncalibrated yes/no score exceeds 0.5 for three unsupported requests: self-intersection certification (geometryDiagnostics, 0.779), arbitrary HTTPS texture loading (loadApprovedTexture, 0.991), and actual draw-call measurement (countMaterials, 0.980). A neural score cannot replace the catalog contract or establish support.

The measured costs are materially different. MiniSearch initializes its index in 3.87 ms, excluding imports; the median of its per-query warmed medians is 0.268 ms. SPARSEUP's recorded model, tokenizer and custom code total about 757 MB before Python/Torch dependencies, with 14.6 seconds indexing 101 helpers and a mean independent-query time of 79 ms on four CPU threads. Qwen averages 7.65 seconds per independent query with CPU float32 inference, batch size four and a 512-token cap. These timing methods differ and are not production latency comparisons. Peak RSS, a low-power device, cold package launch, quantization, and cross-platform model distribution remain unmeasured. The lexical runner uses Bun 1.4.2; its Node compatibility-version field is not evidence of a native Node 22 benchmark.

The evaluation corpus is still 101 helper records exported from the former catalog, not the complete typed Discovery catalog with recipes and explicit contracts. Neural documents contain name, curated intent, old description and family; Qwen's instruction to honor limitations does not supply the new typed limitation fields. Curated intent coverage is uneven. Initial development/reserved queries share an author with preprocessing, while the independent set covers 35 distinct helpers and has now been inspected. Tuning against it makes it a regression set, not a fresh blind holdout.

Before lexical acceptance:

1. Index the shipped catalog, including recipes, with canonical names and exact-ID lookup kept strict. Confirm every entry's searchable metadata and distinguish operation, assembly and recipe results.
2. Fix and preserve the observed misses as regression cases, including misspellings, multi-step requests, local axes, topology and preservation requirements. Do not overfit through query-specific synonym patches.
3. Add independently authored unseen requests across the remaining helpers, recipes, compound needs, negation and unsupported/near-miss capabilities. Judge whether the response helps an agent choose and compose valid tools, not merely whether a nearby word appears.
4. Qualify the actual service through library, CLI and MCP: bounded summaries/detail, filtering, deterministic order, detached results, exact names, retirement errors and useful limitations. Response-size measurements of top-five ID arrays are not service payload measurements.
5. Measure cold import/startup, index cost, warmed distributions, memory and package footprint on supported native Node and Bun paths. Verify offline operation with no credentials, model download or companion process, including a representative low-power CPU when available.

An optional semantic backend should require a fresh, meaningful agent-workflow improvement over this qualified baseline, measured unsupported-query behavior, an explicit installation/resource budget, offline operation after deliberate installation, and reproducible supported-platform distribution. The existing experiments are useful research artifacts; retaining them does not require shipping their Python or model runtime.

Evidence: `scripts/research-discovery/results-independent.json`, `results-sparseup.json`, `results-qwen.json`, `benchmark.ts`, `neural-sparse.py`, `neural-rerank.py`, `documents.json`, and `queries-independent.json`. No code changed during this review and no additional model run was made.
