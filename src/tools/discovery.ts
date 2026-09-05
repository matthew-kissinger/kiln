import { z } from 'zod';
import { listPrimitives } from '../list-primitives';
import type { KilnToolContext, KilnToolDef } from './registry';
import { MAX_PROGRAM_BYTES } from '../program-store';
import { MAX_EVALUATOR_CODE_BYTES } from '../evaluator/protocol';
import { resolveCaptureLimits } from '../views/capture-limits';

const inputSchema = z
  .object({
    names: z
      .array(z.string().trim().min(1).max(80))
      .min(1)
      .max(6)
      .optional()
      .describe(
        'Get up to six exact helper signatures together, in this order. Use without other selectors.',
      ),
    category: z.string().trim().min(1).max(80).optional().describe('Category from the overview.'),
    name: z
      .string()
      .trim()
      .min(1)
      .max(80)
      .optional()
      .describe('Exact helper name; returns its signature and example.'),
    query: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .optional()
      .describe('Words to find in helper names, descriptions and examples.'),
    overview: z
      .boolean()
      .optional()
      .describe('Compact names by category. Default when no search or category is supplied.'),
    capabilities: z
      .boolean()
      .optional()
      .describe('Return only runtime, source, geometry export and camera capabilities.'),
    offset: z.number().int().min(0).max(10000).optional(),
    limit: z
      .number()
      .int()
      .min(1)
      .max(12)
      .optional()
      .describe('Detailed results per page; default 6, maximum 12.'),
  })
  .strict();

