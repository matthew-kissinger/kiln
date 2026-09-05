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
import { createHash } from 'node:crypto';
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

const loftAdvisory =
  'LOFT_SELF_INTERSECTION_UNCHECKED Corresponding profiles are connected directly. Caps and closed boundaries do not prove the loft is free of self-intersections.';
const sweepAdvisory =
  'SWEEP_SELF_INTERSECTION_UNCHECKED Transported frames and caps do not prove a sweep is free of self-intersections. Review tight turns and nearby path segments.';
// Exact reviewed advisory lists. New meshes, warnings or changed warning text still fail.
const documentedAdvisories: Record<string, string[]> = {
  'bench-refractor': [
    ...['BasePlate', 'Pier', 'Barrel'].map((name) => `Mesh_${name}: ${loftAdvisory}`),
    ...Array.from({ length: 4 }, (_, i) => `Mesh_Rib${i}: ${sweepAdvisory}`),
    `Mesh_BellShroud: ${loftAdvisory}`,
  ],
  'twisting-canopy': [
    ...Array.from({ length: 12 }, (_, i) => `Mesh_StructuralRib_${i + 1}: ${sweepAdvisory}`),
    `Mesh_CentralSpine: ${sweepAdvisory}`,
  ],
};

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
      // Subdivision legitimately replaces primitive face provenance. Keep that
      // exact advisory visible; unexpected attribute loss or defects still fail.
      const expected =
        name === 'lighthouse'
          ? Array.from(
              { length: 8 },
              (_, i) =>
                `Mesh_Rock${i + 1}: SUBDIVIDE_PROVENANCE_DROPPED Subdivision changed triangle topology. Source face/range provenance was discarded rather than guessed.`,
            )
          : (documentedAdvisories[name] ?? []);
      expect(out.warnings).toEqual(expected);
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

  const readme = readFile(join(REPO, 'docs/examples.md'), 'utf8').then((text) =>
    text.replaceAll('../examples/', 'examples/'),
  );

  it('names only examples that exist', async () => {
    for (const hero of await heroes) expect(names).toContain(hero);
  });

  it('has a render for every public hero and only the explicitly retained archive', async () => {
    const publicHeroes = await heroes;
    expect(publicHeroes).not.toContain('tidal-observatory');
    const expected = [...publicHeroes, 'tidal-observatory'].map((h) => `${h}.png`).sort();
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

  it('credits each example from its source header or exact-source run record', async () => {
    const table = await readme;
    for (const hero of await heroes) {
      const source = await readFile(join(EXAMPLES, `${hero}.kiln.js`), 'utf8');
      let display = readAuthorship(source).display;
      try {
        const record = JSON.parse(
          await readFile(join(EXAMPLES, `${hero}.provenance.json`), 'utf8'),
        );
        expect(record.sourceHash).toBe(createHash('sha256').update(source).digest('hex'));
        expect(typeof record.model).toBe('string');
        display = record.model;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      }
      expect(display).not.toBeNull();
      const cell = table
        .split('\n')
        .find((line) => line.includes(`href="examples/${hero}.kiln.js"`));
      expect(cell).toBeDefined();
      expect(cell).toContain(display!);
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
