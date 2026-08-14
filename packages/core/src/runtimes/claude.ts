import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadPermissions, type PermissionsConfig } from '@ai-coding-agent/config';
import type { RuntimeAdapter, RuntimeContext, RuntimeSyncResult } from './types.js';
import { toClaudeAgentPlan } from './claude-plan.js';

interface ClaudeSettings {
  permissions: {
    allow: string[];
    deny: string[];
  };
}

export const claudeRuntime: RuntimeAdapter = {
  name: 'claude',
  async sync(context: RuntimeContext): Promise<RuntimeSyncResult> {
    const permissions = loadPermissions(context.cwd) ?? context.permissions;
    const targetDir = join(context.cwd, '.claude');
    mkdirSync(targetDir, { recursive: true });

    const target = join(targetDir, 'settings.json');
    const existing = existsSync(target) ? JSON.parse(readFileSync(target, 'utf8')) : {};
    const settings: ClaudeSettings = {
      permissions: {
        allow: [...new Set(permissions.permissions.allow)],
        deny: [...new Set(permissions.permissions.deny)],
      },
    };

    writeFileSync(target, `${JSON.stringify({ ...existing, ...settings }, null, 2)}\n`, 'utf8');
    const files = [target];

    if (context.plan) {
      const planTarget = join(targetDir, 'agent-plan.json');
      writeFileSync(planTarget, `${JSON.stringify(toClaudeAgentPlan(context.plan), null, 2)}\n`, 'utf8');
      files.push(planTarget);
    }

    return { runtime: 'claude', files };
  },
};

export type { PermissionsConfig };
