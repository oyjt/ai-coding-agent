import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyTask } from './classifier.js';

const cases = [
  ['新增 OAuth 登录功能', 'feature', 'CRITICAL'],
  ['增加 RBAC 权限校验', 'feature', 'CRITICAL'],
  ['接入第三方支付', 'feature', 'CRITICAL'],
  ['执行数据库迁移并删除旧字段', 'unknown', 'CRITICAL'],
  ['重构应用架构', 'refactor', 'L'],
  ['修改跨模块共享状态', 'unknown', 'L'],
  ['调整组件实现', 'unknown', 'L'],
  ['新增用户头像上传功能', 'feature', 'M'],
  ['修复登录页面按钮异常', 'bugfix', 'CRITICAL'],
  ['修改组件逻辑', 'unknown', 'M'],
  ['修改首页文案', 'docs', 'S'],
  ['补充函数注释', 'docs', 'S'],
  ['修改开发环境配置', 'config', 'S'],
] as const;

for (const [description, type, level] of cases) {
  test(`${level}: ${description}`, () => {
    const result = classifyTask({ description, filesChanged: description === '调整组件实现' ? 6 : undefined });
    assert.equal(result.type, type);
    assert.equal(result.level, level);
  });
}

test('CRITICAL requires all safety gates', () => {
  const result = classifyTask({ description: '新增 OAuth 登录功能' });
  assert.equal(result.requiresSpec, true);
  assert.equal(result.requiresRollbackPlan, true);
  assert.equal(result.requiresSecurityReview, true);
  assert.equal(result.requiresFullVerification, true);
});

test('L requires spec and full verification', () => {
  const result = classifyTask({ description: '重构应用架构' });
  assert.equal(result.requiresSpec, true);
  assert.equal(result.requiresFullVerification, true);
  assert.equal(result.requiresRollbackPlan, false);
});
