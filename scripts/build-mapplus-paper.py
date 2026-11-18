"""Bake paper at world coordinates into MapPlus previews and their tiles."""
import base64
import io
import json
import sys
from functools import lru_cache
from pathlib import Path

from PIL import Image, ImageChops

root = Path(sys.argv[1])
jobs = json.load(sys.stdin)
paper = Image.open(root / "map-cotton-study/handmade-cotton-paper-2k-q88-v1.webp").convert("RGB")
ocean = Image.open(root / "mapplus/natural-ridge-v2/ocean-depth-parchment-v8-q98-v1.webp").convert("RGBA")


@lru_cache(maxsize=12)
def paper_tile(world_width):
    size = world_width // 8
    return paper.resize((size, size), Image.Resampling.LANCZOS)


for name, x, y, world_width, world_height, has_ocean in jobs:
    with Image.open(root / name) as source:
        base = source.convert("RGB")
    width, height = base.size
    world_width = world_width or width
    world_height = world_height or height
    if has_ocean:
        sx, sy = ocean.width / world_width, ocean.height / world_height
        relief = ocean.transform(base.size, Image.Transform.EXTENT,
                                 (x * sx, y * sy, (x + width) * sx, (y + height) * sy),
                                 Image.Resampling.BICUBIC)
        base.paste(relief, mask=relief.getchannel("A"))

    tile = paper_tile(world_width)
    texture = Image.new("RGB", base.size)
    for top in range(-(y % tile.height), height, tile.height):
        for left in range(-(x % tile.width), width, tile.width):
            texture.paste(tile, (left, top))
    result = Image.blend(base, ImageChops.multiply(base, texture), .30)
    buffer = io.BytesIO()
    result.save(buffer, format="WEBP", quality=89, method=2)
    print(json.dumps([name, base64.b64encode(buffer.getvalue()).decode("ascii")]))
