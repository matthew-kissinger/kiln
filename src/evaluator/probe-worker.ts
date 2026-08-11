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

async function optionalRead(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return undefined;
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
    let socket: ReturnType<typeof connect>;
    try {
      socket = connect({ host, port });
    } catch {
      resolve(true);
      return;
    }
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

function isolationInterfaces(): ReturnType<typeof networkInterfaces> | undefined {
  try {
    return networkInterfaces();
  } catch {
    return undefined;
  }
}

function writeFailure(failure: 'namespace' | 'probe-protocol'): void {
  writeFileSync(3, JSON.stringify({ version: VERSION, mode: 'isolated', failure }), {
    encoding: 'utf8',
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
  const status = await optionalRead('/proc/self/status');
  const uidMap = await optionalRead('/proc/self/uid_map');
  const envKeys = Object.keys(process.env).sort();
  const outsideUid = Number(uidMap?.trim().split(/\s+/)[1]);
  const interfaceMap = isolationInterfaces();
  const interfaces = interfaceMap ? Object.values(interfaceMap).flat().filter(Boolean) : undefined;
  const checks: Array<[string, boolean]> = [
    ['user-namespace', Number.isInteger(outsideUid) && outsideUid > 0],
    ['no-new-privileges', typeof status === 'string' && /^NoNewPrivs:\s+1$/m.test(status)],
    ['capabilities-empty', typeof status === 'string' && /^CapEff:\s+0+$/m.test(status)],
    ['environment-exact', envKeys.join(',') === 'NODE_ENV,NO_COLOR'],
    ['product-filesystem-denied', await deniedRead('/app/agent-runtime/src/server.ts')],
    ['host-filesystem-denied', await deniedRead('/etc/passwd')],
    ['runtime-filesystem-read-only', await deniedWrite('/app/node_modules/.kiln-probe')],
    ['network-namespace-empty', interfaces?.every((entry) => entry?.internal === true) === true],
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
    writeFailure(failure);
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
  try {
    writeFailure('probe-protocol');
  } catch {}
  process.exitCode = 1;
});
