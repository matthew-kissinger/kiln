import { z } from 'zod';
import {
  assertNoPrototypeKeys,
  canonicalContractJson,
  sameCanonicalContract,
  sha256ContractBytes,
  sha256ContractJson,
} from './contract-utils';
import {
  parsePresentationDocumentV1,
  hashPresentationDocumentV1,
  PresentationDocumentV1Schema,
} from './presentation';
import {
  hashWorldDocumentV2,
  parseWorldDocumentV2,
  worldDocumentV2ArtifactReferences,
  WorldDocumentV2Schema,
} from './world-document';

export const WORLD_PACKAGE_V2_SCHEMA_VERSION = 'kiln.world-package.v2' as const;

const contentSha256 = z.string().regex(/^sha256:[0-9a-f]{64}$/);
const id = z.string().min(1).max(256);
const portablePath = z
  .string()
  .min(1)
  .max(2048)
  .refine(
    (path) =>
      !path.startsWith('/') &&
      !path.includes('\\') &&
      !path.includes('?') &&
      !path.includes('#') &&
      !/^[a-z][a-z0-9+.-]*:/i.test(path) &&
      path.split('/').every((segment) => segment.length > 0 && segment !== '.' && segment !== '..'),
    'expected a portable package-relative path',
  );

const provenanceSchema = z
  .object({
    worldSource: z.enum(['composer-v1', 'composer-v2', 'manual']),
    parentWorldHash: contentSha256.optional(),
    objectSources: z
      .array(
        z
          .object({
            objectId: id,
            sourceStatementId: id,
            activeAsset: z
              .object({ generationId: id, artifactSha256: contentSha256 })
              .strict()
              .optional(),
          })
          .strict(),
      )
      .max(200),
  })
  .strict();

const artifactSchema = z
  .object({
    kind: z.enum(['asset', 'collision', 'heightfield']),
    refId: id,
    path: portablePath,
    sha256: contentSha256,
  })
  .strict();

export const WorldPackageV2Schema = z
  .object({
    schemaVersion: z.literal(WORLD_PACKAGE_V2_SCHEMA_VERSION),
    world: WorldDocumentV2Schema,
    worldSha256: contentSha256,
    presentation: PresentationDocumentV1Schema,
    presentationSha256: contentSha256,
    artifacts: z.array(artifactSchema).max(1024),
    runtimePolicy: z.object({ mode: z.literal('static-explore') }).strict(),
    provenance: provenanceSchema,
    provenanceSha256: contentSha256,
  })
  .strict()
  .superRefine((value, ctx) => {
    const { artifactBinding, ...presentationParameters } = value.presentation;
    if (
      !value.world.presentation ||
      !sameCanonicalContract(value.world.presentation, presentationParameters)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['presentation'],
        message: 'presentation must equal world presentation',
      });
    }
    if (artifactBinding.kind !== 'world' || artifactBinding.sha256 !== value.worldSha256) {
      ctx.addIssue({
        code: 'custom',
        path: ['presentation', 'artifactBinding'],
        message: 'presentation artifact binding must equal worldSha256',
      });
    }
    if (!sameCanonicalContract(value.runtimePolicy, value.world.runtimePolicy)) {
      ctx.addIssue({
        code: 'custom',
        path: ['runtimePolicy'],
        message: 'runtimePolicy must equal world runtime policy',
      });
    }
    const expectedArtifacts = worldDocumentV2ArtifactReferences(value.world).map((reference) => ({
      kind: reference.kind,
      refId: reference.refId,
      path: reference.packagePath,
      sha256: `sha256:${reference.sha256}`,
    }));
    if (!sameCanonicalContract(value.artifacts, expectedArtifacts)) {
      ctx.addIssue({
        code: 'custom',
        path: ['artifacts'],
        message: 'artifacts must equal world artifact closure',
      });
    }
    const expectedProvenance = provenanceOf(value.world);
    if (!sameCanonicalContract(value.provenance, expectedProvenance)) {
      ctx.addIssue({
        code: 'custom',
        path: ['provenance'],
        message: 'provenance must equal world provenance closure',
      });
    }
  });

export type WorldPackageV2 = z.infer<typeof WorldPackageV2Schema>;

