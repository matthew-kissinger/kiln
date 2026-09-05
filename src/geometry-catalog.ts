import type { PrimitiveSpec } from './list-primitives';

/** Authoring helpers discovered through the same catalog as the original primitives. */
export const geometryPrimitives: readonly PrimitiveSpec[] = [
  {
    name: 'copyGeometry',
    signature: 'copyGeometry(geometry: BufferGeometry)',
    returns: 'THREE.BufferGeometry',
    category: 'instancing',
    description:
      'Returns an independent geometry with copied vertex buffers. Use before direct mutation of a cached primitive.',
    example: 'const editable = copyGeometry(boxGeo(1, 1, 1)); editable.translate(0, 0.5, 0);',
  },
  {
    name: 'copyMaterial',
    signature: 'copyMaterial(material: Material)',
    returns: 'THREE.Material (same subtype)',
    category: 'instancing',
    description:
      'Copies material properties so edits do not change other parts. Referenced textures remain shared.',
    example: 'const red = copyMaterial(steel); red.color.set(0xaa2222);',
  },
  {
    name: 'meshGeo',
    signature:
      'meshGeo({ positions: number[], indices?: number[], normals?: number[], uvs?: number[], tangents?: number[] })',
    returns: 'THREE.BufferGeometry',
    category: 'geometry',
    description:
      'Builds an owned triangle mesh from flat numeric arrays. Validates finite values, attribute lengths and indices; computes normals if absent. Counterclockwise winding.',
    example: 'const triangle = meshGeo({ positions: [0,0,0, 1,0,0, 0,1,0], indices: [0,1,2] });',
  },
  {
    name: 'parametricSurface',
    signature:
      "parametricSurface(sample: (u,v) => [x,y,z], opts?: { u?: [0,1], v?: [0,1], uSegments?: 24, vSegments?: 24, periodicU?: false, periodicV?: false, orientation?: 'uv'|'vu' })",
    returns: 'THREE.BufferGeometry',
    category: 'geometry',
    description:
      'Samples an equation into an owned surface with UVs. Periodic endpoints must coincide; UV seams retain matching normals. A surface is not automatically a watertight solid.',
    example:
      'const canopy = parametricSurface((u,v) => [u, 0.3*Math.sin(u*3)*Math.cos(v*2), v], { u: [-2,2], v: [-1,1] });',
  },
  {
    name: 'geometryDiagnostics',
    signature: 'geometryDiagnostics(geometry: BufferGeometry, tolerance?: 1e-6)',
    returns:
      '{ vertices, triangles, boundaryEdges, nonManifoldEdges, orientationConflicts, degenerateTriangles, invalidIndices, nonFiniteVertices }',
    category: 'utility',
    description:
      'Counts mesh topology problems after position-based seam matching. Open boundaries are valid for sheets; closed edges alone do not prove a self-intersection-free solid.',
    example: 'const topology = geometryDiagnostics(shell);',
  },
  {
    name: 'creaseNormals',
    signature: 'creaseNormals(geometry: BufferGeometry, opts?: { angle?: 60, tolerance?: number })',
    returns: 'THREE.BufferGeometry',
    category: 'mesh-ops',
    description:
      'Returns owned geometry with angle-limited smooth normals, preserving UV corners. Angle is degrees. Invalidates tangents; use after shaping for sharp rims and smooth walls.',
    example: 'const shell = creaseNormals(cylinderGeo(1,1,2,32), { angle: 45 });',
  },
  {
    name: 'bend',
    signature:
      'bend(geometry, { angle, frame?: { origin, rotation }, interval?: [minY,maxY], falloff?: t => weight })',
    returns: 'THREE.BufferGeometry',
    category: 'mesh-ops',
    description:
      'Bends local +Y toward +X through angle degrees. Returns owned geometry and updated normals/bounds; preserves UVs, invalidates tangents. Frame rotation is Euler XYZ degrees.',
    promptNotes:
      'Deformation interval uses local Y distances; outside vertices stay unchanged. Add enough segments before bending. Falloff returns 0..1; use it to avoid a discontinuity at a selected interval boundary.',
    example: 'const arch = bend(planeGeo(1,4,4,32), { angle: 90 });',
  },
  {
    name: 'twist',
    signature:
      'twist(geometry, { angle, frame?: { origin, rotation }, interval?: [minY,maxY], falloff?: t => weight })',
    returns: 'THREE.BufferGeometry',
    category: 'mesh-ops',
    description:
      'Rotates the cross-section progressively around local +Y, reaching angle degrees at the end. Returns owned geometry; frame rotation uses Euler XYZ degrees.',
    example: 'const spiral = twist(column, { angle: 120 });',
  },
  {
    name: 'taper',
    signature:
      'taper(geometry, { startScale?: [1,1], endScale: [x,z], frame?: { origin, rotation }, interval?: [minY,maxY], falloff?: t => weight })',
    returns: 'THREE.BufferGeometry',
    category: 'mesh-ops',
    description:
      'Scales local X/Z across the local Y interval using positive start/end scale pairs. Returns owned geometry; preserves UVs and invalidates tangents.',
    example: 'const narrowed = taper(column, { endScale: [0.4,0.7] });',
  },
  {
    name: 'displace',
    signature:
      'displace(geometry, offset: ([x,y,z], t) => [dx,dy,dz], opts?: { frame?: { origin, rotation }, interval?: [minY,maxY], falloff?: t => weight })',
    returns: 'THREE.BufferGeometry',
    category: 'mesh-ops',
    description:
      'Adds an authored displacement vector in the chosen local frame. Returns owned geometry; callback coordinates are local and t is normalized along the interval.',
    example: 'const rippled = displace(surface, ([x,y,z]) => [0, 0.1*Math.sin(x*8), 0]);',
  },
  {
    name: 'sweepProfile',
    signature:
      'sweepProfile(profile: [x,z][], path: [x,y,z][], opts?: { cap?: true, closed?: false, up?: [x,y,z], twist?: 0, scale?: number | [x,z][] })',
    returns: 'THREE.BufferGeometry',
    category: 'curves',
    description:
      'Sweeps a simple noncircular profile along polyline stations using transported frames. Supports total twist in degrees and per-station scales. Generates UVs and optional caps.',
    promptNotes:
      'First version supports one simple profile without holes. Closed paths omit the repeated endpoint and require twist to be a multiple of 360. up sets the initial profile +Z direction and cannot parallel the path. Tight-turn warnings do not replace visual inspection for self-intersections.',
    example:
      'const rail = sweepProfile([[-.1,-.2],[.1,-.2],[.1,.2],[-.1,.2]], [[0,0,0],[0,1,0],[1,2,0]]);',
  },
  {
    name: 'loftProfiles',
    signature:
      'loftProfiles(sections: { profile: [x,z][], frame?: { origin, rotation } }[], opts?: { cap?: true })',
    returns: 'THREE.BufferGeometry',
    category: 'curves',
    description:
      'Joins corresponding simple profiles in explicit local XZ planes. Each frame uses Euler XYZ degrees and local +Y along the loft. Profiles need equal point counts and corresponding vertices.',
    promptNotes:
      'No holes or automatic profile correspondence. Opposite winding is normalized while preserving the first point. Caps close boundaries but do not prove the loft has no self-intersections.',
    example:
      'const hull = loftProfiles([{ profile: wide }, { profile: narrow, frame: { origin: [0,2,0] } }]);',
  },
  {
    name: 'implicitSurface',
    signature:
      'await implicitSurface(sample: ([x,y,z]) => signedValue, { bounds: { min, max }, edgeLength, maxCells?: 1000000, maxEvaluations?: 8000000, level?: 0, tolerance?: -1, smooth?: true })',
    returns: 'Promise<THREE.BufferGeometry>',
    category: 'geometry',
    description:
      'Experimental positive-inside implicit field sampled into a solid mesh. Requires explicit bounds and resolution; checks grid size and actual evaluation count. Output has no UVs.',
    promptNotes:
      'Use async build and await. Smaller edgeLength increases cost sharply. This helper cannot stop a callback that never returns; the host evaluator process provides that boundary. Thin features and geometric accuracy require inspection.',
    example:
      'const blob = await implicitSurface(([x,y,z]) => 1-Math.hypot(x,y,z), { bounds: { min: [-1.2,-1.2,-1.2], max: [1.2,1.2,1.2] }, edgeLength: 0.15 });',
  },
];
