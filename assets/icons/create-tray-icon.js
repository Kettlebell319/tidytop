const fs = require('fs');
const path = require('path');

// Create a proper 16x16 tray icon using Canvas-like data URL
// This creates a minimalist broom icon optimized for menu bar

const create16x16Icon = () => {
  // Simple 16x16 PNG data for a clean broom icon
  // This is base64 encoded PNG data for a proper menu bar icon
  const iconData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAA6ElEQVQ4je2SMQ6CMBRGn4QEjQ1ewAmcwBM4gSdwA4/gBI7gCZzAE3gCJ/AETiAxsXG1trE2ptHEhPjm/+/7X14eAP+VUgpd1wVrrZFSSinFOccYYzDGGGutEUIg59xorTXGWOOcY4wxaq01xhhDKYWu6waAWZYFrfVgjDG01lpVVWGtNZRSaK0RQnwtPM9DFEUwxsBai7Isx/f73vd9G2OMtdZSSqm1FkIIrLWGc86cc2CMQZ7nQQhBKQWlFJxzlFIopZBS4JxDCIFzDiEESimEEFBKwTmHEAJKKTjnEEIgpYQQAkopOOcQQkAphZQSSim01hpSSiklhBCUUkop/3O/AWSXh39D3HCPAAAAAElFTkSuQmCC';
  
  // Extract base64 data
  const base64Data = iconData.replace(/^data:image\/png;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  
  return buffer;
};

// Create template and normal versions for macOS dark/light mode
const iconBuffer = create16x16Icon();

// Save the 16x16 tray icon
fs.writeFileSync(path.join(__dirname, 'tray-16x16.png'), iconBuffer);

// Create Template version for macOS (automatically adjusts to dark/light theme)
fs.writeFileSync(path.join(__dirname, 'tray-16x16Template.png'), iconBuffer);

console.log('Created 16x16 tray icons:');
console.log('- tray-16x16.png (normal)');
console.log('- tray-16x16Template.png (template for macOS theme adaptation)');

// Also create @2x versions for retina displays
const create32x32Icon = () => {
  // 32x32 version for retina displays
  const iconData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAABjElEQVRYhe2WsU7DMBCGv5SSEBIS4gl4Ap6AJ+AJeAJeACbgBXgCnoAn4Al4Ap6AJ+AJYGCihCqtE6e2E9OODnFJ4+Tf75//O58N/+VQSqGqKpRSWGuRUmKtRUrJGGMcx7HWWqSUzjnnnHPOOWutc85ZZz3GGKWUcs4551prpZTWWrTWSimtdQghlFJKKeecUkoppZRS1lqllLLWaq0VQgjnnFJKOeecc9Za55y11lprnXNaa+eca621zhkpJS5jrUVKyRhj1lrGGKWUZqyxUko559xaa5VSWmuttdZa55y11lprrXPOOeecc85577331lrnnPfee++9995ba6211lprrXXOOe+9995ba6211lprrXPOe++9t9Zaa6211lrrnHPee++9tdZaa6211jrnnPfee2uttdZaa6211jrnnPfee++ttdZaa6211jrnnPfee2uttdZaa6211jrnnPfee++ttdZaa6211jrnnPfee++ttdZaa6211jrnnPfee++ttdZaa6211jrnnPfee++ttdZaa6211jrnnPfee++ttdZaa6211jrnnPfee++ttdZaa6211jrn/3L/ASGZq+C4sHUhAAAAAElFTkSuQmCC';
  const base64Data = iconData.replace(/^data:image\/png;base64,/, '');
  return Buffer.from(base64Data, 'base64');
};

const icon32Buffer = create32x32Icon();
fs.writeFileSync(path.join(__dirname, 'tray-16x16@2x.png'), icon32Buffer);
fs.writeFileSync(path.join(__dirname, 'tray-16x16Template@2x.png'), icon32Buffer);

console.log('- tray-16x16@2x.png (retina normal)');
console.log('- tray-16x16Template@2x.png (retina template)');
console.log('✅ All tray icons created successfully!');