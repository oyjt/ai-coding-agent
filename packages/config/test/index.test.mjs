import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveDependencies } from '../dist/index.js';

test('resolves common and project dependencies', () => {
  const result = resolveDependencies({
    version: 1,
    dependencies: {
      common: { skills: ['grill-me'], mcp: ['context7'] },
      vue: { skills: ['vue-best-practices'] },
    },
  }, 'vue');

  assert.deepEqual(result.skills, ['grill-me', 'vue-best-practices']);
  assert.deepEqual(result.mcp, ['context7']);
});

test('Expo inherits React Native dependencies', () => {
  const result = resolveDependencies({
    version: 1,
    dependencies: {
      'react-native': { skills: ['react-native-best-practices'] },
      expo: { skills: ['expo'] },
    },
  }, 'expo');

  assert.deepEqual(result.skills, ['react-native-best-practices', 'expo']);
});
