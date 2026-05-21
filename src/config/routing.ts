import type { Category } from './pipeline'
import type { ProxyRef } from './proxy-groups'

/**
 * 所有流量去向的完整联合类型
 * 直接复用 ProxyRef，保持单一可信源
 */
export type TargetName = ProxyRef

/**
 * 路由映射表：将 Pipeline 清洗后的分类映射到策略组/节点。
 * Key 必须是 `Category`，Value 必须是 `TargetName`。
 */
export type RoutingMap = Record<Category, TargetName>

/**
 * 业务路由映射定义
 * 每个分类对应到一个已定义的策略组或代理节点。
 */
export const ROUTING_MAP: RoutingMap = {
  ai: 'AI 服务',
  proxy: '选择代理',
  direct: '自动直连',
  sg: 'SG 新加坡',
  us: 'US 美国',
  eu: 'EU 欧洲'
}
