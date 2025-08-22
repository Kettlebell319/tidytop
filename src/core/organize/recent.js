const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { subHours, isAfter } = require('date-fns');

class RecentManager {
  constructor() {
    this.desktopPath = path.join(os.homedir(), 'Desktop');
    this.recentFolderName = '🕒 Recent (72h)';
    this.recentFolderPath = path.join(this.desktopPath, this.recentFolderName);
  }

  async createRecentFolder() {
    console.log('📁 Creating Recent (72h) folder...');
    
    try {
      // Create the Recent folder if it doesn't exist
      await this.ensureFolder(this.recentFolderPath);
      
      // Find all recently organized files (within 72 hours)
      const recentFiles = await this.findRecentFiles();
      
      // Create symlinks/aliases to recent files
      await this.createRecentLinks(recentFiles);
      
      // Open the Recent folder
      await this.openFolder(this.recentFolderPath);
      
      return {
        folderPath: this.recentFolderPath,
        fileCount: recentFiles.length
      };
    } catch (error) {
      console.error('Failed to create Recent folder:', error);
      throw error;
    }
  }

  async findRecentFiles() {
    const hoursAgo72 = subHours(new Date(), 72);
    const recentFiles = [];
    
    // Search through organized folders for recent files
    const categories = await this.getOrganizedCategories();
    
    for (const category of categories) {
      const categoryPath = path.join(this.desktopPath, category);
      
      try {
        const files = await this.findFilesInCategory(categoryPath, hoursAgo72);
        recentFiles.push(...files);
      } catch (error) {
        console.error(`Error scanning category ${category}:`, error);
      }
    }
    
    // Sort by modification time (most recent first)
    recentFiles.sort((a, b) => b.modified.getTime() - a.modified.getTime());
    
    return recentFiles;
  }

  async getOrganizedCategories() {
    const categories = [];
    const entries = await fs.readdir(this.desktopPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory() && 
          !entry.name.startsWith('.') && 
          !entry.name.startsWith('🕒') && // Skip existing Recent folders
          !entry.name.startsWith('📸') && // Skip Today folders
          entry.name !== 'Trash') {
        categories.push(entry.name);
      }
    }
    
    return categories;
  }

  async findFilesInCategory(categoryPath, cutoffDate) {
    const files = [];
    
    try {
      const entries = await fs.readdir(categoryPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(categoryPath, entry.name);
        
        if (entry.isDirectory()) {
          // Recursively search subdirectories (date folders, burst folders, etc.)
          const subFiles = await this.findFilesInCategory(fullPath, cutoffDate);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          const stats = await fs.stat(fullPath);
          
          // Include files modified within the last 72 hours
          if (isAfter(stats.mtime, cutoffDate)) {
            files.push({
              name: entry.name,
              path: fullPath,
              category: path.basename(categoryPath),
              modified: stats.mtime,
              size: stats.size
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${categoryPath}:`, error);
    }
    
    return files;
  }

  async createRecentLinks(recentFiles) {
    // Clear existing links
    await this.clearRecentFolder();
    
    for (const file of recentFiles) {
      try {
        const linkName = `${file.category} - ${file.name}`;
        const linkPath = path.join(this.recentFolderPath, linkName);
        
        // Create symlink (works on macOS and Linux)
        await fs.symlink(file.path, linkPath);
      } catch (error) {
        console.error(`Failed to create link for ${file.name}:`, error);
        
        // Fallback: create a text file with the path (for Windows compatibility)
        try {
          const linkName = `${file.category} - ${file.name}.lnk.txt`;
          const linkPath = path.join(this.recentFolderPath, linkName);
          const linkContent = `TidyTop Link\nOriginal File: ${file.path}\nCategory: ${file.category}\nModified: ${file.modified.toISOString()}`;
          
          await fs.writeFile(linkPath, linkContent);
        } catch (fallbackError) {
          console.error(`Fallback link creation failed for ${file.name}:`, fallbackError);
        }
      }
    }
  }

  async clearRecentFolder() {
    try {
      const entries = await fs.readdir(this.recentFolderPath);
      
      for (const entry of entries) {
        const fullPath = path.join(this.recentFolderPath, entry);
        
        try {
          const stats = await fs.lstat(fullPath);
          if (stats.isSymbolicLink() || entry.endsWith('.lnk.txt')) {
            await fs.unlink(fullPath);
          }
        } catch (error) {
          console.error(`Failed to remove ${entry}:`, error);
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Failed to clear Recent folder:', error);
      }
    }
  }

  async ensureFolder(folderPath) {
    try {
      await fs.access(folderPath);
    } catch (error) {
      await fs.mkdir(folderPath, { recursive: true });
    }
  }

  async openFolder(folderPath) {
    const { exec } = require('child_process');
    
    try {
      if (process.platform === 'darwin') {
        exec(`open "${folderPath}"`);
      } else if (process.platform === 'win32') {
        exec(`explorer "${folderPath}"`);
      } else {
        exec(`xdg-open "${folderPath}"`);
      }
    } catch (error) {
      console.error('Failed to open Recent folder:', error);
    }
  }

  async refreshRecentFolder() {
    if (await this.recentFolderExists()) {
      return await this.createRecentFolder();
    }
    return null;
  }

  async recentFolderExists() {
    try {
      await fs.access(this.recentFolderPath);
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = { RecentManager };