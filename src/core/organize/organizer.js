const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { format, subDays, isAfter } = require('date-fns');

class DesktopOrganizer {
  constructor() {
    this.config = require('../../../config/default.json');
    this.desktopPath = path.join(os.homedir(), 'Desktop');
    this.moveLog = [];
    this.smartSearch = null;
  }

  async cleanDesktop() {
    console.log('🧹 Starting desktop organization...');
    
    try {
      const files = await this.getDesktopFiles();
      const results = {
        movedCount: 0,
        skippedCount: 0,
        errors: []
      };

      for (const file of files) {
        try {
          const moved = await this.organizeFile(file);
          if (moved) {
            results.movedCount++;
          } else {
            results.skippedCount++;
          }
        } catch (error) {
          console.error(`Error organizing ${file.name}:`, error);
          results.errors.push({ file: file.name, error: error.message });
        }
      }

      // Save move log
      await this.saveMoveLog();
      
      // Index organized files for Smart Find
      await this.indexOrganizedFiles();
      
      return results;
    } catch (error) {
      console.error('Desktop clean failed:', error);
      throw error;
    }
  }

  async getDesktopFiles() {
    const entries = await fs.readdir(this.desktopPath, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
      // Skip hidden files and system files
      if (entry.name.startsWith('.')) {
        continue;
      }

      // Skip already organized folders (don't reorganize our own work)
      if (entry.isDirectory() && this.isOrganizedFolder(entry.name)) {
        continue;
      }

      // Skip mounted drives and special system folders
      if (entry.isDirectory() && this.isSystemFolder(entry.name)) {
        continue;
      }

      const filePath = path.join(this.desktopPath, entry.name);
      const stats = await fs.stat(filePath);
      
      files.push({
        name: entry.name,
        path: filePath,
        ext: entry.isFile() ? path.extname(entry.name).toLowerCase().slice(1) : '',
        isDirectory: entry.isDirectory(),
        stats: stats,
        created: stats.birthtime,
        modified: stats.mtime
      });
    }

    return files;
  }

  isOrganizedFolder(folderName) {
    // Skip folders we've already created for organization
    const organizedFolders = [
      'Screenshots', 'Images', 'PDFs', 'Docs', 'Slides', 'Sheets', 
      'Archives', 'Video', 'Audio', 'Apps', 'Misc'
    ];
    
    if (organizedFolders.includes(folderName)) {
      return true;
    }

    // Skip Recent and Today folders
    if (folderName.startsWith('🕒 Recent') || folderName.startsWith('📸 Today')) {
      return true;
    }

    return false;
  }

  isSystemFolder(folderName) {
    // Common mounted drive patterns and system folders to skip
    const systemPatterns = [
      'Trash', '.Trash', 'Network Trash Folder',
      'Temporary Items', '.TemporaryItems',
      'TheFindByContentFolder', '.fseventsd'
    ];

    // Check for exact matches
    if (systemPatterns.includes(folderName)) {
      return true;
    }

    // Check for mounted drives (usually all caps or specific patterns)
    if (/^[A-Z][A-Z0-9_\-\s]*$/.test(folderName) && folderName.length < 20) {
      // Likely a mounted drive
      return true;
    }

    return false;
  }

  /**
   * Determine the category for a file based on its extension and name
   */
  determineCategory(file) {
    // Check for screenshots first
    if (this.isScreenshot(file)) {
      return 'Screenshots';
    }

    // Get file extension
    const ext = file.ext ? file.ext.toLowerCase().replace('.', '') : '';
    
    // Look up category by extension in config
    if (this.config.extensions && this.config.extensions[ext]) {
      return this.config.extensions[ext];
    }

    // Default to Misc for unknown types
    return 'Misc';
  }

  /**
   * Check if a file is a screenshot based on its name
   */
  isScreenshot(file) {
    const screenshotPatterns = [
      /^Screenshot/i,
      /^Screen Shot/i,
      /^CleanShot/i,
      /^scr_/i,
      /screenshot/i
    ];
    
    return screenshotPatterns.some(pattern => pattern.test(file.name));
  }

  async organizeFile(file) {
    // Handle directories differently
    if (file.isDirectory) {
      return await this.organizeDirectory(file);
    }

    const category = this.determineCategory(file);
    if (!category) {
      return false; // Skip unknown file types
    }

    const destinationFolder = await this.ensureCategoryFolder(category);
    const dateFolder = await this.ensureDateFolder(destinationFolder, file.created);
    
    // Handle special cases
    if (this.isScreenshot(file)) {
      return await this.organizeScreenshot(file, category);
    }

    // Standard file organization
    const finalPath = await this.findAvailablePath(dateFolder, file.name);
    
    await this.moveFile(file.path, finalPath);
    this.logMove(file.path, finalPath);
    
    return true;
  }

