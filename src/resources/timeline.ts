import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { MessageStore } from "../message-store.js"

export function registerTimelineResource(server: McpServer, store: MessageStore): void {
  server.resource(
    "timeline",
    "reactotron://timeline",
    { title: "Reactotron Timeline", mimeType: "text/markdown" },
    (_uri) => {
      const messages = store.getTimeline({ limit: 100 })

      if (messages.length === 0) {
        return {
          contents: [
            {
              uri: "reactotron://timeline",
              mimeType: "text/markdown",
              text: "# Reactotron Timeline\n\n_No messages captured yet._",
            },
          ],
        }
      }

      const sections = messages.map((m) => {
        const ts = m.date ? new Date(m.date).toLocaleTimeString() : "?"
        const payload =
          m.payload !== undefined
            ? `\n\`\`\`json\n${JSON.stringify(m.payload, null, 2)}\n\`\`\``
            : ""
        return `**[${ts}]** \`${m.type}\`${payload}`
      })

      const text = `# Reactotron Timeline\n_${messages.length} entries_\n\n---\n\n${sections.join("\n\n---\n\n")}`

      return {
        contents: [
          {
            uri: "reactotron://timeline",
            mimeType: "text/markdown",
            text,
          },
        ],
      }
    },
  )
}
