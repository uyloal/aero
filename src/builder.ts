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
export async function runBuilder(manifest: PipelineManifest, variant?: RemoteVariant): Promise<void> {
  await $`mkdir -p ${DIST_DIR}`

  const suffix = variant?.suffix ?? 'raw'
  const baseUrl = variant?.url ?? 'https://raw.githubusercontent.com/OWNER/REPO/release/rules'

  const config = buildConfig(manifest, baseUrl)
  const yaml = YAML.stringify(config)

  const filename = suffix === 'raw' ? 'config.yaml' : `config-${suffix}.yaml`
  await Bun.write(`${DIST_DIR}/${filename}`, yaml)

  const ruleCount = config.rules?.length ?? 0
  const providerCount = Object.keys(config['rule-providers'] ?? {}).length

  const manualCount = MANUAL_RULES_BEFORE.length + MANUAL_RULES_AFTER.length
  logger.success(`Builder 完成：${DIST_DIR}/${filename} 已生成（${baseUrl}）`)
  logger.success(
    `规则总数：${ruleCount} 条（手动 ${manualCount} = before ${MANUAL_RULES_BEFORE.length} + after ${MANUAL_RULES_AFTER.length} + 生成 ${ruleCount - manualCount}）`
  )
  logger.success(`规则集：${providerCount} 个 rule-provider`)
}
