/** Closed, engine-owned repair hints. Never serialize exception messages or stacks. */
export type AuthoringDiagnostic =
  | 'TUBE_RADIUS'
  | 'TAPER_CONE_AXIS'
  | 'SOLID_FLOAT32_COLLAPSE'
  | 'MESH_DATA_NONFINITE'
  | 'MATERIAL_ALPHA_MODE'
  | 'MATERIAL_COLOR_ARGUMENT'
  | 'MATERIAL_PACKED_CHANNELS'
  | 'MATERIAL_RECIPE_TEXTURE_BINDING'
  | 'PORTABLE_TEXTURE_REFERENCE'
  | 'PORTABLE_COLOR_ARGUMENT'
  | 'PART_NAME_ARGUMENT'
  | 'PART_GEOMETRY_ARGUMENT'
  | 'PART_MATERIAL_ARGUMENT'
  | 'REMOVED_HELPER'
  | 'UNBOUND_VARIABLE'
  | 'GEAR_RADII_ORDER'
  | 'ROUNDED_BOX_RADIUS'
  | 'PROCEDURAL_TEXTURE_UNKNOWN_KEY'
  | 'PROCEDURAL_TEXTURE_BLEND'
  | 'MATERIAL_FRACTION_RANGE'
  | 'PARAMETRIC_PERIODIC_ENDPOINT'
  | 'PROFILE_HOLES_UNSUPPORTED'
  | 'PROFILE_BEVEL_COLLAPSE'
  | 'PROFILE_CORRESPONDENCE_COLLAPSE';
// Names no identifier on purpose. The identifier is only available from the
// sandboxed exception message, and this module's contract is that no captured
// identifier, path, message or stack crosses that boundary. Pointing at the
// discovery tool is engine-owned text, so it costs nothing to include and is
// the actionable half: an undeclared name here is usually a helper that does
// not exist rather than a typo in a local.
export const UNBOUND_VARIABLE_ADVICE =
  'Check variable spelling and scope: generated code used an undeclared variable. Read the current source and check declarations before retrying. If it was meant to be a Kiln helper, call kiln_discover to confirm the exact name and signature; the sandbox exposes only those globals.';
export const GEAR_RADII_ORDER_ADVICE =
  'gearGeo requires boreRadius < rootRadius < tipRadius; specify rootRadius when changing tipRadius. Omitted radii keep their absolute defaults.';
export const ROUNDED_BOX_RADIUS_ADVICE =
  'roundedBoxGeo: radius must be less than half the smallest dimension. Reduce radius or increase the smallest dimension; equality is invalid.';
export const PROCEDURAL_TEXTURE_UNKNOWN_KEY_ADVICE =
  'Remove unsupported proceduralTexture fields. Call kiln_discover with ids ["proceduralTexture"] and use only the documented fields for the selected layer op.';
export const MATERIAL_FRACTION_RANGE_ADVICE =
  'Material fractions must be finite numbers between 0 and 1, inclusive. In proceduralTexture, mortarWidth and stagger are fractions, not pixels; opacity uses the same range. materialRecipe roughness, metalness, opacity, alphaCutoff and emissiveIntensity use 0..1. portableMaterial roughness, metalness and alphaCutoff also use 0..1; its emissiveIntensity has a separate 0..64 range. Call kiln_discover for the exact field contracts.';
export const PARAMETRIC_PERIODIC_ENDPOINT_ADVICE =
  'Periodic parametricSurface endpoints must return matching positions. For periodicU, sample(uMin, v) and sample(uMax, v) must match; for periodicV, sample(u, vMin) and sample(u, vMax) must match.';
export const PROFILE_HOLES_UNSUPPORTED_ADVICE =
  'loftProfiles and sweepProfile: holes are unsupported in options or sections. Use extrudeProfile for a holed cross-section with optional twist/taper; independently varying contours need explicit geometry or solid subtraction. cap:false does not create inner walls or thickness.';
