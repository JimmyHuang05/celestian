"""Convert the authored transparent label layer to glyph-outline SVG paths."""
import hashlib
import argparse
import json
import sys
import tempfile
import xml.etree.ElementTree as ET
from pathlib import Path

from PIL import Image, ImageChops, ImageStat

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools/vector-trace'))
import vtracer

Image.MAX_IMAGE_PIXELS = 250_000_000
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--mode', choices=['spline', 'polygon'], default='polygon')
parser.add_argument('--output', type=Path, default=ROOT / 'github/public/map/world-240705-base-v2/labels.svg')
args = parser.parse_args()
source = ROOT / 'WorldMap_240705_文字标识.png'
destination = args.output
destination.parent.mkdir(parents=True, exist_ok=True)
with tempfile.TemporaryDirectory(prefix='celestian-labels-') as directory:
    directory = Path(directory)
    with Image.open(source) as image:
        width, height = image.size
        alpha = image.getchannel('A')
        foreground = alpha.point(lambda value: 255 if value >= 128 else 0)
        # Keep punctuation and tiny glyph components; do not apply speckle removal.
        color = '#' + ''.join(f'{round(value):02x}' for value in ImageStat.Stat(image, foreground).mean[:3])
        ImageChops.invert(foreground).save(directory / 'mask.png')
        foreground.close(); alpha.close()
    print(f'Tracing {width} x {height} label shapes, fill {color}...', flush=True)
    vtracer.convert_image_to_svg_py(
        str(directory / 'mask.png'), str(directory / 'trace.svg'),
        colormode='binary', mode=args.mode, filter_speckle=0,
        corner_threshold=60, length_threshold=3.5, splice_threshold=45,
        path_precision=2,
    )
    svg = ET.parse(directory / 'trace.svg').getroot()
    svg.set('viewBox', f'0 0 {width} {height}')
    svg.set('width', str(width)); svg.set('height', str(height))
    svg.set('aria-label', '世界地图文字标识')
    svg.set('fill', color)
    paths = list(svg)
    for index, path in enumerate(paths):
        path.set('id', f'label-part-{index + 1:05}')
        path.attrib.pop('fill', None)
    ET.register_namespace('', 'http://www.w3.org/2000/svg')
    ET.ElementTree(svg).write(destination, encoding='utf-8', xml_declaration=True)
    with source.open('rb') as stream:
        digest = hashlib.file_digest(stream, 'sha256').hexdigest()
    report = {'source': source.name, 'sourceSha256': digest, 'width': width, 'height': height,
              'alphaThreshold': 128, 'traceScale': 1, 'filterSpeckle': 0,
              'mode': args.mode, 'fill': color, 'pathCount': len(paths),
              'bytes': destination.stat().st_size,
              'note': 'Glyph outlines, not editable text. Original positions and rotations retained; surface texture replaced by mean opaque gold.'}
    destination.with_suffix('.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps(report), flush=True)
