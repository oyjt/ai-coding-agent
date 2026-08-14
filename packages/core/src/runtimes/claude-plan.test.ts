import assert from 'node:assert/strict';
import test from 'node:test';
import { toClaudeAgentPlan } from './claude-plan.js';

test('toClaudeAgentPlan converts an AgentPlan to a stable runtime payload', () => {
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
  });

  assert.deepEqual(result, {
    version: 1,
    task: '新增 OAuth 登录',
    projectType: 'react',
    taskType: 'feature',
    taskLevel: 'CRITICAL',
    workflow: 'critical',
    skills: ['grill-me'],
    mcp: ['context7'],
    cli: ['gh'],
    verification: { spec: true, rollbackPlan: true, securityReview: true, fullVerification: true },
  });
});
