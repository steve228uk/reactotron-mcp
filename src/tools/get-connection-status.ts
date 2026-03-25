import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { ProxyServer } from "../proxy-server.js"
import type { MessageStore } from "../message-store.js"

export function registerGetConnectionStatus(server: McpServer, proxy: ProxyServer, store: MessageStore): void {
  server.tool(
    "get_connection_status",
    "Check whether a React/React Native app is currently connected to the Reactotron proxy, including app metadata.",
    {},
    () => {
      const port = proxy.proxyPort
      if (!proxy.connected) {
        return {
          content: [
            {
              type: "text",
              text: `Not connected. No app is currently connected to the proxy (port ${port}). Ensure your app is running and pointing at port ${port}.`,
            },
          ],
        }
      }

      const info = store.clientInfo
      const lines = [`Connected. An app is actively connected to the proxy (port ${port}).`]
      if (info) {
        if (info.name) lines.push(`App: ${info.name}${info.version ? ` v${info.version}` : ""}`)
        if (info.platform) lines.push(`Platform: ${info.platform}`)
        if (info.reactNativeVersion) lines.push(`React Native: ${info.reactNativeVersion}`)
        if (info.reactVersion) lines.push(`React: ${info.reactVersion}`)
      }

      return {
        content: [{ type: "text", text: lines.join("\n") }],
      }
    },
  )
}
