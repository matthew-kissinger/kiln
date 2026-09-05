// Renderer-owned, versioned presentation definitions. Requests select an ID;
// no caller-controlled light/color/exposure object crosses the HTTP boundary.

const PRESET_KEYS = Object.freeze([
  'id', 'environment', 'background', 'exposure', 'ambient',
  'sun', 'key', 'fill', 'rim', 'shadows',
]);
const ACTIVE_DIRECTIONAL_KEYS = Object.freeze([
  'enabled', 'color', 'intensity', 'position', 'castsShadow',
]);
const DISABLED_DIRECTIONAL_KEYS = Object.freeze(['enabled']);

function exactKeys(value, expected, path) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${path} must be an object`);
  }
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) {
    throw new TypeError(`${path} keys must be exactly ${wanted.join(', ')}`);
  }
}

function finite(value, path, { minimum = -Infinity } = {}) {
  if (!Number.isFinite(value) || value < minimum) throw new TypeError(`${path} must be finite >= ${minimum}`);
}

function color(value, path) {
  if (!Number.isInteger(value) || value < 0 || value > 0xffffff) {
    throw new TypeError(`${path} must be a 24-bit color integer`);
  }
}

function tuple(value, length, path, validate) {
  if (!Array.isArray(value) || value.length !== length) throw new TypeError(`${path} must have ${length} entries`);
  value.forEach((entry, index) => validate(entry, `${path}[${index}]`));
}

function validateDirectional(value, path) {
  exactKeys(value, value?.enabled === false ? DISABLED_DIRECTIONAL_KEYS : ACTIVE_DIRECTIONAL_KEYS, path);
  if (typeof value.enabled !== 'boolean') throw new TypeError(`${path}.enabled must be boolean`);
  if (!value.enabled) return;
  color(value.color, `${path}.color`);
  finite(value.intensity, `${path}.intensity`, { minimum: 0 });
  tuple(value.position, 3, `${path}.position`, finite);
  if (typeof value.castsShadow !== 'boolean') throw new TypeError(`${path}.castsShadow must be boolean`);
}

function validatePreset(preset) {
  exactKeys(preset, PRESET_KEYS, 'presentation preset');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*-v[1-9][0-9]*$/.test(preset.id)) {
    throw new TypeError('presentation preset id must end in a positive version');
  }
  exactKeys(preset.environment, ['type', 'sigma'], `${preset.id}.environment`);
  if (preset.environment.type !== 'room') throw new TypeError(`${preset.id}.environment.type must be room`);
  finite(preset.environment.sigma, `${preset.id}.environment.sigma`, { minimum: 0 });
  if (!/^#[0-9a-f]{6}$/.test(preset.background)) {
    throw new TypeError(`${preset.id}.background must be lowercase #rrggbb`);
  }
  finite(preset.exposure, `${preset.id}.exposure`, { minimum: 0 });
  exactKeys(preset.ambient, ['type', 'sky', 'ground', 'intensity'], `${preset.id}.ambient`);
  if (preset.ambient.type !== 'hemisphere') throw new TypeError(`${preset.id}.ambient.type must be hemisphere`);
  color(preset.ambient.sky, `${preset.id}.ambient.sky`);
  color(preset.ambient.ground, `${preset.id}.ambient.ground`);
  finite(preset.ambient.intensity, `${preset.id}.ambient.intensity`, { minimum: 0 });
  for (const role of ['sun', 'key', 'fill', 'rim']) validateDirectional(preset[role], `${preset.id}.${role}`);
  exactKeys(
    preset.shadows,
    ['enabled', 'type', 'mapSize', 'bias', 'normalBias', 'radius'],
    `${preset.id}.shadows`,
  );
  if (typeof preset.shadows.enabled !== 'boolean') throw new TypeError(`${preset.id}.shadows.enabled must be boolean`);
  if (preset.shadows.type !== 'pcf-soft') throw new TypeError(`${preset.id}.shadows.type must be pcf-soft`);
  tuple(preset.shadows.mapSize, 2, `${preset.id}.shadows.mapSize`, (entry, path) => {
    if (!Number.isInteger(entry) || entry < 1 || entry > 8192) throw new TypeError(`${path} must be an integer in [1,8192]`);
  });
  finite(preset.shadows.bias, `${preset.id}.shadows.bias`);
  finite(preset.shadows.normalBias, `${preset.id}.shadows.normalBias`, { minimum: 0 });
  finite(preset.shadows.radius, `${preset.id}.shadows.radius`, { minimum: 0 });
  return preset;
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

const definitions = [
  validatePreset({
    id: 'neutral-studio-v1',
    environment: { type: 'room', sigma: 0.04 },
    background: '#aab1bc',
    exposure: 1.38,
    ambient: { type: 'hemisphere', sky: 0xffffff, ground: 0x6f7888, intensity: 2 },
    // The v1 studio rig has no separate sun. Retaining this explicit disabled
    // role lets future world-oriented IDs add one without changing the schema.
    sun: { enabled: false },
    key: { enabled: true, color: 0xffffff, intensity: 3, position: [4, 7, 5], castsShadow: false },
    fill: { enabled: true, color: 0xdce8ff, intensity: 1.8, position: [-4, 3, 2], castsShadow: false },
    rim: { enabled: true, color: 0xffead6, intensity: 1.2, position: [-2, 5, -5], castsShadow: false },
    // These are the WebGPU/three.js controls the renderer knows how to apply.
    // Disabled preserves the exact pre-registry v1 visual behavior.
    shadows: {
      enabled: false,
      type: 'pcf-soft',
      mapSize: [1024, 1024],
      bias: 0,
      normalBias: 0,
      radius: 1,
    },
  }),
];

// Gallery photography uses a lower exposure without changing the default tool rig.
definitions.push(validatePreset({ ...definitions[0], id: 'gallery-studio-v1', exposure: 0.9, background: '#747474' }));

for (const definition of definitions) deepFreeze(definition);
export const PRESENTATION_PRESET_IDS = Object.freeze(definitions.map(({ id }) => id));
export const DEFAULT_PRESENTATION_PRESET_ID = PRESENTATION_PRESET_IDS[0];
export const PRESENTATION_PRESET_CAPABILITIES = Object.freeze(
  PRESENTATION_PRESET_IDS.map((id) => `render.profile.${id}`),
);
const registry = Object.freeze(Object.fromEntries(definitions.map((preset) => [preset.id, preset])));

export function isPresentationPresetId(id) {
  return typeof id === 'string' && Object.hasOwn(registry, id);
}

export function getPresentationPreset(id) {
  return isPresentationPresetId(id) ? registry[id] : undefined;
}
