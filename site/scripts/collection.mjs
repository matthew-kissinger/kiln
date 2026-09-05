// Repository source history is broader than the published gallery collection.
const excluded = new Set(['crate', 'well', 'tidal-observatory', 'fire-lookout-tower', 'brass-tellurion', 'victorian-greenhouse']);
export function isPublicExample(name) {
  return !excluded.has(name);
}
