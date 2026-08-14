import type { DependencyKind } from '@ai-coding-agent/config';
import { checkDependencies, findDependencyInstallSpec } from '../dependencies/index.js';
import type { ResolvedWorkflow } from '../workflows/types.js';
import type { CapabilityRequirement, CapabilityStatus } from './types.js';

export function resolveCapabilities(
  workflow: ResolvedWorkflow,
  dependencies: { skills?: string[]; mcp?: string[]; cli?: string[] },
): CapabilityRequirement[] {
  const requirements: CapabilityRequirement[] = [];
  const workflowSkills = workflow.steps
    .filter((step) => step.required)
    .flatMap((step) => step.skills);

  for (const name of workflowSkills) {
    if (name === 'project-skills') continue;
    requirements.push({ kind: 'skills', name, source: 'workflow', required: true });
  }
  for (const name of dependencies.skills ?? []) {
    if (!workflowSkills.includes(name)) requirements.push({ kind: 'skills', name, source: 'project', required: true });
  }
  for (const name of dependencies.mcp ?? []) {
    requirements.push({ kind: 'mcp', name, source: 'project', required: true });
  }
  for (const name of dependencies.cli ?? []) {
    requirements.push({ kind: 'cli', name, source: 'project', required: true });
  }

  return dedupe(requirements);
}

export async function inspectCapabilities(
  requirements: CapabilityRequirement[],
  cwd: string,
): Promise<CapabilityStatus[]> {
  const grouped = {
    skills: requirements.filter((item) => item.kind === 'skills').map((item) => item.name),
    mcp: requirements.filter((item) => item.kind === 'mcp').map((item) => item.name),
    cli: requirements.filter((item) => item.kind === 'cli').map((item) => item.name),
  } satisfies Record<DependencyKind, string[]>;
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

function dedupe(items: CapabilityRequirement[]): CapabilityRequirement[] {
  const map = new Map<string, CapabilityRequirement>();
  for (const item of items) {
    const key = `${item.kind}:${item.name}`;
    const previous = map.get(key);
    if (!previous || previous.source !== 'workflow' && item.source === 'workflow') map.set(key, item);
  }
  return [...map.values()];
}

export { getCapabilityReadiness } from './readiness.js';
export type { CapabilityReadiness } from './readiness.js';
export type { CapabilityRequirement, CapabilityStatus } from './types.js';
