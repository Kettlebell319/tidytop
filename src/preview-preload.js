const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods for preview approval workflow
contextBridge.exposeInMainWorld('electronAPI', {
  // Analyze desktop files and return categorization
  analyzeDesktop: () => ipcRenderer.invoke('analyze-desktop'),
  
  // Execute organization with user-approved folder names
  executeOrganization: (analysisResult) => ipcRenderer.invoke('execute-organization', analysisResult),
  
  // Close preview window
  closeWindow: () => window.close()
});