# Revision and view commands for CLI workspaces

For CLI, put `{"compare":{"programRef":"OLD_REF"}}` in `compare.json`, substituting
the actual reference, then run:

```sh
node kiln.mjs inspect NEW_REF --request compare.json --views revised.png --json
```


The CLI uses the same sampler:

```sh
node kiln.mjs animation RETURNED_REF --clip Open --phases 0,0.35,0.7,1 --framing locked --views motion.png --render gpu --json
```

Use a source file or returned reference. `--phases` maps to `frameTimes`, measured
as fractions rather than seconds. `--frames` is the mutually exclusive count option.
`--shot shot.json` reads one shared shot object, including `subject` and `camera`;
`--camera right` selects a named view when no shot is needed. `--per-frame` writes
numbered PNGs such as `motion.frame-01.png`; `--json` returns their paths, phases and
fidelity receipts without base64. Each file replacement is atomic; the set of files
is not a single transaction. Read the actual images and check clip targets and
attachments. Use `--render cpu` for geometry-only review. Do not rewrite source
into rest poses to stand in for playback of the delivered clip.


CLI uses the same inspection tool. Save only the controls (`shot`, `measure`, etc.,
without `programRef` or `code`) in `inspection.json`, then run:

```sh
node kiln.mjs inspect RETURNED_REF --request inspection.json --views close.png --render cpu --json
```

Read the image together with the measurement. Use `--render gpu` for material
review; the geometric measurement is independent of the image renderer.


For numeric-only inspection omit `--views`; JSON returns `images: []`.
