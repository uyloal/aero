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

export interface ParsedRule {
  type: RuleType
  value: string
  params: string[]
}
