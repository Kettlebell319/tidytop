const chokidar = require('chokidar');
const path = require('path');
const os = require('os');
const { DesktopOrganizer } = require('./organizer');

/**
 * Auto-Clean - Real-time desktop file organization
 * Watches for new files and automatically organizes them
 */
class AutoClean {
  constructor() {
    this.desktopPath = path.join(os.homedir(), 'Desktop');
    this.watcher = null;
    this.organizer = new DesktopOrganizer();
    this.isEnabled = false;
    this.processingFiles = new Set(); // Prevent duplicate processing
    this.ignorePatterns = [
      '**/.DS_Store',
      '**/Thumbs.db',
      '**/desktop.ini',
      '**/.tidytop*',
      '**/Screenshots/**', // Don't re-organize already organized files
      '**/Images/**',
      '**/PDFs/**',
      '**/Docs/**',
      '**/Slides/**',
      '**/Sheets/**',
      '**/Archives/**',
      '**/Video/**',
      '**/Audio/**',
      '**/Apps/**',
      '**/Misc/**',
      '**/📸 Today/**',
      '**/🕒 Recent (72h)/**'
    ];
  }

  /**
   * Start auto-clean file watching
   */
  async start() {
    if (this.isEnabled) {
      console.log('⚡ Auto-Clean already running');
      return;
    }

    try {
      console.log('⚡ Starting Auto-Clean file watching...');
      
      this.watcher = chokidar.watch(this.desktopPath, {
        ignored: this.ignorePatterns,
        ignoreInitial: true, // Don't process existing files
        persistent: true,
        depth: 0, // Only watch direct desktop files, not subdirectories
        awaitWriteFinish: {
          stabilityThreshold: 2000, // Wait 2 seconds for file to stabilize
          pollInterval: 100
        }
      });

      // Handle new files being added
      this.watcher.on('add', async (filePath) => {
        await this.handleNewFile(filePath, 'added');
      });

      // Handle files being moved to desktop
      this.watcher.on('change', async (filePath) => {
        // Only organize if this is truly a new file (not being modified)
        const stats = await this.getFileStats(filePath);
        if (stats && this.isRecentFile(stats.birthtime)) {
          await this.handleNewFile(filePath, 'changed');
        }
      });

      this.watcher.on('ready', () => {
        this.isEnabled = true;
        console.log('⚡ Auto-Clean is now watching for new desktop files');
      });

      this.watcher.on('error', (error) => {
        console.error('Auto-Clean watcher error:', error);
      });

    } catch (error) {
      console.error('Failed to start Auto-Clean:', error);
      throw error;
    }
  }

  /**
   * Stop auto-clean file watching
   */
  async stop() {
    if (!this.isEnabled) {
      console.log('⚡ Auto-Clean already stopped');
      return;
    }

    try {
      console.log('⚡ Stopping Auto-Clean...');
      
      if (this.watcher) {
        await this.watcher.close();
        this.watcher = null;
      }
      
      this.isEnabled = false;
      this.processingFiles.clear();
      
      console.log('⚡ Auto-Clean stopped');
    } catch (error) {
      console.error('Failed to stop Auto-Clean:', error);
    }
  }

  /**
   * Handle new file detected on desktop
   */
  async handleNewFile(filePath, eventType) {
    const fileName = path.basename(filePath);
    
    // Prevent duplicate processing
    if (this.processingFiles.has(filePath)) {
      return;
    }
    
    try {
      this.processingFiles.add(filePath);
      
      console.log(`⚡ Auto-Clean detected: ${fileName} (${eventType})`);
      
      // Small delay to ensure file is fully written
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if file still exists and is accessible
      const stats = await this.getFileStats(filePath);
      if (!stats) {
        console.log(`  Skipped: ${fileName} (file not accessible)`);
        return;
      }
      
      // Skip if it's a folder (Auto-Clean only handles files for safety)
      if (stats.isDirectory()) {
        console.log(`  Skipped: ${fileName} (is folder)`);
        return;
      }
      
      // Skip if file is too large (>100MB) - might be transfer in progress
      if (stats.size > 100 * 1024 * 1024) {
        console.log(`  Skipped: ${fileName} (too large: ${Math.round(stats.size / 1024 / 1024)}MB)`);
        return;
      }
      
      // Organize the file
      const fileInfo = {
        name: fileName,
        path: filePath,
        stats: stats,
        created: stats.birthtime,
        isDirectory: false
      };
      
      const category = this.organizer.determineCategory(fileInfo);
      if (category) {
        // Use the organizer to handle the file
        this.organizer.moveLog = []; // Reset move log for this file
        const organized = await this.organizer.organizeFile(fileInfo);
        
        if (organized) {
          console.log(`  ✅ Auto-organized: ${fileName} → ${category}`);
          
          // Save move log for undo functionality
          await this.organizer.saveMoveLog();
          
          // Index for Smart Find
          await this.organizer.indexOrganizedFiles();
        }
      } else {
        console.log(`  Skipped: ${fileName} (unknown category)`);
      }
      
    } catch (error) {
      console.error(`Failed to auto-organize ${fileName}:`, error.message);
    } finally {
      this.processingFiles.delete(filePath);
    }
  }

  /**
   * Get file stats safely
   */
  async getFileStats(filePath) {
    try {
      const fs = require('fs').promises;
      return await fs.stat(filePath);
    } catch (error) {
      return null; // File not accessible or doesn't exist
    }
  }

  /**
   * Check if file was created recently (within last 5 minutes)
   */
  isRecentFile(birthtime) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return birthtime > fiveMinutesAgo;
  }

  /**
   * Get current auto-clean status
   */
  getStatus() {
    return {
      enabled: this.isEnabled,
      watching: this.watcher !== null,
      processingCount: this.processingFiles.size,
      watchedPath: this.desktopPath
    };
  }

  /**
   * Get auto-clean statistics
   */
  async getStats() {
    const status = this.getStatus();
    
    return {
      ...status,
      ignorePatterns: this.ignorePatterns.length,
      lastActivity: this.watcher ? 'Active' : 'Inactive'
    };
  }
}

module.exports = { AutoClean };