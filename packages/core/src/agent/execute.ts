import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { PermissionsConfig } from '@ai-coding-agent/config';
import type { AgentPlan } from './types.js';
import type { RuntimeAdapter } from '../runtimes/types.js';
import type { AgentPreparationResult } from './prepare.js';

export interface AgentExecutionOptions {
  cwd: string;
  runtime: RuntimeAdapter;
  permissions: PermissionsConfig;
  preparation: AgentPreparationResult;
  prompt?: string;
}

export interface AgentExecutionResult {
  runtime: string;
  startedAt: string;
  completedAt: string;
  exitCode: number;
  passed: boolean;
  output: string;
}

/**
 * Execute a prepared task through the selected runtime. Execution is blocked
 * unless capability preparation succeeded.
 */
export async function executeAgent(
  plan: AgentPlan,
  options: AgentExecutionOptions,
): Promise<AgentExecutionResult> {
  if (!options.preparation.ready) {
    throw new Error(`Agent execution blocked: ${options.preparation.blockers.join('; ') || 'capabilities are not ready'}`);
  }

  if (!options.runtime.execute) {
    throw new Error(`Runtime does not support execution: ${options.runtime.name}`);
  }

  const startedAt = new Date().toISOString();
  const contextFile = join(options.cwd, '.claude', 'agent-context.md');
  const context = await readFile(contextFile, 'utf8').catch(() => '');
  const prompt = options.prompt?.trim() || [
    context,
    '',
    `任务：${plan.description}`,
    '',
    '完成任务后必须执行真实验证，并根据验证结果决定是否可以声明完成。',
  ].join('\n');

  const result = await options.runtime.execute({
    cwd: options.cwd,
    permissions: options.permissions,
    plan,
    capabilities: options.preparation.capabilityContext,
    prompt,
  });

  return {
    runtime: options.runtime.name,
    startedAt,
    completedAt: new Date().toISOString(),
    exitCode: result.exitCode,
    passed: result.exitCode === 0,
    output: result.output,
  };
}
