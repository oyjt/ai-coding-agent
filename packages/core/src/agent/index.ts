import type { AgentConfig, ProjectType, ResolvedDependencies } from '@ai-coding-agent/config';
import { resolveDependencies } from '@ai-coding-agent/config';
import { classifyTask, type TaskInput } from '../tasks/index.js';
import { getRequiredSkills, resolveWorkflow } from '../workflows/index.js';
import type { AgentPlan, VerificationGates } from './types.js';

export function createAgentPlan(
  description: string,
  options: {
    projectType: ProjectType;
    config: AgentConfig;
    cwd?: string;
    task?: Omit<TaskInput, 'description'>;
  },
): AgentPlan {
  const cwd = options.cwd ?? process.cwd();
  const classification = classifyTask({ description, ...options.task });
  const workflow = resolveWorkflow(
    {
      taskLevel: classification.level,
      taskType: classification.type,
      projectType: options.projectType,
    },
    cwd,
  );
  const dependencies = resolveDependencies(options.config, options.projectType);
  const skills = getRequiredSkills(workflow, dependencies.skills ?? []);
  const verification = getVerificationGates(classification);

  return {
    description,
    projectType: options.projectType,
    classification,
    workflow,
    dependencies,
    skills,
    verification,
  };
}

function getVerificationGates(classification: AgentPlan['classification']): VerificationGates {
  return {
    spec: classification.requiresSpec,
    rollbackPlan: classification.requiresRollbackPlan,
    securityReview: classification.requiresSecurityReview,
    fullVerification: classification.requiresFullVerification,
  };
}

export type { AgentPlan, VerificationGates } from './types.js';
