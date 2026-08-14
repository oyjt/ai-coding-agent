import assert from 'node:assert/strict';
import test from 'node:test';
import { createCapabilityInstallPlan } from './installer.js';
import type { CapabilityStatus } from './types.js';

function status(overrides: Partial<CapabilityStatus> = {}): CapabilityStatus {
  return {
    kind: 'skills',
    name: 'example',
    source: 'workflow',
    required: true,
    installed: false,
    available: true,
    ...overrides,
  };
}

test('creates an install plan for missing installable capabilities', () => {
  const plan = createCapabilityInstallPlan([
    status(),
    status({ name: 'installed', installed: true }),
    status({ name: 'optional', required: false }),
    status({ name: 'unavailable', available: false }),
  ]);

  assert.deepEqual(plan.installable.map((item) => item.name), ['example']);
  assert.deepEqual(plan.unavailable.map((item) => item.name), ['unavailable']);
});
