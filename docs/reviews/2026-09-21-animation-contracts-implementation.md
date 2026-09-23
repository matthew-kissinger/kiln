# Animation contracts implementation: G11/G12

Implemented the bounded animation lane on 2026-09-21. No registry, catalog, CLI, package, or plan files were changed in this lane.

Breathing and bobbing now accept a fourth `options` argument with `basePosition: [x, y, z]`. The displacement follows parent-local Y and returns to that explicit base. Omitting the option preserves the existing zero-origin motion, which remains appropriate for a separate animation pivot. The helper cannot infer a rest pose from a target name. Construction snapshots the supplied components and does not mutate scene nodes. Playback tests use an offset target under a translated, rotated, nonuniformly scaled parent and verify that unrelated target rotation/scale survive.

Track constructors now reject empty or malformed keys, non-finite values, values that overflow float32 storage, negative times, and times that fail to remain strictly increasing after float32 storage. Target strings must be nonempty exact node names without property/path syntax or control characters. Internal spaces and Unicode names are accepted. LINEAR and STEP are explicit; unsupported interpolation is rejected. Scale may intentionally contain finite zero or negative values.

`createClip` validates nonempty names/tracks, target/channel syntax, supported vector/quaternion track types, complete value strides, finite values, ordered nonnegative times, duplicate target/channel pairs, interpolation, and unit quaternion samples with squared-length tolerance `1e-4`. It does not silently normalize malformed quaternions or repair tracks. Existing track references remain shared. An explicit nonnegative duration is in seconds and must include all keys, allowing float32 rounding. `-1` derives duration from the final stored key; other negative durations fail. A zero-duration clip containing time-zero static keys remains valid.

G12 exposed three downstream defects, all reproduced before repair:

1. STEP tracks were exported as LINEAR and both source and GLB review interpolated them. The legacy exporter now writes the real sampler mode; editable review metadata carries it; native GLB reconstruction and the realm-independent poser preserve it. STEP holds through the interval and changes exactly at the next key. Missing interpolation in existing V1 review metadata retains its original LINEAR interpretation; a present unsupported value fails. Cubic tracks cannot silently become linear, including imported native CUBICSPLINE animation in the review loader.
2. Explicit clip duration beyond the final key was lost by both exporters because glTF derives duration from sampler times. Native export now adds a held final sample at the explicit duration, on copied tracks only. Original source tracks and editable review keys remain unchanged. Tests verify both established and experimental Three exporters, LINEAR and STEP, actual GLTFLoader duration, and playback during the trailing hold.
3. The source poser froze LINEAR motion for distinct intervals below `1e-9` seconds. It now interpolates every positive interval. The constructor still rejects key times that collapse together in float32.

Rotation semantics remain absolute local XYZ Euler degrees converted to quaternion keys. LINEAR follows shortest quaternion arcs rather than interpolating Euler angles. Two keys at 0 and 360 degrees do not express a full revolution; `spinAnimation` retains its quarter-turn samples. Spin starts at identity rotation, so retaining a pre-rotated part still calls for a separate animation pivot. Invalid spin axes and nonpositive preset durations now fail clearly.

Scene target existence and uniqueness remain the responsibility of scene-aware inspection/QA. Constructors receive names and cannot prove those facts. Existing advisory unresolved-target behavior and required-target QA remain intact. Two diagnostic tests now mutate tracks after constructing a valid clip, preserving coverage of downstream inspection of externally mutated objects. This lane does not add morph/skinning animation, inverse kinematics, rotation-rest composition, or cubic interpolation support. Unit constructor validation does not replace validation after a caller later mutates shared Three objects.

## Integration changes needed in Discovery and authoring guidance

Catalog ownership remains with the root agent. Update `src/discovery/helper-specs.ts` and `helper-contracts.ts`:

- `idleBreathing(bodyJoint: string, duration?: number, amount?: number, options?: { basePosition?: [number, number, number] })`, with duration default `2`, amount default `0.02` and base default `[0,0,0]`.
- `bobbingAnimation(rootName: string, duration?: number, height?: number, options?: { basePosition?: [number, number, number] })`, with duration default `2`, height default `0.1` and the same base default.
- Replace the animation contract's unqualified ordering/duration language with the implemented invariants above. Keep the scene-existence/uniqueness limitation. `createClip` shares track references; the track helpers snapshot numeric inputs.
- State parent-local position units, local scale factors, Euler XYZ degrees, quaternion shortest-arc behavior, explicit offset semantics, positive preset durations, `createClip`'s `-1` duration sentinel and zero-duration static case.
- State that LINEAR/STEP survive native export and review, cubic interpolation is unsupported, and a longer explicit duration adds a final native hold sample without changing authored keys.
- Replace the blanket zero-position limitation on breathing/bobbing with the option-dependent behavior. Example: `idleBreathing('Joint_Body', 2, 0.02, { basePosition: [0, 1.2, 0] })`. Preserve the separate pivot guidance for spin and other authored absolute tracks.

## Validation

Strict TDD: the initial constructor/rest suite reported 19 expected failures; the initial STEP boundary suite failed all four tests; the trailing-duration suite failed for both exporters and interpolation modes; the small-interval and malformed-null cases also failed before their fixes.

Final CPU-only run: **172 tests passed, 733 assertions, nine files**, in 2.40 seconds under Bun 1.4.2. The files cover new animation contracts/STEP export, existing primitives, render edge cases, source animation views, textured animation preview, asset-export/runtime playback, registry animation media and the experimental exporter. `bun run typecheck` passed. Biome checked the seven changed code/test files successfully. The root agent owns the full repository offline and coverage gates.

Changed implementation: `src/primitives.ts` animation block, animation-only export blocks in `src/render.ts`, `src/views/pose.ts`, and `src/views/glb.ts`. New tests: `src/__tests__/animation-contracts.test.ts`, `src/__tests__/animation-step-export.test.ts`. Existing test adjustment: two animation diagnostic fixtures in `src/__tests__/render-edges.test.ts`.

No GPU, live model, paid service, commit, push or release was used for this lane.
