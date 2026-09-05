# Changelog

All notable changes to `@kiln/engine`. This is a **private** package; semver is tracked
for the consuming app's lockfile + tarball provenance, not public npm releases.

## [Unreleased]

### Changed
- **`site/` is a project site now, not a gallery.** The front page was a wall of
  specimens with a tally of triangles above it, which answered a question nobody
  arriving from a link was asking. It now opens on what Kiln is, the offline command
  that proves the engine works with no model and no key, the exact configuration for
  each of the five harnesses with the gotcha that cost time in each one, and a map of
  where to look in the repository; the specimens moved behind `#/gallery` and are
  reached from a strip of eight. The aggregate counts are gone -- a number is a claim
  about the library, and the library is the thing on the other page. Per-card model
  attribution stays, because that is not a statistic. `REPO` and `asset()` moved out of
  `App.tsx` into a leaf module: once `App` imported a page that read one at module
  scope the cycle turned into a blank screen at first paint, and a module that imports
  nothing cannot be in a cycle.

### Fixed
- **The carousel and orrery GIFs no longer show something the programs beside them
  stopped producing.** Both were flagged in review as showing an earlier revision, and
  both were regenerated on the GPU port from the current source. Nothing in the repo
  ties a GIF to the revision it was rendered from, so the staleness was caught by
  somebody remembering rather than by a gate -- the stills have the same exposure.
  A frame overlay confirms the camera is fixed across both loops and only the authored
  motion moves.

### Added
- **A specimen gallery in `site/`, built by running the programs rather than by
  committing meshes.** The README's stills are a weak claim about geometry -- a lit
  render hides topology, and a reader has no way to tell a dense mesh from a clean one.
  The gallery loads all fifty as real GLBs with orbit controls, a wireframe toggle and
  the triangle count, draw calls, material count and bounds off the engine's own
  integration manifest. Nothing in it is checked in: `site/scripts/build-assets.mjs`
  runs each `examples/*.kiln.js` through the same evaluator the test suite uses and
  keeps what comes back, so a program and the mesh on the page cannot drift, and a
  program that stops building fails the deploy. Attribution on each card comes from the
  program's own header through `scripts/authorship.ts` -- extracted from the authorship
  test so that the README and the gallery read the headers with one parser instead of
  two that will eventually disagree. React and three live in `site/` and nowhere else;
  the engine still has no browser dependency. `.github/workflows/pages.yml` deploys it.
- **A fifth skill, `kiln-batch-dispatch`, for the person pointing agents at the problem
  rather than the agent building the asset.** The other four are read by whoever is
  holding the geometry; this one covers wiring a harness up, proving the tools are
  actually reachable before trusting a single result, and running the clean-room
  dispatcher across models and subjects until you have a library. It exists because
  the two halves fail as one: a batch launched on unproven wiring produces a pile of
  empty sandboxes, and no way to tell whether the models were weak or the tools were
  never there. It also writes down the two limits that cost the most time here -- a
  harness's default output cap silently truncating a model mid-file, and a run cut off
  at its deadline still being a success if a usable program is on disk.
- **`--category` on the dispatcher, with six experimental values and one honest
  default.** Every asset ever dispatched from this repository came back
  `category: 'prop'`, because the brief said so in a string literal. The problem was
  never that they were props -- most of them are, correctly, and almost anything can be
  built as one -- but that the field carried no information, so a library could not be
  sorted by it and the engine's per-category guidance was unreachable. The flag takes
  any of the seven contract values and rejects anything else in the first second rather
  than filing an asset under nothing. `prop` stays the default and its brief is
  deliberately empty, which makes it the least constrained thing the dispatcher can
  send. The other six append a short note on what tends to go wrong for that kind of
  subject, and they are a bet rather than a taxonomy: worth reaching for when the
  subject really is a building or a plant, worth dropping first when a run comes back
  worse than the same brief as a prop. `src/__tests__/dispatch-categories.test.ts` fails
  if the list the script carries ever drifts from `ASSET_CATEGORIES`.
- **Hermes as a fifth harness, which is the first real evidence that any of this is
  portable.** The other four are JavaScript CLIs that broadly agree on what a plugin
  is; Hermes is a Python agent with its own YAML config, its own skill store and its
  own provider routing, sharing no code and no convention with them. It takes the
  same `dist/mcp-server.mjs` and the same `skills/` directory unchanged: `hermes mcp
  add` connects on the spot and enumerates all seven tools, and
  `hermes config set skills.external_dirs` registers every shipped skill as `local`. It
  does not read `.claude/skills` out of the working directory the way the others do,
  and that config key is the whole difference. Smoke-tested green at 97s on a free
  model. `-z` is the headless mode the dispatcher drives, and since it has no
  working-directory flag the sandbox is simply the CWD it is spawned in -- which is
  also where it reads `AGENTS.md`, so the clean room holds without extra work.
- **`bun run smoke:harness`, which proves a harness can reach the tools.** Every
  wiring failure in this project has been silent: `agy plugin validate` reports the
  MCP server as processed while `agy mcp list` shows none, and a harness that can
  see the tools but will not grant them answers exactly like one that never had
  them -- which is also what a model too weak for the job looks like. Three
  indistinguishable failures with one symptom is a thing worth being able to test,
  so this sends a short brief into a throwaway directory -- call
  `kiln_list_primitives`, write a four-line program, validate it -- and then builds
  what came back with the engine, because the child's own report of success is the
  only evidence that proves nothing. Measured on one machine: Claude Code 13s,
  OpenCode 37s, Antigravity 105s, each green. Codex reached the model and stopped
  at its account's own usage limit, which is the diagnosis the script exists to
  make -- the wiring is fine and the provider is out. Codex has since been smoked
  green as well, at 37s, once the flag below let it call a tool at all.
