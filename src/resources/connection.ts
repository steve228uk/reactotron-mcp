import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { ProxyServer } from "../proxy-server.js"
import type { MessageStore } from "../message-store.js"

export function registerConnectionResource(server: McpServer, proxy: ProxyServer, store: MessageStore): void {
  server.resource(
    "connection",
    "reactotron://connection",
    { title: "Reactotron Connection Status", mimeType: "text/markdown" },
    (uri) => {
      const port = proxy.proxyPort
      if (!proxy.connected) {
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/markdown",
              text: `# Connection Status\n\n**Status:** Not connected\n\nNo app is currently connected to the proxy (port ${port}).\nEnsure your app is configured to connect to \`localhost:${port}\`.`,
            },
          ],
        }
      }

      const lines = ["# Connection Status", "", "**Status:** Connected"]
      const info = store.clientInfo
      if (info) {
        lines.push("")
        lines.push("## App Info")
        if (info.name) lines.push(`- **Name:** ${info.name}`)
        if (info.version) lines.push(`- **Version:** ${info.version}`)
        if (info.platform) lines.push(`- **Platform:** ${info.platform}`)
        if (info.reactNativeVersion) lines.push(`- **React Native:** ${info.reactNativeVersion}`)
        if (info.reactVersion) lines.push(`- **React:** ${info.reactVersion}`)
        const known = new Set(["name", "version", "platform", "reactNativeVersion", "reactVersion"])
        for (const [key, value] of Object.entries(info)) {
          if (!known.has(key) && value !== undefined) {
            lines.push(`- **${key}:** ${JSON.stringify(value)}`)
          }
        }
      }

      lines.push("", `**Proxy port:** ${port}`)

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/markdown",
            text: lines.join("\n"),
          },
        ],
      }
    },
  )
}
