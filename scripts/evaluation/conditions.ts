/** Experimental host adapter only. Never used by the shipping CLI/MCP registry. */
import { parse } from 'acorn';
import { full } from 'acorn-walk';
import { z } from 'zod';
import { geometryPrimitives } from '../../src/geometry-catalog';
import { listPrimitives } from '../../src/list-primitives';
import { resolveEvaluatorPortV1 } from '../../src/evaluator/protocol';
import { createKilnProgramToolRegistry, type KilnToolContext, type KilnToolDef } from '../../src/tools/registry';

export type Condition = 'A' | 'B' | 'C';
export const disabledHelperNames = geometryPrimitives.map((entry) => entry.name).sort();

/** Conservative identifier policy: aliasing cannot make a disabled helper available. */
export function assertConditionSource(code: string, condition: Condition): void {
  if (condition === 'C') return;
  const disabled = new Set(disabledHelperNames);
  const file = parse(code, {ecmaVersion:'latest', sourceType:'script', allowAwaitOutsideFunction:true});
  full(file, (node) => {
    if (node.type === 'Identifier' && disabled.has(node.name))
      throw new Error(`condition-policy: ${node.name} is unavailable in condition ${condition}. Use the supplied catalog or ordinary THREE geometry.`);
  });
}

const legacyCapture = z.object({
  preset: z.enum(['1x1', '1x2', '2x1', '3x1', '2x2', '3x2', '3x3']).optional(),
  cells: z.array(z.object({ azimuthDeg: z.number(), elevationDeg: z.number(), zoom: z.number().positive().optional(), name: z.string().optional() }).strict()).min(1).max(9).optional(),
}).strict();

function conditionDiscovery(def: KilnToolDef, condition: Condition): KilnToolDef {
  if (condition === 'C') return def;
  const schema = condition === 'A' ? z.object({category:z.string().optional()}).strict() : def.inputSchema;
  const entries = listPrimitives().filter((entry) => !disabledHelperNames.includes(entry.name));
  return {
    ...def,
    description: condition === 'A' ? 'List available Kiln helpers with signatures and examples. Optionally filter by category.' : def.description,
    inputSchema: schema,
    run: async (value) => {
      const input = schema.parse(value) as {category?:string;query?:string;name?:string;names?:string[];overview?:boolean;capabilities?:boolean;offset?:number;limit?:number};
      if (input.capabilities) {
        const output = await def.run(input) as {capabilities:Record<string,unknown>};
        const capabilities = {...output.capabilities,geometry:{...(output.capabilities.geometry as object),newHelpers:false,implicitSurfaces:'unavailable in this condition'}};
        return {capabilities,text:`Capabilities\n${JSON.stringify(capabilities,null,2)}`};
      }
      const matches = input.names ? input.names.map((name)=>{
        const entry=entries.find((candidate)=>candidate.name.toLowerCase()===name.toLowerCase());
        if (!entry) throw new Error(`Unknown helper in this condition: ${name}`);
        return entry;
      }) : entries.filter((entry) => (!input.category || entry.category === input.category.toLowerCase()) && (!input.name || entry.name.toLowerCase() === input.name.toLowerCase()) && (input.query?.toLowerCase().split(/\s+/) ?? []).every((word) => `${entry.name} ${entry.signature} ${entry.description} ${entry.example} ${entry.promptNotes ?? ''}`.toLowerCase().includes(word)));
      const categories = [...new Set(entries.map((entry) => entry.category))].sort();
      const overview = condition === 'B' && (input.overview ?? !(input.name || input.names || input.query || input.category || input.offset || input.limit));
      const offset = condition === 'A' ? 0 : input.offset ?? 0;
      const selected = overview || condition === 'A' ? matches : matches.slice(offset,offset+(input.limit ?? 6));
      const nextOffset = overview || offset + selected.length >= matches.length ? null : offset+selected.length;
      const text = overview
        ? [
          'Kiln helper overview. Use name for a signature/example, query for an operation, or category to browse.',
          ...categories.map((category) => `${category}: ${matches.filter((entry)=>entry.category===category).map((entry)=>entry.name).join(', ')}`),
          'Ordinary THREE.BufferGeometry and source functions are available. Send code once and reuse programRef. Use capture version kiln.capture.v1 for exact part paths, part-relative cameras, projection and separate images. Check viewFidelity before judging materials.',
        ].join('\n\n')
        : [`${matches.length} matching helpers.`, ...selected.map((entry)=>`${entry.signature} -> ${entry.returns}\n${entry.description}\ne.g. ${entry.example}${entry.promptNotes ? `\nNote: ${entry.promptNotes}` : ''}`), ...(nextOffset === null ? [] : [`More results: offset:${nextOffset}.`])].join('\n\n');
      return { primitives:selected, total:matches.length, nextOffset,categories,text };
    },
  };
}

export function createConditionRegistry(condition: Condition, context: KilnToolContext = {}): KilnToolDef[] {
  const evaluator = resolveEvaluatorPortV1(context.evaluatorPort, context.evaluatorProfile ?? 'trusted-local');
  const registry = createKilnProgramToolRegistry({
    ...context,
    // Separate evaluator identities keep experimental conditions from sharing admission state.
    evaluatorCacheIdentity: undefined,
    evaluatorPort: { render: (code,options,controls) => { assertConditionSource(code,condition); return evaluator.render(code,options,controls); } },
  });
  return registry.map((def) => {
    if (def.name === 'kiln_list_primitives') return conditionDiscovery(def,condition);
    let schema = def.inputSchema;
    if (condition === 'A' && schema instanceof z.ZodObject) {
      const overrides: Record<string,z.ZodType> = {};
      if ('capture' in schema.shape) overrides.capture = legacyCapture.optional();
      for (const name of ['shot','anchors','frameTimes','framing']) if (name in schema.shape) overrides[name] = z.never().optional();
      schema = schema.safeExtend(overrides);
    }
    return { ...def,
      inputSchema:schema,
      description:condition === 'A' && ['kiln_render','kiln_edit','kiln_inspect','kiln_screenshot_animation','kiln_view_interior'].includes(def.name)
        ? `${def.name}: build, edit or inspect the supplied code or saved programRef using the legacy view controls in this schema. Check viewFidelity before judging materials. Use kiln_source to read saved revisions.` : def.description,
      run: async (value) => {
        const input = schema.parse(value) as Record<string,unknown>;
        if (typeof input.code === 'string') assertConditionSource(input.code,condition);
        return def.run(input);
      },
    };
  });
}
