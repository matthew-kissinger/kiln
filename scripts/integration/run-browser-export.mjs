/** Optional GPU gate: requires Bun and Playwright, plus hardware-accelerated Chrome/Chromium. */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import validator from 'gltf-validator';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const option = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const output = await mkdtemp(path.join(os.tmpdir(), 'kiln-browser-export-'));
const entry = path.join(root, 'scripts/integration/browser-export-fixtures.mjs');
const bundle = path.join(output, 'browser.js');
const built = spawnSync(
  option('--bun', 'bun'),
  ['build', entry, '--target=browser', `--outfile=${bundle}`],
  { cwd: root, encoding: 'utf8', windowsHide: true },
);
if (built.status !== 0) throw new Error(`Browser bundle failed: ${built.error ?? built.stderr}`);
const require = createRequire(import.meta.url);
const { chromium } = require(option('--playwright', 'playwright'));
const script = await readFile(bundle);
const server = createServer((request, response) => {
  response.setHeader(
    'Content-Type',
    request.url === '/browser.js' ? 'text/javascript' : 'text/html',
  );
  response.end(
    request.url === '/browser.js'
      ? script
      : '<html><body><script type="module" src="/browser.js"></script></body></html>',
  );
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  const selected = option('--browser', 'chrome');
  browser = await chromium.launch({
    ...(path.isAbsolute(selected) ? { executablePath: selected } : { channel: selected }),
    headless: true,
    args: ['--enable-gpu', ...(process.platform === 'win32' ? ['--use-angle=d3d11'] : [])],
  });
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => window.audit);
  const receipt = await page.evaluate(() => window.audit);
  receipt.browser = browser.version();
  receipt.bundleSha256 = createHash('sha256').update(script).digest('hex');
  receipt.directory = output;
  for (const row of receipt.results) {
    if (!row.bytes) continue;
    const bytes = Buffer.from(row.bytes);
    await writeFile(path.join(output, `${row.case}.glb`), bytes);
    const validation = await validator.validateBytes(bytes);
    row.validationErrors = validation.issues.numErrors;
    row.validationWarnings = validation.issues.numWarnings;
    if (validation.issues.numErrors) row.passed = false;
    row.sha256 = createHash('sha256').update(bytes).digest('hex');
    row.bytes = bytes.length;
  }
  receipt.passed = receipt.results.every((row) => row.passed);
  await page.screenshot({ path: path.join(output, 'gpu.png') });
  await writeFile(path.join(output, 'receipt.json'), `${JSON.stringify(receipt, null, 2)}\n`);
  console.log(
    JSON.stringify(
      {
        directory: output,
        gpu: receipt.gpu,
        browser: receipt.browser,
        passed: receipt.passed,
        results: receipt.results.map(
          ({ case: name, passed, supported, expectedRejection, error, validationErrors }) => ({
            name,
            passed,
            supported,
            expectedRejection,
            error,
            validationErrors,
          }),
        ),
      },
      null,
      2,
    ),
  );
  if (!receipt.passed) process.exitCode = 1;
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
