import { runPipeline } from './pipeline/runner'
import { runBuilder, generateReleaseNotes, type BuilderResult } from './builder'
import { REMOTE_VARIANTS } from './config/pipeline'
import { logger } from './core/logger'

async function main(): Promise<void> {
  logger.log('')
  logger.log('╔══════════════════════════════════════════════════════════════╗')
  logger.log('║           Mihomo IaC Pipeline + Builder Engine               ║')
  logger.log('╚══════════════════════════════════════════════════════════════╝')
  logger.log('')

  // Phase 1: Pipeline — 拉取、清洗、编译远端规则
  const manifest = await runPipeline()

  // Phase 2: Builder — 为每个分发变体生成独立配置
  const results: BuilderResult[] = []
  for (const variant of REMOTE_VARIANTS) {
    const result = await runBuilder(manifest, variant)
    results.push(result)
  }

  const first = results[0]
  logger.success(`Builder 完成：${results.map((r) => `output/${r.filename}`).join('、')} 已生成`)
  logger.success(
    `规则总数：${first.ruleCount} 条（手动 ${first.manualCount} = before ${first.beforeCount} + after ${first.afterCount} + 生成 ${first.ruleCount - first.manualCount}）`
  )
  logger.success(`规则集：${first.providerCount} 个 rule-provider`)

  // Phase 3: Release notes — 生成 GitHub Release 说明
  const repoSlug = process.env.GITHUB_REPO_SLUG || 'OWNER/REPO'
  await generateReleaseNotes(manifest, repoSlug)
}

main().catch((error) => {
  logger.error('流水线运行出错：', error)
  process.exit(1)
})
