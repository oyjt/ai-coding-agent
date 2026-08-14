import assert from 'node:assert/strict';
import test from 'node:test';
import { toClaudeAgentPlan } from './claude-plan.js';

test('toClaudeAgentPlan converts an AgentPlan to a stable runtime payload', () => {
  const verificationPlan = {
    taskLevel: 'CRITICAL' as const,
    projectType: 'react' as const,
    packageManager: 'pnpm' as const,
    commands: [{ id: 'lint' as const, command: 'pnpm', args: ['run', 'lint'], required: true, reason: '检查代码质量与静态规则。' }],
    manualGates: ['完成安全审查'],
  };
  const result = toClaudeAgentPlan({
    description: '新增 OAuth 登录',
    projectType: 'react',
    classification: {
      type: 'feature',
      level: 'CRITICAL',
      reasons: ['涉及认证机制'],
      matchedRules: ['authentication'],
      requiresSpec: true,
      requiresRollbackPlan: true,
      requiresSecurityReview: true,
      requiresFullVerification: true,
    },
    workflow: { name: 'critical', taskLevel: 'CRITICAL', taskType: 'feature', steps: [], context: { taskLevel: 'CRITICAL', taskType: 'feature', projectType: 'react' } },
    dependencies: { projectType: 'react', skills: ['grill-me'], mcp: ['context7'], cli: ['gh'] },
    skills: ['grill-me'],
    verification: { spec: true, rollbackPlan: true, securityReview: true, fullVerification: true },
    verificationPlan,
  });

  assert.deepEqual(result.verificationPlan, verificationPlan);
  assert.equal(result.taskLevel, 'CRITICAL');
  assert.deepEqual(result.skills, ['grill-me']);
});
