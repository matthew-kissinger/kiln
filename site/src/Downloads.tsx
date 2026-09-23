import { asset } from './repo';
import type { Specimen } from './types';

/** These links remain usable when the 3D preview cannot load. */
export function Downloads({ specimen }: { specimen: Specimen }) {
  return (
    <>
      <a className="chip" href={asset(specimen.file)} download={`${specimen.name}.glb`}>
        Original GLB
      </a>
      <a
        className="chip"
        href={asset(specimen.runtime.file)}
        download={`${specimen.name}.runtime.glb`}
      >
        Runtime GLB
      </a>
      <a
        className="chip"
        href={asset(specimen.runtime.metadata.file)}
        download={`${specimen.name}.runtime.kiln-metadata.json`}
      >
        Runtime metadata
      </a>
    </>
  );
}
