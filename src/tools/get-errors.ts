import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { MessageStore } from "../message-store.js"
import type { LogPayload, ApiResponsePayload } from "../types.js"

export function registerGetErrors(server: McpServer, store: MessageStore): void {
  server.tool(
    "get_errors",
    "Get a consolidated view of all errors: error-level logs and failed network requests (4xx/5xx). Useful for a quick 'what's broken' overview.",
    {},
    () => {
      const errorLogs = store.getLogs({ level: "error" })
      const failedRequests = store.getNetwork().filter((m) => {
        const status = (m.payload as ApiResponsePayload)?.response?.status
        return status !== undefined && status >= 400
      })

      if (errorLogs.length === 0 && failedRequests.length === 0) {
        return {
          content: [{ type: "text", text: "No errors found. No error logs or failed network requests captured." }],
        }
      }

      const sections: string[] = []

      if (errorLogs.length > 0) {
        const lines = errorLogs.map((m) => {
          const p = m.payload as LogPayload
          const ts = m.date ? new Date(m.date).toLocaleTimeString() : "?"
          const msg = typeof p?.message === "object" ? JSON.stringify(p.message, null, 2) : String(p?.message ?? "")
          const stack = p?.stack ? `\n  ${p.stack}` : ""
          return `[${ts}] ERROR: ${msg}${stack}`
        })
        sections.push(`## Error Logs (${errorLogs.length})\n\n${lines.join("\n")}`)
      }

      if (failedRequests.length > 0) {
        const lines = failedRequests.map((m) => {
          const p = m.payload as ApiResponsePayload
          const ts = m.date ? new Date(m.date).toLocaleTimeString() : "?"
          return `[${ts}] ${p?.request?.method ?? "?"} ${p?.request?.url ?? "?"} → ${p?.response?.status ?? "?"} (${p?.duration ?? "?"}ms)`
        })
        sections.push(`## Failed Network Requests (${failedRequests.length})\n\n${lines.join("\n")}`)
      }

      return {
        content: [{ type: "text", text: sections.join("\n\n") }],
      }
    },
  )
}
