const { app, BrowserWindow, Menu, Tray, nativeImage, ipcMain } = require('electron');
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
    this.isQuitting = false;
    this.autoCleanEnabled = false;
    this.autoLaunchEnabled = false;
    this.fileWatcher = null;
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
    // Create tray icon - try custom icon first, fallback to system icon
    let icon;
    try {
      // Try to load the proper 16x16 tray icon
      if (process.platform === 'darwin') {
        // On macOS, use Template icon for automatic dark/light mode adaptation
        const templatePath = path.join(__dirname, '../assets/icons/tray-16x16Template.png');
        icon = nativeImage.createFromPath(templatePath);
        
        if (icon.isEmpty()) {
          // Fallback to regular icon
          const iconPath = path.join(__dirname, '../assets/icons/tray-16x16.png');
          icon = nativeImage.createFromPath(iconPath);
        }
        
        // Mark as template for macOS theme adaptation
        if (!icon.isEmpty()) {
          icon.setTemplateImage(true);
        }
      } else {
        // For Windows/Linux, use regular icon
        const iconPath = path.join(__dirname, '../assets/icons/tray-16x16.png');
        icon = nativeImage.createFromPath(iconPath);
      }
      
      // If all custom icons failed, use system fallback
      if (icon.isEmpty()) {
        throw new Error('Custom tray icons not found');
      }
      
    } catch (error) {
      console.log('Using system fallback icon:', error.message);
      
      // Platform-specific system fallbacks
      if (process.platform === 'darwin') {
        // Use a simple, small folder icon on macOS - much smaller and cleaner
        icon = nativeImage.createFromNamedImage('NSImageNameFolder', [16, 16]);
        
        // Make it even smaller for menu bar
        icon = icon.resize({ width: 14, height: 14 });
        icon.setTemplateImage(true);
      } else if (process.platform === 'win32') {
        // Create a simple geometric icon for Windows
        icon = nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAE4SURBVDiNpZMxSwJxFIe/ryYRDpewobGhqaGloaWloam1oaGltaWltaGloaGloaGloaWhoaGloaGloaGloaGloaGloaGlpaGloaGloaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGh');
      } else {
        // Linux fallback
        icon = nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAE4SURBVDiNpZMxSwJxFIe/ryYRDpewobGhqaGloaWloam1oaGltaWltaGloaGloaGloaWhoaGloaGloaGloaGloaGloaGlpaGloaGloaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGhpaGlpaGloaGh');
      }
    }
    
    this.tray = new Tray(icon);
    this.tray.setToolTip('TidyTop - Desktop Organizer');
    
    // Add click handlers for better UX
    this.tray.on('click', () => {
      console.log('Tray clicked - showing menu');
      // On some platforms, left-click doesn't automatically show context menu
      if (process.platform !== 'darwin') {
        this.tray.popUpContextMenu();
      }
    });
    
    this.tray.on('right-click', () => {
      console.log('Tray right-clicked');
      this.tray.popUpContextMenu();
    });
  }

  setupMenu() {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '🧹 Clean Now',
        click: () => this.cleanNow()
      },
      {
        label: '👁️ Preview Clean',
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
    console.log('🔍 Previewing desktop organization...');
    
    try {
      const { DesktopOrganizer } = require('./core/organize/organizer');
      const organizer = new DesktopOrganizer();
      
      // Get files that would be organized (without actually moving them)
      const preview = await organizer.previewClean();
      
      this.showPreviewWindow(preview);
      
    } catch (error) {
      console.error('Preview failed:', error);
      this.tray.displayBalloon({
        title: 'TidyTop Error',
        content: 'Failed to preview organization. Check console for details.'
      });
    }
  }

  showPreviewWindow(preview) {
    if (this.previewWindow) {
      this.previewWindow.focus();
      return;
    }

    this.previewWindow = new BrowserWindow({
      width: 700,
      height: 500,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preview-preload.js')
      },
      resizable: true,
      title: 'TidyTop Preview - What will be organized',
      show: false
    });

    this.previewWindow.loadFile(path.join(__dirname, 'preview.html'));

    this.previewWindow.once('ready-to-show', () => {
      this.previewWindow.show();
      // Send preview data to window
      this.previewWindow.webContents.send('preview-data', preview);
    });

    this.previewWindow.on('closed', () => {
      this.previewWindow = null;
    });
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
    console.log('Design Mode - Coming in Tier 1.5!');
    
    // Show a nice preview of what's coming
    this.tray.displayBalloon({
      title: '🎨 Design Mode - Coming Soon!',
      content: 'Tier 1.5 will add playful desktop layouts: ❤️ Heart, ⭐️ Star, 🌀 Spiral, 🟦 Grid arrangements!'
    });
    
    // TODO: Implement in Tier 1.5:
    // - Heart, Star, Spiral, Grid layouts
    // - SVG shape coordinates → desktop grid mapping
    // - Emoji filler folders for empty spots
    // - Auto-exit after 10 minutes
    // - One-click return to organized state
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
        <div class="logo">🧹</div>
        <div class="title">TidyTop</div>
        <div class="version">Version 1.0.0</div>
        <div class="description">A playful yet powerful desktop cleaning assistant that makes organization delightful!</div>
        
        <div class="features">
            <div class="feature">🧹 One-click desktop organization</div>
            <div class="feature">📸 Smart screenshot handling</div>
            <div class="feature">✨ Auto-clean file watching</div>
            <div class="feature">🕒 Recent files (72h) access</div>
            <div class="feature">↩️ Complete undo system</div>
            <div class="feature">⚙️ Customizable settings</div>
        </div>
        
        <div class="footer">
            Desktop organization made delightful! ✨<br>
            Built with Electron & Node.js
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