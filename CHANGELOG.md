# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0] - 2026-03-25

### Added

- **MCP Resources** — New resources for reading Reactotron data directly:
  - `logs`, `network`, `timeline`, and `state` resources
  - `state_actions`, `state_changes`, and `benchmarks` resources
- **New Tools**
  - `list_custom_commands` — lists custom commands registered in Reactotron
  - `get_connection_status` — reports the current connection status
  - Four additional tools exposing already-captured Reactotron data (async storage, state, network, logs)
- **MCP Prompts** — Built-in prompts to guide common Reactotron workflows
- **Claude Plugin Manifest** — Added manifest for Claude integration
- **LICENSE** — Added project license

### Documentation

- README updated to document all new tools, resources, and prompts

## [0.1.1] - 2026-03-23

### Added

- `.mcp.json` configuration file
- Install badges in README

## [0.1.0] - 2026-03-23

Initial release.

### Added

- MCP server with WebSocket proxy to Reactotron desktop app
- Tools: `get_logs`, `get_network`, `get_state`, `get_timeline`, `dispatch_action`, `run_custom_command`
- Message store for capturing Reactotron messages