- **A fourth vendor in the gallery, and a wider spread of subject.** This step took
  the heroes to twenty-seven, and the additions were chosen for the range they prove
  rather than for how they look: a supercarrier, a phased-array air-defence radar,
  a fighter with a lofted aerofoil and a geostationary comms satellite, which are
  the subjects where a program has to compute its shape rather than place it, and a
  Dutch tower windmill written by DeepSeek V4 Flash -- the first asset here from a
  fourth vendor's model, dispatched clean-room through OpenCode like the Muse Spark
  ones. The anglerfish was rebuilt: the first was a smooth dark cone with a jaw
  drawn on it, and organic form is the case this tool is worst at, so it is the one
  worth showing honestly. Eleven of those twenty-seven were not written by Claude.
- **Tangents for non-indexed geometry.** `computeTangentBasis` required an index
  buffer and warned, per mesh, when there was not one -- so a normal map on any
  flat-shaded part, anything merged from several geometries, and anything through
  `.toNonIndexed()` shipped with no TANGENT attribute and a note saying each runtime
  would guess its own. That is most of what a hand-built asset is made of. A
  triangle soup is an index buffer that reads 0, 1, 2, ..., so the same accumulation
  is exactly right for it and every vertex comes out holding its own face's tangent;
  a test unwelds a box and checks the soup and the indexed copy agree per vertex.
  `examples/anglerfish.kiln.js` had twelve of those warnings and now has none.
- **A measured ceiling on the always-on context cost.** `src/__tests__/mcp-payload.test.ts`
  now derives the JSON Schema for all seven tools and sums the front matter of every
  shipped skill, holds each under a budget, and requires the README to quote the real
  figures. The README argued the surface was small with numbers nothing was checking.
- **`kiln_edit`, the refine verb, and the `kiln-refine-asset` skill that drives it.**
  Every MCP tool took a whole program and rendered it, so changing one line of a
  finished asset meant re-emitting the entire file and trusting that the other two
  hundred lines came back unchanged. `kiln_edit` takes exact-string replacements
  instead: they apply in order, a match that is not unique is refused rather than
  guessed at, and if any edit fails **nothing** is applied -- so a bad edit costs a
  retry rather than a program in a state the model never asked for. It returns the
  patched source, a unified diff, and the six-view sheet together, because the loop
  is edit-then-look. It is deliberately stateless: the in-process agent keeps a
  working buffer across turns, but over MCP the host holds the program text, and a
  second copy inside the server would have been a desync the model cannot see. The
  buffer itself moved to `src/edit-buffer.ts` so both transports share one
  implementation -- importing it from `agent/tools.ts` would have pulled
  `@strands-agents/sdk` into `kiln/tools` and into the MCP bundle, which is the one
  edge that subpath is documented not to have. Like the unified `kiln_render`, the
  def sits outside `createKilnToolRegistry`, whose four tools are a frozen bench
  baseline.
- **The scanned texture library doubled, from eight CC0 families to sixteen.** The
  first eight were all rough exterior surfaces, which left three material recipes --
  `skin`, `leaf`, and `rubber` -- with nothing photographic to bind at all, and made
  rust the only metal in the package. Added: brown leather, forest leaf litter,
  rubber tiles, riveted steel plate, clay roof tiles, cobblestone paving, finished
  oak veneer, and polished marble. 48 maps, 747,977 embedded bytes, still inside the
  1 MiB package budget the test enforces.
- **OpenCode support, and clean-room dispatch.** `scripts/dispatch-asset.mjs` gained an
  `opencode` harness, reaching a dozen vendors' models behind `provider/model` ids.
  More importantly, every dispatch now runs in its own directory containing only the
  brief and the Kiln skills. Dispatches previously ran with the harness pointed
  at this repository, where a child agent could read thirteen finished example
  programs -- which quietly invalidated the claim those runs were evidence for. The
  write grant is scoped to the sandbox, and the authoring model is stamped into the
  program it wrote. `examples/gramophone.kiln.js` is the first asset in the gallery
  actually built that way -- authored through OpenCode by
  `muse-spark-1.3-contributor`, a third vendor's model, in a directory holding
  nothing but the brief and the skills. Every other example predates the sandbox and
  is attributed without the clean-room claim.
- **Animated GIFs of the animated examples, via `scripts/anim-gifs.ts`.** The
  render port fits its camera to the bounding box it is handed, which is right for
  a still and wrong for a sequence -- a robot arm's posed extent varies 63% across
  its cycle, so the asset would appear to breathe as the camera refit itself each
  frame. Because the projection is orthographic and the port's fit is exact, each
  frame is put back onto one shared camera afterwards by a scale and a translation
  that are both computable, so the result is a fixed camera rather than an
  approximation of one.
- **`scripts/check-vision.mjs`, a preflight that refuses to dispatch a blind model.**
  Kiln's loop is the model looking at its own render, so image input is the one
  capability that is not optional -- and a text-only model does not fail, it just
  builds worse assets from the documentation alone. A nine-model batch here was
  found to contain four text-only models, picked by name on the assumption that a
  current flagship accepts images. Vision also varies between a vendor's own
  variants: `glm-5.3-flash` sees images and `glm-5.3` does not. The check reads
  OpenCode's cached model metadata, costs about two seconds for any number of
  models, and exits non-zero naming the offenders.
- **Browser-safe GLB integration manifest.** Every `renderGLB` / `renderSceneToGLB`
  result now carries `kiln.integration-manifest.v1`: artifact SHA-256, metre/+Y-up
  coordinate semantics, world bounds, ground offset, role, render metrics, and
  structural-validator counts. `inspectGlbIntegration(bytes)` derives the same
  contract from finished bytes without executing model-authored source.
