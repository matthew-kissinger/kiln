declare module 'gltf-validator' {
  export interface ValidationOptions {
    uri?: string;
    maxIssues?: number;
    ignoredIssues?: string[];
    onlyIssues?: string[];
    severityOverrides?: Record<string, number>;
    externalResourceFunction?: (uri: string) => Promise<Uint8Array>;
  }

  export function validateBytes(data: Uint8Array, options?: ValidationOptions): Promise<unknown>;
}
