import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

export function registerDebugErrorsPrompt(server: McpServer): void {
  server.prompt(
    "debug_errors",
    "Triage all errors in the connected app — error logs, failed network requests, and error state.",
    () => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please triage all errors in my React app using Reactotron:

1. Use get_errors to get a consolidated view of error logs and failed network requests.
2. Use get_displays to check for any important display messages that may indicate errors from plugins or middleware.
3. Use get_state to inspect the root state tree for any error flags, error messages, or failed status fields.
4. Use get_timeline to understand the sequence of events leading up to the errors.

For each error found: describe what went wrong, when it happened, and what state the app was in. Group related errors together and suggest the most likely root cause and next debugging steps.`,
          },
        },
      ],
    }),
  )
}
