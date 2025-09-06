# TidyTop User Guide

Welcome to TidyTop! This comprehensive guide will help you make the most of your desktop organization assistant.

## Table of Contents
1. [Getting Started](#getting-started)
2. [Core Features](#core-features)
3. [Customization](#customization)
4. [Tips & Best Practices](#tips--best-practices)
5. [Troubleshooting](#troubleshooting)
6. [Frequently Asked Questions](#frequently-asked-questions)

---

## Getting Started

### First Launch
When you first launch TidyTop, you'll see a welcome tutorial that walks you through the basics. This onboarding covers:
- How to find TidyTop in your menu bar
- What the different menu options do
- How file organization works
- The importance of using Preview first

### Finding TidyTop
After installation, TidyTop appears as a small folder icon in your menu bar (system tray). On macOS, this is typically in the top-right corner near your WiFi and battery indicators.

### Your First Organization
1. **Start with Preview**: Click the TidyTop menu bar icon → "👁️ Preview Clean"
2. **Review the preview**: See exactly what files will be moved and where
3. **Organize**: Click "🧹 Clean Now" when you're ready
4. **Undo if needed**: Use "↩️ Undo Last Clean" to restore files

---

## Core Features

### 🧹 Clean Now
Instantly organizes all files on your desktop into smart categories based on file type and your custom rules.

**How it works:**
- Scans all files on your desktop (folders are left untouched)
- Categorizes files by extension and smart rules
- Creates organized folders with date-based subfolders
- Moves files while preserving their original timestamps

### 👁️ Preview Clean
Shows you exactly what will happen before making any changes. This is the safest way to see TidyTop's organization plan.

**Preview window shows:**
- Total files to be organized
- Files grouped by category
- Which files go where
- Statistics about your desktop

### 🕒 Recent Files (72h)
Quick access to files that were recently organized or created. Helps you find files that were just moved.

### ↩️ Undo Last Clean
Completely reverses the last organization operation, restoring all files to their exact original locations.

**Important notes:**
- Only the most recent clean can be undone
- Undo data is stored in `~/.tidytop/moves.json`
- If you clean again, the previous undo data is overwritten

### ✨ Auto-Clean
Automatically organizes new files as they appear on your desktop. **Currently in development.**

### 🎨 Design Mode
Creates beautiful geometric layouts with your desktop files. **Currently in development.**

---

## Customization

### Category Management
Customize how TidyTop organizes your files:

1. **Access Settings**: Click TidyTop menu → "⚙️ Settings"
2. **Rename Categories**: Change category names to match your workflow
3. **Add New Categories**: Create custom categories with emoji icons
4. **Remove Categories**: Delete categories you don't need (core categories are protected)

**Default Categories:**
- 📸 Screenshots (with burst detection)
- 📄 PDFs 
- 🖼️ Images
- 📝 Documents
- 🎵 Audio
- 🎬 Video
- 📦 Archives
- 🗂️ Misc

### Smart Organization Rules
Create powerful rules based on file names:

**Rule Types:**
- **Contains**: Files with names containing specific text
- **Starts With**: Files with names beginning with specific text
- **File Extension**: Assign specific extensions to categories

**Example Rules:**
- Files containing "invoice" → Documents
- Files starting with "IMG_" → Images
- Files containing "receipt" → Documents
- Files starting with "Screen Shot" → Screenshots

### File Extension Mapping
Customize which file types go to which categories:
- Add new extensions (e.g., `.sketch` → Design)
- Reassign existing extensions
- Create specialized categories for your workflow

### Date Organization
Choose how date folders are created:
- **Month**: `2025-08/`
- **Day**: `2025-08-27/`
- **Year**: `2025/`

### Screenshot Settings
- **Today Folder**: Creates an alias for recent screenshots
- **Auto-Bundle**: Groups burst screenshots taken quickly together
- **Burst Detection**: Intelligent detection of screenshot sequences

---

## Tips & Best Practices

### 🏆 Pro Tips

**Always Preview First**
Use "Preview Clean" before organizing to avoid surprises. This shows you exactly what will happen without making changes.

**Start Small**
When first using TidyTop, try it with just a few test files to understand how it works.

**Regular Maintenance**
Clean your desktop weekly rather than letting files accumulate. This makes organization faster and more manageable.

**Customize First**
Set up your preferred categories and rules before your first major clean. This ensures files go where you expect them.

### 🎯 Organization Strategies

**Workflow-Based Categories**
Create categories that match your work:
- "Work Projects"
- "Personal Files"
- "Client Documents"
- "Design Assets"

**Date-Based Organization**
Use day-based folders for high-volume file types like screenshots, month-based for moderate volume like PDFs.

**Smart Rules for Efficiency**
Set up rules for common file patterns:
- Company documents (prefix/suffix patterns)
- Project files (folder naming conventions)
- Downloaded files (browser naming patterns)

### ⌨️ Keyboard Shortcuts
- **Onboarding Tutorial**: `→`/`←` navigate, `Esc` skips
- **Help Window**: `Esc` closes

---

## Troubleshooting

### Common Issues

**🔧 Files Not Organizing**
- **Cause**: Files may be locked or in use by other applications
- **Solution**: Close apps using the files, try again
- **Check**: Look for file locks in Activity Monitor

**🔧 Menu Bar Icon Missing**
- **Cause**: TidyTop may not be running
- **Solution**: Launch TidyTop from Applications folder
- **Check**: Look in Activity Monitor for "TidyTop" process

**🔧 Permission Errors**
- **Cause**: macOS security restrictions
- **Solution**: 
  1. System Preferences → Security & Privacy
  2. Privacy → Files and Folders
  3. Grant TidyTop desktop access

**🔧 Undo Not Working**
- **Cause**: Undo data may be corrupted or overwritten
- **Solution**: Check `~/.tidytop/moves.json` exists and is readable
- **Note**: Only the most recent clean can be undone

### Reset & Recovery

If TidyTop isn't working correctly:

1. **Reset Settings**: Settings → "Reset to Defaults"
2. **Restart App**: Quit from menu bar → relaunch
3. **Clear All Data**: Delete `~/.tidytop/` folder
4. **Reinstall**: Download fresh copy from website

### Performance Issues

**Large Desktop with Many Files**
- Use Preview first to see organization scope
- Consider organizing in batches
- Close other applications to free up resources

**Slow Organization**
- Check available disk space
- Close file-intensive applications
- Consider organizing smaller batches of files

---

## Frequently Asked Questions

### General Usage

**Q: Is it safe to organize my files?**
A: Yes! TidyTop only moves files to organized folders on your desktop. It never deletes files, and you can always undo any organization.

**Q: What happens if I accidentally organize the wrong files?**
A: Use "Undo Last Clean" to restore all files to their original locations. TidyTop keeps detailed logs for safe restoration.

**Q: Can I customize the categories?**
A: Absolutely! Rename existing categories, create new ones, and assign custom emojis. You can also create smart rules based on file names.

**Q: Does TidyTop work with folders?**
A: TidyTop focuses on organizing loose files. Existing folders are left untouched to preserve your organization.

### Technical Questions

**Q: Where are organized files stored?**
A: All files stay on your desktop in organized folders. For example: `Desktop/Screenshots/2025-08/` and `Desktop/PDFs/2025-08/`.

**Q: Can I run TidyTop automatically?**
A: TidyTop can launch at startup. Auto-clean (organizing files as they appear) is coming in a future update.

**Q: What data does TidyTop store?**
A: TidyTop stores configuration in `~/.tidytop/config.json` and move history in `~/.tidytop/moves.json` for undo functionality.

**Q: How does screenshot organization work?**
A: TidyTop detects screenshot bursts (multiple screenshots taken quickly) and bundles them. Recent screenshots get a "Today" folder for easy access.

### Customization Questions

**Q: Can I change where files go?**
A: Yes! In Settings, you can:
- Rename categories
- Create new categories  
- Set up smart rules based on file names
- Customize file extension mappings

**Q: What are smart rules?**
A: Rules that organize files based on their names. For example, files containing "invoice" can automatically go to a "Documents" folder.

**Q: Can I organize files into subfolders?**
A: TidyTop creates date-based subfolders (month/day/year) within each category. Custom subfolder creation is planned for future updates.

---

## Support & Resources

### Getting Help
- **In-App Help**: Menu bar icon → "❓ Help & Documentation"
- **This User Guide**: Comprehensive written reference
- **Onboarding Tutorial**: Interactive walkthrough for new users

### File Locations
- **Configuration**: `~/.tidytop/config.json`
- **Move History**: `~/.tidytop/moves.json`
- **Application**: `/Applications/TidyTop.app`

### Version Information
- **Current Version**: 1.0.0
- **Platform**: macOS, Windows, Linux (Electron-based)
- **Requirements**: Modern operating system with desktop environment

---

*Last updated: August 2025*
*TidyTop - Desktop organization made delightful! ✨*