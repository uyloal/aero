// ============================================================================
// 原生规则类型 (Pipeline 使用)
// ============================================================================

export const RULE_TYPES = [
  'DOMAIN',
  'DOMAIN-SUFFIX',
  'DOMAIN-KEYWORD',
  'DOMAIN-WILDCARD',
  'DOMAIN-REGEX',
  'GEOSITE',
  'IP-CIDR',
  'IP-CIDR6',
  'IP-SUFFIX',
  'IP-ASN',
  'GEOIP',
  'SRC-GEOIP',
  'SRC-IP-ASN',
  'SRC-IP-CIDR',
  'SRC-IP-SUFFIX',
  'DST-PORT',
  'SRC-PORT',
  'IN-PORT',
  'IN-TYPE',
  'IN-USER',
  'IN-NAME',
  'PROCESS-PATH',
  'PROCESS-PATH-WILDCARD',
  'PROCESS-PATH-REGEX',
  'PROCESS-NAME',
  'PROCESS-NAME-WILDCARD',
  'PROCESS-NAME-REGEX',
  'UID',
  'NETWORK',
  'DSCP',
  'AND',
  'OR',
  'NOT',
  'SUB-RULE',
  'MATCH'
] as const

export type RuleType = (typeof RULE_TYPES)[number]

// ---------------------------------------------------------------------------
// Pipeline 可用规则类型（排除本地环境型规则，这些不应出现在订阅规则集中）
// ---------------------------------------------------------------------------
export const PIPELINE_RULE_TYPES = [
  'DOMAIN',
  'DOMAIN-SUFFIX',
  'DOMAIN-KEYWORD',
  'DOMAIN-WILDCARD',
  'DOMAIN-REGEX',
  'GEOSITE',
  'IP-CIDR',
  'IP-CIDR6',
  'IP-SUFFIX',
  'IP-ASN',
  'GEOIP',
  'SRC-GEOIP',
  'SRC-IP-ASN',
  'SRC-IP-CIDR',
  'SRC-IP-SUFFIX',
  'DST-PORT',
  'SRC-PORT',
  'IN-PORT',
  'IN-TYPE',
  'IN-USER',
  'IN-NAME',
  'NETWORK',
  'DSCP',
  'AND',
  'OR',
  'NOT',
  'MATCH'
] as const satisfies RuleType[]

export type PipelineRuleType = (typeof PIPELINE_RULE_TYPES)[number]

export type InlineRule = `${PipelineRuleType},${string}`

export interface ParsedRule {
  type: RuleType
  value: string
  params: string[]
}

// ============================================================================
// Demote 后缀 (Pipeline 输出文件的后缀)
// ============================================================================

export const DEMOTE_TYPES = ['domain', 'ip', 'classical'] as const
export type DemoteType = (typeof DEMOTE_TYPES)[number]

// ============================================================================
// Mihomo 原生配置类型
// ============================================================================

export interface BaseProxy {
  name: string
  type:
    | 'ss'
    | 'ssr'
    | 'vmess'
    | 'vless'
    | 'trojan'
    | 'hysteria'
    | 'hysteria2'
    | 'tuic'
    | 'wireguard'
    | 'shadowtls'
    | 'direct'
    | 'http'
    | 'socks5'
    | 'relay'
    | 'select'
    | 'url-test'
    | 'fallback'
    | 'load-balance'
  [key: string]: unknown
}

// ============================================================================
// 具体代理节点类型 (Proxy Node Types)
// ============================================================================

export interface SmuxConfig {
  enabled?: boolean
  protocol?: 'smux' | 'yamux' | 'h2mux'
  'max-connections'?: number
  'min-streams'?: number
  'max-streams'?: number
  statistic?: boolean
  'only-tcp'?: boolean
  padding?: boolean
  'brutal-opts'?: {
    enabled?: boolean
    up?: number
    down?: number
  }
}

export interface ProxyNodeBase<DialerProxy extends string = string> {
  name: string
  server: string
  port: number
  udp?: boolean
  'ip-version'?: 'dual' | 'ipv4' | 'ipv6' | 'ipv4-prefer' | 'ipv6-prefer'
  'interface-name'?: string
  'routing-mark'?: number
  tfo?: boolean
  mptcp?: boolean
  'dialer-proxy'?: DialerProxy
  smux?: SmuxConfig
}

export interface TlsFields {
  tls?: boolean
  sni?: string
  servername?: string
  fingerprint?: string
  'client-fingerprint'?: 'chrome' | 'firefox' | 'safari' | 'ios' | 'android' | 'edge' | '360' | 'qq' | 'random'
  'skip-cert-verify'?: boolean
  certificate?: string
  'private-key'?: string
  'reality-opts'?: {
    'public-key'?: string
    'short-id'?: string
    'support-x25519mlkem768'?: boolean
  }
  'ech-opts'?: {
    enable?: boolean
    config?: string
    'query-server-name'?: string
  }
}

