import type { ProjectType } from '@ai-coding-agent/config';
import { loadWorkflow } from './loader.js';
import type { ResolvedWorkflow, TaskLevel, TaskType, WorkflowContext, WorkflowDefinition } from './types.js';

const DEFAULT_WORKFLOWS: Record<TaskLevel, string> = {
  S: 'minimal',
  M: 'feature',
  L: 'large-change',
  CRITICAL: 'critical',
};

export function resolveWorkflow(
  context: WorkflowContext,
  cwd = process.cwd(),
): ResolvedWorkflow {
  const name = DEFAULT_WORKFLOWS[context.taskLevel];
  const workflow = loadWorkflow(name, cwd);
  if (workflow.taskLevel !== context.taskLevel) {
    throw new Error(`Workflow ${name} 的 task_level 为 ${workflow.taskLevel}，与任务等级 ${context.taskLevel} 不匹配`);
  }
  if (workflow.taskType && workflow.taskType !== context.taskType) {
    throw new Error(`Workflow ${name} 不适用于任务类型 ${context.taskType}`);
  }
  return { ...workflow, context };
}

export function resolveWorkflowByName(
  name: string,
  context: WorkflowContext,
  cwd = process.cwd(),
): ResolvedWorkflow {
  const workflow = loadWorkflow(name, cwd);
  return { ...workflow, context };
}

export function defaultWorkflowName(level: TaskLevel): string {
  return DEFAULT_WORKFLOWS[level];
}

export function isCriticalTask(context: WorkflowContext): boolean {
  return context.taskLevel === 'CRITICAL';
}

export function getRequiredSkills(workflow: WorkflowDefinition, projectSkills: string[] = []): string[] {
  const skills = workflow.steps
    .filter((step) => step.required)
    .flatMap((step) => step.skills.flatMap((skill) => skill === 'project-skills' ? projectSkills : [skill]));
  return [...new Set(skills)];
}
