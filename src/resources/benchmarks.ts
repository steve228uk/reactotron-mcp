import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { MessageStore } from "../message-store.js"
import type { BenchmarkReportPayload } from "../types.js"

export function registerBenchmarksResource(server: McpServer, store: MessageStore): void {
  server.resource(
    "benchmarks",
    "reactotron://benchmarks",
    { title: "Reactotron Benchmarks", mimeType: "text/markdown" },
    (_uri) => {
      const benchmarks = store.getBenchmarks({ limit: 50 })

      if (benchmarks.length === 0) {
        return {
          contents: [
            {
              uri: "reactotron://benchmarks",
              mimeType: "text/markdown",
              text: "# Reactotron Benchmarks\n\n_No benchmark reports captured yet._",
            },
          ],
        }
      }

      const sections = benchmarks.map((m) => {
        const p = m.payload as BenchmarkReportPayload
        const ts = m.date ? new Date(m.date).toLocaleTimeString() : "?"
        const title = p?.title ?? "(untitled)"
        const steps = (p?.steps ?? []).map((s) => `- **${s.title}**: ${s.time}ms`).join("\n")
        const total = (p?.steps ?? []).reduce((sum, s) => sum + (s.time ?? 0), 0)
        return `## [${ts}] ${title}\n\n**Total:** ${total}ms\n\n${steps}`
      })

      const text = `# Reactotron Benchmarks\n_${benchmarks.length} reports_\n\n---\n\n${sections.join("\n\n---\n\n")}`

      return {
        contents: [
          {
            uri: "reactotron://benchmarks",
            mimeType: "text/markdown",
            text,
          },
        ],
      }
    },
  )
}
