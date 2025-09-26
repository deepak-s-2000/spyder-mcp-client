import electron from 'electron';
const { app, BrowserWindow, ipcMain, dialog } = electron;
import * as path from 'path';
import * as os from 'os';
import { fileURLToPath } from 'url';
import { McpClient } from './mcpClient.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Auto-updater will be loaded dynamically

export class ElectronApp {
    private mainWindow: any = null;
    private mcpClient: McpClient | null = null;
    private isDev = process.env.NODE_ENV === 'development';
    private autoUpdater: any = null;

    constructor() {
        this.setupApp();
        this.loadAutoUpdater();
    }

    private setupApp() {
        // This method will be called when Electron has finished initialization
        app.whenReady().then(() => {
            this.createWindow();
            this.setupIpcHandlers();

            // Check for updates after app is ready (only in production)
            if (!this.isDev && this.autoUpdater) {
                setTimeout(() => {
                    this.autoUpdater.checkForUpdatesAndNotify();
                }, 3000);
            }

            app.on('activate', () => {
                if (BrowserWindow.getAllWindows().length === 0) {
                    this.createWindow();
                }
            });
        });

        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                this.cleanup();
                app.quit();
            }
        });

        app.on('before-quit', () => {
            this.cleanup();
        });
    }

    private createWindow() {
        this.mainWindow = new BrowserWindow({
            width: 1200,
            height: 800,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.js')
            },
            titleBarStyle: 'default',
            show: false
        });

        // Load the HTML interface (we'll create this)
        if (this.isDev) {
            this.mainWindow.loadFile(path.join(__dirname, '..', 'public', 'index.html'));
            this.mainWindow.webContents.openDevTools();
        } else {
            this.mainWindow.loadFile(path.join(__dirname, 'public', 'index.html'));
        }

        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow?.show();
        });

        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
        });
    }

    private setupIpcHandlers() {
        // Handle MCP client start
        ipcMain.handle('start-mcp-client', async (event: any, config: any) => {
            try {
                console.log('Starting MCP client with config:', config);
                this.mcpClient = new McpClient(config);

                // For GUI mode, we might not use stdio transport
                // Instead we could create a custom transport for IPC communication
                const transport = new StdioServerTransport();
                await this.mcpClient.start(transport);
                return { success: true };
            } catch (error) {
                console.error('Error starting MCP client:', error);
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                };
            }
        });

        // Handle MCP client stop
        ipcMain.handle('stop-mcp-client', async () => {
            try {
                if (this.mcpClient) {
                    await this.mcpClient.stop();
                    this.mcpClient = null;
                }
                return { success: true };
            } catch (error) {
                console.error('Error stopping MCP client:', error);
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                };
            }
        });

        // Handle get client status
        ipcMain.handle('get-client-status', () => {
            return {
                isRunning: this.mcpClient !== null,
                platform: os.platform(),
                arch: os.arch(),
                version: app.getVersion()
            };
        });

        // Handle get environment variables
        ipcMain.handle('get-environment-vars', () => {
            return {
                cloudUrl: process.env.SPYDERMCP_CLOUD_URL || '',
                apiKey: process.env.SPYDERMCP_API_KEY || ''
            };
        });
    }

    private async loadAutoUpdater() {
        try {
            const pkg = await import('electron-updater');
            this.autoUpdater = pkg.autoUpdater;
            this.setupAutoUpdater();
        } catch (error) {
            console.log('Auto-updater not available:', error);
        }
    }

    private setupAutoUpdater() {
        if (!this.autoUpdater) return;

        // Configure auto-updater
        this.autoUpdater.setFeedURL({
            provider: 'github',
            owner: 'deepak-s-2000',
            repo: 'remote_mcp',
            private: false
        });

        this.autoUpdater.on('checking-for-update', () => {
            console.log('Checking for update...');
            this.sendToRenderer('update-status', { status: 'checking' });
        });

        this.autoUpdater.on('update-available', (info: any) => {
            console.log('Update available:', info);
            this.sendToRenderer('update-status', { status: 'available', info });
        });

        this.autoUpdater.on('update-not-available', (info: any) => {
            console.log('Update not available:', info);
            this.sendToRenderer('update-status', { status: 'not-available' });
        });

        this.autoUpdater.on('error', (err: any) => {
            console.error('Auto-updater error:', err);
            this.sendToRenderer('update-status', { status: 'error', error: err.message });
        });

        this.autoUpdater.on('download-progress', (progressObj: any) => {
            console.log('Download progress:', progressObj);
            this.sendToRenderer('update-progress', progressObj);
        });

        this.autoUpdater.on('update-downloaded', (info: any) => {
            console.log('Update downloaded:', info);
            this.sendToRenderer('update-status', { status: 'downloaded', info });

            // Show dialog to user
            dialog.showMessageBox(this.mainWindow!, {
                type: 'info',
                title: 'Update Ready',
                message: 'Update downloaded. The application will restart to apply the update.',
                buttons: ['Restart Now', 'Later']
            }).then((result) => {
                if (result.response === 0) {
                    this.autoUpdater.quitAndInstall();
                }
            });
        });

        // Handle manual update check
        ipcMain.handle('check-for-updates', () => {
            if (!this.isDev && this.autoUpdater) {
                return this.autoUpdater.checkForUpdatesAndNotify();
            } else {
                return Promise.resolve({ updateInfo: null });
            }
        });

        ipcMain.handle('install-update', () => {
            if (this.autoUpdater) {
                this.autoUpdater.quitAndInstall();
            }
        });
    }

    private sendToRenderer(channel: string, data: any) {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send(channel, data);
        }
    }

    private cleanup() {
        if (this.mcpClient) {
            this.mcpClient.stop().catch(console.error);
            this.mcpClient = null;
        }
    }
}

// Create and start the app - ES module compatible
new ElectronApp();