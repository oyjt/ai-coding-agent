import type { ProjectType } from '@ai-coding-agent/config';

export type TaskLevel = 'S' | 'M' | 'L' | 'CRITICAL';
export type TaskType = 'feature' | 'bugfix' | 'refactor' | 'docs' | 'config' | 'unknown';

export interface WorkflowStep {
  id: string;
  skills: string[];
  required: boolean;
  description?: string;
}

export interface WorkflowDefinition {
  name: string;
  taskLevel: TaskLevel;
  taskType?: TaskType;
  steps: WorkflowStep[];
}

export interface WorkflowContext {
  taskLevel: TaskLevel;
  taskType: TaskType;
  projectType?: ProjectType;
}

export interface ResolvedWorkflow extends WorkflowDefinition {
  context: WorkflowContext;
}

export const TASK_LEVELS: TaskLevel[] = ['S', 'M', 'L', 'CRITICAL'];
