import type { ManualRule } from '../mihomo/types'
import type { TargetName } from './routing'

/**
 * 本地环境规则（高优先级，放在 RULE-SET 之前）
 * 仅保留最高优先级的 PROCESS-NAME / DOMAIN / IP-CIDR 等本地规则。
 *
 * 类型约束：每条规则必须是 `ManualRule<TargetName>`，
 * 确保目标只能是已定义的 ProxyName / GroupName / DIRECT / REJECT。
 */
export const MANUAL_RULES_BEFORE: readonly ManualRule<TargetName>[] = [
  // 常见远程管理 / 邮件 / 版本控制端口直连
  'DST-PORT,22,DIRECT',
  'DST-PORT,23,DIRECT',
  'DST-PORT,143,DIRECT',
  'DST-PORT,465,DIRECT',
  'DST-PORT,587,DIRECT',
  'DST-PORT,993,DIRECT',
  'DST-PORT,995,DIRECT',
  'DST-PORT,3389,DIRECT',
  'DST-PORT,5900,DIRECT',
  'DST-PORT,6443,DIRECT',
  'DST-PORT,9418,DIRECT',

  // Tailscale / Headscale 内网直连
  'SRC-PORT,41641,DIRECT',
  'SRC-PORT,3478,DIRECT',
  'DST-PORT,41641,DIRECT',
  'DST-PORT,3478,DIRECT',
  'DOMAIN-KEYWORD,headscale,DIRECT',
  'DOMAIN-SUFFIX,tailscale.com,DIRECT',
  'DOMAIN-SUFFIX,ts.net,DIRECT',
  'DOMAIN-SUFFIX,tailscale.io,DIRECT',
  'IP-CIDR,100.64.0.0/10,DIRECT,no-resolve',
  'IP-CIDR6,fd7a:115c:a1e0::/48,DIRECT,no-resolve',
] as const

/**
 * 兜底规则（放在所有 RULE-SET 之后，确保一直在最后）
 */
export const MANUAL_RULES_AFTER: readonly ManualRule<TargetName>[] = [
  'GEOIP,private,DIRECT,no-resolve',
  'GEOIP,cn,DIRECT,no-resolve',
  'MATCH,选择代理'
] as const