export interface WsOpts {
  path?: string
  headers?: Record<string, string>
  'max-early-data'?: number
  'early-data-header-name'?: string
  'v2ray-http-upgrade'?: boolean
  'v2ray-http-upgrade-fast-open'?: boolean
}

export interface ShadowsocksProxy<DialerProxy extends string = string> extends ProxyNodeBase<DialerProxy> {
  type: 'ss'
  cipher: string
  password: string
  'udp-over-tcp'?: boolean
  'udp-over-tcp-version'?: number
  plugin?: 'obfs' | 'v2ray-plugin' | 'gost-plugin' | 'shadow-tls' | 'restls' | 'kcptun'
  'plugin-opts'?: Record<string, unknown>
}

export interface ShadowsocksRProxy<DialerProxy extends string = string> extends ProxyNodeBase<DialerProxy> {
  type: 'ssr'
  cipher: string
  password: string
  protocol: string
  'protocol-param'?: string
  obfs: string
  'obfs-param'?: string
}

export interface VmessProxy<DialerProxy extends string = string> extends ProxyNodeBase<DialerProxy>, TlsFields {
  type: 'vmess'
  uuid: string
  alterId: number
  cipher: 'auto' | 'none' | 'zero' | 'aes-128-gcm' | 'chacha20-poly1305'
  'packet-encoding'?: 'packetaddr' | 'xudp'
  'global-padding'?: boolean
  'authenticated-length'?: boolean
  network?: 'tcp' | 'ws' | 'http' | 'h2' | 'grpc'
  'ws-opts'?: WsOpts
  'h2-opts'?: { host?: string[]; path?: string }
  'grpc-opts'?: { 'grpc-service-name'?: string }
  'http-opts'?: { method?: string; path?: string[]; headers?: Record<string, string[]> }
}

export interface VlessProxy<DialerProxy extends string = string> extends ProxyNodeBase<DialerProxy>, TlsFields {
  type: 'vless'
  uuid: string
  flow?: 'xtls-rprx-vision'
  'packet-encoding'?: 'packetaddr' | 'xudp'
  encryption?: string
  network?: 'tcp' | 'ws' | 'http' | 'h2' | 'grpc' | 'xhttp'
  'ws-opts'?: WsOpts
  'h2-opts'?: { host?: string[]; path?: string }
  'grpc-opts'?: { 'grpc-service-name'?: string }
  'xhttp-opts'?: Record<string, unknown>
}

export interface TrojanProxy<DialerProxy extends string = string> extends ProxyNodeBase<DialerProxy>, TlsFields {
  type: 'trojan'
  password: string
  'ss-opts'?: { enabled?: boolean; method?: string; password?: string }
  network?: 'tcp' | 'ws' | 'grpc'
  'ws-opts'?: WsOpts
  'grpc-opts'?: { 'grpc-service-name'?: string }
}

export interface HysteriaProxy<DialerProxy extends string = string> extends ProxyNodeBase<DialerProxy> {
  type: 'hysteria'
  protocol?: 'udp' | 'wechat-video' | 'faketcp'
  up: string | number
  down: string | number
  'auth-str'?: string
  obfs?: string
  'recv-window-conn'?: number
  'recv-window'?: number
  'disable-mtu-discovery'?: boolean
  'fast-open'?: boolean
  'hop-interval'?: number
  ports?: string
  sni?: string
  'skip-cert-verify'?: boolean
  alpn?: string[]
  fingerprint?: string
}

export interface Hysteria2Proxy<DialerProxy extends string = string> extends ProxyNodeBase<DialerProxy>, TlsFields {
  type: 'hysteria2'
  ports?: string
  'hop-interval'?: number
  password?: string
  up?: string | number
  down?: string | number
  obfs?: string
  'obfs-password'?: string
}

export interface TuicProxy<DialerProxy extends string = string> extends ProxyNodeBase<DialerProxy> {
  type: 'tuic'
  uuid: string
  password?: string
  token?: string
  'congestion-controller'?: string
  'reduce-rtt'?: boolean
  'fast-open'?: boolean
  'max-udp-relay-packet-size'?: number
  'max-open-streams'?: number
  heartbeat?: number
  'request-timeout'?: number
  sni?: string
  'skip-cert-verify'?: boolean
  alpn?: string[]
}

export interface WireguardPeer {
  server: string
  port: number
  'public-key': string
  'allowed-ips'?: string[]
  'pre-shared-key'?: string
  reserved?: string | number[]
}

