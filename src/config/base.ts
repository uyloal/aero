import type { MihomoConfig } from '../mihomo/types'

/**
 * 基础通用配置：端口、局域网、日志、Geo、TUN、Keepalive 等
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
  | 'geodata-mode'
  | 'geodata-loader'
  | 'geo-auto-update'
  | 'geo-update-interval'
  | 'geox-url'
  | 'keep-alive-idle'
  | 'keep-alive-interval'
> = {
  'mixed-port': 7890,
  'allow-lan': true,
  'bind-address': '*',
  'find-process-mode': 'strict',
  'unified-delay': true,
  'tcp-concurrent': true,
  'log-level': 'warning',
  ipv6: true,
  'global-client-fingerprint': 'chrome',
  'external-controller': '127.0.0.1:9090',
  profile: {
    'store-selected': true,
    'store-fake-ip': true
  },
  'geodata-mode': true,
  'geodata-loader': 'memconservative',
  'geo-auto-update': true,
  'geo-update-interval': 24,
  'geox-url': {
    geoip: 'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geoip.dat',
    geosite: 'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geosite.dat',
    mmdb: 'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/country.mmdb',
    asn: 'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/GeoLite2-ASN.mmdb'
  },
  'keep-alive-idle': 600,
  'keep-alive-interval': 15,
  tun: {
    enable: false,
    stack: 'mixed',
    'dns-hijack': ['any:53', 'tcp://any:53'],
    'auto-route': true,
    'auto-detect-interface': true,
    'auto-redirect': false,
    'strict-route': false,
    device: 'utun111',
    'route-exclude-address': ['100.64.0.0/10']
  }
}
