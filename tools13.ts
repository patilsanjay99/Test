import fs from 'fs';
import path from 'path';

function fixFormColors(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Outer form wrappers
  content = content.replace(
    /className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-6"/g,
    'className="bg-[#f1f5f9] border border-[#8faad8] rounded-lg shadow-md p-6 space-y-6"'
  );
  content = content.replace(
    /className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 md:p-8 space-y-6"/g,
    'className="bg-[#f1f5f9] border border-[#8faad8] rounded-lg shadow-md p-6 md:p-8 space-y-6"'
  );
  content = content.replace(
    /className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"/g,
    'className="bg-[#f1f5f9] border border-[#8faad8] rounded-lg shadow-md overflow-hidden"'
  );

  // Headers inside the form
  content = content.replace(
    /className="p-4 border-b border-gray-200 bg-gray-50\/50 flex items-center gap-3"/g,
    'className="bg-[#0b8a1c] text-white py-3 px-4 border-b border-blue-900 text-center font-bold text-xl tracking-wide uppercase flex items-center justify-center gap-2"'
  );
  content = content.replace(
    /className="text-lg font-semibold text-gray-900"/g,
    'className=""' // the header text class above handles it
  );

  // Inputs
  content = content.replace(
    /className="w-full px-4 py-2\.5 border border-gray-[0-9]+ rounded-lg text-sm bg-gray-[0-9]+ text-gray-500 cursor-not-allowed font-mono focus:outline-none"/g,
    'className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm bg-gray-200 text-gray-500 cursor-not-allowed font-mono focus:outline-none"'
  );
  content = content.replace(
    /className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-\[#f4fbf4\]"/g,
    'className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]"'
  );
  content = content.replace(
    /className="w-full px-4 py-2\.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition font-medium"/g,
    'className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]"'
  );
  content = content.replace(
    /className="w-full px-4 py-2\.5 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"/g,
    'className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]"'
  );
  content = content.replace(
    /className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"/g,
    'className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]"'
  );
  content = content.replace(
    /className="w-full px-4 py-2\.5 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32 transition-all outline-none resize-none"/g,
    'className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4] h-32 resize-none"'
  );

  fs.writeFileSync(filePath, content, 'utf8');
}

const files = [
  'src/pages/accounting/AccountGroupForm.tsx',
  'src/pages/accounting/BankPaymentForm.tsx',
  'src/pages/accounting/BankReceiptForm.tsx',
  'src/pages/accounting/CashPaymentForm.tsx',
  'src/pages/accounting/CashReceiptForm.tsx',
  'src/pages/e-tracker/IssueForm.tsx',
  'src/pages/fpc/MemberRegister.tsx',
  'src/pages/master-data/BankForm.tsx',
  'src/pages/master-data/LocationForm.tsx'
];

files.forEach(f => {
  fixFormColors(f);
  console.log(`Fixed colors for ${f}`);
});
