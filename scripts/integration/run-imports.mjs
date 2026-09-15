import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  readFileSync,
  mkdirSync,
  writeFileSync,
  existsSync,
  readdirSync,
  copyFileSync,
} from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { checkReceipt } from './check-receipt.mjs';

const { values } = parseArgs({
  options: Object.fromEntries(
    ['input', 'output', 'manifest', 'blender', 'unity', 'unity-project'].map((key) => [
      key,
      { type: 'string' },
    ]),
  ),
});
if (!values.input || !values.output || !values.manifest || (!values.blender && !values.unity))
  throw new Error(
    'Required: --input GLB_DIRECTORY --output RECEIPT_DIRECTORY --manifest EXPECTATIONS.json and --blender EXECUTABLE and/or --unity EXECUTABLE --unity-project DISPOSABLE_PROJECT',
  );
const input = resolve(values.input),
  output = resolve(values.output);
if (!readdirSync(input).some((file) => file.endsWith('.glb')))
  throw new Error('Input contains no GLB files');
mkdirSync(output, { recursive: true });
const scripts = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(readFileSync(resolve(values.manifest), 'utf8'));
const hash = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
writeFileSync(
  join(output, 'inputs.json'),
  JSON.stringify(
    {
      manifestSha256: hash(resolve(values.manifest)),
      files: Object.fromEntries(
        readdirSync(input)
          .filter((file) => file.endsWith('.glb'))
          .sort()
          .map((file) => [file, hash(join(input, file))]),
      ),
    },
    null,
    2,
  ),
);
const failures = [];
for (const engine of ['blender', 'unity']) {
  if (!values[engine]) continue;
  const receipt = join(output, `${engine}.json`);
  if (existsSync(receipt))
    throw new Error(`Refusing stale receipt path: ${receipt}; choose a new output directory`);
  let args;
  if (engine === 'blender')
    args = [
      '--background',
      '--factory-startup',
      '--python',
      join(scripts, 'import-blender.py'),
      '--',
      input,
      receipt,
    ];
  else {
    if (!values['unity-project'])
      throw new Error(
        '--unity-project is required; use a disposable project with glTFast installed',
      );
    const project = resolve(values['unity-project']);
    const editor = join(project, 'Assets', 'Editor');
    mkdirSync(editor, { recursive: true });
    const target = join(editor, 'KilnImportAudit.cs');
    if (existsSync(target)) throw new Error(`Refusing to overwrite ${target}`);
    copyFileSync(join(scripts, 'KilnImportAudit.cs'), target);
    args = [
      '-batchmode',
      '-nographics',
      '-projectPath',
      project,
      '-executeMethod',
      'KilnImportAudit.Run',
      '-quit',
      '-logFile',
      join(output, 'unity.log'),
      '-kilnInput',
      input,
      '-kilnReceipt',
      receipt,
    ];
  }
  const process = spawnSync(values[engine], args, {
    encoding: 'utf8',
    timeout: 600_000,
    maxBuffer: 16 * 1024 * 1024,
  });
  writeFileSync(
    join(output, `${engine}-process.log`),
    `${process.stdout ?? ''}\n${process.stderr ?? ''}`,
  );
  if (process.error || process.status !== 0 || !existsSync(receipt)) {
    failures.push(`${engine}: process/import failed: ${process.error?.message ?? process.status}`);
    continue;
  }
  if (!manifest[engine]) {
    failures.push(`${engine}: missing engine-specific expectations`);
    continue;
  }
  failures.push(
    ...checkReceipt(JSON.parse(readFileSync(receipt, 'utf8')), manifest[engine]).map(
      (failure) => `${engine}: ${failure}`,
    ),
  );
}
writeFileSync(
  join(output, 'checks.json'),
  JSON.stringify({ passed: failures.length === 0, failures }, null, 2),
);
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else console.log(`Structural import assertions passed; receipts: ${output}`);
