/** Engine-owned bounded second-stage compiler for canonical world integration. */
import {
  Agent,
  ImageBlock,
  JsonBlock,
  type JSONValue,
  type Message,
  type Tool,
  tool,
} from '@strands-agents/sdk';
import { z } from 'zod';
import { type AgentUsage, type KilnAgentEvent, MetricsCollector } from '../../agent/hooks';
import type { GenerationCallBudget, GenerationCallBudgetReceipt } from '../../agent/call-budget';
import { toCachedSystemPrompt } from '../../agent/providers';
import {
  hashWorldDocumentV2,
  parseWorldDocumentV2,
  PlacementModel,
  type Placement,
  type SceneRenderFallbackReceipt,
  type SceneRenderReceipt,
  type SceneRenderPort,
  type SceneRenderResult,
  type WorldDocumentV2,
  validateWorldIntegrationV2,
  worldDocumentV2ToSceneModelJSON,
} from '..';
import { WORLD_INTEGRATION_PROMPT_V2 } from './prompt';
import {
  makeWorldIntegrationToolsV2,
  type MakeWorldIntegrationToolsV2Options,
  type WorldIntegrationToolState,
} from './world-tools';

export interface RunKilnWorldIntegrationOptions
  extends Omit<MakeWorldIntegrationToolsV2Options, 'state'> {
  model: unknown;
  prompt: string;
  world: unknown;
  render: SceneRenderPort;
  agentName?: string;
  onEvent?: (event: KilnAgentEvent) => void;
  extraTools?: unknown[];
  /** Explicit integration-only model-call ceiling. Required without a shared budget. */
  maxSteps?: number;
  /** Preferred: the same aggregate allowance used by compose/observer/repair roles. */
  generationCallBudget?: GenerationCallBudget;
}

export interface RunKilnWorldIntegrationResult {
  world: WorldDocumentV2;
  worldHash: `sha256:${string}`;
  placements: Placement[];
  finalized: boolean;
  toolCalls: string[];
  steps: number;
  usage?: AgentUsage;
  callBudget?: GenerationCallBudgetReceipt;
  /** Every successful canonical-world render attempt, in tool-call order. */
  renderEvidence: WorldIntegrationRenderEvidence[];
  capped?: boolean;
  lastText?: string;
  error?: string;
}

export interface WorldIntegrationRenderEvidence {
  worldHash: `sha256:${string}`;
  views: number;
  /** Absent only for a legacy host that did not report fallback provenance. */
  degraded?: boolean;
  degradeReason?: string;
  receipt?: SceneRenderReceipt;
  fallbackReceipt?: SceneRenderFallbackReceipt;
}

const empty = z.object({}).strict();
const png = (base64: string): Uint8Array => new Uint8Array(Buffer.from(base64, 'base64'));

function placements(world: WorldDocumentV2): Placement[] {
  return PlacementModel.fromJSON(worldDocumentV2ToSceneModelJSON(world)).placements().placements;
}

function lastMessageText(message: Message | undefined): string | undefined {
  if (!message) return undefined;
  const text = message.content
    .filter((block) => (block as { type?: string }).type === 'textBlock')
    .map((block) => (block as { text?: string }).text ?? '')
    .join('\n')
    .trim();
  return text || undefined;
}

function lifecycleTools(
  state: WorldIntegrationToolState,
  render: SceneRenderPort,
  finalized: { value: boolean },
  renderEvidence: WorldIntegrationRenderEvidence[],
): Tool[] {
  return [
    tool({
      name: 'scene_world_view',
      description: 'Inspect the complete canonical world and authored integration counts.',
      inputSchema: empty,
      callback: async () =>
        ({
          ok: true,
          worldHash: await hashWorldDocumentV2(state.world),
          objects: state.world.objects.length,
          zones: state.world.authored.zones.length,
          paths: state.world.authored.paths.length,
          sockets: state.world.authored.sockets.length,
          spawns: state.world.spawns.length,
          terrain: state.world.terrain.kind,
        }) as JSONValue,
    }),
    tool({
      name: 'scene_world_validate',
      description:
        'Check socket compatibility/occupancy and every reserved, portal, and spawn clearance.',
      inputSchema: empty,
      callback: () => {
        const issues = validateWorldIntegrationV2(state.world);
        return { ok: issues.length === 0, issues } as unknown as JSONValue;
      },
    }),
    tool({
      name: 'scene_world_render',
      description:
        'Render the current canonical world with the host inspection profile; inspect before finalizing.',
      inputSchema: empty,
      callback: async () => {
        const worldHash = await hashWorldDocumentV2(state.world);
        const result = await render({
          placements: placements(state.world),
          worldDocument: state.world,
          worldHash,
        });
        if (!result.ok) return { ok: false, error: result.error ?? 'render failed' } as JSONValue;
        const frames = result.perCameraBase64?.length
          ? result.perCameraBase64
          : result.pngBase64
            ? [result.pngBase64]
            : [];
        const evidence = renderEvidenceOf(worldHash, frames.length, result);
        renderEvidence.push(evidence);
        return [
          ...frames.map(
            (frame) => new ImageBlock({ format: 'png', source: { bytes: png(frame) } }),
          ),
          new JsonBlock({ json: { ok: true, ...evidence } as unknown as JSONValue }),
        ] as unknown as JSONValue;
      },
    }),
    tool({
      name: 'scene_world_finalize',
      description: 'Finalize the validated canonical world after rendering it. Call exactly once.',
      inputSchema: empty,
      callback: async () => {
        const issues = validateWorldIntegrationV2(state.world);
        if (issues.length) return { ok: false, issues } as unknown as JSONValue;
        finalized.value = true;
        return { ok: true, worldHash: await hashWorldDocumentV2(state.world) } as JSONValue;
      },
    }),
  ];
}

