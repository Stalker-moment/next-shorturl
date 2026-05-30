const fs = require('fs');
const path = require('path');

function getAllFiles(dirPath, arrayOfFiles) {
  files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });

  return arrayOfFiles;
}

const manageDir = path.join(__dirname, 'src', 'app', 'manage');
const authDir = path.join(__dirname, 'src', 'components');

let allFiles = getAllFiles(manageDir, []);
allFiles = allFiles.concat(getAllFiles(authDir, []));
allFiles.push(path.join(__dirname, 'src', 'app', 'page.tsx'));
allFiles.push(path.join(__dirname, 'src', 'app', 'layout.tsx'));

let replacementsCount = 0;

allFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  let originalContent = content;

  // Typography cleanup
  content = content.replace(/uppercase tracking-\[0\.\d+em\]/g, 'font-semibold');
  content = content.replace(/uppercase tracking-widest/g, 'font-semibold');
  content = content.replace(/uppercase tracking-wider/g, 'font-semibold');
  
  // Safe general uppercase text modifier removal 
  content = content.replace(/ uppercase /g, ' ');
  content = content.replace(/ tracking-\[0\.\d+em\] /g, ' ');
  content = content.replace(/ tracking-widest /g, ' ');
  content = content.replace(/ tracking-wider /g, ' ');
  
  // Edge case classes end of string
  content = content.replace(/ uppercase"/g, '"');
  content = content.replace(/ tracking-widest"/g, '"');
  content = content.replace(/ tracking-wider"/g, '"');
  content = content.replace(/ tracking-\[0\.\d+em\]"/g, '"');
  
  // Change text-[10px] to text-xs for better readability without caps
  content = content.replace(/text-\[10px\]/g, 'text-xs');

  // Fix multiple spaces
  content = content.replace(/  +/g, ' ');

  if (originalContent !== content) {
    fs.writeFileSync(file, content, 'utf-8');
    replacementsCount++;
  }
});

console.log(`Updated typography in ${replacementsCount} files!`);
