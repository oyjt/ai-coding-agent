import type { TaskLevel, TaskType } from '../workflows/types.js';
import type { TaskClassification, TaskInput } from './types.js';

type Rule = { id: string; level: TaskLevel; patterns: RegExp[]; reason: string };

const CRITICAL_RULES: Rule[] = [
  { id: 'authentication', level: 'CRITICAL', patterns: [/认证机制/i, /认证流程/i, /认证接口/i, /oauth/i, /sso/i, /token/i, /authentication/i], reason: '涉及认证机制或认证流程' },
  { id: 'authorization', level: 'CRITICAL', patterns: [/权限校验/i, /权限模型/i, /授权机制/i, /rbac/i, /acl/i, /permission/i, /authorization/i], reason: '涉及权限或授权机制' },
  { id: 'money', level: 'CRITICAL', patterns: [/支付接口/i, /支付流程/i, /资金/i, /退款/i, /billing/i, /payment/i], reason: '涉及资金或支付流程' },
  { id: 'production', level: 'CRITICAL', patterns: [/生产环境配置/i, /生产配置/i, /production config/i, /prod config/i], reason: '涉及生产配置' },
  { id: 'migration', level: 'CRITICAL', patterns: [/数据库迁移/i, /数据迁移/i, /migration/i, /migrate/i, /删除数据/i], reason: '涉及数据迁移或删除' },
  { id: 'external-integration', level: 'CRITICAL', patterns: [/第三方集成/i, /外部集成/i, /webhook/i, /外部服务/i, /external integration/i], reason: '涉及外部集成' },
];

const LARGE_RULES: Rule[] = [
  { id: 'architecture', level: 'L', patterns: [/架构/i, /architecture/i, /重构架构/i], reason: '涉及架构变更' },
  { id: 'data-model', level: 'L', patterns: [/数据模型/i, /schema/i, /数据库结构/i, /data model/i], reason: '涉及数据模型' },
  { id: 'cross-module', level: 'L', patterns: [/跨模块/i, /跨包/i, /多个模块/i, /cross-module/i], reason: '涉及跨模块变更' },
  { id: 'high-impact-refactor', level: 'L', patterns: [/大规模重构/i, /全面重构/i, /major refactor/i], reason: '涉及高影响重构' },
];

export function classifyTask(input: TaskInput): TaskClassification {
  const description = input.description.trim();
  const matchedRules = [...matchRules(description, CRITICAL_RULES), ...matchRules(description, LARGE_RULES)];
  const critical = matchedRules.filter((rule) => rule.level === 'CRITICAL');
  const type = inferTaskType(description);

  let level: TaskLevel;
  if (critical.length) level = 'CRITICAL';
  else if (matchedRules.length || (input.filesChanged ?? 0) > 5) level = 'L';
  else if ((input.filesChanged ?? 0) > 1) level = 'M';
  else if (type === 'feature' || type === 'bugfix' || type === 'refactor') level = 'M';
  else level = 'S';

  const relevantRules = level === 'CRITICAL' ? critical : matchedRules.filter((rule) => rule.level === level);
  return {
    type,
    level,
    reasons: [...new Set(relevantRules.map((rule) => rule.reason))],
    matchedRules: relevantRules.map((rule) => rule.id),
    requiresSpec: level === 'L' || level === 'CRITICAL',
    requiresRollbackPlan: level === 'CRITICAL',
    requiresSecurityReview: level === 'CRITICAL',
    requiresFullVerification: level === 'L' || level === 'CRITICAL',
  };
}

function matchRules(description: string, rules: Rule[]): Rule[] {
  return rules.filter((rule) => rule.patterns.some((pattern) => pattern.test(description)));
}

function inferTaskType(description: string): TaskType {
  if (/文档|文案|readme|documentation|注释/i.test(description)) return 'docs';
  if (/配置|config|环境变量|构建配置/i.test(description)) return 'config';
  if (/修复|bug|错误|异常|故障|fix/i.test(description)) return 'bugfix';
  if (/重构|refactor|优化代码|cleanup/i.test(description)) return 'refactor';
  if (/新增|增加|实现|开发|支持|添加|feature/i.test(description)) return 'feature';
  return 'unknown';
}