- **Four assets from a sixth model, through a sixth harness.** GPT-6 Astra wrote an
  orbital station, a rigid airship at its mooring mast, a blast furnace and a Gothic
  clock tower, dispatched through Codex into the usual clean room. They are the first
  batch in this repository where every program cleared the zero-structural-warning bar
  the shipped examples are held to on the first pass, with no hand repair and no
  promotion-time fix, at 10,212 / 11,764 / 11,964 / 11,664 triangles. The gallery is
  now fifty programs, thirty-five of them written by something other than Claude.

### Fixed
- **The Codex harness could not call a single tool, and said so only in the child's
  transcript.** `codex exec` pins its approval policy to `never`, and a `never` policy
  does not queue an MCP call for later approval, it refuses it outright -- so four
  dispatches came back inside a minute each having written nothing but a note that
  `kiln_list_primitives` was blocked. The dispatcher passed `--sandbox
  workspace-write`, which grants the filesystem and says nothing about tools;
  `--approve-for-me` is the flag that does both, selecting the same sandbox and moving
  approval to automatic review, and the two are mutually exclusive on the command line
  for exactly that reason. Worth noting alongside it: `codex plugin add` installs this
  repository's manifest happily and registers neither its MCP servers nor its skills,
  so the TOML server block is still required -- the same trap `agy` sets, failing the
  same silent way. Both are now documented per-harness in `docs/install.md`.
- **`cylinderUnwrap` now unwraps cylindrically, which it has always claimed to do.**
  It and `boxUnwrap` were the same function: both preserved existing UVs and both fell
  back to the same flat projection, so on the one case the file's own header describes
  -- a curved surface carrying a directional texture -- brick came out as horizontal
  smears. Built-in `cylinderGeo` never hit it because Three.js ships UVs with it;
  anything swept or extruded did, and a texture-backed material on unwrapped geometry
  is a QA blocker rather than a silent miss. It now runs u around the Y axis and v up
  the height, normalized across the geometry's own angular span so a 22 degree curb
  stone gets the whole texture rather than six percent of its width, with caps
  projected flat so they do not sample a single row of texels.
- **The well, which was a ring of boxes pretending to be masonry.** A box has parallel
  sides, so on a circle its neighbours meet it at an angle and the joint opens into a V
  that widens toward the outside face -- 40 mm of it at the outer radius, sixteen times
  around, which read as a cog wheel with a dark slot at every tooth. The curb is now cut
  the way a mason would cut it: wedge stones whose side faces lie on radial planes,
  inner and outer faces following the curve, in two courses offset by half a step so no
  joint runs the full height. The shaft is lined with an extruded ring rather than a
  solid cylinder, since the hole is the point of a well, and there is water at the
  bottom of it. The roof posts are bedded rather than balanced: a square post stopped on
  a round wall always reads as overhanging it, because from any angle where the wall
  curves away it does, so each post now runs past both courses to the plinth and the
  three stones on its line are cut around it with `boolDiff`. Only those stones lose
  their instancing -- an angular overlap test picks them out, one per post in the
  un-skewed course and two in the skewed one where the post straddles a joint.
- **The pinball machine's backbox, which stood on nothing.** It was built entirely
  behind the cabinet's rear face, cantilevered off a 30 mm wall. Sliding it forward onto
  the cabinet only traded one fault for another: the playfield runs the cabinet's full
  length, so everything the head gained in support it took out of the glass, and at
  380 mm deep it buried the bumpers. The fix was the one a real machine already uses --
  the cabinet grew the rear bay the head bolts to. It is 1.34 m long instead of 1.14, its
  rear face and back legs moved with it, the backbox is 200 mm deep rather than 380, and
  the head now sits on that bay entirely behind the glass. The file's header records the
  repair, because the gallery makes a claim about who wrote each program and a claim
  quietly edited afterwards is worse than no claim.
- **The vending machine's sold-out column, which read as a hole in the model.** One
  unlit column was meant to be the asymmetry that stops a 4 x 3 grid looking like a
  texture. It is, but everything in that column -- the dimmed panel, the bezel shelves,
  the rails -- is near-black, so instead of an empty rack behind a switched-off light it
  came out as a solid black rectangle with no shape in it, next to three lit columns. All
  four columns are stocked now, with an amber PET added as the fourth product, and the
  asymmetry that survives is the one that was always doing the work: cans in one column,
  bottles in the other three.
- **The vending machine's bin label, which was a flat plate on a round drum.** A 240 mm
  slab across a 390 mm bin touches it along one line: the middle sinks in and both ends
  stand 40 mm proud, which from the front reads as a white wing growing out of the side.
  It is now an annular sector swept up through the label's height -- the same wedge the
  well's curb stones are cut from -- sitting 6 mm proud all the way round.
- **`createPart` now rejects a wrong call instead of dying in the exporter.** The
  harness smoke run found this the way it was always going to be found: a free model
  on Hermes wrote `createPart(root, { name, geo, material })` -- the shape most other
  scene APIs take -- and the run failed 185 seconds later with `undefined is not an
  object (evaluating 'Object.keys(morphAttributes)')`. Nothing in that sentence names
  anything the model wrote, so it had no way back and spent its remaining turns
  guessing. `new THREE.Mesh()` accepts any two arguments at all, which is what let a
  function reference and a plain object travel that far. The three positional
  arguments are now checked at the door, and each message says which argument, what
  arrived, and what the call looks like when it is right: a parent passed first is
  told the parent belongs in the options object, `boxGeo` without parentheses is told
  geometry helpers have to be called, an un-awaited `roundedBoxGeo` is told the helper
  is async and `build()` has to be too, and a hex number where a material belongs is
  told to wrap it. The same program now fails in under a second with a sentence a
  model can act on.
