const fs = require('fs');
const path = require('path');

function findTables(dir) {
    let tables = new Set();
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            findTables(fullPath).forEach(t => tables.add(t));
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const matches = content.matchAll(/supabase\.from\(['"](.*?)['"]\)/g);
            for (const match of matches) {
                tables.add(match[1]);
            }
        }
    }
    return tables;
}

const allTables = findTables('c:/PDD WEB PROJECT/src');
console.log(Array.from(allTables).join('\n'));
