import { $ } from 'bun'
import YAML from 'yaml'
import type { MihomoConfig, RuleProvider } from './mihomo/types'
import { CONFIG_SKELETON } from './config'
import { ROUTING_MAP } from './config/routing'
import { MANUAL_RULES_BEFORE, MANUAL_RULES_AFTER } from './config/rules'
import { RULE_PROVIDER_INTERVAL } from './config/remote'
import type { RemoteVariant } from './config/pipeline'
import type { PipelineManifest } from './pipeline/runner'
import { logger } from './core/logger'

const DIST_DIR = 'output'
const RULES_BASE_PATH = './rule-providers'

interface RuleProviders {
  [key: string]: RuleProvider
}

/**
 * 根据 Pipeline 生成清单动态构造 rule-providers 节点。
 * 产物用于公共订阅分发，所有 rule-provider 统一使用 `type: 'http'` 指向远程 URL，
 * `path` 为 Mihomo 客户端下载后的本地缓存路径规范。
 */
function buildRuleProviders(manifest: PipelineManifest, remoteBaseUrl: string): RuleProviders {
  const providers: RuleProviders = {}

  for (const entry of manifest.entries) {
    const key = `${entry.category}-${entry.demoteType}`
    const behavior = entry.demoteType === 'domain' ? 'domain' : entry.demoteType === 'ip' ? 'ipcidr' : 'classical'

    providers[key] = {
      type: 'http',
      behavior,
      url: `${remoteBaseUrl}/${entry.filename}`,
      path: `${RULES_BASE_PATH}/${entry.filename}`,
      interval: RULE_PROVIDER_INTERVAL
    }
  }

  return providers
}

/**
 * 根据生成清单和路由映射表，智能缝合 RULE-SET 规则。
 * IP 类型的规则自动附加 `no-resolve`。
 */
function buildRules(manifest: PipelineManifest): string[] {
  const generatedRules: string[] = []

  for (const entry of manifest.entries) {
    const target = ROUTING_MAP[entry.category]
    if (!target) {
      logger.warn(`路由映射中缺少分类 ${entry.category}，跳过 RULE-SET 生成`)
      continue
    }

    const ruleSetKey = `${entry.category}-${entry.demoteType}`

    if (entry.demoteType === 'ip') {
      generatedRules.push(`RULE-SET,${ruleSetKey},${target},no-resolve`)
    } else {
      generatedRules.push(`RULE-SET,${ruleSetKey},${target}`)
    }
  }

  // 拼接顺序：before 规则（高优先级本地规则）→ RULE-SET → after 规则（兜底规则）
  return [...MANUAL_RULES_BEFORE, ...generatedRules, ...MANUAL_RULES_AFTER]
}

/**
 * 构建完整的 Mihomo 配置对象。
 */
export function buildConfig(manifest: PipelineManifest, remoteBaseUrl: string): MihomoConfig {
  const ruleProviders = buildRuleProviders(manifest, remoteBaseUrl)
  const rules = buildRules(manifest)

  return {
    port: CONFIG_SKELETON.port,
    'socks-port': CONFIG_SKELETON['socks-port'],
    'redir-port': CONFIG_SKELETON['redir-port'],
    'tproxy-port': CONFIG_SKELETON['tproxy-port'],
    'mixed-port': CONFIG_SKELETON['mixed-port'],
    'allow-lan': CONFIG_SKELETON['allow-lan'],
    'bind-address': CONFIG_SKELETON['bind-address'],
    'find-process-mode': CONFIG_SKELETON['find-process-mode'],
    'unified-delay': CONFIG_SKELETON['unified-delay'],
    'tcp-concurrent': CONFIG_SKELETON['tcp-concurrent'],
    'log-level': CONFIG_SKELETON['log-level'],
    ipv6: CONFIG_SKELETON['ipv6'],
    'global-client-fingerprint': CONFIG_SKELETON['global-client-fingerprint'],
    'external-controller': CONFIG_SKELETON['external-controller'],
    profile: CONFIG_SKELETON.profile,
    tun: CONFIG_SKELETON.tun,
    'geodata-mode': CONFIG_SKELETON['geodata-mode'],
    'geodata-loader': CONFIG_SKELETON['geodata-loader'],
    'geo-auto-update': CONFIG_SKELETON['geo-auto-update'],
    'geo-update-interval': CONFIG_SKELETON['geo-update-interval'],
    'geox-url': CONFIG_SKELETON['geox-url'],
    'keep-alive-idle': CONFIG_SKELETON['keep-alive-idle'],
    'keep-alive-interval': CONFIG_SKELETON['keep-alive-interval'],
    dns: CONFIG_SKELETON.dns,
    sniffer: CONFIG_SKELETON.sniffer,
    listeners: CONFIG_SKELETON.listeners,
    proxies: CONFIG_SKELETON.proxies as unknown as MihomoConfig['proxies'],
    'proxy-groups': CONFIG_SKELETON['proxy-groups'] as unknown as MihomoConfig['proxy-groups'],
    'proxy-providers': CONFIG_SKELETON['proxy-providers'],
    'rule-providers': ruleProviders,
    rules
  }
}

/**
 * Builder 主入口：
 * 1. 接收 Pipeline 生成清单。
 * 2. 组合 CONFIG_SKELETON + rule-providers + rules。
 * 3. 序列化为 dist/config-{suffix}.yaml。
 */
