# TidyTop 🧹

A playful yet powerful desktop cleaning assistant that runs in your menu bar/system tray. TidyTop automatically organizes your desktop files into intuitive category folders while adding delightful features like screenshot burst detection and recent file access.

## 🎯 Core Features

- **🧹 Clean Now**: One-click desktop organization
- **✨ Auto-Clean**: Continuous background monitoring (coming soon)
- **🕒 Recent (72h)**: Quick access to recently organized files
- **↩️ Undo**: Safely restore files to their original locations
- **📸 Smart Screenshots**: Special handling with Today folder and burst detection
- **⚙️ Configurable**: JSON-based rules for custom organization

## 🚀 Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run TidyTop**:
   ```bash
   npm start
   ```

3. **Look for the TidyTop icon in your menu bar** and click it to access the menu

## 📁 How It Works

TidyTop organizes your desktop files into category folders:

- **📸 Screenshots** - All screenshot files with burst detection
- **🖼️ Images** - Photos and image files
- **📄 PDFs** - PDF documents
- **📝 Docs** - Word docs, text files, markdown
- **📊 Slides** - PowerPoint, Keynote presentations
- **📈 Sheets** - Spreadsheets and CSV files
- **📦 Archives** - ZIP, RAR, compressed files
- **🎥 Video** - Movie and video files
- **🎵 Audio** - Music and audio files
- **📱 Apps** - Application installers
- **📁 Misc** - Everything else

### 🗓️ Date Organization

Files within each category are organized into date-based subfolders:
- **Month** (default): `2025-08`
- **Day**: `2025-08-20`
- **Year**: `2025`

### 📸 Screenshot Features

- **Today Folder**: Recent screenshots (< 24h) appear in a special "📸 Today" folder
- **Burst Detection**: Multiple screenshots taken within 3 minutes are grouped together
- **Auto-filing**: Screenshots older than 24 hours are automatically moved to monthly folders

### 🕒 Recent Files

The "Recent (72h)" feature creates a convenient folder with links to all files that were organized within the past 72 hours, making it easy to find recently moved files.

## ⚙️ Configuration

TidyTop uses a JSON configuration file at `config/default.json`. You can customize:

### File Categories
```json
{
  "extensions": {
    "pdf": "PDFs",
    "png": "Images",
    "doc": "Docs"
  }
}
```

### Custom Rules
```json
{
  "pinnedRules": [
    {"contains": ["invoice", "receipt"], "dest": "Docs"},
    {"prefix": ["SOW_", "Proposal_"], "dest": "Docs"}
  ]
}
```

### Date Folders
```json
{
  "dateFolders": "month" // "day", "month", or "year"
}
```

### Screenshot Settings
```json
{
  "screenshotTodayAlias": true,
  "autoBundle": true
}
```

## 🧪 Testing

Test the core functionality:

```bash
# Test desktop organization
node test-organizer.js

# Test undo functionality
node test-undo.js

# Test recent files
node test-recent.js
```

## 📂 Project Structure

```
tidytop/
├── src/
│   ├── main.js                 # Electron main process & menu bar UI
│   └── core/
│       ├── organize/
│       │   ├── organizer.js    # Core file organization logic
│       │   ├── undo.js         # Undo functionality
│       │   └── recent.js       # Recent files manager
│       ├── design/             # Design Mode (future)
│       ├── index/              # Search functionality (future)
│       └── chat/               # Chat commands (future)
├── config/
│   └── default.json            # Configuration file
├── data/
│   └── move-log.json          # Move history for undo
└── package.json
```

## 🎨 Roadmap

### Tier 1 ✅ (Current)
- [x] Desktop organization with categories and date folders
- [x] Screenshot handling with Today folder and burst detection
- [x] Move logging and undo functionality
- [x] Recent files view (72h)
- [x] Menu bar UI with Clean Now, Auto-Clean, Recent, Undo

### Tier 1.5 📋 (Next)
- [ ] Design Mode with playful arrangements (heart, star, spiral, grid)
- [ ] Auto-Clean file watching
- [ ] Settings window

### Tier 2 🔍 (Future)
- [ ] Smart Find with SQLite indexing
- [ ] Natural language search queries
- [ ] OCR for screenshot content search

### Tier 3 💬 (Advanced)
- [ ] Chat interface for file commands
- [ ] Voice-activated organization
- [ ] Smart bundling suggestions

## 🛠️ Technical Details

- **Framework**: Electron for cross-platform menu bar app
- **Backend**: Node.js with file system APIs
- **Database**: JSON logs (SQLite for future search features)
- **Dependencies**: date-fns for date handling, chokidar for file watching

## 📝 License

MIT License - Feel free to use and modify TidyTop for your needs!

## 🤝 Contributing

TidyTop is designed to be simple yet powerful. When contributing:

1. Keep the core purpose clear: automatic, intuitive desktop organization
2. Maintain the playful-but-not-distracting balance
3. Follow the existing code patterns and naming conventions
4. Test your changes with the provided test scripts

---

**TidyTop** - Making desktop organization delightful! 🧹✨