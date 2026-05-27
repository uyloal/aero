import * as v from 'valibot'
import YAML from 'yaml'

const PayloadSchema = v.object({
  payload: v.array(v.string())
})

export function parsePayload(raw: string, format: 'yaml' | 'list' = 'yaml'): string[] {
  if (format === 'list') {
    return raw
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
  }

  const parsed = YAML.parse(raw)
  const result = v.safeParse(PayloadSchema, parsed)

  if (!result.success) {
    const issues = result.issues.map((issue) => issue.message).join(', ')
    throw new Error(`Schema validation failed: ${issues}`)
  }

  return result.output.payload
}
