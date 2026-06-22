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

walk('./src', (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // Split by line to easily target lines with input or related classes
    let lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('focus:outline-none') || lines[i].includes('focus:ring-') || lines[i].includes('cursor-pointer') && lines[i].includes('select') || lines[i].includes('<input') || lines[i].includes('<select')) {
            // Also ensure it is NOT a button
            if (!lines[i].includes('<button') && !lines[i].includes('hover:bg-')) {
                lines[i] = lines[i].replace(/bg-white/g, 'bg-[#f4fbf4]');
                 // if it's already bg-[#f0fbf0] (which we might have put earlier but reverted), fix it
                lines[i] = lines[i].replace(/bg-\[\#f0fbf0\]/g, 'bg-[#f4fbf4]');
                // if it's bg-[#fffbeb]
                lines[i] = lines[i].replace(/bg-\[\#fffbeb\]/g, 'bg-[#f4fbf4]');
            }
        }
    }
    content = lines.join('\n');

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content);
        console.log("Updated", filePath);
    }
});
