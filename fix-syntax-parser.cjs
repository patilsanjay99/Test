const fs = require('fs');
const path = require('path');

const directories = [
  'src/pages/master-data',
  'src/pages/accounting',
  'src/pages/sales',
  'src/pages/purchase',
  'src/pages/fpc',
  'src/pages/inventory',
  'src/pages/assets',
  'src/pages/reports'
];

function processFile(filePath) {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // We want to ensure that every `{hasPermission(something) && (` is closed by `)}`
    // Let's use a very simple parser.
    let lines = content.split('\n');
    let inPermissionBlock = false;
    let blockStartLine = -1;
    let buttonDepth = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.match(/\{hasPermission\([^)]+\)\s*&&\s*\(/)) {
            inPermissionBlock = true;
            blockStartLine = i;
            buttonDepth = 0;
            // Check if it's already closed on the same line
            if (line.endsWith(')}')) {
                inPermissionBlock = false;
            }
        } else if (inPermissionBlock) {
            // Count buttons
            if (line.includes('<button')) buttonDepth++;
            if (line.includes('</button>')) buttonDepth--;

            // If we closed the buttons, check if the next line is )}
            // Actually, just looking for 
            if (line.includes('</button>') && buttonDepth <= 0) {
               // Next line or end of this line should be )}
               if (i + 1 < lines.length && !lines[i+1].includes(')}')) {
                   // Insert )} after this line
                   // Wait, it might be on the same line: `</button> )}`
                   if (!line.includes(')}')) { // wait, `)}` doesn't exist on this line
                       lines.splice(i + 1, 0, line.replace(/\S.*/, '') + ')}');
                   }
               }
               inPermissionBlock = false;
            }
        }
    }

    content = lines.join('\n');
    
    // Also remove duplicated )} )}
    // Just replace instances of `\n\s*\)\}\n\s*\)\}` with `\n\s*\)\}`
    content = content.replace(/\n(\s*)\)\}\n(\s*)\)\}/g, '\n$1)}');

    if (content !== original) {
      fs.writeFileSync(filePath, content);
      console.log(`Re-fixed ${filePath}`);
    }
  }
}

directories.forEach(dir => {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      if (file.endsWith('.tsx') && !file.endsWith('Form.tsx')) { // skip form files, they were less affected and have complex logic
         processFile(path.join(dir, file));
      }
    });
  }
});
