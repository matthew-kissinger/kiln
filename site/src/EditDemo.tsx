import { useState } from 'react';
import { asset } from './repo';

export function EditDemo() {
  const [revision, setRevision] = useState<'before' | 'after'>('before');

  const toggle = () => setRevision((r) => (r === 'before' ? 'after' : 'before'));

  return (
    <figure className="edit-demo">
      <button
        type="button"
        className="edit-demo-image"
        onClick={toggle}
        aria-label={`Click to toggle revision. Currently showing ${revision === 'before' ? '0.20 m' : '0.45 m'} shelf height.`}
      >
        <img
          className={`edit-demo-layer ${revision === 'before' ? 'active' : ''}`}
          src={asset('assets/workbench-before.png')}
          alt="Workbench with its lower shelf 20 centimetres above the ground"
          loading="lazy"
        />
        <img
          className={`edit-demo-layer ${revision === 'after' ? 'active' : ''}`}
          src={asset('assets/workbench-after.png')}
          alt="Workbench with its lower shelf 45 centimetres above the ground"
          loading="lazy"
        />
        <div className="edit-demo-badge">
          <span className="badge-pill">
            <span className="badge-dot" />
            {revision === 'before' ? 'Before · 0.20 m' : 'After · 0.45 m'}
          </span>
          <span className="badge-hint">Click image to toggle</span>
        </div>
      </button>

      <figcaption>
        <div className="edit-controls-wrapper">
          <fieldset className="edit-tabs" aria-label="Workbench revision switch">
            <button
              type="button"
              className={`edit-btn ${revision === 'before' ? 'is-active' : ''}`}
              aria-pressed={revision === 'before'}
              onClick={() => setRevision('before')}
            >
              <span className="btn-indicator" />
              Before · 0.20 m
            </button>
            <button
              type="button"
              className={`edit-btn ${revision === 'after' ? 'is-active' : ''}`}
              aria-pressed={revision === 'after'}
              onClick={() => setRevision('after')}
            >
              <span className="btn-indicator" />
              After · 0.45 m
            </button>
          </fieldset>

          <div className="edit-slider-control">
            <div className="slider-labels">
              <span className={revision === 'before' ? 'label-active' : ''}>0.20 m (Low)</span>
              <span className="slider-title">Shelf Height</span>
              <span className={revision === 'after' ? 'label-active' : ''}>0.45 m (Raised)</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="1"
              value={revision === 'before' ? 0 : 1}
              onChange={(e) => setRevision(e.target.value === '0' ? 'before' : 'after')}
              aria-label="Slide to compare shelf height before and after"
              className="shelf-slider"
            />
          </div>
        </div>

        <p>One exact replacement. Same camera, unchanged tabletop and legs.</p>
        <div className="demo-links">
          <a href={asset(`assets/workbench-${revision}.kiln.js`)} download>
            Source
          </a>
          <a href={asset(`assets/workbench-${revision}.glb`)} download>
            GLB
          </a>
          <a href={asset('assets/edit-demo.json')}>Edit & camera record</a>
        </div>
        <small>
          Maintainer-agent teaching example. Actual Kiln tool outputs, rendered on the CPU; geometry
          and base-colour evidence.
        </small>
      </figcaption>
    </figure>
  );
}
