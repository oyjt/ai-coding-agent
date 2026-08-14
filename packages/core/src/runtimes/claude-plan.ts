import type { AgentPlan } from '../agent/types.js';

export interface ClaudeAgentPlan {
  version: 1;
  task: string;
  projectType: AgentPlan['projectType'];
  taskType: AgentPlan['classification']['type'];
  taskLevel: AgentPlan['classification']['level'];
  workflow: string;
  skills: string[];
  mcp: string[];
  cli: string[];
  verification: AgentPlan['verification'];
}

export function toClaudeAgentPlan(plan: AgentPlan): ClaudeAgentPlan {
  return {
    version: 1,
    task: plan.description,
    projectType: plan.projectType,
    taskType: plan.classification.type,
    taskLevel: plan.classification.level,
    workflow: plan.workflow.name,
    skills: plan.skills,
    mcp: plan.dependencies.mcp ?? [],
    cli: plan.dependencies.cli ?? [],
    verification: plan.verification,
  };
}
