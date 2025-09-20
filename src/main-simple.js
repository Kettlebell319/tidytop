const { app, BrowserWindow, Menu, Tray, nativeImage, ipcMain, shell } = require('electron');
const path = require('path');
const os = require('os');
const AutoLaunch = require('auto-launch');

class TidyTop {
  constructor() {
    this.tray = null;
    this.window = null;
    this.settingsWindow = null;
    this.aboutWindow = null;
    this.previewWindow = null;
    this.searchWindow = null;
    this.isQuitting = false;
    this.autoCleanEnabled = false;
    this.autoLaunchEnabled = false;
    this.fileWatcher = null;
    this.autoClean = null;
    this.config = null;
    
    // Auto-launch configuration
    this.autoLauncher = new AutoLaunch({
      name: 'TidyTop',
      path: app.getPath('exe'),
      isHidden: true // Start minimized to system tray
    });
  }

  async init() {
    await app.whenReady();
    this.loadConfig();
    this.setupIPC();
    await this.setupAutoLaunch();
    this.createTray();
    this.setupMenu();
    
    // Hide dock icon on macOS
    if (process.platform === 'darwin') {
      app.dock.hide();
    }
  }

  createTray() {
    console.log('Creating tray icon...');
    
    // Simple system icon that works on all platforms
    const icon = nativeImage.createFromNamedImage('NSImageNameFolder', [16, 16]);
    icon.setTemplateImage(true);
    
    this.tray = new Tray(icon);
    this.tray.setToolTip('TidyTop - Desktop Organizer');
    
    console.log('Tray icon created successfully');
  }

  setupMenu() {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '🧹 Clean Desktop',
        click: () => this.previewClean()
      },
      {
        label: this.autoCleanEnabled ? '✨ Auto-Clean (ON)' : '✨ Auto-Clean (OFF)',
        type: 'checkbox',
        checked: this.autoCleanEnabled,
        click: (item) => this.toggleAutoClean(item.checked)
      },
      { type: 'separator' },
      {
        label: '🕒 Recent (72h)',
        click: () => this.showRecent()
      },
      {
        label: '↩️ Undo Last Clean',
        click: () => this.undoLastClean()
      },
      // Smart Find temporarily disabled due to SQLite crash
      // {
      //   label: '🔍 Smart Find',
      //   click: () => this.openSmartFind()
      // },
      { type: 'separator' },
      {
        label: '⚙️ Settings',
        click: () => this.openSettings()
      },
      {
        label: 'About TidyTop',
        click: () => this.showAbout()
      },
      {
        label: this.autoLaunchEnabled ? 'Start at Login (ON)' : 'Start at Login (OFF)',
        type: 'checkbox',
        checked: this.autoLaunchEnabled,
        click: (item) => this.toggleAutoLaunch(item.checked)
      },
      {
        label: 'Quit TidyTop',
        click: () => {
          this.isQuitting = true;
          app.quit();
        }
      }
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  async cleanNow() {
    console.log('🧹 Starting desktop clean...');
    const { DesktopOrganizer } = require('./core/organize/organizer');
    const organizer = new DesktopOrganizer();
    
    try {
      const result = await organizer.cleanDesktop();
      this.tray.displayBalloon({
        title: 'TidyTop',
        content: `✨ Organized ${result.movedCount} files!`
      });
    } catch (error) {
      console.error('Clean failed:', error);
      this.tray.displayBalloon({
        title: 'TidyTop Error',
        content: 'Failed to clean desktop. Check console for details.'
      });
    }
  }

  async previewClean() {
    console.log('🔍 Opening preview and approval workflow...');
    
    try {
      // Open the new preview-and-approve window
      this.showPreviewWindow();
      
    } catch (error) {
      console.error('Preview failed:', error);
      this.tray.displayBalloon({
        title: 'TidyTop Error',
        content: 'Failed to open preview window. Check console for details.'
      });
    }
  }

  generateFolderName(category) {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 7); // YYYY-MM format
    
    // Generate meaningful folder names based on category
    const folderNames = {
      'Screenshots': `Screenshots ${dateStr}`,
      'Images': 'Images',
      'PDFs': 'Documents',
      'Docs': 'Documents', 
      'Slides': 'Presentations',
      'Sheets': 'Spreadsheets',
      'Archives': 'Archives',
      'Video': 'Videos',
      'Audio': 'Audio',
      'Apps': 'Applications',
      'Misc': 'Miscellaneous'
    };
    
