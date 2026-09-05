// Optional local dogfood recorder. Records sizes and revision IDs, never image bytes.
import { spawn } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { createInterface } from 'node:readline';

const [server, trace] = process.argv.slice(2);
if (!server || !trace) throw new Error('Expected server bundle path and trace path.');
const child = spawn(process.execPath, [server], { stdio: ['pipe', 'pipe', 'inherit'], windowsHide: true });
const pending = new Map();
const record = (entry) => appendFileSync(trace, `${JSON.stringify(entry)}\n`);
createInterface({ input: process.stdin }).on('line', (line) => {
  try {
    const request = JSON.parse(line);
    if (request.method === 'tools/call') {
      const args = request.params?.arguments ?? {};
      pending.set(request.id, request.params.name);
      record({ direction: 'request', id: request.id, tool: request.params.name,
        argumentBytes: Buffer.byteLength(JSON.stringify(args)), hasInlineCode: typeof args.code === 'string',
        programRef: args.programRef, query: args.query, edits: args.edits });
    }
  } catch {}
  child.stdin.write(`${line}\n`);
}).on('close', () => child.stdin.end());
createInterface({ input: child.stdout }).on('line', (line) => {
  try {
    const response = JSON.parse(line);
    if (pending.has(response.id)) {
      const content = response.result?.content ?? [];
      const text = content.filter((c) => c.type === 'text').map((c) => c.text).join('\n');
      let data;
      try { data = JSON.parse(text); } catch {}
      record({ direction: 'response', id: response.id, tool: pending.get(response.id),
        textBytes: Buffer.byteLength(text), images: content.filter((c) => c.type === 'image').length,
        isError: response.result?.isError ?? false, ok: data?.ok,
        programRef: data?.programRef, parentRef: data?.parentRef,
        codeCharacters: data?.code?.length ?? 0, viewFidelity: data?.viewFidelity ?? data?.render?.viewFidelity });
      pending.delete(response.id);
    }
  } catch {}
  process.stdout.write(`${line}\n`);
});
child.on('close', (code) => { process.exitCode = code ?? 1; });
child.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