- **Three hero assets whose geometry was wrong in ways a contact sheet hides.** The
  ferris wheel braced its two A-frames together at mid-height, and the upper tie sat
  1.93 m from the hub inside a 3.60 m rim -- a girder straight through the spokes and
  the cars. It is now a clearance rule rather than a pair of chosen heights: candidate
  bracing levels are filtered against the wheel's swept envelope, rim radius plus how
  far a car hangs below its pin, and only the low portal survives, which is exactly
  where a real double-A-frame wheel is braced. The vending machine's cans were albedo
  `0x4a2f0c` at metalness 0.78; a metal has no diffuse term, so its whole appearance
  is a specular reflection tinted by its albedo, and a near-black albedo under a
  neutral studio dome returns almost nothing -- the cans rendered as black rectangles
  and their column read as empty stock. A printed can is a coating over the metal, so
  it is dielectric like the bottles, and only the bare lid is aluminium. And the
  lighthouse's keeper's cottage stood a plain rectangular slab on each end wall as a
  gable, leaving 0.91 m of stone above the slate at both eaves; the gables are now
  pentagons derived from the roof pitch through `extrudeProfile`, tucked 20 mm under
  the roof underside so the two cannot fight for the same pixel.
- **An external 32,000-token ceiling was ending dispatched runs mid-thought.**
  OpenCode caps one assistant step at 32,000 output tokens by default, whatever the
  model publishes. It is not a number this project set, and it took reading its
  session store to see: across every step ever recorded there, nothing had exceeded
  32,000 -- not once, not by a token -- while the models involved declare between
  80,000 and 943,718. Runs stopped there mid-sentence, with no file and no error,
  looking exactly like a model that was not up to the work. Dispatch now sets
  `OPENCODE_EXPERIMENTAL_OUTPUT_TOKEN_MAX` per run from the model's own declared
  limit, read out of OpenCode's model catalog, so the ceiling is the provider's and
  never one invented here. `docs/install.md` says how to do the same by hand.
- **Removed every default cap on how much work an agent may do.** The generation
  budget defaulted to 40 model calls, `--max-steps` to 24, and whole-program
  rewrites after a first successful render to 2. All three were cost guards from a
  hosted product where the operator paid for the calls. Out here the person running
  the tool is the person paying for it, and a ceiling they did not choose stops an
  asset halfway for reasons that have nothing to do with the asset. All three now
  default to no limit -- zero was already this codebase's "unlimited" value,
  honoured by the call budget, the step hook and the grade-refine headroom check,
  so this is a default change rather than new machinery. `--max-steps` also accepts
  `0` now instead of rejecting the value its own help text recommends, and the
  rewrite bound became a per-host option so a caller who wants it can still ask.
  The sandbox byte limits, the procedural texture bounds and the render deadlines
  stay: those are safety and correctness, not cost.
- **Nothing told a model to write the file before it had solved the asset.** The
  skill's loop said "write the program" at step two and "write the *final* program
  to a file" at step six, which invites a model to keep the whole thing in its head
  until it is finished. Some do, and never arrive: measured through OpenCode's
  session store, four separate runs spent their entire output allowance -- to the
  token -- on one unbroken reasoning block, hand-solving pin positions and cylinder
  attachment points in prose until they were cut off mid-number, having written
  nothing at all. Three different vendors' models failed this way. The loop now
  says to save a rough version early, says plainly not to solve the geometry
  analytically first, and names the failure so a model can recognise it. The
  dispatch brief says the same.
- **Attribution rested on the request rather than on what ran.** The dispatcher
  stamped the model it had *asked* for, which is the one claim the gallery exists
  to make and the one thing it was not checking. It now reads the model back out
  of the harness's own output and records that, reporting the difference if the
  two ever disagree. No harness has been caught substituting a model -- every one
  of the six OpenCode runs already promoted agrees with its log -- so this closes
  a gap rather than a leak, and makes "nothing in the gallery is misattributed" a
  statement backed by a check instead of an assumption.
- **Codex could never have authored an asset.** Three faults in its entry in the
  dispatch table, each of which fired before the model saw the brief, which is why
  nothing in the gallery came from it and why nothing said so. `--full-auto` is
  deprecated in favour of an explicit `--sandbox`. A clean room is a bare temp
  directory, and Codex refuses to start in one as "not inside a trusted directory"
  unless the git check is waived. And the sandbox was never passed at all: with no
  `--cd` the child ran in this repository, with every finished example in reach --
  the exact contamination the sandbox exists to prevent, in the one harness whose
  results would have been quietly worthless rather than merely absent. Its default
  model is now unset rather than `gpt-5.1-codex`, which that account is not entitled
  to and which no repository can guess; dispatch demands `--model` instead of
  stamping an author it cannot name.
- **The dispatcher's usage line omitted OpenCode**, which had written six of the
  twenty-seven programs in the gallery at the time. It is generated from the harness
  table now, so it cannot drift from the list it describes again.
- **A busy GPU renderer was read as an absent one.** `--render auto` probed
  `/health` with a 1.5 second budget and treated anything that was not a clean
  answer as "no service here". The render service is single-threaded, so while it
  is drawing somebody else's frame it accepts the socket and answers late, and a
  batch of agents pointed at one GPU had runs silently drop to the CPU rasterizer
  and judge their materials off a sheet where every textured surface is flat white.
  Nothing logged a fault, because from the caller's side nothing had failed. The
  probe now distinguishes the two: a refused connection still falls through at once,
  which is the point of the short budget on machines with no renderer at all, but a
  timeout is retried against an 8 second one. `src/__tests__/cli-render-mode.test.ts`
  holds a stand-in service to both cases and to the closed port.
- **Material constructors accepted an options object as their colour.**
  `gameMaterial(color, options?)` takes the colour first, and a program that wrote
  `gameMaterial({ color, roughness, metalness })` got a white material at default
  roughness rather than an error: `THREE.Color.set` ignores an object it does not
  recognise, so the mistake survives all the way to the render, where it looks like
  a lighting problem. It cost a real asset an afternoon. All four constructors now
  refuse a non-colour first argument and say where the settings go.
