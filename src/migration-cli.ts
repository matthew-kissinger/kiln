import { open } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { writeNewDestinationsAtomic } from './cli-output';
import {
  migrateAssetIntentV1ToRequirements,
  migrateAssetManifestV1ToRequirements,
} from './contracts/requirements-migration';

const USAGE = `kiln migrate intent|manifest <legacy.json> [--out <new-review.json>]
kiln migrate rebuild <asset-id> <revision-id> --requirements <host-binding.json>
  [--collection project] [--source <updated-source.js>] [--render auto|cpu|gpu]

Produce an explicit JSON conversion report and retain the original record.
--out creates a new file exclusively; it never overwrites an input or prior report.
The report is not a host binding or a saved revision. It cannot activate policy,
certify old artifacts, or bypass unresolved obligations. See docs/migration.md.
Exit codes: 0 help; 1 invalid input/I/O; 2 usage; 3 review required, not activated.
The separate rebuild command explicitly replaces policy and creates a new revision;
see kiln migrate rebuild --help. It never treats old QA as current acceptance.
`;

function parse(argv: readonly string[]) {
  if (argv.length === 1 && ['--help', '-h'].includes(argv[0]!)) return { help: true } as const;
  const [kind, input, ...flags] = argv;
  if (!['intent', 'manifest'].includes(kind ?? '') || !input || input.startsWith('--'))
    throw new Error(USAGE);
  let out: string | undefined;
  for (let i = 0; i < flags.length; i++) {
    const flag = flags[i];
    if (flag !== '--out' || out !== undefined)
      throw new Error(`Unknown or repeated migration option: ${flag}.\n${USAGE}`);
    out = flags[++i];
    if (!out || out.startsWith('--')) throw new Error('--out requires a new output path.');
  }
  return { help: false, kind, input, out } as const;
}

export async function migrationMain(argv: readonly string[]): Promise<number> {
  if (argv[0] === 'rebuild')
    return (await import('./migration-rebuild')).migrationRebuildMain(argv.slice(1));
  let args: ReturnType<typeof parse>;
  try {
    args = parse(argv);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 2;
  }
  if (args.help) {
    console.log(USAGE);
    return 0;
  }
  try {
    const limit = 1024 * 1024;
    const path = resolve(args.input);
    const file = await open(path, 'r');
    let bytes: Buffer;
    try {
      const info = await file.stat();
      if (!info.isFile() || info.size > limit)
        throw new Error('Migration requires a regular JSON file no larger than 1 MiB.');
      const buffer = Buffer.alloc(limit + 1);
      let total = 0;
      while (total < buffer.length) {
        const read = await file.read(buffer, total, buffer.length - total, null);
        if (read.bytesRead === 0) break;
        total += read.bytesRead;
      }
      if (total > limit) throw new Error('Migration JSON exceeds 1 MiB.');
      bytes = buffer.subarray(0, total);
    } finally {
      await file.close();
    }
    let input: unknown;
    try {
      input = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    } catch {
      throw new Error('Migration input must contain valid UTF-8 JSON.');
    }
    const conversion =
      args.kind === 'intent'
        ? migrateAssetIntentV1ToRequirements(input)
        : migrateAssetManifestV1ToRequirements(input);
    const receipt = {
      kind: 'kiln.migration-review',
      schemaVersion: 1,
      input: {
        path,
        bytes: bytes.length,
        sha256: `sha256:${createHash('sha256').update(bytes).digest('hex')}`,
      },
      conversion,
    };
    const json = `${JSON.stringify(receipt, null, 2)}\n`;
    if (args.out) await writeNewDestinationsAtomic([{ path: resolve(args.out), data: json }]);
    console.log(json.trimEnd());
    console.error(
      'Migration not activated. Review the proposed changes and every unresolved obligation in docs/migration.md.',
    );
    return conversion.status === 'invalid' ? 1 : 3;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}
