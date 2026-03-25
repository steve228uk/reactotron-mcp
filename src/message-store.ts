import type { ReactotronMessage, LogPayload, ApiResponsePayload, CustomCommandRegistration, StateActionCompletePayload, StateValuesChangePayload, BenchmarkReportPayload, ClientIntroPayload } from "./types.js"

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
  displays: ReactotronMessage[] = []
  timeline: ReactotronMessage[] = []
  customCommands = new Map<string, CustomCommandRegistration>()
  clientInfo: ClientIntroPayload | null = null

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
      case "display":
        addToBuffer(this.displays, msg)
        break
      case "client.intro":
        this.clientInfo = msg.payload as ClientIntroPayload
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

  getNetwork(opts: { url?: string; method?: string; status?: number; minDuration?: number; limit?: number } = {}): ReactotronMessage[] {
    let items = this.apiResponses
    if (opts.url) {
      const q = opts.url.toLowerCase()
      items = items.filter((m) => {
        const payload = m.payload as ApiResponsePayload
        return payload?.request?.url?.toLowerCase().includes(q)
      })
    }
    if (opts.method) {
      const m = opts.method.toUpperCase()
      items = items.filter((msg) => {
        const payload = msg.payload as ApiResponsePayload
        return payload?.request?.method?.toUpperCase() === m
      })
    }
    if (opts.status !== undefined) {
      items = items.filter((m) => {
        const payload = m.payload as ApiResponsePayload
        return payload?.response?.status === opts.status
      })
    }
    if (opts.minDuration !== undefined) {
      const min = opts.minDuration
      items = items.filter((m) => {
        const payload = m.payload as ApiResponsePayload
        return (payload?.duration ?? 0) >= min
      })
    }
    return items.slice(-(opts.limit ?? 50))
  }

  getStateActions(opts: { actionType?: string; limit?: number } = {}): ReactotronMessage[] {
    let items = this.stateActions
    if (opts.actionType) {
      const q = opts.actionType.toLowerCase()
      items = items.filter((m) => {
        const payload = m.payload as StateActionCompletePayload
        return payload?.action?.type?.toLowerCase().includes(q)
      })
    }
    return items.slice(-(opts.limit ?? 50))
  }

  getStateChanges(opts: { path?: string; limit?: number } = {}): ReactotronMessage[] {
    let items = this.stateChanges
    if (opts.path) {
      const q = opts.path.toLowerCase()
      items = items.filter((m) => {
        const payload = m.payload as StateValuesChangePayload
        return payload?.changes?.some((c) => c.path?.toLowerCase().includes(q))
      })
    }
    return items.slice(-(opts.limit ?? 50))
  }

  getDisplays(opts: { search?: string; limit?: number } = {}): ReactotronMessage[] {
    let items = this.displays
    if (opts.search) {
      const q = opts.search.toLowerCase()
      items = items.filter((m) => {
        const payload = m.payload as { name?: string; preview?: string }
        return (
          payload?.name?.toLowerCase().includes(q) ||
          payload?.preview?.toLowerCase().includes(q)
        )
      })
    }
    return items.slice(-(opts.limit ?? 50))
  }

  getBenchmarks(opts: { search?: string; limit?: number } = {}): ReactotronMessage[] {
    let items = this.benchmarks
    if (opts.search) {
      const q = opts.search.toLowerCase()
      items = items.filter((m) => {
        const payload = m.payload as BenchmarkReportPayload
        return payload?.title?.toLowerCase().includes(q)
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
      this.displays = []
      this.timeline = []
      return count
    }
    const buffers: Partial<Record<string, ReactotronMessage[]>> = {
      log: this.logs,
      "api.response": this.apiResponses,
      "state.action.complete": this.stateActions,
      "state.values.change": this.stateChanges,
      "benchmark.report": this.benchmarks,
      display: this.displays,
    }
    const buffer = buffers[type]
    if (!buffer) return 0
    const count = buffer.length
    buffer.length = 0
    this.timeline = this.timeline.filter((m) => m.type !== type)
    return count
  }
}