  async organizeDirectory(file) {
    // For now, we'll organize user folders into a special "Folders" category
    // This can be made configurable later
    
    // Check if this is a project folder or document folder
    const category = this.determineFolderCategory(file);
    if (!category) {
      return false; // Skip organizing this folder
    }

    const destinationFolder = await this.ensureCategoryFolder(category);
    const dateFolder = await this.ensureDateFolder(destinationFolder, file.created);
    
    const finalPath = await this.findAvailablePath(dateFolder, file.name);
    
    await this.moveFile(file.path, finalPath);
    this.logMove(file.path, finalPath);
    
    return true;
  }

  determineFolderCategory(file) {
    const folderName = file.name.toLowerCase();
    
    // Check for common project folder patterns
    if (folderName.includes('project') || 
        folderName.includes('code') || 
        folderName.includes('dev') ||
        folderName.includes('repo') ||
        folderName.includes('git')) {
      return 'Projects';
    }

    // Check for document folders
    if (folderName.includes('document') || 
        folderName.includes('paper') || 
        folderName.includes('report')) {
      return 'Docs';
    }

    // For now, put other folders in Misc
    // Users can configure this behavior later
    return 'Misc';
  }

  determineCategory(file) {
    const ext = file.ext;
    
    // Check pinned rules first
    for (const rule of this.config.pinnedRules) {
      if (rule.contains && rule.contains.some(term => 
        file.name.toLowerCase().includes(term.toLowerCase()))) {
        return rule.dest;
      }
      if (rule.prefix && rule.prefix.some(prefix => 
        file.name.startsWith(prefix))) {
        return rule.dest;
      }
    }

    // Check extensions
    if (this.config.extensions[ext]) {
      return this.config.extensions[ext];
    }

    return 'Misc';
  }

  async ensureCategoryFolder(category) {
    const categoryPath = path.join(this.desktopPath, category);
    
    try {
      await fs.access(categoryPath);
    } catch (error) {
      await fs.mkdir(categoryPath, { recursive: true });
      console.log(`Created category folder: ${category}`);
    }
    
    return categoryPath;
  }

  async ensureDateFolder(categoryPath, fileDate) {
    let dateFolderName;
    
    switch (this.config.dateFolders) {
      case 'day':
        dateFolderName = format(fileDate, 'yyyy-MM-dd');
        break;
      case 'year':
        dateFolderName = format(fileDate, 'yyyy');
        break;
      case 'month':
      default:
        dateFolderName = format(fileDate, 'yyyy-MM');
        break;
    }

    const dateFolderPath = path.join(categoryPath, dateFolderName);
    
    try {
      await fs.access(dateFolderPath);
    } catch (error) {
      await fs.mkdir(dateFolderPath, { recursive: true });
    }
    
    return dateFolderPath;
  }

  isScreenshot(file) {
    const name = file.name.toLowerCase();
    return (
      name.includes('screenshot') || 
      name.includes('screen shot') ||
      name.startsWith('scr ') ||
      (name.startsWith('screen') && ['png', 'jpg', 'jpeg'].includes(file.ext))
    );
  }

  async organizeScreenshot(file, category) {
    // Create Screenshots folder
    const screenshotsPath = await this.ensureCategoryFolder('Screenshots');
    
    // Handle Today alias for recent screenshots
    if (this.config.screenshotTodayAlias) {
      const oneDayAgo = subDays(new Date(), 1);
      
      if (isAfter(file.created, oneDayAgo)) {
        // Create Today alias/symlink
        const todayPath = path.join(this.desktopPath, '📸 Today');
        await this.ensureFolder(todayPath);
        
        const finalPath = await this.findAvailablePath(todayPath, file.name);
        await this.moveFile(file.path, finalPath);
        this.logMove(file.path, finalPath);
        
        return true;
      }
    }

    // Regular screenshot organization with burst detection
    const dateFolder = await this.ensureDateFolder(screenshotsPath, file.created);
    
    // Check for burst screenshots (multiple screenshots within 3 minutes)
    if (this.config.autoBundle) {
      const burstFolder = await this.detectAndHandleBurst(file, dateFolder);
      if (burstFolder) {
        const finalPath = await this.findAvailablePath(burstFolder, file.name);
        await this.moveFile(file.path, finalPath);
        this.logMove(file.path, finalPath);
        return true;
      }
    }
    
    // Standard screenshot organization
    const finalPath = await this.findAvailablePath(dateFolder, file.name);
    await this.moveFile(file.path, finalPath);
    this.logMove(file.path, finalPath);
    
    return true;
  }

