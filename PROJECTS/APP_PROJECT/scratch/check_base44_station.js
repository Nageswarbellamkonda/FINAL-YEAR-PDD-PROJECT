import fs from 'fs';

const content = fs.readFileSync('src/pages/StationDashboard.jsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, index) => {
  if (line.toLowerCase().includes('base44')) {
    console.log(`Line ${index + 1}: ${line}`);
  }
});
