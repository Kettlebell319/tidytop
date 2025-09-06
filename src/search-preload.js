const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods for search window
contextBridge.exposeInMainWorld('electronAPI', {
  // Get search statistics
  getSearchStats: () => ipcRenderer.invoke('search-get-stats'),
  
  // Search files with natural language queries
  searchFiles: (query, options) => ipcRenderer.invoke('search-files', query, options),
  
  // Get search suggestions
  getSearchSuggestions: (partial) => ipcRenderer.invoke('search-suggestions', partial),
  
  // Open a file in default application
  openFile: (filePath) => ipcRenderer.invoke('search-open-file', filePath),
  
  // Show file in Finder/Explorer
  showInFinder: (filePath) => ipcRenderer.invoke('search-show-in-finder', filePath),
  
  // Index all organized files (for first-time setup)
  indexAllFiles: () => ipcRenderer.invoke('search-index-all'),
  
  // Clear search index (for reset)
  clearSearchIndex: () => ipcRenderer.invoke('search-clear-index'),
  
  // Close window
  closeWindow: () => window.close()
});