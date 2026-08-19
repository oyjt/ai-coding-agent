import { strict as assert } from 'node:assert';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import test from 'node:test';
import type { AgentPlan } from './types.js';
import { runAgent } from './run.js';
import type { RuntimeAdapter } from '../runtimes/types.js';
import type { PermissionsConfig } from '@ai-coding-agent/config';
import type { AgentPreparationResult } from './prepare.js';

const execFileAsync = promisify(execFile);

function createPlan(allowedPaths: string[] = []): AgentPlan {
  return {
    description: 'workspace test',
    projectType: 'node',
    classification: { level: 'S', type: 'feature', reasons: [], matchedRules: [], requiresSpec: false, requiresRollbackPlan: false, requiresSecurityReview: false, requiresFullVerification: false },
    workflow: { name: 'test', taskLevel: 'S', taskType: 'feature', steps: [], context: { taskLevel: 'S', taskType: 'feature', projectType: 'node' } },
    dependencies: { projectType: 'node', skills: [], mcp: [], cli: [] },
    skills: [],
    capabilities: [],
    verification: { spec: false, rollbackPlan: false, securityReview: false, fullVerification: false },
    verificationPlan: { taskLevel: 'S', projectType: 'node', packageManager: 'pnpm', commands: [{ id: 'verify', command: 'node', args: ['-e', 'process.exit(0)'], required: true, reason: 'test' }], manualGates: [] },
    approval: { required: false, confirmed: false, status: 'not_required' },
    workspace: { allowedPaths },
  };
}

async function createRepo(): Promise<string> {
  const cwd = await mkdtemp(join(tmpdir(), 'acai-workspace-'));
  await execFileAsync('git', ['init'], { cwd });
  await writeFile(join(cwd, 'package.json'), '{}');
  return cwd;
}

function createOptions(cwd: string, plan: AgentPlan, execute: RuntimeAdapter['execute']) {
  const permissions: PermissionsConfig = { permissions: { allow: [], deny: [] } };
  const preparation: AgentPreparationResult = { plan, readiness: { ready: true, installed: [], missing: [], unavailable: [], blockers: [] }, capabilityContext: { ready: true, capabilities: [], blockers: [] }, ready: true, blockers: [] };
  const runtime: RuntimeAdapter = { name: 'test', sync: async () => ({ runtime: 'test', files: [] }), execute };
  return { cwd, plan, runtime, permissions, preparation };
}

test('runAgent records allowed workspace changes and completes', async () => {
  const cwd = await createRepo();
  const plan = createPlan(['src/**']);
  const result = await runAgent(plan, createOptions(cwd, plan, async () => {
    await execFileAsync('mkdir', ['-p', 'src'], { cwd });
    await writeFile(join(cwd, 'src', 'allowed.ts'), 'export {}\n');
    return { exitCode: 0, output: 'created allowed file' };
  }));

  assert.equal(result.completed, true);
  assert.equal(result.workspace?.guard.status, 'allowed');
  assert.deepEqual(result.workspace?.guard.unexpected, []);
  assert.equal(await readFile(join(cwd, 'src', 'allowed.ts'), 'utf8'), 'export {}\n');
});

test('runAgent blocks protected workspace changes', async () => {
  const cwd = await createRepo();
  const plan = createPlan();
  const result = await runAgent(plan, createOptions(cwd, plan, async () => {
    await execFileAsync('mkdir', ['-p', '.github/workflows'], { cwd });
    await writeFile(join(cwd, '.github/workflows/release.yml'), 'name: release\n');
    return { exitCode: 0, output: 'created workflow' };
  }));

  assert.equal(result.completed, false);
  assert.equal(result.workspace?.guard.status, 'blocked');
  assert.deepEqual(result.workspace?.guard.blocked, ['.github/workflows/release.yml']);
});