- **A dispatched program that outlived its own run lost its author.**
  `scripts/dispatch-asset.mjs` recorded the authoring model only on a clean exit,
  so a run that wrote a finished program and then hit a wall was scored as having
  produced nothing: the file was still promoted, and stamped `Authored by: null`.
  Which is worse than an honest partial claim, because it is not a claim at all.
  Three assets in this gallery were written that way. The check is now "is there a
  program on disk", asked before the failure is classified rather than inside one
  branch of it, so it covers every way a run can be cut short instead of the one
  that was noticed first -- a provider limit, and the dispatcher's own 25 minute
  deadline, both of which fire long after the program is written. The
  interruption is carried into the manifest and stated plainly in the file header,
  because a run that was cut off cannot claim it looked at its own render and
  revised. Separately, the rate-limit matcher knew `RESOURCE_EXHAUSTED`, `429` and
  `quota` but not "session limit", which is Claude Code's wording, so a batch that
  hit one reported three flat failures and gave up instead of falling back or
  waiting the window out.
- **`examples/aircraft-carrier.kiln.js` wore a comb of teeth around its counter.**
  The hull, the flight deck and the deck-edge netting were runs of axis-aligned
  slabs, each held at the half-beam or the deck width of its own centre. Wherever
  the ship is not parallel to its own keel -- the fine entry, the whole counter, the
  stern round-in where the starboard edge sweeps 21 m outboard in 23 -- every join
  left an end cap facing aft, and an end cap is lit as a different surface from the
  plating either side of it. Halving the station spacing only doubled the number of
  teeth, because the discontinuity was in the normals and not in the size of the
  step. All three are now lofted along their own planform curves, which share their
  vertices: no cap to catch the light, no step to refine, and 7,000 fewer triangles
  than the slabs cost.
- **Dispatched Claude runs stopped for permission with nobody to ask.**
  `--permission-mode acceptEdits` grants writes and nothing else, so a child that
  reached for `kiln_render` blocked on a prompt no terminal was attached to. Three of
  four runs in one batch returned after a minute having written no program, no error
  and exit 0 -- just a courteous note about which permissions they would need, which
  is the worst shape a failure can take on an unattended path. The sandbox now ships
  a `.claude/settings.json` allowing the Kiln MCP tools under either install name
  plus the file tools, scoped to the one throwaway directory rather than reaching for
  `--dangerously-skip-permissions`.
- **A dispatch deadline that could not actually end a run.** `--timeout` fired on
  schedule, wrote "timed out; killed" into the log, and then called `child.kill()`,
  which signals the direct child and nothing beneath it. On the path that matters
  that child is a shell: an npm-installed CLI on Windows is a `.cmd` shim, so the
  agent itself is a grandchild and survived. It went on holding the stdout pipe
  open, `close` never fired, and the job hung after having already been declared
  dead -- three jobs in one batch sat between 14 and 38 minutes past a 24-minute
  deadline, with a concurrency slot held by each. The deadline now kills the
  process tree (`taskkill /T` on Windows; elsewhere the child is spawned as its own
  process-group leader so the group takes the signal), and the promise settles on a
  15-second grace timer whether or not `close` ever arrives, so a descendant that
  refuses to die costs one job rather than the batch.
- **Orthographic views now fit what they are looking at.** The GPU render service
  framed every view with `max(sizeX, sizeY, sizeZ) * 0.72` -- the longest axis
  whichever way the camera was pointed, padded by a constant -- so anything that was
  not a cube rendered small in a large frame, and a long object viewed down its own
  axis was framed for a length nobody could see. Views are now fitted per direction
  by projecting the bounding box's eight corners onto the camera basis, which is
  exact for an orthographic projection. This also makes `--render cpu` and
  `--render gpu` frame identically: the CPU rasterizer has always fitted this way,
  and the two disagreeing meant the documented side-by-side of the two modes was not
  comparing the same crop. `render-service/src/framing.mjs` is the whole of it, and
  it is GPU-free so it is covered by unit tests.
- **Unit-length normals out of `lathe()` and `revolveGeo()`.** `THREE.LatheGeometry`
  copies its running meridian normal into the previous-normal slot *before*
  normalising it, so the final ring of a revolve carried normals scaled by the length
  of the last profile segment -- enough to fail `GLTF_ACCESSOR_VECTOR3_NON_UNIT` on
  export. Both entry points now normalise before returning.
- **`kiln_list_primitives` no longer sends its catalog twice.** The result carried
  all 92 entries as a structured array *and* as the text rendered from that array,
  and the default MCP serialization pretty-printed both: 90,497 bytes for one call.
  Harnesses disagree about results that size. OpenCode truncates them, spills the
  full copy to a file, and hands the model a cut-off catalog -- a dispatched
  `glm-5.3` run spent twenty-two minutes grepping that spill file at increasing
  offsets and never wrote a program. `KilnToolDef` gained an optional `text()`
  extractor (the text analogue of the existing `media()`), so a def whose output
  already contains a rendered form of itself can send that instead of a JSON dump.
  In-process callers still get `primitives` from `run()`. Measured after: 36,647
  bytes, received in full, with the same model correctly enumerating all 92
  primitives. `src/__tests__/mcp-payload.test.ts` holds the ceiling.
