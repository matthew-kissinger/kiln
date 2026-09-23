import { describe, expect, it } from 'bun:test';
import { runInNewContext } from 'node:vm';
import { composePrompt, parseArgs } from '../../scripts/dispatch-asset.mjs';
import { BRIEF } from '../../scripts/harness-smoke.mjs';
import { discoveryInputSchema } from '../discovery/query-schema';

describe('dispatcher neutral authoring entry', () => {
  it('rejects retired category selectors before creating a workspace or contacting a harness', () => {
    expect(() => parseArgs(['--category', 'architecture', 'a coliseum'])).toThrow(
      /--category.*removed.*brief/i,
    );
    expect(() => parseArgs(['--category=vehicle', 'a survey drone'])).toThrow(
      /--category.*removed/i,
    );
  });

  it('preserves an arbitrary asset brief without imposing a category or floor count', () => {
    const subject = 'an open coliseum with six tiers and a removable floor';
    const options = parseArgs(['--harness', 'opencode', '--name', 'coliseum', subject]);
    const prompt = composePrompt({ ...options, file: '/trial/coliseum.kiln.js' });
    expect(options.subject).toBe(subject);
    expect(prompt).toContain(subject);
    const metaLine = /const meta = \{[^\n]*?\};/.exec(prompt)?.[0];
    expect(metaLine).toBeDefined();
    const meta = runInNewContext(`${metaLine} meta;`) as Record<string, unknown>;
    expect(meta).toEqual({ name: 'Coliseum' });
    expect(prompt).not.toContain('This is ARCHITECTURE');
  });

  it('smoke prompt requests valid exact Discovery contracts instead of asking the agent to guess', () => {
    const prompt = BRIEF('/trial/smoke.kiln.js');
    const json = /Call kiln_discover with (\{[^\n]*?\})/.exec(prompt)?.[1];
    expect(json).toBeDefined();
    const input = discoveryInputSchema.parse(JSON.parse(json!));
    expect(input.ids).toEqual(['createRoot', 'createPart', 'boxGeo', 'gameMaterial']);
  });
});
