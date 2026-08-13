export interface PermissionsConfig {
  permissions: {
    allow: string[];
    deny: string[];
  };
}

export const DEFAULT_PERMISSIONS: PermissionsConfig = {
  permissions: {
    allow: [
      'Bash',
      'Edit',
      'Glob',
      'Grep',
      'KillShell',
      'LS',
      'LSP',
      'MultiEdit',
      'NotebookEdit',
      'NotebookRead',
      'Read',
      'Skill',
      'Task',
      'TaskCreate',
      'TaskGet',
      'TaskList',
      'TaskOutput',
      'TaskStop',
      'TaskUpdate',
      'TodoWrite',
      'ToolSearch',
      'WebFetch',
      'WebSearch',
      'Write',
    ],
    deny: [
      'Bash(rm -rf:*)',
      'Bash(curl | bash:*)',
      'Bash(DROP:*)',
      'Bash(TRUNCATE:*)',
      'Write(.env*)',
    ],
  },
};

export function normalizePermissions(config?: Partial<PermissionsConfig>): PermissionsConfig {
  return {
    permissions: {
      allow: [...new Set(config?.permissions?.allow ?? DEFAULT_PERMISSIONS.permissions.allow)],
      deny: [...new Set(config?.permissions?.deny ?? DEFAULT_PERMISSIONS.permissions.deny)],
    },
  };
}
