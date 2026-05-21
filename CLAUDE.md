# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript/Bun IaC pipeline that generates a complete mihomo (Clash.Meta) configuration YAML. It operates in two phases:

1. **Pipeline** — fetches upstream rule sets (primarily from blackmatrix7/ios_rule_script), normalizes them into `domain`/`ipcidr`/`classical` behaviors, deduplicates, and emits per-category rule-provider YAML files.
2. **Builder** — assembles a full mihomo config skeleton (`port`, `dns`, `proxies`, `proxy-groups`, `tun`, `sniffer`, etc.), dynamically injects `rule-providers` pointing to the generated rule files, stitches `rules` from manual rules + generated `RULE-SET` entries, and outputs a single `config.yaml`.

The final artifact is a self-contained mihomo config ready for public subscription distribution.

## Toolchain

- **Primary CLI**: pnpm >= 11.1.1 (enforced via `.npmrc` and `packageManager` field)
- **Execution runtime**: Bun >= 1.3.0 (resolved through pnpm, not required as a global binary)
- Do not use npm or yarn. `.npmrc` has `package-manager=pnpm` and `engine-strict=true`.
- Prefer Bun-native APIs over Node.js equivalents. File I/O uses `Bun.write()`, directory shell operations use `import { $ } from 'bun'`, and types come from `bun-types` / `@types/bun` (not `@types/node`).

## Commands

- **Run**: `pnpm build` (runs `bun run src/index.ts` via the pnpm-managed Bun runtime)
- **Dev (watch)**: `pnpm dev` — runs with `--watch`
- **Format**: `pnpm format` — Biome formatter write mode
- **Lint**: `pnpm lint` — Biome linter write mode
- **Check**: `pnpm check` — Biome check (format + lint + assist)

## Architecture

The application is a two-phase engine orchestrated from `src/index.ts`:

```
Phase 1: Pipeline
  fetcher → validator → demoter → compiler → YAML output to output/rules/

Phase 2: Builder
  PipelineManifest + CONFIG_SKELETON → rule-providers + rules → output/config.yaml
```

### Phase 1: Pipeline (`src/pipeline/`)

- **`src/pipeline/runner.ts`** — Orchestrates the pipeline. Clears `output/`, iterates `PIPELINE_CONFIG` categories, runs each through the stages below, collects per-category statistics, and returns a `PipelineManifest` (list of generated files with category, demote type, filename, and rule count).
- **`src/pipeline/fetcher.ts`** — Fetches raw YAML via `ky` with retries (10s timeout, 3 retries on standard failure status codes).
- **`src/pipeline/validator.ts`** — Parses YAML and validates with `valibot` that the root shape is `{ payload: string[] }`.
- **`src/pipeline/demoter.ts`** — Categorizes each rule line into:
  - `domains`: `DOMAIN`, `DOMAIN-SUFFIX` (normalized into `+.` wildcard form)
  - `ips`: `IP-CIDR`, `IP-CIDR6`
  - `classical`: `DOMAIN-KEYWORD`, `DOMAIN-WILDCARD`, `DOMAIN-REGEX`, `GEOSITE`, `IP-SUFFIX`, `IP-ASN`, `GEOIP`, `SRC-*`, port rules, `NETWORK`, `DSCP`, logic operators (`AND`/`OR`/`NOT`), `MATCH`
  - `dropped`: unrecognized rule types (counted by type, logged). `PROCESS-*` and `UID` rules are silently discarded as they are local-environment rules that should not appear in remote subscriptions.
- **`src/pipeline/compiler.ts`** — Deduplicates and sorts domains, IPs, and classical rules across all successful sources for a category. Produces `CompiledResult` and serializes YAML with `serializeYaml()`.

### Phase 2: Builder (`src/builder.ts`)

- Receives the `PipelineManifest` from the pipeline.
- **`buildRuleProviders()`** — Dynamically constructs `rule-providers` entries. Each provider uses `type: 'http'` with a remote URL derived from `REMOTE_BASE_URL` (env-driven) and a local `path` under `./rule-providers/`.
- **`buildRules()`** — Stitches the final `rules` array:
  - Manual rules (`MANUAL_RULES`) are inserted first (highest priority).
  - Generated `RULE-SET` entries follow, mapped via `ROUTING_MAP` to their target proxy groups.
  - IP-type rule-sets automatically append `no-resolve`.
  - Tail `MATCH` rule is already present in `MANUAL_RULES`.
- **`buildConfig()`** — Merges `CONFIG_SKELETON` (all static config modules) with the generated `rule-providers` and `rules` into a complete `MihomoConfig` object.
- **`runBuilder()`** — Serializes to `output/config.yaml` and logs rule/provider counts.

### Config Skeleton (`src/config/`)

Static configuration modules aggregated into `CONFIG_SKELETON` by `src/config/index.ts`. The skeleton omits `rule-providers` and `rules`, which the Builder injects at runtime.

