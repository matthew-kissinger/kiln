/** Private, bounded reviewed-artifact capability. Never populated from model JSON. */
import { createHash } from 'node:crypto';
import type { RenderResult } from '../render';
import { programReference } from '../program-store';
import { requirementsContextsEqual, type RequirementsContext } from '../requirements-context';
import type { CaptureConfig } from '../views/capture';
import type { KilnRenderViewsResult } from './registry';

export interface ProgramArtifact {
  programRef: string;
  code: string;
  rendered: RenderResult;
  review: KilnRenderViewsResult;
  captureSelection: { capture?: CaptureConfig };
}
export interface NativeCompletion {
  artifact?: ProgramArtifact;
}

/** Oldest-record eviction. Source remains in the independently owned program store. */
export class ProgramArtifactStore {
  private readonly records = new Map<string, { json: string; glb: Buffer; bytes: number }>();
  private bytes = 0;
  private readonly maxEntries: number;
  private readonly maxBytes: number;

  constructor(options: { maxEntries?: number; maxBytes?: number } = {}) {
    this.maxEntries = options.maxEntries ?? 8;
    this.maxBytes = options.maxBytes ?? 64 * 1024 * 1024;
    for (const value of [this.maxEntries, this.maxBytes]) {
      if (!Number.isSafeInteger(value) || value < 1)
        throw new Error('Artifact store limits must be positive safe integers.');
    }
  }

  async record(input: Omit<ProgramArtifact, 'programRef'>): Promise<string> {
    const programRef = await programReference(input.code);
    const hash = `sha256:${createHash('sha256').update(input.rendered.glb).digest('hex')}`;
    if (
      hash !== input.rendered.artifactGlbSha256 ||
      hash !== input.review.viewFidelity?.inputGlbSha256
    )
      throw new Error('Reviewed artifact bytes do not match their evaluation and view identities.');
    if (
      !input.review.ok ||
      !input.review.requirements ||
      !requirementsContextsEqual(input.review.requirements, input.rendered.requirements)
    )
      throw new Error('Reviewed artifact requirements do not match their evaluation.');
    const { glb, diagnosticViews, ...rendered } = input.rendered;
    const json = JSON.stringify({
      ...input,
      programRef,
      rendered,
      diagnosticViews: diagnosticViews?.map(({ png, ...diagnostic }) => ({
        ...diagnostic,
        pngBase64: png.toString('base64'),
      })),
    });
    // Bound serialized metadata and its retained UTF-16 representation, plus exact bytes.
    const bytes = Buffer.byteLength(json) + json.length * 2 + glb.byteLength;
    if (bytes > this.maxBytes)
      throw new Error('Reviewed artifact exceeds the native artifact store byte limit.');
    const previous = this.records.get(programRef);
    if (previous) {
      this.bytes -= previous.bytes;
      this.records.delete(programRef);
    }
    while (this.records.size >= this.maxEntries || this.bytes + bytes > this.maxBytes) {
      const oldest = this.records.keys().next().value!;
      this.bytes -= this.records.get(oldest)!.bytes;
      this.records.delete(oldest);
    }
    this.records.set(programRef, { json, glb: Buffer.from(glb), bytes });
    this.bytes += bytes;
    return programRef;
  }

  get(programRef: string, requirements: RequirementsContext): ProgramArtifact {
    const record = this.records.get(programRef);
    if (!record)
      throw new Error(
        'No retained reviewed artifact for this revision. Call kiln_render on this programRef again before kiln_finish.',
      );
    const { diagnosticViews, ...artifact } = JSON.parse(record.json) as ProgramArtifact & {
      diagnosticViews?: (Omit<NonNullable<RenderResult['diagnosticViews']>[number], 'png'> & {
        pngBase64: string;
      })[];
    };
    if (!requirementsContextsEqual(artifact.rendered.requirements, requirements))
      throw new Error(
        'Reviewed artifact belongs to different requirements. Render this revision under the current host binding before kiln_finish.',
      );
    artifact.rendered.glb = Buffer.from(record.glb);
    if (diagnosticViews)
      artifact.rendered.diagnosticViews = diagnosticViews.map(({ pngBase64, ...diagnostic }) => ({
        ...diagnostic,
        png: Buffer.from(pngBase64, 'base64'),
      })) as RenderResult['diagnosticViews'];
    return artifact;
  }

  latest(requirements: RequirementsContext): ProgramArtifact | undefined {
    const ref = [...this.records.keys()].at(-1);
    return ref === undefined ? undefined : this.get(ref, requirements);
  }
}
