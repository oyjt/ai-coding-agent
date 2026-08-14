import type { CapabilityRequirement, CapabilityStatus } from './types.js';
import { checkDependencies, findDependencyInstallSpec } from '../dependencies/index.js';
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
  const initial = await inspect(requirements, cwd);
  const plan = createCapabilityInstallPlan(initial);
  const results: DependencyInstallResult[] = [];

  for (const capability of plan.installable) {
    results.push(await installDependency(capability.kind, capability.name, cwd, options));
  }

  const statuses = await inspect(requirements, cwd);
  const blockers = statuses
    .filter((item) => item.required && !item.installed)
    .map((item) => `${item.kind}:${item.name} — ${item.detail ?? '未就绪'}`);

  return { results, statuses, ready: blockers.length === 0, blockers };
}

async function inspect(requirements: CapabilityRequirement[], cwd: string): Promise<CapabilityStatus[]> {
  const grouped = {
    skills: requirements.filter((item) => item.kind === 'skills').map((item) => item.name),
    mcp: requirements.filter((item) => item.kind === 'mcp').map((item) => item.name),
    cli: requirements.filter((item) => item.kind === 'cli').map((item) => item.name),
  };
  const checks = await checkDependencies({ projectType: 'unknown', ...grouped }, cwd);
  return requirements.map((requirement) => {
    const check = checks.find((item) => item.kind === requirement.kind && item.name === requirement.name);
    const installable = Boolean(findDependencyInstallSpec(requirement.kind, requirement.name));
    return {
      ...requirement,
      installed: check?.installed ?? false,
      available: Boolean(check?.installed) || installable,
      detail: check?.detail ?? (installable ? '存在内置安装方案' : '未找到内置安装方案'),
    };
  });
}
