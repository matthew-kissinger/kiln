# Neutral spatial and effects checkpoint

Navigation, tiling and spatial support now consume explicit requirements alongside
mobility or structure requests. No environment category is selected; a navigation
route through arena seating creates no storey-count obligation. Existing socket
pairing, seam, corridor and support checks retain their exact/advisory modes.
Ground support uses the requested asset-local plane rather than an implicit zero.

Three gaps were found and corrected during migration:

- Instance transforms were ignored in corridor obstacle measurements. Each
  instance now contributes an asset-local bounding box and oriented box.
- Tile sampling transformed a world AABB back into the asset frame, inflating a
  rotated tile's bounds and falsely rejecting valid edges. Bounds and per-instance
  samples now use the asset frame directly.
- Missing corridor evidence and overlapping sheared/degenerate obstacles could
  leave a requested route looking accepted. They now produce an unassessed finding
  and incomplete acceptance. Report validation and final-byte augmentation preserve
  this distinction. Sparse tile measurements have the same coverage treatment.

These remain box/edge-sample measurements. They are not navmesh generation,
continuous collision or proof that all points in a complex environment connect.
Subtype descriptions do not establish geometric coverage. Modular layout/join
requirements and broader cross-helper calibration remain open.

Effects now run the existing material, facing, animation and sidecar checks without
a VFX category. Measurements come from scene objects, materials and clips; source
metadata cannot substitute passing evidence. Final serialized GLB bytes are checked
again for effect surfaces, alpha data, sidedness, facing and clips. This preserves
the existing standalone-alphaMap rejection when the exporter cannot pack its data.
Final-byte checks honor the selected rule mode. A named but unavailable shader
sidecar remains a blocker, rather than being accepted as a portable effect.

The category-free runtime calls the extracted kernels directly. Historical
conformance wrappers remain for older test data and are not runtime fallbacks.
Their public retirement, package qualification and live harness validation remain
separate open tasks. Static/animated mixed assemblies and broader custom effect
coverage still need the planned qualification campaign.

Evidence: the spatial, report, applicability and native-loop set passed 38 tests
and 125 assertions. Effects, reciprocal breadth and real final-byte export checks
passed 22 tests and 90 assertions. Both sets began with observed failing neutral
integration cases. Type checking passed. Broader gates must be recorded against
the rebuilt runtime before final qualification.
