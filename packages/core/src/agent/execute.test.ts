import assert from 'node:assert/strict';
import test from 'node:test';
import type { PermissionsConfig } from '@ai-coding-agent/config';
import type { AgentPlan } from './types.js';
import { executeAgent } from './execute.js';

const permissions: PermissionsConfig = {
  permissions: { allow: ['Bash'], deny: ['Bash(rm -rf:*)'] },
};

const plan = {
  description: 'test task',
  projectType: 'node',
  classification: {
    type: 'feature',
    level: 'S',
    reasons: [],
    requiresSpec: false,
    requiresRollbackPlan: false,
    requiresSecurityReview: false,
    requiresFullVerification: false,
    matchedRules: [],
  },
  workflow: { name: 'feature', taskLevel: 'S', steps: [] },
  dependencies: { skills: [], mcp: [], cli: [] },
  skills: [],
  capabilities: [],
  verification: { spec: false, rollbackPlan: false, securityReview: false, fullVerification: false },
  verificationPlan: { taskLevel: 'S', projectType: 'node', packageManager: 'pnpm', commands: [], manualGates: [] },
} as unknown as AgentPlan;

const ready = {
  plan,
  readiness: { ready: true, installed: [], missing: [], unavailable: [], blockers: [] },
  capabilityContext: { ready: true, capabilities: [], blockers: [] },
  ready: true,
  blockers: [],
};

test('blocks execution when capabilities are not ready', async () => {
  await assert.rejects(
    () => executeAgent(plan, {
      cwd: process.cwd(),
      permissions,
      preparation: { ...ready, ready: false, blockers: ['missing required capability'] },
      runtime: { name: 'fake', sync: async () => ({ runtime: 'fake', files: [] }) },
    }),
    /Agent execution blocked/,
  );
});

test('executes through the selected runtime and preserves result', async () => {
  let receivedPrompt = '';
  const result = await executeAgent(plan, {
    cwd: process.cwd(),
    permissions,
    preparation: ready,
    runtime: {
      name: 'fake',
      sync: async () => ({ runtime: 'fake', files: [] }),
      execute: async (context) => {
        receivedPrompt = context.prompt;
        assert.deepEqual(context.permissions, permissions);
        return { exitCode: 0, output: 'done' };
      },
    },
    prompt: 'explicit prompt',
  });

  assert.equal(result.passed, true);
  assert.equal(result.exitCode, 0);
  assert.equal(result.output, 'done');
  assert.equal(receivedPrompt, 'explicit prompt');
});