  async detectAndHandleBurst(currentFile, dateFolder) {
    try {
      const files = await fs.readdir(dateFolder, { withFileTypes: true });
      const screenshots = [];
      
      // Find other screenshots in the same date folder
      for (const entry of files) {
        if (entry.isFile()) {
          const filePath = path.join(dateFolder, entry.name);
          const stats = await fs.stat(filePath);
          
          if (this.isScreenshotByName(entry.name)) {
            screenshots.push({
              name: entry.name,
              path: filePath,
              created: stats.birthtime
            });
          }
        }
      }
      
      // Check if current screenshot is part of a burst (within 3 minutes of others)
      const burstThreshold = 3 * 60 * 1000; // 3 minutes in milliseconds
      const relatedScreenshots = screenshots.filter(screenshot => {
        const timeDiff = Math.abs(currentFile.created.getTime() - screenshot.created.getTime());
        return timeDiff <= burstThreshold;
      });
      
      if (relatedScreenshots.length > 0) {
        // Create burst folder
        const burstFolderName = `Screenshots Burst (${relatedScreenshots.length + 1})`;
        const burstFolderPath = path.join(dateFolder, burstFolderName);
        
        try {
          await fs.access(burstFolderPath);
        } catch (error) {
          await fs.mkdir(burstFolderPath, { recursive: true });
          
          // Move existing related screenshots to burst folder
          for (const screenshot of relatedScreenshots) {
            const newPath = path.join(burstFolderPath, screenshot.name);
            await fs.rename(screenshot.path, newPath);
            this.logMove(screenshot.path, newPath);
          }
          
          console.log(`📦 Created burst folder with ${relatedScreenshots.length + 1} screenshots`);
        }
        
        return burstFolderPath;
      }
      
      return null; // No burst detected
    } catch (error) {
      console.error('Error in burst detection:', error);
      return null;
    }
  }

  isScreenshotByName(filename) {
    const name = filename.toLowerCase();
    return (
      name.includes('screenshot') || 
      name.includes('screen shot') ||
      name.startsWith('scr ') ||
      (name.startsWith('screen') && ['png', 'jpg', 'jpeg'].includes(
        path.extname(name).toLowerCase().slice(1)
      ))
    );
  }

  async ensureFolder(folderPath) {
    try {
      await fs.access(folderPath);
    } catch (error) {
      await fs.mkdir(folderPath, { recursive: true });
    }
  }

  async findAvailablePath(dir, filename) {
    const basePath = path.join(dir, filename);
    
    try {
      await fs.access(basePath);
      // File exists, need to find alternative
      const ext = path.extname(filename);
      const name = path.basename(filename, ext);
      let counter = 2;
      
      while (true) {
        const newPath = path.join(dir, `${name} (${counter})${ext}`);
        try {
          await fs.access(newPath);
          counter++;
        } catch (error) {
          return newPath;
        }
      }
    } catch (error) {
      // File doesn't exist, path is available
      return basePath;
    }
  }

  async moveFile(sourcePath, destPath) {
    await fs.rename(sourcePath, destPath);
    console.log(`Moved: ${path.basename(sourcePath)} → ${destPath}`);
  }

  logMove(from, to) {
    this.moveLog.push({
      from,
      to,
      timestamp: new Date().toISOString()
    });
  }

  async saveMoveLog() {
    const logPath = path.join(__dirname, '../../../data/move-log.json');
    
    try {
      let existingLog = [];
      try {
        const logContent = await fs.readFile(logPath, 'utf8');
        existingLog = JSON.parse(logContent);
      } catch (error) {
        // File doesn't exist yet, start fresh
      }
      
      const combinedLog = [...existingLog, ...this.moveLog];
      await fs.writeFile(logPath, JSON.stringify(combinedLog, null, 2));
    } catch (error) {
      console.error('Failed to save move log:', error);
    }
  }