function provenanceOf(world: z.infer<typeof WorldDocumentV2Schema>) {
  return {
    worldSource: world.provenance.source,
    ...(world.provenance.parentWorldHash
      ? { parentWorldHash: world.provenance.parentWorldHash }
      : {}),
    objectSources: [...world.objects]
      .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
      .map((object) => ({
        objectId: object.id,
        sourceStatementId: object.provenance.sourceStatementId,
        ...(object.provenance.activeAsset
          ? {
              activeAsset: {
                generationId: object.provenance.activeAsset.generationId,
                artifactSha256: `sha256:${object.provenance.activeAsset.artifactSha256}`,
              },
            }
          : {}),
      })),
  };
}

export function parseWorldPackageV2(input: unknown): WorldPackageV2 {
  assertNoPrototypeKeys(input);
  return WorldPackageV2Schema.parse(input);
}

export async function validateWorldPackageV2(input: unknown): Promise<WorldPackageV2> {
  const packageDocument = parseWorldPackageV2(input);
  const expectedWorldHash = await hashWorldDocumentV2(packageDocument.world);
  if (packageDocument.worldSha256 !== expectedWorldHash) {
    throw new TypeError(
      `worldSha256 mismatch (${packageDocument.worldSha256} != ${expectedWorldHash})`,
    );
  }
  const expectedPresentationHash = await hashPresentationDocumentV1(packageDocument.presentation);
  if (packageDocument.presentationSha256 !== expectedPresentationHash) {
    throw new TypeError('presentationSha256 mismatch');
  }
  const expectedProvenanceHash = await sha256ContractJson(packageDocument.provenance);
  if (packageDocument.provenanceSha256 !== expectedProvenanceHash) {
    throw new TypeError('provenanceSha256 mismatch');
  }
  return packageDocument;
}

export interface CreateWorldPackageV2Input {
  world: unknown;
}

export async function createWorldPackageV2(
  input: CreateWorldPackageV2Input,
): Promise<WorldPackageV2> {
  const world = parseWorldDocumentV2(input.world);
  if (!world.presentation) throw new TypeError('WorldPackageV2 requires world presentation');
  const worldSha256 = await hashWorldDocumentV2(world);
  const presentation = parsePresentationDocumentV1({
    ...world.presentation,
    artifactBinding: { kind: 'world', sha256: worldSha256 },
  });
  const provenance = provenanceOf(world);
  return validateWorldPackageV2({
    schemaVersion: WORLD_PACKAGE_V2_SCHEMA_VERSION,
    world,
    worldSha256,
    presentation,
    presentationSha256: await hashPresentationDocumentV1(presentation),
    artifacts: worldDocumentV2ArtifactReferences(world).map((reference) => ({
      kind: reference.kind,
      refId: reference.refId,
      path: reference.packagePath,
      sha256: `sha256:${reference.sha256}`,
    })),
    runtimePolicy: world.runtimePolicy,
    provenance,
    provenanceSha256: await sha256ContractJson(provenance),
  });
}

export function canonicalWorldPackageV2Json(input: unknown): string {
  return canonicalContractJson(parseWorldPackageV2(input));
}

export function hashWorldPackageV2(input: unknown): Promise<`sha256:${string}`> {
  return sha256ContractJson(parseWorldPackageV2(input));
}

/** Verify the exact external artifact bytes that complete the portable package closure. */
export async function validateWorldPackageArtifactBytesV2(
  packageInput: unknown,
  files: Readonly<Record<string, Uint8Array>>,
): Promise<void> {
  const packageDocument = await validateWorldPackageV2(packageInput);
  assertNoPrototypeKeys(files, '$files');
  const expectedPaths = new Set(packageDocument.artifacts.map((artifact) => artifact.path));
  for (const path of Object.keys(files)) {
    if (!expectedPaths.has(path)) throw new TypeError(`unexpected package artifact path "${path}"`);
  }
  for (const artifact of packageDocument.artifacts) {
    const bytes = files[artifact.path];
    if (!(bytes instanceof Uint8Array)) {
      throw new TypeError(`missing package artifact bytes for "${artifact.path}"`);
    }
    const actual = await sha256ContractBytes(bytes);
    if (actual !== artifact.sha256) {
      throw new TypeError(`package artifact hash mismatch for "${artifact.path}"`);
    }
  }
}
