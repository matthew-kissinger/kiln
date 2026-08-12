import { describe, expect, test } from 'bun:test';
import {
  MAX_VIEW_RENDER_TIMEOUT_MS,
  MIN_VIEW_RENDER_TIMEOUT_MS,
  resolveViewRenderTimeoutMs,
  type ViewRenderTimeoutContextProvider,
} from './view-render-timeout';

describe('R2.7 bounded per-request view-render timeout policy', () => {
  test('keeps the existing numeric timeout option byte-for-byte compatible', () => {
    expect(
      resolveViewRenderTimeoutMs({
        requestKind: 'in-loop-grid',
        defaultTimeoutMs: 6_000,
        timeoutMs: 25,
      }),
    ).toBe(25);
  });

  test('passes warm-up state and remaining budgets to a deterministic resolver', () => {
    const seen: unknown[] = [];
    expect(
      resolveViewRenderTimeoutMs({
        requestKind: 'derivative-cell',
        defaultTimeoutMs: 6_000,
        context: {
          warmUpState: 'pending',
          remainingGenerationBudgetMs: 18_000,
          rendererDeadlineMs: 12_000,
        },
        resolver: (context) => {
          seen.push(context);
          return context.warmUpState === 'pending' ? 10_000 : 2_000;
        },
      }),
    ).toBe(10_000);
    expect(seen).toEqual([
      {
        requestKind: 'derivative-cell',
        defaultTimeoutMs: 6_000,
        timeoutMs: 6_000,
        warmUpState: 'pending',
        remainingGenerationBudgetMs: 18_000,
        rendererDeadlineMs: 12_000,
      },
    ]);
    expect(Object.isFrozen(seen[0])).toBe(true);
  });

  test('caps every resolver result to renderer, generation, and global bounds', () => {
    expect(
      resolveViewRenderTimeoutMs({
        requestKind: 'final-grid',
        defaultTimeoutMs: 8_000,
        context: {
          warmUpState: 'ready',
          remainingGenerationBudgetMs: 4_500,
          rendererDeadlineMs: 10_000,
        },
        resolver: () => Number.POSITIVE_INFINITY,
      }),
    ).toBe(4_500);
    expect(
      resolveViewRenderTimeoutMs({
        requestKind: 'in-loop-grid',
        defaultTimeoutMs: MAX_VIEW_RENDER_TIMEOUT_MS * 2,
      }),
    ).toBe(MAX_VIEW_RENDER_TIMEOUT_MS);
    expect(
      resolveViewRenderTimeoutMs({
        requestKind: 'in-loop-grid',
        defaultTimeoutMs: -1,
      }),
    ).toBe(MIN_VIEW_RENDER_TIMEOUT_MS);
  });

  test('samples host context for every request instead of freezing generation-start state', () => {
    let sample = 0;
    const provider: ViewRenderTimeoutContextProvider = () => {
      sample += 1;
      return {
        warmUpState: sample === 1 ? 'pending' : 'ready',
        remainingGenerationBudgetMs: sample === 1 ? 20_000 : 5_000,
        rendererDeadlineMs: 30_000,
      };
    };
    const resolver = (
      context: Parameters<
        NonNullable<Parameters<typeof resolveViewRenderTimeoutMs>[0]['resolver']>
      >[0],
    ) => (context.warmUpState === 'pending' ? 12_000 : 4_000);

    const input = {
      requestKind: 'in-loop-grid' as const,
      defaultTimeoutMs: 6_000,
      contextProvider: provider,
      resolver,
    };
    expect(resolveViewRenderTimeoutMs(input)).toBe(12_000);
    expect(resolveViewRenderTimeoutMs(input)).toBe(4_000);
    expect(sample).toBe(2);
  });

  test('contains throwing host hooks and falls back to the bounded numeric policy', () => {
    expect(
      resolveViewRenderTimeoutMs({
        requestKind: 'in-loop-grid',
        defaultTimeoutMs: 6_000,
        timeoutMs: 1_234,
        contextProvider: () => {
          throw new Error('host state unavailable');
        },
        resolver: () => {
          throw new Error('must not run');
        },
      }),
    ).toBe(1_234);
    expect(
      resolveViewRenderTimeoutMs({
        requestKind: 'in-loop-grid',
        defaultTimeoutMs: 6_000,
        timeoutMs: 1_234,
        resolver: () => Number.NaN,
      }),
    ).toBe(1_234);
  });

  test('normalizes untrusted runtime state before exposing it to the resolver', () => {
    let seenWarmUpState = '';
    const timeout = resolveViewRenderTimeoutMs({
      requestKind: 'in-loop-grid',
      defaultTimeoutMs: 6_000,
      context: { warmUpState: 'invented' as 'ready', remainingGenerationBudgetMs: Number.NaN },
      resolver: (context) => {
        seenWarmUpState = context.warmUpState;
        return 2_000;
      },
    });
    expect(timeout).toBe(2_000);
    expect(seenWarmUpState).toBe('unknown');
  });
});
