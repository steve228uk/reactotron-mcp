import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import type { MessageStore } from "../message-store.js"
import type { LogPayload } from "../types.js"

export function registerGetLogs(server: McpServer, store: MessageStore): void {
  server.tool(
    "get_logs",
    "Retrieve log messages captured from the connected React/React Native app via Reactotron.",
    {
      level: z
        .enum(["log", "debug", "warn", "error"])
        .optional()
        .describe("Filter by log level"),
      search: z.string().optional().describe("Substring search in log message text"),
      limit: z.number().int().positive().optional().describe("Max entries to return (default 50)"),
    },
    ({ level, search, limit }) => {
      const logs = store.getLogs({ level, search, limit })

      if (logs.length === 0) {
        return {
          content: [{ type: "text", text: "No logs captured yet." }],
        }
      }

      const lines = logs.map((m) => {
        const p = m.payload as LogPayload
        const ts = m.date ? new Date(m.date).toLocaleTimeString() : "?"
        const lvl = p?.level?.toUpperCase() ?? "LOG"
        const msg = typeof p?.message === "object" ? JSON.stringify(p.message, null, 2) : String(p?.message ?? "")
        const stack = p?.stack ? `\n  ${p.stack}` : ""
        return `[${ts}] ${lvl}: ${msg}${stack}`
      })

      return {
        content: [{ type: "text", text: lines.join("\n") }],
      }
    },
  )
}
