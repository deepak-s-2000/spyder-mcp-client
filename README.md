# SpyderMCP

**Universal proxy for MCP-compatible applications and cloud-hosted servers**

SpyderMCP is a command-line tool that connects MCP-compatible applications (like Claude Desktop, VS Code with Cline, etc.) to cloud-hosted MCP servers. It handles the stdio transport locally while communicating with your cloud server via HTTP.

## Features

- ✅ **Universal Proxy** - Connect any MCP client to cloud-hosted servers
- ✅ **Automatic Updates** - Stay up-to-date automatically  
- ✅ **MongoDB Support** - Built-in support for MongoDB MCP servers
- ✅ **Cross-Platform** - Works on Windows, macOS, and Linux
- ✅ **Easy Configuration** - Simple command-line interface

## Installation

### Prerequisites
- Node.js 20.0.0 or higher

### Install via npm (Recommended)

```bash
npm install -g spydermcp
```

That's it! The `spydermcp` command is now available globally.

### Verify Installation

```bash
spydermcp --version
```

## Usage

### Basic Usage

```bash
spydermcp --server <server-name> --cloudUrl <your-cloud-url>
```

### Example: MongoDB Server

```bash
spydermcp --server mongodb-mcp-server \
  --cloudUrl https://your-spydermcp-instance.com \
  --connectionString mongodb://localhost:27017/mydb \
  --apiKey your-api-key
```

### Configuration with MCP Clients

#### Claude Desktop

Add to `claude_desktop_config.json`:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "spydermcp-mongodb": {
      "command": "spydermcp",
      "args": [
        "--server", "mongodb-mcp-server",
        "--cloudUrl", "https://your-cloud-server.com",
        "--connectionString", "mongodb://localhost:27017/mydb",
        "--apiKey", "your-api-key"
      ]
    }
  }
}
```

#### VS Code with Cline

Add to `.vscode/mcp.json` or Cline settings:

```json
{
  "mcpServers": {
    "spydermcp-mongodb": {
      "command": "spydermcp",
      "args": [
        "--server", "mongodb-mcp-server",
        "--cloudUrl", "https://your-cloud-server.com",
        "--connectionString", "mongodb://localhost:27017/mydb"
      ]
    }
  }
}
```

## Command-Line Options

### Required Options

- `--server <name>` - MCP server name (e.g., `mongodb-mcp-server`)

### Optional Options

- `--cloudUrl <url>` - Cloud server URL (env: `SPYDERMCP_CLOUD_URL`)
  - Default: `http://localhost:3001`
- `--apiKey <key>` - API key for cloud server authentication (env: `SPYDERMCP_API_KEY`)
- `--version, -v` - Show version number

### MongoDB-Specific Options

When using `--server mongodb-mcp-server`, you can pass any MongoDB connection options:

- `--connectionString` - MongoDB connection string
- `--db` - Database name
- `--host` - MongoDB host
- `--port` - MongoDB port
- `--username` - MongoDB username
- `--password` - MongoDB password
- And many more MongoDB options...

Run `spydermcp --help` to see all available options.

## Environment Variables

You can use environment variables instead of command-line arguments:

```bash
export SPYDERMCP_CLOUD_URL=https://your-cloud-server.com
export SPYDERMCP_API_KEY=your-api-key

spydermcp --server mongodb-mcp-server --connectionString mongodb://localhost:27017/mydb
```

## Updates

### Automatic Updates

SpyderMCP automatically checks for updates when you run it. If a new version is available, it will:

1. Show an update notification
2. Download and install the update automatically
3. Restart with your current command

Example:
```bash
$ spydermcp --server mongodb-mcp-server

🔄 Update available: 1.0.0 → 1.0.2
📥 Downloading and installing update...
✅ Update complete! Restarting...
```

### Manual Update

You can also update manually at any time:

```bash
npm update -g spydermcp
```

## License

MIT

## Support

- **Issues**: https://github.com/deepak-s-2000/spyder-mcp-client/issues
- **Repository**: https://github.com/deepak-s-2000/spyder-mcp-client
