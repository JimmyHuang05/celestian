"""Apply a downloaded painter draft to the local atlas, preserving metadata/colors."""
import json
import re
import shutil
import sys
import tempfile
from datetime import datetime
from pathlib import Path
import xml.etree.ElementTree as ET
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT.parent / 'tools/vector-trace'))
import vtracer

NS = 'http://www.w3.org/2000/svg'
ET.register_namespace('', NS)
PUBLIC = ROOT / 'public/map/world-240705-base-v2'
draft_path = Path(sys.argv[1])
draft = json.loads(draft_path.read_text(encoding='utf-8'))
assert draft['format'] == 'celestian-map-paint-v1'
assert draft['world']['width'] == 21600 and draft['world']['height'] == 10400
assert draft['world']['sha'] == '2acc2256324424aaf482a78d194fab5bfd899e1643c632db5c2526c983b0bc5e'
tree = ET.parse(PUBLIC / 'legacy-regions.svg')
paths = {p.get('id'): p for p in tree.getroot().iter(f'{{{NS}}}path') if p.get('data-region-id')}
regions = {r['id']: r for r in draft['regions']}
assert len(regions) == len(draft['regions'])
for r in regions.values():
    assert r.get('source', {}).get('regionId') in paths, 'Unmapped region: ' + r['name']
pieces = {i: [] for i in regions}
for tile in draft['tiles']:
    tx, ty = map(int, tile['key'].split(','))
    assert 0 <= tx < 85 and 0 <= ty < 41
    for start, length, owner in tile['runs']:
        assert owner in regions and 0 <= start < start + length <= 65536
        end = start + length
        while start < end:
            stop = min(end, (start // 256 + 1) * 256)
            pieces[owner].append((tx * 256 + start % 256, ty * 256 + start // 256, stop - start))
            start = stop

backup = ROOT / 'archive' / ('map-painter-publish-' + datetime.now().strftime('%Y%m%d-%H%M%S'))
backup.mkdir(parents=True)
shutil.copy2(draft_path, backup / 'paint-draft.json')
for name in ['legacy-regions.svg', 'legacy-regions.json', 'legacy-region-metadata.json']:
    shutil.copy2(PUBLIC / name, backup / name)

report = []
with tempfile.TemporaryDirectory() as temp:
    for owner, region in regions.items():
        segments = pieces[owner]
        target = paths[region['source']['regionId']]
        if not segments:
            target.set('d', 'M0,0Z')
            continue
        x0 = min(p[0] for p in segments) - 2
        y0 = min(p[1] for p in segments) - 2
        x1 = max(p[0] + p[2] for p in segments) + 2
        y1 = max(p[1] for p in segments) + 3
        image = Image.new('L', (x1 - x0, y1 - y0), 255)
        draw = ImageDraw.Draw(image)
        for x, y, length in segments:
            draw.line((x - x0, y - y0, x - x0 + length - 1, y - y0), fill=0)
        png, svg = Path(temp) / 'mask.png', Path(temp) / 'trace.svg'
        image.save(png); image.close()
        vtracer.convert_image_to_svg_py(str(png), str(svg), colormode='binary', mode='polygon',
            filter_speckle=0, corner_threshold=60, length_threshold=1, path_precision=2)
        output = []
        for p in ET.parse(svg).getroot().iter(f'{{{NS}}}path'):
            d = p.get('d', '')
            assert not (set(re.findall('[A-Za-z]', d)) - set('MLZ'))
            transform = re.findall(r'-?\d+(?:\.\d+)?', p.get('transform', ''))
            dx, dy = map(float, transform) if transform else (0, 0)
            numbers = iter(re.findall(r'-?\d+(?:\.\d+)?', d))
            coordinates = []
            for a, b in zip(numbers, numbers):
                coordinates.extend([(float(a) + dx + x0) / 2, (float(b) + dy + y0) / 2])
            values = iter(coordinates)
            output.append(re.sub(r'-?\d+(?:\.\d+)?', lambda _: f'{next(values):g}', d))
        target.set('d', ' '.join(output))
        target.set('fill-rule', 'evenodd')
        report.append({'region': region['source']['regionId'], 'pixels': sum(p[2] for p in segments)})
        print(region['source']['regionId'], flush=True)
temporary = PUBLIC / 'legacy-regions.next.svg'
tree.write(temporary, encoding='utf-8', xml_declaration=True)
(PUBLIC / 'legacy-regions.svg').write_bytes(temporary.read_bytes())
(backup / 'report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print('Published', len(report), 'regions. Backup:', backup)
