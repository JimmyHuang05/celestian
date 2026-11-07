"""Versioned display assets; never modify approved source artwork.

Run render-faction-delivery.cjs first for the composite SVG masters.
"""
from pathlib import Path
from PIL import Image
import json

root = Path(__file__).resolve().parents[1]
public = root / 'public'
masters = root.parent / 'audit/faction-performance/masters'
report = []

def encode(source, relative, widths, quality=88, lossless=False):
    image = Image.open(source).convert('RGBA')
    for width in widths:
        resized = image.resize((width, round(image.height * width / image.width)), Image.Resampling.LANCZOS)
        output = public / f'{relative}-{width}.webp'
        output.parent.mkdir(parents=True, exist_ok=True)
        resized.save(output, 'WEBP', quality=quality, lossless=lossless, method=6)
        report.append({'file': str(output.relative_to(public)), 'bytes': output.stat().st_size, 'size': resized.size})

for name in ['lion-damask', 'bear-selected', 'imperial-damask', 'lynx-selected', 'wolf-selected']:
    encode(masters / f'{name}.png', f'imperial-knights/delivery-v2/{name}', [320, 640], quality=92)
# Exact alpha and flat colour keep fine gold linework clean at 1x and 2x.
encode(masters / 'astrology-emblem.png', 'assets/astrology-v3/emblem', [360, 720], lossless=True)
encode(public / 'unconventional-affairs/crests-v6/raven-red-navy.png', 'unconventional-affairs/delivery-v2/raven-red-navy', [480, 960], quality=90)
for name in ['red-key-seal-v1', 'blue-arcane-lantern-v1']:
    encode(public / f'unconventional-affairs/badges-v1/{name}.webp', f'unconventional-affairs/delivery-v2/{name}', [240, 480], quality=90)
# Portrait displays crop this painting heavily, so keep the full source dimensions.
encode(public / 'unconventional-affairs/delivery-v1/raven-iris-redblue-v1.webp', 'unconventional-affairs/delivery-v2/background', [1672], quality=84)
encode(public / 'imperial-knights/hall-v1/hall.webp', 'imperial-knights/delivery-v2/hall', [1672], quality=86)
(root.parent / 'audit/faction-performance/asset-sizes.json').write_text(json.dumps(report, indent=2), encoding='utf8')
print(json.dumps(report, indent=2))
