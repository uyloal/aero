import type { Proxy, ProxyProvider } from '../mihomo/types'

/**
 * 代理节点定义
 * `as const satisfies readonly Proxy[]` 保留精确结构并校验协议合规性，
 * 新增代理只需在此数组内追加对象，无需维护任何额外列表。
 */
export const PROXIES = [
  {
    name: 'HK-01',
    type: 'ss',
    server: 'hk.example.com',
    port: 8388,
    cipher: 'aes-256-gcm',
    password: '${HK_PASSWORD}',
    udp: true
  },
  {
    name: 'SG-01',
    type: 'ss',
    server: 'sg.example.com',
    port: 8388,
    cipher: 'aes-256-gcm',
    password: '${SG_PASSWORD}',
    udp: true
  },
  {
    name: 'JP-01',
    type: 'vmess',
    server: 'jp.example.com',
    port: 443,
    uuid: '${JP_UUID}',
    alterId: 0,
    cipher: 'auto',
    tls: true,
    'client-fingerprint': 'chrome',
    'ws-opts': {
      path: '/ws',
      headers: { Host: 'jp.example.com' }
    }
  },
  {
    name: 'US-01',
    type: 'vless',
    server: 'us.example.com',
    port: 443,
    uuid: '${US_UUID}',
    flow: 'xtls-rprx-vision',
    tls: true,
    'client-fingerprint': 'chrome'
  }
] as const satisfies readonly Proxy[]

/**
 * 从 PROXIES 数组原位推导代理节点名称联合类型
 */
export type ProxyName = (typeof PROXIES)[number]['name']

/**
 * Proxy Providers（可选的远端代理集）
 */
export const PROXY_PROVIDERS: Record<string, ProxyProvider> = {
  'Airport-Sub': {
    type: 'http',
    url: '${SUB_URL}',
    interval: 3600,
    path: './proxy-providers/airport.yaml',
    filter: '^(?!.*(?:Expire|Traffic))',
    'health-check': {
      enable: true,
      url: 'http://www.gstatic.com/generate_204',
      interval: 300
    },
    proxy: 'DIRECT'
  }
}
