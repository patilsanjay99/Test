import fs from 'fs';
import path from 'path';

const files = [
  'src/pages/accounting/CashPayments.tsx',
  'src/pages/accounting/CashPaymentForm.tsx',
  'src/pages/accounting/CashReceipts.tsx',
  'src/pages/accounting/CashReceiptForm.tsx',
  'src/pages/accounting/BankPayments.tsx',
  'src/pages/accounting/BankPaymentForm.tsx',
  'src/pages/accounting/BankReceipts.tsx',
  'src/pages/accounting/BankReceiptForm.tsx',
];

for (const file of files) {
  const filePath = path.resolve(file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Check if CustomDatePicker is imported
  if (!content.includes('CustomDatePicker')) {
    // try to append it to imports
    content = content.replace(
      /^import React.*?$/m,
      `$&
import { CustomDatePicker } from '../../components/CustomDatePicker';`
    );
  }

  // Find <input type="date" value={xyz} onChange={e => setXyz(e.target.value)} ... />
  // We'll replace it. The regex is tricky because attributes could be multiline.
  // We can do it by finding <input ... type="date" ... /> block via regex.
  const regex = /<input[^>]*type="date"[^>]*>/g;
  
  content = content.replace(regex, (match) => {
    // Extract value
    const valueMatch = match.match(/value=\{([^}]+)\}/);
    // Extract onChange
    const onChangeMatch = match.match(/onChange=\{([^}]+)\}/);
    // Extract className
    const classMatch = match.match(/className="([^"]+)"/);
    
    let val = valueMatch ? valueMatch[1] : "''";
    let setter = "() => {}";
    if (onChangeMatch) {
      const oc = onChangeMatch[1];
      // e => setStartDate(e.target.value) or (e) => setStartDate(e.target.value)
      const setterMatch = oc.match(/set[A-Za-z0-9_]+/);
      if (setterMatch) {
        setter = setterMatch[0];
      } else {
        setter = "console.log" // fallback
      }
    }
    
    let cls = classMatch ? classMatch[1] : "";
    
    return '<CustomDatePicker value={' + val + '} onChange={' + setter + '} className="' + cls + '" />';
  });

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('Processed', file);
}
