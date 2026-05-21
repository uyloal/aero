import type { MihomoConfig } from '../mihomo/types'

/**
 * 入站监听配置
 * 混合端口（HTTP/HTTPS/SOCKS5 合一）
 */
export const LISTENERS_CONFIG: MihomoConfig['listeners'] = [
  {
    name: 'mixed-in',
    type: 'mixed',
    port: 7890,
    listen: '0.0.0.0'
  }
]
