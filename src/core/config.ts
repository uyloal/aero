import type { PipelineConfig } from './types'

const BLACKMATRIX7_BASE = 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash'

function bm7(path: string): string {
  return `${BLACKMATRIX7_BASE}/${path}/${path}.yaml`
}

export const PIPELINE_CONFIG: PipelineConfig = {
  ai: [
    { id: 'github-ai', url: bm7('OpenAI') },
    { id: 'github-ai-extra', url: bm7('OpenAIPlus') }
  ],
  google: [
    { id: 'github-google', url: bm7('Google') },
    { id: 'github-google-cn', url: bm7('GoogleCN') }
  ],
  microsoft: [{ id: 'github-microsoft', url: bm7('Microsoft') }],
  github: [{ id: 'github-github', url: bm7('GitHub') }],
  telegram: [{ id: 'github-telegram', url: bm7('Telegram') }],
  twitter: [{ id: 'github-twitter', url: bm7('Twitter') }],
  youtube: [{ id: 'github-youtube', url: bm7('YouTube') }],
  netflix: [{ id: 'github-netflix', url: bm7('Netflix') }],
  disney: [{ id: 'github-disney', url: bm7('Disney') }],
  apple: [
    { id: 'github-apple', url: bm7('Apple') },
    { id: 'github-icloud', url: bm7('iCloud') }
  ],
  adobe: [{ id: 'github-adobe', url: bm7('Adobe') }],
  amazon: [{ id: 'github-amazon', url: bm7('Amazon') }],
  steam: [{ id: 'github-steam', url: bm7('Steam') }],
  epic: [{ id: 'github-epic', url: bm7('Epic') }],
  tiktok: [{ id: 'github-tiktok', url: bm7('TikTok') }],
  spotify: [{ id: 'github-spotify', url: bm7('Spotify') }],
  discord: [{ id: 'github-discord', url: bm7('Discord') }],
  docker: [{ id: 'github-docker', url: bm7('Docker') }],
  notion: [{ id: 'github-notion', url: bm7('Notion') }],
  slack: [{ id: 'github-slack', url: bm7('Slack') }],
  zoom: [{ id: 'github-zoom', url: bm7('Zoom') }],
  speedtest: [{ id: 'github-speedtest', url: bm7('Speedtest') }]
}
