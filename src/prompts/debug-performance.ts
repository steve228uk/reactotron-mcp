import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

export function registerDebugPerformancePrompt(server: McpServer): void {
  server.prompt(
    "debug_performance",
    "Analyse performance benchmarks and identify slow operations in the connected app.",
    () => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please analyse the performance of my React app using Reactotron:

1. Use get_benchmarks to retrieve all captured benchmark reports.
2. For each benchmark, identify the slowest steps and total duration.
3. Use get_network with a minDuration filter to find slow network requests (e.g. over 1000ms).
4. Use get_state_actions to see if any expensive actions correlate with slow benchmarks.
5. Use get_logs to check for any performance-related warnings around the same time.

Summarise which operations are slowest, whether there are patterns (specific screens, actions, or endpoints), and suggest what to investigate or optimise.`,
          },
        },
      ],
    }),
  )
}
