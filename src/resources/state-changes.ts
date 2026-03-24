import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { MessageStore } from "../message-store.js"
import type { StateValuesChangePayload } from "../types.js"

export function registerStateChangesResource(server: McpServer, store: MessageStore): void {
  server.resource(
    "state-changes",
    "reactotron://state-changes",
    { title: "Reactotron State Changes", mimeType: "text/markdown" },
    (_uri) => {
      const changes = store.getStateChanges({ limit: 50 })

      if (changes.length === 0) {
        return {
          contents: [
            {
              uri: "reactotron://state-changes",
              mimeType: "text/markdown",
              text: "# Reactotron State Changes\n\n_No state changes captured yet._",
            },
          ],
        }
      }

      const sections = changes.map((m) => {
        const p = m.payload as StateValuesChangePayload
        const ts = m.date ? new Date(m.date).toLocaleTimeString() : "?"
        const entries = (p?.changes ?? [])
          .map((c) => `- \`${c.path}\`: \`\`\`json\n${JSON.stringify(c.value, null, 2)}\n\`\`\``)
          .join("\n")
        return `**[${ts}]**\n${entries}`
      })

      const text = `# Reactotron State Changes\n_${changes.length} entries_\n\n---\n\n${sections.join("\n\n---\n\n")}`

      return {
        contents: [
          {
            uri: "reactotron://state-changes",
            mimeType: "text/markdown",
            text,
          },
        ],
      }
    },
  )
}
