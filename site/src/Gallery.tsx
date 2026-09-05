import { useMemo, useState } from 'react';

import { REPO, asset } from './App';
import type { Specimen } from './types';

const num = (n: number) => n.toLocaleString('en-US');

const title = (name: string) =>
  name
    .split('-')
    .map((w) => w[0]!.toUpperCase() + w.slice(1))
    .join(' ');

/** Facet values in descending frequency, which is also the order worth reading. */
function tally(rows: Specimen[], key: 'category' | 'harness') {
  const counts = new Map<string, number>();
  for (const r of rows) counts.set(r[key], (counts.get(r[key]) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1]);
}

function Facet({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: [string, number][];
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <div className="facet">
      <small>{label}</small>
      <button
        type="button"
        className="chip"
        aria-pressed={value === null}
        onClick={() => onChange(null)}
      >
        all
      </button>
      {options.map(([opt, n]) => (
        <button
          key={opt}
          type="button"
          className="chip"
          aria-pressed={value === opt}
          onClick={() => onChange(value === opt ? null : opt)}
        >
          {opt} <em>{n}</em>
        </button>
      ))}
    </div>
  );
}

export function Gallery({ specimens }: { specimens: Specimen[] }) {
  const [category, setCategory] = useState<string | null>(null);
  const [harness, setHarness] = useState<string | null>(null);
  const [cleanRoom, setCleanRoom] = useState(false);
  const [heaviest, setHeaviest] = useState(false);

  const categories = useMemo(() => tally(specimens, 'category'), [specimens]);
  const harnesses = useMemo(() => tally(specimens, 'harness'), [specimens]);
  const models = useMemo(() => new Set(specimens.map((s) => s.model)).size, [specimens]);
  const triangles = useMemo(() => specimens.reduce((a, s) => a + s.tris, 0), [specimens]);
  const cleanRoomCount = useMemo(() => specimens.filter((s) => s.cleanRoom).length, [specimens]);

  const shown = useMemo(() => {
    const rows = specimens.filter(
      (s) =>
        (category === null || s.category === category) &&
        (harness === null || s.harness === harness) &&
        (!cleanRoom || s.cleanRoom),
    );
    return heaviest ? [...rows].sort((a, b) => b.tris - a.tris) : rows;
  }, [specimens, category, harness, cleanRoom, heaviest]);

  return (
    <>
      <header className="masthead">
        <h1 className="wordmark">
          Kiln <span>specimen gallery</span>
        </h1>
        <p>
          Every object here is a JavaScript program that a language model wrote, and the mesh you
          orbit is built from that program in your browser rather than exported from it. Nothing was
          sculpted by hand and nothing came out of an asset library. The engine, the tools the
          models used and all fifty programs are <a href={REPO}>on GitHub</a>.
        </p>
        <div className="tally">
          <div>
            <b>{specimens.length}</b>
            <small>specimens</small>
          </div>
          <div>
            <b>{num(triangles)}</b>
            <small>triangles</small>
          </div>
          <div>
            <b>{models}</b>
            <small>models</small>
          </div>
          <div>
            <b>{harnesses.length}</b>
            <small>harnesses</small>
          </div>
        </div>
      </header>

      <nav className="filters" aria-label="Filter the gallery">
        <Facet label="Category" options={categories} value={category} onChange={setCategory} />
        <Facet label="Written in" options={harnesses} value={harness} onChange={setHarness} />
        <div className="facet">
          {/* The strongest claim any of these programs makes, so it gets its own
              control: the model had a brief and the Kiln skills, and nothing
              else -- no repository to read, no finished example to copy. */}
          <button
            type="button"
            className="chip"
            aria-pressed={cleanRoom}
            onClick={() => setCleanRoom(!cleanRoom)}
            title="Written in a directory holding only a brief and the Kiln skills"
          >
            clean room <em>{cleanRoomCount}</em>
          </button>
          <button
            type="button"
            className="chip"
            aria-pressed={heaviest}
            onClick={() => setHeaviest(!heaviest)}
          >
            heaviest first
          </button>
        </div>
        <span className="count">
          {shown.length === specimens.length
            ? `${specimens.length} shown`
            : `${shown.length} of ${specimens.length}`}
        </span>
      </nav>

      <div className="grid">
        {shown.map((s) => (
          <a className="card" key={s.name} href={`#/${s.name}`}>
            <div className="shot">
              <img src={asset(s.thumb)} alt={s.caption || title(s.name)} loading="lazy" />
              <b>{num(s.tris)}</b>
            </div>
            <div className="meta">
              <h3>{title(s.name)}</h3>
              <p>{s.caption}</p>
              <div className="by">
                <i>{s.model}</i> · {s.harness}
              </div>
            </div>
          </a>
        ))}
      </div>

      <footer className="foot">
        <span>
          Built by running <code>examples/*.kiln.js</code> through the engine at deploy time, so a
          program and the model on this page cannot disagree.
        </span>
        <a href={REPO}>Repository</a>
        <a href={`${REPO}/tree/main/examples`}>The programs</a>
        <a href={`${REPO}/blob/main/docs/install.md`}>Install the plugin</a>
        <a href={`${REPO}/blob/main/LICENSE`}>MIT</a>
      </footer>
    </>
  );
}
