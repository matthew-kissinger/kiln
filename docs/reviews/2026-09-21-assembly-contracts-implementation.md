# Assembly access and replication: C01/C02/C03

Implemented the bounded assembly lane on 2026-09-21 in `src/assembly.ts`, with fixtures in `src/assembly.test.ts`. This lane does not modify the sandbox, Discovery catalog, package exports, tool registry, existing part return shapes, or `createInstance`. The latter remains the deliberate single-mesh reuse operation.

## Contract and API

```ts
describeAssembly(root: THREE.Object3D, options?: {
  clips?: readonly THREE.AnimationClip[];
}): AssemblyView

replicateAssembly(source: AssemblyView, options: {
  namespace: string;
  parent?: THREE.Object3D;
  space?: 'local' | 'world';
  geometry?: 'share' | 'copy';
  materials?: 'share' | 'copy';
  externalReferences?: 'reject' | 'preserve';
  unknownMetadata?: 'reject' | 'copy-json';
}): AssemblyReplica
```

The common view contains a root, preorder nodes, scoped classification roles, named semantic frames and sockets, material bindings, root-local bounds, clips and resource ownership. Existing wheel, roof and articulated constructors can be described through their existing roots, without altering their return values. Repeated classification roles remain valid. Node IDs (`n0`, `n1`, etc.) identify a particular preorder snapshot and are not persistent identifiers across structural edits.

The view is a snapshot of lookup lists, metadata and bounds, with live references to the underlying scene objects and resources. It is not a deep-frozen scene. Replication re-describes and revalidates the current root and its selected clips; an earlier valid description cannot authorize a subsequently malformed subtree. Bounds scan all position-buffer samples, including unused vertices, in root-local coordinates. They exclude the root's own transform and ancestors, and establish no skin, morph, shader or displacement bounds. A geometry-free scaffold returns `null`, not fabricated dimensions. Frames expose snapshot affine matrices in root-local coordinates; inherited nonuniform scale can make that composed matrix non-rigid. A material binding is an actual node/index slot, not a newly invented logical material name.

Limits are explicit: at most 10,000 nodes and 2,000,000 position samples per description. Shared geometry contributes samples for each placed mesh because bounds depend on placement. Runtime and allocation cost is proportional to nodes, placed position samples, metadata and animation samples, plus copied buffers/materials when requested. This is not a GPU instancing helper.

## Hierarchy and resource ownership

Every replica owns a separate ordinary Object3D/Group/Mesh hierarchy and fresh node UUIDs. Default placement keeps the root's local position, quaternion and scale under the requested parent; all descendant local transforms survive. The source hierarchy and transform caches are not updated or reparented. Namespace, reference, metadata, transform and animation preflight occurs before destination attachment. The new root is attached only after successful construction and re-description.

Geometry and materials default to explicit sharing. Their `copy` policies clone each unique source resource once, preserving sharing within the replica while making its editable buffers or material objects independent of the source. Material arrays remain arrays. Material copying continues to share textures. Geometry/material JSON metadata is opaque and is not reference-remapped. Copying a custom geometry class, custom clone implementation, ShaderMaterial, material callbacks or custom program-cache behavior fails rather than claiming ownership while losing behavior. Explicit resource sharing retains the existing implementation; it does not certify that implementation's portability through GLB export.

`space: 'world'` computes the source world matrix relative to the destination parent. It succeeds only if the resulting root-local matrix is losslessly representable as TRS. Source local matrices must also be finite, invertible TRS. Valid hierarchy composition may produce world shear, but local shear, singular/zero scale and externally managed `matrixWorldAutoUpdate=false` are unsupported. The comparison uses per-element tolerances so a huge translation cannot mask shear. Auto-updated nodes retain their exact authored signed scale and quaternion components: an equivalent matrix decomposition can otherwise alter absolute animation behavior. Static manual TRS matrices are supported and receive fresh world-cache state on the replica.

World placement of an animated assembly root, or a root carrying a character joint descriptor, fails because it would require track/rest-transform rebasing. A static wrapper root with animated child pivots works, as does local placement. Animation of manual `matrixAutoUpdate=false` nodes is rejected. These limitations are explicit; this lane does not claim arbitrary matrix animation.

## Semantic and animation identity

The caller supplies a 1–64 character namespace: lowercase letter first, lowercase letters/digits thereafter, with single internal underscores or hyphens. New node names contain the namespace, a sanitized original name and snapshot node ID. When a parent is supplied, the destination tree is checked for the reserved namespace and joint-role collisions before attaching anything. Detached replicas have no global name registry; callers must use distinct namespaces when later composing them.

Concrete internal node references resolve against both names and UUIDs and become portable replica node names. A name/UUID collision pointing at two nodes is ambiguous and fails. Unique internal role references also become concrete replica node targets, while the classification roles themselves remain meaningful and unchanged. Socket identities receive namespace plus owning node ID; relationship targets are remapped accordingly. Ambiguous strings fail instead of selecting the first match. Repeated unreferenced classification roles are allowed.

Character joint roles and aliases receive the declared namespace. Internal parent roles, joint semantic identity tags and complete rig-graph descriptors are remapped. Generic side/classification tags and local rest values remain intact. Every rig-graph role must correspond to a joint node in the replicated subtree. This preserves the existing rigid articulation metadata, not a native Three Skeleton or skin binding.

