import { $ } from 'bun'
import YAML from 'yaml'
import type { MihomoConfig, RuleProvider } from './mihomo/types'
import { CONFIG_SKELETON } from './config'
import { ROUTING_MAP } from './config/routing'
import { MANUAL_RULES_BEFORE, MANUAL_RULES_AFTER } from './config/rules'
import { RULE_PROVIDER_INTERVAL } from './config/remote'
import { PROXY_GROUPS } from './config/proxy-groups'
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
export async function runBuilder(manifest: PipelineManifest, variant?: RemoteVariant): Promise<void> {
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

  const manualCount = MANUAL_RULES_BEFORE.length + MANUAL_RULES_AFTER.length
  logger.success(`Builder 完成：${DIST_DIR}/${filename} 已生成（${baseUrl}）`)
  logger.success(
    `规则总数：${ruleCount} 条（手动 ${manualCount} = before ${MANUAL_RULES_BEFORE.length} + after ${MANUAL_RULES_AFTER.length} + 生成 ${ruleCount - manualCount}）`
  )
  logger.success(`规则集：${providerCount} 个 rule-provider`)
}

/**
 * 生成 RELEASE_NOTES.md，供 CI/CD 创建 GitHub Release 时使用。
 */
function translateTrigger(eventName: string): string {
  const map: Record<string, string> = {
    push: '代码推送',
    schedule: '定时触发',
    workflow_dispatch: '手动触发'
  }
  return map[eventName] || '本地构建'
}

export async function generateReleaseNotes(manifest: PipelineManifest, repoSlug: string): Promise<void> {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)

  const providerCount = manifest.entries.length
  const generatedRuleCount = manifest.entries.reduce((sum, e) => sum + e.count, 0)
  const manualCount = MANUAL_RULES_BEFORE.length + MANUAL_RULES_AFTER.length
  const configRuleCount = providerCount + manualCount
  const totalRuleCount = generatedRuleCount + manualCount

  const domainCount = manifest.entries.filter((e) => e.demoteType === 'domain').reduce((sum, e) => sum + e.count, 0)
  const ipCount = manifest.entries.filter((e) => e.demoteType === 'ip').reduce((sum, e) => sum + e.count, 0)
  const classicalCount = manifest.entries
    .filter((e) => e.demoteType === 'classical')
    .reduce((sum, e) => sum + e.count, 0)

  // 构建元数据（CI/CD 环境变量）
  const fullSha = process.env.GITHUB_SHA ?? ''
  const sha = fullSha ? fullSha.slice(0, 7) : '未知'
  const eventName = process.env.GITHUB_EVENT_NAME ?? ''
  const runId = process.env.GITHUB_RUN_ID ?? ''
  const runNumber = process.env.GITHUB_RUN_NUMBER ?? ''
  const serverUrl = process.env.GITHUB_SERVER_URL ?? 'https://github.com'
  const repository = process.env.GITHUB_REPOSITORY ?? repoSlug
  const actor = process.env.GITHUB_ACTOR ?? '未知'

  const trigger = translateTrigger(eventName)
  const runLink = runId ? `${serverUrl}/${repository}/actions/runs/${runId}` : ''
  const commitLink = fullSha ? `${serverUrl}/${repository}/commit/${fullSha}` : ''

  const configUrls = [
    { name: 'GitHub Raw', url: `https://raw.githubusercontent.com/${repoSlug}/release/config.yaml` },
    { name: 'jsDelivr', url: `https://cdn.jsdelivr.net/gh/${repoSlug}@release/config.yaml` },
    { name: 'Fastly jsDelivr', url: `https://fastly.jsdelivr.net/gh/${repoSlug}@release/config.yaml` }
  ]

  const groupNames = PROXY_GROUPS.map((g) => g.name)

  const categoryRows = manifest.entries
    .map((e) => {
      const typeLabel = e.demoteType === 'domain' ? '域名' : e.demoteType === 'ip' ? 'IP 段' : '经典'
      return `| ${e.category} | ${typeLabel} | \`${e.filename}\` | ${e.count} |`
    })
    .join('\n')

  const rulesFileList = manifest.entries.map((e) => `- \`rules/${e.filename}\` — ${e.count} 条规则`).join('\n')

  const content = `## 使用方法

### 订阅地址

在 Mihomo 客户端中导入以下任一地址作为远程配置：

| 分发节点 | 订阅地址 |
|----------|----------|
${configUrls.map((u) => `| ${u.name} | \`${u.url}\` |`).join('\n')}

> 提示：如果 GitHub 原始地址在你的网络环境中无法直接访问，优先选择 **jsDelivr** 或 **Fastly jsDelivr** 节点。

### 策略组概览

当前配置包含以下策略组，可在客户端中按需切换：

${groupNames.map((n) => `- **${n}**`).join('\n')}

### 代理节点占位符

配置文件中的代理节点使用环境变量占位符（如 \`\${HK_PASSWORD}\`、\`\${SUB_URL}\`）。首次使用前请：

1. 替换 \`src/config/proxies.ts\` 中的占位符为真实凭据，或
2. 利用 \`proxy-providers\` 自动拉取机场订阅（已内置 \`Airport-Sub\` provider）。

## 构建统计

| 指标 | 数值 |
|------|------|
| 构建时间 | ${now} |
| 配置规则数（\`rules\` 数组） | ${configRuleCount}（${providerCount} 条规则集引用 + ${manualCount} 条手动） |
| 展开规则总数（含规则集内容） | ${totalRuleCount} |
| 规则提供方 | ${providerCount} 个 |
| 域名规则 | ${domainCount} |
| IP 段规则 | ${ipCount} |
| 经典规则 | ${classicalCount} |

## 构建元数据

| 项目 | 内容 |
|------|------|
| 代码版本 | ${commitLink ? `[\`${sha}\`](${commitLink})` : `\`${sha}\``} |
| 触发方式 | ${trigger}${eventName ? `（\`${eventName}\`）` : ''} |
| 执行者 | ${actor} |
| 工作流编号 | ${runLink && runNumber ? `[#${runNumber}](${runLink})` : runNumber ? `#${runNumber}` : '-'} |

## 规则集明细

| 分类 | 类型 | 文件 | 规则数 |
|------|------|------|--------|
${categoryRows}

## 文件清单

### 主配置
- \`config.yaml\` — GitHub 原始分发
- \`config-jsdelivr.yaml\` — jsDelivr 内容分发网络
- \`config-fastly.yaml\` — Fastly 内容分发网络

### 规则集（\`rules/\`）
${rulesFileList}

---

*由 aero 基础设施即代码流水线自动生成。*
`

  await Bun.write(`${DIST_DIR}/RELEASE_NOTES.md`, content)
  logger.success(`Release notes 已生成：${DIST_DIR}/RELEASE_NOTES.md`)
}
