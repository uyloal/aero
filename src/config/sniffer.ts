import type { MihomoConfig } from '../mihomo/types'

/**
 * 流量嗅探配置
 * 用于识别加密流量中的域名，实现更精确的代理分流
 */
export const SNIFFER_CONFIG: MihomoConfig['sniffer'] = {
  enable: true,
  sniff: {
    HTTP: {
      ports: [80, 8080, 8880],
      'override-destination': true
    },
    TLS: {
      ports: [443, 8443]
    },
    QUIC: {
      ports: [443, 8443]
    }
  },
  'force-domain': [
    '+.v2ex.com',
    '+.netflix.com',
    '+.nflxvideo.net',
    '+.amazonaws.com',
    '+.media.dssott.com',
    '+.hbo.com',
    '+.hbomaxcdn.com',
    '+.tiktok.com'
  ],
  'skip-domain': [
    '+.apple.com',
    '+.push.apple.com',
    'Mijia Cloud',
    'dlg.io.mi.com',
    '+.oray.com',
    '+.sunlogin.net',
    '+.crashlytics.com',
    '+.tailscale.io'
  ]
}
