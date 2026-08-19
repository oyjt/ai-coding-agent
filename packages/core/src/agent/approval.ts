import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { AgentPlan } from './types.js';

export const AGENT_APPROVAL_FILE = '.claude/approval.json';

export interface AgentApprovalArtifact {
  version: 1;
  task: string;
  level: AgentPlan['classification']['level'];
  planHash: string;
  approvedAt: string;
}

export function getAgentPlanHash(plan: AgentPlan): string {
  const payload = {
    description: plan.description,
    projectType: plan.projectType,
    classification: plan.classification,
    workflow: plan.workflow,
    dependencies: plan.dependencies,
    skills: plan.skills,
    capabilities: plan.capabilities,
    verification: plan.verification,
    verificationPlan: plan.verificationPlan,
  };
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

export async function writeAgentApproval(cwd: string, plan: AgentPlan): Promise<string> {
  if (plan.classification.level !== 'CRITICAL') {
    throw new Error('Only CRITICAL tasks require an approval artifact.');
  }

  const directory = join(cwd, '.claude');
  await mkdir(directory, { recursive: true });
  const file = join(cwd, AGENT_APPROVAL_FILE);
  const artifact: AgentApprovalArtifact = {
    version: 1,
    task: plan.description,
    level: plan.classification.level,
    planHash: getAgentPlanHash(plan),
    approvedAt: new Date().toISOString(),
  };
  await writeFile(file, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
  return file;
}

export async function readAgentApproval(cwd: string): Promise<AgentApprovalArtifact | undefined> {
  try {
    const content = await readFile(join(cwd, AGENT_APPROVAL_FILE), 'utf8');
    return JSON.parse(content) as AgentApprovalArtifact;
  } catch {
    return undefined;
  }
}

export async function hasValidAgentApproval(cwd: string, plan: AgentPlan): Promise<boolean> {
  const artifact = await readAgentApproval(cwd);
  if (!artifact || artifact.version !== 1) return false;
  return artifact.level === 'CRITICAL' && artifact.task === plan.description && artifact.planHash === getAgentPlanHash(plan);
}
