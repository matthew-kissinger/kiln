import {
  canonicalW6MaterialVegetationReport,
  runW6MaterialVegetationExperiments,
} from './w6-material-vegetation';

const report = await runW6MaterialVegetationExperiments();
process.stdout.write(canonicalW6MaterialVegetationReport(report));
