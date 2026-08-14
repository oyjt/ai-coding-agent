import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import type { WorkflowDefinition } from './types.js';

type RawWorkflow = Omit<WorkflowDefinition, 'taskLevel' | 'taskType'> & {
  taskLevel?: WorkflowDefinition['taskLevel'];
  taskType?: WorkflowDefinition['taskType'];
  task_level?: WorkflowDefinition['taskLevel'];
  task_type?: WorkflowDefinition['taskType'];
  description?: string;
};

export function loadWorkflow(name: string, cwd = process.cwd()): WorkflowDefinition {
  const path = join(cwd, '.aca', 'workflows', `${name}.yaml`);
  if (!existsSync(path)) throw new Error(`Workflow 不存在: ${name}`);
  return normalizeWorkflow(parse(readFileSync(path, 'utf8')) as RawWorkflow);
}

export function listWorkflows(cwd = process.cwd()): string[] {
  const directory = join(cwd, '.aca', 'workflows');
  if (!existsSync(directory)) return [];
  return readdirSync(directory)
    .filter((name) => name.endsWith('.yaml') || name.endsWith('.yml'))
    .map((name) => name.replace(/\.ya?ml$/, ''))
    .sort();
}

function normalizeWorkflow(workflow: RawWorkflow): WorkflowDefinition {
  const taskLevel = workflow.taskLevel ?? workflow.task_level;
  const taskType = workflow.taskType ?? workflow.task_type;
  if (!workflow?.name) throw new Error('Workflow 缺少 name');
  if (!taskLevel) throw new Error(`Workflow ${workflow.name} 缺少 task_level`);
  if (!Array.isArray(workflow.steps) || workflow.steps.length === 0) {
    throw new Error(`Workflow ${workflow.name} 没有 steps`);
  }
  return {
    name: workflow.name,
    taskLevel,
    ...(taskType ? { taskType } : {}),
    ...(workflow.description ? { description: workflow.description } : {}),
    steps: workflow.steps.map((step) => {
      const skill = (step as typeof step & { skill?: string }).skill;
      return {
        ...step,
        skills: step.skills ?? (skill ? [skill] : []),
        required: step.required !== false,
      };
    }),
  };
}
