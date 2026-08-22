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

def fix_duplicate_api_import(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.split('\n')
    new_lines = []
    api_imported = False
    changed = False

    for line in lines:
        if re.search(r'import\s+api\s+from\s+[\'"](?:@/lib/api|\.\./lib/api|\./lib/api)[\'"]', line):
            if api_imported:
                changed = True
                continue # Skip duplicate
            api_imported = True
        new_lines.append(line)

    if changed:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write('\n'.join(new_lines))
        return True
    return False

if __name__ == '__main__':
    files = get_files(WEB_SRC)
    changed = 0
    for file in files:
        if fix_duplicate_api_import(file):
            changed += 1
            print(f"Fixed duplicate import in {os.path.basename(file)}")
    print(f"\nTotal files fixed: {changed}")
