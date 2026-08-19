import type { AgentPlan, AgentWorkspaceEvidence } from './types.js';
import type { AgentExecutionOptions, AgentExecutionResult } from './execute.js';
import { executeAgent } from './execute.js';
import { verify, type VerificationEvidence } from '../verification/index.js';
import { writeVerificationEvidence } from '../verification/artifact.js';
import { writeAgentExecutionEvidence } from './artifact.js';
import { writeAgentAttemptEvidence, type AgentAttemptStatus } from './attempt.js';
import { hasValidAgentApproval } from './approval.js';
import { guardWorkspaceChanges, snapshotWorkspace } from '../workspace/index.js';

export interface AgentRunOptions extends Omit<AgentExecutionOptions, 'plan'> {
  plan: AgentPlan;
  verify?: boolean;
  writeEvidence?: boolean;
  maxAttempts?: number;
  confirmed?: boolean;
  workspaceGuard?: boolean;
}

export interface AgentRunResult {
  execution: AgentExecutionResult;
  verification?: VerificationEvidence;
  workspace?: AgentWorkspaceEvidence;
  completed: boolean;
  attempts: number;
  status: AgentAttemptStatus;
}

export async function runAgent(plan: AgentPlan, options: AgentRunOptions): Promise<AgentRunResult> {
  const shouldVerify = options.verify !== false;
  const writeEvidence = options.writeEvidence !== false;
  const useWorkspaceGuard = options.workspaceGuard !== false;
  const maxAttempts = Math.max(1, Math.floor(options.maxAttempts ?? 3));
  let prompt = options.prompt;
  let lastExecution: AgentExecutionResult | undefined;
  let lastVerification: VerificationEvidence | undefined;
  let lastWorkspace: AgentWorkspaceEvidence | undefined;
  const workspaceBefore = useWorkspaceGuard ? await snapshotWorkspace(options.cwd) : undefined;

  if (plan.classification.level === 'CRITICAL') {
    if (!await hasValidAgentApproval(options.cwd, plan)) {
      throw new Error('CRITICAL agent execution requires a valid approval artifact. Run `aca task approve <task>` first.');
    }
  } else if (plan.approval.required && !options.confirmed) {
    throw new Error('Agent execution requires explicit confirmation. Re-run with --confirm.');
  }

  if (!options.preparation.ready) {
    throw new Error(`Agent execution blocked: ${options.preparation.blockers.join('; ') || 'capabilities are not ready'}`);
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const execution = await executeAgent(plan, { ...options, prompt });
    lastExecution = execution;

    if (useWorkspaceGuard && workspaceBefore) {
      const workspaceAfter = await snapshotWorkspace(options.cwd);
      const guard = guardWorkspaceChanges(workspaceBefore, workspaceAfter, plan.workspace);
      lastWorkspace = { before: workspaceBefore, after: workspaceAfter, guard };
      if (guard.status === 'blocked' || guard.status === 'unexpected') {
        const status: AgentAttemptStatus = attempt === maxAttempts ? 'max_attempts' : 'failed';
        if (writeEvidence) {
          await writeAgentAttemptEvidence(options.cwd, { attempt, startedAt: execution.startedAt, completedAt: execution.completedAt, execution, status });
        }
        if (guard.status === 'blocked' || attempt === maxAttempts) {
          const result: AgentRunResult = { execution, workspace: lastWorkspace, completed: false, attempts: attempt, status };
          if (writeEvidence) await writeAgentExecutionEvidence(options.cwd, result);
          return result;
        }
        prompt = createWorkspaceRepairPrompt(plan.description, guard);
        continue;
      }
    }

    if (!shouldVerify) {
      const result: AgentRunResult = {
        execution,
        workspace: lastWorkspace,
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
        const result: AgentRunResult = { execution, workspace: lastWorkspace, completed: false, attempts: attempt, status };
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
      const result: AgentRunResult = { execution, verification, workspace: lastWorkspace, completed: true, attempts: attempt, status: 'passed' };
      if (writeEvidence) {
        await writeAgentAttemptEvidence(options.cwd, { attempt, startedAt: execution.startedAt, completedAt: new Date().toISOString(), execution, verification, status: 'passed' });
        await writeAgentExecutionEvidence(options.cwd, result);
      }
      return result;
    }

    const status: AgentAttemptStatus = attempt === maxAttempts ? 'max_attempts' : 'failed';
    if (writeEvidence) await writeAgentAttemptEvidence(options.cwd, { attempt, startedAt: execution.startedAt, completedAt: new Date().toISOString(), execution, verification, status });
    if (attempt < maxAttempts) prompt = createRepairPrompt(plan.description, execution, verification);
  }

  const execution = lastExecution as AgentExecutionResult;
  const result: AgentRunResult = { execution, verification: lastVerification, workspace: lastWorkspace, completed: false, attempts: maxAttempts, status: 'max_attempts' };
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

function createWorkspaceRepairPrompt(task: string, guard: ReturnType<typeof guardWorkspaceChanges>): string {
  const failures = [...guard.blocked.map((path) => `禁止修改：${path}`), ...guard.unexpected.map((path) => `超出允许范围：${path}`)];
  return [
    '上一轮任务产生了工作区范围违规，请修复当前工作区，不要从头开始重做。',
    `任务：${task}`,
    '',
    '违规文件：',
    `- ${failures.join('\n- ')}`,
    '',
    '要求：撤销或移除违规变更，只修改任务允许范围内的文件，然后再次执行。',
  ].join('\n');
}
