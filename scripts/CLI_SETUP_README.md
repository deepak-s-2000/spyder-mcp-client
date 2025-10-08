# SpyderMCP CLI Setup

After installing SpyderMCP, the CLI tools are available in the installation directory but not automatically added to your system PATH.

## Quick Start

### Option 1: Automatic Setup (Recommended)

Run the setup script as Administrator to add SpyderMCP CLI to your system PATH:

**PowerShell (Run as Administrator):**
```powershell
cd "C:\Program Files\SpyderMCP\resources\cli"
.\setup-path.ps1
```

After running this script, restart your terminal and you can use:
```bash
spydermcp --help
```

### Option 2: Manual Setup

Add the CLI directory to your system PATH manually:

1. Open **System Properties** → **Environment Variables**
2. Under **System Variables**, find and select **Path**
3. Click **Edit** → **New**
4. Add: `C:\Program Files\SpyderMCP\resources\cli`
5. Click **OK** to save
6. Restart your terminal

### Option 3: Use Full Path

You can run the CLI without adding to PATH by using the full path:

**Command Prompt:**
```cmd
"C:\Program Files\SpyderMCP\resources\cli\spydermcp.bat" --help
```

**PowerShell:**
```powershell
& "C:\Program Files\SpyderMCP\resources\cli\spydermcp.ps1" --help
```

## Usage Examples

Once setup is complete, you can use SpyderMCP CLI:

```bash
# Show help
spydermcp --help

# Show version
spydermcp --version

# Connect to a cloud MCP server
spydermcp --server mongodb-mcp-server --cloudUrl https://your-cloud-url.com

# With environment variables
set SPYDERMCP_CLOUD_URL=https://your-cloud-url.com
set SPYDERMCP_API_KEY=your-api-key
spydermcp --server mongodb-mcp-server
```

## Requirements

- **Node.js**: Version 20.0.0 or higher must be installed
- The SpyderMCP Electron app must be installed

## Troubleshooting

### "Node.js is not installed"
Install Node.js from https://nodejs.org/

### "spydermcp is not recognized"
Make sure you've added the CLI directory to your PATH and restarted your terminal.

### Permission Issues
The setup-path.ps1 script requires Administrator privileges. Right-click PowerShell and select "Run as Administrator".
