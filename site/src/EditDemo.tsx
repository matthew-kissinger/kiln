import { useState } from 'react';
import { asset } from './repo';

export function EditDemo() {
  const [revision, setRevision] = useState('before');
  return (
    <figure className="edit-demo">
      <div className="edit-demo-image">
        <img
          src={asset(`assets/workbench-${revision}.png`)}
          alt={`Workbench with its lower shelf ${revision === 'before' ? '20' : '45'} centimetres above the ground`}
          loading="lazy"
        />
      </div>
      <figcaption>
        <fieldset className="tabs" aria-label="Workbench revision">
          <button
            type="button"
            className="tab"
            aria-pressed={revision === 'before'}
            onClick={() => setRevision('before')}
          >
            Before / 0.20 m
          </button>
          <button
            type="button"
            className="tab"
            aria-pressed={revision === 'after'}
            onClick={() => setRevision('after')}
          >
            After / 0.45 m
          </button>
        </fieldset>
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
