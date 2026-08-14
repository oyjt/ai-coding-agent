import type { PermissionsConfig } from '@ai-coding-agent/config';
import type { AgentPlan } from '../agent/types.js';
import type { CapabilityContext } from '../capabilities/index.js';

export interface RuntimeContext {
  cwd: string;
  permissions: PermissionsConfig;
  plan?: AgentPlan;
  capabilities?: CapabilityContext;
}

export interface RuntimeAdapter {
  readonly name: string;
  sync(context: RuntimeContext): Promise<RuntimeSyncResult>;
}

export interface RuntimeSyncResult {
  runtime: string;
  files: string[];
}
