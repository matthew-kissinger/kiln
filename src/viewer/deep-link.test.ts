import { expect, test } from 'bun:test';
import { assetViewerHref, assetViewerSelection } from './deep-link';

test('viewer deep links preserve one exact saved revision', () => {
  const href = assetViewerHref('http://127.0.0.1:4318/', {
    collection: 'library',
    assetId: 'a_tidal_shrine',
    revisionId: 'r_reviewed',
  });
  expect(href).toBe(
    'http://127.0.0.1:4318/?collection=library&asset=a_tidal_shrine&revision=r_reviewed',
  );
  expect(assetViewerSelection(new URL(href).search)).toEqual({
    collection: 'library',
    assetId: 'a_tidal_shrine',
    revisionId: 'r_reviewed',
  });
});

test('viewer ignores incomplete or malformed selectors', () => {
  expect(assetViewerSelection('?collection=library&asset=a_one')).toBeUndefined();
  expect(
    assetViewerSelection('?collection=library&asset=a_one&revision=not_a_revision'),
  ).toBeUndefined();
  expect(assetViewerSelection('?collection=../outside&asset=a_one&revision=r_one')).toBeUndefined();
});
