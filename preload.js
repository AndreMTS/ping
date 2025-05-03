const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  startPing: (data) => ipcRenderer.invoke('start-ping', data),
  stopPing: () => ipcRenderer.invoke('stop-ping'),
  exportResults: () => ipcRenderer.invoke('export-results'),
  onPingUpdate: (callback) => {
    ipcRenderer.on('ping-update', (event, data) => callback(data));
    return () => {
      ipcRenderer.removeAllListeners('ping-update');
    };
  },
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  navigateToMain: () => ipcRenderer.send('navigate-to-main'),
  navigateToSettings: () => ipcRenderer.send('navigate-to-settings'),
  selectDirectory: () => ipcRenderer.invoke('select-directory')
}); 