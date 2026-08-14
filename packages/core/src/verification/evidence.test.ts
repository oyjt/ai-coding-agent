import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createVerificationEvidence, type VerificationPlan, type VerificationResult } from './index.js';

const plan: VerificationPlan = {
  taskLevel: 'M',
  projectType: 'node',
  packageManager: 'pnpm',
  commands: [
    { id: 'lint', command: 'pnpm', args: ['run', 'lint'], required: true, reason: 'lint' },
    { id: 'test', command: 'pnpm', args: ['run', 'test'], required: true, reason: 'test' },
  ],
  manualGates: [],
};

describe('createVerificationEvidence', () => {
  it('allows completion only when every required command passes', () => {
    const results: VerificationResult[] = [
      { id: 'lint', passed: true, skipped: false, output: 'ok' },
      { id: 'test', passed: true, skipped: false, output: 'ok' },
    ];
    const evidence = createVerificationEvidence(plan, results, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:01.000Z');
    assert.equal(evidence.passed, true);
    assert.equal(evidence.canComplete, true);
    assert.deepEqual(evidence.blockers, []);
  });

  it('blocks completion when a required command was not executed', () => {
    const results: VerificationResult[] = [{ id: 'lint', passed: true, skipped: false, output: 'ok' }];
    const evidence = createVerificationEvidence(plan, results, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:01.000Z');
    assert.equal(evidence.passed, false);
    assert.equal(evidence.canComplete, false);
    assert.ok(evidence.blockers.includes('验证未执行: test'));
  });

  it('keeps manual gates as blockers', () => {
    const gatedPlan = { ...plan, manualGates: ['完成安全审查'] };
    const results: VerificationResult[] = [
      { id: 'lint', passed: true, skipped: false, output: 'ok' },
      { id: 'test', passed: true, skipped: false, output: 'ok' },
    ];
    const evidence = createVerificationEvidence(gatedPlan, results, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:01.000Z');
    assert.equal(evidence.canComplete, false);
    assert.deepEqual(evidence.blockers, ['完成安全审查']);
  });
});
