"""Encode an alpha-preserving preview and Leaflet tiles for the MapPlus release."""
import base64
import io
import json
import sys

from PIL import Image


def encode(name, image, lossless=False, quality=90, method=3):
    output = io.BytesIO()
    image.save(output, format="WEBP", quality=quality, lossless=lossless, method=method)
    print(json.dumps([name, base64.b64encode(output.getvalue()).decode("ascii")]))


with Image.open(sys.argv[1]) as source:
    water = source.convert("RGBA")

if water.size != (8192, 4096):
    raise ValueError(f"Expected 8192×4096 water artwork, received {water.size}")

overview = water.resize((1536, 768), Image.Resampling.LANCZOS)
# Small interpolation differences in near-transparent water are expensive
# to encode. Quantize the overview alpha only and keep the native tiles exact.
overview.putalpha(overview.getchannel("A").point(lambda value: min(255, round(value / 8) * 8)))
encode("overview.webp", overview, quality=82, method=5)
for zoom in range(4, 7):
    width = 8192 >> (6 - zoom)
    height = width // 2
    level = water if zoom == 6 else water.resize((width, height), Image.Resampling.LANCZOS)
    for x in range(width // 512):
        for y in range(height // 512):
            tile = level.crop((x * 512, y * 512, (x + 1) * 512, (y + 1) * 512))
            encode(f"{zoom}/{x}/{y}.webp", tile, lossless=zoom == 6)
