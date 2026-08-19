import type { ProjectType, ResolvedDependencies } from '@ai-coding-agent/config';
import type { TaskClassification } from '../tasks/types.js';
import type { ResolvedWorkflow } from '../workflows/types.js';
import type { VerificationPlan } from '../verification/index.js';
import type { CapabilityRequirement } from '../capabilities/index.js';
import type { WorkspaceGuardResult, WorkspaceSnapshot } from '../workspace/index.js';

export type AgentApprovalStatus = 'not_required' | 'required' | 'confirmed';

export interface AgentApproval {
  required: boolean;
  confirmed: boolean;
  status: AgentApprovalStatus;
}

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
  approval: AgentApproval;
  workspace?: {
    allowedPaths: string[];
    protectedPaths?: string[];
  };
}

export interface VerificationGates {
  spec: boolean;
  rollbackPlan: boolean;
  securityReview: boolean;
  fullVerification: boolean;
}

export interface AgentWorkspaceEvidence {
  before: WorkspaceSnapshot;
  after: WorkspaceSnapshot;
  guard: WorkspaceGuardResult;
}
