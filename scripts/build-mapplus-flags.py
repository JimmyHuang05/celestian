"""Encode a shared atlas-size flag for the map highlight and the detail sheet."""
import base64
import io
import json
import sys

from PIL import Image

for url, path in json.load(sys.stdin):
    with Image.open(path) as source:
        image = source.convert("RGBA" if "A" in source.getbands() else "RGB")
    image.thumbnail((768, 512), Image.Resampling.LANCZOS)
    output = io.BytesIO()
    image.save(output, format="WEBP", quality=87, method=4)
    print(json.dumps([url, base64.b64encode(output.getvalue()).decode("ascii")]))
