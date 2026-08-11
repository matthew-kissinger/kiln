const CAPABILITY_STATUS_FIELDS = ['CapInh', 'CapPrm', 'CapEff', 'CapBnd', 'CapAmb'] as const;

/** Require every capability set exposed by /proc to be present and empty. */
export function processCapabilitiesAreEmpty(status: string | undefined): boolean {
  if (typeof status !== 'string') return false;
  return CAPABILITY_STATUS_FIELDS.every((field) =>
    new RegExp(`^${field}:\\s+0+$`, 'm').test(status),
  );
}
