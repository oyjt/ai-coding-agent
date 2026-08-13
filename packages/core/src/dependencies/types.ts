import type { DependencyKind } from '@ai-coding-agent/config';

export interface DependencyCheckResult {
  kind: DependencyKind;
  name: string;
  installed: boolean;
  detail?: string;
}

export interface DependencyAdapter {
  readonly kind: DependencyKind;
  check(name: string, cwd: string): Promise<DependencyCheckResult>;
}

export interface DependencyPlan {
  projectType: string;
  skills: string[];
  mcp: string[];
  cli: string[];
}
