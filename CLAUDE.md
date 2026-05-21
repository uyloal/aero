# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript/Bun pipeline that generates mihomo rule-provider YAML files from upstream sources. It fetches rule sets (primarily from blackmatrix7/ios_rule_script), normalizes them into `domain`/`ipcidr`/`classical` behaviors, and emits per-category YAML files for use with [mihomo](https://github.com/MetaCubeX/mihomo) (a Clash proxy client).

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

The pipeline is a sequential flow through `src/pipeline/` modules, orchestrated from `src/index.ts`:

```
fetcher → validator → demoter → compiler → YAML output
```

### Modules

- **`src/core/config.ts`** — `PIPELINE_CONFIG` maps each category (e.g. `ai`, `google`, `netflix`) to an array of upstream sources (`{ id, url }`). Uses the `bm7()` helper for blackmatrix7/ios_rule_script URLs. Add new categories/sources here.
- **`src/pipeline/fetcher.ts`** — Fetches raw YAML via `ky` with retries (10s timeout, 3 retries on standard failure status codes).
- **`src/pipeline/validator.ts`** — Parses YAML and validates with `valibot` that the root shape is `{ payload: string[] }`.
- **`src/pipeline/demoter.ts`** — Categorizes each rule line into:
  - `domains`: `DOMAIN`, `DOMAIN-SUFFIX` (normalized), `DOMAIN-WILDCARD`
  - `ips`: `IP-CIDR`, `IP-CIDR6`
  - `classical`: `DOMAIN-KEYWORD`
  - `dropped`: everything else (counted by type, discarded)
- **`src/pipeline/compiler.ts`** — Deduplicates and sorts domains, IPs, and classical rules across all successful sources for a category.

### Output

Emitted to `output/rules/` (the `output/` directory is cleared at the start of each run). Each category produces up to 3 files, only when the corresponding list is non-empty:

- `<category>-domain.yaml` — `payload` array for `behavior: domain`
- `<category>-ip.yaml` — `payload` array for `behavior: ipcidr`
- `<category>-classical.yaml` — `payload` array for `behavior: classical`

### Domain Normalization

`demoter.ts` normalizes `DOMAIN-SUFFIX` rules into mihomo/Clash wildcard form:

- `*.example.com` → `+.example.com`
- `example.com` → `+.example.com`
- `+.example.com` stays as-is

### Error Handling

Each source within a category is fetched in parallel with `Promise.allSettled`. If a source fails, it is logged and skipped. If all sources for a category fail, the category is skipped and the pipeline continues for remaining categories.

## Code Style

- **Formatter/Linter**: Biome (120 char line width, 2-space indent, single quotes, no semicolons, no trailing commas).
- Linter is **disabled** in `biome.json` (`linter.enabled: false`).
- The project uses ES modules (`"type": "module"`).

## Documentation Reference

Mihomo configuration documentation lives in the `Meta-Docs/` submodule under `Meta-Docs/docs/config/`. Key files to consult when modifying rule handling:

- `Meta-Docs/docs/config/rules/index.md` — routing rule types and formats
- `Meta-Docs/docs/config/rule-providers/index.md` — rule-provider configuration
- `Meta-Docs/docs/config/rule-providers/content.md` — file content formats for `classical`/`domain`/`ipcidr`
- `Meta-Docs/docs/handbook/syntax.md` — Clash wildcard syntax (`*` / `+` / `.`)
