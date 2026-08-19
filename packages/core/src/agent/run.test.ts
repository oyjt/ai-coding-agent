import { strict as assert } from 'node:assert';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import type { AgentPlan } from './types.js';
import { runAgent } from './run.js';
import type { RuntimeAdapter } from '../runtimes/types.js';
import type { PermissionsConfig } from '@ai-coding-agent/config';
import type { AgentPreparationResult } from './prepare.js';

function createPlan(): AgentPlan {
  return {
    description: 'test task',
    projectType: 'unknown',
    classification: {
      level: 'S',
      type: 'unknown',
      reasons: ['test'],
      matchedRules: [],
      requiresSpec: false,
      requiresRollbackPlan: false,
      requiresSecurityReview: false,
      requiresFullVerification: false,
    },
    workflow: {
      name: 'test',
      taskLevel: 'S',
      taskType: 'unknown',
      steps: [],
      context: { taskLevel: 'S', taskType: 'unknown', projectType: 'unknown' },
    },
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

function createOptions(cwd: string, plan: AgentPlan) {
  const runtime: RuntimeAdapter = {
    name: 'test',
    sync: async () => ({ runtime: 'test', files: [] }),
    execute: async () => ({ exitCode: 0, output: 'done' }),
  };
  const permissions: PermissionsConfig = { permissions: { allow: [], deny: [] } };
  const preparation: AgentPreparationResult = {
    plan,
    readiness: { ready: true, installed: [], missing: [], unavailable: [], blockers: [] },
    capabilityContext: { ready: true, capabilities: [], blockers: [] },
    ready: true,
    blockers: [],
  };
  return { cwd, plan, runtime, permissions, preparation };
}

test('runAgent verifies successful execution before completion', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'acai-run-'));
  await writeFile(join(cwd, 'package.json'), '{}');
  const plan = createPlan();

  const result = await runAgent(plan, createOptions(cwd, plan));

  assert.equal(result.execution.exitCode, 0);
  assert.equal(result.verification?.passed, true);
  assert.equal(result.completed, true);
  assert.equal(result.attempts, 1);
  assert.equal(result.status, 'passed');
});

test('runAgent repairs once after verification failure and completes', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'acai-run-'));
  await writeFile(join(cwd, 'package.json'), '{}');
  const plan = createPlan();
  const marker = join(cwd, '.verification-repaired');
  plan.verificationPlan.commands[0].args = [
    '-e',
    `const fs=require('node:fs');if(fs.existsSync(${JSON.stringify(marker)}))process.exit(0);fs.writeFileSync(${JSON.stringify(marker)},'1');process.exit(1)`,
  ];
  let executions = 0;
  const options = createOptions(cwd, plan);
  options.runtime.execute = async () => {
    executions += 1;
    return { exitCode: 0, output: executions === 1 ? 'initial' : 'repaired' };
  };

  const result = await runAgent(plan, { ...options, maxAttempts: 3 });
  const attempt1 = JSON.parse(await readFile(join(cwd, '.claude', 'attempts', '1.json'), 'utf8')) as { status: string };
  const attempt2 = JSON.parse(await readFile(join(cwd, '.claude', 'attempts', '2.json'), 'utf8')) as { status: string };

  assert.equal(executions, 2);
  assert.equal(result.completed, true);
  assert.equal(result.attempts, 2);
  assert.equal(result.status, 'passed');
  assert.equal(attempt1.status, 'failed');
  assert.equal(attempt2.status, 'passed');
});

test('runAgent stops after maxAttempts when verification keeps failing', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'acai-run-'));
  await writeFile(join(cwd, 'package.json'), '{}');
  const plan = createPlan();
  plan.verificationPlan.commands[0].args = ['-e', 'process.exit(1)'];
  let executions = 0;
  const options = createOptions(cwd, plan);
  options.runtime.execute = async () => {
    executions += 1;
    return { exitCode: 0, output: `attempt ${executions}` };
  };

  const result = await runAgent(plan, { ...options, maxAttempts: 2 });
  const attempt2 = JSON.parse(await readFile(join(cwd, '.claude', 'attempts', '2.json'), 'utf8')) as { status: string };

  assert.equal(executions, 2);
  assert.equal(result.completed, false);
  assert.equal(result.attempts, 2);
  assert.equal(result.status, 'max_attempts');
  assert.equal(attempt2.status, 'max_attempts');
});