Clips attached anywhere inside the subtree are included alongside explicitly supplied clips. Replication reuses the G12 track/clip invariant checks, clones tracks and remaps internal targets, retaining exact stored times, values, duration and LINEAR/STEP interpolation. Duplicate clip names are rejected. Attached node animation lists reference the corresponding copied clips. Additive clips are unsupported. The returned `clipMap`, `nodeMap`, `nameMap` and `jointRoleMap` expose the remapping rather than making callers reconstruct it.

External semantic targets, animation targets and character parents fail by default. `externalReferences: 'preserve'` keeps those strings unchanged and lists each retained reference. The caller owns the external binding and must check it in the final scene; a preserved external animation can intentionally affect an object outside the replica. This option is not a claim that the result is self-contained. Existing wheel helpers carry external axle/chassis relationships, which the fixtures expose through this policy.

Unknown node/clip metadata fails by default. `unknownMetadata: 'copy-json'` accepts inert finite JSON and copies it verbatim, without guessing which strings are identities. Opaque copies are therefore not presumed reference-safe or guaranteed to survive the engine's GLB extras allowlist. Cycles, functions, getters, symbols, non-enumerable properties, sparse/extended arrays and non-JSON objects are rejected. Getters are detected before semantic readers run. Unknown fields inside a recognized semantic/character payload are rejected even in opaque-copy mode, because schema normalization would otherwise silently discard them.

The existing semantic V1 validator checks relationship `targetFrame` against source-node frame IDs. This lane preserves those strings and does not claim to implement attachment solving or repair that schema. C08 remains the place to establish frame-to-frame attachment behavior.

## Qualified fixtures and remaining limits

Focused tests cover a two-post bay, complete wheel and roof subtrees, and a branched rigid articulated graph. They verify nonidentity source/destination parents; unchanged source nodes; full child counts; exact signed TRS; material/geometry sharing versus copying; UV/group preservation; texture sharing; root-local bounds; detached snapshots; namespace collisions; role/node/socket/UUID remapping; external-reference policies; rig roles/parents/aliases/rest values; attached and explicit clips; and STEP playback on the replica without moving the source. An actual export/reload test verifies concrete semantic targets and sampled STEP playback after GLB export.

Supported nodes are ordinary Object3D, Group and Mesh only. SkinnedMesh, Bone, InstancedMesh, InstancedBufferGeometry, morph targets, custom node classes and custom node render/shadow callbacks fail clearly. Cameras, lights, sprites and LOD are also outside this bounded authored-part contract. This does not narrow the existing `createInstance` implementation. General skeleton cloning, material-slot replacement, attachment solving, pattern repetition, geometry mutation and visual/consumer acceptance are separate tasks. The existing constructor tests plus these fixtures are not completion evidence for C04–C08.

## Integration required

The root integration owner should expose the two functions through the shared primitive manifest/sandbox and Discovery, and add `./assembly` to the package export map if direct module consumers should use it. The source file already falls under the package's source-file include. Add the exported TypeScript interfaces and `ASSEMBLY_LIMITS` to whichever public re-export surface is chosen. Both helpers are synchronous CPU operations; `replicateAssembly` is an operation accepting an assembly view, not a category-restricted part constructor.

Discovery contracts should state the signatures, defaults, snapshot/live-reference split, root-local units and coordinates, explicit sharing/copying, shared textures, TRS/shear boundaries, external and opaque metadata policies, unsupported nodes/animations, required namespace, and bounded cost described above. Authoring guidance should show `describeAssembly(existing.root)` followed by `replicateAssembly(view, { namespace: 'bay2', parent })`, with an explicit external-reference policy when the source intentionally points outside itself. No fallback alias from `createInstance` is needed.

`assembly.ts` currently imports `createClip` from `primitives.ts` for shared G12 validation and character readers directly from `character.ts`. Re-exporting assembly functions from primitives creates an ESM dependency cycle. There is no eager use of these bindings at module initialization, but integration should exercise the real sandbox/build path; extracting the existing animation validation into a lower-level module would be a separate coordinated refactor if required. Do not duplicate the invariants into the catalog or assembly implementation.

## Validation evidence

Strict TDD began with missing-export failures and added adversarial reproductions before their fixes, including signed-scale decomposition changes, namespace reuse, unsupported clone/callback behavior, stale manual world caches, UUID/name ambiguity and a sparse array whose extra property hid its hole from a length-only check.

Final focused and adjacent CPU-only run: **89 tests passed, 858 assertions across seven files**, in 0.53 seconds under Bun 1.4.2. These files are assembly, animation contracts, STEP export, semantic contracts, architecture, instancing and vehicle tests. The assembly file contains 22 tests. Scoped Biome checks passed for both new code files.

Final `bun run typecheck` passed. An earlier broader run had one unrelated failure in `character.test.ts:218`: its legacy `category` render option produced the neutral-requirements migration error. The root owner has that finding and owns the final repository offline/coverage gates and package/sandbox qualification. No GPU, live provider, paid service, commit, push or release was used in this lane.
