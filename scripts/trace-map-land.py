"""Trace the alpha channel of the authored land mask at its native resolution."""
import hashlib
import json
import sys
import tempfile
import xml.etree.ElementTree as ET
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools/vector-trace'))
import vtracer

Image.MAX_IMAGE_PIXELS = 250_000_000
source = ROOT / 'WorldMap_240705_svg.png'
destination = ROOT / 'github/public/map/world-240705-base-v2/land.svg'
with tempfile.TemporaryDirectory(prefix='celestian-land-') as temporary:
    temporary = Path(temporary)
    with Image.open(source) as image:
        width, height = image.size
        # Use authored transparency, not parchment colors or decorative marks.
        alpha = image.getchannel('A')
        mask = alpha.point(lambda value: 0 if value >= 128 else 255)
        mask.save(temporary / 'mask.png')
        mask.close()
        alpha.close()
    print(f'Tracing native {width} x {height} land mask...', flush=True)
    vtracer.convert_image_to_svg_py(
        str(temporary / 'mask.png'), str(temporary / 'trace.svg'),
        colormode='binary', mode='polygon', filter_speckle=0,
        corner_threshold=60, length_threshold=3.5, path_precision=2,
    )
    root = ET.parse(temporary / 'trace.svg').getroot()
    root.set('viewBox', f'0 0 {width} {height}')
    root.set('width', str(width))
    root.set('height', str(height))
    root.set('aria-label', '大陆与岛屿轮廓')
    paths = list(root)
    for index, path in enumerate(paths):
        path.set('id', f'land-{index + 1:04}')
        path.set('fill', '#b29d7f')
    ET.register_namespace('', 'http://www.w3.org/2000/svg')
    ET.ElementTree(root).write(destination, encoding='utf-8', xml_declaration=True)
    with source.open('rb') as stream:
        digest = hashlib.file_digest(stream, 'sha256').hexdigest()
    report = {'source': source.name, 'sourceSha256': digest, 'width': width,
              'height': height, 'alphaThreshold': 128, 'traceScale': 1,
              'filterSpeckle': 0, 'pathCount': len(paths), 'bytes': destination.stat().st_size}
    destination.with_suffix('.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps(report), flush=True)
