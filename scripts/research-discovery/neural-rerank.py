"""Pinned local Qwen reranking challenger over a measured multi-retriever pool."""
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
from transformers import AutoModelForCausalLM, AutoTokenizer

HERE = Path(__file__).resolve().parent
MODEL = "Qwen/Qwen3-Reranker-0.6B"
REVISION = "e61197ed45024b0ed8a2d74b80b4d909f1255473"
torch.set_num_threads(4)
torch.manual_seed(0)
started = time.perf_counter()
snapshot = snapshot_download(MODEL, revision=REVISION, token=False, allow_patterns=[
    "config.json", "model.safetensors", "tokenizer.json", "tokenizer_config.json",
    "merges.txt", "vocab.json", "chat_template.jinja", "generation_config.json",
])
download_seconds = time.perf_counter() - started
os.environ["HF_HUB_OFFLINE"] = "1"
started = time.perf_counter()
tokenizer = AutoTokenizer.from_pretrained(snapshot, local_files_only=True, padding_side="left")
model = AutoModelForCausalLM.from_pretrained(snapshot, local_files_only=True,
                                           dtype=torch.float32, attn_implementation="sdpa").eval()
load_seconds = time.perf_counter() - started
documents_bytes = (HERE / "documents.json").read_bytes()
documents = {doc["id"]: doc for doc in json.loads(documents_bytes)}
yes_id = tokenizer.convert_tokens_to_ids("yes")
no_id = tokenizer.convert_tokens_to_ids("no")
instruction = "Find a Kiln modeling helper that directly implements the requested operation. Related subject matter alone is insufficient; honor the helper's stated limitations."
prefix = "<|im_start|>system\nJudge whether the Document meets the requirements based on the Query and the Instruct provided. Note that the answer can only be \"yes\" or \"no\".<|im_end|>\n<|im_start|>user\n"
suffix = "<|im_end|>\n<|im_start|>assistant\n<think>\n\n</think>\n\n"
prefix_ids = tokenizer.encode(prefix, add_special_tokens=False)
suffix_ids = tokenizer.encode(suffix, add_special_tokens=False)

@torch.inference_mode()
def score(query, ids):
    values = []
    for begin in range(0, len(ids), 4):
        batch = ids[begin:begin + 4]
        bodies = []
        for identifier in batch:
            doc = documents[identifier]
            text = "\n".join(str(doc[field]) for field in ["name", "intent", "description", "family"])
            bodies.append(f"<Instruct>: {instruction}\n<Query>: {query}\n<Document>: {text}")
        enc = tokenizer(bodies, padding=False, truncation=True,
                        max_length=512 - len(prefix_ids) - len(suffix_ids), add_special_tokens=False)
        enc["input_ids"] = [prefix_ids + ids + suffix_ids for ids in enc["input_ids"]]
        enc.pop("attention_mask", None)
        inputs = tokenizer.pad(enc, padding=True, return_tensors="pt")
        logits = model(**inputs, logits_to_keep=1).logits[:, -1, :]
        probabilities = torch.softmax(torch.stack([logits[:, no_id], logits[:, yes_id]], dim=1), dim=1)[:, 1]
        values.extend(probabilities.tolist())
    return values

sparse = json.loads((HERE / "results-sparseup.json").read_text(encoding="utf-8"))["results"]
results = []
print(json.dumps({"stage": "loaded", "model": MODEL, "loadSeconds": load_seconds}), flush=True)
for split in ["development", "heldout", "independent"]:
    lexical = json.loads((HERE / f"results-{split}.json").read_text(encoding="utf-8"))["rows"]
    queries = [entry for entry in sparse if entry["split"] == split]
    for number, query in enumerate(queries):
        candidates = set(query["found"])
        for backend in lexical:
            matched = next(row for row in backend["results"] if row["query"] == query["query"])
            candidates.update(matched["found"])
        pool = sorted(candidates)
        started = time.perf_counter()
        scores = score(query["query"], pool)
        elapsed = time.perf_counter() - started
        ranking = sorted(zip(pool, scores), key=lambda item: (-item[1], item[0]))
        found = [identifier for identifier, _ in ranking[:5]]
        relevant = set(query["relevant"])
        rank = next((i for i, identifier in enumerate(found) if identifier in relevant), -1)
        results.append({"split": split, "query": query["query"], "relevant": query["relevant"],
                        "candidateCount": len(pool), "candidateRecall": len(relevant.intersection(pool)) / len(relevant) if relevant else None,
                        "found": found, "ranking": ranking, "querySeconds": elapsed,
                        "recallAt5": len(relevant.intersection(found)) / len(relevant) if relevant else None,
                        "reciprocalRank": 1 / (rank + 1) if rank >= 0 else 0,
                        "unsupportedReturned": not relevant and bool(found),
                        "unsupportedAboveHalf": not relevant and any(value >= 0.5 for _, value in ranking)})
        if number % 5 == 0:
            print(json.dumps({"stage": "queries", "split": split, "done": number + 1}), flush=True)
    # Save each finished split so a bounded interrupted experiment remains reviewable.
    (HERE / "results-qwen-partial.json").write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8")
summary = []
for split in ["development", "heldout", "independent"]:
    group = [row for row in results if row["split"] == split]
    supported = [row for row in group if row["relevant"]]
    summary.append({"split": split, "recallAt5": sum(row["recallAt5"] for row in supported) / len(supported),
                    "mrrAt5": sum(row["reciprocalRank"] for row in supported) / len(supported),
                    "candidateRecall": sum(row["candidateRecall"] for row in supported) / len(supported),
                    "unsupportedQueriesReturningResults": sum(row["unsupportedReturned"] for row in group),
                    "unsupportedQueriesAboveHalf": sum(row["unsupportedAboveHalf"] for row in group),
                    "meanQuerySeconds": sum(row["querySeconds"] for row in group) / len(group)})
report = {"model": MODEL, "revision": REVISION, "python": platform.python_version(),
          "torch": torch.__version__, "transformers": transformers.__version__, "threads": 4,
          "downloadSeconds": download_seconds, "loadSeconds": load_seconds, "instruction": instruction,
          "documentsSha256": hashlib.sha256(documents_bytes).hexdigest(), "summary": summary, "results": results,
          "limitations": ["CPU float32, batch4 and a 512-token cap; no cross-device or quantization qualification.",
                           "Candidate pool is union of top5 lexical and sparse results; missing relevant entries cannot be recovered.",
                           "0.5 is an uncalibrated diagnostic, not a production acceptance threshold.",
                           "Full-catalog rerank reference and warmed timing distributions remain unrun."]}
(HERE / "results-qwen.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"stage": "complete", "summary": summary}), flush=True)
