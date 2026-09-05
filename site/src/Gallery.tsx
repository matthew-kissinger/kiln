import { useMemo, useState } from 'react';

import { REPO, asset } from './repo';
import type { Specimen } from './types';

const CURATED = [
  'orbital-station',
  'abyssal-surveyor',
  'kestrel-rescue-craft',
  'solar-sail-courier',
  'mechanical-peacock',
  'orrery',
  'typewriter',
];
const rank = (name: string) => (CURATED.includes(name) ? CURATED.indexOf(name) : CURATED.length);

const title = (name: string) =>
  name
    .split('-')
    .map((w) => w[0]!.toUpperCase() + w.slice(1))
    .join(' ');

/** Facet values in descending frequency, which is also the order worth reading. */
function tally(rows: Specimen[], key: 'category' | 'harness' | 'model') {
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
    <label className="facet">
      <small>{label}</small>
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value || null)}>
        <option value="">All</option>
        {options.map(([opt, n]) => (
          <option key={opt} value={opt}>
            {opt} ({n})
          </option>
        ))}
      </select>
    </label>
  );
}

export function Gallery({ specimens }: { specimens: Specimen[] }) {
  const [category, setCategory] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [harness, setHarness] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('curated');
  const [motion, setMotion] = useState('all');

  const models = useMemo(() => tally(specimens, 'model'), [specimens]);
  const harnesses = useMemo(() => tally(specimens, 'harness'), [specimens]);
  const categories = useMemo(() => tally(specimens, 'category'), [specimens]);

  const shown = useMemo(() => {
    const rows = specimens.filter(
      (s) =>
        (category === null || s.category === category) &&
        (model === null || s.model === model) &&
        (harness === null || s.harness === harness) &&
        (motion === 'all' ||
          (motion === 'animated' ? (s.animations ?? 0) > 0 : s.animations === 0)) &&
        `${s.name} ${s.caption}`.toLowerCase().includes(query.toLowerCase().trim()),
    );
    return [...rows].sort(
      (a, b) =>
        (sort === 'curated'
          ? rank(a.name) - rank(b.name)
          : sort === 'recent'
            ? (b.authoredDate ?? '').localeCompare(a.authoredDate ?? '')
            : 0) || a.name.localeCompare(b.name),
    );
  }, [specimens, category, model, harness, query, sort, motion]);

  return (
    <>
      <header className="masthead">
        <a className="back" href="#/">
          Kiln
        </a>
        <h1 className="wordmark">
          The <span>collection</span>
        </h1>
        <p>
          Props, machines, buildings and experiments made with Kiln. Rotate each asset, inspect its
          geometry, or download the GLB and editable source.
        </p>
      </header>

      <nav className="filters" aria-label="Filter examples">
        <label className="gallery-search">
          Search
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Station, copper, machinery…"
          />
        </label>
        <Facet label="Model" options={models} value={model} onChange={setModel} />
        <Facet label="Harness" options={harnesses} value={harness} onChange={setHarness} />
        <Facet label="Category" options={categories} value={category} onChange={setCategory} />
        <label className="facet">
          <small>Motion</small>
          <select value={motion} onChange={(e) => setMotion(e.target.value)}>
            <option value="all">All assets</option>
            <option value="animated">Animated</option>
            <option value="static">Static</option>
          </select>
        </label>
        <label className="facet">
          <small>Order</small>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="curated">Curated</option>
            <option value="recent">Recorded date, newest first</option>
            <option value="name">Name</option>
          </select>
        </label>
        <span className="count" role="status">
          {shown.length === specimens.length
            ? `${specimens.length} shown`
            : `${shown.length} of ${specimens.length}`}
        </span>
      </nav>

      <div className="grid">
        {shown.length === 0 && (
          <p className="empty-state">
            No examples match. Clear a filter or try a different search.
          </p>
        )}
        {shown.map((s) => (
          <a className="card" key={s.name} href={`#/${s.name}`}>
            <div className="shot">
              <img src={asset(s.thumb)} alt={s.caption || title(s.name)} loading="lazy" />
            </div>
            <div className="meta">
              <h3>{title(s.name)}</h3>
              <p>{s.caption}</p>
              {/* The model stays on the card. It is an attribution, not a
                  statistic: somebody else wrote this and the page should say so
                  without being asked. */}
              <div className="by">
                <i>{s.model}</i>
                <span>{s.harness}</span>
              </div>
            </div>
          </a>
        ))}
      </div>

      <footer className="foot">
        <span>
          The viewer loads a prebuilt GLB. Source downloads and artifact hashes are recorded
          together during the site asset build. Image provenance and limits are recorded in each
          asset's details.
        </span>
        <a href="#/">Home</a>
        <a href={REPO}>Repository</a>
        <a href={`${REPO}/tree/main/examples`}>The programs</a>
        <a href={`${REPO}/blob/main/docs/install.md`}>Install the plugin</a>
        <a href={`${REPO}/blob/main/LICENSE`}>MIT</a>
      </footer>
    </>
  );
}
