#!/usr/bin/env node

// TidyTop Demo Script
// This script demonstrates all the features of TidyTop

const { DesktopOrganizer } = require('./src/core/organize/organizer');
const { UndoManager } = require('./src/core/organize/undo');
const { RecentManager } = require('./src/core/organize/recent');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class TidyTopDemo {
  constructor() {
    this.desktopPath = path.join(os.homedir(), 'Desktop');
  }

  async run() {
    console.log('🎉 Welcome to TidyTop Demo!');
    console.log('This demo will show you all the features of TidyTop.\n');

    await this.showCurrentDesktop();
    await this.pause();

    await this.demonstrateCleanNow();
    await this.pause();

    await this.demonstrateRecentFiles();
    await this.pause();

    await this.demonstrateUndo();
    await this.pause();

    console.log('🎉 Demo complete! TidyTop is ready to keep your desktop organized!');
    console.log('\n📋 Summary of features demonstrated:');
    console.log('   🧹 Clean Now - Automatically organize all desktop files');
    console.log('   📸 Screenshot handling - Smart bundling and Today folder');
    console.log('   🕒 Recent files - Quick access to recently organized files');
    console.log('   ↩️  Undo - Safely restore files to original locations');
    console.log('   ⚙️  Configurable - JSON-based rules and categories');
    console.log('\n🚀 To run TidyTop: npm start');
    console.log('📖 To read more: check README.md');
  }

  async showCurrentDesktop() {
    console.log('📋 Current Desktop Contents:');
    try {
      const entries = await fs.readdir(this.desktopPath, { withFileTypes: true });
      
      const files = entries.filter(e => e.isFile() && !e.name.startsWith('.'));
      const folders = entries.filter(e => e.isDirectory() && !e.name.startsWith('.'));
      
      console.log(`   📄 Files: ${files.length}`);
      files.slice(0, 5).forEach(file => {
        console.log(`      • ${file.name}`);
      });
      if (files.length > 5) {
        console.log(`      ... and ${files.length - 5} more files`);
      }

      console.log(`   📁 Folders: ${folders.length}`);
      folders.slice(0, 5).forEach(folder => {
        console.log(`      • ${folder.name}`);
      });
      if (folders.length > 5) {
        console.log(`      ... and ${folders.length - 5} more folders`);
      }
    } catch (error) {
      console.log('   Could not read desktop contents');
    }
    console.log('');
  }

  async demonstrateCleanNow() {
    console.log('🧹 Demonstrating "Clean Now" feature...');
    
    const organizer = new DesktopOrganizer();
    
    try {
      const results = await organizer.cleanDesktop();
      
      console.log('✅ Organization Complete!');
      console.log(`   📁 Files organized: ${results.movedCount}`);
      console.log(`   ⏭️  Files skipped: ${results.skippedCount}`);
      
      if (results.errors.length > 0) {
        console.log(`   ❌ Errors: ${results.errors.length}`);
      }

      // Show organized structure
      console.log('\n📂 New Desktop Structure:');
      const entries = await fs.readdir(this.desktopPath, { withFileTypes: true });
      const organizedFolders = entries
        .filter(e => e.isDirectory() && !e.name.startsWith('.'))
        .filter(e => ['Screenshots', 'Images', 'PDFs', 'Docs', 'Slides', 'Sheets', 'Archives', 'Video', 'Audio', 'Apps', 'Projects', 'Misc'].includes(e.name));
      
      for (const folder of organizedFolders) {
        try {
          const folderPath = path.join(this.desktopPath, folder.name);
          const folderContents = await fs.readdir(folderPath, { withFileTypes: true });
          const fileCount = folderContents.filter(e => e.isFile()).length;
          const subfolderCount = folderContents.filter(e => e.isDirectory()).length;
          
          console.log(`   📁 ${folder.name}: ${fileCount} files, ${subfolderCount} subfolders`);
        } catch (error) {
          console.log(`   📁 ${folder.name}: (could not read contents)`);
        }
      }
      
    } catch (error) {
      console.log('❌ Clean operation failed:', error.message);
    }
    console.log('');
  }

  async demonstrateRecentFiles() {
    console.log('🕒 Demonstrating "Recent Files" feature...');
    
    const recentManager = new RecentManager();
    
    try {
      const result = await recentManager.createRecentFolder();
      console.log('✅ Recent folder created!');
      console.log(`   📁 Location: ${result.folderPath}`);
      console.log(`   📄 Recent files found: ${result.fileCount}`);
      
      if (result.fileCount > 0) {
        console.log('   💡 The Recent folder contains links to files organized in the last 72 hours');
      } else {
        console.log('   💡 No recent files found (files may be older than 72 hours)');
      }
    } catch (error) {
      console.log('❌ Recent files feature failed:', error.message);
    }
    console.log('');
  }

  async demonstrateUndo() {
    console.log('↩️  Demonstrating "Undo" feature...');
    
    const undoManager = new UndoManager();
    
    try {
      const result = await undoManager.undoLastClean();
      console.log('✅ Undo operation complete!');
      console.log(`   📁 Files restored: ${result.undoCount}`);
      
      if (result.errors.length > 0) {
        console.log(`   ❌ Errors during undo: ${result.errors.length}`);
      } else {
        console.log('   🎉 All files successfully restored to desktop!');
      }
    } catch (error) {
      console.log('❌ Undo operation failed:', error.message);
    }
    console.log('');
  }

  async pause() {
    console.log('⏳ Press Enter to continue...');
    return new Promise(resolve => {
      process.stdin.once('data', () => {
        resolve();
      });
    });
  }
}

// Run the demo if this script is executed directly
if (require.main === module) {
  const demo = new TidyTopDemo();
  demo.run().catch(console.error);
}

module.exports = { TidyTopDemo };