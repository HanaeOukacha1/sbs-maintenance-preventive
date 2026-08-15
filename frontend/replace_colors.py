import os, glob, re

replacements = {
    r"'#ffffff'": "'var(--bg-panel)'",
    r"'#fff'": "'var(--bg-panel)'",
    r'"#ffffff"': '"var(--bg-panel)"',
    r'"#fff"': '"var(--bg-panel)"',
    r"'#f8fafc'": "'var(--bg-hover)'",
    r'"#f8fafc"': '"var(--bg-hover)"',
    r"'#f1f5f9'": "'var(--bg-app)'",
    r'"#f1f5f9"': '"var(--bg-app)"',
    r"'#e2e8f0'": "'var(--border-light)'",
    r'"#e2e8f0"': '"var(--border-light)"',
    r"'#cbd5e1'": "'var(--border-strong)'",
    r'"#cbd5e1"': '"var(--border-strong)"',
    r"'#94a3b8'": "'var(--text-muted)'",
    r'"#94a3b8"': '"var(--text-muted)"',
    r"'#64748b'": "'var(--text-muted)'",
    r'"#64748b"': '"var(--text-muted)"',
    r"'#334155'": "'var(--text-main)'",
    r'"#334155"': '"var(--text-main)"',
    r"'#0f172a'": "'var(--text-dark)'",
    r'"#0f172a"': '"var(--text-dark)"'
}

files = glob.glob('src/**/*.jsx', recursive=True)
count = 0
for f in files:
    if 'Login.jsx' in f: continue
    
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    new_content = content
    for pattern, replacement in replacements.items():
        new_content = re.sub(pattern, replacement, new_content, flags=re.IGNORECASE)
        
    if new_content != content:
        with open(f, 'w', encoding='utf-8') as file:
            file.write(new_content)
        count += 1

print(f'Updated {count} files.')
