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

  let modulePath = '';
  if (filePath.includes('master-data')) modulePath = '/master';
  if (filePath.includes('accounting')) modulePath = '/accounting';
  if (filePath.includes('sales')) modulePath = '/sales';
  if (filePath.includes('purchase')) modulePath = '/purchase';
  if (filePath.includes('fpc')) modulePath = '/fpc';
  if (filePath.includes('inventory')) modulePath = '/inventory';
  if (filePath.includes('assets')) modulePath = '/assets';

  if (!modulePath) return;

  // Edit2 buttons without hasPermission
  content = content.replace(/<button[^>]*>[\s\S]*?<Edit2[\s\S]*?<\/button>/g, (match) => {
     if (match.includes('hasPermission')) return match;
     return `{hasPermission('${modulePath}', 'edit') && (\n${match}\n)}`;
  });

  // Trash2 buttons without hasPermission
  content = content.replace(/<button[^>]*>[\s\S]*?<Trash2[\s\S]*?<\/button>/g, (match) => {
     if (match.includes('hasPermission')) return match;
     return `{hasPermission('${modulePath}', 'delete') && (\n${match}\n)}`;
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated Edit/Delete in ${filePath}`);
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
