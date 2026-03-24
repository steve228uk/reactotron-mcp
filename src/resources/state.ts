import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { ProxyServer } from "../proxy-server.js"
import type { StateValuesResponsePayload } from "../types.js"

export function registerStateResource(server: McpServer, proxy: ProxyServer): void {
  server.resource(
    "state",
    new ResourceTemplate("reactotron://state{/path*}", { list: undefined }),
    { title: "Reactotron App State", mimeType: "text/markdown" },
    async (uri, { path }) => {
      const pathStr = Array.isArray(path) ? path.join(".") : (path ?? "")
      const label = pathStr || "root"

      if (!proxy.connected) {
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/markdown",
              text: `# State: ${label}\n\n> **Not connected.** Ensure your app is running and pointing at the proxy port.`,
            },
          ],
        }
      }

      try {
        const result = (await proxy.queryStateValues(pathStr)) as StateValuesResponsePayload

        if (!result?.valid) {
          return {
            contents: [
              {
                uri: uri.href,
                mimeType: "text/markdown",
                text: `# State: ${label}\n\n> **Invalid path:** \`${pathStr}\``,
              },
            ],
          }
        }

        const json = JSON.stringify(result.value, null, 2)
        const text = `# State: ${label}\n\n\`\`\`json\n${json}\n\`\`\``

        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/markdown",
              text,
            },
          ],
        }
      } catch (err) {
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/markdown",
              text: `# State: ${label}\n\n> **Error:** ${(err as Error).message}`,
            },
          ],
        }
      }
    },
  )
}