  async previewClean() {
    console.log('🔍 Analyzing desktop files for preview...');
    
    try {
      const files = await this.getDesktopFiles();
      const preview = {
        totalFiles: files.length,
        willOrganize: [],
        willSkip: [],
        categories: {}
      };

      for (const file of files) {
        try {
          // Simulate organization without actually moving files
          if (file.isDirectory) {
            const category = this.determineFolderCategory(file);
            if (category) {
              preview.willOrganize.push({
                name: file.name,
                currentPath: file.path,
                destinationCategory: category,
                type: 'folder',
                size: file.stats.size,
                created: file.created
              });
              
              if (!preview.categories[category]) {
                preview.categories[category] = [];
              }
              preview.categories[category].push(file.name);
            } else {
              preview.willSkip.push({
                name: file.name,
                reason: 'System or organized folder',
                type: 'folder'
              });
            }
          } else {
            const category = this.determineCategory(file);
            if (category) {
              preview.willOrganize.push({
                name: file.name,
                currentPath: file.path,
                destinationCategory: category,
                type: 'file',
                size: file.stats.size,
                created: file.created,
                isScreenshot: this.isScreenshot(file)
              });
              
              if (!preview.categories[category]) {
                preview.categories[category] = [];
              }
              preview.categories[category].push(file.name);
            } else {
              preview.willSkip.push({
                name: file.name,
                reason: 'Unknown file type',
                type: 'file'
              });
            }
          }
        } catch (error) {
          console.error(`Error previewing ${file.name}:`, error);
          preview.willSkip.push({
            name: file.name,
            reason: 'Error analyzing file',
            type: file.isDirectory ? 'folder' : 'file'
          });
        }
      }

      // Add summary statistics
      preview.stats = {
        totalFiles: files.length,
        willOrganizeCount: preview.willOrganize.length,
        willSkipCount: preview.willSkip.length,
        categoriesCount: Object.keys(preview.categories).length
      };

      return preview;
    } catch (error) {
      console.error('Preview analysis failed:', error);
      throw error;
    }
  }

  /**
   * Index recently organized files for Smart Find
   */
  async indexOrganizedFiles() {
    try {
      if (!this.smartSearch) {
        const { SmartSearch } = require('../index/search');
        this.smartSearch = new SmartSearch();
        await this.smartSearch.initialize();
      }

      // Index each file that was moved in this session
      for (const move of this.moveLog) {
        try {
          const stats = await fs.stat(move.newPath);
          const extension = path.extname(move.fileName).toLowerCase().substring(1);
          
          await this.smartSearch.indexFile({
            filename: move.fileName,
            originalPath: move.originalPath,
            currentPath: move.newPath,
            category: move.category,
            extension,
            size: stats.size,
            dateCreated: stats.birthtime.toISOString(),
            dateModified: stats.mtime.toISOString(),
            isFolder: false
          });
        } catch (error) {
          console.error(`Failed to index ${move.fileName}:`, error.message);
        }
      }

      await this.smartSearch.close();
      this.smartSearch = null;

      if (this.moveLog.length > 0) {
        console.log(`📚 Indexed ${this.moveLog.length} files for Smart Find`);
      }
    } catch (error) {
      console.error('Failed to index files for Smart Find:', error);
    }
  }

  /**
   * Organize desktop files with user-approved custom folder names
   * Used by the preview-and-approve workflow
   */
  async organizeWithCustomNames(analysisResult) {
    console.log('🧹 Starting organization with custom folder names...');
    
    try {
      const results = {
        movedCount: 0,
        skippedCount: 0,
        errors: [],
        foldersCreated: []
      };

      // Process each category with its custom folder name
      for (const [category, files] of Object.entries(analysisResult.categories)) {
        if (files.length === 0) continue;
        
        const customFolderName = analysisResult.folderNames[category] || category;
        const categoryPath = path.join(this.desktopPath, customFolderName);
        
        // Ensure the custom category folder exists
        await this.ensureFolder(categoryPath);
        if (!results.foldersCreated.includes(customFolderName)) {
          results.foldersCreated.push(customFolderName);
        }
        
        // Move files to the custom folder
        for (const fileInfo of files) {
          try {
            // Load full file info
            const fullFile = {
              name: fileInfo.name,
              fullPath: fileInfo.path,
              ext: path.extname(fileInfo.name).toLowerCase()
            };
            
            const destPath = path.join(categoryPath, fileInfo.name);
            const finalPath = await this.findAvailablePath(categoryPath, fileInfo.name);
            
            await this.moveFile(fileInfo.path, finalPath);
            
            // Log the move
            this.moveLog.push({
              fileName: fileInfo.name,
              originalPath: fileInfo.path,
              newPath: finalPath,
              category: customFolderName,
              movedAt: new Date().toISOString()
            });
            
            results.movedCount++;
          } catch (error) {
            console.error(`Error organizing ${fileInfo.name}:`, error);
            results.errors.push({ file: fileInfo.name, error: error.message });
            results.skippedCount++;
          }
        }
      }

      // Save move log
      await this.saveMoveLog();
      
      // Skip indexing for Smart Find due to SQLite crashes
      // await this.indexOrganizedFiles();
      
      console.log(`✅ Organized ${results.movedCount} files into ${results.foldersCreated.length} folders`);
      return results;
      
    } catch (error) {
      console.error('Organization with custom names failed:', error);
      throw error;
    }
  }
}

module.exports = { DesktopOrganizer };