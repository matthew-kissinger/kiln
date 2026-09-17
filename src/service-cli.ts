/**
 * `kiln service`: see who is on the shared render-service port, and clear it.
 *
 * The host joins, replaces or refuses a service on its own (see
 * `render-service-host.ts`); these commands exist for the one case it will not
 * decide for you -- a stale service that somebody started by hand or that
 * another session still owns -- and so a developer can see the same facts the
 * host acts on instead of inferring them from a degraded sheet.
 */
import {
  describeStaleService,
  explainRenderServiceState,
  inspectLocalRenderService,
  localRenderServicePort,
  localRenderServiceState,
  localRenderServiceUrl,
  processIsAlive,
  renderServiceDir,
  terminateRenderService,
  type LocalRenderServiceProbe,
} from './render-service-host';

export const SERVICE_USAGE = `
RENDER SERVICE
  kiln service status     who is listening on the shared port, and whether it is current
  kiln service stop       stop the render service on the shared port, whoever started it
  kiln service prune      stop it only when it is an orphan running older source

The port is 8000 unless KILN_RENDER_SERVICE_PORT says otherwise. A session starts the
service on demand and stops it on exit; \`kiln service\` is for the one it will not decide
for you: a stale service started by hand or still owned by another session.
`;

export interface ServiceIo {
  log: (line: string) => void;
  error: (line: string) => void;
}

function describeProcess(probe: LocalRenderServiceProbe): string {
  if (probe.kind !== 'service') return '';
  if (!probe.instance) return 'unknown (this service predates instance reporting)';
  const { pid, ownerPid } = probe.instance;
  if (ownerPid === null) return `pid ${pid}, started by hand`;
  return `pid ${pid}, started by session ${ownerPid} (${processIsAlive(ownerPid) ? 'running' : 'exited'})`;
}

function describeSource(probe: LocalRenderServiceProbe, dir: string): string {
  if (probe.kind !== 'service') return '';
  if (!probe.instance) return 'unknown (this service predates instance reporting)';
  return probe.stale ? `stale (older than ${dir})` : 'current';
}

export async function serviceMain(
  argv: readonly string[],
  io: ServiceIo = { log: console.log, error: console.error },
): Promise<number> {
  const command = argv[0];
  if (command === undefined || command === '--help' || command === '-h') {
    io.log(SERVICE_USAGE);
    return command === undefined ? 2 : 0;
  }
  if (command !== 'status' && command !== 'stop' && command !== 'prune') {
    io.error(`unknown service command: ${command}\n${SERVICE_USAGE}`);
    return 2;
  }

  const url = localRenderServiceUrl();
  const dir = renderServiceDir();
  const state = localRenderServiceState(dir);
  const probe = await inspectLocalRenderService(url, dir);

  if (command === 'status') {
    io.log(`render service   ${url}`);
    io.log(
      `installation     ${state === 'ready' ? `ready (${dir})` : explainRenderServiceState(state, dir)}`,
    );
    switch (probe.kind) {
      case 'absent':
        io.log('listening        no');
        break;
      case 'busy':
        io.log('listening        yes, busy rendering (did not answer in time)');
        break;
      case 'foreign':
        io.log(
          `listening        something that is not a render service holds port ${localRenderServicePort()}; set KILN_RENDER_SERVICE_PORT to move the renderer`,
        );
        break;
      case 'service':
        io.log(`listening        yes  ${probe.rendererId}`);
        io.log(`process          ${describeProcess(probe)}`);
        io.log(`source           ${describeSource(probe, dir)}`);
        break;
    }
    return 0;
  }

  if (probe.kind === 'absent') {
    io.log(`nothing is listening on ${url}`);
    return 0;
  }
  if (probe.kind === 'busy') {
    io.error(`the render service on ${url} is busy rendering and did not answer; try again`);
    return 1;
  }
  if (probe.kind === 'foreign') {
    io.error(
      `port ${localRenderServicePort()} is in use by something that is not a render service; nothing was stopped. Set KILN_RENDER_SERVICE_PORT to move the renderer.`,
    );
    return 1;
  }
  if (!probe.instance) {
    io.error(
      `the render service on ${url} predates instance reporting and does not say its pid; stop it by hand and start it again from ${dir}`,
    );
    return 1;
  }

  if (command === 'prune') {
    if (!probe.stale) {
      io.log(`kept: the render service on ${url} (pid ${probe.instance.pid}) is current`);
      return 0;
    }
    if (!probe.orphaned) {
      io.log(`kept: ${describeStaleService(url, probe)}; \`kiln service stop\` stops it anyway`);
      return 0;
    }
  }

  const stopped = await terminateRenderService(url, probe);
  if (!stopped) {
    io.error(`could not stop the render service on ${url} (pid ${probe.instance.pid})`);
    return 1;
  }
  io.log(
    command === 'prune'
      ? `stopped: ${describeStaleService(url, probe)}`
      : `stopped the render service on ${url} (pid ${probe.instance.pid}); the next view that needs it starts a new one`,
  );
  return 0;
}
