import { Suspense, lazy, useEffect, useState } from 'react';

import { Gallery } from './Gallery';
import { Home } from './Home';
import { PreviewBoundary } from './Hero';
import { asset } from './repo';
import type { Specimen } from './types';

/**
 * Split, because three and drei are a megabyte and neither the front page nor
 * the gallery needs a byte of either. Both are text and webp thumbnails and
 * should paint like it; the renderer arrives when somebody asks for a mesh.
 */
const Viewer = lazy(() => import('./Viewer').then((m) => ({ default: m.Viewer })));

/** Outside the component, so the listener effect has nothing to depend on. */
const readRoute = () => {
  try {
    return decodeURIComponent(location.hash.replace(/^#\/?/, ''));
  } catch {
    return '';
  }
};

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
      .then((value) => {
        if (!Array.isArray(value)) throw new Error('Invalid collection');
        setSpecimens(value);
      })
      .catch(() => setFailed(true));
  }, []);

  // Every route here is driven by one fetch, so it is worth saying what happened
  // rather than leaving an empty page that looks like a design decision.
  if (failed) {
    return (
      <div className="loading" style={{ position: 'static', height: '100%' }}>
        The example collection could not load. Please refresh to try again.
      </div>
    );
  }
  if (!specimens)
    return (
      <div className="loading" role="status">
        Loading examples…
      </div>
    );

  const current = specimens.find((s) => s.name === route);
  if (current) {
    return (
      <Suspense fallback={<div className="loading">loading the renderer</div>}>
        <PreviewBoundary
          key={current.name}
          fallback={
            <main className="doc">
              <h1>3D preview unavailable</h1>
              <p>
                The asset could not load. You can still download it or return to the collection.
              </p>
              <p>
                <a href={asset(current.file)} download>
                  Download GLB
                </a>{' '}
                ·{' '}
                {current.source && (
                  <a href={asset(current.source)} download>
                    Download source
                  </a>
                )}{' '}
                · <a href="#/gallery">Back to collection</a>
              </p>
              <img
                className="fallback-poster"
                src={asset(current.thumb)}
                alt={current.name.replaceAll('-', ' ')}
              />
            </main>
          }
        >
          <Viewer all={specimens} current={current} />
        </PreviewBoundary>
      </Suspense>
    );
  }
  // Anything unrecognised lands on the front page rather than a 404, because the
  // only way to get here with a bad route is a stale deep link into a renamed
  // specimen, and the front page is what that reader wanted anyway.
  if (route === 'gallery') return <Gallery specimens={specimens} />;
  return <Home specimens={specimens} />;
}
