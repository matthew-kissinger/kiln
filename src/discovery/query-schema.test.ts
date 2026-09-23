import { expect, test } from 'bun:test';
import { parseDiscoveryRequest } from './query-schema';

test('retired selectors identify their replacements without accepting old keys', () => {
  for (const input of [{ category: 'geometry' }, { name: 'boxGeo' }, { names: ['boxGeo'] }]) {
    expect(() => parseDiscoveryRequest(input)).toThrow(/ids/);
    expect(() => parseDiscoveryRequest(input)).toThrow(/family/);
  }
});

test('empty input requests a bounded overview and filter-only input browses summaries', () => {
  expect(parseDiscoveryRequest({})).toEqual({ mode: 'overview', offset: 0, limit: 6 });
  expect(parseDiscoveryRequest({ family: 'geometry', kind: 'operation' })).toEqual({
    mode: 'overview',
    family: 'geometry',
    kind: 'operation',
    offset: 0,
    limit: 6,
  });
});

test('search accepts everyday language and filters without requiring every word to match', () => {
  expect(
    parseDiscoveryRequest({
      query: '  put supports around a circle ',
      tags: ['structure'],
      limit: 3,
    }),
  ).toMatchObject({ query: 'put supports around a circle', mode: 'search' });
});

test('exact details use small batches of stable IDs or exact executable names', () => {
  expect(parseDiscoveryRequest({ ids: ['operation:copyGeometry', 'sweepProfile'] })).toEqual({
    mode: 'detail',
    ids: ['operation:copyGeometry', 'sweepProfile'],
  });
  expect(() => parseDiscoveryRequest({ ids: [] })).toThrow();
  expect(() => parseDiscoveryRequest({ ids: Array(7).fill('copyGeometry') })).toThrow();
  expect(() => parseDiscoveryRequest({ ids: ['copyGeometry', 'copyGeometry'] })).toThrow();
});

test('rejects mixed modes, retired selectors, false flags and invalid pagination', () => {
  for (const input of [
    { ids: ['copyGeometry'], query: 'copy' },
    { ids: ['copyGeometry'], family: 'geometry' },
    { ids: ['copyGeometry'], offset: 0 },
    { overview: true, query: 'copy' },
    { capabilities: true, query: 'copy' },
    { capabilities: true, limit: 3 },
    { capabilities: false },
    { overview: false },
    { category: 'geometry' },
    { name: 'copyGeometry' },
    { names: ['copyGeometry'] },
    { limit: 13 },
    { offset: -1 },
  ])
    expect(() => parseDiscoveryRequest(input)).toThrow();
  expect(parseDiscoveryRequest({ capabilities: true })).toEqual({ mode: 'capabilities' });
});
