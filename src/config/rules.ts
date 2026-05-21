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
  'DOMAIN-KEYWORD,headscale,DIRECT',
  'DOMAIN-SUFFIX,tailscale.com,DIRECT',
  'DOMAIN-SUFFIX,ts.net,DIRECT',
  'DOMAIN-SUFFIX,tailscale.io,DIRECT',
  'IP-CIDR,100.64.0.0/10,DIRECT,no-resolve',
  'IP-CIDR6,fd7a:115c:a1e0::/48,DIRECT,no-resolve',

  // APNS (Apple Push Notification Service)
  'DOMAIN,identity.apple.com,DIRECT',
  'DOMAIN-SUFFIX,akadns.net,DIRECT',
  'DOMAIN-SUFFIX,push.apple.com,DIRECT',
  'DOMAIN-KEYWORD,apple.com.edgekey.net,DIRECT',
  'IP-CIDR,17.188.128.0/18,DIRECT,no-resolve',
  'IP-CIDR,17.188.20.0/23,DIRECT,no-resolve',
  'IP-CIDR,17.249.0.0/16,DIRECT,no-resolve',
  'IP-CIDR,17.252.0.0/16,DIRECT,no-resolve',
  'IP-CIDR,17.57.144.0/22,DIRECT,no-resolve',
  'IP-CIDR6,2403:300:a42::/48,DIRECT,no-resolve',
  'IP-CIDR6,2403:300:a51::/48,DIRECT,no-resolve',
  'IP-CIDR6,2620:149:a44::/48,DIRECT,no-resolve',
  'IP-CIDR6,2a01:b740:a42::/48,DIRECT,no-resolve'
] as const

/**
 * 兜底规则（放在所有 RULE-SET 之后，确保一直在最后）
 */
export const MANUAL_RULES_AFTER: readonly ManualRule<TargetName>[] = [
  'GEOIP,private,DIRECT,no-resolve',
  'GEOIP,cn,DIRECT,no-resolve',
  'MATCH,自动直连'
] as const
