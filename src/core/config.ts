import type { PipelineConfig } from './types'

const BLACKMATRIX7_BASE = 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash'

function bm7(path: string, file?: string): string {
  return `${BLACKMATRIX7_BASE}/${path}/${file ?? path}.yaml`
}

// 分组说明：
// - ai       : AI 服务分流（ChatGPT、Claude 等）
// - proxy    : 通用代理（Proxy、ProxyLite、GlobalMedia 等）
// - direct   : 直连/DIRECT（中国境内、局域网、DNS 等）
// - sg       : 新加坡地区分流
// - us       : 美国地区分流
// - eu       : 欧洲地区分流
export const PIPELINE_CONFIG: PipelineConfig = {
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
    { id: 'bm7-wetype', url: bm7('WeType') },
  ],
  sg: [{ id: 'bm7-telegram-sg', url: bm7('TelegramSG') }],
  us: [
    { id: 'bm7-telegram-us', url: bm7('TelegramUS') },
    { id: 'bm7-hbo-usa', url: bm7('HBOUSA') },
    { id: 'bm7-hulu-usa', url: bm7('HuluUSA') },
    { id: 'bm7-us-media', url: bm7('USMedia') }
  ],
  eu: [{ id: 'bm7-telegram-nl', url: bm7('TelegramNL') }]
}
