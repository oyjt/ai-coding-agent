import type { DependencyKind } from '@ai-coding-agent/config';
import type { InstallCommand } from './install-types.js';

export interface DependencyInstallSpec {
  kind: DependencyKind;
  name: string;
  commands: InstallCommand[];
  detail: string;
}

const CATALOG: DependencyInstallSpec[] = [
  {
    kind: 'mcp',
    name: 'context7',
    commands: [{
      command: 'claude',
      args: ['mcp', 'add', '--scope', 'project', 'context7', '--', 'npx', '-y', '@upstash/context7-mcp'],
    }],
    detail: '通过 Claude Code 项目级 MCP 配置安装 Context7。',
  },
  {
    kind: 'skills',
    name: 'gstack',
    commands: [
      {
        command: 'git',
        args: ['clone', '--single-branch', '--depth', '1', 'https://github.com/garrytan/gstack.git', '.claude/skills/gstack'],
      },
      {
        command: 'bash',
        args: ['setup', '--host', 'claude', '--no-prefix'],
        cwd: '.claude/skills/gstack',
      },
    ],
    detail: '安装 gstack 后执行官方 Claude Code setup；项目本地安装模式用于让当前项目直接获得 Skills。',
  },
  {
    kind: 'skills',
    name: 'superpowers',
    commands: [{
      command: 'claude',
      args: ['plugin', 'install', 'superpowers@claude-plugins-official'],
    }],
    detail: '通过 Claude Code 官方插件市场安装 Superpowers。',
  },
];

export function findDependencyInstallSpec(kind: DependencyKind, name: string): DependencyInstallSpec | undefined {
  return CATALOG.find((item) => item.kind === kind && item.name === name);
}

export function listDependencyInstallSpecs(): DependencyInstallSpec[] {
  return [...CATALOG];
}