export interface BuilderResult {
  filename: string
  baseUrl: string
  ruleCount: number
  providerCount: number
  manualCount: number
  beforeCount: number
  afterCount: number
}

export async function runBuilder(manifest: PipelineManifest, variant?: RemoteVariant): Promise<BuilderResult> {
  await $`mkdir -p ${DIST_DIR}`

  const suffix = variant?.suffix ?? 'raw'
  const baseUrl = variant?.url ?? 'https://raw.githubusercontent.com/OWNER/REPO/release/rules'

  const config = buildConfig(manifest, baseUrl)

  const ruleCount = config.rules?.length ?? 0
  const providerCount = Object.keys(config['rule-providers'] ?? {}).length
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)

  const metadataHeader = `# NAME: mihomo-config\n# UPDATED: ${now}\n# TOTAL-RULES: ${ruleCount}\n# RULE-PROVIDERS: ${providerCount}\n\n`
  const yaml = metadataHeader + YAML.stringify(config)

  const filename = suffix === 'raw' ? 'config.yaml' : `config-${suffix}.yaml`
  await Bun.write(`${DIST_DIR}/${filename}`, yaml)

  const beforeCount = MANUAL_RULES_BEFORE.length
  const afterCount = MANUAL_RULES_AFTER.length
  const manualCount = beforeCount + afterCount

  return { filename, baseUrl, ruleCount, providerCount, manualCount, beforeCount, afterCount }
}

/**
 * 生成 RELEASE_NOTES.md，供 CI/CD 创建 GitHub Release 时使用。
 * 内容保持紧凑，适合 GitHub Release UI 直接阅读。
 */
function translateTrigger(eventName: string): string {
  const map: Record<string, string> = {
    push: '代码推送',
    schedule: '定时触发',
    workflow_dispatch: '手动触发'
  }
  return map[eventName] || '本地构建'
}

function summarizeByCategory(manifest: PipelineManifest): string {
  const groups = new Map<string, { domain: number; ip: number; classical: number }>()
  for (const e of manifest.entries) {
    const g = groups.get(e.category) ?? { domain: 0, ip: 0, classical: 0 }
    g[e.demoteType] += e.count
    groups.set(e.category, g)
  }
  return Array.from(groups.entries())
    .map(([cat, c]) => {
      const parts: string[] = []
      if (c.domain) parts.push(`${c.domain} 域名`)
      if (c.ip) parts.push(`${c.ip} IP`)
      if (c.classical) parts.push(`${c.classical} 混合`)
      return `- **${cat}**：${parts.join('，')}`
    })
    .join('\n')
}

export async function generateReleaseNotes(manifest: PipelineManifest, repoSlug: string): Promise<void> {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)

  const providerCount = manifest.entries.length
  const generatedRuleCount = manifest.entries.reduce((sum, e) => sum + e.count, 0)
  const manualCount = MANUAL_RULES_BEFORE.length + MANUAL_RULES_AFTER.length
  const totalRuleCount = generatedRuleCount + manualCount

  const fullSha = process.env.GITHUB_SHA ?? ''
  const sha = fullSha ? fullSha.slice(0, 7) : '未知'
  const eventName = process.env.GITHUB_EVENT_NAME ?? ''
  const runId = process.env.GITHUB_RUN_ID ?? ''
  const runNumber = process.env.GITHUB_RUN_NUMBER ?? ''
  const serverUrl = process.env.GITHUB_SERVER_URL ?? 'https://github.com'
  const repository = process.env.GITHUB_REPOSITORY ?? repoSlug
  const trigger = translateTrigger(eventName)
  const runLink = runId ? `${serverUrl}/${repository}/actions/runs/${runId}` : ''
  const commitLink = fullSha ? `${serverUrl}/${repository}/commit/${fullSha}` : ''

  const categorySummary = summarizeByCategory(manifest)

  const content = `## 构建概览

- **规则总数**：${totalRuleCount}（${generatedRuleCount} 自动生成 + ${manualCount} 自定义）
- **规则集**：${providerCount} 个
- **时间**：${now}
- **触发**：${trigger}${eventName ? ` \`${eventName}\`` : ''}
- **版本**：${commitLink ? `[${sha}](${commitLink})` : sha}${runLink && runNumber ? ` · [#${runNumber}](${runLink})` : ''}

## 订阅地址

在 Mihomo 客户端中导入以下任一地址：

**官方 / CDN**
- \`https://raw.githubusercontent.com/${repoSlug}/release/config.yaml\`
- \`https://cdn.jsdelivr.net/gh/${repoSlug}@release/config.yaml\`
- \`https://fastly.jsdelivr.net/gh/${repoSlug}@release/config.yaml\`

**国内加速镜像**
- \`https://github.akams.cn/https://raw.githubusercontent.com/${repoSlug}/release/config.yaml\`
- \`https://gh-proxy.com/https://raw.githubusercontent.com/${repoSlug}/release/config.yaml\`

> 若 GitHub 原始地址无法访问，优先使用 **jsDelivr** 或国内加速镜像节点。

## 规则分类

${categorySummary}

---

*由 aero IaC 流水线自动生成。*
`

  await Bun.write(`${DIST_DIR}/RELEASE_NOTES.md`, content)
  logger.success(`Release notes 已生成：${DIST_DIR}/RELEASE_NOTES.md`)
}
