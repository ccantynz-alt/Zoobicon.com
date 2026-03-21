const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onToggleMic: (callback) => ipcRenderer.on('toggle-mic', callback),
  platform: process.platform
});
