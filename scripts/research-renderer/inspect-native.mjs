// Public metadata and already installed files only. No credentials or npm config reads.
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
const [nativeDir, output] = process.argv.slice(2);
const metadata = await (await fetch('https://registry.npmjs.org/webgpu/0.6.1')).json();
const archive = Buffer.from(await (await fetch(metadata.dist.tarball)).arrayBuffer());
const actualIntegrity = `sha512-${createHash('sha512').update(archive).digest('base64')}`;
if (actualIntegrity !== metadata.dist.integrity)
  throw new Error('Published tarball integrity mismatch');
const binaryFiles = [];
const visit = (directory) => {
  for (const name of readdirSync(directory).sort()) {
    const file = join(directory, name);
    if (statSync(file).isDirectory()) visit(file);
    else
      binaryFiles.push({
        path: relative(nativeDir, file).replaceAll('\\', '/'),
        bytes: statSync(file).size,
        sha256: createHash('sha256').update(readFileSync(file)).digest('hex'),
      });
  }
};
visit(join(nativeDir, 'dist'));
const fullMetadata = await (await fetch('https://registry.npmjs.org/webgpu')).json();
const receipt = {
  package: metadata.name,
  version: metadata.version,
  gitHead: metadata.gitHead,
  metadataLicense: metadata.license,
  includedLicenseText: readFileSync(join(nativeDir, 'LICENSE.md'), 'utf8'),
  compressedBytes: archive.length,
  unpackedBytes: metadata.dist.unpackedSize,
  integrity: actualIntegrity,
  tarballIntegrityVerified: true,
  signaturesPresent: Boolean(metadata.dist.signatures?.length),
  provenancePublished: metadata.dist.attestations,
  provenanceCryptographicallyVerified: false,
  binaryFiles,
  postinstall: readFileSync(join(nativeDir, 'build/postinstall.js'), 'utf8'),
  recentPublicationTimes: Object.entries(fullMetadata.time).slice(-10),
};
writeFileSync(output, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(
  JSON.stringify({
    receipt: output,
    compressedBytes: archive.length,
    binaryFiles: binaryFiles.length,
  }),
);
