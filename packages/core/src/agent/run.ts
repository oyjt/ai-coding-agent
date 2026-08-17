import type { AgentPlan } from './types.js';
import type { AgentExecutionOptions, AgentExecutionResult } from './execute.js';
import { executeAgent } from './execute.js';
import { verify, type VerificationEvidence } from '../verification/index.js';
import { writeVerificationEvidence } from '../verification/artifact.js';

export interface AgentRunOptions extends Omit<AgentExecutionOptions, 'plan'> {
  plan: AgentPlan;
  verify?: boolean;
  writeEvidence?: boolean;
}

export interface AgentRunResult {
  execution: AgentExecutionResult;
  verification?: VerificationEvidence;
  completed: boolean;
}

/**
 * Run a prepared agent task and verify the resulting workspace by default.
 * Completion is only true when execution succeeds and verification passes.
 */
export async function runAgent(plan: AgentPlan, options: AgentRunOptions): Promise<AgentRunResult> {
  const shouldVerify = options.verify !== false;
  const execution = await executeAgent(plan, options);

  if (!shouldVerify || execution.exitCode !== 0) {
    return { execution, completed: !shouldVerify && execution.exitCode === 0 };
  }

  const evidence = await verify(plan.verificationPlan, options.cwd, true);
  if (options.writeEvidence !== false) writeVerificationEvidence(options.cwd, evidence);

  return {
    execution,
    verification: evidence,
    completed: execution.exitCode === 0 && evidence.canComplete,
  };
}
