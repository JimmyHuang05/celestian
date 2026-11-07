"""Convert authored legacy polygons into an editable, native-resolution draft."""
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path
from collections import Counter

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / 'github/public/map/world-240705-base-v2'
Image.MAX_IMAGE_PIXELS = 250_000_000
paths = list(ET.parse(ROOT / 'github/archive/2026-11-05-map/assets/regions.svg').getroot())
records = json.loads((ROOT / 'design/map-legacy-migration/region-metadata-response.json').read_text(encoding='utf-8'))['data']
by_id = {row['region_id']: row for row in records}
palette = ['#df8960', '#69b7c7', '#baa0d5', '#8dbd81', '#d4ba62', '#d985a4', '#6e9dd3', '#c29e70', '#88b6a9', '#b5b76a']
group_colors = {}
regions = []
image = Image.new('L', (21600, 10400))
draw = ImageDraw.Draw(image)
for index, path in enumerate(paths, 1):
    rid = path.get('id')
    row = by_id.get(rid, {})
    effective = row
    if row.get('follow_primary'):
        candidates = [r for r in records if r.get('group_id') == row.get('group_id') and
                      (r.get('sub_group_id') == row.get('sub_group_id') and r.get('is_sub_primary') if row.get('sub_group_id') else r.get('is_primary'))]
        if candidates:
            effective = candidates[0]
    group = row.get('group_id') or ''
    if group and group not in group_colors:
        group_colors[group] = palette[len(group_colors) % len(palette)]
    color = group_colors.get(group, palette[(index - 1) % len(palette)])
    name = effective.get('title') or row.get('sub_group_id') or group or f'区域 {rid.removeprefix("region_")}'
    regions.append({'id': index, 'name': name, 'color': color,
                    'source': {'regionId': rid, 'groupId': group, 'subGroupId': row.get('sub_group_id') or '', 'metadata': row, 'geometry': {'path': path.get('d', ''), 'scale': 2}}})
    d = path.get('d', '')
    if set(re.findall('[A-Za-z]', d)) - set('MLZ') or d.count('M') != 1:
        raise ValueError(f'Unsupported path {rid}')
    numbers = [float(n) for n in re.findall(r'-?\d+(?:\.\d+)?', d)]
    points = [(round(numbers[i] * 2), round(numbers[i + 1] * 2)) for i in range(0, len(numbers), 2)]
    # Match SVG document stacking order at shared/overlapping boundaries.
    draw.polygon(points, fill=index)
with Image.open(ROOT / 'WorldMap_240705_svg.png') as land:
    ocean = land.getchannel('A').point(lambda value: 255 if value < 128 else 0)
    image.paste(0, mask=ocean)
    ocean.close()
tiles = []
counts = Counter()
for y in range(0, 10400, 256):
    for x in range(0, 21600, 256):
        crop = image.crop((x, y, x + 256, y + 256))
        if crop.getbbox() is None:
            crop.close(); continue
        values = crop.tobytes(); runs = []
        for value, count in enumerate(crop.histogram()):
            if value: counts[value] += count
        i = 0
        while i < len(values):
            value = values[i]; start = i; i += 1
            while i < len(values) and values[i] == value:
                i += 1
            if value: runs.append([start, i - start, value])
        tiles.append({'key': f'{x // 256},{y // 256}', 'runs': runs})
        crop.close()
    if y % 2048 == 0:
        print(f'Converted rows through {y + 256}', flush=True)
image.close()
regions.sort(key=lambda region: counts[region['id']], reverse=True)
output = {'format': 'celestian-map-paint-v1',
          'world': {'width': 21600, 'height': 10400, 'sha': '2acc2256324424aaf482a78d194fab5bfd899e1643c632db5c2526c983b0bc5e'},
          'regions': regions, 'tiles': tiles}
destination = PUBLIC / 'legacy-editable.json'
destination.write_text(json.dumps(output, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
report = {'sourceRegions': len(regions), 'editableNonempty': sum(counts[r['id']] > 0 for r in regions),
          'requiresAlignment': [r['source']['regionId'] for r in regions if not counts[r['id']]],
          'note': 'Original SVG path data retained in source.geometry, including any tiny polygon clipped outside the new land mask.'}
(PUBLIC / 'legacy-migration-report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
(PUBLIC / 'legacy-region-metadata.json').write_text(json.dumps({'source': 'https://celestian.jimmyhuang.cn/api/map/regions', 'captured': '2026-11-05', 'data': records}, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'regions': len(regions), 'configured': sum(r['source']['regionId'] in by_id for r in regions), 'nonempty': sum(count > 0 for count in counts.values()), 'tiles': len(tiles), 'bytes': destination.stat().st_size}), flush=True)