export const PROFILE_CORRESPONDENCE_COLLAPSE_ADVICE =
  'loftProfiles or sweepProfile: corresponding profile edges collapse between stations. Check matching start vertices and vertex order; for an intended twist, add intermediate sections or path stations. No automatic correspondence repair is applied. Other self-intersections remain unchecked.';
export function authoringDiagnosticAdvice(diagnostic: AuthoringDiagnostic | undefined): string {
  if (diagnostic === 'MESH_DATA_NONFINITE')
    return 'meshGeo positions, normals, UVs and tangents must contain finite numbers representable in Float32. Check missing XYZ components, undefined values, division by zero and overflowing calculations before constructing the arrays. Do not replace invalid values blindly with zero; correct the source calculation. Call kiln_discover for the exact meshGeo data contract.';
  if (diagnostic === 'PORTABLE_COLOR_ARGUMENT')
    return 'compilePortableMaterialSpecV2 baseColor and emissive must be numeric color integers from 0x000000 to 0xffffff, for example baseColor: 0x8a867c. CSS strings and materialRecipe hex-string overrides use different contracts. Omit these fields for their defaults, or call kiln_discover for the exact helper contract.';
  if (diagnostic === 'MATERIAL_RECIPE_TEXTURE_BINDING')
    return 'materialRecipe textureResources maps portable slots to approved resource ID strings. Slots are baseColor, normal, metallicRoughness, emissive and occlusion. albedo is a pbrMaterial field, not a recipe slot. Use kiln_discover to check each resource allowedSlots and recipeIds before binding it; no slot or resource substitution is applied.';
  if (diagnostic === 'PORTABLE_TEXTURE_REFERENCE')
    return 'compilePortableMaterialSpecV2 textures require typed references: { kind: "resource", resourceId: "kiln.texture..." } for an approved resource, or { kind: "procedural", spec: { schemaVersion: 2, ... } } for a procedural texture. Bare resource ID strings are invalid here. Use portable slots such as baseColor and check the exact helper/resource contracts with kiln_discover.';
  if (diagnostic === 'TAPER_CONE_AXIS')
    return 'taperConeGeo(radiusBottom, radiusTop, height, axis, segments): the fourth argument is axis, "x", "y" or "z" (default "y"). Segment count is the fifth argument, for example taperConeGeo(0.03, 0.02, 0.01, "x", 12). Call kiln_discover for the full contract.';
  if (diagnostic === 'PROCEDURAL_TEXTURE_BLEND')
    return 'proceduralTexture layer blend must be normal, multiply, screen, or overlay. Omit blend for normal compositing. Call kiln_discover with ids ["proceduralTexture"] for the supported layer fields.';
  if (diagnostic === 'PART_NAME_ARGUMENT')
    return 'createPart(name, geometry, material, options?): the first argument is a string name. Put the parent Object3D in the fourth argument as { parent: root }.';
  if (diagnostic === 'PART_GEOMETRY_ARGUMENT')
    return 'createPart(name, geometry, material, options?): the second argument must be a BufferGeometry. Call geometry helpers, for example boxGeo(1, 1, 1), instead of passing the function. For async helpers such as roundedBoxGeo, extrudeProfile and revolveProfile, await the result inside async build() before passing it to createPart. Call kiln_discover for the exact return contract.';
  if (diagnostic === 'PART_MATERIAL_ARGUMENT')
    return 'createPart(name, geometry, material, options?): the third argument must be a Three.js material. Wrap a color with gameMaterial(0x808080); a number or settings object alone is not a material. Call kiln_discover for the chosen material helper contract.';
  if (diagnostic === 'SOLID_FLOAT32_COLLAPSE')
    return 'Solid output cannot retain valid faces at Float32 precision. Simplify subprecision features or recenter local geometry; review coincident cut boundaries. Smoothing or replacing normals does not repair collapsed triangles. Kiln did not export a partially repaired solid.';
  if (diagnostic === 'PROFILE_BEVEL_COLLAPSE')
    return 'extrudeProfile or revolveProfile: bevel is too large for this profile; erosion leaves nothing. Reduce bevel below half the narrowest section width, set bevel to 0, or widen the profile. Dimensions and bevel use the same asset units.';
  if (diagnostic === 'TUBE_RADIUS')
    return 'curveToMesh and pipeAlongPath require an explicit positive finite radius representable in Float32, in asset units. A missing or undefined radius is invalid; check the referenced dimension. Radius is half the tube diameter.';
  if (diagnostic === 'MATERIAL_ALPHA_MODE')
    return 'pbrMaterial and portable material specs require lowercase alphaMode: "opaque", "mask", or "blend". Omit it for opaque. Exported glTF uses uppercase mode names; those are not authoring input values.';
  if (diagnostic === 'MATERIAL_COLOR_ARGUMENT')
    return 'gameMaterial, basicMaterial, glassMaterial and lambertMaterial take a color first: a hex number or CSS string. Settings belong in the second argument, for example gameMaterial(0x9a9a96, { roughness: 0.4, metalness: 0.8 }). pbrMaterial uses a different object-form contract; call kiln_discover for its texture and material fields.';
  if (diagnostic === 'MATERIAL_PACKED_CHANNELS')
    return 'pbrMaterial requires one packed texture with G=roughness and B=metalness. Generate or load it for usage "metallicRoughness" and pass metallicRoughness, or pass the same packed texture in both roughness and metalness. Do not combine those forms or pass a texture in only one scalar slot. Plain roughness and metalness values are 0..1 numbers. Call kiln_discover for the exact texture contract.';
  if (diagnostic === 'REMOVED_HELPER')
    return 'Generated source references a retired Kiln global. Call kiln_validate for name-specific migration guidance, then kiln_discover for the replacement contract. No compatibility aliases are provided.';
  if (diagnostic === 'UNBOUND_VARIABLE') return UNBOUND_VARIABLE_ADVICE;
  if (diagnostic === 'ROUNDED_BOX_RADIUS') return ROUNDED_BOX_RADIUS_ADVICE;
  if (diagnostic === 'GEAR_RADII_ORDER') return GEAR_RADII_ORDER_ADVICE;
  if (diagnostic === 'PROCEDURAL_TEXTURE_UNKNOWN_KEY') return PROCEDURAL_TEXTURE_UNKNOWN_KEY_ADVICE;
  if (diagnostic === 'MATERIAL_FRACTION_RANGE') return MATERIAL_FRACTION_RANGE_ADVICE;
  if (diagnostic === 'PROFILE_HOLES_UNSUPPORTED') return PROFILE_HOLES_UNSUPPORTED_ADVICE;
  if (diagnostic === 'PROFILE_CORRESPONDENCE_COLLAPSE')
    return PROFILE_CORRESPONDENCE_COLLAPSE_ADVICE;
  return diagnostic === 'PARAMETRIC_PERIODIC_ENDPOINT' ? PARAMETRIC_PERIODIC_ENDPOINT_ADVICE : '';
}
export class AuthoringDiagnosticError extends Error {
  constructor(
    readonly diagnostic: AuthoringDiagnostic | undefined,
    message = authoringDiagnosticAdvice(diagnostic),
  ) {
    super(message);
    this.name = 'AuthoringDiagnosticError';
  }
}
export function rethrowAuthoringError(error: unknown): never {
  // Unsupported ambient/resource APIs stay generic, including the legacy loadTexture probe.
  // Classification only. No captured identifier, path, message, or stack crosses the boundary.
  if (
    error instanceof ReferenceError &&
    /(?: is not defined$|^Can't find variable: )/.test(error.message) &&
    !/\b(?:loadTexture|process|fetch|globalThis|require|Bun|Deno)\b/.test(error.message)
  ) {
    throw new AuthoringDiagnosticError('UNBOUND_VARIABLE');
  }
  throw error;
}
