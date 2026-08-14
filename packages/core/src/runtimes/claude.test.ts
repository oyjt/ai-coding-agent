import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { claudeRuntime } from './claude.js';

test('claude runtime syncs permissions and agent plan', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'aca-claude-'));
  const result = await claudeRuntime.sync({
    cwd,
    permissions: { permissions: { allow: ['Read'], deny: ['Bash(rm -rf:*)'] } },
    plan: {
      description: '修复登录页面按钮异常',
      projectType: 'react',
      classification: {
        type: 'bugfix', level: 'M', reasons: [], matchedRules: [],
        requiresSpec: false, requiresRollbackPlan: false,
        requiresSecurityReview: false, requiresFullVerification: true,
      },
      workflow: { name: 'feature', taskLevel: 'M', taskType: 'bugfix', steps: [], context: { taskLevel: 'M', taskType: 'bugfix', projectType: 'react' } },
      dependencies: { projectType: 'react', skills: ['grill-me'], mcp: ['context7'], cli: ['gh'] },
      skills: ['grill-me'],
      verification: { spec: false, rollbackPlan: false, securityReview: false, fullVerification: true },
    },
  });

  assert.equal(result.files.length, 2);
  const settings = JSON.parse(await readFile(join(cwd, '.claude', 'settings.json'), 'utf8'));
  const plan = JSON.parse(await readFile(join(cwd, '.claude', 'agent-plan.json'), 'utf8'));
  assert.deepEqual(settings.permissions, { allow: ['Read'], deny: ['Bash(rm -rf:*)'] });
  assert.equal(plan.taskLevel, 'M');
  assert.deepEqual(plan.skills, ['grill-me']);
});
