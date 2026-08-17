import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { AgentRunResult } from './run.js';

export const AGENT_EXECUTION_FILE = '.claude/execution.json';

export async function writeAgentExecutionEvidence(cwd: string, result: AgentRunResult): Promise<string> {
  const directory = join(cwd, '.claude');
  await mkdir(directory, { recursive: true });
  const file = join(directory, 'execution.json');
  await writeFile(file, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  return file;
}
