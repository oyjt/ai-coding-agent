import type { CapabilityStatus } from './types.js';

export interface AvailableCapability {
  kind: CapabilityStatus['kind'];
  name: string;
  source: CapabilityStatus['source'];
  required: boolean;
}

export interface CapabilityContext {
  ready: boolean;
  capabilities: AvailableCapability[];
  blockers: string[];
}

/** Build the runtime-facing capability context from an actual readiness check. */
export function createCapabilityContext(statuses: CapabilityStatus[]): CapabilityContext {
  const capabilities = statuses
    .filter((status) => status.installed && status.available)
    .map(({ kind, name, source, required }) => ({ kind, name, source, required }));

  const blockers = statuses
    .filter((status) => status.required && (!status.installed || !status.available))
    .map((status) => `${status.kind}:${status.name} — ${status.detail ?? '未就绪'}`);

  return {
    ready: blockers.length === 0,
    capabilities,
    blockers,
  };
}
