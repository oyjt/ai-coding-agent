export type {
  RuntimeAdapter,
  RuntimeContext,
  RuntimeExecutionContext,
  RuntimeExecutionResult,
  RuntimeSyncResult,
} from './types.js';
export { claudeRuntime } from './claude.js';

import { claudeRuntime } from './claude.js';

export const runtimeAdapters = [claudeRuntime];

export function getRuntimeAdapter(name: string) {
  return runtimeAdapters.find((runtime) => runtime.name === name);
}
