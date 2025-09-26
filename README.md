# SpyderMCP Client

Universal client for connecting to any Model Context Protocol (MCP) server through the cloud.

## Description

SpyderMCP Client is a universal proxy that connects MCP-compatible applications (like Claude Desktop) to any cloud-hosted MCP server. It provides a unified interface for accessing databases, APIs, file systems, and custom tools through the Model Context Protocol.

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
spydermcp --server <server-name> --cloudUrl <cloud-server-url> [server-options]
```

#### Required Arguments
- `--server`: The MCP server name to proxy (e.g., `mongodb-mcp-server`, `filesystem-mcp`, `postgres-mcp`)
- `--cloudUrl`: URL of the cloud server (default: `http://localhost:3001`)

#### Optional Arguments
- `--apiKey`: API key for cloud server authentication
- Server-specific options are supported and passed through to the target MCP server

#### Examples
```bash
# Connect to MongoDB MCP server
spydermcp --server mongodb-mcp-server --cloudUrl https://spydermcp.com --connectionString "mongodb://localhost:27017/mydb"

# Connect to PostgreSQL MCP server
spydermcp --server postgres-mcp --cloudUrl https://spydermcp.com --connectionString "postgresql://user:pass@localhost/db"

# Connect to filesystem MCP server
spydermcp --server filesystem-mcp --cloudUrl https://spydermcp.com --rootPath "/home/user/documents"
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

- Universal MCP protocol proxying to any server type
- Support for multiple MCP server implementations
- Graphical and command-line interfaces
- Graceful shutdown handling
- Comprehensive error handling and logging
- Auto-update functionality

## License

ISC