import test from 'node:test';
import assert from 'node:assert/strict';
import { getCapabilityReadiness } from './readiness.js';

const capability = (name: string, installed: boolean, available = true) => ({
  kind: 'skills' as const,
  name,
  source: 'workflow' as const,
  required: true,
  installed,
  available,
});

test('capability readiness is ready when all required capabilities are installed', () => {
  const result = getCapabilityReadiness([
    capability('brainstorming', true),
    capability('tdd', true),
  ]);
  assert.equal(result.ready, true);
  assert.equal(result.blockers.length, 0);
  assert.equal(result.installed.length, 2);
});

test('missing installable capabilities block execution', () => {
  const result = getCapabilityReadiness([
    capability('brainstorming', true),
    capability('tdd', false, true),
  ]);
  assert.equal(result.ready, false);
  assert.equal(result.missing.map((item) => item.name).join(','), 'tdd');
  assert.equal(result.blockers.length, 1);
});

test('unavailable required capabilities are reported separately', () => {
  const result = getCapabilityReadiness([capability('internal-skill', false, false)]);
  assert.equal(result.ready, false);
  assert.equal(result.unavailable.map((item) => item.name).join(','), 'internal-skill');
  assert.equal(result.blockers.length, 1);
});

test('optional missing capabilities do not block execution', () => {
  const optional = { ...capability('optional-skill', false), required: false };
  const result = getCapabilityReadiness([optional]);
  assert.equal(result.ready, true);
  assert.equal(result.missing.length, 0);
  assert.equal(result.blockers.length, 0);
});
