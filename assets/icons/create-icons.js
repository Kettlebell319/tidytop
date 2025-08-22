// Simple script to create basic PNG icon files for TidyTop
// This creates a basic 16x16 tray icon programmatically

const fs = require('fs');
const path = require('path');

// Create a simple 16x16 PNG for the tray icon (base64 encoded)
const trayIconBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAaklEQVQ4je2TwQoAIAhE39z//7JeKoJcdBHcw8AgH8MZAEopIKVUCFBKKdDMwMxARGBmINIkImBmICLYGZgZrLW01sLM4JxDRLDWwswgIrDWws7AzOCcA4BSSoFmBmaG1hpEBGYGa+3fMw8RhhtAnUvLIQAAAABJRU5ErkJggg==';

// Extract the base64 part and create the PNG file
const base64Data = trayIconBase64.replace(/^data:image\/png;base64,/, '');
const iconBuffer = Buffer.from(base64Data, 'base64');

// Write the tray icon
fs.writeFileSync(path.join(__dirname, 'tray-icon.png'), iconBuffer);

console.log('Created tray-icon.png');

// For a proper app, you'd want to create proper .icns (Mac), .ico (Windows), and .png (Linux) files
// For now, let's create a simple placeholder

const simpleIconSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="100" fill="#2563EB"/>
  <path d="M128 384 L384 128 M320 192 L352 224 M96 416 C96 416 128 384 160 384 C160 416 128 448 96 448 C96 448 96 416 96 416 Z" 
        stroke="white" 
        stroke-width="24" 
        stroke-linecap="round" 
        stroke-linejoin="round" 
        fill="none"/>
  <circle cx="256" cy="256" r="16" fill="white"/>
  <circle cx="288" cy="224" r="8" fill="white"/>
  <text x="256" y="480" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="48" font-weight="bold">TidyTop</text>
</svg>`;

fs.writeFileSync(path.join(__dirname, 'icon.svg'), simpleIconSVG);
console.log('Created icon.svg');

// Create a basic 512x512 PNG for the app icon (would need proper icon generation tools for production)
console.log('Note: For production, convert icon.svg to .icns, .ico, and .png formats using proper tools.');
console.log('Example: npm install -g icon-gen && icon-gen icon.svg ./');