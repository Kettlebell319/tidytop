const { app, BrowserWindow, Menu, Tray, nativeImage, ipcMain } = require('electron');
const path = require('path');
const os = require('os');

class TidyTop {
  constructor() {
    this.tray = null;
    this.window = null;
    this.settingsWindow = null;
    this.isQuitting = false;
    this.autoCleanEnabled = false;
    this.fileWatcher = null;
    this.config = null;
  }

  async init() {
    await app.whenReady();
    this.loadConfig();
    this.setupIPC();
    this.createTray();
    this.setupMenu();
    
    // Hide dock icon on macOS
    if (process.platform === 'darwin') {
      app.dock.hide();
    }
  }

  createTray() {
    // Create tray icon - try custom icon first, fallback to system icon
    let icon;
    try {
      const iconPath = path.join(__dirname, '../assets/icons/tray-icon.png');
      icon = nativeImage.createFromPath(iconPath);
      
      // If custom icon failed or is empty, use system icon
      if (icon.isEmpty()) {
        throw new Error('Custom icon not found');
      }
      
      // Resize for menu bar
      icon = icon.resize({ width: 16, height: 16 });
    } catch (error) {
      console.log('Using system icon:', error.message);
      // Fallback to system icon - different for each platform
      if (process.platform === 'darwin') {
        icon = nativeImage.createFromNamedImage('NSImageNameFolder', [16, 16]);
      } else {
        // For Windows/Linux, create a simple text-based icon
        icon = nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFkSURBVDiNpZM9SwNBEIafJQQLwcJC0sZCG1sLG1sLbWwsLLSxsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGw');
      }
    }
    
    this.tray = new Tray(icon);
    this.tray.setToolTip('TidyTop - Desktop Organizer');
    
    // Add click handlers
    this.tray.on('click', () => {
      console.log('Tray clicked');
    });
    
    this.tray.on('right-click', () => {
      console.log('Tray right-clicked');
    });
  }

  setupMenu() {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '🧹 Clean Now',
        click: () => this.cleanNow()
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
      { type: 'separator' },
      {
        label: '🎨 Play (Design Mode)',
        click: () => this.enterDesignMode()
      },
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

  toggleAutoClean(enabled) {
    this.autoCleanEnabled = enabled;
    console.log(`Auto-clean ${enabled ? 'enabled' : 'disabled'}`);
    
    if (enabled) {
      this.startFileWatcher();
    } else {
      this.stopFileWatcher();
    }
    
    // Refresh menu to update status
    this.setupMenu();
    
    this.tray.displayBalloon({
      title: 'TidyTop',
      content: `Auto-clean ${enabled ? 'enabled' : 'disabled'}`
    });
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

  enterDesignMode() {
    console.log('Entering design mode...');
    // TODO: Implement design mode
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
  }

  showAbout() {
    this.tray.displayBalloon({
      title: 'About TidyTop',
      content: 'TidyTop v1.0 - Desktop organization made delightful! 🧹✨'
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
}

// Handle app events
app.on('window-all-closed', () => {
  // Keep running in background
});

app.on('activate', () => {
  // Re-create tray if needed
});

app.on('before-quit', () => {
  // Cleanup file watcher
  if (tidyTop && tidyTop.fileWatcher) {
    tidyTop.stopFileWatcher();
  }
});

// Start the app
const tidyTop = new TidyTop();
tidyTop.init().catch(console.error);