import type { MihomoConfig } from '../mihomo/types'
import { BASE_CONFIG } from './base'
import { DNS_CONFIG } from './dns'
import { PROXIES, PROXY_PROVIDERS } from './proxies'
import { PROXY_GROUPS } from './proxy-groups'
import { SNIFFER_CONFIG } from './sniffer'
import { LISTENERS_CONFIG } from './listeners'

/**
 * Config Skeleton：聚合所有模块的完整 mihomo 配置骨架
 * 不包含 `rule-providers` 和 `rules`，这两部分由 Builder 在运行时动态注入。
 */
export const CONFIG_SKELETON: Omit<MihomoConfig, 'rule-providers' | 'rules' | 'proxies' | 'proxy-groups'> & {
  proxies: typeof PROXIES
  'proxy-groups': typeof PROXY_GROUPS
  'proxy-providers': typeof PROXY_PROVIDERS
} = {
  ...BASE_CONFIG,
  dns: DNS_CONFIG,
  sniffer: SNIFFER_CONFIG,
  listeners: LISTENERS_CONFIG,
  proxies: PROXIES,
  'proxy-providers': PROXY_PROVIDERS,
  'proxy-groups': PROXY_GROUPS
} as const

export type ConfigSkeleton = typeof CONFIG_SKELETON
