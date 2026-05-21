import type { Proxy, ProxyProvider } from '../mihomo/types'
import type { GroupName } from './proxy-groups'

/**
 * dialer-proxy 合法取值：策略组名称（自动补全）或任意代理名称字符串
 */
export type DialerProxyRef = GroupName | (string & {})

/**
 * 代理节点。默认留空，避免敏感信息入版本库。
 * 本地使用或 CI 注入时填入实际节点。
 */
export const PROXIES = [] as const satisfies readonly Proxy<DialerProxyRef>[]

export type ProxyName = (typeof PROXIES)[number]['name']

/**
 * 远端代理集。
 */
export const PROXY_PROVIDERS: Record<string, ProxyProvider> = {}
