import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

const base44Files = [];

walkDir('src/pages', (filePath) => {
  if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.toLowerCase().includes('base44')) {
      base44Files.push(filePath);
    }
  }
});

console.log("Remaining pages using base44:", base44Files);
