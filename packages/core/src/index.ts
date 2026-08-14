import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ProjectType } from '@ai-coding-agent/config';
import { checkDependencies, createDependencyPlan } from './dependencies/index.js';
export type { DependencyAdapter, DependencyCheckResult, DependencyPlan } from './dependencies/index.js';
export { getRuntimeAdapter } from './runtimes/index.js';
export type { RuntimeAdapter, RuntimeContext, RuntimeSyncResult } from './runtimes/index.js';
export * from './workflows/index.js';
export * from './tasks/index.js';
export * from './agent/index.js';

export interface ProjectInfo {
  type: ProjectType;
  packageManager: 'pnpm' | 'yarn' | 'npm' | 'bun' | 'unknown';
  hasAgentConfig: boolean;
}

export function detectProjectType(cwd = process.cwd()): ProjectType {
  const packageFile = join(cwd, 'package.json');
  if (!existsSync(packageFile)) return 'unknown';
  try {
    const pkg = JSON.parse(readFileSync(packageFile, 'utf8')) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (deps.expo) return 'expo';
    if (deps['react-native']) return 'react-native';
    if (deps.nuxt) return 'nuxt';
    if (deps.vue) return 'vue';
    if (deps.react) return 'react';
    if (deps.typescript || deps.node) return 'node';
  } catch { return 'unknown'; }
  return 'unknown';
}

export function detectPackageManager(cwd = process.cwd()): ProjectInfo['packageManager'] {
  if (existsSync(join(cwd, 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(join(cwd, 'yarn.lock'))) return 'yarn';
  if (existsSync(join(cwd, 'bun.lockb')) || existsSync(join(cwd, 'bun.lock'))) return 'bun';
  if (existsSync(join(cwd, 'package-lock.json'))) return 'npm';
  return 'unknown';
}

export function inspectProject(cwd = process.cwd()): ProjectInfo {
  return { type: detectProjectType(cwd), packageManager: detectPackageManager(cwd), hasAgentConfig: existsSync(join(cwd, '.aca', 'agent.yaml')) };
}

export { checkDependencies, createDependencyPlan };
