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
spydermcp --server <server-name> [server-options]
```

#### Required Arguments
- `--server`: The MCP server name to proxy (e.g., `mongodb-mcp-server`, `filesystem-mcp`, `postgres-mcp`)

#### Optional Arguments
- `--cloudUrl`: URL of the cloud server (default: `http://localhost:3001`)
- `--apiKey`: API key for cloud server authentication
- Server-specific options are supported and passed through to the target MCP server

#### Environment Variables
For cleaner configuration, you can use environment variables:
- `SPYDERMCP_CLOUD_URL`: Cloud server URL (replaces `--cloudUrl`)
- `SPYDERMCP_API_KEY`: API key for authentication (replaces `--apiKey`)

```bash
# Set environment variables (recommended)
export SPYDERMCP_CLOUD_URL="https://spydermcp.com"
export SPYDERMCP_API_KEY="your-api-key"
```

#### Examples

**With environment variables (recommended):**
```bash
# Set environment variables once
export SPYDERMCP_CLOUD_URL="https://spydermcp.com"
export SPYDERMCP_API_KEY="your-api-key"

# Clean command-line usage - only server-specific arguments
spydermcp --server mongodb-mcp-server --connectionString "mongodb://localhost:27017/mydb"
spydermcp --server postgres-mcp --connectionString "postgresql://user:pass@localhost/db"
spydermcp --server filesystem-mcp --rootPath "/home/user/documents"
```

**Without environment variables:**
```bash
# Include cloudUrl and apiKey in each command
spydermcp --server mongodb-mcp-server --cloudUrl https://spydermcp.com --apiKey your-key --connectionString "mongodb://localhost:27017/mydb"
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