import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { DEFAULT_PERMISSIONS, normalizePermissions } from './permissions.js';
import type { PermissionsConfig } from './permissions.js';

export type ProjectType = 'auto' | 'vue' | 'react' | 'react-native' | 'expo' | 'nuxt' | 'node' | 'unknown';
export type DependencyKind = 'skills' | 'mcp' | 'cli';

export interface DependencyGroup {
  skills?: string[];
  mcp?: string[];
  cli?: string[];
}

export interface AgentConfig {
  version: number;
  project?: { type?: ProjectType };
  dependencies?: Record<string, DependencyGroup | undefined>;
  workflow?: { default?: string };
  runtime?: { default?: string };
}

export interface ResolvedDependencies extends DependencyGroup {
  projectType: ProjectType;
}

export const DEFAULT_AGENT_DIR = '.aca';
export const DEFAULT_CONFIG_FILE = 'agent.yaml';

export function loadAgentConfig(cwd = process.cwd()): AgentConfig {
  const path = join(cwd, DEFAULT_AGENT_DIR, DEFAULT_CONFIG_FILE);
  const source = readFileSync(path, 'utf8');
  const config = parse(source) as AgentConfig;
  if (!config || typeof config !== 'object') throw new Error(`Invalid Agent config: ${path}`);
  if (typeof config.version !== 'number') throw new Error(`Missing numeric "version" in ${path}`);
  return config;
}

export function loadPermissions(cwd = process.cwd()): PermissionsConfig | undefined {
  const path = join(cwd, DEFAULT_AGENT_DIR, 'permissions.yaml');
  try {
    return parse(readFileSync(path, 'utf8')) as PermissionsConfig;
  } catch {
    return undefined;
  }
}

export function resolveDependencies(config: AgentConfig, projectType: ProjectType): ResolvedDependencies {
  const common = config.dependencies?.common ?? {};
  const groups = [common];
  if (projectType === 'expo') groups.push(config.dependencies?.['react-native'] ?? {});
  groups.push(config.dependencies?.[projectType] ?? {});

  return {
    projectType,
    skills: unique(groups.flatMap((group) => group.skills ?? [])),
    mcp: unique(groups.flatMap((group) => group.mcp ?? [])),
    cli: unique(groups.flatMap((group) => group.cli ?? [])),
  };
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export { DEFAULT_PERMISSIONS, normalizePermissions } from './permissions.js';
export type { PermissionsConfig } from './permissions.js';
