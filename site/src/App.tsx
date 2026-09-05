import { Suspense, lazy, useEffect, useState } from 'react';

import { Gallery } from './Gallery';
import { Home } from './Home';
import { asset } from './repo';
import type { Specimen } from './types';

/**
 * Split, because three and drei are a megabyte and neither the front page nor
 * the gallery needs a byte of either. Both are text and webp thumbnails and
 * should paint like it; the renderer arrives when somebody asks for a mesh.
 */
const Viewer = lazy(() => import('./Viewer').then((m) => ({ default: m.Viewer })));

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

  // Every route here is driven by one fetch, so it is worth saying what happened
  // rather than leaving an empty page that looks like a design decision.
  if (failed) {
    return (
      <div className="loading" style={{ position: 'static', height: '100%' }}>
        the specimen index did not load
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
  // Anything unrecognised lands on the front page rather than a 404, because the
  // only way to get here with a bad route is a stale deep link into a renamed
  // specimen, and the front page is what that reader wanted anyway.
  if (route === 'gallery') return <Gallery specimens={specimens} />;
  return <Home specimens={specimens} />;
}
