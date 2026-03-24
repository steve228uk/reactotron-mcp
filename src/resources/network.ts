import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { MessageStore } from "../message-store.js"
import type { ApiResponsePayload } from "../types.js"

export function registerNetworkResource(server: McpServer, store: MessageStore): void {
  server.resource(
    "network",
    "reactotron://network",
    { title: "Reactotron Network Requests", mimeType: "text/markdown" },
    (_uri) => {
      const items = store.getNetwork({ limit: 50 })

      if (items.length === 0) {
        return {
          contents: [
            {
              uri: "reactotron://network",
              mimeType: "text/markdown",
              text: "# Reactotron Network Requests\n\n_No network requests captured yet._",
            },
          ],
        }
      }

      const sections = items.map((m) => {
        const p = m.payload as ApiResponsePayload
        const ts = m.date ? new Date(m.date).toLocaleTimeString() : "?"
        const req = p?.request
        const res = p?.response
        const method = req?.method ?? "?"
        const url = req?.url ?? "?"
        const status = res?.status ?? "?"
        const duration = p?.duration ?? "?"

        const parts = [`### [${ts}] ${method} ${url} — ${status} (${duration}ms)`]

        if (req?.params) {
          parts.push(`\n**Query params:**\n\`\`\`json\n${JSON.stringify(req.params, null, 2)}\n\`\`\``)
        }
        if (req?.data) {
          parts.push(`\n**Request body:**\n\`\`\`json\n${JSON.stringify(req.data, null, 2)}\n\`\`\``)
        }
        if (res?.body) {
          parts.push(`\n**Response body:**\n\`\`\`json\n${JSON.stringify(res.body, null, 2)}\n\`\`\``)
        }

        return parts.join("\n")
      })

      const text = `# Reactotron Network Requests\n_${items.length} entries_\n\n---\n\n${sections.join("\n\n---\n\n")}`

      return {
        contents: [
          {
            uri: "reactotron://network",
            mimeType: "text/markdown",
            text,
          },
        ],
      }
    },
  )
}
