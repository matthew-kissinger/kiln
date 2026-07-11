import { runW7VegetationLodExperiment, w7VegetationLodReportSha256 } from './w7-vegetation-lod';

const report = await runW7VegetationLodExperiment();
process.stdout.write(
  `${JSON.stringify({ ...report, reportSha256: w7VegetationLodReportSha256(report) }, null, 2)}\n`,
);
