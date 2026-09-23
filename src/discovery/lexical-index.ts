import MiniSearch from 'minisearch';
import type { DiscoveryEntry } from './catalog-schema';
import { discoveryTokens } from './intents';
import type { DiscoveryIndex } from './service';

export const DISCOVERY_INDEX_VERSION = 'kiln.lexical.v2/minisearch-7.2.0';

/** A catalog snapshot indexed once in this process. No serialized or remote state. */
export function createLexicalDiscoveryIndex(entries: readonly DiscoveryEntry[]): DiscoveryIndex {
  const index = new MiniSearch({
    fields: ['name', 'aliases', 'intents', 'summary', 'family', 'tags'],
    tokenize: discoveryTokens,
    processTerm: (term) => term,
    searchOptions: {
      boost: { name: 4, aliases: 4, intents: 3, summary: 1, family: 0.5, tags: 1 },
      combineWith: 'OR',
      // Short words/axes and huge tokens must not explode into fuzzy suggestions.
      prefix: (term) => term.length >= 4 && term.length <= 24,
      fuzzy: (term) => (term.length >= 4 && term.length <= 32 ? 1 : false),
      weights: { fuzzy: 0.3, prefix: 0.5 },
    },
  });
  index.addAll(
    entries.map((entry) => ({
      id: entry.id,
      name: entry.name,
      aliases: entry.aliases.join(' '),
      intents: entry.intents.join(' '),
      summary: entry.summary,
      family: entry.family,
      tags: entry.tags.join(' '),
    })),
  );
  return {
    async search(query) {
      // The public request schema also enforces 500 chars. Keep this boundary
      // explicit for internal callers and expand each distinct query term once.
      if (query.length > 500) throw new Error('Discovery query exceeds 500 characters.');
      const tokens = [...new Set(discoveryTokens(query))];
      if (!tokens.length) return [];
      const exact = index.search(tokens.join(' '), { prefix: false, fuzzy: false });
      const matched = new Set(exact.flatMap((hit) => hit.queryTerms));
      const missing = new Set(tokens.filter((term) => !matched.has(term)));
      // Recover missing vocabulary only. An exact token elsewhere in the catalog
      // must not expand to dozens of incidental near-spellings just to fill a page.
      const hits = missing.size
        ? index.search(tokens.join(' '), {
            prefix: (term) => missing.has(term) && term.length >= 4 && term.length <= 24,
            fuzzy: (term) =>
              missing.has(term) && term.length >= 4 && term.length <= 32 ? 1 : false,
          })
        : exact;
      return hits
        .filter((hit) => hit.score > 0)
        .map((hit) => {
          const fields = [...new Set(Object.values(hit.match).flat())].sort();
          const contextOnly = fields.every((field) => field === 'summary' || field === 'family');
          return {
            id: String(hit.id),
            score: hit.score * (contextOnly ? 0.1 : 1),
            evidence: {
              matchedTerms: tokens.filter((term) => hit.queryTerms.includes(term)),
              unmatchedTerms: tokens.filter((term) => !hit.queryTerms.includes(term)),
              fields,
              expandedTerms: hit.terms.filter((term) => !tokens.includes(term)).sort(),
              contextOnly,
            },
          };
        });
    },
  };
}
