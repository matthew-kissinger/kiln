import { Suspense, lazy, useEffect, useState } from 'react';

import { Gallery } from './Gallery';
import type { Specimen } from './types';

/**
 * Split, because three and drei are a megabyte and the gallery does not need a
 * byte of either. The landing page is a grid of fifty webp thumbnails and should
 * paint like one; the renderer arrives when somebody actually asks for a mesh.
 */
const Viewer = lazy(() => import('./Viewer').then((m) => ({ default: m.Viewer })));

export const REPO = 'https://github.com/matthew-kissinger/kiln';

/**
 * Relative to the document, not to the origin. The build sets a relative base so
 * one artifact serves correctly both from a custom domain at the root and from a
 * project page under a path, and the fetches have to follow the same rule or the
 * second case quietly 404s every GLB.
 */
export const asset = (path: string) => new URL(path, document.baseURI).href;

/** Outside the component, so the listener effect has nothing to depend on. */
const readRoute = () => decodeURIComponent(location.hash.replace(/^#\/?/, ''));

/**
 * Hash routing, because this deploys to static hosting with no server to rewrite
 * paths, and a deep link that 404s on refresh is worse than an ugly URL.
 */
function useRoute() {
  const [route, setRoute] = useState(readRoute);
  useEffect(() => {
    const on = () => setRoute(readRoute());
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);
  return route;
}

export function App() {
  const [specimens, setSpecimens] = useState<Specimen[] | null>(null);
  const [failed, setFailed] = useState(false);
  const route = useRoute();

  useEffect(() => {
    fetch(asset('assets/index.json'))
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then(setSpecimens)
      .catch(() => setFailed(true));
  }, []);

  // The whole page is driven by one fetch, so it is worth saying what happened
  // rather than leaving an empty grid that looks like a design decision.
  if (failed) {
    return (
      <div className="loading" style={{ position: 'static', height: '100%' }}>
        the gallery index did not load
      </div>
    );
  }
  if (!specimens) return null;

  const current = specimens.find((s) => s.name === route);
  if (current) {
    return (
      <Suspense fallback={<div className="loading">loading the renderer</div>}>
        <Viewer all={specimens} current={current} />
      </Suspense>
    );
  }
  return <Gallery specimens={specimens} />;
}
