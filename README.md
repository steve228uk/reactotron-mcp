# reactotron-mcp

[![Install in VS Code](https://img.shields.io/badge/Install_in-VS_Code-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://vscode.dev/redirect/mcp/install?name=reactotron&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22reactotron-mcp%22%5D%2C%22env%22%3A%7B%7D%7D)
[![Install in Cursor](https://img.shields.io/badge/Install_in-Cursor-000000?style=flat-square&logoColor=white)](https://cursor.com/en/install-mcp?name=reactotron&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsInJlYWN0b3Ryb24tbWNwIl0sImVudiI6e319)

An MCP (Model Context Protocol) server for [Reactotron](https://github.com/infinitered/reactotron), enabling AI assistants to read logs, inspect app state, monitor network requests, and trigger custom commands in your React or React Native app.

## How it works

The MCP server runs a WebSocket proxy between your app and the Reactotron desktop app:

```
App ──► MCP Proxy (port 9091) ──► Reactotron (port 9090)
               │
          captures everything
               │
          MCP tools (Claude/Cursor etc.)
```

Your app connects to the proxy instead of directly to Reactotron. The proxy forwards all traffic to Reactotron (so the desktop UI works normally) and captures every message for the MCP tools.

The proxy works in **standalone mode** — if Reactotron is not open, the app connection is kept alive and all messages are still captured. When Reactotron is opened later, the proxy reconnects automatically (with exponential backoff). This means you don't need to have Reactotron running before starting your app.

## Requirements

- Your app pointed at the proxy port (default `9091`) instead of Reactotron directly
- [Reactotron](https://github.com/infinitered/reactotron) desktop app (optional — for the visual UI)

## Installation

### Claude Code

```bash
claude mcp add reactotron-mcp npx reactotron-mcp
```

Or with Bun:

```bash
claude mcp add reactotron-mcp bunx reactotron-mcp
```

### npx (Node)

```json
{
  "mcpServers": {
    "reactotron": {
      "command": "npx",
      "args": ["-y", "reactotron-mcp"]
    }
  }
}
```

### bunx (Bun)

```json
{
  "mcpServers": {
    "reactotron": {
      "command": "bunx",
      "args": ["reactotron-mcp"]
    }
  }
}
```

### Custom port

If Reactotron is running on a non-default port, set `REACTOTRON_PORT`:

```json
{
  "mcpServers": {
    "reactotron": {
      "command": "npx",
      "args": ["-y", "reactotron-mcp"],
      "env": {
        "REACTOTRON_PORT": "9090"
      }
    }
  }
}
```

## App setup

Point your app's Reactotron config at the proxy port instead of the default:

```ts
// Before
Reactotron.configure({ host: 'localhost' }).connect()

// After
Reactotron.configure({ host: 'localhost', port: 9091 }).connect()
```

## Configuration

| Environment variable     | Default | Description                                      |
| ------------------------ | ------- | ------------------------------------------------ |
| `REACTOTRON_PROXY_PORT`  | `9091`  | Port the MCP proxy listens on (apps connect here)|
| `REACTOTRON_PORT`        | `9090`  | Port the Reactotron desktop app is running on    |
| `REACTOTRON_TIMEOUT`     | `5000`  | Timeout in ms for state queries                  |

## Tools

| Tool                    | Description                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------------- |
| `get_logs`              | Read captured log messages. Filter by level (`log`/`debug`/`warn`/`error`), text search, and limit. |
| `get_state`             | Query the app's state tree. Browse keys at a path or read the value.                            |
| `get_network`           | View captured API requests and responses. Filter by URL, HTTP method, status code, minimum duration, and limit. |
| `get_timeline`          | Full chronological timeline of all Reactotron messages.                                         |
| `get_state_actions`     | View completed Redux or MobX-State-Tree actions. Filter by action type substring and limit.     |
| `get_state_changes`     | View state mutation events. Filter by state path substring and limit.                           |
| `get_benchmarks`        | View performance benchmark reports with per-step timings. Filter by title and limit.            |
| `get_displays`          | Read custom display messages sent via `reactotron.display()`. Filter by name/preview text and limit. |
| `get_errors`            | Consolidated view of error-level logs and failed network requests (4xx/5xx) in one call.        |
| `get_app_info`          | Show connected app metadata from the Reactotron handshake: name, version, platform, React/RN versions. |
| `get_connection_status` | Check whether an app is connected, including app name, platform, and proxy port.                |
| `run_custom_command`    | List or trigger custom commands registered by the app.                                          |
| `dispatch_action`       | Dispatch a Redux or MobX-State-Tree action to the app.                                          |
| `clear_messages`        | Clear captured messages from the in-memory buffer. Clears all buffers or a specific message type. |
| `list_custom_commands`  | List all custom commands currently registered by the connected app.                             |

## Resources

Resources expose the same data as tools but as readable URIs, useful for attaching live context directly to a conversation.

| Resource                          | URI                             | Description                                      |
| --------------------------------- | ------------------------------- | ------------------------------------------------ |
| Logs                              | `reactotron://logs`             | Latest 50 log messages                           |
| Network                           | `reactotron://network`          | Latest 50 network requests                       |
| Timeline                          | `reactotron://timeline`         | Latest 100 messages across all types             |
| State                             | `reactotron://state{/path*}`    | App state at a given path (e.g. `reactotron://state/user/profile`) |
| State Actions                     | `reactotron://state-actions`    | Latest 50 Redux/MST actions                      |
| State Changes                     | `reactotron://state-changes`    | Latest 50 state mutations                        |
| Benchmarks                        | `reactotron://benchmarks`       | Latest 50 benchmark reports                      |
| Display Messages                  | `reactotron://displays`         | Latest 50 `reactotron.display()` messages        |
| Custom Commands                   | `reactotron://custom-commands`  | All registered custom commands                   |
| Connection                        | `reactotron://connection`       | Connection status and app info                   |

## Prompts

Prompts are reusable templates that guide the AI through common debugging workflows. Invoke them via your AI assistant's prompt/slash-command interface.

| Prompt               | Description                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| `debug_app`          | Get a comprehensive debug snapshot — checks connection, logs, network, state, and recent actions. |
| `trace_action`       | Trace a specific Redux/MST action through its payload, state changes, logs, and network side effects. Takes an `action` argument (e.g. `AUTH/LOGIN_SUCCESS`). |
| `diagnose_network`   | Identify and analyse failed or errored API requests, spot patterns, and check related state.    |
| `debug_performance`  | Analyse benchmark reports and slow network requests to identify performance bottlenecks.         |
| `debug_errors`       | Triage all errors — error logs, failed requests, important display messages, and error state.   |

## Development

```bash
bun install
bun run dev       # run from source
bun run build     # bundle for distribution
bun run typecheck # type-check without building
```