export interface WireguardProxy<DialerProxy extends string = string>
  extends Omit<ProxyNodeBase<DialerProxy>, 'server' | 'port'> {
  type: 'wireguard'
  server?: string
  port?: number
  ip?: string
  ipv6?: string
  'private-key': string
  'public-key'?: string
  'pre-shared-key'?: string
  'allowed-ips'?: string[]
  reserved?: string | number[]
  'persistent-keepalive'?: number
  mtu?: number
  peers?: WireguardPeer[]
  'remote-dns-resolve'?: boolean
  dns?: string[]
}

export interface ShadowtlsProxy<DialerProxy extends string = string> extends ProxyNodeBase<DialerProxy> {
  type: 'shadowtls'
  'shadow-tls-version'?: number
  password?: string
  detour?: string
}

export interface DirectProxy<DialerProxy extends string = string>
  extends Omit<ProxyNodeBase<DialerProxy>, 'server' | 'port'> {
  type: 'direct'
  server?: string
  port?: number
}

export interface HttpProxy<DialerProxy extends string = string> extends ProxyNodeBase<DialerProxy>, TlsFields {
  type: 'http'
  username?: string
  password?: string
  headers?: Record<string, string>
}

export interface Socks5Proxy<DialerProxy extends string = string> extends ProxyNodeBase<DialerProxy>, TlsFields {
  type: 'socks5'
  username?: string
  password?: string
}

/**
 * 代理节点联合类型 — 所有具体代理类型的并集
 */
export type Proxy<DialerProxy extends string = string> =
  | ShadowsocksProxy<DialerProxy>
  | ShadowsocksRProxy<DialerProxy>
  | VmessProxy<DialerProxy>
  | VlessProxy<DialerProxy>
  | TrojanProxy<DialerProxy>
  | HysteriaProxy<DialerProxy>
  | Hysteria2Proxy<DialerProxy>
  | TuicProxy<DialerProxy>
  | WireguardProxy<DialerProxy>
  | ShadowtlsProxy<DialerProxy>
  | DirectProxy<DialerProxy>
  | HttpProxy<DialerProxy>
  | Socks5Proxy<DialerProxy>

export interface ProxyGroup extends BaseProxy {
  type: 'relay' | 'select' | 'url-test' | 'fallback' | 'load-balance'
  proxies?: string[]
  url?: string
  interval?: number
  tolerance?: number
  lazy?: boolean
  'disable-udp'?: boolean
  timeout?: number
  'max-failed-times'?: number
  'expected-status'?: string
  failover?: boolean
  'include-all'?: boolean
  'include-all-proxies'?: boolean
  filter?: string
  'exclude-filter'?: string
  'exclude-type'?: string
  'include-all-providers'?: boolean
  use?: string[]
  icon?: string
  default?: string
  hidden?: boolean
}

export interface ProxyProvider {
  type: 'http' | 'file'
  url?: string
  interval?: number
  path?: string
  filter?: string
  'exclude-filter'?: string
  'health-check'?: {
    enable: boolean
    url: string
    interval: number
    timeout?: number
    lazy?: boolean
    'expected-status'?: string
  }
  proxy?: string
  header?: Record<string, string[]>
}

export interface RuleProvider {
  type: 'http' | 'file'
  behavior: 'domain' | 'ipcidr' | 'classical'
  url?: string
  path?: string
  interval?: number
  format?: 'yaml' | 'mrs'
  payload?: string[]
}

export interface DnsConfig {
  enable?: boolean
  listen?: string
  'enhanced-mode'?: 'fake-ip' | 'redir-host'
  'fake-ip-range'?: string
  'fake-ip-filter'?: string[]
  'fake-ip-filter-mode'?: 'blacklist' | 'whitelist'
  'default-nameserver'?: string[]
  nameserver?: string[]
  'nameserver-policy'?: Record<string, string | string[]>
  'proxy-server-nameserver'?: string[]
  'direct-nameserver'?: string[]
  'direct-nameserver-follow-policy'?: boolean
  ipv6?: boolean
  'use-hosts'?: boolean
  'use-system-hosts'?: boolean
  hosts?: Record<string, string | string[]>
  'respect-rules'?: boolean
  'prefer-h3'?: boolean
  'cache-algorithm'?: 'lru' | 'arc'
  fallback?: string[]
  'fallback-filter'?: {
    geoip?: boolean
    'geoip-code'?: string
    geosite?: string[]
    ipcidr?: string[]
    domain?: string[]
  }
}

// ============================================================================
// 顶级配置骨架 (Config Skeleton)
// ============================================================================

