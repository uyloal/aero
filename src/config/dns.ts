import type { DnsConfig } from '../mihomo/types'

/**
 * DNS 模块配置
 */
export const DNS_CONFIG: DnsConfig = {
  enable: true,
  listen: '0.0.0.0:1053',
  'enhanced-mode': 'fake-ip',
  'fake-ip-range': '198.18.0.1/16',
  'fake-ip-filter': [
    '+.msftconnecttest.com',
    '+.msftncsi.com',
    '+.stun.*',
    '+.stun.*.*',
    '+.stun.*.*.*',
    '+.stun.*.*.*.*',
    'time.*.com',
    'time.*.gov',
    'ntp.*.com',
    'ntp.*.gov',
    '+.pool.ntp.org',
    '+.lan',
    '+.local',
    '+.localdomain',
    '+.home.arpa',
    'localhost.ptlogin2.qq.com',
    '+.srv.nintendo.net',
    '+.stun.playstation.net',
    'xbox.*.microsoft.com',
    '+.xboxlive.com',
    '+.msftconnecttest.com',
    '+.msftncsi.com',
    '+.mcdn.xboxlive.cn',
    '+.sgmdb.cdn.xboxlive.cn',
    '+.bnet.163.com'
  ],
  'default-nameserver': ['223.5.5.5', '119.29.29.29'],
  nameserver: ['https://doh.pub/dns-query', 'https://dns.alidns.com/dns-query'],
  'nameserver-policy': {
    'geosite:cn,private': ['https://doh.pub/dns-query', 'https://dns.alidns.com/dns-query'],
    '+.google.com': 'https://dns.google/dns-query',
    '+.youtube.com': 'https://dns.google/dns-query',
    '+.twitter.com': 'https://dns.google/dns-query',
    '+.x.com': 'https://dns.google/dns-query',
    '+.github.com': 'https://dns.google/dns-query'
  },
  'proxy-server-nameserver': ['https://doh.pub/dns-query'],
  'direct-nameserver': ['https://doh.pub/dns-query'],
  'direct-nameserver-follow-policy': false,
  'respect-rules': true,
  fallback: ['https://1.1.1.1/dns-query', 'https://8.8.8.8/dns-query'],
  'fallback-filter': {
    geoip: true,
    'geoip-code': 'CN',
    geosite: ['gfw'],
    ipcidr: ['240.0.0.0/4', '0.0.0.0/32', '127.0.0.1/32'],
    domain: ['+.google.com', '+.facebook.com', '+.youtube.com']
  }
}
