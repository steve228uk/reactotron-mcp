import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

export function registerTraceActionPrompt(server: McpServer): void {
  server.prompt(
    "trace_action",
    "Trace a Redux/MST action through state changes and side effects.",
    { action: z.string().describe("The action type to trace (e.g. 'AUTH/LOGIN_SUCCESS')") },
    ({ action }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please trace the action "${action}" through my app using Reactotron:

1. Use get_state_actions to find recent dispatches of "${action}", showing the full payload.
2. Use get_state_changes to find any state changes that occurred around the same time.
3. Use get_logs to check for any log messages around that action.
4. Use get_network to see if any network requests were triggered as a result.

Walk me through what happened: what the action contained, how state changed, and any side effects that followed.`,
          },
        },
      ],
    }),
  )
}
