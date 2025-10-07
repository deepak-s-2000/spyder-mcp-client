# SpyderMCP CLI Setup Instructions

After installing SpyderMCP, you have two ways to use it:

## 1. GUI Mode (Default)
- Run the installed SpyderMCP application from Start Menu or Desktop
- Use the graphical interface to configure and run MCP connections

## 2. CLI Mode
The CLI files are included with your installation. Here's how to set it up:

### Windows Installation Locations:
- **Program Files**: `C:\Program Files\SpyderMCP\resources\cli\`
- **User Install**: `%LOCALAPPDATA%\Programs\SpyderMCP\resources\cli\`

### Setup CLI Access:

#### Option 1: Add to PATH (Recommended)
1. Find your SpyderMCP installation directory
2. Add the `resources\cli` folder to your Windows PATH environment variable
3. Restart your command prompt/PowerShell
4. Use: `spydermcp --help`

#### Option 2: Direct Execution
Navigate to the CLI directory and use:
```cmd
# Command Prompt
spydermcp.bat --server mongodb-mcp-server --connectionString "mongodb://localhost:27017/mydb"

# PowerShell
.\spydermcp.ps1 --server mongodb-mcp-server --connectionString "mongodb://localhost:27017/mydb"
```

#### Option 3: Node.js Direct
```cmd
node spydermcp-cli.js --server mongodb-mcp-server --connectionString "mongodb://localhost:27017/mydb"
```

### CLI Usage Examples:
```bash
# Basic MongoDB connection
spydermcp --server mongodb-mcp-server --connectionString "mongodb://localhost:27017/mydb"

# With cloud server
spydermcp --server mongodb-mcp-server --cloudUrl "https://your-server.com" --connectionString "mongodb://localhost:27017/mydb"

# With API authentication
spydermcp --server mongodb-mcp-server --apiKey "your-api-key" --connectionString "mongodb://localhost:27017/mydb"

# Help
spydermcp --help
```

### Environment Variables:
You can set these environment variables to avoid typing them repeatedly:
- `SPYDERMCP_CLOUD_URL`: Default cloud server URL
- `SPYDERMCP_API_KEY`: Default API key for authentication

### Troubleshooting:
1. **"Node.js not found"**: Install Node.js from https://nodejs.org/
2. **"spydermcp command not found"**: Add the CLI directory to your PATH
3. **Permission errors**: Run as Administrator or check file permissions