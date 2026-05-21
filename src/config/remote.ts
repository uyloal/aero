/**
 * 远程 Rule-Provider 配置
 *
 * `RULE_PROVIDER_INTERVAL`：rule-provider 自动更新间隔（秒），默认 86400（1 天）。
 *
 * 远程基地址已由 `src/config/pipeline.ts` 中的 `REMOTE_BASE_URL` 取代，
 * 通过环境变量 `PROVIDER_BASE_URL` 驱动，不再使用本地硬编码。
 */

/** 远程 rule-provider 自动更新间隔（秒），默认 86400（1 天） */
export const RULE_PROVIDER_INTERVAL = 86400
