# Final expanded gallery review

The final local production build contains **63 assets**, including ten accepted
assets from fifteen fresh authoring attempts. It totals 995,466 triangles and
28.5 MB of GLB files. The source/GLB/poster verifier passed for all 63 examples,
the two source-edit demo revisions and the geometry/camera example.

Every gallery poster uses the same 1024-square studio recipe, exposure 0.9 and
neutral gray background. The earlier 53 final posters were inspected individually
in three batches; the ten additions were independently opened and reviewed in
their final square presentation. The separately recorded home hero keeps its
4:3 framing. [Curation decisions](showcase-curation-2026-09-05.md) preserve the
five exclusions and the accepted examples' limitations.

The production site built successfully. Site TypeScript and formatting checks
passed; the six history validation tests passed with eleven assertions.
[HTTP verification](final-gallery-http-2026-09-05.json) fetched and hash-checked
235 downloads: 63 source files, 63 GLBs, 63 thumbnails and 46 revision snapshots.
Fourteen examples have public histories. Removed and rejected examples are absent
from the final index.

Browser review used the actual localhost production preview on port 4175:

- Home hero and desktop gallery inspected. The gallery reports 63 entries with no
  horizontal overflow. Its featured order includes Kestrel Rescue Craft and Solar
  Sail Courier alongside existing Astra, Gemini and Muse examples.
- Fighter Jet inspected in the live viewer: fuselage shading, wing edges, canopy
  and landing gear remain visible. No new light or material change was needed.
- Polar Rover inspected at a 360 × 800 viewport: the canvas is 345 × 496, the
  page has no horizontal overflow, and information sits below the asset.
- Polar Rover's brief/history dialog opened and closed correctly. All five
  revisions are present; rejected execution stages are clearly labeled, and the
  current source matches the displayed asset. The desktop viewport was restored.

Below-fold gallery images are lazy-loaded, not reported as broken merely because
they have not entered the viewport. Their actual HTTP bytes were checked above.
This is responsive desktop-browser review, not physical-device or genuine zoom
testing. The previously deferred accessibility/platform checks remain unverified.
