import type { DependencyKind } from '@ai-coding-agent/config';

export interface DependencyInstallSpec {
  kind: DependencyKind;
  name: string;
  command: string;
  args: string[];
  detail: string;
}

const CATALOG: DependencyInstallSpec[] = [
  {
    kind: 'mcp',
    name: 'context7',
    command: 'claude',
    args: ['mcp', 'add', '--scope', 'project', 'context7', '--', 'npx', '-y', '@upstash/context7-mcp'],
    detail: '通过 Claude Code 项目级 MCP 配置安装 Context7。',
  },
  {
    kind: 'skills',
    name: 'gstack',
    command: 'git',
    args: ['clone', '--depth', '1', 'https://github.com/garrytan/gstack.git', '.claude/skills/gstack'],
    detail: '将 gstack 安装到项目级 Claude Skills 目录；安装后仍需按 gstack 文档执行 setup。',
  },
  {
    kind: 'skills',
    name: 'superpowers',
    command: 'claude',
    args: ['plugin', 'install', 'superpowers@claude-plugins-official'],
    detail: '通过 Claude Code 官方插件市场安装 Superpowers。',
  },
];

export function findDependencyInstallSpec(kind: DependencyKind, name: string): DependencyInstallSpec | undefined {
  return CATALOG.find((item) => item.kind === kind && item.name === name);
}

export function listDependencyInstallSpecs(): DependencyInstallSpec[] {
  return [...CATALOG];
}
