# Headless asset generation

The repository's dispatcher runs a coding-agent harness in a temporary authoring directory, then builds the resulting program independently. It keeps the brief, transcript, source, GLB, views, and result metadata for review.

```bash
node scripts/dispatch-asset.mjs --harness opencode --model PROVIDER/MODEL --name water-tower "A steel water tower on a riveted lattice frame"
```

Use a model available through your configured provider. Confirm image input support with `node scripts/check-vision.mjs PROVIDER/MODEL`, then check that the harness actually forwards render images. Provider metadata alone does not verify the whole path.

Run `bun run smoke:harness -- --harness opencode` before a batch. A quota or authentication failure is not a measure of asset quality. Inspect the retained transcript and build result when a run fails.

For new integrations, start with the [workspace setup guide](clean-room.md). The older dispatch adapters in [scripts/harness.mjs](../scripts/harness.mjs) have their own harness-specific setup and may inherit user configuration; do not assume every adapter provides the same isolation as a fresh workspace.

## Comparing runs

Keep the brief, supplied files, renderer, and time allowance consistent. Record the exact model and harness version, whether images reached the model, and any inherited context. For refinement, supply only the source being edited; for new assets, omit the example library and engine source.

Review silhouette, construction, attachments, ground contact, and requested detail. Judge materials only from material-faithful images. A valid GLB, a high triangle count, or the model's own success message does not establish that the brief was met.

Use separate workspaces for independent runs and choose concurrency within the available budget. Keep interrupted artifacts, but mark them as partial when they do not satisfy the request. See the batch-dispatch skill for collection and provenance guidance.
