import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { prepareAgent } from './prepare.js';
import type { AgentPlan } from './types.js';

function plan(): AgentPlan {
  return {
    description: 'test',
    projectType: 'node',
    classification: {
      level: 'S',
      type: 'feature',
      reasons: [],
      matchedRules: [],
      requiresSpec: false,
      requiresRollbackPlan: false,
      requiresSecurityReview: false,
      requiresFullVerification: false,
    },
    workflow: {
      name: 'test',
      taskLevel: 'S',
      steps: [],
      context: { taskLevel: 'S', taskType: 'feature', projectType: 'node' },
    },
    dependencies: { projectType: 'node', skills: [], mcp: [], cli: [] },
    skills: [],
    capabilities: [{ kind: 'skills', name: 'missing-skill', source: 'workflow', required: true }],
    verification: { spec: false, rollbackPlan: false, securityReview: false, fullVerification: false },
    verificationPlan: { taskLevel: 'S', projectType: 'node', packageManager: 'unknown', commands: [], manualGates: [] },
  };
}

test('prepareAgent blocks when a required capability is unavailable', async () => {
  const cwd = mkdtempSync(join(tmpdir(), 'aca-prepare-'));
  const result = await prepareAgent(plan(), { cwd });
  assert.equal(result.ready, false);
  assert.equal(result.installation, undefined);
  assert.equal(result.blockers.length, 1);
});

test('prepareAgent does not install capabilities unless explicitly requested', async () => {
  const cwd = mkdtempSync(join(tmpdir(), 'aca-prepare-'));
  const result = await prepareAgent(plan(), { cwd, install: false });
  assert.equal(result.ready, false);
  assert.equal(result.installation, undefined);
});