    return folderNames[category] || category;
  }

  showPreviewWindow() {
    if (this.previewWindow) {
      this.previewWindow.focus();
      return;
    }

    this.previewWindow = new BrowserWindow({
      width: 700,
      height: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preview-preload.js')
      },
      resizable: true,
      title: 'TidyTop Preview - Organize Your Desktop',
      show: false
    });

    this.previewWindow.loadFile(path.join(__dirname, 'preview.html'));

    this.previewWindow.once('ready-to-show', () => {
      this.previewWindow.show();
    });

    this.previewWindow.on('closed', () => {
      this.previewWindow = null;
    });
  }

  async toggleAutoClean(enabled) {
    this.autoCleanEnabled = enabled;
    console.log(`Auto-clean ${enabled ? 'enabled' : 'disabled'}`);
    
    try {
      if (enabled) {
        // Start Auto-Clean
        if (!this.autoClean) {
          const { AutoClean } = require('./core/organize/autoClean');
          this.autoClean = new AutoClean();
        }
        await this.autoClean.start();
        
        this.tray.displayBalloon({
          title: 'Auto-Clean Enabled',
          content: '⚡ TidyTop will now automatically organize new files'
        });
      } else {
        // Stop Auto-Clean
        if (this.autoClean) {
          await this.autoClean.stop();
        }
        
        this.tray.displayBalloon({
          title: 'Auto-Clean Disabled',
          content: '⚡ Automatic file organization stopped'
        });
      }
    } catch (error) {
      console.error('Failed to toggle auto-clean:', error);
      this.autoCleanEnabled = false; // Reset on error
      
      this.tray.displayBalloon({
        title: 'Auto-Clean Error',
        content: 'Failed to toggle automatic organization'
      });
    }
    
    // Refresh menu to update status
    this.setupMenu();
  }

  async showRecent() {
    console.log('Opening recent files...');
    const { RecentManager } = require('./core/organize/recent');
    const recentManager = new RecentManager();
    
    try {
      const result = await recentManager.createRecentFolder();
      this.tray.displayBalloon({
        title: 'TidyTop',
        content: `📁 Found ${result.fileCount} recent files!`
      });
    } catch (error) {
      console.error('Failed to show recent files:', error);
      this.tray.displayBalloon({
        title: 'TidyTop Error',
        content: 'Failed to create recent files view'
      });
    }
  }

  async undoLastClean() {
    console.log('Undoing last clean...');
    const { UndoManager } = require('./core/organize/undo');
    const undoManager = new UndoManager();
    
    try {
      const result = await undoManager.undoLastClean();
      this.tray.displayBalloon({
        title: 'TidyTop',
        content: `↩️ Restored ${result.undoCount} files to desktop!`
      });
    } catch (error) {
      console.error('Undo failed:', error);
      this.tray.displayBalloon({
        title: 'TidyTop Error',
        content: error.message || 'Failed to undo last clean'
      });
    }
  }


  openSmartFind() {
    try {
      // Create Smart Find window
      if (this.searchWindow) {
        this.searchWindow.focus();
        return;
      }

      console.log('Creating Smart Find window...');

      this.searchWindow = new BrowserWindow({
        width: 900,
        height: 700,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
          // Temporarily removing preload to test
        },
        show: false
      });

      console.log('Loading search.html...');
      this.searchWindow.loadFile(path.join(__dirname, 'search-minimal.html'));

      this.searchWindow.once('ready-to-show', () => {
        console.log('Smart Find window ready to show');
        this.searchWindow.show();
      });

      this.searchWindow.on('closed', () => {
        console.log('Smart Find window closed');
        this.searchWindow = null;
      });

      this.searchWindow.webContents.on('crashed', (event) => {
        console.error('Smart Find window crashed:', event);
        this.searchWindow = null;
      });

    } catch (error) {
      console.error('Failed to create Smart Find window:', error);
      this.tray.displayBalloon({
        title: 'TidyTop Error',
        content: 'Failed to open Smart Find'
      });
    }
  }

  openSettings() {
    if (this.settingsWindow) {
      this.settingsWindow.focus();
      return;
    }

    this.settingsWindow = new BrowserWindow({
      width: 600,
      height: 700,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      },
      resizable: false,
      title: 'TidyTop Settings',
      show: false
    });

    this.settingsWindow.loadFile(path.join(__dirname, 'settings.html'));

    this.settingsWindow.once('ready-to-show', () => {
      this.settingsWindow.show();
    });

    this.settingsWindow.on('closed', () => {
      this.settingsWindow = null;
    });
  }

  loadConfig() {
    try {
      this.config = require('../config/default.json');
    } catch (error) {
      console.error('Failed to load config:', error);
      this.config = {};
    }
  }

  setupIPC() {
    ipcMain.handle('get-config', () => {
      return this.config;
    });

    ipcMain.handle('save-config', (event, newConfig) => {
      try {
        const fs = require('fs');
        const configPath = path.join(__dirname, '../config/default.json');
        fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));
        this.config = newConfig;
        console.log('Configuration saved');
        return true;
      } catch (error) {
        console.error('Failed to save config:', error);
        return false;
      }
    });

    ipcMain.on('organize-now', () => {
      this.cleanNow();
    });

    ipcMain.handle('reset-config', () => {
      try {
        const defaultConfig = {
          "dateFolders": "month",
          "screenshotTodayAlias": true,
          "autoBundle": true,
          "weeklySweep": {
            "enabled": true,
            "weekday": "Sun",
            "hour": 21,
            "archiveAfterDays": 30
          },
          "pinnedRules": [
            {"contains": ["invoice", "receipt"], "dest": "Docs"},
            {"prefix": ["SOW_", "Proposal_"], "dest": "Docs"}
          ],
          "extensions": {
            "pdf": "PDFs", "png": "Images", "jpg": "Images", "jpeg": "Images", "heic": "Images", "gif": "Images",
            "zip": "Archives", "7z": "Archives", "rar": "Archives", "tar": "Archives", "gz": "Archives",
            "ppt": "Slides", "pptx": "Slides", "key": "Slides",
            "xls": "Sheets", "xlsx": "Sheets", "csv": "Sheets",
            "doc": "Docs", "docx": "Docs", "md": "Docs", "rtf": "Docs", "txt": "Docs",
            "mp4": "Video", "mov": "Video", "avi": "Video", "mkv": "Video",
            "mp3": "Audio", "wav": "Audio", "flac": "Audio", "aac": "Audio",
            "app": "Apps", "dmg": "Apps"
          },
          "categories": {
            "Screenshots": "📸", "Images": "🖼️", "PDFs": "📄", "Docs": "📝", "Slides": "📊", "Sheets": "📈",
            "Archives": "📦", "Video": "🎥", "Audio": "🎵", "Apps": "📱", "Misc": "📁"
          }
        };

        const fs = require('fs');
        const configPath = path.join(__dirname, '../config/default.json');
        fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
        this.config = defaultConfig;
        console.log('Configuration reset to defaults');
        return true;
      } catch (error) {
        console.error('Failed to reset config:', error);
        return false;
      }
    });

    // Smart Find IPC handlers
    ipcMain.handle('search-get-stats', async () => {
      try {
        const { SmartSearch } = require('./core/index/search');
        const search = new SmartSearch();
        const stats = await search.getSearchStats();
        await search.close();
        return stats;
      } catch (error) {
        console.error('Failed to get search stats:', error);
        return { totalFiles: 0, categories: 0, indexedToday: 0, canSearch: false };
      }
    });

    ipcMain.handle('search-files', async (event, query, options) => {
      try {
        const { SmartSearch } = require('./core/index/search');
        const search = new SmartSearch();
        const results = await search.search(query, options);
        await search.close();
        return results;
      } catch (error) {
        console.error('Search failed:', error);
        return { query, results: [], count: 0, error: error.message };
      }
    });

    ipcMain.handle('search-suggestions', async (event, partial) => {
      try {
        const { SmartSearch } = require('./core/index/search');
        const search = new SmartSearch();
        const suggestions = await search.getSearchSuggestions(partial);
        await search.close();
        return suggestions;
      } catch (error) {
        console.error('Failed to get search suggestions:', error);
        return [];
      }
    });

    ipcMain.handle('search-open-file', async (event, filePath) => {
      try {
        await shell.openPath(filePath);
        return { success: true };
      } catch (error) {
        console.error('Failed to open file:', error);
        return { success: false, message: error.message };
      }
    });

    ipcMain.handle('search-show-in-finder', async (event, filePath) => {
      try {
        shell.showItemInFolder(filePath);
        return { success: true };
      } catch (error) {
        console.error('Failed to show in finder:', error);
        return { success: false, message: error.message };
      }
    });

    ipcMain.handle('search-index-all', async () => {
      try {
        const { SmartSearch } = require('./core/index/search');
        const search = new SmartSearch();
        const count = await search.indexAllOrganizedFiles();
        await search.close();
        return { success: true, indexedCount: count };
      } catch (error) {
        console.error('Failed to index files:', error);
        return { success: false, message: error.message };
      }
    });

    ipcMain.handle('search-clear-index', async () => {
      try {
        const { SmartSearch } = require('./core/index/search');
        const search = new SmartSearch();
        await search.clearIndex();
        await search.close();
        return { success: true };
      } catch (error) {
        console.error('Failed to clear search index:', error);
        return { success: false, message: error.message };
      }
    });

    // Preview and approve workflow handlers
    ipcMain.handle('analyze-desktop', async () => {
      try {
        const { DesktopOrganizer } = require('./core/organize/organizer');
        const organizer = new DesktopOrganizer();
        
        // Get files from desktop
        const files = await organizer.getDesktopFiles();
        
        // Categorize files
        const categories = {};
        const folderNames = {};
        
        for (const file of files) {
          const category = organizer.determineCategory(file);
          if (!category) continue; // Skip files without category
          
          if (!categories[category]) {
            categories[category] = [];
          }
          categories[category].push({
            name: file.name,
            path: file.path,
            type: file.ext || 'file'
          });
          
          // Generate default folder names
          if (!folderNames[category]) {
            folderNames[category] = this.generateFolderName(category);
          }
        }
        
        return {
          categories,
          folderNames,
          totalFiles: files.length
        };
      } catch (error) {
        console.error('Failed to analyze desktop:', error);
        throw new Error('Failed to analyze desktop files');
      }
    });

    ipcMain.handle('execute-organization', async (event, analysisResult) => {
      try {
        const { DesktopOrganizer } = require('./core/organize/organizer');
        const organizer = new DesktopOrganizer();
        
        // Execute organization with user-approved folder names
        const result = await organizer.organizeWithCustomNames(analysisResult);
        return result;
      } catch (error) {
        console.error('Failed to execute organization:', error);
        throw new Error('Failed to organize desktop files');
      }
    });
  }

  showAbout() {
    // Create a proper About window
    if (this.aboutWindow) {
      this.aboutWindow.focus();
      return;
    }

    this.aboutWindow = new BrowserWindow({
      width: 400,
      height: 300,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      },
      resizable: false,
      minimizable: false,
      maximizable: false,
      title: 'About TidyTop',
      show: false
    });

    // Create About page content
    const aboutHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                margin: 0; padding: 30px; text-align: center; background: #f5f5f5;
            }
            .logo { font-size: 48px; margin-bottom: 10px; }
            .title { font-size: 24px; font-weight: bold; color: #2563EB; margin-bottom: 10px; }
            .version { font-size: 16px; color: #666; margin-bottom: 20px; }
            .description { font-size: 14px; color: #333; margin-bottom: 20px; line-height: 1.4; }
            .features { text-align: left; max-width: 300px; margin: 0 auto; }
            .feature { font-size: 12px; color: #555; margin: 4px 0; }
            .footer { font-size: 11px; color: #888; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="logo"></div>
        <div class="title">TidyTop</div>
        <div class="version">Version 1.0.0</div>
        <div class="description">Your desktop is a hot mess. We're here to fix that without you having to think about it.</div>
        
        <div class="features">
            <div class="feature">- One-click desktop organization</div>
            <div class="feature">- Smart screenshot handling</div>
            <div class="feature">- Auto-clean file watching</div>
            <div class="feature">- Recent files (72h) access</div>
            <div class="feature">- Complete undo system</div>
            <div class="feature">- Customizable settings</div>
        </div>
        
        <div class="footer">
            Because life's too short to spend it looking for files.
        </div>
    </body>
    </html>`;

    this.aboutWindow.loadURL('data:text/html,' + encodeURIComponent(aboutHTML));

    this.aboutWindow.once('ready-to-show', () => {
      this.aboutWindow.show();
    });

    this.aboutWindow.on('closed', () => {
      this.aboutWindow = null;
    });
  }

  startFileWatcher() {
    if (this.fileWatcher) {
      this.stopFileWatcher();
    }

    try {
      const chokidar = require('chokidar');
      const desktopPath = path.join(os.homedir(), 'Desktop');
      
      this.fileWatcher = chokidar.watch(desktopPath, {
        ignored: /(^|[\/\\])\../, // ignore dotfiles
        persistent: true,
        ignoreInitial: true,
        depth: 0 // only watch direct children of desktop
      });

      this.fileWatcher.on('add', (filePath) => {
        console.log('New file detected:', filePath);
        // Debounce to avoid organizing while user is still working
        clearTimeout(this.autoCleanTimer);
        this.autoCleanTimer = setTimeout(() => {
          this.autoOrganize(filePath);
        }, 5000); // Wait 5 seconds after last file addition
      });

      console.log('🔍 File watcher started for desktop');
    } catch (error) {
      console.error('Failed to start file watcher:', error);
      this.autoCleanEnabled = false;
      this.setupMenu();
    }
  }

  stopFileWatcher() {
    if (this.fileWatcher) {
      this.fileWatcher.close();
      this.fileWatcher = null;
      console.log('🔍 File watcher stopped');
    }
    
    if (this.autoCleanTimer) {
      clearTimeout(this.autoCleanTimer);
      this.autoCleanTimer = null;
    }
  }

  async autoOrganize(filePath) {
    try {
      console.log('🤖 Auto-organizing:', filePath);
      const { DesktopOrganizer } = require('./core/organize/organizer');
      const organizer = new DesktopOrganizer();
      
      // Check if file still exists (user might have moved it)
      const fs = require('fs').promises;
      try {
        await fs.access(filePath);
      } catch (error) {
        console.log('File no longer exists, skipping auto-organize');
        return;
      }
      
      await organizer.cleanDesktop();
    } catch (error) {
      console.error('Auto-organize failed:', error);
    }
  }

  async setupAutoLaunch() {
    try {
      // Check if auto-launch is currently enabled
      this.autoLaunchEnabled = await this.autoLauncher.isEnabled();
      console.log(`Auto-launch is ${this.autoLaunchEnabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Failed to check auto-launch status:', error);
      this.autoLaunchEnabled = false;
    }
  }

  async toggleAutoLaunch(enabled) {
    try {
      if (enabled) {
        await this.autoLauncher.enable();
        console.log('Auto-launch enabled');
      } else {
        await this.autoLauncher.disable();
        console.log('Auto-launch disabled');
      }
      
      this.autoLaunchEnabled = enabled;
      
      // Refresh menu to update status
      this.setupMenu();
      
      this.tray.displayBalloon({
        title: 'TidyTop',
        content: `Start at login ${enabled ? 'enabled' : 'disabled'}`
      });
    } catch (error) {
      console.error('Failed to toggle auto-launch:', error);
      this.tray.displayBalloon({
        title: 'TidyTop Error',
        content: 'Failed to change startup settings'
      });
    }
  }
}

// Handle app events for proper background operation
app.on('window-all-closed', () => {
  // On macOS, keep the app running in background even when all windows are closed
  // On Windows/Linux, this is the expected behavior for system tray apps
  if (process.platform !== 'darwin') {
    // Keep running - don't quit
  }
});

app.on('activate', () => {
  // On macOS, re-show the tray if it was hidden
  if (tidyTop && !tidyTop.tray) {
    tidyTop.createTray();
    tidyTop.setupMenu();
  }
});

app.on('before-quit', (event) => {
  if (tidyTop && !tidyTop.isQuitting) {
    // Prevent quitting unless explicitly requested
    event.preventDefault();
    return;
  }
  
  // Cleanup file watcher when actually quitting
  if (tidyTop && tidyTop.fileWatcher) {
    tidyTop.stopFileWatcher();
  }
});

// Prevent app from quitting when last window is closed (important for menu bar apps)
app.on('quit', () => {
  console.log('TidyTop shutting down...');
});

// Start the app
const tidyTop = new TidyTop();
tidyTop.init().catch(console.error);