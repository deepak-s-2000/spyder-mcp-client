# SpyderMCP Installation Guide

SpyderMCP can be installed in two ways, similar to how Claude Code works:

## Option 1: Install via npm (Recommended - Like Claude Code)

This is how Claude Code works - it's published to npm and installs globally.

### For Users:

```bash
# Install globally
npm install -g spydermcp

# Now you can use it anywhere
spydermcp --help
spydermcp --version
```

### For Developers (Publishing):

```bash
# Build the project
npm run build

# Publish to npm (requires npm account)
npm publish

# Or publish with specific tag
npm publish --tag latest
```

**Why this works globally:**
- npm installs the package to `%APPDATA%\npm\node_modules\spydermcp`
- npm creates wrapper scripts in `%APPDATA%\npm\` (spydermcp.cmd, spydermcp)
- The npm directory is automatically in PATH when Node.js is installed
- No manual PATH configuration needed!

## Option 2: Install Electron App (GUI + CLI)

Download and install the SpyderMCP Electron application. This provides both a GUI interface and CLI tools.

**Location:** `C:\Program Files\SpyderMCP\resources\cli\`

**What's included:**
- `spydermcp.bat` - Windows batch script
- `spydermcp.ps1` - PowerShell script
- `index.js` - Main CLI entry point
- `setup-path.ps1` - Automatic PATH setup script
- All required dependencies

### Setup CLI for Global Access:

After installing the Electron app, run the setup script to add SpyderMCP CLI to your PATH:

```powershell
# Run PowerShell as Administrator
cd "C:\Program Files\SpyderMCP\resources\cli"
.\setup-path.ps1
```

Then restart your terminal and you can use:

```bash
spydermcp --help
```

## How This Compares to Claude Code

| Feature | Claude Code | SpyderMCP |
|---------|-------------|-----------|
| Installation Method | npm install -g | npm install -g OR Electron installer |
| Global Command | `claude` | `spydermcp` |
| PATH Setup | Automatic via npm | Automatic via npm OR manual (setup-path.ps1) |
| GUI Available | No | Yes (Electron app) |
| CLI Location | `%APPDATA%\npm\node_modules\@anthropic-ai\claude-code` | `%APPDATA%\npm\node_modules\spydermcp` OR `C:\Program Files\SpyderMCP\resources\cli` |

## Usage Examples

```bash
# Show help
spydermcp --help

# Show version
spydermcp --version

# Connect to cloud MCP server
spydermcp --server mongodb-mcp-server --cloudUrl https://your-server.com

# With environment variables
set SPYDERMCP_CLOUD_URL=https://your-server.com
set SPYDERMCP_API_KEY=your-api-key
spydermcp --server mongodb-mcp-server
```

## Requirements

- **Node.js**: Version 20.0.0 or higher
- **npm**: Comes with Node.js

## Troubleshooting

### Command not found
1. Make sure Node.js is installed: `node --version`
2. If using Electron installer, restart your terminal
3. Check PATH includes npm directory: `echo %PATH%`

### npm installation fails
```bash
# Try with sudo (Linux/Mac)
sudo npm install -g spydermcp

# Or install without sudo (alternative location)
npm install -g spydermcp --prefix ~/.local
```

### Windows permission issues
Run PowerShell or Command Prompt as Administrator when installing.
