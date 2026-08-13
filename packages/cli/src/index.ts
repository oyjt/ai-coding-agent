#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
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
  default:
    console.log('Usage: aca <init|install|sync|status|doctor>');
}

void args;
