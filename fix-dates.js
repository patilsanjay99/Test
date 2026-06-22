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

  // We are looking for: <CustomDatePicker value={xyz} onChange={() => {}} className="something" /> setxyz(e.target.value)} ... />
  // This is a regex to match the broken output and replace it with correct usage.
  const regex = /<CustomDatePicker value=\{([^\}]+)\} onChange=\{\(\) => \{\}\} className="([^"]*)" \/>([^>]+)\/>/g;
  
  content = content.replace(regex, (match, val, cls, rest) => {
    // extract setter from rest
    const setMatch = rest.match(/(set[A-Za-z0-9_]+)\(/);
    const setter = setMatch ? (setMatch[1] + "") : "() => {}";
    return '<CustomDatePicker value={' + val + '} onChange={' + setter + '} className="' + cls + '" />';
  });

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('Fixed', file);
}
