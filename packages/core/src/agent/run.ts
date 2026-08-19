import type { AgentPlan } from './types.js';
import type { AgentExecutionOptions, AgentExecutionResult } from './execute.js';
import { executeAgent } from './execute.js';
import { verify, type VerificationEvidence } from '../verification/index.js';
import { writeVerificationEvidence } from '../verification/artifact.js';
import { writeAgentExecutionEvidence } from './artifact.js';
import { writeAgentAttemptEvidence, type AgentAttemptStatus } from './attempt.js';

export interface AgentRunOptions extends Omit<AgentExecutionOptions, 'plan'> {
  plan: AgentPlan;
  verify?: boolean;
  writeEvidence?: boolean;
  maxAttempts?: number;
  confirmed?: boolean;
}

export interface AgentRunResult {
  execution: AgentExecutionResult;
  verification?: VerificationEvidence;
  completed: boolean;
  attempts: number;
  status: AgentAttemptStatus;
}

/**
 * Run a prepared agent task with bounded repair attempts. Completion is only
 * true when execution succeeds and verification passes.
 */
export async function runAgent(plan: AgentPlan, options: AgentRunOptions): Promise<AgentRunResult> {
  const shouldVerify = options.verify !== false;
  const writeEvidence = options.writeEvidence !== false;
  const maxAttempts = Math.max(1, Math.floor(options.maxAttempts ?? 3));
  let prompt = options.prompt;
  let lastExecution: AgentExecutionResult | undefined;
  let lastVerification: VerificationEvidence | undefined;

  if (plan.approval.required && !options.confirmed) {
    throw new Error('Agent execution requires explicit confirmation. Re-run with --confirm.');
  }

  if (!options.preparation.ready) {
    throw new Error(`Agent execution blocked: ${options.preparation.blockers.join('; ') || 'capabilities are not ready'}`);
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const execution = await executeAgent(plan, { ...options, prompt });
    lastExecution = execution;

    if (!shouldVerify) {
      const result: AgentRunResult = {
        execution,
        completed: execution.exitCode === 0,
        attempts: attempt,
        status: execution.exitCode === 0 ? 'passed' : attempt === maxAttempts ? 'max_attempts' : 'failed',
      };
      if (writeEvidence) {
        await writeAgentExecutionEvidence(options.cwd, result);
        await writeAgentAttemptEvidence(options.cwd, { attempt, startedAt: execution.startedAt, completedAt: execution.completedAt, execution, status: result.status });
      }
      if (result.completed || attempt === maxAttempts) return result;
      prompt = createRepairPrompt(plan.description, execution, undefined);
      continue;
    }

    if (execution.exitCode !== 0) {
      const status: AgentAttemptStatus = attempt === maxAttempts ? 'max_attempts' : 'failed';
      if (writeEvidence) await writeAgentAttemptEvidence(options.cwd, { attempt, startedAt: execution.startedAt, completedAt: execution.completedAt, execution, status });
      if (attempt === maxAttempts) {
        const result: AgentRunResult = { execution, completed: false, attempts: attempt, status };
        if (writeEvidence) await writeAgentExecutionEvidence(options.cwd, result);
        return result;
      }
      prompt = createRepairPrompt(plan.description, execution, undefined);
      continue;
    }

    const verification = await verify(plan.verificationPlan, options.cwd, true);
    lastVerification = verification;
    if (writeEvidence) await writeVerificationEvidence(options.cwd, verification);

    if (verification.canComplete) {
      const result: AgentRunResult = { execution, verification, completed: true, attempts: attempt, status: 'passed' };
      if (writeEvidence) {
        await writeAgentAttemptEvidence(options.cwd, { attempt, startedAt: execution.startedAt, completedAt: new Date().toISOString(), execution, verification, status: 'passed' });
        await writeAgentExecutionEvidence(options.cwd, result);
      }
      return result;
    }

    const status: AgentAttemptStatus = attempt === maxAttempts ? 'max_attempts' : 'failed';
    if (writeEvidence) {
      await writeAgentAttemptEvidence(options.cwd, { attempt, startedAt: execution.startedAt, completedAt: new Date().toISOString(), execution, verification, status });
    }
    if (attempt < maxAttempts) prompt = createRepairPrompt(plan.description, execution, verification);
  }

  const execution = lastExecution as AgentExecutionResult;
  const result: AgentRunResult = { execution, verification: lastVerification, completed: false, attempts: maxAttempts, status: 'max_attempts' };
  if (writeEvidence) await writeAgentExecutionEvidence(options.cwd, result);
  return result;
}

function createRepairPrompt(task: string, execution: AgentExecutionResult, verification?: VerificationEvidence): string {
  const failures = verification?.blockers.length ? verification.blockers.join('\n- ') : execution.output;
  return [
    '上一轮任务执行未通过，请继续修复当前工作区，不要从头开始重做。',
    `任务：${task}`,
    '',
    '失败信息：',
    `- ${failures || 'Agent 执行失败，请检查当前工作区状态。'}`,
    '',
    '要求：定位失败根因，进行最小必要修改，然后再次执行真实验证。不要伪造验证结果。',
  ].join('\n');
}
