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

function toAgentContext(context: RuntimeContext): string {
  const plan = context.plan;
  const capabilities = context.capabilities;
  const lines = [
    '# ACA Agent Context',
    '',
    '> 本文件由 `aca task prepare` 生成。它描述本次任务的执行上下文，不应手工修改。',
    '',
  ];

  if (plan) {
    lines.push(
      '## 任务',
      '',
      `- 任务：${plan.description}`,
      `- 项目类型：${plan.projectType}`,
      `- 任务类型：${plan.classification.type}`,
      `- 任务级别：${plan.classification.level}`,
      `- Workflow：${plan.workflow.name}`,
      '',
      '## 工作流步骤',
      '',
      ...plan.workflow.steps.map((step) => `- ${step.required ? '[必需]' : '[可选]'} ${step.id}: ${step.description ?? step.skills.join(', ')}`),
      '',
      '## 验证要求',
      '',
      `- Spec：${plan.verification.spec ? '必需' : '不适用'}`,
      `- Rollback Plan：${plan.verification.rollbackPlan ? '必需' : '不适用'}`,
      `- Security Review：${plan.verification.securityReview ? '必需' : '不适用'}`,
      `- Full Verification：${plan.verification.fullVerification ? '必需' : '不适用'}`,
      '',
    );
  }

  if (capabilities) {
    lines.push('## 当前可用能力', '');
    if (capabilities.capabilities.length) {
      lines.push(...capabilities.capabilities.map((item) => `- ${item.kind}: ${item.name} (${item.source})`));
    } else {
      lines.push('- 无');
    }
    lines.push('', `- 能力状态：${capabilities.ready ? 'Ready' : 'Blocked'}`);
    if (capabilities.blockers.length) lines.push(...capabilities.blockers.map((blocker) => `- 阻塞：${blocker}`));
    lines.push('');
  }

  lines.push(
    '## 执行约束',
    '',
    '- 只修改任务范围内的必要内容。',
    '- 不把未安装或不可用的能力当作可用能力。',
    '- 行为逻辑和 Bug 修复优先测试先行；低风险文档或配置变更可说明不适用原因。',
    '- 声称完成前必须执行真实验证，并保留验证证据。',
    '- 验证失败或存在未解决的 required blocker 时，不得声称任务已完成。',
    '',
  );

  return `${lines.join('\n')}\n`;
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

    if (context.capabilities) {
      const capabilitiesTarget = join(targetDir, 'capabilities.json');
      writeFileSync(
        capabilitiesTarget,
        `${JSON.stringify(context.capabilities, null, 2)}\n`,
        'utf8',
      );
      files.push(capabilitiesTarget);
    }

    if (context.plan || context.capabilities) {
      const contextTarget = join(targetDir, 'agent-context.md');
      writeFileSync(contextTarget, toAgentContext(context), 'utf8');
      files.push(contextTarget);
    }

    return { runtime: 'claude', files };
  },
};

export type { PermissionsConfig };
