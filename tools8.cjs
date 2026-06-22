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

    // Change input borders to be thin and #8faad8 globally to match company master
    // Inputs usually have: border border-blue-900
    // Let's accurately target className attributes containing border-blue-900 inside inputs/selects
    
    // We can do it broadly, but let's be careful not to override the outermost form borders if we want it to stay blue-900. 
    // Actually, outer form border in CompanyForm is also `border-blue-900`. 
    // So let's just target inner borders:
    
    // Let's replace "border border-blue-900 rounded" with "border border-[#8faad8] rounded"
    content = content.replace(/border border-blue-900 rounded/g, 'border border-[#8faad8] rounded');
    
    // Some might be border-blue-950
    content = content.replace(/border border-blue-950 rounded/g, 'border border-[#8faad8] rounded');

    // Make sure we caught it:
    if (content !== originalContent) {
        fs.writeFileSync(filePath, content);
        console.log("Updated", filePath);
    }
});
