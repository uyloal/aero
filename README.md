# aero

> 从上游规则集自动生成完整的 [mihomo](https://github.com/MetaCubeX/mihomo)（Clash.Meta）配置，支持多 CDN 分发。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Build](https://img.shields.io/badge/build-passing-brightgreen)](.github/workflows/deploy.yml)
[![GitHub release](https://img.shields.io/github/v/release/uyloal/aero)](https://github.com/uyloal/aero/releases)
[![GitHub stars](https://img.shields.io/github/stars/uyloal/aero)](https://github.com/uyloal/aero/stargazers)
[![pnpm](https://img.shields.io/badge/pnpm-%3E%3D11.1.1-orange)](https://pnpm.io)
[![Bun](https://img.shields.io/badge/Bun-%3E%3D1.3.0-yellow)](https://bun.sh)

---

## 简介

**aero** 是一个 TypeScript / Bun 基础设施即代码（IaC）流水线，将分散的上游规则集（主要来自 [blackmatrix7/ios_rule_script](https://github.com/blackmatrix7/ios_rule_script)）自动拉取、清洗、去重、分类，最终生成可直接订阅使用的完整 mihomo 配置文件。

整个流程分为两个阶段：

1. **Pipeline（流水线）** —— 拉取远端规则、验证格式、降级分类、去重排序，输出按类别组织的 rule-provider YAML 文件。
2. **Builder（构建器）** —— 将静态配置骨架（端口、DNS、代理、代理组、TUN、嗅探等）与动态生成的 rule-providers 和 rules 合并，输出可直接使用的 `config.yaml`。

---

## 功能特性

- **自动规则聚合**：从多个上游源并行拉取规则，自动去重、排序、分类。
- **智能规则降级**：
  - `DOMAIN` / `DOMAIN-SUFFIX` → `behavior: domain`
  - `IP-CIDR` / `IP-CIDR6` → `behavior: ipcidr`
  - 其他复杂规则 → `behavior: classical`
- **域名规范化**：自动将 `*.example.com` 和 `example.com` 统一为 `+.example.com`。
- **多 CDN 分发**：一次构建同时生成 GitHub Raw、jsDelivr、fastly.jsdelivr 三个变体配置文件，方便不同网络环境订阅。
- **类型安全**：全 TypeScript 编写，配置阶段即完成代理引用校验，杜绝手误。
- **CI/CD 全自动**：支持 GitHub Actions 定时构建并发布到 `release` 分支，生成每日 Release。

---

## 环境要求

| 工具 | 版本要求 | 说明 |
|------|----------|------|
| [pnpm](https://pnpm.io) | >= 11.1.1 | 包管理器（`.npmrc` 强制锁定） |
| [Bun](https://bun.sh) | >= 1.3.0 | 运行时（通过 pnpm 解析，无需全局安装） |

> 本项目不使用 npm 或 yarn。

---

## 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/uyloal/aero.git
cd aero
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 填入代理节点（重要）

`src/config/proxies.ts` 默认留空，避免敏感信息进入版本控制。首次使用必须填入你的代理节点：

```bash
# 编辑 src/config/proxies.ts，填入 SS / VMess / VLESS 等节点
# 也可以直接订阅代理集（proxy-provider）
```

参考示例（`src/config/proxies.ts`）：

```typescript
import type { Proxy, ProxyProvider } from '../mihomo/types'

export const PROXIES = [
  {
    name: 'HK-01',
    type: 'ss',
    server: '1.2.3.4',
    port: 8388,
    cipher: 'aes-256-gcm',
    password: 'your-password',
    udp: true
  }
] as const satisfies readonly Proxy[]

export type ProxyName = (typeof PROXIES)[number]['name']

export const PROXY_PROVIDERS: Record<string, ProxyProvider> = {
  'Airport-Sub': {
    type: 'http',
    url: 'https://your-sub-url',
    interval: 3600,
    path: './proxy-providers/airport.yaml',
    'health-check': {
      enable: true,
      url: 'http://www.gstatic.com/generate_204',
      interval: 300
    },
    proxy: 'DIRECT'
  }
}
```

> 填入后该文件仅保存在本地，**不要提交到仓库**。

### 4. 构建配置

```bash
pnpm build
```

构建完成后，所有产物将输出到 `output/` 目录：

```
output/
├── config.yaml              # GitHub Raw 地址变体
├── config-jsdelivr.yaml     # jsDelivr CDN 变体
├── config-fastly.yaml       # fastly.jsdelivr CDN 变体
└── rules/
    ├── ai-domain.yaml
    ├── ai-classical.yaml
    ├── proxy-domain.yaml
    ├── proxy-ip.yaml
    ├── proxy-classical.yaml
    ├── direct-domain.yaml
    ├── direct-ip.yaml
    ├── direct-classical.yaml
    ├── sg-domain.yaml
    ├── us-domain.yaml
    ├── eu-domain.yaml
    └── ...
```

### 5. 在 mihomo 中使用

将 `output/config.yaml` 复制到 mihomo 配置目录，或在客户端中直接订阅 `config.yaml` 的远程地址（如果你已部署到 GitHub Pages 或 release 分支）。

---

## 自行构建

如果你不想直接使用 Release 中的预构建配置，或需要自定义代理节点、规则类别，可以 fork 本仓库后自行构建。

### 环境准备

确保已安装：

- [pnpm](https://pnpm.io) >= 11.1.1
- [Bun](https://bun.sh) >= 1.3.0（通过 pnpm 解析，无需全局安装）

### 1. Fork 并克隆仓库

```bash
git clone https://github.com/<你的用户名>/aero.git
cd aero
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 自定义配置

所有配置集中在 `src/config/` 目录，按需修改后重新构建即可：

| 文件 | 作用 | 是否必须修改 |
|------|------|-------------|
| `src/config/proxies.ts` | 代理节点（SS / VMess / VLESS / Trojan 等） | **是**（本地填入，不入版本库） |
| `src/config/proxy-groups.ts` | 代理组（selector / url-test / fallback） | 按需 |
| `src/config/routing.ts` | 类别 → 代理组映射（如 `ai → AI`） | 按需 |
| `src/config/rules.ts` | 手动规则（最高优先级 + 兜底 MATCH） | 按需 |
| `src/config/base.ts` | 基础设置（端口、TUN、日志等） | 按需 |
| `src/config/dns.ts` | DNS（fake-ip、分流、China 解析器） | 按需 |
| `src/config/pipeline.ts` | 上游规则源、远程分发基础地址 | 按需 |

> **关于 `proxies.ts`**：该文件默认留空，避免敏感信息泄露。请仅在本地填入真实节点，**不要提交到仓库**。如果启用 GitHub Actions，可通过 `PROXIES_TS` secret 在 CI 中注入（见下文）。

### 4. 本地构建

```bash
pnpm build
```

构建产物输出到 `output/`：

```
output/
├── config.yaml              # GitHub Raw 地址变体
├── config-jsdelivr.yaml     # jsDelivr CDN 变体
├── config-fastly.yaml       # fastly.jsdelivr CDN 变体
└── rules/
    └── ...                  # 各类别 rule-provider 文件
```

### 5. 使用构建产物

- **本地使用**：将 `output/config.yaml` 复制到 mihomo 配置目录
- **部署到 GitHub Pages / release 分支**：
  - 在仓库 Settings → Pages 中启用 GitHub Pages（选择 `release` 分支）
  - 或直接订阅 GitHub Raw 地址

### 6. 启用 GitHub Actions 自动构建（可选）

本项目已配置好 CI/CD 工作流，fork 后需要在你的仓库中启用：

1. 进入仓库 **Settings → Actions → General**
2. 选择 **Allow all actions and reusable workflows**
3. 配置仓库变量（可选）：
   - 进入 **Settings → Secrets and variables → Actions → Variables**
   - 添加 `PROVIDER_BASE_URL`（自定义 rule-provider 远程地址前缀，默认为本仓库地址）
4. 配置代理节点 secret（必须，否则 CI 构建的配置中没有可用代理）：
   - 进入 **Settings → Secrets and variables → Actions → Secrets**
   - 添加 `PROXIES_TS`，内容为完整的 `src/config/proxies.ts` 文件（包含 import 和 export）
   - 示例 secret 内容见下文
5. 工作流会自动在以下时机触发：
   - 每次 `push` 到 `main` 分支
   - 每日 UTC 00:00 定时构建

CI 构建流程：
1. 注入 `PROXIES_TS` secret 覆写 `src/config/proxies.ts`
2. 拉取最新上游规则
3. 构建所有配置变体
4. 部署到 `release` 分支
5. 创建/更新 Release，附带规则统计说明

### CI 环境变量与 Secrets

| 名称 | 类型 | 说明 | 默认值 |
|------|------|------|--------|
| `PROVIDER_BASE_URL` | Variable | rule-provider 远程 URL 的基础地址 | `https://raw.githubusercontent.com/<owner>/<repo>/release` |
| `PROXIES_TS` | Secret | 完整的 `src/config/proxies.ts` 文件内容，CI 构建时注入 | 无（必须配置） |

**`PROXIES_TS` secret 内容示例**：

```typescript
import type { Proxy, ProxyProvider } from '../mihomo/types'

export const PROXIES = [
  {
    name: 'HK-01',
    type: 'ss',
    server: '1.2.3.4',
    port: 8388,
    cipher: 'aes-256-gcm',
    password: 'your-password',
    udp: true
  },
  {
    name: 'SG-01',
    type: 'ss',
    server: '5.6.7.8',
    port: 8388,
    cipher: 'aes-256-gcm',
    password: 'your-password',
    udp: true
  }
] as const satisfies readonly Proxy[]

export type ProxyName = (typeof PROXIES)[number]['name']

export const PROXY_PROVIDERS: Record<string, ProxyProvider> = {
  'Airport-Sub': {
    type: 'http',
    url: 'https://your-sub-url',
    interval: 3600,
    path: './proxy-providers/airport.yaml',
    'health-check': {
      enable: true,
      url: 'http://www.gstatic.com/generate_204',
      interval: 300
    },
    proxy: 'DIRECT'
  }
}
```

---

## 使用方法

### 本地开发

```bash
# 监视模式，文件变动自动重新构建
pnpm dev

# 代码格式化
pnpm format

# 代码检查（格式 +  lint + assist）
pnpm check
```

### 远程订阅（推荐）

本项目支持通过 GitHub Actions 全自动发布。每次推送到 `main` 分支，或每日定时（UTC 00:00）会自动：

1. 注入 `PROXIES_TS` secret 覆写代理配置（如已配置）
2. 拉取最新上游规则
3. 构建所有配置变体
4. 部署到 `release` 分支
5. 创建或更新 Release，附带规则统计说明

> **注意**：若未配置 `PROXIES_TS` secret，CI 发布的配置将不包含任何代理节点，仅适合作为规则集使用。

订阅地址示例（请替换 `uyloal/aero` 为实际仓库）：

| 变体 | 订阅地址 |
|------|----------|
| GitHub Raw | `https://raw.githubusercontent.com/uyloal/aero/release/config.yaml` |
| jsDelivr | `https://cdn.jsdelivr.net/gh/uyloal/aero@release/config.yaml` |
| fastly.jsdelivr | `https://fastly.jsdelivr.net/gh/uyloal/aero@release/config.yaml` |

### 自定义规则与代理

所有配置集中在 `src/config/` 目录，修改后重新运行 `pnpm build` 即可生成新配置：

| 文件 | 作用 | 敏感 |
|------|------|------|
| `src/config/proxies.ts` | 定义代理节点（SS / VMess / VLESS 等） | 是（默认留空） |
| `src/config/proxy-groups.ts` | 定义代理组（selector / url-test / fallback 等） | 否 |
| `src/config/routing.ts` | 将类别映射到代理组（如 `ai → AI`） | 否 |
| `src/config/rules.ts` | 手动规则（最高优先级和兜底规则） | 否 |
| `src/config/base.ts` | 基础设置（端口、TUN、日志级别等） | 否 |
| `src/config/dns.ts` | DNS 配置（fake-ip、分流、China 解析器等） | 否 |
| `src/config/pipeline.ts` | 上游规则源配置及远程分发地址 | 否 |
| `src/config/sniffer.ts` | 流量嗅探配置 | 否 |
| `src/config/listeners.ts` | 入站监听器配置 | 否 |

> **敏感文件处理**：`src/config/proxies.ts` 默认为空，避免密码和订阅地址泄露。本地使用时填入真实信息即可，无需提交。启用 GitHub Actions 时通过 `PROXIES_TS` secret 注入。

### 当前内置类别

| 类别 | 说明 |
|------|------|
| `ai` | AI 服务（OpenAI、Claude、Gemini、BardAI 等） |
| `proxy` | 通用代理规则（全球媒体、GitHub、TikTok 等） |
| `direct` | 中国大陆直连（微信、政府网站、ChinaIPs 等） |
| `sg` | 新加坡区域（TelegramSG） |
| `us` | 美国区域（HBO、Hulu、TelegramUS 等） |
| `eu` | 欧洲区域（TelegramNL） |

---

## 项目架构

```
Phase 1: Pipeline
  fetcher → validator → demoter → compiler → YAML output to output/rules/

Phase 2: Builder
  PipelineManifest + CONFIG_SKELETON → rule-providers + rules → output/config.yaml
```

### Pipeline 阶段

- **fetcher** —— 通过 `ky` 并行拉取上游 YAML，支持 10 秒超时和 3 次自动重试。
- **validator** —— 用 `valibot` 验证规则格式 `{ payload: string[] }`。
- **demoter** —— 将规则分类为 `domain`、`ipcidr`、`classical`，丢弃本地环境规则（`PROCESS-*`、`UID`）。
- **compiler** —— 跨源去重、排序，生成最终 rule-provider 文件。

### Builder 阶段

- **buildRuleProviders()** —— 为每个类别和变体动态生成 `rule-providers` 配置。
- **buildRules()** —— 拼接最终 `rules` 数组：手动规则优先，生成的 `RULE-SET` 随后，IP 规则自动附加 `no-resolve`。
- **buildConfig()** —— 合并静态配置与动态生成内容，输出完整 `MihomoConfig`。

---

## 输出说明

| 文件 | 说明 |
|------|------|
| `output/config.yaml` | 完整 mihomo 配置，rule-provider 指向 GitHub Raw |
| `output/config-jsdelivr.yaml` | rule-provider 指向 jsDelivr CDN |
| `output/config-fastly.yaml` | rule-provider 指向 fastly.jsdelivr CDN |
| `output/rules/<category>-domain.yaml` | `behavior: domain` 的规则集合 |
| `output/rules/<category>-ip.yaml` | `behavior: ipcidr` 的规则集合 |
| `output/rules/<category>-classical.yaml` | `behavior: classical` 的规则集合 |

每个类别仅输出非空的规则文件。

---

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feat/my-feature`
3. 提交更改：`git commit -am 'feat: add some feature'`
4. 推送分支：`git push origin feat/my-feature`
5. 提交 Pull Request

请确保提交前运行 `pnpm check` 通过代码检查。

---

## 许可证

[MIT](LICENSE)
