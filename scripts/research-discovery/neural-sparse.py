"""Offline SPARSEUP quality challenger. Downloads are pinned; inference is local CPU."""
import hashlib
import json
import os
import platform
import time
from pathlib import Path

os.environ["HF_HUB_DISABLE_IMPLICIT_TOKEN"] = "1"
os.environ["HF_HUB_DISABLE_PROGRESS_BARS"] = "1"
os.environ["TOKENIZERS_PARALLELISM"] = "false"

import torch
import transformers
from huggingface_hub import snapshot_download
from transformers import AutoModel

HERE = Path(__file__).resolve().parent
MODEL = "Linkup-Platform/linkup-sparseup-embed-v1"
REVISION = "76f294a176372d67d8e30507e6ac3cc4ce3f888f"
torch.set_num_threads(4)
torch.manual_seed(0)
started = time.perf_counter()
snapshot = snapshot_download(MODEL, revision=REVISION, allow_patterns=[
    "config.json", "modeling_splade.py", "model.safetensors", "tokenizer.json", "tokenizer_config.json",
], token=False)
download_seconds = time.perf_counter() - started
# Pinned modeling_splade.py was inspected before enabling its local custom class.
# Force offline after staging: tokenizer/model loading must use the same snapshot.
os.environ["HF_HUB_OFFLINE"] = "1"
started = time.perf_counter()
model = AutoModel.from_pretrained(snapshot, trust_remote_code=True, local_files_only=True,
                                  attn_implementation="eager").eval()
load_seconds = time.perf_counter() - started
docs_bytes = (HERE / "documents.json").read_bytes()
documents = json.loads(docs_bytes)
texts = ["\n".join(str(doc[field]) for field in ["name", "intent", "description", "family"]) for doc in documents]
print(json.dumps({"stage": "loaded", "model": MODEL, "revision": REVISION, "documents": len(documents)}), flush=True)
started = time.perf_counter()
doc_vectors = model.encode(texts, batch_size=2)
index_seconds = time.perf_counter() - started
print(json.dumps({"stage": "indexed", "seconds": index_seconds}), flush=True)
judgment_files = ["queries.json", "queries-independent.json"]
results = []
for filename in judgment_files:
    payload = json.loads((HERE / filename).read_text(encoding="utf-8"))
    queries = payload if isinstance(payload, list) else payload["queries"]
    for index, query in enumerate(queries):
        started = time.perf_counter()
        query_vector = model.encode([query["query"]], kind="query", batch_size=1)
        scores = model.score(query_vector, doc_vectors)[0].tolist()
        elapsed = time.perf_counter() - started
        ranked = sorted(range(len(documents)), key=lambda idx: (-scores[idx], documents[idx]["id"]))
        found = [documents[idx]["id"] for idx in ranked[:5] if scores[idx] > 0]
        relevant = set(query["relevant"])
        rank = next((i for i, entry in enumerate(found) if entry in relevant), -1)
        results.append({**query, "split": query.get("split", "independent"), "found": found,
                        "topScores": [scores[idx] for idx in ranked[:5]], "querySeconds": elapsed,
                        "recallAt5": len(relevant.intersection(found)) / len(relevant) if relevant else None,
                        "reciprocalRank": 1 / (rank + 1) if rank >= 0 else 0,
                        "unsupportedReturned": not relevant and bool(found)})
        if index % 10 == 0:
            print(json.dumps({"stage": "queries", "file": filename, "done": index + 1}), flush=True)
summary = []
for split in ["development", "heldout", "independent"]:
    group = [row for row in results if row["split"] == split]
    supported = [row for row in group if row["relevant"]]
    summary.append({"split": split, "recallAt5": sum(row["recallAt5"] for row in supported) / len(supported),
                    "mrrAt5": sum(row["reciprocalRank"] for row in supported) / len(supported),
                    "unsupportedQueriesReturningResults": sum(row["unsupportedReturned"] for row in group),
                    "meanQuerySeconds": sum(row["querySeconds"] for row in group) / len(group)})
files = {file.name: {"bytes": file.stat().st_size, "sha256": hashlib.sha256(file.read_bytes()).hexdigest()}
         for file in Path(snapshot).iterdir() if file.is_file()}
report = {"version": "kiln.neural-retrieval-experiment.v1", "model": MODEL, "revision": REVISION,
          "python": platform.python_version(), "torch": torch.__version__, "transformers": transformers.__version__,
          "device": "cpu", "threads": 4, "downloadSeconds": download_seconds, "loadSeconds": load_seconds,
          "indexSeconds": index_seconds, "documentsSha256": hashlib.sha256(docs_bytes).hexdigest(),
          "files": files, "summary": summary, "results": results,
          "limitations": ["Single CPU host, eager attention, no warmed query repeats.", "Uses dense in-memory storage of sparse vectors for this small reference corpus; not production index performance.", "Positive dot product is not calibrated capability confidence; no tuned abstention threshold.", "All query sets are observed after this run and cannot remain blind after tuning."]}
(HERE / "results-sparseup.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"stage": "complete", "summary": summary}), flush=True)