export interface MihomoConfig {
  port?: number
  'socks-port'?: number
  'redir-port'?: number
  'tproxy-port'?: number
  'mixed-port'?: number
  'mitm-port'?: number
  'allow-lan'?: boolean
  'bind-address'?: string
  'unified-delay'?: boolean
  'tcp-concurrent'?: boolean
  'find-process-mode'?: 'always' | 'strict' | 'off'
  'skip-auth-prefixes'?: string[]
  'lan-allowed-ips'?: string[]
  'lan-disallowed-ips'?: string[]
  'interface-name'?: string
  'routing-mark'?: number
  tun?: Record<string, unknown>
  profile?: Record<string, unknown>
  'external-controller'?: string
  'external-controller-tls'?: string
  'external-controller-cors'?: Record<string, unknown>
  secret?: string
  'ecdh-curve'?: string
  tls?: Record<string, unknown>
  experimental?: Record<string, unknown>
  sniffer?: Record<string, unknown>
  'geox-url'?: Record<string, string>
  'geo-auto-update'?: boolean
  'geo-update-interval'?: number
  'geodata-mode'?: boolean
  'geodata-loader'?: string
  'geosite-matching'?: 'hybrid' | 'suffix-tree' | 'linear'
  'disable-keep-alive'?: boolean
  'keep-alive-idle'?: number
  'keep-alive-interval'?: number
  'log-level'?: 'silent' | 'error' | 'warning' | 'info' | 'debug'
  ipv6?: boolean
  'global-client-fingerprint'?: string
  'global-ua'?: string
  'global-xray-ua'?: string
  dns?: DnsConfig
  proxies?: BaseProxy[]
  'proxy-providers'?: Record<string, ProxyProvider>
  'proxy-groups'?: ProxyGroup[]
  'rule-providers'?: Record<string, RuleProvider>
  rules?: string[]
  'sub-rules'?: Record<string, string[]>
  listeners?: Record<string, unknown>[]
}

/**
 * 自定义规则类型 (rules.ts 中的单条规则)
 * 格式为: TYPE,VALUE,TARGET 或 TYPE,VALUE,PARAMS,TARGET
 */
export type ManualRule<Target extends string> =
  | `MATCH,${Target}`
  | `DOMAIN,${string},${Target}`
  | `DOMAIN-SUFFIX,${string},${Target}`
  | `DOMAIN-KEYWORD,${string},${Target}`
  | `DOMAIN-WILDCARD,${string},${Target}`
  | `DOMAIN-REGEX,${string},${Target}`
  | `GEOSITE,${string},${Target}`
  | `IP-CIDR,${string},${Target},no-resolve`
  | `IP-CIDR,${string},${Target}`
  | `IP-CIDR6,${string},${Target},no-resolve`
  | `IP-CIDR6,${string},${Target}`
  | `IP-SUFFIX,${string},${Target},no-resolve`
  | `IP-SUFFIX,${string},${Target}`
  | `IP-ASN,${string},${Target},no-resolve`
  | `IP-ASN,${string},${Target}`
  | `GEOIP,${string},${Target},no-resolve`
  | `GEOIP,${string},${Target}`
  | `SRC-GEOIP,${string},${Target},no-resolve`
  | `SRC-GEOIP,${string},${Target}`
  | `SRC-IP-ASN,${string},${Target},no-resolve`
  | `SRC-IP-ASN,${string},${Target}`
  | `SRC-IP-CIDR,${string},${Target},no-resolve`
  | `SRC-IP-CIDR,${string},${Target}`
  | `SRC-IP-SUFFIX,${string},${Target},no-resolve`
  | `SRC-IP-SUFFIX,${string},${Target}`
  | `DST-PORT,${string},${Target}`
  | `SRC-PORT,${string},${Target}`
  | `IN-PORT,${string},${Target}`
  | `IN-TYPE,${string},${Target}`
  | `IN-USER,${string},${Target}`
  | `IN-NAME,${string},${Target}`
  | `PROCESS-PATH,${string},${Target}`
  | `PROCESS-PATH-WILDCARD,${string},${Target}`
  | `PROCESS-PATH-REGEX,${string},${Target}`
  | `PROCESS-NAME,${string},${Target}`
  | `PROCESS-NAME-WILDCARD,${string},${Target}`
  | `PROCESS-NAME-REGEX,${string},${Target}`
  | `UID,${string},${Target}`
  | `NETWORK,${string},${Target}`
  | `DSCP,${string},${Target}`
  | `AND,${string},${Target}`
  | `OR,${string},${Target}`
  | `NOT,${string},${Target}`
  | `SUB-RULE,${string},${Target}`
