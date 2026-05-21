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
    { id: 'bm7-github', url: bm7('GitHub') },
    { id: 'bm7-youtube', url: bm7('YouTube') },
    { id: 'bm7-netflix', url: bm7('Netflix') },
    { id: 'bm7-disney', url: bm7('Disney') },
    { id: 'bm7-spotify', url: bm7('Spotify') },
    { id: 'bm7-discord', url: bm7('Discord') },
    { id: 'bm7-twitter', url: bm7('Twitter') },
    { id: 'bm7-facebook', url: bm7('Facebook') },
    { id: 'bm7-instagram', url: bm7('Instagram') },
    { id: 'bm7-whatsapp', url: bm7('Whatsapp') },
    { id: 'bm7-reddit', url: bm7('Reddit') },
    { id: 'bm7-twitch', url: bm7('Twitch') },
    { id: 'bm7-steam', url: bm7('Steam') },
    { id: 'bm7-epic', url: bm7('Epic') },
    { id: 'bm7-telegram', url: bm7('Telegram') },
    { id: 'bm7-hbo', url: bm7('HBO') },
    { id: 'bm7-hulu', url: bm7('Hulu') },
    { id: 'bm7-bbc', url: bm7('BBC') },
    { id: 'bm7-amazon', url: bm7('Amazon') },
    { id: 'bm7-dropbox', url: bm7('Dropbox') },
    { id: 'bm7-linkedin', url: bm7('LinkedIn') },
    { id: 'bm7-gitlab', url: bm7('GitLab') },
    { id: 'bm7-slack', url: bm7('Slack') },
    { id: 'bm7-pinterest', url: bm7('Pinterest') },
    { id: 'bm7-paypal', url: bm7('PayPal') },
    { id: 'bm7-line', url: bm7('Line') },
    { id: 'bm7-kakaotalk', url: bm7('KakaoTalk') },
    { id: 'bm7-adobe', url: bm7('Adobe') },
    { id: 'bm7-microsoft', url: bm7('Microsoft') },
    { id: 'bm7-google', url: bm7('Google') },
    { id: 'bm7-cloudflare', url: bm7('Cloudflare') },
    { id: 'bm7-speedtest', url: bm7('Speedtest') },
    { id: 'bm7-wikipedia', url: bm7('Wikipedia') }
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
    { id: 'bm7-wetype', url: bm7('WeType') },
    { id: 'bm7-apple', url: bm7('Apple') }
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
 * 多分发变体：GitHub raw + jsDelivr + fastly.jsdelivr + 国内常用加速镜像
 * Builder 会为每个变体生成独立的 config-{suffix}.yaml
 */
export const REMOTE_VARIANTS: readonly RemoteVariant[] = [
  { suffix: 'raw', url: `https://raw.githubusercontent.com/${REPO_SLUG}/release/rules` },
  { suffix: 'jsdelivr', url: `https://cdn.jsdelivr.net/gh/${REPO_SLUG}@release/rules` },
  { suffix: 'fastly', url: `https://fastly.jsdelivr.net/gh/${REPO_SLUG}@release/rules` },
  { suffix: 'akams', url: `https://github.akams.cn/https://raw.githubusercontent.com/${REPO_SLUG}/release/rules` },
  { suffix: 'gh-proxy', url: `https://gh-proxy.com/https://raw.githubusercontent.com/${REPO_SLUG}/release/rules` }
] as const
