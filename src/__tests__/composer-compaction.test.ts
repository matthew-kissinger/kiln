/**
 * SceneCompactionManager tests — the composer's context compaction.
 *
 * The scene state lives in the PlacementModel, so the transcript is disposable: once
 * it bloats, `reduce()` collapses the WHOLE history to one synthetic user message
 * carrying the current program + a finalize directive. These tests pin the collapse
 * (always a single valid message, no dangling tool pairs), the message contents
 * (program, counts, goal, finalize nudge), and the message-count trigger wired in
 * `initAgent`.
 */
import { describe, expect, test } from 'bun:test';
import { BeforeModelCallEvent, Message, TextBlock } from '@strands-agents/sdk';

import { type CatalogEntry, PlacementModel, serialize } from '../composer';
import { SceneCompactionManager, type SceneCompactionInfo } from '../composer/agent';

const asset = (id: string, w = 2, h = 3, d = 2): CatalogEntry => ({
  generationId: id,
  bbox: { min: [-w / 2, 0, -d / 2], max: [w / 2, h, d / 2] },
  name: id,
});

/** A small scene with a couple of placements (so serialize() is non-trivial). */
function scene(): PlacementModel {
  const m = new PlacementModel('Compaction Test', {
    seed: 7,
    catalog: [asset('temple', 6, 8, 6), asset('obelisk', 1, 5, 1), asset('palm', 1, 4, 1)],
  });
  m.addPlace('temple', { at: [0, 0], face: 'center', role: 'hero' });
  m.addPlace('obelisk', { at: [12, 0], face: 'center', role: 'support' });
  return m;
}

const msg = (role: 'user' | 'assistant', text: string): Message =>
  new Message({ role, content: [new TextBlock(text)] });

/** A bloated transcript: one task message + many tool-churn turns. */
function bloated(n: number): Message[] {
  const out: Message[] = [msg('user', 'compose the necropolis')];
  for (let i = 0; i < n; i++) {
    out.push(msg('assistant', `move asset ${i}`), msg('user', `[tool result ${i}]`));
  }
  return out;
}

/** Pull the text out of a single-block user message. */
function textOf(m: Message): string {
  const block = m.content[0] as { text?: string };
  return block.text ?? '';
}

describe('SceneCompactionManager.reduce', () => {
  test('collapses the whole transcript to one synthetic user message', () => {
    const model = scene();
    const mgr = new SceneCompactionManager({ model });
    const agent = { messages: bloated(30) } as never as { messages: Message[] };
    expect(agent.messages.length).toBe(61);

    const reduced = mgr.reduce({ agent, model } as never);

    expect(reduced).toBe(true);
    expect(agent.messages).toHaveLength(1);
    expect(agent.messages[0]?.role).toBe('user');
  });

  test('the synthetic message carries the program, counts, and a finalize directive', () => {
    const model = scene();
    const mgr = new SceneCompactionManager({
      model,
      taskRecap: 'Egyptian Necropolis — grand plaza',
    });
    const agent = { messages: bloated(20) } as never as { messages: Message[] };

    mgr.reduce({ agent, model } as never);
    const body = textOf(agent.messages[0]!);

    // The program IS the compacted state — it must be reproduced verbatim.
    expect(body).toContain(serialize(model));
    // The two placements are surfaced in the count line.
    expect(body).toContain('2 placement(s)');
    // The goal recap is restated so the collapsed transcript is self-contained.
    expect(body).toContain('Egyptian Necropolis — grand plaza');
    // The convergence nudge: render once, fix a little, finalize.
    expect(body).toContain('scene_render');
    expect(body).toContain('scene_finalize');
    expect(body).toMatch(/source of truth/i);
  });

  test('is a no-op when there is nothing to compact (<= 1 message)', () => {
    const model = scene();
    const mgr = new SceneCompactionManager({ model });
    const agent = { messages: [msg('user', 'start')] } as never as { messages: Message[] };

    expect(mgr.reduce({ agent, model } as never)).toBe(false);
    expect(agent.messages).toHaveLength(1);
  });

  test('reports compaction telemetry via onCompact', () => {
    const model = scene();
    const seen: SceneCompactionInfo[] = [];
    const mgr = new SceneCompactionManager({ model, onCompact: (i) => seen.push(i) });
    const agent = { messages: bloated(10) } as never as { messages: Message[] };

    mgr.reduce({ agent, model } as never);

    expect(seen).toHaveLength(1);
    expect(seen[0]).toEqual({ messagesBefore: 21, placements: 2, overlaps: 0 });
  });
});

describe('SceneCompactionManager.initAgent (message-count trigger)', () => {
  test('compacts before a model call once the transcript exceeds maxMessages', () => {
    const model = scene();
    const mgr = new SceneCompactionManager({ model, maxMessages: 10 });

    // Capture every hook the manager registers (base reactive + proactive + ours).
    const hooks: Array<{ evt: unknown; cb: (e: unknown) => unknown }> = [];
    const agent = {
      messages: bloated(20), // 41 messages, well over maxMessages
      addHook(evt: unknown, cb: (e: unknown) => unknown) {
        hooks.push({ evt, cb });
        return () => {};
      },
    };

    mgr.initAgent(agent as never);

    // Fire the BeforeModelCall hooks (base proactive is inert without a threshold; ours compacts).
    const before = hooks.filter((h) => h.evt === BeforeModelCallEvent);
    expect(before.length).toBeGreaterThan(0);
    for (const h of before) h.cb({ agent, model });

    expect(agent.messages).toHaveLength(1);
  });

  test('does not compact while the transcript is within maxMessages', () => {
    const model = scene();
    const mgr = new SceneCompactionManager({ model, maxMessages: 40 });
    const hooks: Array<{ evt: unknown; cb: (e: unknown) => unknown }> = [];
    const agent = {
      messages: bloated(5), // 11 messages, under maxMessages
      addHook(evt: unknown, cb: (e: unknown) => unknown) {
        hooks.push({ evt, cb });
        return () => {};
      },
    };

    mgr.initAgent(agent as never);
    for (const h of hooks.filter((h) => h.evt === BeforeModelCallEvent)) h.cb({ agent, model });

    expect(agent.messages).toHaveLength(11);
  });
});
