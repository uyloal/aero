import type { ProxyName } from './proxies'

/**
 * 策略组定义
 * 先使用 `as const` 获取最窄字面量类型，供后续原位推导 GroupName。
 * 此处不附加 satisfies，因为 GroupName 尚未产生，无法用于自引用约束。
 */
export const PROXY_GROUPS = [
  {
    name: '选择代理',
    type: 'select',
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Proxy.png',
    'include-all': true,
    default: '自动选择'
  },
  {
    name: '自动选择',
    type: 'url-test',
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Speedtest.png',
    'include-all': true,
    filter: '^(?!.*(?i:Relay)).*$',
    url: 'https://www.gstatic.com/generate_204',
    interval: 300,
    tolerance: 50,
    lazy: true,
    timeout: 5000
  },
  {
    name: '故障转移',
    type: 'fallback',
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Available.png',
    proxies: ['自动选择'],
    'include-all': true,
    url: 'https://www.gstatic.com/generate_204',
    interval: 300,
    lazy: true,
    timeout: 5000
  },
  {
    name: 'HK 香港',
    type: 'url-test',
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Hong_Kong.png',
    'include-all': true,
    filter: '🇭🇰|HK|Hong|hong|香港|深港|沪港|京港|港',
    url: 'http://www.gstatic.com/generate_204',
    interval: 600,
    tolerance: 0,
    timeout: 5000
  },
  {
    name: 'TW 台湾',
    type: 'url-test',
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/China.png',
    'include-all': true,
    filter: '🇹🇼|TW|TWN|Taiwan|Taipei|taiwan|台湾|台灣|台北|台中|新北|彰化',
    url: 'http://www.gstatic.com/generate_204',
    interval: 600,
    tolerance: 0,
    timeout: 5000
  },
  {
    name: 'JP 日本',
    type: 'url-test',
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Japan.png',
    'include-all': true,
    filter: '🇯🇵|JP|Japan|japan|Tokyo|tokyo|日本|东京|大阪|京日|苏日|沪日|上日|川日|深日|广日|日',
    url: 'http://www.gstatic.com/generate_204',
    interval: 600,
    tolerance: 0,
    timeout: 5000
  },
  {
    name: 'SG 新加坡',
    type: 'url-test',
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Singapore.png',
    'include-all': true,
    filter: '🇸🇬|SG|Sing|sing|新加坡|狮城|沪新|京新|深新|杭新|广新',
    url: 'http://www.gstatic.com/generate_204',
    interval: 600,
    tolerance: 0,
    timeout: 5000
  },
  {
    name: 'KR 韩国',
    type: 'url-test',
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Korea.png',
    'include-all': true,
    filter: '🇰🇷|KR|Korea|korea|KOR|韩国|首尔|韩|韓|春川',
    url: 'http://www.gstatic.com/generate_204',
    interval: 600,
    tolerance: 0,
    timeout: 5000
  },
  {
    name: 'US 美国',
    type: 'url-test',
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/United_States.png',
    'include-all': true,
    filter: '🇺🇸|US|USA|America|america|United States|美国|凤凰城|洛杉矶|西雅图|芝加哥|纽约|沪美|美',
    url: 'http://www.gstatic.com/generate_204',
    interval: 600,
    tolerance: 0,
    timeout: 5000
  },
  {
    name: 'SA 南美',
    type: 'url-test',
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Brazil.png',
    'include-all': true,
    filter:
      '🇧🇷|🇦🇷|🇨🇱|🇵🇪|🇨🇴|🇺🇾|BR|AR|CL|PE|CO|UY|Brazil|brazil|Argentina|argentina|Chile|chile|Peru|peru|Colombia|colombia|Uruguay|uruguay|巴西|阿根廷|智利|秘鲁|哥伦比亚|乌拉圭|圣保罗|里约|布宜诺斯艾利斯|圣地亚哥|南美',
    url: 'http://www.gstatic.com/generate_204',
    interval: 600,
    tolerance: 0,
    timeout: 5000
  },
  {
    name: 'EU 欧洲',
    type: 'url-test',
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/United_Nations.png',
    'include-all': true,
    filter:
      '(?i)(🇬🇧|🇩🇪|🇫🇷|🇮🇹|🇪🇸|🇳🇱|🇧🇪|🇦🇹|🇨🇭|🇸🇪|🇳🇴|🇩🇰|🇫🇮|🇮🇪|🇵🇹|🇵🇱|uk|de|fr|it|es|nl|be|at|ch|se|no|dk|fi|ie|pt|pl|eu|europe|england|britain|germany|france|italy|spain|netherlands|belgium|austria|switzerland|sweden|norway|denmark|finland|ireland|portugal|poland|英国|德国|法国|意大利|西班牙|荷兰|比利时|奥地利|瑞士|瑞典|挪威|丹麦|芬兰|爱尔兰|葡萄牙|波兰|英|德|法|意|荷|比|奥|瑞|挪|丹|芬|爱|葡|波)',
    url: 'http://www.gstatic.com/generate_204',
    interval: 600,
    tolerance: 0,
    timeout: 5000
  },
  {
    name: 'AI 服务',
    type: 'select',
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/AI.png',
    proxies: [
      '选择代理',
      '自动选择',
      '故障转移',
      'HK 香港',
      'TW 台湾',
      'JP 日本',
      'SG 新加坡',
      'KR 韩国',
      'US 美国',
      'EU 欧洲',
      'SA 南美'
    ],
    default: '选择代理'
  },
  {
    name: '自动直连',
    type: 'select',
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Direct.png',
    proxies: ['DIRECT', '选择代理'],
    default: 'DIRECT'
  }
] as const

/**
 * 从 PROXY_GROUPS 数组原位推导策略组名称联合类型
 */
export type GroupName = (typeof PROXY_GROUPS)[number]['name']

/**
 * 合法的流量目标：代理节点 | 策略组 | 内置常量
 * 基于已推导的 ProxyName 与 GroupName，编译期拦截所有错别字
 */
export type ProxyRef = ProxyName | GroupName | 'DIRECT' | 'REJECT'

/**
 * 类型层面强制校验：PROXY_GROUPS 的每一项必须满足
 * - name 为已推导的 GroupName
 * - type 为合法策略组类型
 * - proxies 数组中的每个元素必须是合法的 ProxyRef（如果存在）
 *
 * 若某条策略组的 proxies 出现拼写错误（如 'HK-0l'）或引用了不存在的组，
 * VerifyGroups 会推导为 `false`，随后 Assert<false> 触发编译期硬错误。
 */
type VerifyGroups = typeof PROXY_GROUPS extends readonly {
  name: GroupName
  type: 'select' | 'url-test' | 'fallback'
  proxies?: readonly ProxyRef[]
}[]
  ? true
  : false

type Assert<T extends true> = T
type _ProxyGroupVerification = Assert<VerifyGroups>
