import re, sys

files = ['ref/webview/assets/app-shared-dc7535e633d7.css',
         'ref/webview/assets/app-initial-e7c27dd40beb.css',
         'ref/webview/assets/app-primary-71492d0e9e92.css']

decls = {}
for fp in files:
    css = open(fp, encoding='utf-8', errors='replace').read()
    for m in re.finditer(r'(--[a-z0-9-]+)\s*:\s*([^;{}]+)', css):
        decls[m.group(1)] = m.group(2).strip()

sys.setrecursionlimit(10000)

def pick_dark(v):
    i = v.find('var(--lightningcss-dark,')
    if i != -1:
        start = i + len('var(--lightningcss-dark,')
        depth = 1
        p = start
        while p < len(v) and depth:
            if v[p] == '(':
                depth += 1
            elif v[p] == ')':
                depth -= 1
            p += 1
        return v[start:p-1].strip()
    i = v.find('var(--lightningcss-light,')
    if i != -1:
        start = i + len('var(--lightningcss-light,')
        depth = 1
        p = start
        while p < len(v) and depth:
            if v[p] == '(':
                depth += 1
            elif v[p] == ')':
                depth -= 1
            p += 1
        return v[start:p-1].strip()
    return v

cache = {}

def resolve(name, depth=0):
    if name in cache:
        return cache[name]
    if depth > 10:
        return None
    v = decls.get(name)
    if v is None:
        return None
    v = pick_dark(v)
    out = ''
    i = 0
    while i < len(v):
        j = v.find('var(', i)
        if j == -1:
            out += v[i:]
            break
        out += v[i:j]
        start = j + 4
        d = 1
        p = start
        while p < len(v) and d:
            if v[p] == '(':
                d += 1
            elif v[p] == ')':
                d -= 1
            p += 1
        inner = v[start:p-1]
        if ',' in inner:
            nm, fb = inner.split(',', 1)
            nm = nm.strip()
            r = resolve(nm, depth + 1) if nm.startswith('--') else None
            out += r if r else fb.strip()
        elif inner.startswith('--'):
            r = resolve(inner.strip(), depth + 1)
            out += r if r else 'var(%s)' % inner
        else:
            out += inner
        i = p
    cache[name] = out
    return out

keys = sys.argv[1:] or [
    '--color-surface', '--color-surface-secondary', '--color-surface-tertiary',
    '--color-surface-elevated', '--color-surface-elevated-secondary',
    '--color-text-primary', '--color-text-secondary', '--color-text-tertiary',
    '--color-border', '--color-border-strong', '--color-border-light',
    '--color-background-primary-solid', '--color-background-primary-soft',
    '--color-background-secondary', '--color-background-elevated-primary',
    '--color-background-elevated-secondary', '--color-ring',
    '--radius-xl-base', '--radius-4xl', '--corner-radius-scale', '--spacing',
    '--gray-0', '--gray-50', '--gray-100', '--gray-950',
]

for k in keys:
    raw = decls.get(k, '-')
    print(f'{k:42} = {resolve(k)}')
