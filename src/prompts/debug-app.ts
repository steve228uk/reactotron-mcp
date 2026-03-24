import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

export function registerDebugAppPrompt(server: McpServer): void {
  server.prompt(
    "debug_app",
    "Get a comprehensive debug snapshot of the connected app — recent logs, state, and network activity.",
    () => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please give me a full debug overview of my React app using Reactotron. Follow these steps:

1. Check get_connection_status to confirm an app is connected.
2. Use get_logs to review the last 50 log messages, highlighting any warnings or errors.
3. Use get_network to review the last 20 network requests, noting any failures or slow responses.
4. Use get_state to inspect the root state tree.
5. Use get_state_actions to see the last 20 dispatched actions.

Summarise what you find: are there any errors, unexpected state, or failed requests that need attention?`,
          },
        },
      ],
    }),
  )
}