/** Progressive reference for the public authoring surface; the historical baseline stays intact. */
export function createKilnDiscoveryDef(context: KilnToolContext): KilnToolDef {
  return {
    name: 'kiln_list_primitives',
    description:
      'Discover Kiln helpers and capabilities. No arguments returns a compact overview. Use names for up to six exact signatures/examples together, name for one, query for a modeling operation, or category to browse; detailed results are paged. Custom THREE.BufferGeometry and ordinary functions are available inside the retained program.',
    inputSchema,
    run: async (value) => {
      const input = inputSchema.parse(value);
      if (input.names && Object.keys(input).some((key) => key !== 'names')) {
        const error =
          'Use names alone; category, query, paging and capability selectors are separate requests.';
        return { primitives: [], total: 0, nextOffset: null, categories: [], error, text: error };
      }
      const capabilities = {
        version: 'kiln.capabilities.v1',
        execution:
          context.localExecution ??
          (context.evaluatorPort
            ? { mode: 'host-injected', limits: 'unspecified by host' }
            : context.evaluatorProfile === 'evaluator-required'
              ? { mode: 'host-required', available: false }
              : { mode: 'trusted-local', terminable: false }),
        source: {
          ...(input.capabilities && context.programStore?.stats
            ? { storage: await context.programStore.stats() }
            : {}),
          maxBytes: MAX_PROGRAM_BYTES,
          transportEvaluatorMaxBytes: MAX_EVALUATOR_CODE_BYTES,
          immutableRevisions: true,
          boundedRead: true,
          atomicEdit: true,
        },
        geometry: {
          attributes: ['position', 'normal', 'uv', 'tangent'],
          indexedTriangles: true,
          materialGroups: true,
          unsupported: ['vertex colors', 'UV1+', 'skinning', 'morphs'],
          strictExport:
            'geometryPolicy:strict on GLB export or host context; local KILN_GEOMETRY_POLICY=strict',
          implicitSurfaces: 'experimental',
        },
        camera: {
          version: 'kiln.capture.v1',
          maxShots: 9,
          cellSize: [128, 1024],
          output: ['grid', 'separate'],
          projection: ['orthographic', 'perspective'],
          subjects: ['asset', 'exact node path', 'unambiguous name'],
          visibility: ['context', 'isolate'],
          orbitFrames: ['world', 'asset', 'part'],
          explicitFrames: ['world', 'asset', 'part', 'local'],
          framing: ['explicit', 'bounds'],
          limits: resolveCaptureLimits(context.captureLimits),
          defaultViews: 6,
        },
        materials: {
          gpuPortConfigured: Boolean(context.viewRenderPort),
          gpuRequired: Boolean(context.viewRenderRequired),
          deliveredEvidence: 'viewFidelity and per-cell cameraFidelity',
          cpu: 'geometry/base color',
        },
      };
      const capabilityText = `Capabilities\n${JSON.stringify(capabilities, null, 2)}`;
      if (input.capabilities) return { capabilities, text: capabilityText };
      const all = listPrimitives();
      const categories = [...new Set(all.map((entry) => entry.category))].sort();
      const category = input.category?.toLowerCase();
      const missing = (error: string) => ({
        primitives: [],
        total: 0,
        nextOffset: null,
        categories,
        error,
        text: `${error}\nCategories: ${categories.join(', ')}. Use query to search or omit arguments for an overview.`,
      });
      const detail = (entry: (typeof all)[number]) =>
        `${entry.signature} -> ${entry.returns}\n${entry.description}\ne.g. ${entry.example}${entry.promptNotes ? `\nNote: ${entry.promptNotes}` : ''}`;
      if (input.names) {
        const requested = input.names.filter(
          (name, index, names) =>
            names.findIndex((candidate) => candidate.toLowerCase() === name.toLowerCase()) ===
            index,
        );
        const selected = requested.map((name) =>
          all.find((entry) => entry.name.toLowerCase() === name.toLowerCase()),
        );
        const unknown = requested.filter((_, index) => !selected[index]);
        if (unknown.length) return missing(`Unknown helpers: ${unknown.join(', ')}.`);
        const primitives = selected.filter((entry): entry is (typeof all)[number] =>
          Boolean(entry),
        );
        return {
          primitives,
          total: primitives.length,
          nextOffset: null,
          categories,
          text: [`${primitives.length} requested helpers.`, ...primitives.map(detail)].join('\n\n'),
        };
      }
      if (category && !categories.some((entry) => entry === category))
        return missing(`Unknown category "${input.category}".`);
      const words = input.query?.toLowerCase().split(/\s+/) ?? [];
      const matches = all.filter((entry) => {
        if (category && entry.category !== category) return false;
        if (input.name && entry.name.toLowerCase() !== input.name.toLowerCase()) return false;
        const searchable =
          `${entry.name} ${entry.signature} ${entry.description} ${entry.example} ${entry.promptNotes ?? ''}`.toLowerCase();
        return words.every((word) => searchable.includes(word));
      });
      if (!matches.length)
        return missing(
          `No helper matches ${input.name ? `name "${input.name}"` : `query "${input.query ?? input.category}"`}.`,
        );
      const overview =
        input.overview ??
        !(input.name || input.query || input.category || input.offset || input.limit);
      if (overview) {
        const text = [
          'Kiln helper overview. Use {names:["boxGeo","createPart"]} for up to six signatures/examples together, {name:"boxGeo"} for one, {query:"holes"} for an operation, or {category:"geometry"} to browse.',
          ...categories
            .map(
              (group) =>
                `${group}: ${matches
                  .filter((entry) => entry.category === group)
                  .map((entry) => entry.name)
                  .join(', ')}`,
            )
            .filter((line) => !line.endsWith(': ')),
          'Custom geometry: THREE.BufferGeometry, indexed triangles and ordinary functions are available. GLB exports position, normal, UV0, tangent, indices and material groups. Query meshGeo, parametricSurface, sweepProfile, loftProfiles or twist for focused examples.',
          'Source: send code once; reuse programRef for source reads, edits and all later view calls. Local CLI/MCP stores survive restarts; an injected memory store lasts for its registry instance.',
          'Views: legacy capture uses preset/cells with azimuthDeg, elevationDeg, zoom (padding) and name. For exact part paths, part-relative orbit, explicit orthographic/perspective cameras or separate images, use capture:{version:"kiln.capture.v1",shots:[...]}. Choose one to nine useful views; omission keeps six. kiln_inspect also reports part frames and optional anchor measurements.',
          `Execution: ${JSON.stringify(capabilities.execution)}. Source snapshots accept 1 MiB; subprocess/transport evaluation accepts 512 KiB. Use {capabilities:true} for the complete current host/export/camera contract.`,
          `Materials: ${context.viewRenderPort ? 'a GPU render port is configured; check delivered viewFidelity' : 'CPU geometry/base-color views; material-faithful review requires a configured GPU port'}. Geometry, materials and draw calls have runtime costs; choose detail for the intended asset.`,
        ].join('\n\n');
        return {
          primitives: matches,
          total: matches.length,
          nextOffset: null,
          categories,
          capabilities,
          text,
        };
      }
      const offset = input.offset ?? 0;
      const primitives = matches.slice(offset, offset + (input.limit ?? 6));
      const nextOffset =
        offset + primitives.length < matches.length ? offset + primitives.length : null;
      const text = [
        `${matches.length} matching helpers. Showing ${primitives.length ? offset + 1 : 0}–${offset + primitives.length}.`,
        ...primitives.map(detail),
        ...(nextOffset === null
          ? []
          : [`More results: repeat this query with offset:${nextOffset}.`]),
      ].join('\n\n');
      return { primitives, total: matches.length, nextOffset, categories, text };
    },
    text: (output) => (output as { text: string }).text,
  };
}
