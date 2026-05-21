import { runPipeline } from './pipeline/runner'
import { runBuilder } from './builder'
import { logger } from './core/logger'

async function main(): Promise<void> {
  logger.log('')
  logger.log('╔══════════════════════════════════════════════════════════════╗')
  logger.log('║           Mihomo IaC Pipeline + Builder Engine               ║')
  logger.log('╚══════════════════════════════════════════════════════════════╝')
  logger.log('')

  // Phase 1: Pipeline — 拉取、清洗、编译远端规则
  const manifest = await runPipeline()

  // Phase 2: Builder — 组装骨架、生成 rule-providers、缝合 rules、输出 YAML
  await runBuilder(manifest)
}

main().catch((error) => {
  logger.error('流水线运行出错：', error)
  process.exit(1)
})
