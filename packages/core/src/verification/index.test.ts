import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createVerificationPlan } from './index.js';

test('S 级任务只要求 lint', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'aca-verification-'));
  try {
    writeFileSync(join(cwd, 'package.json'), JSON.stringify({ scripts: { lint: 'echo lint', test: 'echo test', typecheck: 'echo typecheck', build: 'echo build' } }));
    const plan = createVerificationPlan({ cwd, taskLevel: 'S', projectType: 'vue', packageManager: 'pnpm' });
    assert.deepEqual(plan.commands.map((item) => item.id), ['lint']);
    assert.deepEqual(plan.manualGates, []);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('M 级任务要求 lint、test、typecheck', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'aca-verification-'));
  try {
    writeFileSync(join(cwd, 'package.json'), JSON.stringify({ scripts: { lint: 'echo lint', test: 'echo test', typecheck: 'echo typecheck' } }));
    const plan = createVerificationPlan({ cwd, taskLevel: 'M', projectType: 'react', packageManager: 'pnpm' });
    assert.deepEqual(plan.commands.map((item) => item.id), ['lint', 'test', 'typecheck']);
    assert.deepEqual(plan.commands[0]?.args, ['run', 'lint']);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('L 级任务增加 build，并记录回滚审查门禁', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'aca-verification-'));
  try {
    writeFileSync(join(cwd, 'package.json'), JSON.stringify({ scripts: { lint: 'echo lint', test: 'echo test', typecheck: 'echo typecheck', build: 'echo build' } }));
    const plan = createVerificationPlan({ cwd, taskLevel: 'L', projectType: 'react-native', packageManager: 'pnpm' });
    assert.deepEqual(plan.commands.map((item) => item.id), ['lint', 'test', 'typecheck', 'build']);
    assert.equal(plan.manualGates.includes('完成影响范围与回滚方案审查'), true);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('缺失验证脚本会进入 manual gates，而不是伪造通过', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'aca-verification-'));
  try {
    writeFileSync(join(cwd, 'package.json'), JSON.stringify({ scripts: { lint: 'echo lint' } }));
    const plan = createVerificationPlan({ cwd, taskLevel: 'M', projectType: 'node', packageManager: 'pnpm' });
    assert.deepEqual(plan.commands.map((item) => item.id), ['lint']);
    assert.equal(plan.manualGates.some((item) => item.includes('test, typecheck')), true);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
