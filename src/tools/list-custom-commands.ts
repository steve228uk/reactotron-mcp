import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { MessageStore } from "../message-store.js"

export function registerListCustomCommands(server: McpServer, store: MessageStore): void {
  server.tool(
    "list_custom_commands",
    "List all custom commands currently registered by the connected app in Reactotron.",
    {},
    () => {
      const commands = Array.from(store.customCommands.values())
      if (commands.length === 0) {
        return {
          content: [{ type: "text", text: "No custom commands registered yet." }],
        }
      }
      const lines = commands.map((c) => {
        const argList =
          c.args && c.args.length > 0 ? `\n  Args: ${c.args.map((a) => a.name).join(", ")}` : ""
        const desc = c.description ? `\n  ${c.description}` : ""
        return `• ${c.command}${c.title ? ` (${c.title})` : ""}${desc}${argList}`
      })
      return {
        content: [{ type: "text", text: `Available custom commands:\n\n${lines.join("\n\n")}` }],
      }
    },
  )
}
