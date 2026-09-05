/**
 * `kiln_edit` — the refine verb.
 *
 * The two properties worth pinning here are the ones a future change is most
 * likely to break by accident: that a failed edit changes nothing at all, and
 * that an edit which succeeds leaves every untouched line byte-for-byte alone.
 * Both are the whole reason the tool exists rather than telling the model to
 * re-emit the program through `kiln_render`.
 */
import { describe, expect, it } from 'bun:test';

import { createKilnEditDef, type KilnEditResult } from '../tools/registry';

const PROGRAM = `const meta = { name: 'Post', category: 'prop' };

function build() {
  const root = createRoot('Post');
  const oak = gameMaterial(0x8b5a2b, { roughness: 0.85 });

  createPart('Shaft', boxGeo(0.2, 2, 0.2), oak, { position: [0, 1, 0], parent: root });
  createPart('Cap', boxGeo(0.3, 0.1, 0.3), oak, { position: [0, 2.05, 0], parent: root });

  return root;
}
`;

const edit = createKilnEditDef();
const run = (input: unknown) => edit.run(input) as Promise<KilnEditResult>;

describe('kiln_edit', () => {
  it('applies an exact-string edit and returns the patched program', async () => {
    const out = await run({
      code: PROGRAM,
      edits: [{ oldString: 'boxGeo(0.2, 2, 0.2)', newString: 'boxGeo(0.25, 3, 0.25)' }],
      render: false,
    });

    expect(out.ok).toBe(true);
    expect(out.code).toContain('boxGeo(0.25, 3, 0.25)');
    expect(out.applied).toEqual([{ occurrences: 1 }]);
  });

  it('leaves every line it did not touch byte-for-byte identical', async () => {
    const out = await run({
      code: PROGRAM,
      edits: [{ oldString: "name: 'Post'", newString: "name: 'Bollard'" }],
      render: false,
    });

    expect(out.ok).toBe(true);
    const before = PROGRAM.split('\n');
    const after = out.code!.split('\n');
    expect(after.length).toBe(before.length);
    for (let i = 0; i < before.length; i++) {
      if (before[i]!.includes("name: 'Post'")) continue;
      expect(after[i]).toBe(before[i]!);
    }
  });

  it('applies several edits in the order given', async () => {
    const out = await run({
      code: PROGRAM,
      edits: [
        { oldString: 'boxGeo(0', newString: 'boxGeo(1', replaceAll: true },
        { oldString: "'Cap'", newString: "'Finial'" },
      ],
      render: false,
    });

    expect(out.ok).toBe(true);
    expect(out.applied).toEqual([{ occurrences: 2 }, { occurrences: 1 }]);
    expect(out.code).toContain("'Finial'");
  });

  it('refuses an ambiguous edit rather than guessing which one was meant', async () => {
    const out = await run({
      code: PROGRAM,
      edits: [{ oldString: 'createPart(', newString: 'createPart(' }],
      render: false,
    });

    // Identical strings are rejected before ambiguity is even considered.
    expect(out.ok).toBe(false);
    expect(out.failedEdit).toBe(1);

    const ambiguous = await run({
      code: PROGRAM,
      edits: [{ oldString: 'boxGeo(0', newString: 'boxGeo(1' }],
      render: false,
    });
    expect(ambiguous.ok).toBe(false);
    expect(ambiguous.error).toMatch(/matched 2 times/i);
    expect(ambiguous.hint).toMatch(/replaceAll/);
  });

  it('applies nothing at all when a later edit fails', async () => {
    // The first edit here is valid. If the call were not all-or-nothing it would
    // land, and the caller would be holding a program it never asked for.
    const out = await run({
      code: PROGRAM,
      edits: [
        { oldString: "name: 'Post'", newString: "name: 'Bollard'" },
        { oldString: 'this text is not in the program', newString: 'x' },
      ],
      render: false,
    });

    expect(out.ok).toBe(false);
    expect(out.failedEdit).toBe(2);
    expect(out.code).toBeUndefined();
    expect(out.diff).toBeUndefined();
  });

  it('reports a diff of what actually changed', async () => {
    const out = await run({
      code: PROGRAM,
      edits: [{ oldString: "name: 'Post'", newString: "name: 'Bollard'" }],
      render: false,
    });

    expect(out.ok).toBe(true);
    expect(out.diff).toContain("-const meta = { name: 'Post'");
    expect(out.diff).toContain("+const meta = { name: 'Bollard'");
    // A one-line change should not report the whole file as changed.
    const removed = out.diff!.split('\n').filter((l) => l.startsWith('-') && !l.startsWith('---'));
    expect(removed).toHaveLength(1);
  });

  it('renders the patched program by default, so the change is visible in one call', async () => {
    const out = await run({
      code: PROGRAM,
      edits: [{ oldString: 'boxGeo(0.2, 2, 0.2)', newString: 'boxGeo(0.25, 3, 0.25)' }],
    });

    expect(out.ok).toBe(true);
    expect(out.render?.ok).toBe(true);
    expect(out.render?.tris).toBeGreaterThan(0);
    expect(typeof out.pngBase64).toBe('string');
    expect(out.pngBase64!.length).toBeGreaterThan(0);
  });

  it('sends the render image exactly once, not in two places on the wire', async () => {
    const out = await run({
      code: PROGRAM,
      edits: [{ oldString: "'Cap'", newString: "'Finial'" }],
    });

    // Lifted to the top level for the media extractor; stripped from the nested
    // render so the same base64 payload is not carried twice.
    expect(out.pngBase64).toBeDefined();
    expect((out.render as { pngBase64?: string }).pngBase64).toBeUndefined();

    const media = edit.media!(out);
    expect(media).toBeDefined();
    expect(media!.png.byteLength).toBeGreaterThan(0);
    expect((media!.json as KilnEditResult).pngBase64).toBeUndefined();
  });

  it('surfaces a build failure in the render rather than pretending the edit was wrong', async () => {
    const out = await run({
      code: PROGRAM,
      edits: [{ oldString: 'return root;', newString: 'return notAFunction();' }],
    });

    // The edit itself applied cleanly: the string was there and was replaced.
    expect(out.ok).toBe(true);
    expect(out.code).toContain('notAFunction();');
    // The program no longer builds, and that is the render's finding to report.
    expect(out.render?.ok).toBe(false);
  });
});
