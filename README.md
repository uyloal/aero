# aero

Generate [mihomo](https://github.com/MetaCubeX/mihomo) rule-provider YAML files from upstream sources.

## What it does

aero fetches rule sets (primarily from [blackmatrix7/ios_rule_script](https://github.com/blackmatrix7/ios_rule_script)), normalizes them into `domain` / `ipcidr` / `classical` behaviors, and emits per-category YAML files ready for use as mihomo rule providers.

## Pipeline

```
fetcher → validator → demoter → compiler → YAML output
```

- **fetcher** — Fetches raw YAML via `ky` with retries (10s timeout, 3 retries).
- **validator** — Parses YAML and validates the root shape is `{ payload: string[] }`.
- **demoter** — Categorizes each rule line into `domains`, `ips`, `classical`, or `dropped`.
- **compiler** — Deduplicates and sorts rules across all successful sources for a category.

## Output

Emitted to `output/rules/`. Each category produces up to 3 files:

- `<category>-domain.yaml` — `behavior: domain`
- `<category>-ip.yaml` — `behavior: ipcidr`
- `<category>-classical.yaml` — `behavior: classical`

## Quick start

Requires [pnpm](https://pnpm.io/) >= 11.1.1 and Bun >= 1.3.0.

```bash
pnpm install
pnpm build
```

Output files will be written to `output/rules/`.

## Development

```bash
pnpm dev      # watch mode
pnpm format   # Biome formatter
pnpm lint     # Biome linter
pnpm check    # Biome check (format + lint + assist)
```

## Configuration

Upstream sources and categories are defined in [`src/core/config.ts`](src/core/config.ts). Add new categories or sources there.

Current categories:

| Category | Description |
|----------|-------------|
| `ai`     | AI services (OpenAI, Claude, Gemini, etc.) |
| `proxy`  | General proxy rules |
| `direct` | China mainland / direct routes |
| `sg`     | Singapore region |
| `us`     | United States region |
| `eu`     | Europe region |

## Domain normalization

`DOMAIN-SUFFIX` rules are normalized into mihomo/Clash wildcard form:

- `*.example.com` → `+.example.com`
- `example.com` → `+.example.com`
- `+.example.com` stays as-is

## License

[MIT](LICENSE)
