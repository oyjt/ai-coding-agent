import type { CapabilityStatus } from './types.js';

export interface CapabilityReadiness {
  ready: boolean;
  installed: CapabilityStatus[];
  missing: CapabilityStatus[];
  unavailable: CapabilityStatus[];
  blockers: CapabilityStatus[];
}

/**
 * 将能力探测结果转换为 Agent 是否可以开始执行的门禁结果。
 * required 能力未安装但存在安装方案时属于 missing；
 * required 能力既未安装又没有可用方案时属于 unavailable。
 */
export function getCapabilityReadiness(statuses: CapabilityStatus[]): CapabilityReadiness {
  const installed = statuses.filter((item) => item.installed);
  const missing = statuses.filter((item) => item.required && !item.installed && item.available);
  const unavailable = statuses.filter((item) => item.required && !item.installed && !item.available);
  const blockers = [...missing, ...unavailable];

  return {
    ready: blockers.length === 0,
    installed,
    missing,
    unavailable,
    blockers,
  };
}
