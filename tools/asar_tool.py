#!/usr/bin/env python3
"""Minimal ASAR reader/writer-free extractor. No deps."""
import json, os, struct, sys

def load_header(path):
    with open(path, 'rb') as f:
        head = f.read(16)
        a, b, c, d = struct.unpack('<IIII', head)
        json_size = d
        f.seek(16)
        raw = f.read(json_size + 8)
        txt = raw.decode('utf-8', 'replace')
        header, _ = json.JSONDecoder().raw_decode(txt)
        # data section starts after the whole header pickle
        data_offset = 8 + b
    return header, data_offset

def walk(node, prefix=''):
    for name, info in node.get('files', {}).items():
        p = prefix + '/' + name
        if 'files' in info:
            yield from walk(info, p)
        else:
            yield p, info

def main():
    if len(sys.argv) < 3:
        print('usage: asar_tool.py <list|extract|cat> <asar> [outdir|path]')
        return
    mode, asar = sys.argv[1], sys.argv[2]
    header, data_offset = load_header(asar)
    entries = list(walk(header))
    if mode == 'list':
        for p, info in entries:
            print(f"{info.get('size', 0)}\t{p}")
    elif mode == 'extract':
        out = sys.argv[3]
        with open(asar, 'rb') as f:
            for p, info in entries:
                if info.get('unpacked'):
                    continue
                dst = os.path.join(out, p.lstrip('/'))
                os.makedirs(os.path.dirname(dst), exist_ok=True)
                f.seek(data_offset + int(info['offset']))
                with open(dst, 'wb') as g:
                    g.write(f.read(int(info['size'])))
        print(f'extracted {len(entries)} entries -> {out}')
    elif mode == 'cat':
        target = sys.argv[3].lstrip('/')
        with open(asar, 'rb') as f:
            for p, info in entries:
                if p.lstrip('/') == target:
                    f.seek(data_offset + int(info['offset']))
                    sys.stdout.buffer.write(f.read(int(info['size'])))
                    return
        print('not found', target, file=sys.stderr)

main()
