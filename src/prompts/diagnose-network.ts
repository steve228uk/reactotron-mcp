import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

export function registerDiagnoseNetworkPrompt(server: McpServer): void {
  server.prompt(
    "diagnose_network",
    "Diagnose network and API issues in the connected app.",
    () => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please diagnose any network issues in my React app using Reactotron:

1. Use get_network to review the last 50 network requests.
2. Identify any requests that failed (status 4xx or 5xx) or received no response.
3. Look for patterns: are failures limited to specific endpoints, methods, or times?
4. Use get_logs to find any related error logs around the time of failed requests.
5. Check get_state to see if there's any error state stored (e.g. error flags, messages).

Summarise the issues found and suggest likely causes and next steps.`,
          },
        },
      ],
    }),
  )
}
