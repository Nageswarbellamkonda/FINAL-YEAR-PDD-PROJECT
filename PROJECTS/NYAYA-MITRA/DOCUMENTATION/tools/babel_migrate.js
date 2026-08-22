const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

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
let changedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('supabase')) return;

    try {
        const ast = parser.parse(content, {
            sourceType: 'module',
            plugins: ['jsx']
        });

        let changed = false;
        let needsApiImport = false;

        traverse(ast, {
            ImportDeclaration(path) {
                // Replace import { supabase } from "@/lib/supabase" with api
                if (path.node.source.value.includes('lib/supabase')) {
                    path.node.specifiers = [
                        t.importDefaultSpecifier(t.identifier('api'))
                    ];
                    path.node.source.value = '@/lib/api';
                    changed = true;
                }
            },
            CallExpression(path) {
                // Identify supabase.from('X')....
                // It's a chain of MemberExpressions and CallExpressions
                // We'll walk up the chain if we find a CallExpression where callee is MemberExpression (e.g. supabase.from)
                
                // Let's find the innermost supabase.from('table')
                let node = path.node;
                
                // Check if this is supabase.something
                const isSupabaseCall = (n) => {
                    if (t.isMemberExpression(n.callee)) {
                        if (t.isIdentifier(n.callee.object, { name: 'supabase' })) {
                            return true;
                        }
                    }
                    return false;
                };

                // We want to transform the whole chain.
                // It's easier to replace supabase.from('X') with api.get('/X')
                // Wait! If we just replace `supabase.from('X').select('*').order('Y')`
                // Let's construct a generic API payload based on the chain!
                
                // For simplicity in this script, let's just find the root `supabase.from` and change it to `api.get` if it's select, or `api.post` if insert, etc.
                
                // Actually, let's replace the ENTIRE chain `supabase.from('x').select().eq()...` with `api.post('/db/x/query', { chain: [...] })`
                // This preserves 100% of the UI intent without us having to write 55 endpoints right now! We can map them all to a generic backend query executor, and then explicitly define the required ones.
            }
        });

        if (changed) {
            // fs.writeFileSync(file, generate(ast).code);
            changedCount++;
        }
    } catch (e) {
        console.error(`Error parsing ${file}:`, e);
    }
});

console.log(`Processed ${changedCount} files.`);