- **`src/config/pipeline.ts`** — `PIPELINE_CONFIG` maps each category (`ai`, `proxy`, `direct`, `sg`, `us`, `eu`) to an array of upstream sources. Uses the `bm7()` helper for blackmatrix7/ios_rule_script URLs. `REMOTE_BASE_URL` is driven by the `PROVIDER_BASE_URL` environment variable. `Category` and `Upstream` types live here.
- **`src/config/base.ts`** — Base mihomo settings: ports (`mixed-port`), `allow-lan`, `tun`, `geodata-*`, `geo-auto-update`, `geox-url`, `keep-alive-*`, `log-level`, `ipv6`, `global-client-fingerprint`, `external-controller`, `profile`, `find-process-mode`, etc.
- **`src/config/dns.ts`** — Full `DnsConfig`: `fake-ip` mode, `nameserver-policy`, fallback filtering, China-specific resolvers, etc.
- **`src/config/proxies.ts`** — `PROXIES` array with type-level validation (`as const satisfies readonly Proxy[]`). Defines proxy nodes (SS, VMess, VLESS, etc.). `ProxyName` is derived from this array.
- **`src/config/proxy-groups.ts`** — `PROXY_GROUPS` array defining selectors and url-test groups. Uses `as const` to derive `GroupName`. Includes compile-time verification (`VerifyGroups` / `Assert`) that every group's `proxies` array only references valid `ProxyRef` values (no typos or dangling references).
- **`src/config/routing.ts`** — `ROUTING_MAP`: maps each `Category` to a `TargetName` (a `ProxyRef`, i.e. a proxy node, group name, `DIRECT`, or `REJECT`). This is the bridge between Pipeline categories and Builder rules.
- **`src/config/rules.ts`** — `MANUAL_RULES`: local-environment rules (`PROCESS-NAME`, `IP-CIDR` for LAN, `GEOIP` for private/CN) and the tail `MATCH` fallback. Each rule is typed as `ManualRule<TargetName>` for compile-time target validation.
- **`src/config/remote.ts`** — `RULE_PROVIDER_INTERVAL`: default refresh interval for HTTP rule-providers (86400s).
- **`src/config/listeners.ts`** — Inbound listener definitions (e.g. `mixed-in`).
- **`src/config/sniffer.ts`** — Traffic sniffing config for TLS/HTTP/QUIC domain detection.

### Core Utilities

- **`src/core/logger.ts`** — Custom `consola` reporter with colored type icons (`ℹ`, `✔`, `⚠`, `✖`) and an OSC8 hyperlink helper (`link(text, url)`) for clickable terminal URLs.
- **`src/mihomo/types.ts`** — Exhaustive type definitions:
  - `RULE_TYPES` / `RuleType` / `ParsedRule` for all mihomo/Clash rule types.
  - `DEMOTE_TYPES` / `DemoteType` (`domain`, `ip`, `classical`).
  - `ManualRule<Target>` template-literal type for compile-time rule validation.
  - Full `MihomoConfig`, `Proxy`, `ProxyGroup`, `ProxyProvider`, `RuleProvider`, `DnsConfig` interfaces.

## Output

Emitted to `output/` (the directory is cleared at the start of each run):

- **`output/rules/<category>-domain.yaml`** — `payload` array for `behavior: domain`
- **`output/rules/<category>-ip.yaml`** — `payload` array for `behavior: ipcidr`
- **`output/rules/<category>-classical.yaml`** — `payload` array for `behavior: classical`
- **`output/config.yaml`** — Complete mihomo configuration ready for client consumption.

Each category produces up to 3 rule-provider files, only when the corresponding list is non-empty.

## Domain Normalization

`demoter.ts` normalizes `DOMAIN-SUFFIX` rules into mihomo/Clash wildcard form:

- `*.example.com` → `+.example.com`
- `example.com` → `+.example.com`
- `+.example.com` stays as-is

## Error Handling

Each source within a category is fetched in parallel with `Promise.allSettled`. If a source fails, it is logged and skipped. If all sources for a category fail, the category is skipped and the pipeline continues for remaining categories. The Builder always runs after the Pipeline regardless of partial failures.

## Code Style

- **Formatter/Linter**: Biome (120 char line width, 2-space indent, single quotes, no semicolons, no trailing commas).
- Linter and assist are **disabled** in `biome.json` (`linter.enabled: false`, `assist.enabled: false`).
- The project uses ES modules (`"type": "module"`).

## Documentation Reference

Mihomo configuration documentation lives in the `Meta-Docs/` submodule under `Meta-Docs/docs/config/`. Key files to consult when modifying rule handling:

- `Meta-Docs/docs/config/rules/index.md` — routing rule types and formats
- `Meta-Docs/docs/config/rule-providers/index.md` — rule-provider configuration
- `Meta-Docs/docs/config/rule-providers/content.md` — file content formats for `classical`/`domain`/`ipcidr`
- `Meta-Docs/docs/handbook/syntax.md` — Clash wildcard syntax (`*` / `+` / `.`)
