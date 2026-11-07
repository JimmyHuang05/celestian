"""Index the authored glyphs without changing a path, position, or rotation.

Names were checked against the source artwork. Regenerate after tracing labels.svg;
the coverage/count assertions intentionally require review when the artwork changes.
"""
import hashlib
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'public/map/world-240705-base-v2'
# Reading order of the 51 visually reviewed blocks. Repeated routes are intentional.
NAMES = '''北洋航线|Northern Ocean Route
永静海|Hushnow
维多利亚洲际航线|Victoria Intercontinental Route
无礼之湾|Uncouth
极夜航线|Longnight Route
阴影海岸|Shadow Coast
昂格莱德之海|Neal Ungerleider
鸢尾花东方航线|Iris Eastern Route
艾尔湾|Eyre
北湖|North Lake
俄提斯洋|Orthys
喧哗之海|Tumult
拉库纳|Lacuna
昂格莱德航线|Neal Ungerleider Route
阿斯塔|Asta
汀|Tring
北风暴洋航线|North Arrogance Route
昂格莱德航线|Neal Ungerleider Route
好运之海|Serendipity
水|Aqua
嚎风隘口|Howling Pass
圣塔洛斯航线|Santalos Route
中央风暴洋航线|Central Arrogance Route
奥术之海|Arcane
无烬海|Ashless Bay
霍德沿岸航线|Hode Coastal Route
白昼海峡|Daylight Strait
水晶池|Crialago
星夜之门|Night Gate
鸢尾花贸易航线|Iris Trade Route
风暴洋|Arrogance
香佩安航线|Champieian Route
橡木之桥|Oak Bridge
橡木航线|Oak Route
海岸贸易航线|Coast Trade Route
罗拉克之海|Rolac
深渊|Abyss
边界航线|Border Route
回声之海|Echo Sea
南风暴洋航线|South Arrogance Route
泰拉航线|Tera Route
发现者航线|Discoverer Route
大缺口|The Great Fissure
哀悼之湾|Lamentation Bay
神谕之海|The Sea of Oracle
珊瑚海|Coral Sea
哀伤之湾|Mourning Bay
珊瑚贸易航线|Coral Trade Route
边界航线|Border Route
海德拉瑟湾|Hydrathor
海德拉瑟航线|Hydrathor Route'''.splitlines()


def union(a, b):
    return [min(a[0], b[0]), min(a[1], b[1]), max(a[2], b[2]), max(a[3], b[3])]


source = ASSETS / 'labels.svg'
paths = {}
for path in ET.parse(source).getroot():
    assert not re.search(r'[ACHQSTVachqstv]', path.get('d')), 'Only the existing polygon trace is supported'
    translate = list(map(float, re.findall(r'-?[\d.]+', path.get('transform'))))
    numbers = list(map(float, re.findall(r'-?[\d.]+', path.get('d'))))
    xs, ys = numbers[::2], numbers[1::2]
    paths[path.get('id')] = [min(xs) + translate[0], min(ys) + translate[1], max(xs) + translate[0], max(ys) + translate[1]]
groups = [{'bounds': box, 'parts': [key]} for key, box in paths.items()]
while True:
    changed = False
    for i in range(len(groups) - 1, -1, -1):
        a = groups[i]['bounds']
        for j in range(i):
            b = groups[j]['bounds']
            if a[0] <= b[2] + 90 and a[2] >= b[0] - 90 and a[1] <= b[3] + 90 and a[3] >= b[1] - 90:
                groups[j]['bounds'] = union(a, b)
                groups[j]['parts'] += groups.pop(i)['parts']
                changed = True
                break
        if changed:
            break
    if not changed:
        break
groups.sort(key=lambda g: (g['bounds'][1], g['bounds'][0]))
assert len(groups) == len(NAMES) == 51, 'Artwork grouping changed; visually review the names again'
for group, names in zip(groups, NAMES):
    group['title'], group['foreignTitle'] = names.split('|')
# Orthys' nearby shipping-route caption is a separate name, not part of its quote.
ocean = groups[10]
route = [key for key in ocean['parts'] if paths[key][1] > 2600]
assert len(route) == 17
ocean['parts'] = [key for key in ocean['parts'] if key not in route]
groups.append({'title': '欧佩里航线', 'foreignTitle': 'Orperri Route', 'parts': route})
for group in groups:
    boxes = [paths[key] for key in group['parts']]
    group['bounds'] = [min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes)]
    group['parts'].sort()
    group['id'] = group['parts'][0].replace('label-part-', 'place-label-')
    group['kind'] = 'route' if group['foreignTitle'].endswith('Route') else 'geography'
    height = max(b[3] - b[1] for b in boxes)
    group['minZoom'] = 1.5 if height >= 280 else 2.5 if height >= 150 else 3.5 if height >= 80 else 4.25
    group['priority'] = 3 if group['kind'] == 'route' else 0 if height >= 280 else 1 if height >= 150 else 2
assert len({part for g in groups for part in g['parts']}) == sum(len(g['parts']) for g in groups) == len(paths) == 1423
payload = {'version': 1, 'width': 21600, 'height': 10400, 'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(), 'data': groups}
(ASSETS / 'labels-index.json').write_text(json.dumps(payload, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
print(f'Indexed {len(groups)} names, {len(paths)} glyph paths; original SVG unchanged.')
