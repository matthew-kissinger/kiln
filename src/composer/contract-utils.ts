const FORBIDDEN_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

/** Fail closed before schema parsing so prototype-shaped input is never normalized away. */
export function assertNoPrototypeKeys(value: unknown, path = '$'): void {
  if (value === null || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const [index, entry] of value.entries()) {
      assertNoPrototypeKeys(entry, `${path}[${index}]`);
    }
    return;
  }
  for (const key of Object.keys(value)) {
    if (FORBIDDEN_KEYS.has(key)) throw new TypeError(`${path}.${key} is forbidden`);
    assertNoPrototypeKeys((value as Record<string, unknown>)[key], `${path}.${key}`);
  }
}

export function canonicalContractJson(value: unknown): string {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') {
    return JSON.stringify(value);
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError('canonical JSON requires finite numbers');
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalContractJson).join(',')}]`;
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalContractJson(record[key])}`)
      .join(',')}}`;
  }
  throw new TypeError(`unsupported canonical JSON value: ${typeof value}`);
}

export async function sha256ContractBytes(bytes: Uint8Array): Promise<`sha256:${string}`> {
  const buffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
  const digest = new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', buffer));
  return `sha256:${[...digest].map((byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

export async function sha256ContractJson(value: unknown): Promise<`sha256:${string}`> {
  return sha256ContractBytes(new TextEncoder().encode(canonicalContractJson(value)));
}

export function sameCanonicalContract(a: unknown, b: unknown): boolean {
  return canonicalContractJson(a) === canonicalContractJson(b);
}
