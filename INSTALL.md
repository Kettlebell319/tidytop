# TidyTop Installation Guide

## 🚀 Quick Start (For Developers)

1. **Clone and setup**:
   ```bash
   git clone <repository-url>
   cd tidytop
   npm install
   ```

2. **Run TidyTop**:
   ```bash
   npm start
   ```

3. **Look for the TidyTop icon in your menu bar** (top-right on macOS, system tray on Windows/Linux)

## 📦 For End Users (Distribution Package)

### macOS
1. Download `TidyTop-1.0.0.dmg`
2. Open the DMG file
3. Drag TidyTop to your Applications folder
4. Launch TidyTop from Applications
5. Look for the folder icon in your menu bar

### Windows
1. Download `TidyTop Setup 1.0.0.exe`
2. Run the installer
3. Follow the installation prompts
4. Launch TidyTop from Start Menu
5. Look for the TidyTop icon in your system tray

### Linux
1. Download `TidyTop-1.0.0.AppImage`
2. Make it executable: `chmod +x TidyTop-1.0.0.AppImage`
3. Run: `./TidyTop-1.0.0.AppImage`
4. Look for the TidyTop icon in your system tray

## 🛠️ Building Distribution Packages

To create distribution packages for all platforms:

```bash
# Install dependencies
npm install

# Build for current platform
npm run build

# Build for all platforms (requires platform-specific tools)
npm run build -- --mac --win --linux
```

### Platform-specific requirements:

**macOS** (for .dmg):
- macOS 10.12+ 
- Xcode Command Line Tools

**Windows** (for .exe):
- Windows 10+
- Windows SDK (optional, for code signing)

**Linux** (for .AppImage):
- Linux with glibc 2.17+

## 🎯 First Use

1. **Menu Bar Access**: Click the TidyTop icon in your menu bar/system tray
2. **Clean Now**: Click "🧹 Clean Now" to organize your desktop
3. **Settings**: Click "⚙️ Settings" to customize organization rules
4. **Auto-Clean**: Toggle "✨ Auto-Clean" to automatically organize new files

## ⚙️ Configuration

TidyTop stores its configuration in `config/default.json`. You can:

- Edit the file directly
- Use the Settings window (⚙️ Settings in menu)
- Reset to defaults anytime

## 🧪 Demo Mode

Try the interactive demo to see all features:

```bash
node demo.js
```

## 🔧 Troubleshooting

### Menu bar icon not showing
- **macOS**: Check System Preferences > Dock & Menu Bar > Clock > Show in Menu Bar
- **Windows**: Check system tray settings, look for hidden icons
- **Linux**: Ensure system tray support is enabled

### Permission errors
- TidyTop needs permission to move files on your desktop
- **macOS**: System Preferences > Security & Privacy > Files and Folders
- **Windows**: Run as administrator if needed

### Files not organizing
- Check the console output for error messages
- Verify file permissions
- Check if files are in use by other applications

## 📞 Support

- GitHub Issues: [Report problems or request features]
- Documentation: Check README.md for detailed information
- Demo: Run `node demo.js` to see all features

---

**TidyTop** - Making desktop organization delightful! 🧹✨