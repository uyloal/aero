import { RuleType, RULE_TYPES } from '../mihomo/types'

export interface DemotedResult {
  domains: Set<string>
  ips: Set<string>
  classical: Set<string>
  dropped: Map<RuleType, number>
}

function normalizeDomainSuffix(value: string): string {
  if (value.startsWith('+.')) return value
  if (value.startsWith('*.')) return `+.${value.slice(2)}`
  return `+.${value}`
}

export function demoteRules(payload: string[]): DemotedResult {
  const domains = new Set<string>()
  const ips = new Set<string>()
  const classical = new Set<string>()
  const dropped = new Map<RuleType, number>()

  for (const line of payload) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const parts = trimmed.split(',').map((p) => p.trim())
    const type = parts[0] as RuleType

    if (!RULE_TYPES.includes(type)) {
      dropped.set(type, (dropped.get(type) ?? 0) + 1)
      continue
    }

    switch (type) {
      // 纯域名 (走向极速 Trie 树)
      case 'DOMAIN':
        if (parts[1]) domains.add(parts[1])
        break
      case 'DOMAIN-SUFFIX':
        if (parts[1]) domains.add(normalizeDomainSuffix(parts[1]))
        break
      // 纯 IP (走向极速 Radix 树)
      case 'IP-CIDR':
      case 'IP-CIDR6':
        if (parts[1]) ips.add(parts[1])
        break

      // 复杂载荷及 ASN (保留原始语句，走向 classical 线性匹配)
      case 'DOMAIN-WILDCARD':
      case 'DOMAIN-KEYWORD':
      case 'DOMAIN-REGEX':
      case 'GEOSITE':
      case 'IP-SUFFIX':
      case 'IP-ASN':
      case 'GEOIP':
      case 'SRC-GEOIP':
      case 'SRC-IP-ASN':
      case 'SRC-IP-CIDR':
      case 'SRC-IP-SUFFIX':
      case 'DST-PORT':
      case 'SRC-PORT':
      case 'IN-PORT':
      case 'IN-TYPE':
      case 'IN-USER':
      case 'IN-NAME':
      case 'NETWORK':
      case 'DSCP':
      case 'AND':
      case 'OR':
      case 'NOT':
      case 'MATCH':
        classical.add(trimmed)
        break

      // 环境型规则 (本地硬编码范畴，不该出现在远端订阅库，直接静默丢弃)
      case 'PROCESS-PATH':
      case 'PROCESS-PATH-WILDCARD':
      case 'PROCESS-PATH-REGEX':
      case 'PROCESS-NAME':
      case 'PROCESS-NAME-WILDCARD':
      case 'PROCESS-NAME-REGEX':
      case 'UID':
        break

      default:
        dropped.set(type, (dropped.get(type) ?? 0) + 1)
        break
    }
  }

  return { domains, ips, classical, dropped }
}
