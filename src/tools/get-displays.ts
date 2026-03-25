import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import type { MessageStore } from "../message-store.js"
import type { DisplayPayload } from "../types.js"

export function registerGetDisplays(server: McpServer, store: MessageStore): void {
  server.tool(
    "get_displays",
    "Retrieve custom display messages sent via reactotron.display(). These are structured debug entries with a name, optional preview, and arbitrary value — commonly used by Reactotron plugins.",
    {
      search: z.string().optional().describe("Substring search across display name and preview"),
      limit: z.number().int().positive().optional().describe("Max entries to return (default 50)"),
    },
    ({ search, limit }) => {
      const items = store.getDisplays({ search, limit })

      if (items.length === 0) {
        return {
          content: [{ type: "text", text: "No display messages captured yet." }],
        }
      }

      const lines = items.map((m) => {
        const p = m.payload as DisplayPayload
        const ts = m.date ? new Date(m.date).toLocaleTimeString() : "?"
        const important = p?.important ? " !" : ""
        const preview = p?.preview ? ` — ${p.preview}` : ""
        const value = p?.value !== undefined ? `\n  ${JSON.stringify(p.value, null, 2).replace(/\n/g, "\n  ")}` : ""
        return `[${ts}]${important} ${p?.name ?? "display"}${preview}${value}`
      })

      return {
        content: [{ type: "text", text: lines.join("\n\n") }],
      }
    },
  )
}
