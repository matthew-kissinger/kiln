/**
 * Who wrote a given program, read off the program itself.
 *
 * Every dispatched example carries an `// Authored by: <model>, via <harness>.`
 * header, and three separate things now depend on parsing it the same way: the
 * README test that checks the authorship paragraph against reality, the site
 * build that puts a model name on every card, and anything that comes after. A
 * second copy of this parser is a second chance to miscount the gallery, which
 * has already happened twice -- once when the header turned out not to always be
 * on line one, and once when a hand-written harness spelling did not match the
 * dispatcher's. So it lives here, once.
 *
 * This is repository tooling and not part of the published engine, which is why
 * it sits under `scripts/` rather than `src/`.
 */

/**
 * Display names, because a person writing prose calls a model `Muse Spark 1.3`
 * and never `opencode-go/muse-spark-1.3-contributor`. A model that arrives
 * without a name here resolves to `null` rather than being quietly renamed to
 * something plausible, so the caller can decide whether an unnamed model is a
 * gap to fill or a test to fail.
 */
export const MODEL_DISPLAY: ReadonlyArray<readonly [RegExp, string]> = [
  // Both spellings: the dispatcher stamps the model id `gemini-3.8-flash-high`,
  // and a header written by hand says `Gemini 3.8 Flash`.
  [/^gemini[- ]3\.8/i, 'Gemini 3.8 Flash'],
  [/^gemini[- ]3\.1/i, 'Gemini 3.1 Pro'],
  [/muse-spark/, 'Muse Spark 1.3'],
  [/deepseek/, 'DeepSeek V4 Flash'],
  [/glm-5\.3-flash/, 'GLM 5.3 Flash'],
  [/omen-alpha/, 'Omen Alpha'],
  [/minimax-m3/, 'MiniMax M3'],
  [/longcat/, 'LongCat 2.0'],
  [/kimi-k3/, 'Kimi K3'],
  [/qwen/, 'Qwen 3.8 Max'],
  [/grok/, 'Grok 4.6'],
  [/gpt-6-astra/, 'GPT-6 Astra'],
];

/** A dispatched Claude run stamps whichever alias it was invoked with. */
const CLAUDE = /^(opus|sonnet|haiku|claude)/i;

/**
 * Harness names as a reader would say them. The dispatcher writes the short id
 * it was given on the command line; a hand-stamped header sometimes spells the
 * product out and puts the id in brackets after it.
 */
export const HARNESS_DISPLAY: Readonly<Record<string, string>> = {
  claude: 'Claude Code',
  agy: 'Antigravity CLI',
  opencode: 'OpenCode',
  hermes: 'Hermes',
  codex: 'Codex',
};

export interface Authorship {
  /** The raw model id from the header, or `null` when there is no header. */
  model: string | null;
  /** The model as prose names it, or `null` for a model with no display name. */
  display: string | null;
  /** True for Claude in any of its spellings, including an absent header. */
  claude: boolean;
  harness: string;
  /**
   * The program was written in a directory holding nothing but a brief and the
   * Kiln skills, with no access to this repository and no finished example to
   * copy. It is the strongest claim any of these headers makes, so it is read
   * from the sentence that makes it rather than inferred from the header's shape.
   */
  cleanRoom: boolean;
}

/**
 * `m`, and not an anchor to the first line, because the header is not always at
 * the top: ten of these programs open with a paragraph about the asset and carry
 * the attribution below it, and the arcade cabinet -- which Gemini wrote -- has
 * it on line 41. Reading only line one filed every one of those as unattributed.
 *
 * Three spellings of the harness are in circulation and all three are here: the
 * bare id the dispatcher stamps (`via codex.`), a product name with the id in
 * brackets after it (`via Antigravity CLI (agy).`), and a product name on its own
 * (`via Claude Code.`) running straight into the prose of the next sentence.
 */
const HEADER = /^\/\/ Authored by: ([^,]+), via (?:([^(.]+?)\s*\((\w+)\)|([^.]+?))\./m;

const CLEAN_ROOM = /Dispatched into a clean directory/;

export function readAuthorship(source: string): Authorship {
  const cleanRoom = CLEAN_ROOM.test(source);
  const m = HEADER.exec(source);
  // No header means the program was written against this repository rather than
  // dispatched into a clean directory, which so far has always meant Claude.
  if (!m) {
    return { model: null, display: 'Claude Opus 5', claude: true, harness: 'Claude Code', cleanRoom };
  }
  const model = m[1]!.trim();
  // The bracketed id when there is one, otherwise whatever stands after `via`.
  // Anything the table does not know is already a product name spelled the way a
  // reader would say it, so it passes through untouched.
  const id = (m[3] ?? m[4]!).trim();
  const harness = HARNESS_DISPLAY[id.toLowerCase()] ?? m[2]?.trim() ?? id;
  if (CLAUDE.test(model)) return { model, display: 'Claude Opus 5', claude: true, harness, cleanRoom };
  return {
    model,
    display: MODEL_DISPLAY.find(([re]) => re.test(model))?.[1] ?? null,
    claude: false,
    harness,
    cleanRoom,
  };
}

/**
 * The category the program declares for itself, which is not the same field as
 * the category on a render result: that one carries whatever the *request* asked
 * for, and these programs are rendered without asking for anything.
 */
export function readCategory(source: string): string {
  return /\bcategory:\s*'([a-z]+)'/.exec(source)?.[1] ?? 'prop';
}
