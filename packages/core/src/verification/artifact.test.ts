import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { writeVerificationEvidence, VERIFICATION_FILE } from './artifact.js';

test('verification evidence is persisted as JSON under .claude', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'aca-verification-artifact-'));
  try {
    const evidence = {
      startedAt: '2026-01-01T00:00:00.000Z',
      completedAt: '2026-01-01T00:00:01.000Z',
      results: [{ id: 'lint' as const, passed: true, skipped: false, output: 'ok' }],
      passed: true,
      canComplete: true,
      blockers: [],
    };
    assert.equal(writeVerificationEvidence(cwd, evidence), VERIFICATION_FILE);
    const saved = JSON.parse(readFileSync(join(cwd, VERIFICATION_FILE), 'utf8'));
    assert.deepEqual(saved, evidence);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
