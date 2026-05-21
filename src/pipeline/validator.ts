import * as v from 'valibot'
import YAML from 'yaml'

const PayloadSchema = v.object({
  payload: v.array(v.string())
})

export function validatePayload(rawYaml: string): string[] {
  const parsed = YAML.parse(rawYaml)
  const result = v.safeParse(PayloadSchema, parsed)

  if (!result.success) {
    const issues = result.issues.map((issue) => issue.message).join(', ')
    throw new Error(`Schema validation failed: ${issues}`)
  }

  return result.output.payload
}
