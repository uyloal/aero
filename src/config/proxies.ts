import type { Proxy, ProxyProvider } from '../mihomo/types'

/**
 * 代理节点。默认留空，避免敏感信息入版本库。
 * 本地使用或 CI 注入时填入实际节点。
 */
export const PROXIES = [] as const satisfies readonly Proxy[]

export type ProxyName = (typeof PROXIES)[number]['name']

/**
 * 远端代理集。
 */
export const PROXY_PROVIDERS: Record<string, ProxyProvider> = {}
