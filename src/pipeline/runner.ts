import { $ } from 'bun'
import { PIPELINE_CONFIG } from '../config/pipeline'
import type { Category } from '../config/pipeline'
import { logger, link } from '../core/logger'
import { fetchSource } from './fetcher'
import { validatePayload } from './validator'
import { demoteRules } from './demoter'
import { compileCategory, serializeYaml } from './compiler'
import type { DemoteType } from '../mihomo/types'

const OUTPUT_DIR = 'output/rules'

interface CategoryManifestEntry {
  category: Category
  demoteType: DemoteType
  filename: string
  count: number
}

export interface PipelineManifest {
  entries: CategoryManifestEntry[]
  categories: Category[]
}

function formatError(err: unknown): string {
  if (err instanceof Error && 'response' in err) {
    const response = (err as any).response
    if (response && typeof response.status === 'number') {
      return `HTTP ${response.status}`
    }
  }
  if (err instanceof Error) return err.message
  return String(err)
}

async function cleanOutputDir(): Promise<void> {
  await $`rm -rf output`
  await $`mkdir -p ${OUTPUT_DIR}`
}

function categoryHeader(category: string): string {
  const text = ` ${category} `
  const width = 60
  const pad = width - text.length
  if (pad <= 0) return text
  const left = Math.floor(pad / 2)
  const right = Math.ceil(pad / 2)
  const line = ' '.repeat(left) + text + ' '.repeat(right)
  return '\x1b[46m\x1b[30m' + line + '\x1b[0m'
}

interface CategoryStats {
  success: boolean
  files: number
  domains: number
  ips: number
  classical: number
  dropped: number
  dedupedDomains: number
  dedupedIps: number
  dedupedClassical: number
}

async function processCategory(
  category: Category,
  sources: readonly { id: string; url: string }[]
): Promise<{ stats: CategoryStats; manifest: CategoryManifestEntry[] }> {
  logger.log(categoryHeader(category))
  logger.log('')

  const settled = await Promise.allSettled(
    sources.map(async (source) => {
      const raw = await fetchSource(source.url)
      const payload = validatePayload(raw)
      return demoteRules(payload)
    })
  )

  const results = []

  for (let i = 0; i < settled.length; i++) {
    const result = settled[i]
    const source = sources[i]

    if (result.status === 'fulfilled') {
      results.push(result.value)
    } else {
      logger.warn(`来源 ${link(source.id, source.url)} 拉取失败：${formatError(result.reason)}`)
    }
  }

  if (results.length === 0) {
    logger.error(`分类 ${category} 完全失败，所有来源均无法访问或数据无效`)
    logger.log('')
    return {
      stats: {
        success: false,
        files: 0,
        domains: 0,
        ips: 0,
        classical: 0,
        dropped: 0,
        dedupedDomains: 0,
        dedupedIps: 0,
        dedupedClassical: 0
      },
      manifest: []
    }
  }

  const compiled = compileCategory(results)
  let files = 0
  const manifest: CategoryManifestEntry[] = []

  if (compiled.domains.length > 0) {
    await Bun.write(`${OUTPUT_DIR}/${category}-domain.yaml`, serializeYaml(compiled.domains))
    files++
    manifest.push({
      category,
      demoteType: 'domain',
      filename: `${category}-domain.yaml`,
      count: compiled.domains.length
    })
  }
  if (compiled.ips.length > 0) {
    await Bun.write(`${OUTPUT_DIR}/${category}-ip.yaml`, serializeYaml(compiled.ips))
    files++
    manifest.push({
      category,
      demoteType: 'ip',
      filename: `${category}-ip.yaml`,
      count: compiled.ips.length
    })
  }
  if (compiled.classical.length > 0) {
    await Bun.write(`${OUTPUT_DIR}/${category}-classical.yaml`, serializeYaml(compiled.classical))
    files++
    manifest.push({
      category,
      demoteType: 'classical',
      filename: `${category}-classical.yaml`,
      count: compiled.classical.length
    })
  }

  const totalDropped = results.reduce((sum, r) => sum + r.dropped.size, 0)
  if (totalDropped > 0) {
    const summary = results
      .flatMap((r) => Array.from(r.dropped.entries()))
      .reduce((acc, [type, count]) => {
        acc.set(type, (acc.get(type) ?? 0) + count)
        return acc
      }, new Map<string, number>())
    const droppedDesc = Array.from(summary.entries())
      .map(([type, count]) => `${type}(${count})`)
      .join(', ')
    logger.warn(`分类 ${category} 已忽略规则：${droppedDesc}`)
  }

  const domainTotal = results.reduce((sum, r) => sum + r.domains.size, 0)
  const ipTotal = results.reduce((sum, r) => sum + r.ips.size, 0)
  const classicalTotal = results.reduce((sum, r) => sum + r.classical.size, 0)

  let msg = `分类 ${category} 生成成功：${compiled.domains.length} 条域名`
  const dedupedDomains = domainTotal - compiled.domains.length
  if (dedupedDomains > 0) msg += `（合并去重 ${dedupedDomains} 条）`
  msg += `，${compiled.ips.length} 条 IP`
  const dedupedIps = ipTotal - compiled.ips.length
  if (dedupedIps > 0) msg += `（合并去重 ${dedupedIps} 条）`
  const dedupedClassical = classicalTotal - compiled.classical.length
  if (compiled.classical.length > 0) {
    msg += `，${compiled.classical.length} 条 classical 规则`
    if (dedupedClassical > 0) msg += `（合并去重 ${dedupedClassical} 条）`
  }
  logger.success(msg)
  logger.log('')

  return {
    stats: {
      success: true,
      files,
      domains: compiled.domains.length,
      ips: compiled.ips.length,
      classical: compiled.classical.length,
      dropped: totalDropped,
      dedupedDomains,
      dedupedIps,
      dedupedClassical
    },
    manifest
  }
}

