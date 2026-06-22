const fs = require('fs');

const filesToFix = [
  'src/pages/sales/SalesOrders.tsx',
  'src/pages/sales/SalesQuotations.tsx',
  'src/pages/sales/SalesInvoices.tsx',
  'src/pages/sales/SalesReturns.tsx',
  'src/pages/purchase/PurchaseOrders.tsx',
  'src/pages/purchase/PurchaseReturns.tsx',
  'src/pages/fpc/Members.tsx',
  'src/pages/master-data/Users.tsx',
  'src/pages/master-data/FinancialYears.tsx',
  'src/pages/accounting/JournalEntries.tsx',
];

filesToFix.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove standalone `)}` that are flush left
    // We only want to remove ones that followed our buttons
    content = content.replace(/<\/button>\n\)\}/g, '</button>');
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed ${filePath}`);
  }
});
