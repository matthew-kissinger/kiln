import { readFile } from 'node:fs/promises';

const lcovPath = process.argv[2] ?? 'coverage/lcov.info';
const thresholdsPath = process.argv[3] ?? 'coverage-thresholds.json';

function totalField(lcov, field) {
  return [...lcov.matchAll(new RegExp(`^${field}:(\\d+)$`, 'gmu'))].reduce(
    (sum, match) => sum + Number(match[1]),
    0,
  );
}

function percentage(hit, found, label) {
  if (found === 0) throw new Error(`LCOV report contains no ${label}`);
  return (hit / found) * 100;
}

const [lcov, configurationText] = await Promise.all([
  readFile(lcovPath, 'utf8'),
  readFile(thresholdsPath, 'utf8'),
]);
const configuration = JSON.parse(configurationText);
const thresholds = configuration.thresholds;

if (
  typeof thresholds?.functions !== 'number' ||
  typeof thresholds?.lines !== 'number' ||
  thresholds.functions < 0 ||
  thresholds.lines < 0
) {
  throw new Error('coverage thresholds must contain non-negative functions and lines percentages');
}

const actual = {
  functions: percentage(totalField(lcov, 'FNH'), totalField(lcov, 'FNF'), 'functions'),
  lines: percentage(totalField(lcov, 'LH'), totalField(lcov, 'LF'), 'lines'),
};
const failures = Object.entries(thresholds).filter(
  ([metric, threshold]) => actual[metric] < threshold,
);
const summary = `functions ${actual.functions.toFixed(2)}% (minimum ${thresholds.functions.toFixed(2)}%), lines ${actual.lines.toFixed(2)}% (minimum ${thresholds.lines.toFixed(2)}%)`;

if (failures.length > 0) {
  console.error(`Coverage gate failed: ${summary}`);
  process.exit(1);
}

console.log(`Coverage gate passed: ${summary}`);
