# Local site review

Reviewed the local production preview on 2026-09-05. This review separates browser observations from source inspection. It is not a claim of WCAG conformance, physical mobile-device testing, or representative internet performance.

The root review agent has the enabled in-app browser surface. The camera review subagent's CUA inventory returned no available browsers, so it supplied the temporary DOM-visible metrics fixture and performed source review; it did not substitute another automation backend. Browser observations below must be attributed to the root agent's actual CUA session.

## Source findings

- `Home` and `Gallery` use static images; gallery and secondary home images are lazy loaded. `App` imports the specimen viewer lazily, and `Hero` imports its 3D scene only after the explicit Explore action. These are code observations; network measurements are separate evidence.
- The hero initially displays a high-priority poster with descriptive alternative text. A React error boundary preserves the poster and a readable failure message if interactive rendering fails. `HeroScene` also supplies a Canvas fallback poster. The specimen viewer supplies a WebGL-unavailable message and retains source/GLB links.
- The hero renderer uses `frameloop="demand"`. The full specimen viewer currently uses the default continuous frame loop even with its Spin toggle off. Do not describe every open preview as idle-on-demand.
- Native links, buttons, selects and labeled fieldsets provide keyboard semantics. The stylesheet defines a visible orange focus outline. Viewer arrow-key navigation deliberately ignores focused form controls and links.
- The reduced-motion stylesheet reduces animation and transition durations; spin starts disabled. Actual OS/browser reduced-motion behavior has not been inferred from those rules alone.

## Measurement method

A temporary, unshipped HTML fixture loads the production page in a same-origin iframe and renders measurements in a visible text panel. It records viewport/document widths, canvas count, successful poster loading, Resource Timing GLB requests, paint/LCP entries, long tasks, and elapsed time to two animation frames after clicks. The controls provide 360, 768 and 1440 CSS-pixel viewport widths, a fresh home/collection load, an explicit WebGL-failure fixture, and a clearly labeled CSS 200% layout diagnostic.

The click measurement is not INP or full 3D-ready latency. Resource timings are local desktop observations without network or CPU throttling; cache status matters. CSS zoom is not genuine browser zoom. A WebGL-disabled fixture demonstrates a controlled failure path, not physical hardware incompatibility coverage.

## Browser observations

Root observed these results through CUA in Windows Chrome 152.0.0.0, desktop localhost, warm cache and no throttling. The companion [measurement receipt](results/site-review-2026-09-05.json) preserves the individual readings.

| Check | Observed result |
| --- | --- |
| Home, 1440 CSS px | FCP 88 ms; LCP 184 ms; load observer 59.2 ms; zero GLB requests and zero canvases; 1024 × 768 poster loaded |
| Collection | FCP 36 ms; LCP 68 ms; load observer 25.7 ms; zero GLB requests and zero canvases; 25 resource entries |
| Explore in 3D | One canvas and one orbital-station GLB request; cached request duration 17.7 ms, transfer size 300 bytes; click to two frames 5.8 ms; one 55 ms long task |
| Responsive layout | No document overflow at 360, 768 or 1440 CSS px; corresponding client and scroll widths both 345, 753 and 1425 px |
| CSS 200% diagnostic | No overflow at the 1440-pixel fixture width; this is not browser zoom |
| WebGL failure fixture | Static orbital-station fallback image visible and loaded; no GLB download; a fallback canvas element remained in the DOM |
| Keyboard and visual review | Root saw the orange focus outline on Render record and verified the mobile hero remained wholly visible without cropping |

The browser's actual reduced-motion preference was false. Source rules were inspected, but reduced-motion-on behavior was not exercised. Genuine 200% browser zoom was unavailable through the enabled controls and remains unverified. The warm-cache resource size is not the GLB file size; the click timing is not INP or completed 3D initialization. These readings do not establish mobile hardware, cold internet load or sustained GPU performance.

The root closed the measurement tab after this pass. The exact temporary helper was removed from `site/dist`; its source remains in ignored `tmp/` for reproducibility.

## Final gallery and responsive-detail pass

After the final production build, root used the enabled in-app browser to inspect
the rebuilt site. All 54 gallery cards use 560-square thumbnails generated from
current 1024-square GPU posters, with matching studio backgrounds and aligned
model/harness credit rows. The full-resolution images were separately inspected
in three disjoint batches: [0–17](results/gallery-visual-review-camera-2026-09-05.md),
[18–35](results/gallery-square-review-18-35-2026-09-05.md) and
[36–53](results/gallery-square-review-36-53-2026-09-05.md).

The gallery had no horizontal document overflow at 360, 768 and 1440 CSS pixels
(client/scroll widths 345/345, 753/753 and 1425/1425). Search for “bench” returned
one of 54; “tidal” returned zero of 54. Clearing search restored all 54. The focused
search control showed its orange outline. Bench Refractor's card has the same
square dimensions as its neighbors; material colors remain those of its GLB.

The first narrow detail review found statistics and authorship panels covering
the model. A dedicated model viewport now precedes those panels in normal page
flow at widths up to 900 pixels. Root verified the corrected 360-pixel view with
the entire instrument visible. Expanded authorship stays below the model:
the canvas ends 16 pixels above the statistics at both 360 and 768 pixels.
No horizontal document overflow was present at either width, or at the 1440-pixel
desktop view. The desktop model remains visible between the side panels.
Long provenance identifiers now wrap inside the desktop panel.

The detail page exposed the source, GLB and poster-record links with the expected
source/artifact hashes and retained supplied-source authorship disclosure. All 54
local source/GLB/poster records and teaching demos passed the asset verifier;
these checks do not claim that every specimen was manually rotated in the browser.
The mobile home hero remained a complete 1024 × 768 poster with no document
overflow. The actual reduced-motion preference remained false.

Final site TypeScript, Biome and production builds passed after the layout fix.
The remaining browser, device and platform checks are tracked as separate atomic
tasks in the [remaining-work audit](../plans/remaining-work-audit-2026-09-05.md).
Actual browser zoom and reduced-motion-on checks remain unverified; responsive
viewport checks do not substitute for either.

The subsequent [history and contrast review](results/gallery-history-and-contrast-2026-09-05.md)
records the final informational-text colors, the brief/revision dialog, mouse and
keyboard behavior, missing-record fallback, narrow-screen dimensions and exact
HTTP source downloads. These additional local fixes do not close the unverified
browser-preference or physical-device checks.
