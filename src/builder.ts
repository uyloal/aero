import { $ } from 'bun'
import YAML from 'yaml'
import type { MihomoConfig, RuleProvider } from './mihomo/types'
import { CONFIG_SKELETON } from './config'
import { ROUTING_MAP } from './config/routing'
import { MANUAL_RULES } from './config/rules'
import { RULE_PROVIDER_INTERVAL } from './config/remote'
import { REMOTE_BASE_URL } from './config/pipeline'
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
function buildRuleProviders(manifest: PipelineManifest): RuleProviders {
  const providers: RuleProviders = {}

  for (const entry of manifest.entries) {
    const key = `${entry.category}-${entry.demoteType}`
    const behavior = entry.demoteType === 'domain' ? 'domain' : entry.demoteType === 'ip' ? 'ipcidr' : 'classical'

    providers[key] = {
      type: 'http',
      behavior,
      url: `${REMOTE_BASE_URL}/${entry.filename}`,
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

  // 环境规则（MANUAL_RULES）优先级最高，插入到 RULE-SET 之前
  // 尾部兜底规则（MATCH）自动追加到末尾
  const manualRules = [...MANUAL_RULES]

  return [...manualRules, ...generatedRules]
}

/**
 * 构建完整的 Mihomo 配置对象。
 */
export function buildConfig(manifest: PipelineManifest): MihomoConfig {
  const ruleProviders = buildRuleProviders(manifest)
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
    dns: CONFIG_SKELETON.dns,
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
 * 3. 序列化为 dist/config.yaml。
 */
export async function runBuilder(manifest: PipelineManifest): Promise<void> {
  await $`mkdir -p ${DIST_DIR}`

  const config = buildConfig(manifest)
  const yaml = YAML.stringify(config)

  await Bun.write(`${DIST_DIR}/config.yaml`, yaml)

  const ruleCount = config.rules?.length ?? 0
  const providerCount = Object.keys(config['rule-providers'] ?? {}).length

  logger.success(`Builder 完成：${DIST_DIR}/config.yaml 已生成`)
  logger.success(`规则总数：${ruleCount} 条（手动 ${MANUAL_RULES.length} + 生成 ${ruleCount - MANUAL_RULES.length}）`)
  logger.success(`规则集：${providerCount} 个 rule-provider`)
}
