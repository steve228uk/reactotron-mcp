import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { MessageStore } from "../message-store.js"
import type { StateActionCompletePayload } from "../types.js"

export function registerStateActionsResource(server: McpServer, store: MessageStore): void {
  server.resource(
    "state-actions",
    "reactotron://state-actions",
    { title: "Reactotron State Actions", mimeType: "text/markdown" },
    (_uri) => {
      const actions = store.getStateActions({ limit: 50 })

      if (actions.length === 0) {
        return {
          contents: [
            {
              uri: "reactotron://state-actions",
              mimeType: "text/markdown",
              text: "# Reactotron State Actions\n\n_No state actions captured yet._",
            },
          ],
        }
      }

      const sections = actions.map((m) => {
        const p = m.payload as StateActionCompletePayload
        const ts = m.date ? new Date(m.date).toLocaleTimeString() : "?"
        const type = p?.action?.type ?? "(unknown)"
        const ms = p?.ms !== undefined ? ` _(${p.ms}ms)_` : ""
        const payload =
          p?.action?.payload !== undefined
            ? `\n\`\`\`json\n${JSON.stringify(p.action.payload, null, 2)}\n\`\`\``
            : ""
        return `**[${ts}]** \`${type}\`${ms}${payload}`
      })

      const text = `# Reactotron State Actions\n_${actions.length} entries_\n\n---\n\n${sections.join("\n\n---\n\n")}`

      return {
        contents: [
          {
            uri: "reactotron://state-actions",
            mimeType: "text/markdown",
            text,
          },
        ],
      }
    },
  )
}
