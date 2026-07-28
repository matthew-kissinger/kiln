/** Browser-safe sidecar contract for placing and validating a finished Kiln GLB. */

export const INTEGRATION_ASSET_ROLES = [
  'ground',
  'building',
  'wonder',
  'poi',
  'prop',
  'fill',
  'vehicle',
] as const;

export type IntegrationAssetRole = (typeof INTEGRATION_ASSET_ROLES)[number];

export interface IntegrationBoundsV1 {
  min: [number, number, number];
  max: [number, number, number];
  size: [number, number, number];
  center: [number, number, number];
}

export interface IntegrationManifestV1 {
  schemaVersion: 'kiln.integration-manifest.v1';
  analyzerVersion: 1;
  artifactSha256: string;
  units: 'm';
  axes: { forward: '+X'; up: '+Y'; right: '+Z' };
  bounds: IntegrationBoundsV1;
  pivot: { convention: 'author-origin'; position: [0, 0, 0] };
  ground: {
    groundY: 0;
    contactTolerance: 0.02;
    minY: number;
    offsetToGround: number;
    grounded: boolean;
  };
  defaultScene: { index: number; name: string };
  requestedRole?: IntegrationAssetRole;
  assessedRole?: IntegrationAssetRole;
  renderMetrics: {
    triangles: number;
    drawCalls: number;
    uniqueGeometries: number;
    uniqueMaterials: number;
    textureCount: number;
    transparentMaterials: number;
    skinned: boolean;
  };
  structuralQa: {
    hasDefaultScene: boolean;
    finiteBounds: boolean;
    validatorErrors: number;
    validatorWarnings: number;
  };
  /** Visual composition/usability is deliberately assessed by browser QA, not inferred here. */
  visualQa: 'not_assessed';
}
