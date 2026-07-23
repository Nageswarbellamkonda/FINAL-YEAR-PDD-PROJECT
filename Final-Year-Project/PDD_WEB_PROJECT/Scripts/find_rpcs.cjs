const fs = require('fs');
const path = require('path');

function findRPCs(dir) {
    let rpcs = new Set();
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            findRPCs(fullPath).forEach(t => rpcs.add(t));
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const matches = content.matchAll(/supabase\.rpc\(['"](.*?)['"]\)/g);
            for (const match of matches) {
                rpcs.add(match[1]);
            }
        }
    }
    return rpcs;
}

const allRPCs = findRPCs('c:/PDD WEB PROJECT/src');
console.log(Array.from(allRPCs).join('\n'));
