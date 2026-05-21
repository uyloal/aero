import type { ManualRule } from '../mihomo/types'
import type { TargetName } from './routing'

/**
 * 本地环境规则 + 兜底规则
 * 仅保留最高优先级的 PROCESS-NAME / GEOIP 等本地规则，
 * 以及尾部的 MATCH 兜底。
 *
 * 类型约束：每条规则必须是 `ManualRule<TargetName>`，
 * 确保目标只能是已定义的 ProxyName / GroupName / DIRECT / REJECT。
 */
export const MANUAL_RULES: readonly ManualRule<TargetName>[] = [
  'PROCESS-NAME,clash,DIRECT',
  'PROCESS-NAME,mihomo,DIRECT',
  'PROCESS-NAME,Sync,DIRECT',
  'PROCESS-NAME,Safari,DIRECT',
  'PROCESS-NAME,com.apple.Safari,DIRECT',
  'DOMAIN,clash.razord.top,DIRECT',
  'DOMAIN,yacd.haishan.me,DIRECT',
  'DOMAIN,localhost,DIRECT',
  'DOMAIN-SUFFIX,local,DIRECT',
  'IP-CIDR,127.0.0.0/8,DIRECT,no-resolve',
  'IP-CIDR,172.16.0.0/12,DIRECT,no-resolve',
  'IP-CIDR,192.168.0.0/16,DIRECT,no-resolve',
  'IP-CIDR,10.0.0.0/8,DIRECT,no-resolve',
  'IP-CIDR,100.64.0.0/10,DIRECT,no-resolve',
  'IP-CIDR,224.0.0.0/4,DIRECT,no-resolve',
  'IP-CIDR,fe80::/10,DIRECT,no-resolve',
  'IP-CIDR6,fc00::/7,DIRECT,no-resolve',
  'GEOIP,private,DIRECT,no-resolve',
  'GEOIP,cn,DIRECT,no-resolve',
  'MATCH,🐟 漏网之鱼'
] as const
