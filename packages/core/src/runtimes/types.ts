import type { PermissionsConfig } from '@ai-coding-agent/config';

export interface RuntimeContext {
  cwd: string;
  permissions: PermissionsConfig;
}

export interface RuntimeAdapter {
  readonly name: string;
  sync(context: RuntimeContext): Promise<RuntimeSyncResult>;
}

export interface RuntimeSyncResult {
  runtime: string;
  files: string[];
}