- **Unit-length normals out of `subdivide()`.** `three-subdivide` builds each new
  vertex normal by summing the normals of the faces meeting there and never divides
  through, so a normal comes back at the length of however many faces touched it --
  2/3 after one iteration on a box, 0.35 after two. No raster shows it, because a
  shader normalises before it lights, but the glTF validator rejects every one of
  them. Found by a dispatched agent whose printing-press bed was
  `subdivide(boxGeo(1.5, 0.6, 0.8), 2)`: 1,104 bad normals out of 1,152, and the
  build stopped at final-glb. Same repair as `lathe()`.
  `src/__tests__/subdivide-normals.test.ts` also asserts the raw upstream call is
  still broken, so the workaround can be removed the day that changes.
- **Explicit default scenes on exported GLBs.** Generated and composed artifacts now
  set the glTF default scene, and optimize/palette rewrites repair legacy files whose
  first scene existed without being selected. Consumers no longer have to guess which
  scene to mount.
- **`kiln_screenshot_animation` no longer rejects every textured asset.** The tool
  poses the scene and exports it again to render one camera cell, and that export
  was being submitted to asset QA as though it were a new asset. It is not: those
  bytes came out of this engine and had already passed. But a texture that has been
  through a GLB round trip returns as a decoded image without the payload
  provenance `MAT_TEXTURE_DECODE_FAILED` looks for, so QA blocked the preview --
  meaning no textured asset could look at its own animation, including
  `examples/robot-arm.kiln.js`, which is the repository's designated animation
  example. `renderSceneToGLB` gained a `derivative` option that makes QA observe
  rather than block for exactly this re-serialization; reports still record their
  real disposition, and the option is far narrower than the process-wide
  `KILN_QA_MODE` escape hatch.
- **Dispatched agents no longer hang after finishing their work.** `scripts/dispatch-asset.mjs`
  spawned children with stdin as an open pipe. OpenCode keeps its process alive while stdin is open,
  so a run would author the asset, write the file, and then sit there until the dispatch timeout
  killed it and reported a failure. Children are now spawned with stdin closed; the same command
  that ran to a 75-second kill exits in six.
- **The dispatch sandbox is a real one.** It was created under `.dogfood/`, inside this repository,
  so a child agent's CLI resolved the project root by walking up to `.git` and found the whole repo,
  `examples/` included. It now lives in the OS temp directory.
- **The MCP server no longer needs Bun on the consumer's PATH.** Every published
  config said `"command": "bun"`, which asks the harness to resolve a name against
  its own environment. Bun's Windows installer appends to the *User* PATH, and a
  process only ever sees the environment it was born with, so any harness started
  before that install died with `exec: "bun": executable file not found in %PATH%`.
  There is no Bun-specific API on the server's runtime path, so it now ships as
  `dist/mcp-server.mjs`, a committed Node bundle -- committed because a plugin install
  is a git clone with no build step. Bun remains the development toolchain and is no
  longer something a user of the plugin needs.

## [0.6.0] -- 2026-07-12

### Added
- **`measureGlbBounds(bytes)` (H-41).** World-space AABB straight from stored GLB
  bytes (WebIO + `getBounds`, EXT_mesh_gpu_instancing registered) so consumers that
  only hold the artifact never need `executeKilnCode` to recover a footprint --
  Kiln Studio's compose catalog drops its execute-model-code bbox fallback on this.
- **Six-grid rear-quarter variant (H-33 arm).** `SIX_VIEWS_REAR_QUARTER` swaps the
  3/4 cell to the opposite-rear azimuth (`[-0.7, 0.5, -0.7]`, labeled `3/4 Rear`);
  `resolveGridViews(variant)` + the `KILN_GRID_VARIANT=rear-quarter` env select it
  as the `renderViewGrid` default per-process -- no wire or tool-schema change.
  Explicit `opts.views` always wins; unknown env values fall back to `SIX_VIEWS`.
- **Gemini thinking + budget knob (H-43/B1).** The `google` provider now forwards
  `KilnModelDescriptor.maxTokens` → `generationConfig.maxOutputTokens` and effort
  keywords → `thinkingConfig.thinkingLevel` ('xhigh'/'max' collapse to 'high';
  numbers ignored; the KILN_THINKING env stays Anthropic-only). A bare descriptor
  still sends nothing -- Gemini API defaults (65,536 output, dynamic thinking) are
  preserved unless a consumer opts in. NOTE for consumers: registry rows that
  carried a decorative Google `maxTokens` now BIND -- set them to the intended
  ceiling before upgrading.

### Changed
- **The texture library's signal floor is now two floors instead of one.** The
  package-weight test asserted every map's peak channel deviation cleared 2, which
  worked while all eight families were rough: it was really asking "is this real
  photography rather than a proof swatch". Extending the library to smooth materials
  broke it for the right reason -- a polished marble normal map and an oak veneer
  normal map are *supposed* to be near-flat, and one high floor would have quietly
  restricted the library to rough surfaces forever. Per map the assertion is now
  only that the image is not constant; the photography claim is enforced per family,
  where it belongs.
- **OpenRouter reasoning clamp (A7).** `resolveOpenRouterReasoning(thinking,
  maxTokens?)` now bounds reasoning by the completion budget: numeric budgets cap
  at 50% of `maxTokens` (dropped entirely when even the 1024 floor exceeds that
  half), and 'high'/'xhigh' downgrade to 'medium' when OpenRouter's ~80%
  translation would leave < 8,192 visible tokens (the cycle-2 step-1 MaxTokens
  deaths: a 32K model at 'high' kept only ~6.4K for visible output). 64K/48K
  configurations are untouched.
- **QA-blocked render errors are actionable (H-40(3)).** `AssetQaBlockedError`'s
  message now spells out each blocker's human message + authored `repairText`
  (first 6, then a count) instead of bare rule codes -- this string is exactly what
  the agent reads when a mid-loop `kiln_render` is QA-blocked, and what the
  salvage path records for QA-blocked step-cap programs.

