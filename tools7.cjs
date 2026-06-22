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

    content = content.replace(/bg-blue-950/g, 'bg-[#8faad8]');
    content = content.replace(/bg-opacity-70/g, ''); // remove opacity so it's solid

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content);
        console.log("Updated", filePath);
    }
});
