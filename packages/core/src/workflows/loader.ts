import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import type { WorkflowDefinition } from './types.js';

export function loadWorkflow(name: string, cwd = process.cwd()): WorkflowDefinition {
  const path = join(cwd, '.aca', 'workflows', `${name}.yaml`);
  if (!existsSync(path)) throw new Error(`Workflow 不存在: ${name}`);
  return normalizeWorkflow(parse(readFileSync(path, 'utf8')) as WorkflowDefinition);
}

export function listWorkflows(cwd = process.cwd()): string[] {
  const directory = join(cwd, '.aca', 'workflows');
  if (!existsSync(directory)) return [];
  return readdirSync(directory)
    .filter((name) => name.endsWith('.yaml') || name.endsWith('.yml'))
    .map((name) => name.replace(/\.ya?ml$/, ''))
    .sort();
}

function normalizeWorkflow(workflow: WorkflowDefinition): WorkflowDefinition {
  if (!workflow?.name) throw new Error('Workflow 缺少 name');
  if (!workflow.taskLevel) throw new Error(`Workflow ${workflow.name} 缺少 task_level`);
  if (!Array.isArray(workflow.steps) || workflow.steps.length === 0) {
    throw new Error(`Workflow ${workflow.name} 没有 steps`);
  }
  return {
    ...workflow,
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
