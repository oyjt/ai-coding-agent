import assert from 'node:assert/strict';
import test from 'node:test';
import { guardWorkspaceChanges } from './guard.js';
import type { WorkspaceSnapshot } from './types.js';

function snapshot(overrides: Partial<WorkspaceSnapshot> = {}): WorkspaceSnapshot {
  return { tracked: [], modified: [], untracked: [], deleted: [], capturedAt: '2026-01-01T00:00:00.000Z', ...overrides };
}

test('allows new changes inside configured paths', () => {
  const result = guardWorkspaceChanges(snapshot(), snapshot({ modified: ['src/auth/login.ts'] }), { allowedPaths: ['src/auth/**'] });
  assert.equal(result.status, 'allowed');
  assert.deepEqual(result.unexpected, []);
  assert.deepEqual(result.blocked, []);
});

test('marks changes outside configured paths as unexpected', () => {
  const result = guardWorkspaceChanges(snapshot(), snapshot({ modified: ['README.md'] }), { allowedPaths: ['src/**'] });
  assert.equal(result.status, 'unexpected');
  assert.deepEqual(result.unexpected, ['README.md']);
});

test('blocks protected paths', () => {
  const result = guardWorkspaceChanges(snapshot(), snapshot({ untracked: ['.github/workflows/release.yml'] }));
  assert.equal(result.status, 'blocked');
  assert.deepEqual(result.blocked, ['.github/workflows/release.yml']);
});

test('does not flag pre-existing dirty files', () => {
  const before = snapshot({ modified: ['src/index.ts'] });
  const after = snapshot({ modified: ['src/index.ts'] });
  const result = guardWorkspaceChanges(before, after, { allowedPaths: ['src/**'] });
  assert.equal(result.status, 'allowed');
  assert.deepEqual(result.changes, []);
});

test('detects a pre-existing modified file that disappears', () => {
  const result = guardWorkspaceChanges(snapshot({ modified: ['src/index.ts'] }), snapshot(), { allowedPaths: ['src/**'] });
  assert.equal(result.status, 'unexpected');
  assert.deepEqual(result.unexpected, ['src/index.ts']);
});
