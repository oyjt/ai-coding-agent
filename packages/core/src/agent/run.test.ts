import { strict as assert } from 'node:assert';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import type { AgentPlan } from './types.js';
import { runAgent } from './run.js';

function createPlan(): AgentPlan {
  return {
    description: 'test task',
    projectType: 'unknown',
    classification: {
      level: 'S',
      type: 'other',
      confidence: 1,
      reason: 'test',
      matchedRules: [],
      requiresSpec: false,
      requiresRollbackPlan: false,
      requiresSecurityReview: false,
      requiresFullVerification: false,
    },
    workflow: [],
    dependencies: { projectType: 'unknown', skills: [], mcp: [], cli: [] },
    skills: [],
    capabilities: [],
    verification: { spec: false, rollbackPlan: false, securityReview: false, fullVerification: false },
    verificationPlan: {
      taskLevel: 'S',
      projectType: 'unknown',
      packageManager: 'pnpm',
      commands: [{ id: 'lint', command: 'node', args: ['-e', 'process.exit(0)'], required: true, reason: 'test' }],
      manualGates: [],
    },
  };
}

function createOptions(cwd: string) {
  return {
    cwd,
    runtime: {
      name: 'test',
      sync: async () => undefined,
      execute: async () => ({ exitCode: 0, output: 'done' }),
    },
    permissions: { allow: [], deny: [] },
    preparation: { ready: true, blockers: [], capabilityContext: { ready: true, capabilities: [], blockers: [] } },
  };
}

test('runAgent verifies successful execution before completion', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'acai-run-'));
  await writeFile(join(cwd, 'package.json'), '{}');

  const result = await runAgent(createPlan(), createOptions(cwd));

  assert.equal(result.execution.exitCode, 0);
  assert.equal(result.verification?.passed, true);
  assert.equal(result.completed, true);
});

test('runAgent does not complete when verification fails', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'acai-run-'));
  await writeFile(join(cwd, 'package.json'), '{}');
  const plan = createPlan();
  plan.verificationPlan.commands[0].args = ['-e', 'process.exit(1)'];

  const result = await runAgent(plan, createOptions(cwd));

  assert.equal(result.execution.exitCode, 0);
  assert.equal(result.verification?.passed, false);
  assert.equal(result.completed, false);
});
