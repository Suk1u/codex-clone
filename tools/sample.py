import subprocess, sys

PNG = sys.argv[1]
W, H = 901, 1095
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', PNG, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
                     capture_output=True).stdout

def px(x, y):
    i = (y * W + x) * 3
    r, g, b = raw[i], raw[i+1], raw[i+2]
    return '#%02x%02x%02x' % (r, g, b)

points = {
    'tabbar_bg': (700, 72),
    'tab_active_bg': (300, 72),
    'sidebar_bg': (200, 300),
    'sidebar_bg2': (150, 480),
    'main_bg': (700, 350),
    'main_bg2': (760, 250),
    'window_bg_top': (500, 60),
    'sidebar_row_text': (0, 0),
    'composer_bg': (500, 500),
    'composer_border': (0, 0),
    'divider': (452, 300),
    'outside_desktop': (20, 20),
}
for name, (x, y) in points.items():
    print(f'{name:20} {px(x, y)}  @({x},{y})')

# scan a horizontal line to find boundaries
print('\n-- horizontal scan y=300 --')
prev = None
for x in range(60, 900, 1):
    c = px(x, 300)
    if c != prev:
        print(f'x={x} {c}')
        prev = c
