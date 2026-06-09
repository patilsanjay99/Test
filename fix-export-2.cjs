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
  
  const mapMatch = content.match(/{\s*([a-zA-Z0-9_]+)\.map\(/);
  let arrayName = null;
  if (mapMatch) arrayName = mapMatch[1];
  else {
     const constMatch = content.match(/const\s+([a-zA-Z0-9_]+)\s*=\s*\[\s*{/);
     if (constMatch) arrayName = constMatch[1];
  }
  
  if (!arrayName) continue;

  const bRegex = /<button([^>]*?)>\s*Export\s*<\/button>/;
  if (bRegex.test(content)) {
     const newButton = `<button$1 onClick={() => exportToCSV(${arrayName}, '${path.basename(f, '.tsx')}')}>\n              <Download className="w-4 h-4" /> Export\n            </button>`;
     content = content.replace(bRegex, newButton);
     
     if (!content.includes('import { exportToCSV }')) {
         const importDepth = f.split('/').length - 2;
         const importPath = '../'.repeat(importDepth) + 'lib/utils';
         content = content.replace("import React from", `import { exportToCSV } from '${importPath}';\nimport React from`);
     }
     
     if (!content.includes('Download')) {
         content = content.replace("import { Plus, Search", "import { Plus, Search, Download");
     }
     
     fs.writeFileSync(f, content, 'utf8');
     console.log("Fixed missing Export button in", f);
  }
}
