import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import type { MessageStore } from "../message-store.js"
import type { ApiResponsePayload } from "../types.js"

export function registerGetNetwork(server: McpServer, store: MessageStore): void {
  server.tool(
    "get_network",
    "Retrieve captured API/network requests and responses from the app.",
    {
      url: z.string().optional().describe("Filter by URL substring"),
      method: z.string().optional().describe("Filter by HTTP method (GET, POST, etc.)"),
      status: z.number().int().optional().describe("Filter by HTTP status code"),
      minDuration: z.number().optional().describe("Only return requests slower than this many milliseconds"),
      limit: z.number().int().positive().optional().describe("Max entries to return (default 50)"),
    },
    ({ url, method, status, minDuration, limit }) => {
      const items = store.getNetwork({ url, method, status, minDuration, limit })

      if (items.length === 0) {
        return {
          content: [{ type: "text", text: "No network requests captured yet." }],
        }
      }

      const lines = items.map((m) => {
        const p = m.payload as ApiResponsePayload
        const ts = m.date ? new Date(m.date).toLocaleTimeString() : "?"
        const req = p?.request
        const res = p?.response
        const parts = [
          `[${ts}] ${req?.method ?? "?"} ${req?.url ?? "?"}`,
          `  Status: ${res?.status ?? "?"} | Duration: ${p?.duration ?? "?"}ms`,
        ]
        if (req?.params) parts.push(`  Params: ${JSON.stringify(req.params)}`)
        if (req?.data) parts.push(`  Request body: ${JSON.stringify(req.data, null, 2)}`)
        if (res?.body) parts.push(`  Response body: ${JSON.stringify(res.body, null, 2)}`)
        return parts.join("\n")
      })

      return {
        content: [{ type: "text", text: lines.join("\n\n---\n\n") }],
      }
    },
  )
}
