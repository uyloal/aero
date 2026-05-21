export interface Upstream {
  id: string
  url: string
}

const BLACKMATRIX7_BASE = 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash'

function bm7(path: string, file?: string): string {
  return `${BLACKMATRIX7_BASE}/${path}/${file ?? path}.yaml`
}

/**
 * Pipeline 业务分类及远端 URL 列表
 * 使用 `as const satisfies Record<string, readonly Upstream[]>` 保留字面量联合类型
 */
export const PIPELINE_CONFIG = {
  ai: [
    { id: 'bm7-openai', url: bm7('OpenAI') },
    { id: 'bm7-anthropic', url: bm7('Anthropic') },
    { id: 'bm7-claude', url: bm7('Claude') },
    { id: 'bm7-bard-ai', url: bm7('BardAI') },
    { id: 'bm7-civitai', url: bm7('Civitai') },
    { id: 'bm7-gemini', url: bm7('Gemini') }
  ],
  proxy: [
    { id: 'bm7-proxy', url: bm7('Proxy') },
    { id: 'bm7-proxy-lite', url: bm7('ProxyLite') },
    { id: 'bm7-global-media', url: bm7('GlobalMedia') },
    { id: 'bm7-tiktok', url: bm7('TikTok') },
    { id: 'bm7-imgur', url: bm7('Imgur') },
    { id: 'bm7-docker', url: bm7('Docker') },
    { id: 'bm7-github', url: bm7('GitHub') }
  ],
  direct: [
    { id: 'bm7-direct', url: bm7('Direct') },
    { id: 'bm7-lan', url: bm7('Lan') },
    { id: 'bm7-china', url: bm7('China') },
    { id: 'bm7-china-test', url: bm7('ChinaTest') },
    { id: 'bm7-china-ips', url: bm7('ChinaIPs', 'ChinaIPs_Classical') },
    { id: 'bm7-china-ips-bgp', url: bm7('ChinaIPsBGP', 'ChinaIPsBGP_Classical') },
    { id: 'bm7-china-max', url: bm7('ChinaMax') },
    { id: 'bm7-china-max-no-ip', url: bm7('ChinaMaxNoIP') },
    { id: 'bm7-china-no-media', url: bm7('ChinaNoMedia') },
    { id: 'bm7-gov-cn', url: bm7('GovCN') },
    { id: 'bm7-wechat', url: bm7('WeChat') },
    { id: 'bm7-wetype', url: bm7('WeType') }
  ],
  sg: [{ id: 'bm7-telegram-sg', url: bm7('TelegramSG') }],
  us: [
    { id: 'bm7-telegram-us', url: bm7('TelegramUS') },
    { id: 'bm7-hbo-usa', url: bm7('HBOUSA') },
    { id: 'bm7-hulu-usa', url: bm7('HuluUSA') },
    { id: 'bm7-us-media', url: bm7('USMedia') }
  ],
  eu: [{ id: 'bm7-telegram-nl', url: bm7('TelegramNL') }]
} as const satisfies Record<string, readonly Upstream[]>

export type Category = keyof typeof PIPELINE_CONFIG

/**
 * 远程 Rule-Provider 基地址（向后兼容）
 * 由环境变量 PROVIDER_BASE_URL 驱动，CI/CD 注入 GitHub raw 或 CDN 地址。
 * 本地调试可替换为占位符。
 */
export const REMOTE_BASE_URL =
  process.env.PROVIDER_BASE_URL || 'https://raw.githubusercontent.com/OWNER/REPO/release/rules'

/**
 * 仓库标识，用于自动生成多分发地址。
 * CI/CD 中通过 GITHUB_REPO_SLUG=owner/repo 注入。
 */
const REPO_SLUG = process.env.GITHUB_REPO_SLUG || 'OWNER/REPO'

export interface RemoteVariant {
  suffix: string
  url: string
}

/**
 * 三分发变体：GitHub raw + jsDelivr + fastly.jsdelivr
 * Builder 会为每个变体生成独立的 config-{suffix}.yaml
 */
export const REMOTE_VARIANTS: readonly RemoteVariant[] = [
  { suffix: 'raw', url: `https://raw.githubusercontent.com/${REPO_SLUG}/release/rules` },
  { suffix: 'jsdelivr', url: `https://cdn.jsdelivr.net/gh/${REPO_SLUG}@release/rules` },
  { suffix: 'fastly', url: `https://fastly.jsdelivr.net/gh/${REPO_SLUG}@release/rules` }
] as const
