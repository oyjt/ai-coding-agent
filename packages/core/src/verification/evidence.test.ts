import { describe, expect, it } from 'vitest';
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
    expect(evidence.passed).toBe(true);
    expect(evidence.canComplete).toBe(true);
    expect(evidence.blockers).toEqual([]);
  });

  it('blocks completion when a required command was not executed', () => {
    const results: VerificationResult[] = [{ id: 'lint', passed: true, skipped: false, output: 'ok' }];
    const evidence = createVerificationEvidence(plan, results, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:01.000Z');
    expect(evidence.passed).toBe(false);
    expect(evidence.canComplete).toBe(false);
    expect(evidence.blockers).toContain('验证未执行: test');
  });

  it('keeps manual gates as blockers', () => {
    const gatedPlan = { ...plan, manualGates: ['完成安全审查'] };
    const results: VerificationResult[] = [
      { id: 'lint', passed: true, skipped: false, output: 'ok' },
      { id: 'test', passed: true, skipped: false, output: 'ok' },
    ];
    const evidence = createVerificationEvidence(gatedPlan, results, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:01.000Z');
    expect(evidence.canComplete).toBe(false);
    expect(evidence.blockers).toEqual(['完成安全审查']);
  });
});
