import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { MessageStore } from "./message-store.js"
import { ProxyServer } from "./proxy-server.js"
import { registerGetLogs } from "./tools/get-logs.js"
import { registerGetTimeline } from "./tools/get-timeline.js"
import { registerGetNetwork } from "./tools/get-network.js"
import { registerGetState } from "./tools/get-state.js"
import { registerRunCustomCommand } from "./tools/run-custom-command.js"
import { registerDispatchAction } from "./tools/dispatch-action.js"

const reactotronPort = parseInt(process.env.REACTOTRON_PORT ?? "9090", 10)
const proxyPort = parseInt(process.env.REACTOTRON_PROXY_PORT ?? "9091", 10)
const timeout = parseInt(process.env.REACTOTRON_TIMEOUT ?? "5000", 10)

const store = new MessageStore()
const proxy = new ProxyServer(store, { proxyPort, reactotronPort, timeout })

const server = new McpServer({
  name: "reactotron-mcp",
  version: "0.1.0",
})

registerGetLogs(server, store)
registerGetTimeline(server, store)
registerGetNetwork(server, store)
registerGetState(server, proxy)
registerRunCustomCommand(server, store, proxy)
registerDispatchAction(server, proxy)

const transport = new StdioServerTransport()
await server.connect(transport)
