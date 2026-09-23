/** Canonical in-process Strands harness over the shared reference-based tool registry. */
import {
  Agent,
  TextBlock,
  ImageBlock,
  AfterToolsEvent,
  type Message,
  type Model,
  type Tool,
  type InvokeOptions,
  type AgentResult,
} from '@strands-agents/sdk';
import { AgentSkills } from '@strands-agents/sdk/vended-plugins/skills';
import type { AssetStyle } from '../authoring-style';
import type { KilnToolContext } from '../tools/registry';
import {
  ProgramArtifactStore,
  type ProgramArtifact,
  type NativeCompletion,
} from '../tools/program-artifacts';
import { MemoryProgramStore, retainProgram } from '../program-store';
import { assertNoLegacyRuntimePolicy, resolveRequirementsContext } from '../requirements-context';
import type { CaptureConfig } from '../views/capture';
import { ViewEvidenceHistoryStore } from '../views/evidence-history';
import { makeKilnNativeTools, type EditRecord, type KilnRenderCandidate } from './tools';
import { unifiedDiff } from './diff';
import { MetricsCollector, type AgentUsage, type KilnAgentEvent } from './hooks';
import {
  createGenerationCallBudget,
  generationModelCallLimitFromEnv,
  type GenerationModelCallAdmission,
  type GenerationModelCallRole,
} from './call-budget';
import {
  installRenderImageCompaction,
  installGenerationCounters,
  type GenerationCounters,
} from './compaction';
import { installCompletionBatchGuard } from './concurrency';
import { toCachedSystemPrompt } from './providers';
import { nativeUserPrompt, NATIVE_SYSTEM_PROMPT } from './native-prompt';
import { loadNativeSkills } from './skill-resources';
import { nativeWorkflowSkill, NATIVE_WORKFLOW_SKILL_NAME } from './native-workflow';

export type KilnKnowhow = 'inline' | 'skill';
export type RefineMode = 'rewrite' | 'edit';
export interface KilnInputImage {
  base64: string;
  mime: string;
}

export interface RunKilnAgentOptions extends Omit<KilnToolContext, 'programArtifacts'> {
  model: Model;
  prompt: string;
  style?: AssetStyle;
  knowhow?: KilnKnowhow;
  /** Domain discovery is always lazy. The old full prompt option is rejected. */
  apiSurface?: 'full' | 'trimmed';
  skillDir?: string;
  extraTools?: Tool[];
  includeAnimation?: boolean;
  existingCode?: string;
  existingProgramRef?: string;
  originalPrompt?: string;
  refineMode?: RefineMode;
  /** Rejection-only migration field; the native harness has one tool surface. */
  toolSurface?: 'current' | 'unified';
  agentName?: string;
  onEvent?: (event: KilnAgentEvent) => void;
  onCandidate?: (candidate: KilnRenderCandidate) => void;
  exemplarCode?: string;
  inputImage?: KilnInputImage;
  imageCompaction?: 'latest' | 'off';
  /** Automatic post-completion grade repair was removed; request explicit refinement. */
  gradeRefine?: 'auto' | 'off';
  modelCallRole?: GenerationModelCallRole;
  modelCallAdmission?: GenerationModelCallAdmission;
  signal?: AbortSignal;
  maxDurationMs?: number;
  /** Native Strands per-invocation turn/token caps. Token caps are soft at turn boundaries. */
  limits?: InvokeOptions['limits'];
}

export interface RunKilnAgentResult {
  completion: 'finished' | 'partial' | 'failed';
  code?: string;
  programRef?: string;
  /** Exact reviewed bytes, requirements and evidence; never re-evaluated on completion. */
  artifact?: ProgramArtifact;
  toolCalls: string[];
  steps: number;
  usage?: AgentUsage;
  counters?: GenerationCounters;
  lastText?: string;
  edits?: EditRecord[];
  diff?: string;
  captureSelection?: { capture?: CaptureConfig };
  capped?: boolean;
  /** Diagnostic compatibility field; partial work is not terminal acceptance. */
  salvaged?: 'step-cap' | 'error';
  error?: string;
  /** SDK lifecycle reason, distinct from Kiln's exact-artifact completion. */
  stopReason?: AgentResult['stopReason'];
}

function imageFormat(mime: string): 'png' | 'jpeg' | 'gif' | 'webp' {
  const types = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/gif': 'gif',
    'image/webp': 'webp',
  } as const;
  const format = types[mime.toLowerCase() as keyof typeof types];
  if (!format) throw new Error(`Unsupported reference image MIME: ${mime}`);
  return format;
}
function lastMessageText(message: Message | undefined): string | undefined {
  const text = message?.content
    .filter((b) => b.type === 'textBlock')
    .map((b) => b.text)
    .join('\n')
    .trim();
  return text || undefined;
}

