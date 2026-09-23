# Discovery material and rig recipes

The catalog now has 105 executable helper contracts and 17 optional recipes: all ten existing material baselines and all seven body-plan guidance entries. Material defaults and the biped/quadruped graphs come from their existing authoritative definitions. The five other rig examples are explicitly partial teaching scaffolds. None supplies finished anatomy, skinning, gait or inverse kinematics.

Recipes use versioned IDs, prerequisites, steps, executable source, adaptations, checks and limitations. Search accepts descriptive language, while detail lookup uses the returned exact ID. Retrieval does not consult or modify host capabilities or requirements. Material guidance identifies missing texture detail and the limits of core glTF glass, skin, leaf masking and emissive surfaces. Newly exposed rig guidance remains experimental pending authoring and visual qualification.

All 17 source examples execute in the sandbox and produce GLBs with zero Khronos errors. Export tests also check material factors, exact preset graphs, joint rest translations and parent edges. The broader Discovery suite passed 58 tests before these stronger export assertions were added.

Those assertions exposed F162: both exporters discarded the detailed `kilnCharacterJoint` and `kilnCharacterRig` payloads, despite retaining general semantic tags. Both now preserve the same schema-validated, detached reserved data. Arbitrary userData remains excluded, including cyclic private objects. Malformed reserved data fails explicitly. Eight regression cases cover both converters with optimization off, palette and full, plus rejection; all eight failed before the fix. The combined recipe, rig, character and community-exporter suite subsequently passed 38 tests with 487 assertions.

This establishes source and GLB contract evidence. It does not establish visual quality, destination importer behavior, agent success, or a fully qualified release. Additional structural, foliage and wheel recipes remain assigned to R02–R04. The previous full offline checkpoint predates these changes and must be refreshed.
