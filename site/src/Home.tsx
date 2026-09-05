import { useState } from 'react';

import { REPO, asset } from './repo';
import type { Specimen } from './types';

const DOCS = `${REPO}/blob/main`;

/**
 * The exact configs from docs/install.md. They live here as data rather than as
 * prose so the tab switcher can render them uniformly, and every one of them is
 * a config somebody actually got working -- the notes attached to each are the
 * part that saves an hour.
 */
const HARNESSES = [
  {
    id: 'claude',
    name: 'Claude Code',
    lang: 'bash',
    code: `claude plugin marketplace add matthew-kissinger/kiln
claude plugin install kiln@kiln`,
    note: 'Brings the tools and all five skills in together. Check it took with /mcp.',
  },
  {
    id: 'codex',
    name: 'Codex CLI',
    lang: 'bash',
    code: `codex mcp add kiln --env KILN_RENDER=auto \\
  -- node /absolute/path/to/kiln/dist/mcp-server.mjs`,
    note: 'Headless runs need --approve-for-me, or every tool call is refused before it runs.',
  },
  {
    id: 'agy',
    name: 'Antigravity',
    lang: 'bash',
    code: `agy plugin install .
agy mcp add --env KILN_RENDER=auto kiln \\
  node /absolute/path/to/kiln/dist/mcp-server.mjs`,
    note: 'Two commands, not one: installing a plugin does not register the MCP servers it declares, so the agent sees no tools until the second. Confirm with agy mcp list.',
  },
  {
    id: 'opencode',
    name: 'OpenCode',
    lang: 'json',
    code: `{
  "mcp": {
    "kiln": {
      "type": "local",
      "command": ["node", "/absolute/path/to/kiln/dist/mcp-server.mjs"],
      "enabled": true,
      "environment": { "KILN_RENDER": "auto" }
    }
  }
}`,
    note: 'Three things differ from every other client here and each fails silently: the key is mcp not mcpServers, the type is local not stdio, and the command is one array rather than command plus args.',
  },
  {
    id: 'hermes',
    name: 'Hermes',
    lang: 'bash',
    code: `hermes mcp add kiln --command node \\
  --args /absolute/path/to/kiln/dist/mcp-server.mjs --env KILN_RENDER=auto
hermes config set skills.external_dirs /absolute/path/to/kiln/skills`,
    note: 'A Python agent with its own config, routing and skill store — the honest test of whether any of this is Claude-Code-shaped.',
  },
] as const;

function Code({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="code">
      <pre>
        <code>{children}</code>
      </pre>
      <button
        type="button"
        className="copy"
        onClick={() => {
          navigator.clipboard?.writeText(children).then(
            () => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1400);
            },
            () => {},
          );
        }}
      >
        {copied ? 'copied' : 'copy'}
      </button>
    </div>
  );
}

