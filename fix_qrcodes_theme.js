const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'src/app/manage/qrcodes/[id]/page.tsx',
  'src/app/manage/qrcodes/page.tsx'
];

const basePath = path.join(__dirname, '.');

const replacements = [
  { from: /bg-\[\#121214\]/g, to: 'bg-white dark:bg-slate-900' },
  { from: /bg-\[\#18181b\]/g, to: 'bg-slate-50 dark:bg-slate-900' },
  { from: /bg-\[\#0a0a0b\]/g, to: 'bg-slate-50 dark:bg-slate-950' },
  
  // Headers
  { from: /bg-\[\#121214\]\/80/g, to: 'bg-white/80 dark:bg-slate-900/80' },
  { from: /bg-black\/40/g, to: 'bg-slate-100 dark:bg-black/40' },
  { from: /bg-black/g, to: 'bg-slate-100 dark:bg-black' },
  { from: /bg-white\/5/g, to: 'bg-slate-100 dark:bg-white/5' },
  { from: /bg-white\/\[0\.01\]/g, to: 'bg-slate-50 dark:bg-white/[0.01]' },
  { from: /bg-white\/\[0\.02\]/g, to: 'bg-slate-100 dark:bg-white/[0.02]' },
  { from: /hover:bg-white\/10/g, to: 'hover:bg-slate-200 dark:hover:bg-white/10' },
  
  // Borders
  { from: /border-white\/5/g, to: 'border-slate-200 dark:border-white/5' },
  { from: /border-white\/10/g, to: 'border-slate-200 dark:border-white/10' },
  
  // Text
  { from: /text-white/g, to: 'text-slate-900 dark:text-white' },
  { from: /text-zinc-300/g, to: 'text-slate-700 dark:text-zinc-300' },
  { from: /text-zinc-400/g, to: 'text-slate-600 dark:text-zinc-400' },
  { from: /text-zinc-500/g, to: 'text-slate-500 dark:text-zinc-500' },
  { from: /text-zinc-600/g, to: 'text-slate-500 dark:text-zinc-600' },
  { from: /text-zinc-700/g, to: 'text-slate-400 dark:text-zinc-700' },
  { from: /text-black/g, to: 'text-slate-900 dark:text-black' },
  
  // Exceptions for text-white inside buttons (fix manual later or be careful)
  { from: /text-slate-900 dark:text-white border border-white\/5/g, to: 'text-slate-900 dark:text-white border border-slate-200 dark:border-white/5' },
  
  // Adjust sticky headers
  { from: /header className="sticky top-0 z-\[100\] bg-white\/80 dark:bg-slate-900\/80 backdrop-blur-xl border-b border-slate-200 dark:border-white\/5"/g, to: 'header className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group"' },
  { from: /px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between/g, to: 'w-full flex items-center justify-between' }
];

filesToUpdate.forEach(file => {
  const filePath = path.join(basePath, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Manual hacks: we don't want to replace text-white inside specific coloured buttons.
    // e.g. text-white in bg-indigo-600
    content = content.replace(/bg-indigo-600 text-white/g, 'bg-indigo-600 __TEXT_WHITE__');
    content = content.replace(/bg-emerald-500 text-white/g, 'bg-emerald-500 __TEXT_WHITE__');
    content = content.replace(/bg-red-500 text-white/g, 'bg-red-500 __TEXT_WHITE__');
    
    replacements.forEach(({ from, to }) => {
      content = content.replace(from, to);
    });
    
    // Restore hacks
    content = content.replace(/__TEXT_WHITE__/g, 'text-white');
    
    // Ensure the root div in [id] does not have `text-slate-900 dark:text-white` at the very top level unless necessary, but it's fine.
    
    fs.writeFileSync(filePath, content);
    console.log(`Updated theme classes in ${file}`);
  }
});
