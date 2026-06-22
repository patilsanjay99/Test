const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            walk(dirPath, callback);
        } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
            callback(path.join(dir, f));
        }
    });
}

const targetFiles = [];
walk('./src', (filePath) => {
    if (filePath.includes('Form.tsx') || filePath.includes('Users.tsx') || filePath.includes('StockAdjustments.tsx')) {
        targetFiles.push(filePath);
    }
});
// Add specific ones if "Form" is not in the name
walk('./src', (filePath) => {
    if (filePath.endsWith('.tsx') && !targetFiles.includes(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('max-w-4xl') || content.includes('max-w-5xl') || content.includes('max-w-6xl') || content.includes('max-w-7xl') || content.includes('bg-white')) {
            targetFiles.push(filePath);
        }
    }
});


targetFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;

    // Expand max width of forms to maximum
    content = content.replace(/max-w-[0-9]xl mx-auto/g, 'max-w-full mx-auto px-4 lg:px-8 w-full');
    
    // Change input backgrounds
    content = content.replace(/bg-\[\#fffbeb\]/g, 'bg-[#f0f9f0]');
    // Also typical bg-white on inputs
    // We should be careful replacing bg-white everywhere. Inputs usually have focus:ring etc.
    content = content.replace(/bg-white([^>]*?)(cursor-pointer|focus:outline-none|focus:ring|input|select)/g, 'bg-[#f0f9f0]$1$2');
    content = content.replace(/(focus:ring[A-Za-z0-9\-\s]*)bg-white/g, '$1bg-[#f0f9f0]');

    // Border thin
    content = content.replace(/border-2 border-blue-900/g, 'border border-blue-900');
    content = content.replace(/border-2 border-blue-950/g, 'border border-blue-950');
    content = content.replace(/border-b-2 border-blue-900/g, 'border-b border-blue-900');
    content = content.replace(/border-b-2 border-blue-950/g, 'border-b border-blue-950');

    if (content !== originalContent) {
        fs.writeFileSync(file, content);
        console.log("Updated", file);
    }
});
