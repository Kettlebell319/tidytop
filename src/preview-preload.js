const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the preview window to communicate
contextBridge.exposeInMainWorld('electronAPI', {
  onPreviewData: (callback) => ipcRenderer.on('preview-data', (event, data) => callback(data)),
  organizeNow: () => ipcRenderer.send('organize-now'),
});