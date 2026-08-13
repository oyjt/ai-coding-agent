import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import type { PermissionsConfig } from '@ai-coding-agent/config';
import type { RuntimeAdapter, RuntimeContext, RuntimeSyncResult } from './types.js';

interface ClaudePermissions {
  permissions: {
    allow: string[];
    deny: string[];
  };
}

function loadPermissions(cwd: string): PermissionsConfig | undefined {
  const path = join(cwd, '.aca', 'permissions.yaml');
  if (!existsSync(path)) return undefined;
  return parse(readFileSync(path, 'utf8')) as PermissionsConfig;
}

export const claudeRuntime: RuntimeAdapter = {
  name: 'claude',
  async sync(context: RuntimeContext): Promise<RuntimeSyncResult> {
    const permissions = loadPermissions(context.cwd) ?? context.permissions;
    const targetDir = join(context.cwd, '.claude');
    mkdirSync(targetDir, { recursive: true });

    const target = join(targetDir, 'settings.json');
    const existing = existsSync(target) ? JSON.parse(readFileSync(target, 'utf8')) : {};
    const next: ClaudePermissions = {
      permissions: {
        allow: [...new Set(permissions.permissions.allow)],
        deny: [...new Set(permissions.permissions.deny)],
      },
    };

    writeFileSync(target, `${JSON.stringify({ ...existing, ...next }, null, 2)}\n`, 'utf8');
    return { runtime: 'claude', files: [target] };
  },
};
