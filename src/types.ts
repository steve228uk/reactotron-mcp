export interface ReactotronMessage {
  type: string
  payload?: unknown
  important?: boolean
  date?: string
  deltaTime?: number
  connectionId?: number
  clientId?: string
  messageId?: number
}

export interface LogPayload {
  level: "log" | "debug" | "warn" | "error"
  message: unknown
  stack?: string
}

export interface ApiResponsePayload {
  duration: number
  request: {
    data?: unknown
    headers?: Record<string, string>
    method: string
    params?: unknown
    url: string
  }
  response: {
    body?: unknown
    headers?: Record<string, string>
    status: number
  }
}

export interface StateKeysResponsePayload {
  path: string
  keys: string[]
  valid: boolean
}

export interface StateValuesResponsePayload {
  path: string
  value: unknown
  valid: boolean
}

export interface CustomCommandRegistration {
  id: string | number
  command: string
  title?: string
  description?: string
  args?: Array<{ name: string; type?: string }>
}

export interface StateActionCompletePayload {
  action: {
    type: string
    payload?: unknown
  }
  ms?: number
}

export interface StateValuesChangePayload {
  changes: Array<{
    path: string
    value: unknown
  }>
}

export interface BenchmarkReportPayload {
  title: string
  steps: Array<{
    title: string
    time: number
  }>
}

export interface DisplayPayload {
  name: string
  value?: unknown
  preview?: string
  important?: boolean
}

export interface ClientIntroPayload {
  name?: string
  version?: string
  platform?: string
  reactNativeVersion?: string
  reactVersion?: string
  [key: string]: unknown
}
