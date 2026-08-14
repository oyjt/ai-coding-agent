import type { CapabilityRequirement, CapabilityStatus } from './types.js';
import { inspectCapabilities } from './index.js';
import { installDependency, type DependencyInstallResult } from '../dependencies/installer.js';

export interface CapabilityInstallPlan {
  installable: CapabilityRequirement[];
  unavailable: CapabilityRequirement[];
}

export interface CapabilityInstallReport {
  results: DependencyInstallResult[];
  statuses: CapabilityStatus[];
  ready: boolean;
  blockers: string[];
}

export function createCapabilityInstallPlan(statuses: CapabilityStatus[]): CapabilityInstallPlan {
  return {
    installable: statuses.filter((item) => item.required && !item.installed && item.available),
    unavailable: statuses.filter((item) => item.required && !item.installed && !item.available),
  };
}

export async function installMissingCapabilities(
  requirements: CapabilityRequirement[],
  cwd: string,
  options: { execute?: boolean } = {},
): Promise<CapabilityInstallReport> {
  const initial = await inspectCapabilities(requirements, cwd);
  const plan = createCapabilityInstallPlan(initial);
  const results: DependencyInstallResult[] = [];

  for (const capability of plan.installable) {
    results.push(await installDependency(capability.kind, capability.name, cwd, options));
  }

  const statuses = await inspectCapabilities(requirements, cwd);
  const blockers = statuses
    .filter((item) => item.required && !item.installed)
    .map((item) => `${item.kind}:${item.name} — ${item.detail ?? '未就绪'}`);

  return {
    results,
    statuses,
    ready: blockers.length === 0,
    blockers,
  };
}
