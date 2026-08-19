import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { AgentRunResult } from './run.js';

export interface AgentTaskStatus {
  found: boolean;
  result?: AgentRunResult;
}

/** Read the latest persisted execution result without executing anything. */
export async function readAgentTaskStatus(cwd: string): Promise<AgentTaskStatus> {
  try {
    const content = await readFile(join(cwd, '.claude', 'execution.json'), 'utf8');
    return { found: true, result: JSON.parse(content) as AgentRunResult };
  } catch {
    return { found: false };
  }
}
