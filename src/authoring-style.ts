/** Optional visual style guidance, independent of any agent loop or asset taxonomy. */
export type AssetStyle = 'low-poly' | 'stylized' | 'voxel' | 'detailed' | 'realistic';

export const STYLE_TEMPLATES: Record<AssetStyle, string> = {
  'low-poly': `## Style: Low-Poly
Generate assets with a low-poly aesthetic:
- Use 6-8 segments for cylinders, spheres, cones
- Flat shading enabled (flatShading: true)
- Minimal detail, geometric forms
- Bold, solid colors
- No small decorative elements
- Chunky proportions`,

  stylized: `## Style: Stylized Cartoon
Generate assets with a stylized cartoon aesthetic:
- Use 12-16 segments for smoother curves
- Exaggerated proportions (big heads, small bodies for characters)
- Bright, saturated colors
- Smooth shading for organic forms
- Can include small decorative details
- Playful, whimsical shapes`,

  voxel: `## Style: Voxel
Generate assets with a voxel/Minecraft-like aesthetic:
- Use ONLY box geometry (boxGeo)
- No spheres, cylinders, or curved shapes
- Build forms from stacked/arranged cubes
- Grid-aligned positions (use 0.25 or 0.5 unit increments)
- Flat shading always
- Blocky proportions`,

  detailed: `## Style: Detailed
Generate assets with more geometric detail:
- Use 24-32 segments for smooth surfaces
- Include small decorative elements (buttons, rivets, trim)
- Layered construction with multiple parts
- Subtle color variations
- Can use metallic/roughness for PBR looks
- Realistic proportions`,

  realistic: `## Style: Realistic
Generate assets with realistic proportions and detail:
- Use 32-64 segments for very smooth surfaces
- Accurate real-world proportions
- Multiple materials with PBR properties (metalness, roughness)
- Include fine details (seams, edges, bevels)
- Subtle color gradients
- Use enough geometry for the silhouette and intended viewing distance; inspect measured runtime costs`,
};
