import { writeFileSync } from 'node:fs';

process.stdout.write('kiln-evaluator-transport-boot-v1\n');
writeFileSync(
  3,
  JSON.stringify({ version: 'kiln.evaluator.isolation-transport.v1', transport: 'fd3' }),
  { encoding: 'utf8' },
);
