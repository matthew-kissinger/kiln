---
name: kiln-batch-dispatch
description: Wire the Kiln plugin into a coding agent CLI, prove the tools are actually reachable, and then dispatch many asset builds across harnesses and models in clean-room sandboxes. Use when asked to set Kiln up in a harness, to generate a batch or library of assets, to compare models on asset authoring, or when a dispatched run produced nothing and you need to know whether the wiring or the model was at fault.
license: MIT
---

# Set Kiln up, then run it at scale

Two jobs live here because they fail as one. Batch generation on unproven wiring produces a pile of
empty sandboxes and no way to tell whether the models were weak or the tools were never there. So
the order is fixed: wire it, prove it, then dispatch.

Everything below runs from a clone of this repository. `node scripts/...` paths are relative to its
root.

## 1. Wire the harness

`docs/install.md` is the reference, one section per harness, and it is the thing to read when a
command below does not match what the CLI in front of you accepts. The shape is the same everywhere:
point the harness at `dist/mcp-server.mjs` over stdio, and give it the `skills/` directory.

```bash
bun install && bun run build:mcp
```

`dist/mcp-server.mjs` is committed, so a fresh clone is already wired; rebuild after editing `src/`.

Claude Code and Antigravity read `.claude/skills` out of the working directory and take the plugin
whole. OpenCode and Codex take the MCP server through their own config file. Hermes is the one that
is genuinely different, a Python agent with its own YAML config and its own skill store, and it
needs `hermes config set skills.external_dirs` pointed at an absolute path, because it does not look
in the working directory at all.

Ask which harness the user actually has rather than assuming. If they have several, wire the ones
they name and leave the rest alone.

## 2. Prove the tools are reachable

```bash
bun run smoke:harness
```

Do not skip this, and do not accept an agent's own report in its place. Every wiring failure in this
system is silent, and they are mutually indistinguishable from the outside: a harness that cannot see
the server answers exactly like one that sees it and will not grant it, which answers exactly like a
model that was not up to the job. The smoke sends a four-line brief into a throwaway directory and
then builds the result with the engine, because the child's claim of success is the one piece of
evidence that proves nothing.

```
agy       ok    105s  gemini-3.8-flash-high  built 12 tris
claude    ok     13s  sonnet                 built 12 tris
hermes    ok     97s  (configured default)   built 12 tris
opencode  ok     37s  opencode-go/glm-5.3    built 12 tris
```

`--harness <name>` checks one. A failure prints the tail of the agent's output and the sandbox path,
which is left on disk: read the brief it was given and whatever it wrote before deciding what broke.
A harness that is not installed is skipped, not failed.

Two failures look alike and are not:

- **No program written.** Either the tools never arrived, or the provider refused the request. The
  printed output says which; a quota message is a quota message.
- **A program written that the engine rejects.** The tools arrived. This is a model result, and it is
  data worth keeping rather than a bug to fix.

## 3. Dispatch one asset

```bash
node scripts/dispatch-asset.mjs --harness opencode --model opencode-go/glm-5.3 --category architecture --timeout 30m --name covered-bridge "a New England covered bridge: a single timber span on stone abutments, a Town lattice truss of crossed planks pegged at every intersection, board-and-batten cladding, a shingled gable roof"
```

What it does, and why each part is load-bearing:

- **A clean room.** Every run gets a fresh temp directory containing the brief and the Kiln skills,
  and nothing else. No repository, no finished examples, no other assets to copy from. This is the
  whole evidentiary value of a dispatch. An agent that can see `examples/` is being tested on its
  ability to read, and the result says nothing about whether the tools teach a model to build.
- **Absolute paths in the brief.** Every CLI resolves relative paths against something different, and
  at least one resolves them against its own installed plugin copy rather than your working tree. A
  brief that says `out/thing.js` writes to a file you will never find.