### Measured
- **Per-render QA cost (H-40(4), `scripts/qa-cost-bench.ts`):** registry rules add
  1–10 ms p95 per render across all five category fixtures; Khronos validation
  (unconditional, both modes) adds 1–4 ms p95. Two orders of magnitude under the
  1.5 s follow-up threshold -- mid-loop QA stays on unconditionally.

## [0.4.0] -- 2026-07-02

### Added
- **M1c GPU-instancing pass (plan/05 §3.3).** `renderSceneToGLB`/`renderGLB` gain an
  `instance: 'off' | 'auto' | 'on'` option (default `auto` = only `role: 'fill'` assets)
  and `optimizeGlbBytes` gains `{ instance, role }` -- the web-tier re-bake seam, so the
  pass reaches prod with no wire change. Repeated geometry (>= 5 nodes sharing one mesh
  after dedup) is rewritten to `EXT_mesh_gpu_instancing` batches in the upstream-canonical
  `dedup → instance → palette` order, cutting draw calls + bytes for fence runs /
  colonnades / container stacks. **Perf/filesize only -- the A–F grade keys on material
  count and does not move** (tests assert grade + triangle parity). Skipped for
  animated/skinned docs and any asset carrying `Joint*` pivot names (Kiln City targets
  those by name). Results are recorded as `InstancingSummary` (`meta.instancing`,
  `RenderSceneResult.instancing`, `OptimizeGlbResult.instancing` -- and
  `OptimizeGlbResult.summary` is now optional: an instancing-only pass has no
  consolidation summary). All engine glTF IO now registers `EXTMeshGPUInstancing`
  (new dep `@gltf-transform/extensions`) so re-reads (grade-from-bytes,
  optimize-from-bytes, palette snap, scene export merge) preserve the batches, and
  `collectGlbMetrics` is instance-aware (an instanced node counts one draw but N× its
  triangles -- exactly what a supporting GPU renders).
- **M3 composer role/tier awareness (plan/05 §4.1).** `CatalogEntry` gains optional
  `role` (`CatalogAssetRole` -- the M1d asset taxonomy) + `tier` (A–F); `catalogList()`
  (and therefore `scene_list_assets`) surfaces them. Placement roles now DEFAULT from
  the catalog asset's role via `placementRoleForAsset` (wonder/poi → hero, fill → fill,
  else support) in `place`/`placeExact`/`cluster`/`ring`/`layout` -- an explicit agent
  role still wins. The composer system prompt teaches the mapping, wonder scale-up, and
  D/F-tier density budgeting.

## [0.3.0] -- 2026-07-02

### Added
- **Generation-loop transcript compaction (default on).** Before every model call,
  `runKilnAgent` now strips the image out of each SUPERSEDED render tool result
  (kiln_render / kiln_screenshot / kiln_view_interior / animation strips), swapping it for
  a short text placeholder -- only the newest render image rides each request. The prune is
  surgical, unlike the composer's whole-transcript collapse: no messages are added or
  removed, toolUseIds are untouched (tool-use/tool-result pairing stays valid on every
  provider), and the JSON metrics half of each result survives. This was the biggest
  input-token/cost lever in a multi-render run -- previously every render image rode ALL
  later model calls. Opt out per run with `imageCompaction: 'off'`. New helpers exported
  from `agent`: `pruneStaleRenderImages`, `installRenderImageCompaction`,
  `STALE_RENDER_PLACEHOLDER`.
- **M1b grade-aware refine loop (plan/05 §3.2, default on).** After the model finalizes,
  the run bakes + grades the program exactly as the shipped artifact will be graded
  (grade-aware `auto` consolidation, matching `generateKilnAsset` and the Studio web-tier
  re-bake). If it still grades below B for a consolidation-fixable reason -- material
  sprawl (>3 distinct) or texture sprawl (>4), never a transparency-only demotion (glass
  caps at C by design) -- and the step budget leaves headroom, ONE bounded feedback turn
  (grade, material count, offending material list, consolidation directive) is fed back;
  the refined program is kept only if its grade actually improves. Opt out with
  `gradeRefine: 'off'`. Emits a `grade_refine` progress event; token usage now accumulates
  across the extra invoke. New helpers exported from `agent`: `assessProgramGrade`,
  `shouldGradeRefine`, `buildGradeRefineMessage`, `gradeRank`.

