import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { AgentExecutionResult } from './execute.js';
import type { VerificationEvidence } from '../verification/index.js';

export type AgentAttemptStatus = 'passed' | 'failed' | 'blocked' | 'max_attempts';

export interface AgentAttemptEvidence {
  attempt: number;
  startedAt: string;
  completedAt: string;
  execution: AgentExecutionResult;
  verification?: VerificationEvidence;
  status: AgentAttemptStatus;
}

export async function writeAgentAttemptEvidence(cwd: string, evidence: AgentAttemptEvidence): Promise<void> {
  const directory = join(cwd, '.claude', 'attempts');
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, `${evidence.attempt}.json`), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
}
