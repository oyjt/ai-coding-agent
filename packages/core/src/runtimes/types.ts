import type { PermissionsConfig } from '@ai-coding-agent/config';
import type { AgentPlan } from '../agent/types.js';

export interface RuntimeContext {
  cwd: string;
  permissions: PermissionsConfig;
  plan?: AgentPlan;
}

export interface RuntimeAdapter {
  readonly name: string;
  sync(context: RuntimeContext): Promise<RuntimeSyncResult>;
}

export interface RuntimeSyncResult {
  runtime: string;
  files: string[];
}
