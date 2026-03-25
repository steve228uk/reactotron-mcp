import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { MessageStore } from "../message-store.js"

export function registerCustomCommandsResource(server: McpServer, store: MessageStore): void {
  server.resource(
    "custom-commands",
    "reactotron://custom-commands",
    { title: "Reactotron Custom Commands", mimeType: "text/markdown" },
    (uri) => {
      const commands = Array.from(store.customCommands.values())

      if (commands.length === 0) {
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/markdown",
              text: "# Custom Commands\n\nNo custom commands registered yet.",
            },
          ],
        }
      }

      const lines = commands.map((c) => {
        const parts = [`### ${c.command}${c.title ? ` — ${c.title}` : ""}`]
        if (c.description) parts.push(c.description)
        if (c.args && c.args.length > 0) {
          parts.push(`**Args:** ${c.args.map((a) => `\`${a.name}${a.type ? ` (${a.type})` : ""}\``).join(", ")}`)
        }
        return parts.join("\n\n")
      })

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/markdown",
            text: `# Custom Commands\n\n${lines.join("\n\n---\n\n")}`,
          },
        ],
      }
    },
  )
}
