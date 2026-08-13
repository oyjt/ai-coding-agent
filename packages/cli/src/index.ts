#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_AGENT_DIR,
  DEFAULT_CONFIG_FILE,
  loadAgentConfig,
  resolveDependencies,
} from '@ai-coding-agent/config';
import { inspectProject } from '@ai-coding-agent/core';

const cwd = process.cwd();
const [command, ...args] = process.argv.slice(2);

function templateDir(): string {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  return resolve(currentDir, '../../../templates/project/.aca');
}

function specsDir(): string {
  return join(cwd, DEFAULT_AGENT_DIR, 'specs');
}

function init(): void {
  const target = join(cwd, DEFAULT_AGENT_DIR);
  if (existsSync(target)) {
    console.error(`ACA: ${DEFAULT_AGENT_DIR}/ already exists. Nothing changed.`);
    process.exitCode = 1;
    return;
  }

  mkdirSync(target, { recursive: true });
  cpSync(templateDir(), target, { recursive: true });
  console.log(`Created ${DEFAULT_AGENT_DIR}/`);
  console.log(`Detected project: ${inspectProject(cwd).type}`);
}

function status(): void {
  const project = inspectProject(cwd);
  console.log('ACA status');
  console.log(`  Project:        ${project.type}`);
  console.log(`  Package manager: ${project.packageManager}`);
  console.log(`  Config:         ${project.hasAgentConfig ? 'ready' : 'missing'}`);

  if (!project.hasAgentConfig) return;
  const config = loadAgentConfig(cwd);
  const type = config.project?.type && config.project.type !== 'auto' ? config.project.type : project.type;
  const deps = resolveDependencies(config, type);
  console.log(`  Workflow:       ${config.workflow?.default ?? 'not configured'}`);
  console.log(`  Runtime:        ${config.runtime?.default ?? 'not configured'}`);
  console.log(`  Skills:         ${deps.skills?.join(', ') || 'none'}`);
  console.log(`  MCP:             ${deps.mcp?.join(', ') || 'none'}`);
  console.log(`  CLI:             ${deps.cli?.join(', ') || 'none'}`);
}

function install(): void {
  const project = inspectProject(cwd);
  if (!project.hasAgentConfig) {
    console.error(`ACA: ${DEFAULT_AGENT_DIR}/${DEFAULT_CONFIG_FILE} not found. Run "aca init" first.`);
    process.exitCode = 1;
    return;
  }

  const config = loadAgentConfig(cwd);
  const type = config.project?.type && config.project.type !== 'auto' ? config.project.type : project.type;
  const deps = resolveDependencies(config, type);

  console.log(`ACA install (${type})`);
  printInstallPlan('Skills', deps.skills);
  printInstallPlan('MCP', deps.mcp);
  printInstallPlan('CLI', deps.cli);
  console.log('\nDependency installation adapters are not configured yet; no external packages were changed.');
}

function doctor(): void {
  const project = inspectProject(cwd);
  const checks = [
    [project.type !== 'unknown', `project type detected: ${project.type}`],
    [project.hasAgentConfig, `${DEFAULT_AGENT_DIR}/${DEFAULT_CONFIG_FILE} exists`],
  ] as const;

  console.log('ACA doctor');
  let failed = false;
  for (const [ok, message] of checks) {
    console.log(`  ${ok ? '✓' : '✗'} ${message}`);
    failed ||= !ok;
  }

  if (project.hasAgentConfig) {
    try {
      loadAgentConfig(cwd);
      console.log('  ✓ agent.yaml is valid');
    } catch (error) {
      failed = true;
      console.log(`  ✗ agent.yaml: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  process.exitCode = failed ? 1 : 0;
}

function specCreate(name?: string): void {
  if (!name) {
    console.error('用法: aca spec create <name>');
    process.exitCode = 1;
    return;
  }

  const safeName = normalizeSpecName(name);
  if (!safeName) {
    console.error('ACA: Spec 名称只能包含字母、数字、点、下划线和短横线。');
    process.exitCode = 1;
    return;
  }

  const directory = specsDir();
  mkdirSync(directory, { recursive: true });
  const target = join(directory, `${safeName}.md`);
  if (existsSync(target)) {
    console.error(`ACA: Spec 已存在: ${safeName}`);
    process.exitCode = 1;
    return;
  }

  const template = join(templateDir(), 'specs', 'SPEC.md');
  const content = readFileSync(template, 'utf8').replace(/^# 任务规格/m, `# ${safeName}`);
  writeFileSync(target, content, 'utf8');
  console.log(`Created ${DEFAULT_AGENT_DIR}/specs/${safeName}.md`);
}

function specList(): void {
  if (!existsSync(specsDir())) {
    console.log('暂无 Spec。');
    return;
  }

  const specs = readdirSync(specsDir(), { withFileTypes: true })
    .filter((entry) => entry.isFile() && extname(entry.name) === '.md' && entry.name !== 'SPEC.md')
    .map((entry) => entry.name.slice(0, -3))
    .sort();

  if (!specs.length) {
    console.log('暂无 Spec。');
    return;
  }

  for (const spec of specs) console.log(spec);
}

function specShow(name?: string): void {
  if (!name) {
    console.error('用法: aca spec show <name>');
    process.exitCode = 1;
    return;
  }

  const safeName = normalizeSpecName(name);
  if (!safeName) {
    console.error('ACA: Spec 名称无效。');
    process.exitCode = 1;
    return;
  }

  const target = join(specsDir(), `${safeName}.md`);
  if (!existsSync(target)) {
    console.error(`ACA: Spec 不存在: ${safeName}`);
    process.exitCode = 1;
    return;
  }

  process.stdout.write(readFileSync(target, 'utf8'));
}

function normalizeSpecName(name: string): string | null {
  const normalized = name.trim().replace(/\.md$/i, '');
  return /^[a-zA-Z0-9._-]+$/.test(normalized) ? normalized : null;
}

function printInstallPlan(label: string, values?: string[]): void {
  console.log(`  ${label}:`);
  if (!values?.length) {
    console.log('    - none');
    return;
  }
  for (const value of values) console.log(`    - ${value}`);
}

switch (command) {
  case 'init':
    init();
    break;
  case 'install':
    install();
    break;
  case 'sync':
    install();
    break;
  case 'status':
    status();
    break;
  case 'doctor':
    doctor();
    break;
  case 'spec':
    switch (args[0]) {
      case 'create':
        specCreate(args[1]);
        break;
      case 'list':
        specList();
        break;
      case 'show':
        specShow(args[1]);
        break;
      default:
        console.log('用法: aca spec <create|list|show>');
        process.exitCode = 1;
    }
    break;
  default:
    console.log('Usage: aca <init|install|sync|status|doctor|spec>');
}
