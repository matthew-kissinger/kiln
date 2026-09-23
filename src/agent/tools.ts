/** Strands content adapter. Every definition, including kiln_finish, is owned by the shared registry. */
import {
  tool,
  ImageBlock,
  JsonBlock,
  TextBlock,
  type Tool,
  type JSONValue,
} from '@strands-agents/sdk';
import type { z } from 'zod';
import {
  createKilnNativeToolRegistry,
  type KilnToolContext,
  type KilnToolDef,
} from '../tools/registry';
import type { NativeCompletion } from '../tools/program-artifacts';
import { resolveRequirementsContext } from '../requirements-context';
export type { EditRecord, EditResult } from '../edit-buffer';
export interface KilnRenderCandidate {
  code: string;
  pngBase64: string;
  tris?: number;
}

function withVisualObservation(json: unknown, visualObservation: JSONValue): JSONValue {
  if (json && typeof json === 'object' && !Array.isArray(json)) {
    return { ...(json as Record<string, JSONValue>), visualObservation } as JSONValue;
  }
  return { result: json as JSONValue, visualObservation } as JSONValue;
}

async function observedMediaResult(
  def: KilnToolDef,
  pngs: readonly Uint8Array[],
  json: unknown,
  context: KilnToolContext,
): Promise<JSONValue> {
  try {
    const value = await context.renderObservationPort!({
      toolName: def.name,
      pngs,
      json,
      ...(context.intent ? { intent: context.intent } : {}),
      requirements: resolveRequirementsContext(context.requirements),
      ...(context.generationCallBudget
        ? { generationCallBudget: context.generationCallBudget }
        : {}),
    });
    return [
      new JsonBlock({
        json: withVisualObservation(json, { ok: true, value } as JSONValue),
      }),
    ] as unknown as JSONValue;
  } catch {
    return [
      new JsonBlock({
        json: withVisualObservation(json, {
          ok: false,
          reason: 'observer-unavailable',
        } as JSONValue),
      }),
    ] as unknown as JSONValue;
  }
}

async function toCallbackResult(
  def: KilnToolDef,
  output: unknown,
  context: KilnToolContext = {},
): Promise<JSONValue> {
  const multi = def.mediaMulti?.(output);
  if (multi) {
    if (context.renderObservationPort) {
      return observedMediaResult(def, multi.pngs, multi.json, context);
    }
    return [
      ...multi.pngs.map((png) => new ImageBlock({ format: 'png', source: { bytes: png } })),
      new JsonBlock({ json: multi.json as JSONValue }),
    ] as unknown as JSONValue;
  }
  const media = def.media?.(output);
  if (media) {
    if (context.renderObservationPort) {
      return observedMediaResult(def, [media.png], media.json, context);
    }
    return [
      new ImageBlock({ format: 'png', source: { bytes: media.png } }),
      new JsonBlock({ json: media.json as JSONValue }),
    ] as unknown as JSONValue;
  }
  const text = def.text?.(output);
  if (text !== undefined) return [new TextBlock(text)] as unknown as JSONValue;
  return output as JSONValue;
}

function toStrandsTool(def: KilnToolDef, context: KilnToolContext = {}): Tool {
  return tool({
    name: def.name,
    description: def.description,
    inputSchema: def.inputSchema as z.ZodType,
    callback: async (input) => toCallbackResult(def, await def.run(input), context),
  });
}

/** Native skin only adapts registry content; definitions and terminal checks stay shared. */
export function makeKilnNativeTools(
  completion: NativeCompletion,
  context: KilnToolContext,
): Tool[] {
  return createKilnNativeToolRegistry(context, completion).map((def) =>
    toStrandsTool(def, context),
  );
}
