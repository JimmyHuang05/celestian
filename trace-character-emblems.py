"""Trace supplied two-tone character emblems into transparent path-only SVGs."""
import json
import sys
import tempfile
import xml.etree.ElementTree as ET
from pathlib import Path
from PIL import Image

sys.path.insert(0, 'D:/Projects/celestian/tools/vector-trace')
import vtracer

ROOT = Path(__file__).resolve().parent
SOURCE = Path('C:/Users/admin/.codex/generated_images/01a141bb-3063-71d2-a63d-5f66a21bc6ea')
ITEMS = [
    ('ec561630-2810-41a0-8524-857bfa8365e1', 'day-fourteen-tower', 'exec-2b59aec4-db45-434f-ab9d-c4be4392fd84.png'),
    ('f967a2c8-252b-4a1e-8e55-9ac5fe1597e2', 'isabella-emblem', 'exec-e7db520d-38bf-48af-9421-65a229b40f1e.png'),
    ('2a9bf85c-f975-4054-9597-5f4f11414983', 'elowen-order-justice', 'exec-8ed7a5ff-3ba9-4259-9e58-221e9b1b73cb.png'),
    ('5bf8f6ab-da96-4cc6-a715-45050f289dd5', 'xianna-tides', 'exec-be387d78-ec76-49a3-8f14-0aaed8d20cc6.png'),
]
ns = '{http://www.w3.org/2000/svg}'
entries_path = ROOT / 'public/character-profile/characters.json'
entries = json.loads(entries_path.read_text(encoding='utf-8'))
with tempfile.TemporaryDirectory(prefix='celestian-emblem-') as temp:
    temp = Path(temp)
    for entry_id, name, source in ITEMS:
        im = Image.open(SOURCE / source).convert('L')
        width, height = im.size
        groups = []
        for label, low, high, opacity in [('secondary', 85, 220, '.5'), ('primary', 0, 85, '1')]:
            mask = im.point(lambda value: 0 if low <= value < high else 255)
            mask.save(temp / 'mask.png')
            vtracer.convert_image_to_svg_py(str(temp / 'mask.png'), str(temp / 'trace.svg'), colormode='binary', mode='spline', filter_speckle=24, corner_threshold=70, length_threshold=3.5, max_iterations=10, splice_threshold=45, path_precision=2)
            paths = ET.parse(temp / 'trace.svg').getroot().findall(f'{ns}path')
            content = ''.join('<path d="' + path.attrib['d'].strip() + '"' + (' transform="' + path.attrib['transform'] + '"' if 'transform' in path.attrib else '') + '/>' for path in paths)
            groups.append(f'<g id="{label}" fill="#000" opacity="{opacity}">{content}</g>')
        svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}">' + ''.join(groups) + '</svg>\n'
        output = ROOT / f'public/character-profile/{name}.svg'
        output.write_text(svg, encoding='utf-8')
        entry = next(item for item in entries if item['id'] == entry_id)
        entry['emblem'] = f'/character-profile/{name}.svg'
        print(entry['name'], output.name, len(svg.encode()), 'bytes', svg.count('<path'), 'paths')
entries_path.write_text(json.dumps(entries, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
