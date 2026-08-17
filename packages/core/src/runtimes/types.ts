import type { PermissionsConfig } from '@ai-coding-agent/config';
import type { AgentPlan } from '../agent/types.js';
import type { CapabilityContext } from '../capabilities/index.js';

export interface RuntimeContext {
  cwd: string;
  permissions: PermissionsConfig;
  plan?: AgentPlan;
  capabilities?: CapabilityContext;
}

export interface RuntimeExecutionContext extends RuntimeContext {
  prompt: string;
}

export interface RuntimeExecutionResult {
  exitCode: number;
  output: string;
}

export interface RuntimeAdapter {
  readonly name: string;
  sync(context: RuntimeContext): Promise<RuntimeSyncResult>;
  execute?(context: RuntimeExecutionContext): Promise<RuntimeExecutionResult>;
}

export interface RuntimeSyncResult {
  runtime: string;
  files: string[];
}
