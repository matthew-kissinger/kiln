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

/**
 * How far the ratchet is from biting, counted in the unit a person can act on.
 *
 * A percentage says whether the gate passed; it does not say how much room is left,
 * and the arithmetic to find out needs numbers that only appear in the LCOV file. A
 * stranger who trips this gate should be told "seven functions short", not handed two
 * percentages and a subtraction. Slack rounds down and a shortfall rounds up, so
 * neither is ever reported as more comfortable than it is.
 */
function margin(hit, found, threshold, unit) {
  const exact = hit - (threshold / 100) * found;
  const count = exact >= 0 ? Math.floor(exact) : Math.ceil(-exact);
  const noun = count === 1 ? unit.replace(/s$/u, '') : unit;
  return `${count} ${noun} ${exact >= 0 ? 'of slack' : 'short'}`;
}

const [lcov, configurationText] = await Promise.all([
  readFile(lcovPath, 'utf8'),
  readFile(thresholdsPath, 'utf8'),
]);
const configuration = JSON.parse(configurationText);
const thresholds = configuration.thresholds;
const baseline = configuration.measuredBaseline;

if (
  typeof thresholds?.functions !== 'number' ||
  typeof thresholds?.lines !== 'number' ||
  thresholds.functions < 0 ||
  thresholds.lines < 0
) {
  throw new Error('coverage thresholds must contain non-negative functions and lines percentages');
}
// A threshold is only ever raised to a number somebody measured. Requiring the
// baseline, and requiring it to sit at or above the threshold, is what keeps the
// ratchet from being set on a guess -- the one mistake this file cannot otherwise
// catch, because a threshold above anything ever observed reads exactly like a
// regression in whatever change happens to run next.
if (typeof baseline?.functions !== 'number' || typeof baseline?.lines !== 'number') {
  throw new Error('coverage thresholds must record the measuredBaseline they were ratcheted from');
}
// And what it was measured OVER. A percentage without its scope is as ambiguous
// as a threshold without a baseline, and that ambiguity is not theoretical: this
// gate measured `src` plus four incidentally-imported files under `scripts/` for
// months, which was enough for reformatting a repo-only script to move the
// engine's contract -- and enough to make the cause hard to find afterwards.
if (typeof baseline?.measuredOver !== 'string' || baseline.measuredOver.length === 0) {
  throw new Error('coverage measuredBaseline must record what it was measuredOver');
}
for (const metric of ['functions', 'lines']) {
  if (thresholds[metric] > baseline[metric]) {
    throw new Error(
      `${metric} threshold ${thresholds[metric]}% exceeds the recorded measured baseline ${baseline[metric]}%`,
    );
  }
}

const counts = {
  functions: { hit: totalField(lcov, 'FNH'), found: totalField(lcov, 'FNF') },
  lines: { hit: totalField(lcov, 'LH'), found: totalField(lcov, 'LF') },
};
const actual = {
  functions: percentage(counts.functions.hit, counts.functions.found, 'functions'),
  lines: percentage(counts.lines.hit, counts.lines.found, 'lines'),
};
const failures = Object.entries(thresholds).filter(
  ([metric, threshold]) => actual[metric] < threshold,
);
const report = (metric, unit) =>
  `${metric} ${actual[metric].toFixed(2)}% (minimum ${thresholds[metric].toFixed(2)}%, ${margin(counts[metric].hit, counts[metric].found, thresholds[metric], unit)})`;
const summary = `${report('functions', 'functions')}, ${report('lines', 'lines')}`;
// Printed on the way past, not only on failure: the recorded baseline is the number
// the next ratchet decision is made against, and a log that shows it beside the
// current measurement makes a stale record visible without a second run.
const measuredWhere = [`over ${baseline.measuredOver}`, baseline.measuredUnder, baseline.measuredOn]
  .filter(Boolean)
  .join(', ');
const provenance = [
  `Recorded baseline: functions ${baseline.functions.toFixed(2)}%, lines ${baseline.lines.toFixed(2)}%`,
  measuredWhere ? ` (${measuredWhere})` : '',
].join('');

if (failures.length > 0) {
  console.error(`Coverage gate failed: ${summary}`);
  console.error(provenance);
  process.exit(1);
}

console.log(`Coverage gate passed: ${summary}`);
console.log(provenance);
