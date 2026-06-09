const fs = require('fs');
const path = require('path');

const files = [
  'src/pages/master-data/Company.tsx',
  'src/pages/sales/SalesInvoices.tsx',
  'src/pages/sales/SalesQuotations.tsx',
  'src/pages/sales/SalesOrders.tsx',
  'src/pages/sales/SalesReturns.tsx',
  'src/pages/purchase/PurchaseOrders.tsx',
  'src/pages/purchase/PurchaseInvoices.tsx',
  'src/pages/purchase/PurchaseReturns.tsx',
  'src/pages/fpc/Members.tsx',
  'src/pages/fpc/Shares.tsx',
  'src/pages/fpc/Loans.tsx',
  'src/pages/inventory/StockLedger.tsx',
  'src/pages/inventory/StockAdjustments.tsx',
  'src/pages/assets/Assets.tsx',
  'src/pages/accounting/ChartOfAccounts.tsx',
  'src/pages/accounting/JournalEntries.tsx',
];

for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  if (content.includes('exportToCSV(')) continue;
  
  // Find array name based on what's mapped! e.g. foo.map(
  // we look for `.map((` or `.map( ( `
  const mapMatch = content.match(/{\s*([a-zA-Z0-9_]+)\.map\(/);
  let arrayName = null;
  if (mapMatch) arrayName = mapMatch[1];
  else {
     // try something else
     const constMatch = content.match(/const\s+([a-zA-Z0-9_]+)\s*=\s*\[\s*{/);
     if (constMatch) arrayName = constMatch[1];
  }
  
  if (!arrayName) {
    if (content.indexOf('<Download') !== -1) {
        console.log("Could not find array in", f);
    }
    continue;
  }
  
  // Insert import
  const importDepth = f.split('/').length - 2;
  const importPath = '../'.repeat(importDepth) + 'lib/utils';
  content = content.replace("import React from", `import { exportToCSV } from '${importPath}';\nimport React from`);
  
  // Update the Export button
  const exportBtnRegex = /<button([^>]*?)>\s*<Download className="w-4 h-4"\s*\/>\s*Export\s*<\/button>/;
  const newButton = `<button$1 onClick={() => exportToCSV(${arrayName}, '${path.basename(f, '.tsx')}')}>\n              <Download className="w-4 h-4" /> Export\n            </button>`;
  
  content = content.replace(exportBtnRegex, newButton);
  
  fs.writeFileSync(f, content, 'utf8');
  console.log("Updated", f, "with array", arrayName);
}
