"""Mirror card originals byte-for-byte for same-origin delivery (no re-encoding)."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import json
import urllib.request
from PIL import Image

DEST = Path(__file__).resolve().parents[1] / 'public/images/cards'
NAMES = ['hero-front', 'hero-back', 'hero-hover', 'encyclopedia-card', 'map-card', 'functions-card']

def prepare(name):
    original = DEST / f'{name}-original.webp'
    if not original.exists():
        with urllib.request.urlopen(f'https://assets.jimmyhuang.cn/images/cards/{name}.webp', timeout=60) as response:
            data = response.read()
        original.write_bytes(data)
    with Image.open(original) as image:
        result = {'width': image.width, 'height': image.height, 'originalBytes': original.stat().st_size, 'variants': {}}
    return name, result

if __name__ == '__main__':
    DEST.mkdir(parents=True, exist_ok=True)
    with ThreadPoolExecutor(max_workers=6) as pool:
        manifest = dict(pool.map(prepare, NAMES))
    (DEST / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(manifest, indent=2))
