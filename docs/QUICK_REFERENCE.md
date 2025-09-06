# TidyTop Quick Reference

## Menu Bar Actions

| Icon | Action | Description |
|------|--------|-------------|
| 🧹 | Clean Now | Organize all desktop files immediately |
| 👁️ | Preview Clean | See what will be organized (recommended first step) |
| ✨ | Auto-Clean | Toggle automatic organization (coming soon) |
| 🕒 | Recent (72h) | Quick access to recently organized files |
| ↩️ | Undo Last Clean | Restore files to original locations |
| 🎨 | Play (Design Mode) | Creative desktop layouts (coming soon) |
| ⚙️ | Settings | Customize categories and rules |
| ❓ | Help | Open comprehensive documentation |

## File Organization

### Default Categories
- **📸 Screenshots** - PNG files from screen captures
- **📄 PDFs** - PDF documents  
- **🖼️ Images** - JPG, PNG, GIF, etc.
- **📝 Documents** - Word docs, text files, spreadsheets
- **🎵 Audio** - MP3, WAV, etc.
- **🎬 Video** - MP4, MOV, etc.
- **📦 Archives** - ZIP, RAR, etc.
- **🗂️ Misc** - Everything else

### Folder Structure
```
Desktop/
├── Screenshots/
│   ├── 2025-08/        (organized by month)
│   └── Today/          (recent screenshots alias)
├── PDFs/
│   └── 2025-08/
├── Images/
│   └── 2025-08/
└── ...
```

## Settings Overview

### Organization Settings
- **Date Folder Format**: Month/Day/Year organization
- **Today Folder**: Alias for recent screenshots  
- **Auto-Bundle**: Group burst screenshots

### Smart Rules
Create rules based on file names:
- **Contains**: Files with specific text in name
- **Starts With**: Files beginning with specific text
- **Destination**: Target category for matching files

### Category Management
- Rename existing categories
- Create new custom categories
- Add emoji icons
- Remove unused categories (core categories protected)

### File Extensions
- Assign file types to specific categories
- Add custom extensions
- Override default mappings

## Keyboard Shortcuts

| Context | Key | Action |
|---------|-----|--------|
| Onboarding | `→` / `←` | Navigate steps |
| Onboarding | `Esc` | Skip tutorial |
| Help Window | `Esc` | Close window |

## Safety Features

### Preview First
Always use "Preview Clean" to see what will happen before organizing. Shows:
- Total files to organize
- Files grouped by category  
- Where each file will go
- Organization statistics

### Complete Undo
- Restores ALL files to exact original locations
- Only most recent clean can be undone
- Undo data stored in `~/.tidytop/moves.json`

### Safe Organization
- Only moves files (never deletes)
- Preserves file timestamps
- Leaves folders untouched
- Creates organized folders as needed

## Common Use Cases

### First Time Setup
1. Launch TidyTop → Complete onboarding tutorial
2. Open Settings → Customize categories for your workflow
3. Create smart rules for common file patterns
4. Try "Preview Clean" with a few test files
5. Use "Clean Now" when satisfied

### Daily Organization
1. Let files accumulate on desktop during work
2. End of day: Click TidyTop → "Preview Clean"
3. Review what will be organized
4. Click "Clean Now" to organize
5. Use "Recent (72h)" to find newly organized files

### Screenshot Management
- Screenshots automatically detect bursts
- Recent screenshots get "Today" folder alias
- Organized by date within Screenshots category
- Burst screenshots bundled together

## Troubleshooting

### Quick Fixes
| Problem | Solution |
|---------|----------|
| Menu bar icon missing | Launch TidyTop from Applications |
| Files won't organize | Close apps using the files |
| Permission errors | Grant desktop access in System Preferences |
| Undo not working | Check `~/.tidytop/moves.json` exists |

### Reset Options
1. **Settings Reset**: Settings → "Reset to Defaults"
2. **App Restart**: Quit from menu bar → relaunch  
3. **Full Reset**: Delete `~/.tidytop/` folder
4. **Reinstall**: Download fresh copy

## File Locations
- **Config**: `~/.tidytop/config.json`
- **Move History**: `~/.tidytop/moves.json`
- **Application**: `/Applications/TidyTop.app`

## Tips
- 💡 Always preview before organizing large numbers of files
- 💡 Set up custom categories that match your workflow
- 💡 Use smart rules for common file patterns
- 💡 Organize weekly rather than daily for efficiency
- 💡 Keep core categories but customize names to your preference

---

*TidyTop v1.0.0 - Desktop organization made delightful! ✨*