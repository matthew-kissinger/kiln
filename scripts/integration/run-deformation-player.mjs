/** Optional Windows/D3D11 GPU qualification in a disposable Unity project. */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: Object.fromEntries(
    ['unity', 'unity-project', 'output'].map((key) => [key, { type: 'string' }]),
  ),
});
if (process.platform !== 'win32')
  throw new Error('This qualification profile currently requires Windows and Direct3D11.');
if (!values.unity || !values['unity-project'] || !values.output)
  throw new Error(
    'Required: --unity EXECUTABLE --unity-project DISPOSABLE_PROJECT --output NEW_DIRECTORY',
  );
const output = resolve(values.output),
  project = resolve(values['unity-project']);
if (existsSync(output)) throw new Error(`Choose a new output directory: ${output}`);
if (!existsSync(join(project, 'Assets', 'KilnImportFixtures')))
  throw new Error('First import the four deformation fixtures using run-imports.mjs');
mkdirSync(output, { recursive: true });
const scripts = dirname(fileURLToPath(import.meta.url));
const hash = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
for (const [file, directory] of [
  ['KilnDeformationGpuSmoke.cs', 'Assets'],
  ['KilnDeformationGpuBuild.cs', 'Assets/Editor'],
]) {
  const source = join(scripts, file),
    target = join(project, directory, file);
  if (existsSync(target) && hash(target) !== hash(source))
    throw new Error(`Refusing to overwrite different script: ${target}`);
  if (!existsSync(target)) copyFileSync(source, target);
}
writeFileSync(
  join(output, 'inputs.json'),
  JSON.stringify(
    {
      assets: Object.fromEntries(
        ['double-sided', 'morph', 'single-sided', 'skin'].map((name) => [
          name,
          hash(join(project, 'Assets', 'KilnImportFixtures', `${name}.glb`)),
        ]),
      ),
      scripts: Object.fromEntries(
        ['KilnDeformationGpuSmoke.cs', 'KilnDeformationGpuBuild.cs'].map((file) => [
          file,
          hash(join(scripts, file)),
        ]),
      ),
      packages: hash(join(project, 'Packages', 'packages-lock.json')),
    },
    null,
    2,
  ),
);
const executable = join(output, 'build', 'KilnDeformation.exe');
function run(executable, args, log, timeout) {
  const child = spawnSync(executable, args, {
    windowsHide: true,
    encoding: 'utf8',
    timeout,
    maxBuffer: 16 * 1024 * 1024,
  });
  writeFileSync(log, `${child.stdout ?? ''}\n${child.stderr ?? ''}`);
  if (child.error || child.status !== 0)
    throw new Error(`Process failed (${child.error?.message ?? child.status}); inspect ${log}`);
}
run(
  values.unity,
  [
    '-batchmode',
    '-nographics',
    '-projectPath',
    project,
    '-executeMethod',
    'KilnDeformationGpuBuild.Run',
    '-quit',
    '-logFile',
    join(output, 'build.log'),
    '-playerOutput',
    executable,
  ],
  join(output, 'build-process.log'),
  600_000,
);
const receipts = join(output, 'receipts');
run(
  executable,
  [
    '-batchmode',
    '-force-d3d11',
    '-receiptDirectory',
    receipts,
    '-logFile',
    join(output, 'player.log'),
  ],
  join(output, 'player-process.log'),
  60_000,
);
const receipt = JSON.parse(readFileSync(join(receipts, 'player.json'), 'utf8'));
if (receipt.passed !== true || receipt.api !== 'Direct3D11')
  throw new Error('GPU deformation/culling checks failed');
console.log(`GPU deformation and culling checks passed on ${receipt.device}; ${receipts}`);
