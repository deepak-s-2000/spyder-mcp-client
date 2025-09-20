import electron from 'electron';
const { contextBridge, ipcRenderer } = electron;

// Define the API that will be available in the renderer process
const electronAPI = {
    // MCP Client operations
    startMcpClient: (config: any) => ipcRenderer.invoke('start-mcp-client', config),
    stopMcpClient: () => ipcRenderer.invoke('stop-mcp-client'),
    getClientStatus: () => ipcRenderer.invoke('get-client-status'),

    // Auto-updater operations
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
    installUpdate: () => ipcRenderer.invoke('install-update'),

    // Event listeners
    onUpdateStatus: (callback: (data: any) => void) => {
        ipcRenderer.on('update-status', (_event, data) => callback(data));
    },
    onUpdateProgress: (callback: (data: any) => void) => {
        ipcRenderer.on('update-progress', (_event, data) => callback(data));
    },
    removeAllListeners: (channel: string) => {
        ipcRenderer.removeAllListeners(channel);
    }
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);