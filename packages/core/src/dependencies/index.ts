import type { ResolvedDependencies } from '@ai-coding-agent/config';
import { dependencyAdapters } from './adapters.js';
import { findDependencyInstallSpec, listDependencyInstallSpecs } from './catalog.js';
import { installDependency } from './installer.js';
import type { DependencyCheckResult, DependencyPlan } from './types.js';

export function createDependencyPlan(dependencies: ResolvedDependencies): DependencyPlan {
  return {
    projectType: dependencies.projectType,
    skills: [...(dependencies.skills ?? [])],
    mcp: [...(dependencies.mcp ?? [])],
    cli: [...(dependencies.cli ?? [])],
  };
}

export async function checkDependencies(
  plan: DependencyPlan,
  cwd: string,
): Promise<DependencyCheckResult[]> {
  const groups = [
    ['skills', plan.skills],
    ['mcp', plan.mcp],
    ['cli', plan.cli],
  ] as const;

  const results: DependencyCheckResult[] = [];
  for (const [kind, names] of groups) {
    const adapter = dependencyAdapters.find((candidate) => candidate.kind === kind);
    if (!adapter) continue;
    for (const name of names) results.push(await adapter.check(name, cwd));
  }
  return results;
}

export { findDependencyInstallSpec, listDependencyInstallSpecs, installDependency };
export type { DependencyInstallResult } from './installer.js';
export type { DependencyAdapter, DependencyCheckResult, DependencyPlan } from './types.js';
