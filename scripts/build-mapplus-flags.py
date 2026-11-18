"""Encode a shared atlas-size flag for the map highlight and the detail sheet."""
import base64
import io
import json
import sys

from PIL import Image

def webp(image, quality):
    output = io.BytesIO()
    image.save(output, format="WEBP", quality=quality, method=4)
    return base64.b64encode(output.getvalue()).decode("ascii")


for url, path in json.load(sys.stdin):
    with Image.open(path) as source:
        image = source.convert("RGBA" if "A" in source.getbands() else "RGB")
    image.thumbnail((768, 512), Image.Resampling.LANCZOS)
    preview = image.copy()
    preview.thumbnail((192, 128), Image.Resampling.LANCZOS)
    print(json.dumps([url, webp(image, 87), webp(preview, 77)]))
