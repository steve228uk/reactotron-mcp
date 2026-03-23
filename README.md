# reactotron-mcp

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

## Requirements

- [Reactotron](https://github.com/infinitered/reactotron) desktop app running
- Your app pointed at the proxy port (default `9091`) instead of Reactotron directly

## Installation

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

| Tool                  | Description                                                                 |
| --------------------- | --------------------------------------------------------------------------- |
| `get_logs`            | Read captured log messages. Filter by level (`debug`/`warn`/`error`), text search, and limit. |
| `get_state`           | Query the app's state tree. Browse keys at a path or read the value.        |
| `get_network`         | View captured API requests and responses. Filter by URL, status code, and limit. |
| `get_timeline`        | Full chronological timeline of all Reactotron messages.                     |
| `run_custom_command`  | List or trigger custom commands registered by the app.                      |
| `dispatch_action`     | Dispatch a Redux or MobX-State-Tree action to the app.                      |

## Development

```bash
bun install
bun run dev       # run from source
bun run build     # bundle for distribution
bun run typecheck # type-check without building
```
