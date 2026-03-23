import type { ReactotronMessage, LogPayload, ApiResponsePayload, CustomCommandRegistration } from "./types.js"

const MAX_BUFFER = 1000

function deserializeSentinels(value: unknown): unknown {
  if (value === "~~~ undefined ~~~") return undefined
  if (value === "~~~ null ~~~") return null
  if (value === "~~~ Circular Reference ~~~") return "[Circular Reference]"
  if (Array.isArray(value)) return value.map(deserializeSentinels)
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = deserializeSentinels(v)
    }
    return out
  }
  return value
}

function addToBuffer<T>(buffer: T[], item: T): void {
  buffer.push(item)
  if (buffer.length > MAX_BUFFER) buffer.shift()
}

export class MessageStore {
  logs: ReactotronMessage[] = []
  apiResponses: ReactotronMessage[] = []
  stateActions: ReactotronMessage[] = []
  stateChanges: ReactotronMessage[] = []
  benchmarks: ReactotronMessage[] = []
  timeline: ReactotronMessage[] = []
  customCommands = new Map<string, CustomCommandRegistration>()

  ingest(raw: ReactotronMessage): void {
    const msg: ReactotronMessage = {
      ...raw,
      payload: deserializeSentinels(raw.payload),
    }

    addToBuffer(this.timeline, msg)

    switch (msg.type) {
      case "log":
        addToBuffer(this.logs, msg)
        break
      case "api.response":
        addToBuffer(this.apiResponses, msg)
        break
      case "state.action.complete":
        addToBuffer(this.stateActions, msg)
        break
      case "state.values.change":
        addToBuffer(this.stateChanges, msg)
        break
      case "benchmark.report":
        addToBuffer(this.benchmarks, msg)
        break
      case "customCommand.register": {
        const reg = msg.payload as CustomCommandRegistration
        if (reg?.command) this.customCommands.set(reg.command, reg)
        break
      }
      case "customCommand.unregister": {
        const reg = msg.payload as CustomCommandRegistration
        if (reg?.command) this.customCommands.delete(reg.command)
        break
      }
    }
  }

  getLogs(opts: { level?: string; search?: string; limit?: number } = {}): ReactotronMessage[] {
    let items = this.logs
    if (opts.level) {
      items = items.filter((m) => (m.payload as LogPayload)?.level === opts.level)
    }
    if (opts.search) {
      const q = opts.search.toLowerCase()
      items = items.filter((m) => {
        const payload = m.payload as LogPayload
        return String(payload?.message ?? "").toLowerCase().includes(q)
      })
    }
    return items.slice(-(opts.limit ?? 50))
  }

  getNetwork(opts: { url?: string; status?: number; limit?: number } = {}): ReactotronMessage[] {
    let items = this.apiResponses
    if (opts.url) {
      const q = opts.url.toLowerCase()
      items = items.filter((m) => {
        const payload = m.payload as ApiResponsePayload
        return payload?.request?.url?.toLowerCase().includes(q)
      })
    }
    if (opts.status !== undefined) {
      items = items.filter((m) => {
        const payload = m.payload as ApiResponsePayload
        return payload?.response?.status === opts.status
      })
    }
    return items.slice(-(opts.limit ?? 50))
  }

  getTimeline(opts: { types?: string[]; limit?: number } = {}): ReactotronMessage[] {
    let items = this.timeline
    if (opts.types && opts.types.length > 0) {
      items = items.filter((m) => opts.types!.includes(m.type))
    }
    return items.slice(-(opts.limit ?? 100))
  }

  clear(type?: string): number {
    if (!type) {
      const count = this.timeline.length
      this.logs = []
      this.apiResponses = []
      this.stateActions = []
      this.stateChanges = []
      this.benchmarks = []
      this.timeline = []
      return count
    }
    const buffers: Partial<Record<string, ReactotronMessage[]>> = {
      log: this.logs,
      "api.response": this.apiResponses,
      "state.action.complete": this.stateActions,
      "state.values.change": this.stateChanges,
      "benchmark.report": this.benchmarks,
    }
    const buffer = buffers[type]
    if (!buffer) return 0
    const count = buffer.length
    buffer.length = 0
    return count
  }
}
