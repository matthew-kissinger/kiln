import { writeFileSync } from 'node:fs';
import { listHelperSpecs } from '../../src/discovery/helper-specs';
import { discoveryIntents } from '../../src/discovery/intents';

const retired = new Set(['cloneGeometry', 'cloneMaterial', 'validateAsset', 'panelRemapV']);
const documents = listHelperSpecs()
  .filter((entry) => !retired.has(entry.name))
  .map((entry) => ({
    id: entry.name,
    name: entry.name,
    intent: (discoveryIntents[entry.name] ?? []).join(' '),
    description: entry.description,
    family: entry.category,
  }));
writeFileSync(
  new URL('./documents.json', import.meta.url),
  `${JSON.stringify(documents, null, 2)}\n`,
);
console.log(`Exported ${documents.length} common-metadata documents.`);
