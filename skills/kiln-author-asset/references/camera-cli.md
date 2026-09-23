# Camera export through the CLI

## Save chosen views to PNG

Write only the `capture` object to `cameras.json`, without `programRef` or an outer
`capture` key. Coordinates are JSON numbers, not quoted strings.

```json
{
  "version": "kiln.capture.v1",
  "output": "grid",
  "cols": 1,
  "size": 768,
  "shots": [{
    "name": "Hero",
    "camera": {"type": "orbit", "azimuthDeg": 40, "elevationDeg": 20}
  }]
}
```

```sh
node kiln.mjs render RETURNED_REF --capture cameras.json --views hero.png --out asset.glb
```

Replace `RETURNED_REF` with the reference returned by Kiln. Use the saved revision and
reuse the file for matched before/after cameras. The CLI
uses the same validated camera pipeline as MCP and can reuse the evaluated build.
It writes PNG bytes directly; there is no need to copy image base64. `--capture`
requires `--views`, accepts JSON up to 1 MiB, and supports grid output only. A single
shot is one image; multiple shots share the grid. For separate files, export one
single-shot recipe per requested file. MCP still supports `output: "separate"` for
image blocks delivered to the agent. `--backdrop neutral|dark|light` sets the backdrop of
any `--views` sheet, with or without `--capture`, and wins over the recipe's own `backdrop`.
