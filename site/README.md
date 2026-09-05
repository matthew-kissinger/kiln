# The gallery

A viewer for every program in [`examples/`](../examples), deployed to GitHub Pages by
[`.github/workflows/pages.yml`](../.github/workflows/pages.yml).

The important thing about it is that it holds no assets of its own. `scripts/build-assets.mjs` runs
each `*.kiln.js` through the same evaluator the test suite uses and keeps what comes back: the GLB,
and the triangle count, draw calls, material count and bounds off the engine's integration manifest.
Edit a program, rebuild, and the mesh on the page is the new one. There is no exported copy sitting
in the repository waiting to disagree with the file beside it, which is also why the built payload is
gitignored rather than committed.

Attribution on each card is read from the program's own header by
[`scripts/authorship.ts`](../scripts/authorship.ts), the same parser the README's authorship test
uses, so the two can never tell different stories about who wrote what.

```bash
bun install          # from this directory
bun run assets       # ~1 minute: fifty programs through the engine
bun run dev
```

`bun run assets` needs the engine's own dependencies, so run `bun install` in the repository root
first. React and three live here and nowhere else; the engine has no browser dependency and this
directory exists partly to keep it that way.

The viewer is a viewer. Nothing in the authoring loop needs a browser — the models that wrote these
programs looked at rendered contact sheets, not at a canvas — and this page is for the person
reading the repository, not for the agent writing to it.
