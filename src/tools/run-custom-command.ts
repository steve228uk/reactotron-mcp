import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import type { MessageStore } from "../message-store.js"
import type { ProxyServer } from "../proxy-server.js"

export function registerRunCustomCommand(
  server: McpServer,
  store: MessageStore,
  client: ProxyServer,
): void {
  server.tool(
    "run_custom_command",
    "Trigger a custom command registered by the app in Reactotron. Call with no 'command' argument to list all available commands.",
    {
      command: z.string().optional().describe("The command identifier to trigger"),
      args: z
        .record(z.unknown())
        .optional()
        .describe("Arguments to pass to the command"),
    },
    ({ command, args }) => {
      // No command specified — list available
      if (!command) {
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
      }

      if (!client.connected) {
        return {
          content: [
            {
              type: "text",
              text: "No app connected to the proxy. Ensure your app is running and pointing at the proxy port.",
            },
          ],
        }
      }

      client.sendCustomCommand(command, args as Record<string, unknown> | undefined)
      return {
        content: [{ type: "text", text: `Custom command "${command}" sent.` }],
      }
    },
  )
}
