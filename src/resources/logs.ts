import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { MessageStore } from "../message-store.js"
import type { LogPayload } from "../types.js"

export function registerLogsResource(server: McpServer, store: MessageStore): void {
  server.resource(
    "logs",
    "reactotron://logs",
    { title: "Reactotron Logs", mimeType: "text/markdown" },
    (_uri) => {
      const logs = store.getLogs({ limit: 50 })

      if (logs.length === 0) {
        return {
          contents: [
            {
              uri: "reactotron://logs",
              mimeType: "text/markdown",
              text: "# Reactotron Logs\n\n_No logs captured yet._",
            },
          ],
        }
      }

      const sections = logs.map((m) => {
        const p = m.payload as LogPayload
        const ts = m.date ? new Date(m.date).toLocaleTimeString() : "?"
        const lvl = p?.level?.toUpperCase() ?? "LOG"
        const msg =
          typeof p?.message === "object" ? JSON.stringify(p.message, null, 2) : String(p?.message ?? "")
        const stack = p?.stack ? `\n\`\`\`\n${p.stack}\n\`\`\`` : ""
        return `**[${ts}] ${lvl}** — ${msg}${stack}`
      })

      const text = `# Reactotron Logs\n_${logs.length} entries_\n\n---\n\n${sections.join("\n\n---\n\n")}`

      return {
        contents: [
          {
            uri: "reactotron://logs",
            mimeType: "text/markdown",
            text,
          },
        ],
      }
    },
  )
}