export function Home({ specimens }: { specimens: Specimen[] }) {
  const [harness, setHarness] = useState<string>(HARNESSES[0].id);
  const active = HARNESSES.find((h) => h.id === harness) ?? HARNESSES[0];

  // A handful of the heaviest, which are also the ones that make the point
  // fastest. Not a gallery -- a door to one.
  const strip = [...specimens].sort((a, b) => b.tris - a.tris).slice(0, 8);

  return (
    <div className="doc">
      <header className="hero">
        <h1 className="wordmark">
          Kiln <span>3D assets as programs</span>
        </h1>
        <p className="lede">
          A language model writes a small JavaScript program that constructs the geometry. Kiln runs
          it, exports a glTF binary, rasterizes six orthographic views, and hands the images back so
          the model can fix what it sees. Nothing is sampled and nothing is hand-authored.
        </p>
        <p className="lede">
          What you keep is the GLB <em>and</em> the program that made it — named parts, real metres,
          a diff you can read, and a file the next agent can edit instead of regenerating from
          scratch.
        </p>
        <div className="cta">
          <a className="button primary" href="#start">
            Get started
          </a>
          <a className="button" href="#/gallery">
            See the fifty
          </a>
          <a className="button ghost" href={REPO}>
            GitHub
          </a>
        </div>
      </header>

      <section className="band">
        <h2 id="start">Try it without a key</h2>
        <p>
          The whole offline path — geometry build, QA gates, rasterizer — runs with no model, no
          network, no GPU and no API key. If this produces a GLB and a contact sheet, the engine is
          fine and anything that goes wrong later is transport configuration.
        </p>
        <Code>{`git clone https://github.com/matthew-kissinger/kiln && cd kiln
bun install
bun run kiln render examples/crate.kiln.js \\
  --out crate.glb --views sheet.png`}</Code>
        <p className="aside">
          <a href="https://bun.sh">Bun</a> is the toolchain. The MCP server itself runs on Node,
          from a committed bundle, so nobody has to have Bun on their PATH to use the plugin.
        </p>
      </section>

      <section className="band">
        <h2>Wire it into your agent</h2>
        <p>
          One tool surface over two transports. Every harness below has been run end to end, and the
          notes are the parts that are not obvious from anyone's documentation.
        </p>
        <div className="tabs" role="tablist">
          {HARNESSES.map((h) => (
            <button
              key={h.id}
              type="button"
              role="tab"
              className="tab"
              aria-selected={h.id === harness}
              onClick={() => setHarness(h.id)}
            >
              {h.name}
            </button>
          ))}
        </div>
        <Code>{active.code}</Code>
        <p className="note">{active.note}</p>
        <p className="aside">
          Full detail, including headless permission grants and how to check it actually connected,
          is in <a href={`${DOCS}/docs/install.md`}>the install guide</a>.
        </p>
      </section>

      <section className="band">
        <h2>What the model is actually writing</h2>
        <p>
          A program declares what it is, builds a tree of named parts from primitives and CSG, and
          returns the root. Kiln injects the globals, so there is nothing to import and no build
          step. An <code>animate()</code> beside it returns named clips built against the same
          parts, so a joint that moves is the joint that was modelled.
        </p>
        <Code>{`const meta = { name: 'Crate', category: 'prop' };

function build() {
  const root = createRoot('Crate');
  const wood = gameMaterial(0x8a5a2b, { roughness: 0.8 });
  createPart('Body', boxGeo(1, 1, 1), wood, {
    position: [0, 0.5, 0],
    parent: root,
  });
  return root;
}`}</Code>
        <p>
          The six-view sheet goes back to the model as an image. That loop — write, render, look,
          revise — is the whole idea, and it is why every file's header comment reads like a
          post-mortem.
        </p>
      </section>

      <section className="band">
        <h2>Fifty of them, written by nine models</h2>
        <p>
          Thirty-five were not written by Claude, and thirty-three were dispatched into a directory
          holding only a brief and the Kiln skills — no engine source, no finished example to copy
          an interface from. Nothing in the tools or the skills changed for any of them.
        </p>
        <div className="strip">
          {strip.map((s) => (
            <a key={s.name} className="chip-card" href={`#/${s.name}`}>
              <img src={asset(s.thumb)} alt={s.caption || s.name} loading="lazy" />
              <span>{s.name.replace(/-/g, ' ')}</span>
            </a>
          ))}
        </div>
        <p>
          <a className="button" href="#/gallery">
            Browse all fifty
          </a>
        </p>
      </section>

      <section className="band">
        <h2>Where to look in the repo</h2>
        <dl className="map">
          <dt>
            <a href={`${DOCS}/examples`}>examples/</a>
          </dt>
          <dd>Every program, with the render beside it and its authorship in the header.</dd>
          <dt>
            <a href={`${DOCS}/src/tools/registry.ts`}>src/tools/registry.ts</a>
          </dt>
          <dd>
            One definition of every tool. The in-process skin and the MCP server both iterate it, so
            the two transports cannot drift; a parity test fails the build if they start to.
          </dd>
          <dt>
            <a href={`${DOCS}/skills`}>skills/</a>
          </dt>
          <dd>
            Five skills, written for a host agent that is doing the authoring rather than calling a
            black box.
          </dd>
          <dt>
            <a href={`${DOCS}/examples/strands-harness.ts`}>examples/strands-harness.ts</a>
          </dt>
          <dd>
            The whole integration in about sixty lines, with both host-injected seams legible.
          </dd>
          <dt>
            <a href={`${DOCS}/render-service`}>render-service/</a>
          </dt>
          <dd>
            The GPU renderer. Local and remote are the same HTTP service, so there is no native
            dependency and installation cannot fail on a machine without a GPU.
          </dd>
        </dl>
      </section>

      <footer className="foot">
        <span>MIT. Built by Matthew Kissinger.</span>
        <a href={REPO}>Repository</a>
        <a href={`${DOCS}/docs/install.md`}>Install</a>
        <a href="#/gallery">Gallery</a>
        <a href={`${REPO}/blob/main/LICENSE`}>License</a>
      </footer>
    </div>
  );
}
