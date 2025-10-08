# SpyderMCP PATH Setup Script
# This script adds the SpyderMCP CLI to the system PATH

# Requires Administrator privileges
if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Error "This script requires Administrator privileges."
    Write-Host "Please run PowerShell as Administrator and try again."
    exit 1
}

# Get the directory where this script is located (should be in resources/cli)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "SpyderMCP PATH Setup" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host ""

# Check if the directory is already in PATH
$currentPath = [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::Machine)
if ($currentPath -like "*$ScriptDir*") {
    Write-Host "SpyderMCP CLI is already in system PATH!" -ForegroundColor Green
    Write-Host "Path: $ScriptDir" -ForegroundColor Gray
    exit 0
}

# Add to system PATH
try {
    $newPath = $currentPath + ";" + $ScriptDir
    [Environment]::SetEnvironmentVariable("Path", $newPath, [EnvironmentVariableTarget]::Machine)

    Write-Host "Successfully added SpyderMCP CLI to system PATH!" -ForegroundColor Green
    Write-Host "Path added: $ScriptDir" -ForegroundColor Gray
    Write-Host ""
    Write-Host "You may need to restart your terminal or computer for the changes to take effect." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "After restarting your terminal, you can use:" -ForegroundColor Cyan
    Write-Host "  spydermcp --help" -ForegroundColor White
    Write-Host "  spydermcp.bat --help" -ForegroundColor White

} catch {
    Write-Error "Failed to add SpyderMCP CLI to PATH: $_"
    exit 1
}
