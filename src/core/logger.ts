import { createConsola, type ConsolaReporter } from 'consola'
import { formatWithOptions } from 'node:util'

const typeIcon: Record<string, string> = {
  info: 'ℹ',
  success: '✔',
  warn: '⚠',
  error: '✖',
  fatal: '✖',
  ready: '✔',
  start: 'ℹ',
  log: ''
}

const typeColor: Record<string, string> = {
  info: '\x1b[36m',
  success: '\x1b[32m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
  fatal: '\x1b[31m',
  ready: '\x1b[32m',
  start: '\x1b[36m'
}

const customReporter: ConsolaReporter = {
  log: (logObj) => {
    const icon = typeIcon[logObj.type] ?? ''
    const color = typeColor[logObj.type] ?? ''
    const prefix = icon ? `${color}${icon}\x1b[0m ` : ''
    const message = formatWithOptions({ colors: true }, ...logObj.args)
    process.stdout.write(`${prefix}${message}\n`)
  }
}

export const logger = createConsola({
  reporters: [customReporter]
})

export function link(text: string, url: string): string {
  const OSC = ']'
  const ST = '\\'
  return `${OSC}8;;${url}${ST}${text}${OSC}8;;${ST}`
}
