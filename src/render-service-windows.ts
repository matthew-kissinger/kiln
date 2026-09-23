import { spawn, type ChildProcess } from 'node:child_process';
import { join } from 'node:path';

function powerShellLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

/** Quote one Windows executable argument, including quotes and trailing backslashes. */
function windowsArgument(value: string): string {
  return `"${value.replace(/(\\*)"/g, '$1$1\\"').replace(/(\\+)$/g, '$1$1')}"`;
}

/**
 * ShellExecute starts the service without inheriting the caller's unrelated pipe
 * handles. Node's detached spawn still inherits those handles on Windows: the CLI
 * exits, but a shell/agent waiting for output EOF waits for the service too.
 * Do not redirect Start-Process streams; that switches it back to CreateProcess
 * with inherited handles. The short-lived launcher reports only the new PID.
 */
export function launchWindowsRenderService(
  executable: string,
  args: readonly string[],
  directory: string,
  env: NodeJS.ProcessEnv,
): { child: ChildProcess; hasExited: () => boolean } {
  const script = [
    "$ErrorActionPreference = 'Stop'",
    `$kilnServiceProcess = Start-Process -WindowStyle Hidden -PassThru -FilePath ${powerShellLiteral(executable)} -WorkingDirectory ${powerShellLiteral(directory)} -ArgumentList ${powerShellLiteral(args.map(windowsArgument).join(' '))}`,
    '[Console]::Out.WriteLine($kilnServiceProcess.Id)',
  ].join('\n');
  const systemRoot = env.SystemRoot ?? env.SYSTEMROOT;
  const powerShell = systemRoot
    ? join(systemRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe')
    : 'powershell.exe';
  const child = spawn(
    powerShell,
    [
      '-NoProfile',
      '-NonInteractive',
      '-EncodedCommand',
      Buffer.from(script, 'utf16le').toString('base64'),
    ],
    {
      cwd: directory,
      env,
      windowsHide: true,
      // This launcher must execute normally. Start-Process detaches the service.
      detached: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  let output = '';
  let outputEnded = false;
  let pid: number | undefined;
  child.stdout!.on('data', (bytes: Buffer) => {
    if (output.length <= 64) output += bytes.toString();
  });
  child.stdout!.once('end', () => {
    outputEnded = true;
    const value = output.trim();
    const candidate = /^\d{1,10}$/.test(value) ? Number(value) : NaN;
    if (Number.isSafeInteger(candidate) && candidate > 0 && candidate <= 0xffffffff)
      pid = candidate;
  });
  return {
    child,
    hasExited() {
      if ((child.exitCode !== null && child.exitCode !== 0) || child.signalCode !== null)
        return true;
      if (child.exitCode === 0 && outputEnded && pid === undefined) return true;
      if (pid === undefined) return false;
      try {
        process.kill(pid, 0);
        return false;
      } catch (error) {
        return (error as NodeJS.ErrnoException).code !== 'EPERM';
      }
    },
  };
}
