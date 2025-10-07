@echo off
REM SpyderMCP CLI Launcher for Windows
REM This batch file launches the Node.js CLI version of SpyderMCP

REM Get the directory where this batch file is located
set "SCRIPT_DIR=%~dp0"

REM Path to the Node.js CLI file
set "CLI_FILE=%SCRIPT_DIR%spydermcp-cli.js"

REM Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if CLI file exists
if not exist "%CLI_FILE%" (
    echo Error: SpyderMCP CLI file not found at: %CLI_FILE%
    echo Please reinstall SpyderMCP
    pause
    exit /b 1
)

REM Launch the CLI with all arguments passed through
node "%CLI_FILE%" %*