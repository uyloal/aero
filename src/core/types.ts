export interface Upstream {
  id: string
  url: string
}

export type RuleCategory = string

export type PipelineConfig = Record<RuleCategory, Upstream[]>
