import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { claudeRuntime } from './claude.js';

test('claude runtime syncs permissions, agent plan, and context', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'aca-claude-'));
  const verificationPlan = {
    taskLevel: 'M' as const,
    projectType: 'react' as const,
    packageManager: 'pnpm' as const,
    commands: [{ id: 'lint' as const, command: 'pnpm', args: ['run', 'lint'], required: true, reason: '检查代码质量与静态规则。' }],
    manualGates: [],
  };
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
      capabilities: [],
      verification: { spec: false, rollbackPlan: false, securityReview: false, fullVerification: true },
      verificationPlan,
      approval: { required: false, confirmed: false, status: 'not_required' },
    },
    capabilities: {
      ready: true,
      capabilities: [{ kind: 'skills', name: 'grill-me', source: 'workflow', required: true }],
      blockers: [],
    },
  });

  assert.equal(result.files.length, 4);
  const settings = JSON.parse(await readFile(join(cwd, '.claude', 'settings.json'), 'utf8'));
  const plan = JSON.parse(await readFile(join(cwd, '.claude', 'agent-plan.json'), 'utf8'));
  const capabilities = JSON.parse(await readFile(join(cwd, '.claude', 'capabilities.json'), 'utf8'));
  const context = await readFile(join(cwd, '.claude', 'agent-context.md'), 'utf8');
  assert.deepEqual(settings.permissions, { allow: ['Read'], deny: ['Bash(rm -rf:*)'] });
  assert.equal(plan.taskLevel, 'M');
  assert.deepEqual(plan.skills, ['grill-me']);
  assert.deepEqual(plan.verificationPlan, verificationPlan);
  assert.match(context, /# ACA Agent Context/);
  assert.match(context, /修复登录页面按钮异常/);
  assert.match(context, /任务级别：M/);
  assert.match(context, /声称完成前必须执行真实验证/);
});
