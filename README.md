# MCP Client

Lightweight MCP client proxy for cloud-based MCP servers.

## Description

This client acts as a proxy between MCP-compatible applications (like Claude Desktop) and cloud-hosted MCP servers. It forwards all MCP protocol messages to a remote server while maintaining the standard MCP interface locally.

## Installation

### From Release
1. Download the latest release from GitHub
2. Extract the zip file
3. Run with Node.js: `node dist/index.js`

### From Source
```bash
npm install
npm run build
npm start
```

## Usage

### Command Line Interface
```bash
mcpclient --server <server-name> --cloudUrl <cloud-server-url> [server-options]
```

#### Required Arguments
- `--server`: The MCP server name to proxy (e.g., `mongodb-mcp-server`)
- `--cloudUrl`: URL of the cloud server (default: `http://localhost:3001`)

#### Optional Arguments
- `--apiKey`: API key for cloud server authentication
- All MongoDB MCP server options are supported and passed through

#### Example
```bash
mcpclient --server mongodb-mcp-server --cloudUrl https://your-cloud-server.com --connectionString "mongodb://localhost:27017/mydb"
```

### Graphical User Interface (GUI)
For a visual interface, use the Electron app:

```bash
# Development mode
npm run electron-dev

# Production mode
npm run electron
```

The GUI provides:
- Easy configuration forms
- Start/stop client controls
- Status monitoring
- Auto-update functionality

## Requirements

- Node.js >= 20.0.0

## Features

- Transparent MCP protocol proxying
- Support for all MongoDB MCP server arguments
- Graceful shutdown handling
- Error handling and logging

## License

ISC