function cloneReceipt(receipt: SceneRenderReceipt): SceneRenderReceipt {
  if (
    receipt.perCameraOutputSha256 !== undefined &&
    receipt.perCameraOutputSha256.length !== receipt.cameras.length
  ) {
    throw new TypeError('render receipt per-camera output hashes must match cameras');
  }
  return {
    ...receipt,
    ...(receipt.perCameraOutputSha256
      ? { perCameraOutputSha256: [...receipt.perCameraOutputSha256] }
      : {}),
    cameras: receipt.cameras.map((camera) => ({
      ...camera,
      position: [...camera.position],
      target: [...camera.target],
      up: [...camera.up],
    })),
  };
}

function renderEvidenceOf(
  worldHash: `sha256:${string}`,
  views: number,
  result: SceneRenderResult,
): WorldIntegrationRenderEvidence {
  if (result.receipt && result.fallbackReceipt) {
    throw new TypeError('render result cannot carry both exact and fallback receipts');
  }
  return {
    worldHash,
    views,
    ...(result.degraded !== undefined ? { degraded: result.degraded } : {}),
    ...(result.degradeReason ? { degradeReason: result.degradeReason } : {}),
    ...(result.receipt ? { receipt: cloneReceipt(result.receipt) } : {}),
    ...(result.fallbackReceipt ? { fallbackReceipt: { ...result.fallbackReceipt } } : {}),
  };
}

/**
 * Run the bounded post-compose integration phase over one canonical authority.
 * Fresh flow: compose -> migrate v1 candidate -> run this. Refine flow: compose
 * candidate -> reconcileWorldDocumentV2Candidate(parent,candidate) -> run this.
 * Every placement-affecting world tool mutates the same state rendered/finalized.
 */
export async function runKilnWorldIntegration(
  options: RunKilnWorldIntegrationOptions,
): Promise<RunKilnWorldIntegrationResult> {
  const state: WorldIntegrationToolState = { world: parseWorldDocumentV2(options.world) };
  const finalized = { value: false };
  const renderEvidence: WorldIntegrationRenderEvidence[] = [];
  const maxSteps = options.maxSteps ?? 0;
  const metrics = new MetricsCollector(
    options.onEvent,
    maxSteps,
    options.generationCallBudget,
    'author',
  );
  try {
    if (!options.generationCallBudget && (!Number.isInteger(maxSteps) || maxSteps < 1)) {
      throw new Error(
        'runKilnWorldIntegration requires generationCallBudget or an explicit positive maxSteps',
      );
    }
    const mutationTools = makeWorldIntegrationToolsV2({
      state,
      ...(options.publishHeightfieldArtifact
        ? { publishHeightfieldArtifact: options.publishHeightfieldArtifact }
        : {}),
      ...(options.onWorldChanged ? { onWorldChanged: options.onWorldChanged } : {}),
    });
    const tools: unknown[] = [
      ...mutationTools,
      ...lifecycleTools(state, options.render, finalized, renderEvidence),
      ...(options.extraTools ?? []),
    ];
    const agent = new Agent({
      model: options.model as never,
      systemPrompt: toCachedSystemPrompt(WORLD_INTEGRATION_PROMPT_V2, options.model),
      tools: tools as never,
      name: options.agentName ?? 'kiln-world-integrator',
    });
    metrics.attach(agent);
    const result = await agent.invoke(
      `## World integration task\n${options.prompt.trim()}\n\nInspect the current world, make only bounded integration edits that serve the request, render, validate, then finalize.` as never,
    );
    metrics.recordResultUsage(result.metrics?.latestAgentInvocation?.usage);
    const collected = metrics.readMetrics();
    const worldHash = await hashWorldDocumentV2(state.world);
    const lastText = lastMessageText(result.lastMessage);
    return {
      world: state.world,
      worldHash,
      placements: placements(state.world),
      finalized: finalized.value,
      toolCalls: collected.toolCalls,
      steps: collected.steps,
      renderEvidence,
      ...(collected.usage ? { usage: collected.usage } : {}),
      ...(options.generationCallBudget
        ? { callBudget: options.generationCallBudget.receipt() }
        : {}),
      ...(metrics.wasCapped() ? { capped: true } : {}),
      ...(lastText ? { lastText } : {}),
    };
  } catch (error) {
    const collected = metrics.readMetrics();
    return {
      world: state.world,
      worldHash: await hashWorldDocumentV2(state.world),
      placements: placements(state.world),
      finalized: finalized.value,
      toolCalls: collected.toolCalls,
      steps: collected.steps,
      renderEvidence,
      ...(collected.usage ? { usage: collected.usage } : {}),
      ...(options.generationCallBudget
        ? { callBudget: options.generationCallBudget.receipt() }
        : {}),
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    metrics.detach();
  }
}
