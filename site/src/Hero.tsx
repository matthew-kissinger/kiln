import { Component, Suspense, lazy, useState, type ReactNode } from 'react';
import { asset } from './repo';
import type { Specimen } from './types';

const Scene = lazy(() => import('./HeroScene'));
export class PreviewBoundary extends Component<
  { children: ReactNode; fallback: ReactNode; onFailure?: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFailure?.();
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function Hero({ specimen }: { specimen: Specimen }) {
  const [interactive, setInteractive] = useState(false);
  const [ready, setReady] = useState(false);
  const poster = (
    <img
      className="hero-poster"
      src={asset(specimen.poster ?? specimen.thumb)}
      alt={specimen.caption || specimen.name.replaceAll('-', ' ')}
      fetchPriority="high"
    />
  );
  return (
    <figure className="hero-exhibit">
      <div className="hero-canvas">
        {interactive ? (
          <PreviewBoundary
            onFailure={() => setReady(false)}
            fallback={
              <>
                {poster}
                <p className="preview-message">
                  3D preview unavailable. The source and GLB are still available below.
                </p>
              </>
            }
          >
            <Suspense fallback={poster}>
              <Scene specimen={specimen} onReady={() => setReady(true)} />
            </Suspense>
          </PreviewBoundary>
        ) : (
          poster
        )}
        {!interactive && (
          <button className="button hero-play" type="button" onClick={() => setInteractive(true)}>
            Explore in 3D <span aria-hidden="true">↗</span>
          </button>
        )}
        {ready && <span className="hero-hint">Drag to orbit · scroll to zoom</span>}
      </div>
      <figcaption>
        <div>
          <span className="eyebrow">Built with Kiln / 01</span>
          <strong>{specimen.name.replaceAll('-', ' ')}</strong>
          <span>
            {specimen.model} · {specimen.harness}
          </span>
        </div>
        <div className="hero-links">
          <a href={`#/${specimen.name}`}>Source, GLB & details ↗</a>
          {specimen.heroPoster && (
            <a href={asset(`assets/${specimen.name}.hero-poster.json`)}>Render record</a>
          )}
        </div>
      </figcaption>
    </figure>
  );
}
