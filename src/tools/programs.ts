import { z } from 'zod';
import { programRefPattern, type ProgramStore } from '../program-store';
import type { KilnToolDef } from './registry';

const refInput = z
  .string()
  .regex(programRefPattern)
  .describe('Full immutable source revision returned by Kiln.');

/** Adapt source-taking definitions once, for all hosts. Legacy definitions remain unchanged. */
export function withProgramReferences(def: KilnToolDef, store: ProgramStore): KilnToolDef {
  if (!(def.inputSchema instanceof z.ZodObject))
    throw new Error(`${def.name} must have an object input schema.`);
  const inputSchema = def.inputSchema
    .extend({
      code: z
        .string()
        .optional()
        .describe('Inline source, for a new draft or legacy caller. Supply code OR programRef.'),
      programRef: refInput.optional(),
      ...(def.name === 'kiln_edit'
        ? {
            includeCode: z
              .boolean()
              .optional()
              .describe(
                'Return the full updated source. Defaults to false with programRef, true with code.',
              ),
          }
        : {}),
    })
    .refine((input) => (input.code !== undefined) !== (input.programRef !== undefined), {
      message: 'Supply exactly one of code or programRef.',
    });
  const summaries: Record<string, string> = {
    kiln_validate:
      'Check program syntax and sandbox rules before building. Returns validation findings; use kiln_render to evaluate geometry and see the asset.',
    kiln_render:
      'Build a program and return geometry metrics, exact part paths and images. Omit capture for six views; choose preset/cells for orbit grids or version kiln.capture.v1 plus shots for part-local framing, perspective and separate images. Check viewFidelity before judging materials. Failed builds return errors without an image.',
    kiln_screenshot_animation:
      'Render sampled animation frames to check motion and attachments. Use shot for the shared camera controls, frameTimes for selected phases, and framing locked (default) or follow. The program must define animate(). Check viewFidelity before judging materials.',
    kiln_view_interior:
      'Render roof-off floor-plan, dollhouse, and eye-level cutaway views. Optional versioned capture selects custom roof-off shots. Select a roof by nodeName or let Kiln resolve its role/name. Review roofsHidden and warnings for unresolved occlusion.',
    kiln_inspect:
      'Inspect a part with context or isolation. Use legacy part/orbit controls or shot for exact paths, part-local axes and perspective. Use names from the source or render result; check viewFidelity before judging materials.',
  };
  const description =
    def.name === 'kiln_edit'
      ? 'Apply exact-string replacements to a program revision and render the result (render:false skips images). Edits are ordered and atomic: missing or ambiguous matches fail without changing the base. Returns a new programRef, parentRef and diff; untouched text stays identical. Read anchors with kiln_source. Optional capture chooses the same cameras as kiln_render. Use includeCode only when full source is needed.'
      : `${summaries[def.name] ?? def.description} Supply code once or reuse programRef from an earlier result. Returns programRef even for an invalid draft. kiln_source reads that revision.`;
  return {
    ...def,
    inputSchema,
    description,
    run: async (input) => {
      const args = inputSchema.parse(input);
      const code =
        typeof args.code === 'string' ? args.code : await store.get(args.programRef as string);
      // Keep malformed drafts too, so a failed build can be repaired by reference.
      const parentRef = await store.put(code);
      const output = (await def.run({ ...args, code })) as Record<string, unknown>;
      if (def.name !== 'kiln_edit' || output.ok !== true || typeof output.code !== 'string')
        return { ...output, programRef: parentRef };
      const programRef = await store.put(output.code);
      const { code: updatedCode, ...rest } = output;
      const includeCode = args.includeCode ?? args.code !== undefined;
      const diff = typeof rest.diff === 'string' ? rest.diff : '';
      return {
        ...rest,
        programRef,
        parentRef,
        ...(includeCode
          ? { code: updatedCode }
          : {
              diff: diff.slice(0, 8000),
              diffTruncated: diff.length > 8000,
            }),
      };
    },
  };
}

export function createKilnSourceDef(store: ProgramStore): KilnToolDef {
  const inputSchema = z.object({
    programRef: refInput,
    offset: z
      .number()
      .int()
      .min(0)
      .default(0)
      .describe('UTF-16 character offset; use nextOffset to continue.'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(16000)
      .default(8000)
      .describe('Maximum characters returned.'),
    query: z
      .string()
      .min(1)
      .max(1000)
      .optional()
      .describe('Find literal text at or after offset; return bounded surrounding source.'),
  });
  return {
    name: 'kiln_source',
    description:
      'Read a saved program revision without changing it. Returns exact source text in bounded pages, or searches for literal text with surrounding context. Copy edit anchors from code. Follow nextOffset for more; use matchOffset + 1 to find the next match. Offsets count UTF-16 characters, not bytes.',
    inputSchema,
    run: async (input) => {
      const { programRef, offset, limit, query } = inputSchema.parse(input);
      const source = await store.get(programRef);
      const matchOffset = query ? source.indexOf(query, offset) : undefined;
      const start =
        matchOffset !== undefined && matchOffset >= 0
          ? Math.max(offset, matchOffset - Math.floor(limit / 4))
          : Math.min(offset, source.length);
      const code = matchOffset === -1 ? '' : source.slice(start, start + limit);
      const end = start + code.length;
      return {
        programRef,
        code,
        offset: start,
        nextOffset: matchOffset === -1 || end >= source.length ? null : end,
        totalCharacters: source.length,
        totalBytes: new TextEncoder().encode(source).length,
        ...(matchOffset !== undefined ? { matchOffset, found: matchOffset >= 0 } : {}),
      };
    },
  };
}
