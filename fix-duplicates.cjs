const fs = require('fs');
const path = require('path');

const directories = [
  'src/pages/master-data',
  'src/pages/accounting',
  'src/pages/sales',
  'src/pages/purchase',
  'src/pages/fpc',
  'src/pages/inventory',
  'src/pages/assets'
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Generic double wrapping remover
  // Examples:
  // {hasPermission('/master', 'edit') && (
  // {hasPermission('/master', 'edit') && (
  // <button ... >
  
  content = content.replace(/\{hasPermission\('([^']+)',\s*'([^']+)'\)\s*&&\s*\(\s*\{hasPermission\('([^']+)',\s*'([^']+)'\)\s*&&\s*\(/g, "{hasPermission('$1', '$2') && (");
  content = content.replace(/\{hasPermission\('([^']+)',\s*'([^']+)'\)\s*&&\s*\(\s*\{hasPermission\('([^']+)',\s*'([^']+)'\)\s*&&\s*\(/g, "{hasPermission('$1', '$2') && (");
  content = content.replace(/\)\}\s*\)\}/g, ")}");

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log(`Removed duplicates from ${filePath}`);
  }
}

directories.forEach(dir => {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      if (file.endsWith('.tsx') && !file.endsWith('Form.tsx')) {
         processFile(path.join(dir, file));
      }
    });
  }
});
