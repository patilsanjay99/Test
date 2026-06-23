import fs from 'fs';
import path from 'path';

function replaceClasses(content: string): string {
  // 1. Form wrapper
  content = content.replace(
    /className="bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden( transition-all duration-300)?"/g,
    'className="bg-[#f1f5f9] border border-[#8faad8] rounded-lg shadow-md overflow-hidden"'
  );

  // 2. Header
  content = content.replace(
    /className="bg-gradient-to-r from-[a-z]+-[0-9]+ via-[a-z]+-[0-9]+ to-[a-z]+-[0-9]+ text-white py-4 px-6 text-center font-bold text-lg tracking-wider uppercase shadow-md flex items-center justify-center gap-2( select-none)?"/g,
    'className="bg-[#0b8a1c] text-white py-3 px-4 border-b border-blue-900 text-center font-bold text-xl tracking-wide uppercase flex items-center justify-center gap-2"'
  );
  
  // Header without gradient sometimes?
  content = content.replace(
    /className="bg-slate-800 text-white py-4 px-6 text-center font-bold text-lg tracking-wider uppercase shadow-md flex items-center justify-center gap-2"/g,
    'className="bg-[#0b8a1c] text-white py-3 px-4 border-b border-blue-900 text-center font-bold text-xl tracking-wide uppercase flex items-center justify-center gap-2"'
  );

  // 3. Grid wrapper
  content = content.replace(
    /className="grid grid-cols-1 lg:grid-cols-2 lg:divide-x lg:divide-slate-200"/g,
    'className="grid grid-cols-1 md:grid-cols-2 md:divide-x-2 md:divide-[#8faad8]"'
  );
  
  // Single column grid wrapper?
  content = content.replace(
    /className="flex flex-col divide-y divide-slate-100"/g,
    'className="flex flex-col"'
  );

  // 4. Row
  content = content.replace(
    /className="grid grid-cols-1 sm:grid-cols-3 border-b border-slate-100 min-h-\[52px\] items-stretch"/g,
    'className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch"'
  );

  // 5. Label wrapper
  content = content.replace(
    /className="bg-slate-50\/75 px-5 py-3\.5 flex items-center font-bold text-\[#334155\] text-xs uppercase tracking-wider sm:col-span-1 border-r border-slate-100( select-none)?"/g,
    'className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]"'
  );
  // Alternative label wrapper?
  content = content.replace(
    /className="bg-slate-50 px-5 py-3\.5 flex items-center font-bold text-slate-700 text-xs uppercase tracking-wider sm:col-span-1 border-r border-slate-200"/g,
    'className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]"'
  );

  // 6. Input wrapper
  content = content.replace(
    /className="p-2 sm:col-span-2 flex items-center bg-white"/g,
    'className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center"'
  );
  // For spans without bg-white?
  content = content.replace(
    /className="p-2 sm:col-span-2 flex items-center"/g,
    'className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center"'
  );
  content = content.replace(
    /className="p-3 sm:col-span-2 flex items-center bg-white"/g,
    'className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center"'
  );

  // 7. Inputs
  content = content.replace(
    /className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[a-z]+-[0-9]+\/50 focus:border-[a-z]+-[0-9]+ transition-colors bg-slate-50\/50 hover:bg-slate-50( resize-none)?"/g,
    (match, resize) => `className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]${resize ? ' resize-none' : ''}"`
  );
  content = content.replace(
    /className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500\/50 focus:border-blue-500 transition-colors"/g,
    'className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]"'
  );

  // 8. Bottom Action bar
  content = content.replace(
    /className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-3"/g,
    'className="bg-[#f1f5f9] p-4 border-t border-[#8faad8] flex justify-end gap-3"'
  );
  content = content.replace(
    /className="bg-white p-4 border-t border-slate-200 flex justify-end gap-3 rounded-b-xl"/g,
    'className="bg-[#f1f5f9] p-4 border-t border-[#8faad8] flex justify-end gap-3"'
  );

  // 9. Status Badge wrappers inside inputs? We will leave them for now or fix them if needed.
  
  return content;
}

const file = 'src/pages/master-data/CustomerForm.tsx';
let text = fs.readFileSync(file, 'utf8');
text = replaceClasses(text);
fs.writeFileSync('temp_customer.tsx', text);
console.log('Done');
