# Gallery history and text contrast review

## Informational text contrast

The 5 September 2026 source review found `--faint` text at approximately 3:1 on the page and panel backgrounds. Twelve informational selectors now use the existing `--dim` color, `#9c9187`: wordmark subtitle, filter labels, result count, card attribution, geometry labels, caption attribution, loading text, footer, aside, copy button, harness tabs and example-card captions. Faint remains only on two decorative hover borders.

Computed sRGB relative-luminance contrast is 6.11:1 on the page (`#13110f`), 5.79:1 on the panel (`#1a1714`) and 6.42:1 on the stage (`#0b0a09`). Caption and geometry panels now have opaque panel backgrounds, so model pixels cannot reduce these text contrasts. Biome checked 11 site files without changes. These checks concern the identified informational text, not full accessibility certification or a substitute for browser review.

## History review

Source review verifies that snapshot publication rejects a different displayed-source hash, validates all retained bytes before writing output, bounds filenames to the example directory, and identifies the displayed revision by hash rather than list position. Native modal-dialog semantics provide focus containment and Escape cancellation; gallery keyboard handling explicitly stops while the dialog is open. Review caught inherited `pointer-events: none` on desktop; both the trigger and dialog now explicitly accept pointer interaction.

Root then reviewed the rebuilt production site through the enabled in-app browser:

- At 1440 pixels, clicking **Brief & revisions** opened the Bench Refractor dialog with its labeled summary, two downloadable revisions and current-source marker. Close received focus.
- ArrowRight inside the dialog left the current specimen unchanged. Tab reached the first source download. Escape closed the dialog, preserved the route, and returned focus to its trigger.
- At 360 pixels, dialog content width and scroll width both measured 294 pixels; page client/scroll widths both measured 345 pixels. The dialog fit within the page (left 17, right 328), the Close control had a visible focus outline, and long hashes wrapped.
- The Orrery dialog stated that no brief or earlier revisions had been added, rather than inventing a history from its caption.
- Actual computed label and attribution color was `rgb(156, 145, 135)` on opaque `rgb(26, 23, 20)` panels, matching the measured contrast colors above.
- All ten revision downloads were fetched from the preview server and matched the retained source hashes. The [download receipt](gallery-history-downloads-2026-09-05.json) records their paths, lengths and hashes.

The new regression file is `scripts/gallery-history.test.ts`, so it participates in the regular offline suite. Its five required behaviors failed against the initial no-op implementation; all six cases then passed after implementation. Combined with the existing gallery provenance and collection checks, 11 focused tests / 30 assertions passed. Site TypeScript, Biome, asset verification and the production build passed. No engine bundle or skill changed.


## Retained source evidence

Four recorded examples publish ten byte-exact snapshots: **abyssal-surveyor** (three), **research-vessel** (three), **twisting-canopy** (two), and **bench-refractor** (two). Each history record validates its snapshot SHA-256 values and includes a revision whose hash exactly matches the current gallery source. The matching current hashes are:

| Example | Current source SHA-256 |
| --- | --- |
| abyssal-surveyor | `3fad8e8c92fbcbc535007bc08db6ff2564d08ac0cbfb840b355e58ae85c0b633` |
| research-vessel | `1f109fd8c5d6de9fe07507e473a1c7ba674565f1544ac68dd6067a5664371455` |
| twisting-canopy | `2d3d12e4e53613289f017fc5c4e20731fe7736655781839168dc2480be3efdcf` |
| bench-refractor | `32223e1d94c3034d14f5d3f401fd7fbb5da3e471ddf92c3acdc319a85a03106d` |

All four briefs are explicitly marked `kind: "summary"`. They summarize the retained original submersible design brief, the research-hull and ribbed-canopy evaluation briefs, and the separate optical-instrument creative-refinement brief. They are not presented as verbatim prompts. Public records and copied sources contain no private absolute paths or raw harness transcripts.

The submersible history records initial design, arm-mount repair and runner-support adjustment. Vessel history distinguishes initial independent authoring from the later supplied-source offset refinement. Canopy history retains the original 0.20-to-0.35 offset edit. Bench history identifies the earlier instrument as a supplied starting study, followed by creative redesign. The later package-833 canopy offset of 0.50 and bench gear-helper revision are separate evaluation versions and are not mislabeled as the displayed gallery source.

The parent independently verified all ten published source downloads over HTTP against their records and reviewed the integrated history modal in the browser. No new model generation or source reconstruction was used to create this history. Examples without retained evidence do not receive invented prompts or revision chains.
