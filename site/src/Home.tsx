import { useState } from 'react';
import { Hero } from './Hero';
import { EditDemo } from './EditDemo';
import { REPO, asset } from './repo';
import type { Specimen } from './types';

const DOCS = `${REPO}/blob/main/docs`;
const HARNESSES = [
  ['opencode', 'OpenCode'],
  ['codex', 'Codex'],
  ['agy', 'Antigravity'],
  ['hermes', 'Hermes'],
  ['claude', 'Claude Code'],
] as const;

function Code({ children }: { children: string }) {
  const [status, setStatus] = useState('Copy');
  return (
    <div className="code">
      <pre>
        <code>{children}</code>
      </pre>
      <button
        className="copy"
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(children);
            setStatus('Copied');
          } catch {
            setStatus('Select text to copy');
          }
        }}
      >
        {status}
      </button>
    </div>
  );
}

export function Home({ specimens }: { specimens: Specimen[] }) {
  const [harness, setHarness] = useState('opencode');
  const [geometryTab, setGeometryTab] = useState('surface');
  const hero = specimens.find((s) => s.name === 'orbital-station');
  const featured = [
    'abyssal-surveyor',
    'kestrel-rescue-craft',
    'solar-sail-courier',
    'orrery',
    'typewriter',
  ].flatMap((name) => specimens.find((s) => s.name === name) ?? []);
  return (
    <div className="doc">
      <nav className="site-nav" aria-label="Main navigation">
        <a className="brand" href="#/">
          Kiln<span> / open source 3D</span>
        </a>
        <div>
          <a href="#/gallery">Examples</a>
          <a href={`${DOCS}/install.md`}>Docs</a>
          <a href={REPO}>GitHub ↗</a>
        </div>
      </nav>
      <header className="hero">
        <p className="eyebrow">Code. Render. Refine.</p>
        <h1 className="hero-title">
          Build the asset.
          <br />
          <em>Keep the source.</em>
        </h1>
        <p className="lede">
          Build editable 3D assets with your coding agent. Review renders, change named parts, and
          export JavaScript and GLB.
        </p>
        <div className="cta">
          <a className="button primary" href="#start">
            Run your first render
          </a>
          <a className="button" href="#connect">
            Connect your agent
          </a>
        </div>
      </header>
      {hero && <Hero specimen={hero} />}
      <div className="capability-strip">
        <span>Local CLI + MCP</span>
        <span>Editable JavaScript</span>
        <span>Named parts & materials</span>
        <span>GLB export · MIT</span>
      </div>
      <section className="band">
        <div className="section-heading">
          <div>
            <p className="eyebrow">The example collection</p>
            <h2>Made with Kiln</h2>
          </div>
          <a href="#/gallery">Browse all {specimens.length} examples →</a>
        </div>
        <div className="featured-assets">
          {featured.map((s) => (
            <a className="featured-asset" key={s.name} href={`#/${s.name}`}>
              <img
                src={asset(s.thumb)}
                alt={s.caption || s.name.replaceAll('-', ' ')}
                loading="lazy"
              />
              <span>{s.name.replaceAll('-', ' ')}</span>
              <small>
                {s.model} · {s.harness}
              </small>
            </a>
          ))}
        </div>
        <p className="aside">
          Saved work from several models and harnesses. Open an example to inspect the geometry and
          download its source. This is a curated collection, not a model ranking.
        </p>
      </section>
      <section className="band">
        <p className="eyebrow">A shorter revision loop</p>
        <h2>
          Change the shelf.
          <br />
          Keep the rest.
        </h2>
        <p>
          Send the program once. Kiln returns a reference to that exact source revision. Your agent
          can find a dimension, edit it, and review the new render without repeating the whole
          program.
        </p>
        <EditDemo />
        <ol className="workflow">
          <li>
            <b>01 / Read</b>
            <span>
              <code>kiln_source</code> searches the saved source and returns the section you need.
            </span>
          </li>
          <li>
            <b>02 / Edit</b>
            <span>
              <code>kiln_edit</code> applies exact replacements and returns a new revision, a diff
              and rendered views.
            </span>
          </li>
          <li>
            <b>03 / Keep</b>
            <span>Export the accepted source and GLB. Earlier revisions stay available.</span>
          </li>
        </ol>
        <Code>{`kiln_source({ programRef: "sha256:…", query: "shelfHeight" })
kiln_edit({
  programRef: "sha256:…",
  edits: [{ oldString: "shelfHeight = 0.2", newString: "shelfHeight = 0.45" }]
})`}</Code>
        <p className="aside">
          API sketch: use the full reference returned by Kiln. References survive local server
          restarts. <a href={`${DOCS}/programs.md`}>How source revisions work →</a>
        </p>
      </section>
      <section className="band">
        <h2>Shape it with an equation.</h2>
        <p>
          Sample a curved surface, build your own mesh, or combine lofts and modifiers. Keep those
          functions in the source. Then frame a named part from its own axes to check an attachment.
        </p>
        <figure className="edit-demo">
          <div className="edit-demo-image">
            <img
              src={asset('assets/equation-canopy.png')}
              alt="A wave-shaped canopy beside a close-up of the socket connecting a post to its surface"
              loading="lazy"
            />
          </div>
          <figcaption>
            <p>One saved revision. The whole surface and a socket viewed from below.</p>
            <div className="demo-links">
              <a href={asset('assets/equation-canopy.kiln.js')} download>
                Source
              </a>
              <a href={asset('assets/equation-canopy.glb')} download>
                GLB
              </a>
              <a href={asset('assets/geometry-demo.json')}>Camera record</a>
            </div>
            <small>
              Maintainer teaching example. Actual CPU renders; the sampled sheet has no thickness.
            </small>
          </figcaption>
        </figure>
        <fieldset className="tabs" aria-label="Geometry example code">
          <button
            type="button"
            className="tab"
            aria-pressed={geometryTab === 'surface'}
            onClick={() => setGeometryTab('surface')}
          >
            Surface code
          </button>
          <button
            type="button"
            className="tab"
            aria-pressed={geometryTab === 'camera'}
            onClick={() => setGeometryTab('camera')}
          >
            Camera request
          </button>
        </fieldset>
        <Code>
          {geometryTab === 'surface'
            ? `const surface = parametricSurface(
  (u, v) => [u, 1.35 + 0.22 * Math.sin(u * 2) + 0.12 * v * v, v],
  { u: [-1.6, 1.6], v: [-0.8, 0.8],
    uSegments: 48, vSegments: 24, orientation: 'vu' }
);`
            : `// Reuse programRef and a partPath returned by your render.
kiln_render({ programRef, capture: {
  version: 'kiln.capture.v1', cols: 2,
  shots: [
    { name: 'Whole asset' },
    { name: 'Attachment', subject: { path: partPath },
      visibility: 'context', camera: { type: 'orbit',
        relativeTo: 'part', azimuthDeg: 65,
        elevationDeg: -18, padding: 3 } }
  ]
}});`}
        </Code>
        <p className="aside">
          <a href={`${DOCS}/geometry.md`}>Geometry contracts</a> ·{' '}
          <a href={`${DOCS}/cameras.md`}>Camera positions, parts and animation frames</a>
        </p>
      </section>
      <section className="band">
        <p className="eyebrow">Start locally</p>
        <h2 id="start">Your first render needs no model.</h2>
        <p>
          Built packages run with Node.js. Follow the{' '}
          <a href={`${DOCS}/install.md`}>macOS, Windows or Linux installation guide</a> to create
          your project-local agent setup.
        </p>
        <p>
          From a source checkout, install <a href="https://bun.sh">Bun 1.3.14</a> and render the
          small teaching example:
        </p>
        <Code>{`git clone https://github.com/matthew-kissinger/kiln
cd kiln
bun install --frozen-lockfile
bun run kiln render examples/crate.kiln.js --out crate.glb --views sheet.png`}</Code>
        <p>
          You get a GLB and a six-view image. CPU rendering works without a GPU. For texture and PBR
          material review,{' '}
          <a href={`${DOCS}/rendering.md`}>connect the optional local GPU renderer</a>.
        </p>
      </section>
      <section className="band">
        <h2 id="connect">Give your agent a workspace.</h2>
        <p>
          Create a separate project for your assets. Setup adds local configuration and the core
          authoring, refinement and QA skills. It leaves your global settings alone. The commands
          below start from a source checkout.
        </p>
        <fieldset className="tabs" aria-label="Coding agent">
          {HARNESSES.map(([id, name]) => (
            <button
              className="tab"
              key={id}
              type="button"
              aria-pressed={id === harness}
              onClick={() => setHarness(id)}
            >
              {name}
            </button>
          ))}
        </fieldset>
        <Code>{`bun run build:runtime
node scripts/create-workspace.mjs ../my-assets --harness ${harness}
cd ../my-assets
# Follow START.md for your harness`}</Code>
        <p>
          Sign in to your harness and accept its project and MCP trust prompts. Then try:{' '}
          <q>
            Read AGENTS.md. Make a wooden workbench with a lower shelf. Review it and save the
            source and GLB.
          </q>
        </p>
        <p className="aside">
          Tested on Node.js 22.23.1. Composition and batch skills are opt-in.{' '}
          <a href={`${DOCS}/clean-room.md`}>Clean-room boundaries</a> ·{' '}
          <a href={`${DOCS}/install.md`}>Package and plugin installation</a>
        </p>
      </section>
      <section className="band fit-section">
        <div>
          <p className="eyebrow">Built for iteration</p>
          <h2>
            Useful geometry.
            <br />
            Source you can understand.
          </h2>
        </div>
        <div>
          <p>
            Props, machinery, vehicles, buildings and rigid-part animation are represented in the
            examples. Named parts and adjustable dimensions make variants straightforward. Organic
            forms and detailed characters are less well demonstrated.
          </p>
          <p>
            Structural checks help find problems. Review scale, collision, performance and
            appearance in your target scene. A CPU image shows geometry and base colours; it is not
            full material evidence.
          </p>
          <a href={`${DOCS}/architecture.md`}>Explore the tools and library →</a>
        </div>
      </section>
      <footer className="foot">
        <span>Kiln · Built by Matthew Kissinger · MIT</span>
        <a href={REPO}>Repository</a>
        <a href={`${DOCS}/install.md`}>Install</a>
        <a href={`${DOCS}/history/production-architecture.md`}>Project history</a>
      </footer>
    </div>
  );
}
