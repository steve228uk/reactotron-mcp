import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { MessageStore } from "../message-store.js"

export function registerGetAppInfo(server: McpServer, store: MessageStore): void {
  server.tool(
    "get_app_info",
    "Retrieve metadata about the connected app as reported in its Reactotron client.intro handshake — app name, version, platform, and React/React Native versions.",
    {},
    () => {
      const info = store.clientInfo
      if (!info) {
        return {
          content: [
            {
              type: "text",
              text: "No app info available. Either no app has connected yet, or the app did not send a client.intro handshake.",
            },
          ],
        }
      }

      const lines: string[] = []
      if (info.name) lines.push(`Name: ${info.name}`)
      if (info.version) lines.push(`Version: ${info.version}`)
      if (info.platform) lines.push(`Platform: ${info.platform}`)
      if (info.reactNativeVersion) lines.push(`React Native: ${info.reactNativeVersion}`)
      if (info.reactVersion) lines.push(`React: ${info.reactVersion}`)

      // Include any other fields from the handshake
      const known = new Set(["name", "version", "platform", "reactNativeVersion", "reactVersion"])
      for (const [key, value] of Object.entries(info)) {
        if (!known.has(key) && value !== undefined) {
          lines.push(`${key}: ${JSON.stringify(value)}`)
        }
      }

      return {
        content: [{ type: "text", text: lines.length > 0 ? lines.join("\n") : JSON.stringify(info, null, 2) }],
      }
    },
  )
}
