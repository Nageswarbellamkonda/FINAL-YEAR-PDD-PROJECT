const fs = require('fs');
const path = require('path');

function findUsages(dir, table) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            findUsages(fullPath, table);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('')) {
                console.log(\n---  ---);
                const lines = content.split('\n');
                lines.forEach((line, i) => {
                    if (line.includes(table)) {
                        console.log(${i+1}: );
                    }
                });
            }
        }
    }
}

console.log("=== citizen_profiles ===");
findUsages('c:/PDD WEB PROJECT/src', 'citizen_profiles');
console.log("=== police_profiles ===");
findUsages('c:/PDD WEB PROJECT/src', 'police_profiles');
console.log("=== admins ===");
findUsages('c:/PDD WEB PROJECT/src', 'admins');
console.log("=== user_profiles ===");
findUsages('c:/PDD WEB PROJECT/src', 'user_profiles');

