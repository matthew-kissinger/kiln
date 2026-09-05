# Gallery pixel review: alphabetical assets 0–17

Reviewed the actual 1024-square PNGs in `examples/renders` on September 5, 2026, after the shared 45-poster refresh. Each image was opened at full image resolution with `view_image`; this was not a metadata-only check. Scope: backdrop consistency, whole-asset framing, edge clipping, obvious occlusion and gross presentation artifacts. No sources, materials, cameras or images were changed in this review.

All 18 pass the presentation check. They share a light neutral studio backdrop, preserve visible margins around their silhouettes, and show no row-stride corruption, missing image regions or unintended edge cropping. Bright surfaces and metallic highlights remain visible characteristics of the materials; this visual review does not independently prove colorimetric accuracy or hidden geometry validity.

| Asset | Result and observation |
|---|---|
| abyssal-surveyor | Pass. Thruster, antenna, front port and manipulator remain inside frame. White fairing is bright with subtle shading; teal hull and metal trim are distinct. |
| air-defense-radar | Pass. Entire raised array, aerials, cab and deployed supports fit. Array face and vehicle remain readable. |
| aircraft-carrier | Pass. Full hull and deck fit diagonally. Fine deck details are small because the asset is long; empty space is preferable to cropping its ends. |
| anglerfish | Pass. Lure, tail, fins and mouth rim all fit. Large frontal mouth is intentional geometry, not a clipping hole. |
| arcade-cabinet | Pass. Marquee, controls, coin doors and feet fit. Side artwork remains visible and distinct from the dark cabinet. |
| astronomical-clock | Pass. Top ornament and base fit; clock face, rings and lower pendulum are readable. |
| bench-refractor | Pass. Full base and optical assembly fit. Wheel, tube opening and support silhouette are visible. |
| blast-furnace | Pass. Platform footprint, upper roof, stairs and tanks fit. Foreground tanks partially obscure rear structure as expected from this angle. |
| cable-stayed-bridge | Pass. Both deck ends, supports and tower fit. Fine cables remain visible; pale concrete is distinguishable from the backdrop. |
| cafe-racer | Pass. Both wheels, handlebars and raised tail fit. Chrome is bright but has visible shape and reflections. |
| carousel | Pass with optional camera refinement. Full canopy, flag and platform fit. The roof dominates and hides some rear horses; a lower elevation could emphasize the ride figures, but no rerender is required for whole-asset correctness. |
| cathedral | Pass. Crosses, spires and foundation all fit. Front rose window and side roof remain visible; pale stone retains relief. |
| clock-tower | Pass. Weathervane and base fit; two clock faces are visible. Slender form naturally leaves horizontal space. |
| comms-satellite | Pass. Both solar-array tips and aerial fit. The central body appears smaller because the arrays determine the full-asset bounds; no cropping or forced zoom is recommended. |
| crawler-crane | Pass. Boom tip, cable hook and crawler tracks fit. Black rigging remains distinguishable from yellow structure. |
| deep-sea-diver | Pass. Helmet fittings, gloves and boots fit. Copper helmet highlights and pale suit panels remain distinct; character proportions are outside this presentation review. |
| diving-helmet | Pass. Upper opening, side fitting and broad collar fit. Strong gold reflections do not erase the overall form. |
| drilling-rig | Pass. Tower top, platform, stairs and separate pipe stacks fit. Open structure is readable; small details are expected at this whole-asset scale. |

No blocking camera exception was identified in this batch. The carousel's optional lower view is a curation choice, not evidence of an engine defect. This pass does not replace browser thumbnail-size review, animation review or mechanical clearance checks.
