import os
import re

WEB_SRC = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../WEB/src'))

def get_files(directory):
    files_list = []
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.jsx') or file.endswith('.js'):
                files_list.append(os.path.join(root, file))
    return files_list

# Pattern breakdown:
# We match `supabase.from('TABLE')`
# Then we match any combination of chained methods: .select(...), .eq(...), .order(...)
# Because it's hard to distinguish insert vs select if we match globally, we can do it in passes.

# 1. SELECT chain
select_pattern = re.compile(r"supabase\.from\(['\"]([^'\"]+)['\"]\)\.select\([^)]*\)(?:\.(?:order|limit|eq|single|maybeSingle|neq|lt|gt|lte|gte|in|contains|match|or|textSearch)\([^)]*\))*")
# 2. INSERT chain
insert_pattern = re.compile(r"supabase\.from\(['\"]([^'\"]+)['\"]\)\.insert\(([^)]+)\)(?:\.(?:select|single)\([^)]*\))*")
# 3. UPDATE chain
update_pattern = re.compile(r"supabase\.from\(['\"]([^'\"]+)['\"]\)\.update\(([^)]+)\)(?:\.(?:eq|in|match|select|single)\([^)]*\))*")
# 4. DELETE chain
delete_pattern = re.compile(r"supabase\.from\(['\"]([^'\"]+)['\"]\)\.delete\(\)(?:\.(?:eq|in|match)\([^)]*\))*")
# 5. RPC chain
rpc_pattern = re.compile(r"supabase\.rpc\(['\"]([^'\"]+)['\"](?:,\s*([^)]+))?\)")
# 6. Auth
auth_user_pattern = re.compile(r"supabase\.auth\.getUser\(\)")

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    
    # Imports
    content = re.sub(r'import\s*{\s*supabase\s*}\s*from\s*[\'"]@/lib/supabase[\'"];?', 'import api from "@/lib/api";', content)
    content = re.sub(r'import\s*supabase\s*from\s*[\'"]@/lib/supabase[\'"];?', 'import api from "@/lib/api";', content)

    # Replaces
    content = select_pattern.sub(r"api.get('/\1')", content)
    content = insert_pattern.sub(r"api.post('/\1', \2)", content)
    content = update_pattern.sub(r"api.put('/\1', \2)", content)
    content = delete_pattern.sub(r"api.delete('/\1')", content)
    
    # RPC: await supabase.rpc('name', payload) -> api.post('/rpc/name', payload)
    content = rpc_pattern.sub(lambda m: f"api.post('/rpc/{m.group(1)}', {m.group(2) or '{}'})", content)
    
    # Auth
    content = auth_user_pattern.sub(r"api.get('/auth/user')", content)

    # Destructuring { data, error } is safely preserved because our interceptor mimics it!

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

if __name__ == '__main__':
    files = get_files(WEB_SRC)
    changed = 0
    for file in files:
        if process_file(file):
            changed += 1
            print(f"Migrated {os.path.basename(file)}")
    print(f"\nTotal files migrated: {changed}")
