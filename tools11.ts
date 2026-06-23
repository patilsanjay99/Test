import fs from 'fs';
import path from 'path';

function getFiles(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.resolve(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(fullPath));
    } else {
      // exclude CompanyForm since it's already using the target theme
      if ((fullPath.endsWith('Form.tsx') || fullPath.endsWith('Register.tsx')) && !fullPath.includes('CompanyForm.tsx')) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

function replaceClasses(content: string): string {
  let original = content;

  // 1. Form wrapper / Outer Card
  content = content.replace(
    /className="bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden( transition-all duration-300)?"/g,
    'className="bg-[#f1f5f9] border border-[#8faad8] rounded-lg shadow-md overflow-hidden"'
  );
  content = content.replace(
    /className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"/g,
    'className="bg-[#f1f5f9] border border-[#8faad8] rounded-lg shadow-md overflow-hidden"'
  );

  // 2. Section Headers (various colors)
  // Emerald
  content = content.replace(
    /className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-800 text-white py-4 px-6 text-center font-bold text-lg tracking-wider uppercase shadow-md flex items-center justify-center gap-2( select-none)?"/g,
    'className="bg-[#0b8a1c] text-white py-3 px-4 border-b border-blue-900 text-center font-bold text-xl tracking-wide uppercase flex items-center justify-center gap-2"'
  );
  // Slate / Dark
  content = content.replace(
    /className="bg-slate-800 text-white py-4 px-6 text-center font-bold text-lg tracking-wider uppercase shadow-md flex items-center justify-center gap-2( select-none)?"/g,
    'className="bg-[#0b8a1c] text-white py-3 px-4 border-b border-blue-900 text-center font-bold text-xl tracking-wide uppercase flex items-center justify-center gap-2"'
  );
  content = content.replace(
    /className="bg-slate-800 text-white py-3 px-4 border-b border-slate-700 text-center font-bold tracking-wider uppercase flex items-center justify-center gap-2"/g,
    'className="bg-[#0b8a1c] text-white py-3 px-4 border-b border-blue-900 text-center font-bold text-xl tracking-wide uppercase flex items-center justify-center gap-2"'
  );
  // Blue
  content = content.replace(
    /className="bg-gradient-to-r from-blue-800 via-blue-700 to-blue-800 text-white py-4 px-6 text-center font-bold text-lg tracking-wider uppercase shadow-md flex items-center justify-center gap-2( select-none)?"/g,
    'className="bg-[#0b8a1c] text-white py-3 px-4 border-b border-blue-900 text-center font-bold text-xl tracking-wide uppercase flex items-center justify-center gap-2"'
  );
  // General fallback for headers
  content = content.replace(
    /className="bg-[a-zA-Z0-9-\/]+ text-white py-[0-9] px-[0-9] border-b border-[a-zA-Z0-9-\/]+ text-center font-bold( text-[a-z]+)? tracking-wide[r]? uppercase flex items-center justify-center gap-[0-9]"/g,
    'className="bg-[#0b8a1c] text-white py-3 px-4 border-b border-blue-900 text-center font-bold text-xl tracking-wide uppercase flex items-center justify-center gap-2"'
  );

  // 3. Grid wrappers
  content = content.replace(
    /className="grid grid-cols-1 lg:grid-cols-2 lg:divide-x lg:divide-slate-200"/g,
    'className="grid grid-cols-1 md:grid-cols-2 md:divide-x-2 md:divide-[#8faad8]"'
  );
  content = content.replace(
    /className="grid grid-cols-1 lg:grid-cols-2 lg:divide-x lg:divide-slate-100"/g,
    'className="grid grid-cols-1 md:grid-cols-2 md:divide-x-2 md:divide-[#8faad8]"'
  );
  content = content.replace(
    /className="flex flex-col divide-y divide-slate-100"/g,
    'className="flex flex-col"'
  );
  content = content.replace(
    /className="flex flex-col divide-y divide-slate-200"/g,
    'className="flex flex-col"'
  );

  // 4. Rows
  content = content.replace(
    /className="grid grid-cols-1 sm:grid-cols-3 border-b border-slate-100 min-h-\[52px\] items-stretch"/g,
    'className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch"'
  );
  content = content.replace(
    /className="grid grid-cols-1 sm:grid-cols-3 border-b border-slate-200 min-h-\[52px\] items-stretch"/g,
    'className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch"'
  );
  content = content.replace(
    /className="grid grid-cols-1 sm:grid-cols-3 border-b border-slate-100 min-h-\[48px\] items-stretch"/g,
    'className="grid grid-cols-1 sm:grid-cols-3 border-b border-blue-900 min-h-[48px] items-stretch"'
  );

  // 5. Label wrappers
  content = content.replace(
    /className="bg-slate-[0-9]+(?:\/[0-9]+)? px-[0-9]+(?:\.[0-9]+)? py-[0-9]+(?:\.[0-9]+)? flex items-center font-bold text-\[?[#a-zA-Z0-9]+\]? text-(?:xs|sm) uppercase tracking-wider sm:col-span-1 border-r border-slate-[0-9]+(?: select-none)?"/g,
    'className="bg-[#f1f5f9] px-4 py-3 flex items-center font-bold text-[#1e293b] text-sm sm:col-span-1 border-r border-[#8faad8]"'
  );

  // 6. Input wrappers
  content = content.replace(
    /className="p-[0-9]+(?:\.[0-9]+)? sm:col-span-2 flex items-center(?: bg-white)?"/g,
    'className="bg-[#f1f5f9] p-1.5 sm:col-span-2 flex items-center"'
  );

  // 7. Inputs, Selects, Textareas
  content = content.replace(
    /className="w-full px-[0-9]+ py-[0-9]+(?:\.[0-9]+)? border border-[a-zA-Z0-9-]+ rounded(?:-lg)? text-sm focus:outline-none focus:ring-[0-9]+ focus:ring-[a-zA-Z0-9-\/]+ focus:border-[a-zA-Z0-9-]+ transition-colors(?: bg-[a-zA-Z0-9-\/]+)?(?: hover:bg-[a-zA-Z0-9-\/]+)?(?: appearance-none)?(?: resize-none)?"/g,
    (match) => {
      let extra = '';
      if (match.includes('appearance-none')) extra += ' appearance-none';
      if (match.includes('resize-none')) extra += ' resize-none';
      return `className="w-full px-3 py-1.5 border border-[#8faad8] rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#f4fbf4]${extra}"`;
    }
  );

  // 8. Action bars at bottom
  content = content.replace(
    /className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-3"/g,
    'className="bg-[#f1f5f9] p-4 border-t border-[#8faad8] flex justify-end gap-3"'
  );
  content = content.replace(
    /className="bg-white p-4 border-t border-slate-200 flex justify-end gap-3(?: rounded-b-xl)?"/g,
    'className="bg-[#f1f5f9] p-4 border-t border-[#8faad8] flex justify-end gap-3"'
  );

  // Minor other fixes that might exist
  // Row for Full Width (e.g. Remarks)
  content = content.replace(
    /className="grid grid-cols-1 border-b border-slate-100 items-stretch"/g,
    'className="grid grid-cols-1 border-b border-blue-900 items-stretch"'
  );

  return content;
}

const files = getFiles('src/pages');
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const newContent = replaceClasses(content);
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated: ${file}`);
  }
});
