import os
import glob

def replace_in_file(filepath, replacements):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    for old, new in replacements.items():
        new_content = new_content.replace(old, new)
        
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

replacements = {
    '@/components/Header': '@/components/layout/Header',
    '@/components/AuthSidebar': '@/components/layout/AuthSidebar',
    '@/components/report/LocationDetector': '@/utils/LocationDetector',
    '@/lib/services/reportService': '@/services/reportService',
    '../components/Header': '../../components/layout/Header', # Just in case relative imports are used
}

for root, dirs, files in os.walk('frontend/src'):
    for file in files:
        if file.endswith('.ts') or file.endswith('.tsx'):
            replace_in_file(os.path.join(root, file), replacements)

# Also fix playwright config and test files for the move of e2e
# playwright.config.ts has "testDir: './e2e'"
print("Done fixing frontend imports.")
