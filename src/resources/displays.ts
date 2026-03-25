import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { MessageStore } from "../message-store.js"
import type { DisplayPayload } from "../types.js"

export function registerDisplaysResource(server: McpServer, store: MessageStore): void {
  server.resource(
    "displays",
    "reactotron://displays",
    { title: "Reactotron Display Messages", mimeType: "text/markdown" },
    (uri) => {
      const items = store.getDisplays({ limit: 50 })

      if (items.length === 0) {
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/markdown",
              text: "# Display Messages\n\nNo display messages captured yet.",
            },
          ],
        }
      }

      const lines = items.map((m) => {
        const p = m.payload as DisplayPayload
        const ts = m.date ? new Date(m.date).toLocaleTimeString() : "?"
        const important = p?.important ? " ⚠️" : ""
        const preview = p?.preview ? ` — ${p.preview}` : ""
        const value =
          p?.value !== undefined
            ? `\n\n\`\`\`json\n${JSON.stringify(p.value, null, 2)}\n\`\`\``
            : ""
        return `### [${ts}]${important} ${p?.name ?? "display"}${preview}${value}`
      })

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/markdown",
            text: `# Display Messages\n\n${lines.join("\n\n---\n\n")}`,
          },
        ],
      }
    },
  )
}
