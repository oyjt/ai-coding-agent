import { strict as assert } from 'node:assert';
import test from 'node:test';
import { resolveWorkspaceScope } from './scope.js';

test('feature tasks get source, tests and common project files', () => {
  const scope = resolveWorkspaceScope({ taskType: 'feature', projectType: 'node' });
  assert.equal(scope.source, 'auto');
  assert.ok(scope.allowedPaths.includes('src/**'));
  assert.ok(scope.allowedPaths.includes('tests/**'));
  assert.ok(scope.allowedPaths.includes('package.json'));
});

test('docs tasks are scoped to documentation files', () => {
  const scope = resolveWorkspaceScope({ taskType: 'docs', projectType: 'node' });
  assert.deepEqual(scope.allowedPaths, ['README.md', 'docs/**']);
});

test('explicit scope overrides automatic scope', () => {
  const scope = resolveWorkspaceScope({ taskType: 'feature', projectType: 'node', explicitAllowedPaths: ['src/auth/**'] });
  assert.deepEqual(scope.allowedPaths, ['src/auth/**']);
  assert.equal(scope.source, 'explicit');
});

test('protected paths are always present', () => {
  const scope = resolveWorkspaceScope({ taskType: 'feature', projectType: 'node' });
  assert.ok(scope.protectedPaths.includes('.git/**'));
  assert.ok(scope.protectedPaths.includes('.github/workflows/**'));
  assert.ok(scope.protectedPaths.includes('.claude/approval.json'));
});
