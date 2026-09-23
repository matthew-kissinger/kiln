/** Installed Node commands; maintainer build pins live in toolchain.json. */
export const CORE_NODE_RANGE = '^20.15.0 || >=22.2.0';
export const AGENT_NODE_RANGE = '>=22.2.0';

/**
 * Separate compatibility floors avoid claiming support for Node 21 or early 22,
 * which lack zlib.crc32 used by the renderer.
 * @param {'core' | 'agent'} capability
 * @param {string} version
 */
export function assertNodeRuntime(capability = 'core', version = process.versions.node) {
  const parsed = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  const [major, minor] = parsed ? parsed.slice(1).map(Number) : [];
  const modern = major > 22 || (major === 22 && minor >= 2);
  const compatibility = major === 20 && minor >= 15;
  if (modern || (capability === 'core' && compatibility)) return;
  const label = capability === 'core' ? 'Kiln CLI/MCP' : 'Kiln optional Strands generation';
  const range = capability === 'core' ? CORE_NODE_RANGE : AGENT_NODE_RANGE;
  throw new Error(`${label} requires Node.js ${range}; found ${version}.`);
}
