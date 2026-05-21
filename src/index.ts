import { runPipeline } from './pipeline/runner'
import { runBuilder } from './builder'
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
  for (const variant of REMOTE_VARIANTS) {
    await runBuilder(manifest, variant)
  }
}

main().catch((error) => {
  logger.error('流水线运行出错：', error)
  process.exit(1)
})
