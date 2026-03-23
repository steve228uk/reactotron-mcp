import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import type { MessageStore } from "../message-store.js"

export function registerGetTimeline(server: McpServer, store: MessageStore): void {
  server.tool(
    "get_timeline",
    "Retrieve the full timeline of recent Reactotron messages across all types (logs, network, state actions, custom commands, etc.).",
    {
      types: z
        .array(z.string())
        .optional()
        .describe(
          "Filter by message type(s), e.g. [\"log\", \"api.response\", \"state.action.complete\"]. Omit for all types.",
        ),
      limit: z.number().int().positive().optional().describe("Max entries to return (default 100)"),
    },
    ({ types, limit }) => {
      const messages = store.getTimeline({ types, limit })

      if (messages.length === 0) {
        return {
          content: [{ type: "text", text: "No messages captured yet." }],
        }
      }

      const lines = messages.map((m) => {
        const ts = m.date ? new Date(m.date).toLocaleTimeString() : "?"
        const payload = m.payload !== undefined ? JSON.stringify(m.payload, null, 2) : "(no payload)"
        return `[${ts}] ${m.type}\n${payload}`
      })

      return {
        content: [{ type: "text", text: lines.join("\n\n---\n\n") }],
      }
    },
  )
}
