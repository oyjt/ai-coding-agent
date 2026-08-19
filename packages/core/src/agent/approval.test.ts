import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { hasValidAgentApproval, readAgentApproval, writeAgentApproval } from './approval.js';
import type { AgentPlan } from './types.js';

function criticalPlan(): AgentPlan {
  return {
    description: '修改支付流程',
    projectType: 'node',
    classification: {
      level: 'CRITICAL', type: 'feature', reasons: ['支付'], matchedRules: ['money'],
      requiresSpec: true, requiresRollbackPlan: true, requiresSecurityReview: true, requiresFullVerification: true,
    },
    workflow: { name: 'critical', taskLevel: 'CRITICAL', taskType: 'feature', steps: [], context: { taskLevel: 'CRITICAL', taskType: 'feature', projectType: 'node' } },
    dependencies: { projectType: 'node', skills: [], mcp: [], cli: [] },
    skills: [], capabilities: [],
    verification: { spec: true, rollbackPlan: true, securityReview: true, fullVerification: true },
    verificationPlan: { taskLevel: 'CRITICAL', projectType: 'node', packageManager: 'unknown', commands: [], manualGates: [] },
    approval: { required: true, confirmed: false, status: 'required' },
  };
}

test('approval artifact is bound to the exact task plan', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'aca-approval-'));
  const plan = criticalPlan();
  const file = await writeAgentApproval(cwd, plan);

  assert.equal(file, join(cwd, '.claude', 'approval.json'));
  assert.equal(await hasValidAgentApproval(cwd, plan), true);
  assert.equal((await readAgentApproval(cwd))?.level, 'CRITICAL');
  assert.equal((await readFile(file, 'utf8')).includes('planHash'), true);

  const changed = { ...plan, description: '修改退款流程' };
  assert.equal(await hasValidAgentApproval(cwd, changed), false);
});

test('approval artifact cannot be created for non-critical tasks', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'aca-approval-'));
  const plan = { ...criticalPlan(), classification: { ...criticalPlan().classification, level: 'L' as const } };
  await assert.rejects(() => writeAgentApproval(cwd, plan), /Only CRITICAL tasks require/);
});
