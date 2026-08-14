import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveDependencies } from '../dist/index.js';

test('resolveDependencies merges common and project-specific dependencies', () => {
  const config = {
    version: 1,
    dependencies: {
      common: { skills: ['grill-me'], mcp: ['context7'], cli: ['gh'] },
      vue: { skills: ['vue-best-practices', 'vueuse-functions'] },
    },
  };

  assert.deepEqual(resolveDependencies(config, 'vue'), {
    projectType: 'vue',
    skills: ['grill-me', 'vue-best-practices', 'vueuse-functions'],
    mcp: ['context7'],
    cli: ['gh'],
  });
});

test('resolveDependencies inherits react-native dependencies for Expo', () => {
  const config = {
    version: 1,
    dependencies: {
      common: { skills: ['grill-me'] },
      'react-native': { skills: ['react-native-best-practices'] },
      expo: { skills: ['expo-best-practices'] },
    },
  };

  assert.deepEqual(resolveDependencies(config, 'expo'), {
    projectType: 'expo',
    skills: ['grill-me', 'react-native-best-practices', 'expo-best-practices'],
    mcp: [],
    cli: [],
  });
});

test('resolveDependencies removes duplicate dependency names', () => {
  const config = {
    version: 1,
    dependencies: {
      common: { skills: ['grill-me'], cli: ['gh'] },
      react: { skills: ['grill-me'], cli: ['gh'] },
    },
  };

  assert.deepEqual(resolveDependencies(config, 'react'), {
    projectType: 'react',
    skills: ['grill-me'],
    mcp: [],
    cli: ['gh'],
  });
});
