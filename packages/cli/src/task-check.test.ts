import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyTask } from '@ai-coding-agent/core';

test('task check classifies a security-sensitive feature as CRITICAL', () => {
  const result = classifyTask({ description: '新增 OAuth 登录功能' });
  assert.equal(result.type, 'feature');
  assert.equal(result.level, 'CRITICAL');
});

test('task check does not escalate a login page UI bug', () => {
  const result = classifyTask({ description: '修复登录页面按钮异常' });
  assert.equal(result.type, 'bugfix');
  assert.equal(result.level, 'M');
});

test('task check classifies documentation changes as S', () => {
  const result = classifyTask({ description: '修改首页文案' });
  assert.equal(result.type, 'docs');
  assert.equal(result.level, 'S');
});
