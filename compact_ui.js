const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'src/app/manage/biolink/page.tsx',
  'src/app/manage/qrcodes/page.tsx',
  'src/app/manage/qrcodes/[id]/page.tsx',
  'src/app/manage/[id]/page.tsx',
  'src/app/manage/profile/page.tsx',
  'src/app/page.tsx' // Landing page
];

const basePath = path.join(__dirname, '.');

const replacements = [
  // Padding & Margin reductions
  { from: /p-10 sm:p-14/g, to: 'p-6 sm:p-8' },
  { from: /p-8 sm:p-10/g, to: 'p-5 sm:p-6' },
  { from: /p-10 sm:p-12/g, to: 'p-6 sm:p-8' },
  { from: /p-14/g, to: 'p-8' },
  { from: /p-12/g, to: 'p-8' },
  { from: /p-10/g, to: 'p-6' },
  { from: /py-24/g, to: 'py-16' },
  { from: /py-32/g, to: 'py-20' },
  
  // Border radius reductions
  { from: /rounded-\[3\.5rem\]/g, to: 'rounded-3xl' },
  { from: /rounded-\[3rem\]/g, to: 'rounded-3xl' },
  { from: /rounded-\[2\.5rem\]/g, to: 'rounded-2xl' },
  { from: /rounded-\[2rem\]/g, to: 'rounded-2xl' },
  
  // Font simplifications (removing extreme tracking and sizes)
  { from: /text-\[10px\] font-black uppercase tracking-\[0\.3em\]/g, to: 'text-xs font-bold uppercase tracking-wider' },
  { from: /text-\[10px\] font-black uppercase tracking-\[0\.25em\]/g, to: 'text-xs font-bold uppercase tracking-wider' },
  { from: /text-\[9px\] font-black uppercase tracking-\[0\.4em\]/g, to: 'text-[10px] font-bold uppercase tracking-widest' },
  { from: /text-\[9px\] font-black/g, to: 'text-xs font-bold' },
  { from: /font-black text-5xl/g, to: 'font-extrabold text-4xl' },
  { from: /font-black/g, to: 'font-bold' },
  
  // Background cleanup
  { from: /min-h-screen bg-\[\#0a0a0b\]/g, to: 'w-full' },
  { from: /min-h-screen bg-\[\#0f0f0f\]/g, to: 'w-full' },
  { from: /bg-\[\#0a0a0b\]/g, to: 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800' },
  { from: /bg-\[\#1e1e24\]/g, to: 'bg-white dark:bg-slate-800' },
  { from: /bg-\[\#111113\]/g, to: 'bg-slate-50 dark:bg-slate-800' },
  { from: /bg-\[\#18181b\]/g, to: 'bg-slate-50 dark:bg-slate-800/50' },
  
  // Biolink Preview Clearance for mobile Header
  { from: /top-\[72px\]/g, to: 'top-[88px]' }
];

filesToUpdate.forEach(file => {
  const filePath = path.join(basePath, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;
    
    replacements.forEach(({ from, to }) => {
      content = content.replace(from, to);
    });
    
    if (content !== original) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated UI density in ${file}`);
    } else {
      console.log(`No matching patterns found in ${file}`);
    }
  } else {
    console.log(`File not found: ${filePath}`);
  }
});
