import type { ProjectType } from '@ai-coding-agent/config';
import type { TaskLevel, TaskType } from '../workflows/types.js';

export interface TaskInput {
  description: string;
  projectType?: ProjectType;
  filesChanged?: number;
  touches?: string[];
}

export interface TaskClassification {
  type: TaskType;
  level: TaskLevel;
  reasons: string[];
  matchedRules: string[];
  requiresSpec: boolean;
  requiresRollbackPlan: boolean;
  requiresSecurityReview: boolean;
  requiresFullVerification: boolean;
}
