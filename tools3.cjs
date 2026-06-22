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

    // Use a very robust regex for JSX inputs
    // <input ... bg-white ... />
    // Find all tags:
    let result = '';
    let inInput = false;
    let i = 0;
    while(i < content.length) {
        if (content.substr(i, 6) === '<input' || content.substr(i, 7) === '<select' || content.substr(i, 9) === '<textarea') {
            let endIndex = content.indexOf('>', i);
            let chunk = content.substring(i, endIndex + 1);
            chunk = chunk.replace(/bg-white/g, 'bg-[#f4fbf4]');
            result += chunk;
            i = endIndex + 1;
        } else {
            result += content[i];
            i++;
        }
    }
    
    // Some forms might have a wrapper div or custom components like react-select? 
    // We cover standard tags above.

    if (result !== originalContent) {
        fs.writeFileSync(filePath, result);
        console.log("Updated inputs in", filePath);
    }
});
