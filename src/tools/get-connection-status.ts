import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { ProxyServer } from "../proxy-server.js"

export function registerGetConnectionStatus(server: McpServer, proxy: ProxyServer): void {
  server.tool(
    "get_connection_status",
    "Check whether a React/React Native app is currently connected to the Reactotron proxy.",
    {},
    () => {
      if (proxy.connected) {
        return {
          content: [{ type: "text", text: "Connected. An app is actively connected to the proxy." }],
        }
      }
      return {
        content: [
          {
            type: "text",
            text: "Not connected. No app is currently connected to the proxy. Ensure your app is running and pointing at the proxy port.",
          },
        ],
      }
    },
  )
}
