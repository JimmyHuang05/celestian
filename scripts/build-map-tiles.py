"""Generate a local XYZ image pyramid; never publish the source PNG."""
import argparse
import hashlib
import json
import math
from pathlib import Path

from PIL import Image


def build(source, destination, coordinate_system=None):
    size = 512
    Image.MAX_IMAGE_PIXELS = 250_000_000
    with Image.open(source) as original:
        width, height = original.size
        maximum = max(0, math.ceil(math.log2(max(width, height) / size)))
        image = original.convert('RGB')
    total_bytes = 0
    total_tiles = 0
    levels = []
    for zoom in range(maximum, -1, -1):
        factor = 2 ** (maximum - zoom)
        dimensions = (math.ceil(width / factor), math.ceil(height / factor))
        if image.size != dimensions:
            smaller = image.resize(dimensions, Image.Resampling.LANCZOS)
            image.close()
            image = smaller
        columns, rows = (math.ceil(value / size) for value in dimensions)
        for x in range(columns):
            folder = destination / str(zoom) / str(x)
            folder.mkdir(parents=True, exist_ok=True)
            for y in range(rows):
                box = (x * size, y * size, min((x + 1) * size, image.width), min((y + 1) * size, image.height))
                with image.crop(box) as crop:
                    with Image.new('RGB', (size, size), '#101725') as tile:
                        tile.paste(crop, (0, 0))
                        output = folder / f'{y}.webp'
                        tile.save(output, 'WEBP', quality=90, method=4)
                        total_bytes += output.stat().st_size
                        total_tiles += 1
        levels.append({'zoom': zoom, 'width': dimensions[0], 'height': dimensions[1], 'columns': columns, 'rows': rows})
        print(f'Level {zoom}: {columns} x {rows} tiles', flush=True)
    image.close()
    with source.open('rb') as stream:
        digest = hashlib.file_digest(stream, 'sha256').hexdigest()
    manifest = {'version': 1, 'source': source.name, 'sourceSha256': digest,
                'width': width, 'height': height, 'tileSize': size,
                'maxZoom': maximum, 'minZoom': 0, 'format': 'webp',
                'tileCount': total_tiles, 'bytes': total_bytes, 'levels': list(reversed(levels))}
    if coordinate_system:
        manifest['coordinateSystemSha256'] = coordinate_system
    (destination / 'manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
    print(f'Complete: {total_tiles} tiles, {total_bytes:,} bytes', flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('destination', type=Path)
    parser.add_argument('--coordinate-system', help='Existing coordinate identity; only reuse when geometry and pixel positions are unchanged.')
    args = parser.parse_args()
    if args.destination.exists():
        parser.error('Choose a new output directory; existing tiles are never overwritten.')
    args.destination.mkdir(parents=True)
    build(args.source, args.destination, args.coordinate_system)