function printSummary(stats: CategoryStats[]): void {
  const totalCategories = stats.length
  const successCategories = stats.filter((s) => s.success).length
  const failedCategories = totalCategories - successCategories
  const totalFiles = stats.reduce((sum, s) => sum + s.files, 0)
  const totalDomains = stats.reduce((sum, s) => sum + s.domains, 0)
  const totalIps = stats.reduce((sum, s) => sum + s.ips, 0)
  const totalClassical = stats.reduce((sum, s) => sum + s.classical, 0)
  const totalDropped = stats.reduce((sum, s) => sum + s.dropped, 0)
  const totalDedupedDomains = stats.reduce((sum, s) => sum + s.dedupedDomains, 0)
  const totalDedupedIps = stats.reduce((sum, s) => sum + s.dedupedIps, 0)
  const totalDedupedClassical = stats.reduce((sum, s) => sum + s.dedupedClassical, 0)

  logger.log('')
  const text = ' 汇总统计 '
  const width = 60
  const pad = width - text.length
  const left = Math.floor(pad / 2)
  const right = Math.ceil(pad / 2)
  const line = ' '.repeat(left) + text + ' '.repeat(right)
  logger.log('\x1b[42m\x1b[30m' + line + '\x1b[0m')
  logger.log('')

  logger.success(`分类：${successCategories} 成功 / ${failedCategories} 失败 / ${totalCategories} 总计`)
  logger.success(`文件：${totalFiles} 个 YAML 文件生成`)

  let rulesMsg = `规则：${totalDomains} 条域名`
  if (totalDedupedDomains > 0) rulesMsg += `（去重 ${totalDedupedDomains} 条）`
  rulesMsg += `，${totalIps} 条 IP`
  if (totalDedupedIps > 0) rulesMsg += `（去重 ${totalDedupedIps} 条）`
  if (totalClassical > 0) {
    rulesMsg += `，${totalClassical} 条 classical`
    if (totalDedupedClassical > 0) rulesMsg += `（去重 ${totalDedupedClassical} 条）`
  }
  logger.success(rulesMsg)

  if (totalDropped > 0) {
    logger.warn(`忽略：${totalDropped} 条不支持的规则`)
  }

  logger.log('')
}

export async function runPipeline(): Promise<PipelineManifest> {
  await cleanOutputDir()

  const entries: CategoryManifestEntry[] = []
  const stats: CategoryStats[] = []

  for (const [category, sources] of Object.entries(PIPELINE_CONFIG)) {
    const result = await processCategory(category as Category, sources)
    stats.push(result.stats)
    entries.push(...result.manifest)
  }

  printSummary(stats)

  return {
    entries,
    categories: [...new Set(entries.map((e) => e.category))] as Category[]
  }
}
