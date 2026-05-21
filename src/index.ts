import { $ } from 'bun'
import { PIPELINE_CONFIG } from './core/config'
import { logger, link } from './core/logger'
import { fetchSource } from './pipeline/fetcher'
import { validatePayload } from './pipeline/validator'
import { demoteRules } from './pipeline/demoter'
import { compileCategory, serializeYaml } from './pipeline/compiler'

const OUTPUT_DIR = 'output/rules'

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

async function processCategory(category: string, sources: { id: string; url: string }[]): Promise<void> {
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
    return
  }

  const compiled = compileCategory(results)

  if (compiled.domains.length > 0) {
    await Bun.write(`${OUTPUT_DIR}/${category}-domain.yaml`, serializeYaml(compiled.domains))
  }
  if (compiled.ips.length > 0) {
    await Bun.write(`${OUTPUT_DIR}/${category}-ip.yaml`, serializeYaml(compiled.ips))
  }
  if (compiled.classical.length > 0) {
    await Bun.write(`${OUTPUT_DIR}/${category}-classical.yaml`, serializeYaml(compiled.classical))
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
  if (domainTotal > compiled.domains.length) msg += `（合并去重 ${domainTotal - compiled.domains.length} 条）`
  msg += `，${compiled.ips.length} 条 IP`
  if (ipTotal > compiled.ips.length) msg += `（合并去重 ${ipTotal - compiled.ips.length} 条）`
  if (compiled.classical.length > 0) {
    msg += `，${compiled.classical.length} 条 classical 规则`
    if (classicalTotal > compiled.classical.length)
      msg += `（合并去重 ${classicalTotal - compiled.classical.length} 条）`
  }
  logger.success(msg)
  logger.log('')
}

async function runPipeline(): Promise<void> {
  await cleanOutputDir()

  for (const [category, sources] of Object.entries(PIPELINE_CONFIG)) {
    await processCategory(category, sources)
  }

  logger.info('流水线执行完毕')
}

runPipeline().catch((error) => {
  logger.error('流水线运行出错：', error)
  process.exit(1)
})
