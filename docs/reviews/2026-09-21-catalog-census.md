# Catalog exposure and example census

Snapshot: b81cfd4caed64bd90547ff83b4e513e59a1d4913, 2026-09-21. All 105 catalog entries match 105 sandbox functions. This table inventories exposure, not correctness or model success.

Method: Acorn parsed 86 examples/*.kiln.js files and 87 site/examples/*.kiln.js files recursively and counted direct identifier calls. The site tree overlaps the main examples and must not be added to it. Tests are lexical whole-word references across 213 src/**/*.test.ts files, including strings/comments, not verified assertions. Aliased, property-access, indirect and generated-string calls can be missed. A zero does not prove absence of dogfooding; a positive does not prove quality. External workspaces, historical revisions, evaluation receipts and experiment scripts are outside this census.

42 helpers have no direct call in either example tree. Seven have no lexical reference in src tests. The latter includes three aliases; generic catalog/sandbox tests still exercise exposure for every helper. Use these gaps to select acceptance fixtures, not to delete APIs.

[Machine-readable signatures, descriptions, examples and matching file paths](2026-09-21-catalog-census.json). See the geometry inventory for contract findings and recommendations.

| Helper | Discovery group | Main example files | Site example files | Test reference files |
| --- | --- | ---: | ---: | ---: |
| `copyGeometry` | instancing | 0 | 0 | 1 |
| `copyMaterial` | instancing | 0 | 0 | 1 |
| `meshGeo` | geometry | 14 | 35 | 2 |
| `parametricSurface` | geometry | 5 | 14 | 3 |
| `geometryDiagnostics` | utility | 0 | 0 | 4 |
| `creaseNormals` | mesh-ops | 1 | 4 | 2 |
| `bend` | mesh-ops | 0 | 0 | 3 |
| `twist` | mesh-ops | 0 | 0 | 4 |
| `taper` | mesh-ops | 0 | 0 | 4 |
| `displace` | mesh-ops | 0 | 0 | 2 |
| `sweepProfile` | curves | 6 | 17 | 2 |
| `loftProfiles` | curves | 7 | 14 | 3 |
| `implicitSurface` | geometry | 0 | 0 | 1 |
| `createRoot` | structure | 86 | 87 | 78 |
| `createPivot` | structure | 55 | 75 | 14 |
| `createJointChain` | structure | 0 | 0 | 3 |
| `createVehicleFrame` | structure | 0 | 0 | 7 |
| `createWheelGeometrySet` | instancing | 0 | 0 | 5 |
| `createWheelAssembly` | structure | 0 | 0 | 7 |
| `createPart` | structure | 86 | 87 | 74 |
| `beamBetween` | structure | 48 | 35 | 2 |
| `snapTo` | structure | 0 | 0 | 4 |
| `createLadder` | structure | 9 | 0 | 1 |
| `createWingPair` | structure | 0 | 0 | 1 |
| `room` | structure | 0 | 0 | 5 |
| `wallWithOpening` | structure | 0 | 0 | 1 |
| `createRoofPlanes` | structure | 1 | 0 | 4 |
| `createGableRoof` | structure | 0 | 0 | 1 |
| `createGableEndPanel` | structure | 0 | 0 | 1 |
| `createGableShell` | structure | 0 | 0 | 3 |
| `createRoofSurfaceLayout` | structure | 0 | 0 | 2 |
| `createStairs` | structure | 2 | 0 | 1 |
| `boxGeo` | geometry | 78 | 78 | 79 |
| `sphereGeo` | geometry | 55 | 53 | 14 |
| `cylinderGeo` | geometry | 68 | 65 | 15 |
| `cylinderYGeo` | geometry | 17 | 14 | 0 |
| `cylinderXGeo` | geometry | 52 | 29 | 1 |
| `cylinderZGeo` | geometry | 42 | 23 | 3 |
| `cylinderOnAxis` | geometry | 1 | 0 | 1 |
| `capsuleGeo` | geometry | 5 | 9 | 1 |
| `capsuleYGeo` | geometry | 1 | 0 | 0 |
| `capsuleXGeo` | geometry | 2 | 0 | 1 |
| `capsuleZGeo` | geometry | 1 | 0 | 1 |
| `coneGeo` | geometry | 24 | 25 | 1 |
| `coneYGeo` | geometry | 2 | 0 | 0 |
| `coneXGeo` | geometry | 7 | 2 | 1 |
| `coneZGeo` | geometry | 0 | 0 | 1 |
| `taperConeGeo` | geometry | 6 | 1 | 1 |
| `torusGeo` | geometry | 60 | 49 | 4 |
| `planeGeo` | geometry | 1 | 0 | 3 |
| `decalBox` | geometry | 6 | 0 | 0 |
| `foliageCardGeo` | geometry | 0 | 0 | 3 |
| `crossedQuadsGeo` | geometry | 0 | 0 | 1 |
| `octaGridPlane` | geometry | 0 | 0 | 1 |
| `wingGeo` | geometry | 1 | 2 | 2 |
| `gearGeo` | geometry | 5 | 12 | 3 |
| `bladeGeo` | geometry | 0 | 0 | 1 |
| `gameMaterial` | material | 85 | 87 | 68 |
| `materialRecipe` | material | 1 | 0 | 4 |
| `compilePortableMaterialSpecV2` | material | 0 | 0 | 1 |
| `basicMaterial` | material | 0 | 0 | 2 |
| `glassMaterial` | material | 32 | 28 | 5 |
| `lambertMaterial` | material | 0 | 0 | 5 |
| `rotationTrack` | animation | 22 | 44 | 11 |
| `positionTrack` | animation | 7 | 10 | 4 |
| `scaleTrack` | animation | 1 | 1 | 3 |
| `createClip` | animation | 25 | 51 | 12 |
| `idleBreathing` | animation | 0 | 0 | 1 |
| `bobbingAnimation` | animation | 0 | 0 | 1 |
| `spinAnimation` | animation | 1 | 0 | 1 |
| `cloneGeometry` | instancing | 0 | 0 | 2 |
| `cloneMaterial` | instancing | 0 | 0 | 2 |
| `createInstance` | instancing | 3 | 0 | 5 |
| `boolUnion` | csg | 0 | 0 | 3 |
| `boolDiff` | csg | 7 | 0 | 8 |
| `roundedBoxGeo` | csg | 28 | 21 | 4 |
| `extrudeProfile` | csg | 19 | 7 | 3 |
| `revolveProfile` | csg | 10 | 0 | 2 |
| `circleProfile` | csg | 1 | 0 | 1 |
| `boolIntersect` | csg | 0 | 0 | 3 |
| `hull` | csg | 0 | 0 | 5 |
| `arrayLinear` | arrays | 1 | 0 | 1 |
| `arrayRadial` | arrays | 10 | 0 | 1 |
| `mirror` | arrays | 0 | 0 | 2 |
| `subdivide` | mesh-ops | 1 | 0 | 6 |
| `mergeVertices` | mesh-ops | 2 | 0 | 2 |
| `curveToMesh` | curves | 9 | 4 | 0 |
| `pipeAlongPath` | curves | 21 | 17 | 1 |
| `lathe` | curves | 9 | 4 | 4 |
| `revolveGeo` | curves | 2 | 0 | 2 |
| `bezierCurve` | curves | 8 | 4 | 0 |
| `autoUnwrap` | uv | 13 | 0 | 6 |
| `boxUnwrap` | uv | 1 | 0 | 3 |
| `cylinderUnwrap` | uv | 2 | 0 | 2 |
| `planeUnwrap` | uv | 0 | 0 | 1 |
| `panelRemapV` | uv | 1 | 0 | 0 |
| `loadApprovedTexture` | textures | 0 | 0 | 2 |
| `proceduralTexture` | textures | 13 | 0 | 13 |
| `normalMapFromHeight` | textures | 13 | 0 | 3 |
| `pbrMaterial` | material | 13 | 0 | 11 |
| `foliageMaterial` | material | 0 | 0 | 1 |
| `countTriangles` | utility | 1 | 0 | 2 |
| `countMaterials` | utility | 0 | 0 | 1 |
| `getJointNames` | utility | 0 | 0 | 1 |
| `validateAsset` | utility | 0 | 0 | 1 |
