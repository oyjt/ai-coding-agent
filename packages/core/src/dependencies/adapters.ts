import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { DependencyAdapter, DependencyCheckResult } from './types.js';

const execFileAsync = promisify(execFile);

export const cliAdapter: DependencyAdapter = {
  kind: 'cli',
  async check(name) {
    try {
      await execFileAsync(name, ['--version']);
      return { kind: 'cli', name, installed: true };
    } catch {
      return { kind: 'cli', name, installed: false, detail: '命令不可用' };
    }
  },
};

export const skillAdapter: DependencyAdapter = {
  kind: 'skills',
  async check(name, cwd) {
    const candidates = [
      `${cwd}/.aca/skills/${name}`,
      `${cwd}/.claude/skills/${name}`,
      `${cwd}/.codex/skills/${name}`,
    ];
    const { access } = await import('node:fs/promises');
    for (const path of candidates) {
      try {
        await access(path);
        return { kind: 'skills', name, installed: true };
      } catch {
        // Try the next known project-local location.
      }
    }
    return { kind: 'skills', name, installed: false, detail: '未找到项目本地 Skill' };
  },
};

export const mcpAdapter: DependencyAdapter = {
  kind: 'mcp',
  async check(name, cwd) {
    const { readFile } = await import('node:fs/promises');
    const candidates = [
      `${cwd}/.mcp.json`,
      `${cwd}/.aca/mcp.json`,
      `${cwd}/.claude/mcp.json`,
    ];
    for (const path of candidates) {
      try {
        const source = await readFile(path, 'utf8');
        if (source.includes(name)) return { kind: 'mcp', name, installed: true };
      } catch {
        // Try the next known configuration location.
      }
    }
    return { kind: 'mcp', name, installed: false, detail: '未在项目 MCP 配置中找到' };
  },
};

export const dependencyAdapters: DependencyAdapter[] = [skillAdapter, mcpAdapter, cliAdapter];
