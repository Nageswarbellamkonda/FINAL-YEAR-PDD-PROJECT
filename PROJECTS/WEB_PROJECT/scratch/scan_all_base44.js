import fs from 'fs';
import path from 'path';

const searchRegex = /base44/i;
const excludeDirs = ['node_modules', '.git', 'dist', 'build', '.gemini'];
const results = {};

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!excludeDirs.includes(file)) {
        scanDirectory(fullPath);
      }
    } else if (stat.isFile() && /\.(js|jsx|ts|tsx|json|html|css|scss)$/i.test(file)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      const fileMatches = [];

      lines.forEach((line, index) => {
        if (searchRegex.test(line)) {
          fileMatches.push({ line: index + 1, content: line.trim() });
        }
      });

      if (fileMatches.length > 0) {
        results[fullPath] = fileMatches;
      }
    }
  }
}

scanDirectory(path.resolve('./src'));
scanDirectory(path.resolve('.')); // to get package.json, vite.config.js, etc. (we'll limit to root files)

// Only include root files, not everything (handled by recursive scan of src)
const rootDir = path.resolve('.');
const rootFiles = fs.readdirSync(rootDir);
for (const file of rootFiles) {
  const fullPath = path.join(rootDir, file);
  if (fs.statSync(fullPath).isFile() && /\.(js|jsx|ts|tsx|json|html)$/i.test(file)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');
    const fileMatches = [];

    lines.forEach((line, index) => {
      if (searchRegex.test(line)) {
        fileMatches.push({ line: index + 1, content: line.trim() });
      }
    });

    if (fileMatches.length > 0) {
      results[fullPath] = fileMatches;
    }
  }
}

// Write the report to an artifact
let report = '# Base44 Dependency Scan Report\n\n';

let totalFiles = 0;
let totalOccurrences = 0;

for (const [filePath, matches] of Object.entries(results)) {
  totalFiles++;
  totalOccurrences += matches.length;
  report += `## ${path.relative(rootDir, filePath)}\n`;
  report += `Occurrences: ${matches.length}\n\n`;
  report += '```javascript\n';
  matches.forEach(m => {
    report += `L${m.line}: ${m.content}\n`;
  });
  report += '```\n\n';
}

report = `## Summary\nTotal Files with Base44 dependencies: ${totalFiles}\nTotal Occurrences: ${totalOccurrences}\n\n` + report;

fs.writeFileSync('scratch/base44_scan_report.md', report);
console.log(`Scan complete. Found ${totalOccurrences} occurrences in ${totalFiles} files.`);
