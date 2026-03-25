import { WebSocket, WebSocketServer } from "ws"
import type { MessageStore } from "./message-store.js"
import type { ReactotronMessage } from "./types.js"

const RECONNECT_DELAYS_MS = [1000, 2000, 4000, 8000, 16000]

type PendingQuery = {
  resolve: (value: unknown) => void
  reject: (reason: unknown) => void
  timer: ReturnType<typeof setTimeout>
}

class Mutex {
  private queue = Promise.resolve()
  runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    const result = this.queue.then(fn)
    this.queue = result.then(
      () => undefined,
      () => undefined,
    )
    return result
  }
}

class ProxyConnection {
  private appSocket: WebSocket
  private upstream: WebSocket | null = null
  private readonly reactotronHost: string
  private readonly reactotronPort: number
  private readonly onMessage: (msg: ReactotronMessage) => void
  private readonly onClose: () => void
  private reconnectAttempt = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private closed = false

  /** True when the upstream Reactotron desktop connection is open */
  reactotronConnected = false

  constructor(
    appSocket: WebSocket,
    reactotronHost: string,
    reactotronPort: number,
    onMessage: (msg: ReactotronMessage) => void,
    onClose: () => void,
  ) {
    this.appSocket = appSocket
    this.reactotronHost = reactotronHost
    this.reactotronPort = reactotronPort
    this.onMessage = onMessage
    this.onClose = onClose

    this._connectUpstream()

    appSocket.on("message", (data) => {
      const raw = data.toString()
      if (this.upstream?.readyState === WebSocket.OPEN) {
        this.upstream.send(raw)
      }
      try {
        this.onMessage(JSON.parse(raw) as ReactotronMessage)
      } catch {
        // ignore malformed
      }
    })

    appSocket.on("close", () => {
      this.closed = true
      this._cancelReconnect()
      this.upstream?.close()
      this.onClose()
    })

    appSocket.on("error", () => {
      // error always followed by close
    })
  }

  private _connectUpstream(): void {
    if (this.closed) return

    const upstream = new WebSocket(`ws://${this.reactotronHost}:${this.reactotronPort}`)
    this.upstream = upstream
    this.reactotronConnected = false

    upstream.on("open", () => {
      this.reactotronConnected = true
      this.reconnectAttempt = 0
    })

    upstream.on("message", (data) => {
      const raw = data.toString()
      if (this.appSocket.readyState === WebSocket.OPEN) {
        this.appSocket.send(raw)
      }
      try {
        this.onMessage(JSON.parse(raw) as ReactotronMessage)
      } catch {
        // ignore malformed
      }
    })

    upstream.on("close", () => {
      this.reactotronConnected = false
      // Keep the app socket alive and schedule a reconnect to Reactotron
      this._scheduleReconnect()
    })

    upstream.on("error", () => {
      // error always followed by close; reconnect is handled there
    })
  }

  private _scheduleReconnect(): void {
    if (this.closed) return
    const delay = RECONNECT_DELAYS_MS[Math.min(this.reconnectAttempt, RECONNECT_DELAYS_MS.length - 1)]
    this.reconnectAttempt++
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this._connectUpstream()
    }, delay)
  }

  private _cancelReconnect(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  sendToApp(msg: Partial<ReactotronMessage>): void {
    if (this.appSocket.readyState !== WebSocket.OPEN) return
    this.appSocket.send(
      JSON.stringify({
        ...msg,
        important: msg.important ?? false,
        date: new Date().toISOString(),
        deltaTime: 0,
      }),
    )
  }

  close(): void {
    this.closed = true
    this._cancelReconnect()
    this.appSocket.close()
  }
}

export class ProxyServer {
  private wss: WebSocketServer
  private store: MessageStore
  private reactotronHost: string
  private reactotronPort: number
  private timeout: number
  private activeConnection: ProxyConnection | null = null
  private stateQueryMutex = new Mutex()
  private pendingKeys: PendingQuery | null = null
  private pendingValues: PendingQuery | null = null

  connected = false
  readonly proxyPort: number

  constructor(
    store: MessageStore,
    opts: {
      proxyPort?: number
      reactotronPort?: number
      reactotronHost?: string
      timeout?: number
    } = {},
  ) {
    this.store = store
    this.reactotronHost = opts.reactotronHost ?? "localhost"
    this.reactotronPort = opts.reactotronPort ?? 9090
    this.timeout = opts.timeout ?? 5000
    this.proxyPort = opts.proxyPort ?? 9091

    this.wss = new WebSocketServer({ port: this.proxyPort })

    this.wss.on("connection", (appSocket) => {
      this.activeConnection?.close()
      this.connected = true
      this.activeConnection = new ProxyConnection(
        appSocket,
        this.reactotronHost,
        this.reactotronPort,
        (msg) => this._handleMessage(msg),
        () => {
          this.connected = false
          this.activeConnection = null
          this._rejectPendingQueries(new Error("App disconnected"))
        },
      )
    })
  }

  private _handleMessage(msg: ReactotronMessage): void {
    if (msg.type === "state.keys.response" && this.pendingKeys) {
      clearTimeout(this.pendingKeys.timer)
      this.pendingKeys.resolve(msg.payload)
      this.pendingKeys = null
    } else if (msg.type === "state.values.response" && this.pendingValues) {
      clearTimeout(this.pendingValues.timer)
      this.pendingValues.resolve(msg.payload)
      this.pendingValues = null
    }

    this.store.ingest(msg)
  }

  private _rejectPendingQueries(err: Error): void {
    if (this.pendingKeys) {
      clearTimeout(this.pendingKeys.timer)
      this.pendingKeys.reject(err)
      this.pendingKeys = null
    }
    if (this.pendingValues) {
      clearTimeout(this.pendingValues.timer)
      this.pendingValues.reject(err)
      this.pendingValues = null
    }
  }

  queryStateKeys(path: string): Promise<unknown> {
    return this.stateQueryMutex.runExclusive(() => {
      if (!this.activeConnection) {
        return Promise.reject(new Error("No app connected to the proxy"))
      }
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          this.pendingKeys = null
          reject(new Error("State keys query timed out"))
        }, this.timeout)
        this.pendingKeys = { resolve, reject, timer }
        this.activeConnection!.sendToApp({ type: "state.keys.request", payload: { path } })
      })
    })
  }

  queryStateValues(path: string): Promise<unknown> {
    return this.stateQueryMutex.runExclusive(() => {
      if (!this.activeConnection) {
        return Promise.reject(new Error("No app connected to the proxy"))
      }
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          this.pendingValues = null
          reject(new Error("State values query timed out"))
        }, this.timeout)
        this.pendingValues = { resolve, reject, timer }
        this.activeConnection!.sendToApp({ type: "state.values.request", payload: { path } })
      })
    })
  }

  sendCustomCommand(command: string, args?: Record<string, unknown>): void {
    this.activeConnection?.sendToApp({
      type: "custom",
      payload: args ? { command, args } : { command },
    })
  }

  dispatchAction(type: string, payload?: unknown): void {
    this.activeConnection?.sendToApp({
      type: "state.action.dispatch",
      payload: { action: { type, ...(payload !== undefined ? { payload } : {}) } },
    })
  }

  close(): void {
    this.wss.close()
  }
}