- **A category, and `prop` is a real answer.** `--category` takes one of `prop`, `character`, `vfx`,
  `environment`, `architecture`, `vegetation`, `vehicle`, defaults to `prop`, and rejects anything
  else. It sets `meta.category` in the program, and for the six non-default values it appends a short
  brief about what tends to go wrong for that kind of subject.

  Those six are **experimental**. Almost anything can be built as a prop, the author skill already
  covers how, and the empty `prop` brief is the least constrained thing this script can send. Naming
  another category trades that freedom for a hint, which pays when the subject really is one of those
  things and costs when it is not -- pushing storey rhythm and eaves at a bandstand, or branching
  rules at something that is a plant in name only, makes the result worse than saying nothing. Reach
  for one deliberately, and if a run comes back worse than the same brief as a prop, drop the category
  before you blame the model.

  What the flag definitely buys, whichever value you pass, is that `meta.category` stops being a
  constant. Before it existed the brief hardcoded `'prop'`, so the field carried no information at
  all and a library could not be sorted by it.
- **The subject, written like a brief and not like a title.** Name the parts. "a trebuchet" gets a
  beam on a frame; naming the sling, the pawl and the iron straps at the joints gets those things.
  The prompts that produced the best assets in this repository read like a description written for
  someone who has to build the thing.
- **`--animate`** when the motion is the subject. A locomotive without moving rods is a shed on
  wheels. It adds the rig requirements to the brief and makes the child prove the loop.

The dispatcher renders whatever came back, writes a `.result.json` beside it with the model, harness
and triangle count, and stamps the authoring model into the file's header. When a run is cut off by a
deadline or a provider limit it keeps the program that was on disk and records that it was
interrupted, because a cut-off run still produced something worth looking at.

## 4. Dispatch a batch

There is no batch subcommand and there does not need to be one. A shell loop over the same script is
the whole feature, and it keeps each run independent so one failure does not take the rest with it.

```bash
for spec in "covered-bridge|architecture|a New England covered bridge with a Town lattice truss" "banyan-tree|vegetation|an old banyan tree with aerial prop roots fused into secondary trunks" "monorail-car|vehicle|a straddle-beam monorail car gripping a concrete guideway"; do
  IFS='|' read -r name category subject <<<"$spec"
  node scripts/dispatch-asset.mjs --harness opencode --model "$MODEL" --category "$category" --timeout 30m --name "$name" "$subject"
done
```

Run several such loops in parallel rather than one long one. They are separate processes against
separate sandboxes. Keep each loop sequential so its runs do not contend for the same model's rate
limit.

Choosing what to spread across:

- **Across models, same subject** answers "which model builds this better". Keep the brief identical
  or the comparison means nothing.
- **Across subjects, same model** builds a library. Spread the *subjects* widely -- a batch of ten
  variations on a crate tells you less than ten different things -- and note that spreading subjects
  is not the same as spreading categories. Ten wildly different props is a good batch; relabelling
  three of them to get a fuller category list is not.
- **Across harnesses** tests the tools rather than the models, and is worth doing once after any
  change to the server or the skills.

Two practical limits, both learned the hard way:

- **Output token caps.** Some harnesses default to a cap far below what the provider allows, and a
  model that hits it stops mid-file and leaves nothing on disk. `scripts/harness.mjs` reads the
  declared limit per model and raises it per run; if you add a harness, do the same there rather than
  working around it one dispatch at a time.
- **Timeouts are budget, not correctness.** A thirty-minute run cut off at minute thirty with a
  usable program on disk is a success. Read `interrupted` in the manifest before calling one a
  failure.

## 5. Judge, then keep

Render everything the same way before comparing anything, because differences in framing and lighting
will dominate your judgement of the assets themselves:

```bash
node scripts/hero-shots.ts
```

Look at them. A batch is not a result until someone has looked at every image in it. What separates a
keeper from a near miss is almost never the triangle count. It is whether the parts meet, whether the
thing stands on the ground, and whether a saturated albedo has blown out to flat white under the
studio dome.

```bash
node scripts/promote-asset.mjs <name>
```

Promotion copies the program into `examples/`, re-runs it to get the triangle count rather than
trusting the dispatch log, and writes the provenance header from the manifest, including whether the
run actually had a clean room. If you repair an asset by hand afterwards, say so in that header. The
gallery makes a claim about who wrote each program, and a claim you have quietly edited is worse than
no claim at all.
