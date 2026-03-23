import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import type { ProxyServer } from "../proxy-server.js"

export function registerDispatchAction(server: McpServer, client: ProxyServer): void {
  server.tool(
    "dispatch_action",
    "Dispatch a Redux or MobX-State-Tree action to the app via Reactotron.",
    {
      type: z.string().describe("The action type string, e.g. \"USER/LOGOUT\""),
      payload: z
        .record(z.unknown())
        .optional()
        .describe("Optional action payload object"),
    },
    async ({ type, payload }) => {
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

      client.dispatchAction(type, payload)
      return {
        content: [
          {
            type: "text",
            text: `Action dispatched: ${type}${payload ? `\nPayload: ${JSON.stringify(payload, null, 2)}` : ""}`,
          },
        ],
      }
    },
  )
}
