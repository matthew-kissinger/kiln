# Gallery poster review: assets 36–53

Reviewed all 18 actual 1024-square PNGs in examples/renders using the image viewer, after the corrected GPU batch. This is a presentation review, not engineering validation or a model ranking.

- planetarium-projector: whole silhouette visible with padding; no clipped image edges.
- printing-press: whole silhouette visible with padding; no clipped image edges.
- pumpjack: whole silhouette visible with padding; no clipped image edges.
- radio-telescope: whole silhouette visible with padding; no clipped image edges.
- research-vessel: whole silhouette visible with padding; no clipped image edges.
- rigid-airship: whole silhouette visible with padding; no clipped image edges.
- robot-arm: whole silhouette visible with padding; no clipped image edges.
- steam-locomotive: whole silhouette visible with padding; no clipped image edges.
- street-lamp: whole silhouette visible with padding; no clipped image edges.
- sushi-store: whole silhouette visible with padding; no clipped image edges.
- tram: whole silhouette visible with padding; no clipped image edges.
- trebuchet: whole silhouette visible with padding; no clipped image edges.
- tugboat: whole silhouette visible with padding; no clipped image edges.
- twisting-canopy: whole silhouette visible with padding; no clipped image edges.
- typewriter: whole silhouette visible with padding; no clipped image edges.
- vending-machine: whole silhouette visible with padding; no clipped image edges.
- victorian-greenhouse: whole silhouette visible with padding; no clipped image edges.
- windmill: whole silhouette visible with padding; no clipped image edges.

The airship and greenhouse have low contrast within their white surfaces. The research vessel has a broad metallic hull reflection. These are visible limitations, not image-ratio or clipping failures; none warranted another renderer or source change in this consistency pass. The street lamp naturally occupies less horizontal space than the broad assets.

All use the same neutral studio background and square frame. No source geometry was edited or painted for this review. Source/artifact/image identity is checked separately by the asset verifier.
