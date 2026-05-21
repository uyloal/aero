import type { ProxyGroup } from '../mihomo/types'
import type { ProxyName } from './proxies'

/**
 * 策略组定义
 * 先使用 `as const` 获取最窄字面量类型，供后续原位推导 GroupName。
 * 此处不附加 satisfies，因为 GroupName 尚未产生，无法用于自引用约束。
 */
export const PROXY_GROUPS = [
  {
    name: '🚀 节点选择',
    type: 'selector',
    proxies: ['HK-01', 'SG-01', 'JP-01', 'US-01', 'DIRECT'],
    'include-all': false
  },
  {
    name: '📹 YouTube',
    type: 'selector',
    proxies: ['🚀 节点选择', 'HK-01', 'SG-01', 'JP-01', 'US-01']
  },
  {
    name: '🤖 AI 服务',
    type: 'selector',
    proxies: ['🚀 节点选择', 'US-01', 'SG-01', 'JP-01', 'HK-01']
  },
  {
    name: '📲 电报消息',
    type: 'selector',
    proxies: ['🚀 节点选择', 'SG-01', 'HK-01', 'JP-01', 'US-01']
  },
  {
    name: '🇺🇸 美国节点',
    type: 'url-test',
    proxies: ['US-01'],
    url: 'http://www.gstatic.com/generate_204',
    interval: 300,
    tolerance: 50
  },
  {
    name: '🇸🇬 新加坡节点',
    type: 'url-test',
    proxies: ['SG-01'],
    url: 'http://www.gstatic.com/generate_204',
    interval: 300,
    tolerance: 50
  },
  {
    name: '🌐 全球直连',
    type: 'selector',
    proxies: ['DIRECT', 'REJECT']
  },
  {
    name: '🛑 全球拦截',
    type: 'selector',
    proxies: ['REJECT', 'DIRECT']
  },
  {
    name: '🐟 漏网之鱼',
    type: 'selector',
    proxies: ['🚀 节点选择', 'DIRECT']
  }
] as const

/**
 * 从 PROXY_GROUPS 数组原位推导策略组名称联合类型
 */
export type GroupName = (typeof PROXY_GROUPS)[number]['name']

/**
 * 合法的流量目标：代理节点 | 策略组 | 内置常量
 * 基于已推导的 ProxyName 与 GroupName，编译期拦截所有错别字
 */
export type ProxyRef = ProxyName | GroupName | 'DIRECT' | 'REJECT'

/**
 * 类型层面强制校验：PROXY_GROUPS 的每一项必须满足
 * - name 为已推导的 GroupName
 * - type 为合法策略组类型
 * - proxies 数组中的每个元素必须是合法的 ProxyRef
 *
 * 若某条策略组的 proxies 出现拼写错误（如 'HK-0l'）或引用了不存在的组，
 * VerifyGroups 会推导为 `false`，随后 Assert<false> 触发编译期硬错误。
 */
type VerifyGroups = typeof PROXY_GROUPS extends readonly (Omit<ProxyGroup, 'type' | 'proxies'> & {
  name: GroupName
  type: 'selector' | 'url-test'
  proxies: readonly ProxyRef[]
})[]
  ? true
  : false

type Assert<T extends true> = T
type _ProxyGroupVerification = Assert<VerifyGroups>