/** Never promotes partial work or assistant prose into a finished artifact. */
export async function runKilnAgent(opts: RunKilnAgentOptions): Promise<RunKilnAgentResult> {
  let metrics: MetricsCollector | undefined;
  let counters: GenerationCounters | undefined;
  let agent: Agent | undefined;
  let signal: AbortSignal | undefined;
  let stopReason: AgentResult['stopReason'] | undefined;
  let lastText: string | undefined;
  let initialCode: string | undefined;
  let usageRecorded = false;
  const completion: NativeCompletion = {};
  const sdkLimited = () => stopReason?.startsWith('limit') === true;
  // Each run starts with its own private evidence store. A host store may retain
  // revisions, but an unrelated old run must not become this run's partial output.
  const artifacts = new ProgramArtifactStore();
  let active: ReturnType<typeof resolveRequirementsContext> | undefined;
  const resultFor = (
    artifact: ProgramArtifact | undefined,
    state: RunKilnAgentResult['completion'],
    error?: string,
  ): RunKilnAgentResult => ({
    completion: state,
    ...(metrics?.readMetrics() ?? { toolCalls: [], steps: 0 }),
    ...(counters ? { counters } : {}),
    ...(lastText ? { lastText } : {}),
    ...(stopReason ? { stopReason } : {}),
    ...(artifact
      ? {
          artifact,
          code: artifact.code,
          programRef: artifact.programRef,
          captureSelection: artifact.captureSelection,
          ...(initialCode
            ? {
                diff: unifiedDiff(initialCode, artifact.code, {
                  fromLabel: 'parent',
                  toLabel: 'refined',
                }),
              }
            : {}),
        }
      : {}),
    ...(metrics?.wasCapped() || sdkLimited() ? { capped: true } : {}),
    ...(state === 'partial'
      ? {
          salvaged:
            metrics?.wasCapped() || sdkLimited() ? ('step-cap' as const) : ('error' as const),
        }
      : {}),
    ...(error ? { error } : {}),
  });
  try {
    assertNoLegacyRuntimePolicy(opts);
    if (opts.toolSurface !== undefined || process.env.KILN_TOOL_SURFACE !== undefined)
      throw new Error(
        'Tool-surface selection was removed. Remove toolSurface/KILN_TOOL_SURFACE and use the shared program-reference workflow; see docs/migration.md.',
      );
    if (opts.gradeRefine === 'auto')
      throw new Error(
        'Automatic post-finish grade refinement was removed. Review grade feedback before kiln_finish, or start an explicit refinement run.',
      );
    if (opts.apiSurface === 'full')
      throw new Error(
        'Full embedded API prompts were removed. Use kiln_discover for current signatures and recipes.',
      );
    if (opts.knowhow !== undefined && opts.knowhow !== 'inline' && opts.knowhow !== 'skill')
      throw new Error('knowhow must be inline or skill.');
    if (opts.skillDir && opts.knowhow !== 'skill')
      throw new Error(
        'skillDir requires knowhow="skill"; skill loading is never silently ignored.',
      );
    if (opts.knowhow === 'skill' && !opts.skillDir)
      throw new Error('knowhow="skill" requires skillDir.');
    const nativeSkills =
      opts.knowhow === 'skill' ? await loadNativeSkills(opts.skillDir!) : undefined;
    if (nativeSkills?.skills.some((skill) => skill.name === NATIVE_WORKFLOW_SKILL_NAME))
      throw new Error(
        `Skill name is reserved by the native harness: ${NATIVE_WORKFLOW_SKILL_NAME}`,
      );
    if (opts.existingCode !== undefined && opts.existingProgramRef !== undefined)
      throw new Error('Supply existingCode OR existingProgramRef, not both.');
    if (!opts.prompt?.trim() && !opts.inputImage)
      throw new Error('An asset prompt or reference image is required.');
    active = resolveRequirementsContext(opts.requirements);
    const programStore = opts.programStore ?? new MemoryProgramStore();
    const initialRef =
      opts.existingCode !== undefined
        ? await retainProgram(programStore, opts.existingCode)
        : opts.existingProgramRef;
    if (initialRef) initialCode = await programStore.get(initialRef);
    if (
      opts.maxDurationMs !== undefined &&
      (!Number.isSafeInteger(opts.maxDurationMs) || opts.maxDurationMs <= 0)
    )
      throw new Error('maxDurationMs must be a positive safe integer.');
    const signals = [
      opts.signal,
      opts.maxDurationMs ? AbortSignal.timeout(opts.maxDurationMs) : undefined,
    ].filter((s): s is AbortSignal => !!s);
    signal = signals.length ? AbortSignal.any(signals) : undefined;
    signal?.throwIfAborted();
    const budget =
      opts.generationCallBudget ?? createGenerationCallBudget(generationModelCallLimitFromEnv());
    metrics = new MetricsCollector(
      opts.onEvent,
      undefined,
      budget,
      opts.modelCallRole ?? 'author',
      opts.modelCallAdmission,
    );
    const context: KilnToolContext = {
      ...opts,
      ...(nativeSkills ? { skillResourceReader: nativeSkills.read } : {}),
      requirements: active.binding,
      programStore,
      programArtifacts: artifacts,
      viewEvidenceHistory: opts.viewEvidenceHistory ?? new ViewEvidenceHistoryStore(),
      generationCallBudget: budget,
      evaluationControls: () => {
        const controls = opts.evaluationControls?.() ?? {};
        return {
          ...controls,
          ...(signal
            ? { signal: controls.signal ? AbortSignal.any([signal, controls.signal]) : signal }
            : {}),
        };
      },
    };
    const tools = makeKilnNativeTools(completion, context);
    const extraTools = opts.extraTools ?? [];
    const reserved = new Set([...tools.map((t) => t.name), 'skills']);
    for (const tool of extraTools) {
      const name = (tool as { name?: unknown })?.name;
      if (typeof name === 'string' && (reserved.has(name) || name.startsWith('kiln_')))
        throw new Error(`Extra tool name conflicts with the Kiln workflow: ${name}`);
    }
    agent = new Agent({
      model: opts.model,
      systemPrompt: await toCachedSystemPrompt(NATIVE_SYSTEM_PROMPT, opts.model),
      tools: [...tools, ...extraTools],
      plugins: [
        new AgentSkills({
          skills: [nativeWorkflowSkill(), ...(nativeSkills?.skills ?? [])],
          strict: true,
        }),
      ],
      name: opts.agentName ?? 'kiln-agent',
      // Kiln tools execute through the evaluator boundary. No shell/file tool is needed.
      sandbox: false,
    });
    signal?.throwIfAborted();
    metrics.attach(agent);
    installCompletionBatchGuard(agent);
    let lastCandidate: string | undefined;
    agent.addHook(AfterToolsEvent, (event) => {
      const artifact = artifacts.latest(active!);
      if (opts.onCandidate && artifact?.review.pngBase64 && artifact.programRef !== lastCandidate) {
        lastCandidate = artifact.programRef;
        try {
          opts.onCandidate({
            code: artifact.code,
            pngBase64: artifact.review.pngBase64,
            tris: artifact.rendered.tris,
          });
        } catch {
          /* observational hook */
        }
      }
      if (completion.artifact) event.endTurn = `Finished ${completion.artifact.programRef}.`;
    });
    counters = installGenerationCounters(agent).counters;
    if ((opts.imageCompaction ?? 'latest') === 'latest') installRenderImageCompaction(agent);
    const userPrompt = nativeUserPrompt({
      ...opts,
      requirements: active,
      ...(initialRef ? { existingProgramRef: initialRef } : {}),
    });
    const input = opts.inputImage
      ? [
          new TextBlock(userPrompt),
          new ImageBlock({
            format: imageFormat(opts.inputImage.mime),
            source: { bytes: new Uint8Array(Buffer.from(opts.inputImage.base64, 'base64')) },
          }),
        ]
      : userPrompt;
    const remaining = budget.receipt().remaining;
    const requestedTurns = opts.limits?.turns;
    const limits = {
      ...opts.limits,
      ...(remaining !== null && remaining > 0
        ? {
            // Leave invalid SDK values intact for its own validation. Clamping
            // Infinity to a finite shared budget would silently repair bad input.
            turns:
              requestedTurns === undefined
                ? remaining
                : Number.isFinite(requestedTurns)
                  ? Math.min(requestedTurns, remaining)
                  : requestedTurns,
          }
        : {}),
    };
    const outcome = await agent.invoke(input, {
      ...(signal ? { cancelSignal: signal } : {}),
      ...(Object.keys(limits).length ? { limits } : {}),
    });
    stopReason = outcome.stopReason;
    metrics.recordResultUsage(outcome.metrics?.latestAgentInvocation?.usage);
    usageRecorded = true;
    lastText = lastMessageText(outcome.lastMessage);
    if (completion.artifact) return resultFor(completion.artifact, 'finished');
    const partial = artifacts.latest(active);
    const reason = signal?.aborted
      ? 'Kiln agent run cancelled.'
      : (metrics.capReason() ??
        (sdkLimited() ? `Strands invocation budget cap reached: ${stopReason}.` : undefined) ??
        'Agent ended without a successful kiln_finish of a reviewed revision.');
    return resultFor(partial, partial ? 'partial' : 'failed', reason);
  } catch (error) {
    if (!usageRecorded) metrics?.recordResultUsage(agent?.metrics.latestAgentInvocation?.usage);
    const partial = active ? artifacts.latest(active) : undefined;
    return resultFor(
      partial,
      partial ? 'partial' : 'failed',
      error instanceof Error ? error.message : String(error),
    );
  } finally {
    metrics?.detach();
  }
}
