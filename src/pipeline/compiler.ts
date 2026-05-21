import YAML from 'yaml'
import type { DemotedResult } from './demoter'

export interface CompiledResult {
  domains: string[]
  ips: string[]
  classical: string[]
}

export function compileCategory(results: DemotedResult[]): CompiledResult {
  const domainSet = new Set<string>()
  const ipSet = new Set<string>()
  const classicalSet = new Set<string>()

  for (const result of results) {
    for (const d of result.domains) domainSet.add(d)
    for (const i of result.ips) ipSet.add(i)
    for (const c of result.classical) classicalSet.add(c)
  }

  return {
    domains: Array.from(domainSet).sort(),
    ips: Array.from(ipSet).sort(),
    classical: Array.from(classicalSet).sort()
  }
}

export interface YamlMetadata {
  name: string
  updated: string
  total: number
}

function formatMetadata(metadata: YamlMetadata): string {
  return `# NAME: ${metadata.name}\n# UPDATED: ${metadata.updated}\n# TOTAL: ${metadata.total}\n\n`
}

export function serializeYaml(items: string[], metadata?: YamlMetadata): string {
  const header = metadata ? formatMetadata(metadata) : ''
  return header + YAML.stringify({ payload: items })
}
