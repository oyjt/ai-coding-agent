import test from 'node:test';
import assert from 'node:assert/strict';
import { createCapabilityContext } from './context.js';
import type { CapabilityStatus } from './types.js';

const status = (overrides: Partial<CapabilityStatus> = {}): CapabilityStatus => ({
  kind: 'skills',
  name: 'brainstorming',
  source: 'workflow',
  required: true,
  installed: true,
  available: true,
  ...overrides,
});

test('createCapabilityContext exposes only installed and available capabilities', () => {
  const result = createCapabilityContext([
    status(),
    status({ name: 'missing', installed: false, available: true }),
    status({ name: 'unavailable', installed: false, available: false }),
  ]);

  assert.equal(result.ready, false);
  assert.deepEqual(result.capabilities.map((item) => item.name), ['brainstorming']);
  assert.deepEqual(result.blockers, [
    'skills:missing — 未就绪',
    'skills:unavailable — 未就绪',
  ]);
});

test('optional unavailable capabilities do not block readiness', () => {
  const result = createCapabilityContext([
    status({ required: false, installed: false, available: false }),
  ]);

  assert.equal(result.ready, true);
  assert.deepEqual(result.capabilities, []);
  assert.deepEqual(result.blockers, []);
});
