# SpyderMCP CLI Launcher for Windows PowerShell
# This PowerShell script launches the Node.js CLI version of SpyderMCP

param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Arguments
)

# Get the directory where this script is located
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Path to the Node.js CLI file
$CliFile = Join-Path $ScriptDir "index.js"

# Check if Node.js is available
try {
    $nodeVersion = node --version 2>$null
    if (-not $nodeVersion) {
        throw "Node.js not found"
    }
} catch {
    Write-Error "Error: Node.js is not installed or not in PATH"
    Write-Host "Please install Node.js from https://nodejs.org/"
    exit 1
}

# Check if CLI file exists
if (-not (Test-Path $CliFile)) {
    Write-Error "Error: SpyderMCP CLI file not found at: $CliFile"
    Write-Host "Please reinstall SpyderMCP"
    exit 1
}

# Launch the CLI with all arguments passed through
try {
    if ($Arguments) {
        & node $CliFile @Arguments
    } else {
        & node $CliFile
    }
} catch {
    Write-Error "Error launching SpyderMCP CLI: $_"
    exit 1
}