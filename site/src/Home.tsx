import { useState } from 'react';

import { REPO, asset } from './repo';
import type { Specimen } from './types';

const DOCS = `${REPO}/blob/main`;

/**
 * The seven tools the MCP server actually lists, in the order it lists them,
 * with the one-line version of what each is for. Anyone comparing this against
 * `tools/list` should find the same names in the same order.
 */
const TOOLS = [
  {
    name: 'kiln_list_primitives',
    line: 'Lists what the sandbox gives you: geometry helpers, materials, structure, animation, CSG, arrays, UV and textures, with exact signatures. A model calls this before writing anything, which is why it can work with no engine source in front of it.',
  },
  {
    name: 'kiln_validate',
    line: 'Static checks on a program before it runs. Missing meta or build(), keyframe typos, infinite loops, recursive build() calls, syntax errors. Cheap enough to run on every draft. There is no triangle budget and density is never warned about.',
  },
  {
    name: 'kiln_render',
    line: 'Runs the program, builds the GLB in memory, and returns the six-view contact sheet as an image along with triangle count, mesh and material counts, the bounding box, which part sits lowest, and any structural warnings. This is the tool that lets the model see.',
  },
  {
    name: 'kiln_screenshot_animation',
    line: 'Renders one named clip as six frames sampled across it, each labelled with its phase. Motion is the thing a still cannot show, so a rig that looks right and moves wrong is only catchable here.',
  },
  {
    name: 'kiln_view_interior',
    line: 'For anything you can walk into. Renders it with the roof lifted off as a floor plan plus two cutaways, so an interior that turned out solid is visible instead of hidden behind its own walls.',
  },
  {
    name: 'kiln_inspect',
    line: 'A close-up of one named part from any angle. The contact sheet is where you notice something is wrong, and this is where you find out what.',
  },
  {
    name: 'kiln_edit',
    line: 'Exact-string patches applied to an existing program, rendered in the same call. This is the refine verb, and the reason a second pass is a diff rather than a regeneration.',
  },
] as const;

/**
 * The exact configs from docs/install.md. They live here as data rather than as
 * prose so the tab switcher can render them uniformly, and every one of them is
 * a config somebody actually got working. The note attached to each is the part
 * that saves an hour.
 */
