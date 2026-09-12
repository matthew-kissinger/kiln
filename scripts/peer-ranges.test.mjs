/**
 * Peer ranges the installed tree does not satisfy.
 *
 * WHY THIS EXISTS: the repository's recurring defect is a value that must agree
 * across files with nothing enforcing it, and a peer range is that shape one
 * level out -- the agreement is between manifests this repository does not own.
 * `bun install` warns and installs anyway, `typecheck` only sees what the types
 * export, and the code that actually breaks is a provider adapter. Kiln's agent
 * path is exactly that: `@strands-agents/sdk` wraps `@anthropic-ai/sdk`,
 * `@aws-sdk/client-bedrock-runtime` and a Vercel `LanguageModelV3`, so a peer
 * range it stops satisfying is a runtime failure in the loop, and the only suite
 * that drives the loop for real is `test:live` -- opt-in, billed, not in CI.
 *
 * Two live cases, both verified rather than hypothetical:
 *
 *  - One mismatch exists today and is accepted below with its reason.
 *  - The deferred `ai` 7 family would add a second. `@ai-sdk/provider@4.0.14`
 *    still exports `LanguageModelV3` alongside V4, so taking it typechecks
 *    clean; the break is a v4 model handed to a wrapper expecting v3, at
 *    runtime. This is the gate that names it at install time instead.
 */
import { test, expect, describe } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// `fileURLToPath`, not `.pathname`: on Windows the latter yields `/C:/...`, which
// `join` then treats as a root-relative path. The Windows job blocks merges.
const repo = fileURLToPath(new URL('../', import.meta.url));

/** Read an installed manifest, or undefined when the package is not in the tree. */
function installedManifest(name) {
  const path = join(repo, 'node_modules', name, 'package.json');
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : undefined;
}

/**
 * Every peer range a package declares that the version beside it does not meet.
 *
 * Only packages this repository names are walked, and only peers that are
 * actually installed are judged -- an absent optional peer is not a mismatch,
 * and a transitive dependency's peers are its own resolver's problem. A peer
 * that is installed is judged whether or not it is marked optional: optional
 * describes whether it must be present, not whether the version may be wrong.
 */
export function peerMismatches(declared, readManifest = installedManifest) {
  const mismatches = [];
  for (const name of Object.keys(declared).sort()) {
    const manifest = readManifest(name);
    for (const [peer, range] of Object.entries(manifest?.peerDependencies ?? {})) {
      const resolved = readManifest(peer);
      if (!resolved) continue;
      if (Bun.semver.satisfies(resolved.version, range)) continue;
      mismatches.push({ package: name, wants: peer, range, installed: resolved.version });
    }
  }
  return mismatches;
}

/**
 * Mismatches this repository has looked at and decided to run anyway, each with
 * the evidence that the pairing works. A new entry is a deliberate decision, not
 * a lockfile refresh: that is the whole point of listing them.
 */
const ACCEPTED = [
  {
    // Strands lags the Anthropic SDK's 0.x minors by a wide margin -- ^0.109.1
    // resolves to >=0.109.1 <0.110.0 -- and 13.2 took 0.125.0 without anything
    // noticing. Kept, because the surface Kiln depends on is `messages.stream`
    // plus system-prompt formatting, and the cache breakpoint that rides on it
    // is now asserted against the outgoing request body offline, in
    // src/agent/providers.test.ts. If that pairing ever breaks, those tests fail
    // in CI rather than the next live run failing in front of a user.
    package: '@strands-agents/sdk',
    wants: '@anthropic-ai/sdk',
  },
];

describe('peer ranges', () => {
  test('the installed tree has no unaccepted peer mismatch', () => {
    const root = JSON.parse(readFileSync(join(repo, 'package.json'), 'utf8'));
    const declared = {
      ...root.dependencies,
      ...root.devDependencies,
      ...root.peerDependencies,
    };
    const found = peerMismatches(declared);
    const unaccepted = found.filter(
      (m) => !ACCEPTED.some((a) => a.package === m.package && a.wants === m.wants),
    );
    expect(
      unaccepted.map((m) => `${m.package} wants ${m.wants}@${m.range}, installed ${m.installed}`),
    ).toEqual([]);
    // ...and an accepted entry that has stopped happening is stale bookkeeping.
    for (const accepted of ACCEPTED) {
      expect(
        found.some((m) => m.package === accepted.package && m.wants === accepted.wants),
        `${accepted.package} no longer mismatches ${accepted.wants}; drop it from ACCEPTED`,
      ).toBe(true);
    }
  });

  test('it names the Strands pin that blocks the deferred ai 7 family', () => {
    // The real published versions, so this case stops passing the day Strands
    // ships a release that accepts the v4 provider spec.
    const tree = {
      '@openrouter/ai-sdk-provider': { version: '3.0.0', peerDependencies: { ai: '^7.0.0' } },
      ai: { version: '7.0.99' },
      '@ai-sdk/provider': { version: '4.0.14' },
      '@strands-agents/sdk': {
        version: '1.17.0',
        peerDependencies: { '@ai-sdk/provider': '^3.0.0' },
      },
    };
    const found = peerMismatches(tree, (name) => tree[name]);
    expect(found).toEqual([
      {
        package: '@strands-agents/sdk',
        wants: '@ai-sdk/provider',
        range: '^3.0.0',
        installed: '4.0.14',
      },
    ]);
  });

  test('a tree that agrees reports nothing', () => {
    // A rule that always fires is as useless as one that never does. These are
    // the versions actually installed here, and the family below is the one the
    // case above rejects, one major back.
    const tree = {
      '@openrouter/ai-sdk-provider': { version: '2.10.0', peerDependencies: { ai: '^6.0.0' } },
      ai: { version: '6.0.282' },
      '@ai-sdk/provider': { version: '3.0.16' },
      '@strands-agents/sdk': {
        version: '1.17.0',
        peerDependencies: { '@ai-sdk/provider': '^3.0.0' },
      },
    };
    expect(peerMismatches(tree, (name) => tree[name])).toEqual([]);
  });

  test('an absent peer is not a mismatch, but an installed optional one is judged', () => {
    const absent = {
      host: { version: '1.0.0', peerDependencies: { plugin: '^2.0.0' } },
    };
    expect(peerMismatches(absent, (name) => absent[name])).toEqual([]);

    const present = { ...absent, plugin: { version: '3.1.0' } };
    expect(peerMismatches(present, (name) => present[name])).toHaveLength(1);
  });
});
