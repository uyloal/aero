import { $ } from 'bun'

const PROXIES_PATH = 'src/config/proxies.ts'

const TEMPLATE = `import type { Proxy, ProxyProvider } from '../mihomo/types'
import type { GroupName } from './proxy-groups'

/**
 * dialer-proxy 合法取值：策略组名称（自动补全）或任意代理名称字符串
 */
export type DialerProxyRef = GroupName | (string & {})

/**
 * 代理节点。默认留空，避免敏感信息入版本库。
 * 本地使用时填入实际节点，**不要提交到仓库**。
 */
export const PROXIES = [] as const satisfies readonly Proxy<DialerProxyRef>[]

export type ProxyName = (typeof PROXIES)[number]['name']

/**
 * 远端代理集。
 */
export const PROXY_PROVIDERS: Record<string, ProxyProvider> = {}
`

async function main() {
  const file = Bun.file(PROXIES_PATH)
  if (await file.exists()) {
    console.log(`[postinstall] ${PROXIES_PATH} already exists, skipping`)
    return
  }

  await Bun.write(PROXIES_PATH, TEMPLATE)
  console.log(`[postinstall] Created ${PROXIES_PATH} from template`)
}

main().catch((err) => {
  console.error('[postinstall] Failed:', err)
  process.exit(1)
})