const HARNESSES = [
  {
    id: 'claude',
    name: 'Claude Code',
    code: `claude plugin marketplace add matthew-kissinger/kiln
claude plugin install kiln@kiln`,
    note: 'Brings the tools and all five skills in together. Check it took with /mcp.',
  },
  {
    id: 'codex',
    name: 'Codex CLI',
    code: `codex mcp add kiln --env KILN_RENDER=auto \\
  -- node /absolute/path/to/kiln/dist/mcp-server.mjs`,
    note: 'Headless runs need --approve-for-me, or every tool call gets refused before it runs.',
  },
  {
    id: 'agy',
    name: 'Antigravity',
    code: `agy plugin install .
agy mcp add --env KILN_RENDER=auto kiln \\
  node /absolute/path/to/kiln/dist/mcp-server.mjs`,
    note: 'Two commands, not one. Installing a plugin does not register the MCP servers it declares, so the agent sees no tools until you run the second. Confirm with agy mcp list.',
  },
  {
    id: 'opencode',
    name: 'OpenCode',
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
    note: 'Three things differ from every other client here and each one fails silently: the key is mcp and not mcpServers, the type is local and not stdio, and the command is a single array instead of a command plus args.',
  },
  {
    id: 'hermes',
    name: 'Hermes',
    code: `hermes mcp add kiln --command node \\
  --args /absolute/path/to/kiln/dist/mcp-server.mjs --env KILN_RENDER=auto
hermes config set skills.external_dirs /absolute/path/to/kiln/skills`,
    note: 'A Python agent with its own config format, provider routing and skill store. If it works here, none of this is Claude Code specific.',
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

  // Counted from the index rather than written into the copy. The library grows,
  // and a sentence with a number typed into it goes stale the first time it does.
  const models = new Set(specimens.map((s) => s.model)).size;
  const notClaude = specimens.filter((s) => !s.model.startsWith('Claude')).length;
  const cleanRoom = specimens.filter((s) => s.cleanRoom).length;

  // A door to the gallery, not a gallery. The heaviest ones make the point fastest.
  const strip = [...specimens].sort((a, b) => b.tris - a.tris).slice(0, 8);

  return (
    <div className="doc">
      <header className="hero">
        <h1 className="wordmark">
          Kiln <span>open source</span>
        </h1>
        <p className="lede">
          Kiln builds 3D assets with language models, without generating a mesh. The model writes a
          small JavaScript program that constructs the geometry. Kiln runs that program, exports a
          GLB, renders six views of the result, and gives the images back so the model can see what
          it actually made and fix it.
        </p>
        <p className="lede">
          It started as a commercial product. The engine is open source now because model capability
          keeps leapfrogging, and something like this is worth more as a thing you can run and
          change yourself than as a service sitting behind my login.
        </p>
        <p className="lede">
          What you keep is the program, not just the mesh. Parts have names, sizes are in real
          metres, and the next revision is a diff instead of another roll of the dice.
        </p>
        <div className="cta">
          <a className="button primary" href="#start">
            Get started
          </a>
          <a className="button" href="#/gallery">
            Gallery
          </a>
          <a className="button ghost" href={REPO}>
            GitHub
          </a>
        </div>
      </header>

      <section className="band">
        <h2 id="start">Run it without an API key</h2>
        <p>
          Everything except the model runs on your machine, including the rasterizer, so the offline
          path needs no network and no GPU. If this writes a GLB and a contact sheet then the engine
          is working, and anything that breaks after it is configuration.
        </p>
        <Code>{`git clone https://github.com/matthew-kissinger/kiln && cd kiln
bun install
bun run kiln render examples/crate.kiln.js \\
  --out crate.glb --views sheet.png`}</Code>
        <p className="aside">
          <a href="https://bun.sh">Bun</a> is the toolchain. The MCP server itself runs on Node from
          a committed bundle, so you do not need Bun on your PATH to use the plugin.
        </p>
      </section>

      <section className="band">
        <h2>The tools</h2>
        <p>
          Seven of them, and the whole surface is here. Four exist so the model can look at what it
          built, which is the part most asset pipelines leave out.
        </p>
        <dl className="tools">
          {TOOLS.map((t) => (
            <div key={t.name}>
              <dt>{t.name}</dt>
              <dd>{t.line}</dd>
            </div>
          ))}
        </dl>
        <p>
          All seven are defined once, in <a href={`${DOCS}/src/tools/registry.ts`}>one registry</a>,
          and reach you three ways. As an <b>MCP server</b> over stdio, which is what the configs
          below set up. As a <b>CLI</b>, where <code>kiln render</code> and{' '}
          <code>kiln generate</code> cover the offline path and a full authoring run. Or{' '}
          <b>in process</b>, by importing <code>kiln/tools</code> and mapping four fields per tool,
          if your harness is TypeScript and you would rather skip the transport. Nothing is
          reimplemented per transport, and a parity test fails the build if they drift.
        </p>
      </section>

      <section className="band">
        <h2>Wire it into your agent</h2>
        <p>
          One tool surface over two transports. Every harness below has been run end to end, and the
          note under each config is the part that is not obvious from anyone's documentation.
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
          Full detail, including headless permission grants and how to check that it actually
          connected, is in <a href={`${DOCS}/docs/install.md`}>the install guide</a>.
        </p>
      </section>

      <section className="band">
        <h2>What the model actually writes</h2>
        <p>
          A program says what it is, builds a tree of named parts out of primitives and CSG, and
          returns the root. Kiln injects the globals, so there is nothing to import and no build
          step. If the asset moves, an <code>animate()</code> function beside it returns named clips
          built against those same parts, so the joint that moves is the joint that was modelled.
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
          The six-view sheet goes back to the model as an image. Write it, render it, look at it,
          revise. That loop is the whole idea, and it is why the header comment on every example
          reads like a post-mortem.
        </p>
      </section>

      <section className="band">
        <h2>
          {specimens.length} assets, written by {models} models
        </h2>
        <p>
          {notClaude} of them were not written by Claude. {cleanRoom} were dispatched into a
          directory holding nothing but a brief and the Kiln skills, with no engine source and no
          finished example to copy an interface from. Nothing in the tools or the skills changed for
          any of them.
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
            Browse the gallery
          </a>
        </p>
      </section>

      <section className="band">
        <h2>Where to look in the repo</h2>
        <dl className="map">
          <dt>
            <a href={`${DOCS}/examples`}>examples/</a>
          </dt>
          <dd>
            Every program, with its render beside it and the model that wrote it in the header.
          </dd>
          <dt>
            <a href={`${DOCS}/src/tools/registry.ts`}>src/tools/registry.ts</a>
          </dt>
          <dd>
            One definition of every tool. The in-process version and the MCP server both read from
            it, so the two transports cannot drift apart. A parity test fails the build if they
            start to.
          </dd>
          <dt>
            <a href={`${DOCS}/skills`}>skills/</a>
          </dt>
          <dd>
            Five skills, written for a host agent that is doing the authoring itself rather than
            calling a black box.
          </dd>
          <dt>
            <a href={`${DOCS}/examples/strands-harness.ts`}>examples/strands-harness.ts</a>
          </dt>
          <dd>
            The whole integration in about sixty lines, with both host-injected seams visible.
          </dd>
          <dt>
            <a href={`${DOCS}/render-service`}>render-service/</a>
          </dt>
          <dd>
            The GPU renderer. Local and remote are the same HTTP service, so there is no native
            dependency and installing Kiln cannot fail on a machine without a GPU.
          </dd>
        </dl>
      </section>

      <footer className="foot">
        <span>MIT licensed. Built by Matthew Kissinger.</span>
        <a href={REPO}>Repository</a>
        <a href={`${DOCS}/docs/install.md`}>Install</a>
        <a href="#/gallery">Gallery</a>
        <a href={`${REPO}/blob/main/LICENSE`}>License</a>
      </footer>
    </div>
  );
}