### Fixed
- **Step-cap abort no longer discards a rendered program.** A run halted by the model-call
  cap used to return only an error, throwing away the working-buffer program the sink
  already held. If the captured program renders, the run now returns it with the new
  `RunKilnAgentResult.capped: true` flag (mirrors the composer's `capped` semantics); a
  cap with nothing renderable is still an `error`.

## [0.2.0] -- 2026-07-02

The release cut the 0.1.1 composer note promised: formally versions the scene composer
surface (`@kiln/engine/composer`, `/composer/agent` -- shipped in 0.1.x without a bump)
plus the fixes below.

### Fixed
- **`auto` consolidation now fires on 4-material assets.** `PALETTE_MIN` dropped 5 → 4,
  aligning the trigger with the instanceability rubric (grade B tops out at 3 materials,
  so 4 is the first grade-C count). Previously a 4-material asset graded C and `auto`
  never consolidated it.
- **Uint32 indices for >65,535-vertex geometry.** `bridgeGeometry` always wrote
  `Uint16Array` indices, silently wrapping values past 65,535 (corrupt GLB). It now
  selects `Uint32Array` when the vertex count exceeds the Uint16 ceiling; the GLB
  writer emits the matching `componentType` (5125).
- **BYOK `apiKey` reaches Anthropic/OpenAI.** `makeKilnModel` dropped `opts.apiKey` on
  the `anthropic` and `openai` branches (only google/openrouter passed it through), so
  BYOK silently fell back to the provider env vars.

### Changed
- Comments in `agent/tools.ts` / `agent/run.ts` updated: the `unified` tool surface is
  the production surface (Kiln Studio runs `KILN_TOOL_SURFACE=unified`), no longer
  "flag-gated until a bench A/B clears it"; `current` remains the library default.

### Housekeeping
- Added the missing `LICENSE` file (MIT, already declared in `package.json`).
- Rewrote the stale `@pixel-forge/core` module headers (`metrics.ts`, `agent/index.ts`,
  `agent/run.ts`, `palette.ts`) to the `@kiln/engine` reality and removed dangling
  references to files that do not exist in this repo.

## [0.1.1] -- 2026-06-30

### Documentation
- Clarified that `@kiln/engine` remains private execution infrastructure. External developer access
  is mediated by Studio `/v1`, private SDK/skills, and future AgentCore Gateway product tools rather
  than direct engine, raw Forge, or composer harness exposure.

### Changed
- Treat native `claude-sonnet-5` as adaptive-only for Anthropic thinking controls: numeric
  `KILN_THINKING` budgets are ignored for this model so the agent harness does not send
  manual extended-thinking params that Sonnet 5 rejects.

### Added -- scene composer (`@kiln/engine/composer`, `/composer/agent`)
A THREE-free scene-composition surface: a `PlacementModel` single-source-of-truth with a
small scene DSL (`scene()`/`asset()`), terrain-agnostic hierarchy-aware layout, an overlap
validator (MTV resolution), a ground sampler, and a `SceneRenderPort`; plus the Strands
agent loop (`runKilnComposer`, 14 `scene_*` tools) isolated under `/composer/agent` so the
SDK never leaks into the pure core. Transcript compaction collapses to `serialize(model)`
past a threshold (the externalized model IS the state), with a soft step-cap backstop and a
`scene_layout`-first prompt so large many-asset scenes converge. ~990 lines of new tests.

> The surface landed without a version bump (Studio consumed it via the committed
> `@kiln/engine` 0.1.0 tarball); formally versioned by the 0.2.0 release above.

## [0.1.0] -- 2026-06-23

Initial extraction of the Kiln 3D engine from `pixel-forge/packages/core/src/kiln`
(source `d396c10`), file history preserved via `git subtree split`.

### Included (the reachable runtime closure of agent/render/palette/views/arena)
- `agent/` Strands agent loop · `arena/` ranking math · `render.ts` GLB bake/grade/optimize/snap/composeScene
- `primitives.ts` · `solids.ts` (CSG) · `ops.ts` · `gears.ts` · `uv.ts`/`uv-shapes.ts` · `textures.ts`
- `validation.ts` (AST) · `inspect.ts` · `metrics.ts` · `palette.ts`/`palette-snap.ts`
- `list-primitives.ts` · `prompt.ts`/`prompt-api.ts` · `tools/registry.ts` · `views/` (CPU rasterizer + PNG)

### Removed vs pixel-forge core/kiln (what makes it lean)
- TIJ pipeline modules `imposter/`, `fbx-ingest/`, `sprite-atlas/`, `retex/`,
  `photogrammetry/`, `lod/` -- the only modules pulling in Playwright + the heavier
  image path.
- Legacy single-shot `generate.ts` (Studio uses the agent path) and the entangled root
  `index.ts` barrel (Studio consumes subpaths, not the barrel).
- Dropped deps: `@anthropic-ai/*`, `@ai-sdk/{anthropic,google,openai}`, `@google/genai`,
  `openai`, `@fal-ai/client`, Vercel `ai`, `playwright`, `meshoptimizer`, `xatlas-three`,
  `@pixel-forge/shared`.

### Retained runtime deps (lazy-loaded)
- `sharp` -- texture decode in `loadTexture` (`await import('sharp')`).
- `xatlasjs` -- UV atlas in `autoUnwrap` (`await import('xatlasjs/dist/node/...')`).

### Tests
- 36 source test files ported (382 pass / 2 skip / 0 fail offline). Live agent tests
  gated behind `KILN_SPIKE_LIVE=1` (off in CI). Dropped: the 6 OUT-module test suites,
  `deps-smoke` (old dep set), `spike`/`top-level-generate` (tested the deleted barrel
  `generate()` wrapper), and `companions`/`refactor-validation` (tested the legacy
  `generate.ts` companion aliases `kiln.editCode`/`kiln.refactor`, also pruned).
- Provider SDKs (`@anthropic-ai/sdk`, `@google/genai`, `openai`, `ai`,
  `@aws-sdk/client-bedrock-runtime`) are **devDependencies only** -- needed to exercise
  the multi-provider `makeKilnModel` factory in `providers.test.ts`; they never enter
  runtime `dependencies`. The kiln-glb skill-drift gate is `skipIf`-guarded (the skill
  lives outside the engine repo).

### Tooling
- **Biome 2.5.1** adopted (lint + format). Source formatted to Biome style (single
  quotes, 2-space, 100-col); `bun run lint` is green. A baseline of 19 stylistic
  warnings (`noExplicitAny`/`useTemplate`/`useOptionalChain`/`noGlobalIsFinite`/…) is
  left visible for a hardening pass; `noNonNullAssertion`/`useLiteralKeys` are off and
  `useIterableCallbackReturn` is warn (all idiomatic in the extracted code).

### Follow-ups (deliberately deferred from WS0 -- see ../plan/03-standards-harness.md)
- Burn down the 19 Biome warnings + re-promote `useIterableCallbackReturn` to error.
- Tighten `tsconfig` (`exactOptionalPropertyTypes`); currently mirrors pixel-forge core
  for a zero-drift green typecheck.
- Consider `tsup` `dist` build + Vitest golden-image render harness (engine ships TS
  source today for drop-in parity with how Studio consumes core).
- Rename the live-test gate `KILN_SPIKE_LIVE` → `KILN_LIVE`.
