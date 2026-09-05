/**
 * Every checked-in example still runs, and the README does not lie about it.
 *
 * The examples are not decoration: they are the gallery in the README, they are
 * what a reader looks at first, and `scripts/hero-shots.ts` regenerates the
 * published renders straight from them. Until this file existed, none of that
 * was covered. Two examples were deleted during a gallery edit and the suite did
 * not move by a single test, and a triangle count in the README sat 552 wrong
 * for as long as it took someone to re-render the asset by hand and notice.
 *
 * Both failures are the same shape: a claim in prose about a program, with
 * nothing tying the two together. So this executes every example once and then
 * checks the prose against what actually came out.
 *
 * It runs on the CPU path (no render service required) and does not rasterize.
 * Execution is where the cost and the risk both are -- booleans, revolves,
 * procedural textures -- so it is the part worth guarding in CI.
 */
import { readdir, readFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';

import { describe, expect, it } from 'bun:test';

import { readAuthorship } from '../../scripts/authorship';
import { resolveEvaluatorPortV1 } from '../evaluator/protocol';

const REPO = resolve(import.meta.dir, '..', '..');
const EXAMPLES = join(REPO, 'examples');
const RENDERS = join(EXAMPLES, 'renders');

const names = (await readdir(EXAMPLES))
  .filter((f) => f.endsWith('.kiln.js'))
  .map((f) => basename(f, '.kiln.js'))
  .sort();

type Outcome = { tris: number; bytes: number; warnings: string[] } | { error: string };

/**
 * Executed once, at module scope, because several assertions need the same
 * result and a boolean-heavy building is not cheap to run twice. Failures are
 * captured rather than thrown so that one broken example reports as one failing
 * test instead of taking the whole file down with it.
 */
const outcomes = new Map<string, Outcome>(
  await Promise.all(
    names.map(async (name): Promise<[string, Outcome]> => {
      try {
        const code = await readFile(join(EXAMPLES, `${name}.kiln.js`), 'utf8');
        const evaluator = resolveEvaluatorPortV1(undefined, 'trusted-local');
        const r = await evaluator.render(code);
        return [name, { tris: r.tris, bytes: r.glb.byteLength, warnings: r.warnings }];
      } catch (err) {
        return [name, { error: err instanceof Error ? err.message : String(err) }];
      }
    }),
  ),
);

describe('examples', () => {
  it('finds a non-trivial set to check', () => {
    expect(names.length).toBeGreaterThanOrEqual(10);
  });

  for (const name of names) {
    it(`${name} executes and produces geometry`, () => {
      const out = outcomes.get(name)!;
      if ('error' in out) throw new Error(`${name} failed to execute: ${out.error}`);
      expect(out.tris).toBeGreaterThan(0);
      expect(out.bytes).toBeGreaterThan(0);
      // Structural warnings are the ones that matter here: a floating part or a
      // degenerate normal is a defect in the example, not a note about it. If an
      // example ever needs to carry one, the right move is to fix the example --
      // every one of them is meant to be exemplary.
      expect(out.warnings).toEqual([]);
    });
  }
});

describe('hero gallery', () => {
  /**
   * Read the hero list out of the script rather than importing it: importing
   * `hero-shots.ts` pulls in the render port and would try to build one. The
   * list is a plain literal, so a regex over the source is enough and cannot
   * drift from what the script actually renders.
   */
  const heroes = (async () => {
    const src = await readFile(join(REPO, 'scripts', 'hero-shots.ts'), 'utf8');
    const block = /const HEROES = \[([^\]]*)\] as const;/.exec(src);
    if (!block) throw new Error('could not find the HEROES list in scripts/hero-shots.ts');
    return [...block[1]!.matchAll(/'([^']+)'/g)].map((m) => m[1]!);
  })();

  const readme = readFile(join(REPO, 'README.md'), 'utf8');

  it('names only examples that exist', async () => {
    for (const hero of await heroes) expect(names).toContain(hero);
  });

  it('has a checked-in render for every hero, and no orphans', async () => {
    const expected = (await heroes).map((h) => `${h}.png`).sort();
    const actual = (await readdir(RENDERS)).filter((f) => f.endsWith('.png')).sort();
    expect(actual).toEqual(expected);
  });

  it('is in the README exactly once per hero, with no cell for anything else', async () => {
    const src = await readme;
    // Scoped to the gallery table specifically. The README has a second table
    // below it for the animated examples, and those cells link back to programs
    // that are already heroes — counting them here would read as duplicates and
    // make the check fail for a README that is correct.
    const gallery = /<table>[\s\S]*?<\/table>/.exec(src);
    if (!gallery) throw new Error('no gallery table in README.md');
    const cells = [...gallery[0].matchAll(/href="examples\/([a-z0-9-]+)\.kiln\.js"/g)].map(
      (m) => m[1]!,
    );
    expect(cells.sort()).toEqual([...(await heroes)].sort());
  });

  /**
   * The animated examples get a GIF each, and a README that points at one which
   * was never rendered shows a broken image to everyone who opens the page.
   * Same lockstep as the stills: the list in the script, the files on disk, and
   * the cells in the README all have to agree.
   */
  it('has a GIF for every animated example the README shows, and no orphans', async () => {
    const script = await readFile(join(REPO, 'scripts', 'anim-gifs.ts'), 'utf8');
    const block =
      /const GIFS: readonly \{ name: string; clip: string \}\[\] = \[([\s\S]*?)\];/.exec(script);
    if (!block) throw new Error('could not find the GIFS list in scripts/anim-gifs.ts');
    const declared = [...block[1]!.matchAll(/name: '([^']+)'/g)].map((m) => m[1]!).sort();

    const onDisk = (await readdir(RENDERS))
      .filter((f) => f.endsWith('.gif'))
      .map((f) => f.replace(/\.gif$/, ''))
      .sort();
    expect(onDisk).toEqual(declared);

    const src = await readme;
    const shown = [...src.matchAll(/src="examples\/renders\/([a-z0-9-]+)\.gif"/g)]
      .map((m) => m[1]!)
      .sort();
    expect(shown).toEqual(declared);

    // A GIF only means anything if the program actually defines the clip.
    for (const name of declared) expect(names).toContain(name);
  });

  /**
   * The gallery's claim about who wrote it has to survive editing the gallery.
   *
   * The paragraph under the table says how many of the programs came from a
   * model that is not Claude, and which models those were. It is the
   * load-bearing sentence on the page: the difference between "this works" and
   * "this works in somebody else's harness, with somebody else's model, without
   * the tools changing". Two examples were once deleted during an unrelated edit
   * and the sentence went on claiming a count that had not been true for weeks.
   *
   * Every dispatched program says who wrote it on its first line, so both the
   * total and the per-model breakdown are derivable and prose has no business
   * holding a second copy of either. The per-model check allows either order and
   * a clause of prose between the count and the name, because the paragraph is
   * written to be read rather than to match a format.
   */
  it('counts the non-Claude authors correctly', async () => {
    // The header parser and the table of display names live in
    // `scripts/authorship.ts`, because the site build reads the same headers to
    // put a model on every card and two parsers would eventually disagree about
    // the same gallery. A dispatched Claude run stamps whichever alias it was
    // invoked with, so those count with the hand-briefed ones rather than
    // against them; that judgement is in the module too.
    let claude = 0;
    const byModel = new Map<string, number>();
    const unknown: string[] = [];
    for (const hero of await heroes) {
      const src = await readFile(join(EXAMPLES, `${hero}.kiln.js`), 'utf8');
      const author = readAuthorship(src);
      if (author.claude) {
        claude++;
        continue;
      }
      // A model nobody has given a display name to is one the README cannot name
      // either, so it fails here rather than being dropped from the count.
      if (!author.display) {
        unknown.push(author.model!);
        continue;
      }
      byModel.set(author.display, (byModel.get(author.display) ?? 0) + 1);
    }
    // A model nobody has named is a claim the paragraph cannot make.
    expect(unknown).toEqual([]);

    const total = (await heroes).length;
    const nonClaude = total - claude;
    const src = await readme;

    const sentence = `${nonClaude} of the ${total} programs above were not written by Claude`;
    if (!src.includes(sentence)) throw new Error(`README must say: "${sentence}"`);

    for (const [name, n] of byModel) {
      const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const near = new RegExp(`(\\b${n}\\b[^.]{0,80}${esc})|(${esc}[^.]{0,80}\\b${n}\\b)`);
      if (!near.test(src)) {
        throw new Error(`README must credit ${name} with ${n} program(s) in the gallery paragraph`);
      }
    }
  });

  it('quotes each hero triangle count correctly', async () => {
    const src = await readme;
    for (const hero of await heroes) {
      const out = outcomes.get(hero)!;
      if ('error' in out) throw new Error(`${hero} failed to execute: ${out.error}`);
      // The cell is one line: the link to the program, then the count.
      const cell = new RegExp(`examples/${hero}\\.kiln\\.js[^\\n]*?<br>([\\d,]+) tris`).exec(src);
      if (!cell) throw new Error(`no README gallery cell with a triangle count for ${hero}`);
      expect(`${hero}: ${cell[1]!}`).toBe(`${hero}: ${out.tris.toLocaleString('en-US')}`);
    }
  });
});
