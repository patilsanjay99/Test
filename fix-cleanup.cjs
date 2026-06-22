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

    // Remove any )\} that are on a line by themselves with optional whitespace, IF they follow </button> immediately
    content = content.replace(/<\/button>\n\s*\)\}/g, '</button>');
    
    if (content !== original) {
      fs.writeFileSync(filePath, content);
      console.log(`Cleaned up ${filePath}`);
    }
  }
}

directories.forEach(dir => {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      if (file.endsWith('.tsx')) {
         processFile(path.join(dir, file));
      }
    });
  }
});
