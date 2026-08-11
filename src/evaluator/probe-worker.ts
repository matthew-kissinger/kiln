import { readFile, writeFile } from 'node:fs/promises';
import { connect } from 'node:net';
import { networkInterfaces } from 'node:os';
import { validate } from '../validation';
import { writeFileSync } from 'node:fs';

const VERSION = 'kiln.evaluator.isolation-readiness.v1';
const NAMESPACE_CHECKS = new Set([
  'user-namespace',
  'no-new-privileges',
  'capabilities-empty',
  'network-namespace-empty',
  'metadata-and-local-network-denied',
]);

async function deniedRead(path: string): Promise<boolean> {
  try {
    await readFile(path);
    return false;
  } catch {
    return true;
  }
}

async function deniedWrite(path: string): Promise<boolean> {
  try {
    await writeFile(path, 'denied');
    return false;
  } catch {
    return true;
  }
}

async function deniedConnect(host: string, port: number): Promise<boolean> {
  return await new Promise<boolean>((resolve) => {
    const socket = connect({ host, port });
    const timer = setTimeout(() => {
      socket.destroy();
      resolve(true);
    }, 250);
    socket.once('connect', () => {
      clearTimeout(timer);
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      clearTimeout(timer);
      resolve(true);
    });
  });
}

function generatedDenials(): boolean {
  const prelude = "const meta = { name: 'probe' }; function build(){ return createRoot('probe'); }";
  const probes = [
    `const leak = process.env; ${prelude}`,
    `const leak = fetch('http://169.254.169.254/'); ${prelude}`,
    `const leak = globalThis.process.mainModule.require('fs'); ${prelude}`,
    `const leak = globalThis.process.mainModule.require('child_process'); ${prelude}`,
  ];
  return probes.every((source) => !validate(source).valid);
}

async function main(): Promise<void> {
  const status = await readFile('/proc/self/status', 'utf8');
  const uidMap = await readFile('/proc/self/uid_map', 'utf8');
  const envKeys = Object.keys(process.env).sort();
  const outsideUid = Number(uidMap.trim().split(/\s+/)[1]);
  const interfaces = Object.values(networkInterfaces()).flat().filter(Boolean);
  const checks: Array<[string, boolean]> = [
    ['user-namespace', Number.isInteger(outsideUid) && outsideUid > 0],
    ['no-new-privileges', /^NoNewPrivs:\s+1$/m.test(status)],
    ['capabilities-empty', /^CapEff:\s+0+$/m.test(status)],
    ['environment-exact', envKeys.join(',') === 'NODE_ENV,NO_COLOR'],
    ['product-filesystem-denied', await deniedRead('/app/agent-runtime/src/server.ts')],
    ['host-filesystem-denied', await deniedRead('/etc/passwd')],
    ['runtime-filesystem-read-only', await deniedWrite('/app/node_modules/.kiln-probe')],
    ['network-namespace-empty', interfaces.every((entry) => entry?.internal === true)],
    [
      'metadata-and-local-network-denied',
      (await deniedConnect('169.254.169.254', 80)) && (await deniedConnect('127.0.0.1', 8080)),
    ],
    ['generated-capabilities-denied', generatedDenials()],
  ];
  const failedChecks = checks.filter(([, ok]) => !ok).map(([name]) => name);
  if (failedChecks.length > 0) {
    const failure = failedChecks.some((name) => NAMESPACE_CHECKS.has(name))
      ? 'namespace'
      : 'probe-protocol';
    writeFileSync(3, JSON.stringify({ version: VERSION, mode: 'isolated', failure }), {
      encoding: 'utf8',
    });
    process.exitCode = 1;
  } else {
    writeFileSync(
      3,
      JSON.stringify({ version: VERSION, mode: 'isolated', checks: checks.map(([name]) => name) }),
      { encoding: 'utf8' },
    );
  }
}

await main().catch(() => {
  process.exitCode = 1;
});
