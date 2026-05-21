import type { MihomoConfig } from '../mihomo/types'

/**
 * 基础通用配置：端口、局域网、日志、TUN 等
 */
export const BASE_CONFIG: Pick<
  MihomoConfig,
  | 'mixed-port'
  | 'allow-lan'
  | 'bind-address'
  | 'find-process-mode'
  | 'unified-delay'
  | 'tcp-concurrent'
  | 'log-level'
  | 'ipv6'
  | 'global-client-fingerprint'
  | 'external-controller'
  | 'profile'
  | 'tun'
> = {
  'mixed-port': 7890,
  'allow-lan': true,
  'bind-address': '*',
  'find-process-mode': 'strict',
  'unified-delay': true,
  'tcp-concurrent': true,
  'log-level': 'info',
  ipv6: true,
  'global-client-fingerprint': 'chrome',
  'external-controller': '127.0.0.1:9090',
  profile: {
    'store-selected': true,
    'store-fake-ip': true
  },
  tun: {
    enable: true,
    stack: 'mixed',
    'dns-hijack': ['any:53'],
    'auto-route': true,
    'auto-detect-interface': true
  }
}
