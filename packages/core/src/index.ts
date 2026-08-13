import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ProjectType } from '@ai-coding-agent/config';

export function detectProjectType(cwd = process.cwd()): ProjectType {
  const packageFile = join(cwd, 'package.json');
  if (!existsSync(packageFile)) return 'unknown';
  try {
    const pkg = JSON.parse(readFileSync(packageFile, 'utf8')) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (deps['react-native']) return 'react-native';
    if (deps.expo) return 'expo';
    if (deps.nuxt) return 'nuxt';
    if (deps.vue) return 'vue';
    if (deps.react) return 'react';
    if (deps.typescript || deps.node) return 'node';
  } catch {
    return 'unknown';
  }
  return 'unknown';
}
