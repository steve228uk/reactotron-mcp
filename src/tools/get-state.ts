import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import type { ProxyServer } from "../proxy-server.js"
import type { StateKeysResponsePayload, StateValuesResponsePayload } from "../types.js"

export function registerGetState(server: McpServer, client: ProxyServer): void {
  server.tool(
    "get_state",
    "Query the app's state tree (Redux, MobX-State-Tree, etc.) via Reactotron. Use 'keys' to browse available paths, 'values' to read actual data.",
    {
      path: z
        .string()
        .optional()
        .describe("Dot-separated state path to query, e.g. \"user.profile\" or \"\" for root"),
      query: z
        .enum(["keys", "values"])
        .optional()
        .describe("'keys' returns child key names at the path; 'values' returns the actual value (default: 'values')"),
    },
    async ({ path = "", query = "values" }) => {
      if (!client.connected) {
        return {
          content: [{ type: "text", text: "No app connected to the proxy. Ensure your app is running and pointing at the proxy port." }],
        }
      }

      try {
        if (query === "keys") {
          const result = (await client.queryStateKeys(path)) as StateKeysResponsePayload
          if (!result?.valid) {
            return {
              content: [{ type: "text", text: `Invalid state path: "${path}"` }],
            }
          }
          const keys = result.keys ?? []
          return {
            content: [
              {
                type: "text",
                text:
                  keys.length === 0
                    ? `No keys found at path "${path}"`
                    : `Keys at "${path || "root"}":\n${keys.map((k) => `  - ${k}`).join("\n")}`,
              },
            ],
          }
        } else {
          const result = (await client.queryStateValues(path)) as StateValuesResponsePayload
          if (!result?.valid) {
            return {
              content: [{ type: "text", text: `Invalid state path: "${path}"` }],
            }
          }
          return {
            content: [
              {
                type: "text",
                text: `State at "${path || "root"}":\n${JSON.stringify(result.value, null, 2)}`,
              },
            ],
          }
        }
      } catch (err) {
        return {
          content: [{ type: "text", text: `State query failed: ${(err as Error).message}` }],
        }
      }
    },
  )
}
