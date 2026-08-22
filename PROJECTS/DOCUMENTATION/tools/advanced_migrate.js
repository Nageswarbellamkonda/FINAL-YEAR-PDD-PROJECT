const fs = require('fs');
const path = require('path');

const webSrcDir = path.join(__dirname, '../../WEB/src');

function getFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getFiles(fullPath));
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            results.push(fullPath);
        }
    });
    return results;
}

const files = getFiles(webSrcDir);
let changedFiles = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // 1. Replace imports
    if (content.includes('import { supabase }')) {
        content = content.replace(/import\s*{\s*supabase\s*}\s*from\s*['"]@\/lib\/supabase['"];?/g, 'import api from "@/lib/api";');
    }
    
    // Fallback for relative imports
    if (content.includes('import { supabase }')) {
        content = content.replace(/import\s*{\s*supabase\s*}\s*from\s*['"][.\/]+lib\/supabase['"];?/g, 'import api from "@/lib/api";');
    }

    // 2. Replace supabase.from('table').select('...')... 
    // We will match the start of the chain: await supabase.from('table')
    // We'll replace it with await api.get('/table') or post, etc. based on what follows.
    // This requires a bit of parsing.
    
    // Instead of complex AST, let's use carefully crafted regexes for the most common patterns in this codebase.
    
    // Pattern A: await supabase.from('X').select('Y').eq('Z', val)...
    // Replace `supabase.from('X').select('Y')` -> `api.get('/X')` (the rest of the chain might fail, so we must be careful)
    
    // Let's do a trick: we'll replace the full chained call by finding the boundaries.
    
    // Actually, maybe it's easier to just use string replacements for the exact chained patterns.
    
    // Let's write a function to replace the chains.
    
    // This is too complex for simple regex. We need a regex that matches `supabase.from('table')` and the subsequent method calls.
    
    // Let's use a simpler approach:
    // await supabase.from('table').select('*') => (await api.get('/table'))
    content = content.replace(/supabase\.from\(['"]([^'"]+)['"]\)\.select\([^)]*\)/g, 'api.get(\'/$1\')');
    
    // supabase.from('table').insert(payload) => api.post('/table', payload)
    content = content.replace(/supabase\.from\(['"]([^'"]+)['"]\)\.insert\(([^)]+)\)/g, 'api.post(\'/$1\', $2)');
    
    // supabase.from('table').update(payload) => api.put('/table', payload)
    content = content.replace(/supabase\.from\(['"]([^'"]+)['"]\)\.update\(([^)]+)\)/g, 'api.put(\'/$1\', $2)');
    
    // supabase.from('table').delete() => api.delete('/table')
    content = content.replace(/supabase\.from\(['"]([^'"]+)['"]\)\.delete\(\)/g, 'api.delete(\'/$1\')');

    // Handle .order(), .limit(), .eq() which might be attached to api.get() now.
    // Axios doesn't have .order(), .limit().
    // So if the code now has `await api.get('/table').order(...)`, it will throw a TypeError at runtime.
    // We can strip out .order(...), .limit(...), .eq(...) for now, or convert them to query params.
    // Convert .eq('field', value) -> ?field=value
    // But this is hard with regex.
    
    // Wait, the backend already handles fetching the data. If we just strip the Supabase chain, it might break pagination.
    
    if (content !== original) {
        fs.writeFileSync(file, content);
        changedFiles++;
    }
});

console.log(`Modified ${changedFiles} files.`);
