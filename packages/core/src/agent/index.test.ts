import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createAgentPlan } from './index.js';

test('createAgentPlan combines classification, workflow, project dependencies and verification', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'aca-agent-'));
  try {
    mkdirSync(join(cwd, '.aca', 'workflows'), { recursive: true });
    writeFileSync(join(cwd, '.aca', 'workflows', 'feature.yaml'), `name: feature\ntask_level: M\nsteps:\n  - id: implement\n    skills: [test-driven-development]\n  - id: project\n    skills: [project-skills]\n  - id: verify\n    skills: [verification-before-completion]\n`);
    writeFileSync(join(cwd, 'package.json'), JSON.stringify({ scripts: { lint: 'echo lint', test: 'echo test', typecheck: 'echo typecheck' } }));
    writeFileSync(join(cwd, 'pnpm-lock.yaml'), 'lockfileVersion: 9.0\n');

    const plan = createAgentPlan('新增用户资料功能', {
      projectType: 'vue',
      cwd,
      config: {
        version: 1,
        dependencies: {
          common: { skills: ['grill-me'], mcp: ['context7'], cli: ['gh'] },
          vue: { skills: ['vue-best-practices'] },
        },
      },
    });

    assert.equal(plan.classification.level, 'M');
    assert.equal(plan.workflow.name, 'feature');
    assert.deepEqual(plan.skills, [
      'test-driven-development',
      'grill-me',
      'vue-best-practices',
      'verification-before-completion',
    ]);
    assert.deepEqual(plan.verification, {
      spec: false,
      rollbackPlan: false,
      securityReview: false,
      fullVerification: true,
    });
    assert.deepEqual(plan.verificationPlan.commands.map((item) => item.id), ['lint', 'test', 'typecheck']);
    assert.equal(plan.verificationPlan.packageManager, 'pnpm');
    assert.deepEqual(plan.dependencies.mcp, ['context7']);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
