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

    content = content.replace(/bg-\[\#b4c6e7\]/g, 'bg-[#f1f5f9]');
    content = content.replace(/bg-\[\#d9e1f2\]/g, 'bg-[#f1f5f9]');
    
    // In CompanyForm, the outer div wrapper is "bg-[#f1f5f9] border border-blue-900 rounded-lg shadow-md overflow-hidden"
    content = content.replace(/divide-blue-900/g, 'divide-[#8faad8]');
    content = content.replace(/divide-blue-950/g, 'divide-[#8faad8]');
    content = content.replace(/border-blue-950/g, 'border-blue-900'); // make border consistent
    
    // Ensure form buttons container uses consistent border
    content = content.replace(/border-t border-blue-900/, 'border-t-2 border-blue-900');

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content);
        console.log("Updated", filePath);
    }
});
