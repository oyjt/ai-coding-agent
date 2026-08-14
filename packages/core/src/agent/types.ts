import type { ProjectType, ResolvedDependencies } from '@ai-coding-agent/config';
import type { TaskClassification } from '../tasks/types.js';
import type { ResolvedWorkflow } from '../workflows/types.js';
import type { VerificationPlan } from '../verification/index.js';
import type { CapabilityRequirement } from '../capabilities/index.js';

export interface AgentPlan {
  description: string;
  projectType: ProjectType;
  classification: TaskClassification;
  workflow: ResolvedWorkflow;
  dependencies: ResolvedDependencies;
  skills: string[];
  capabilities: CapabilityRequirement[];
  verification: VerificationGates;
  verificationPlan: VerificationPlan;
}

export interface VerificationGates {
  spec: boolean;
  rollbackPlan: boolean;
  securityReview: boolean;
  fullVerification: boolean;
}
