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

    // We accidentally replaced 'bg-white' in buttons and some other non-input elements that had 'cursor-pointer'.
    // The previous regex was: /bg-white([^>]*?)(cursor-pointer|focus:outline-none|focus:ring|input|select)/g -> 'bg-[#f0f9f0]$1$2'
    
    // Let's replace bg-[#f0f9f0] with bg-white if it's inside a <button> or <div> tag.
    // Wait, regex replacing HTML is tricky. Let's just fix the whole thing: revert all bg-[#f0f9f0] to bg-white.
    content = content.replace(/bg-\[\#f0f9f0\]/g, 'bg-white');
    
    // Now just replace bg-white with bg-[#f0fbf0] IF the element is <input, <select, or <textarea
    // We can do this with a regex that looks for <input ... class="... bg-white ..." >
    // Because JSX could be multi-line, it's safer to match:
    // <(input|select|textarea)([^>]*?)bg-white([^>]*?)>
    let newContent = content;
    let oldContent = "";
    while(newContent !== oldContent) {
        oldContent = newContent;
        newContent = newContent.replace(/(<(input|select|textarea)[^>]*?)bg-white([^>]*?>)/g, '$1bg-[#f0fbf0]$3');
    }
    content = newContent;

    // What if the class was originally bg-[#fffbeb]?
    // Wait, I already changed bg-[#fffbeb] to bg-[#f0f9f0] and now back to bg-white. Let's change it to bg-[#f0fbf0] inside input/select/textareas, but wait! The previous script changed bg-[#fffbeb] to bg-[#f0f9f0]. I just reverted it to bg-white. Let's apply bg-[#f0fbf0] to all input/select/textareas that have bg-white.
    
    if (content !== originalContent) {
        fs.writeFileSync(filePath, content);
        console.log("Fixed", filePath);
    }
});
