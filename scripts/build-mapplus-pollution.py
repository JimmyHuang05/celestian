"""Rasterize the release wash from the shared pollution geometry and style."""
import base64
import io
import json
import sys

from PIL import Image, ImageChops, ImageColor, ImageDraw, ImageFilter


def draw_rings(canvas, rings, scale, dx=0):
    draw = ImageDraw.Draw(canvas)
    for index, ring in enumerate(rings):
        draw.polygon([((x + dx) * scale, y * scale) for x, y in ring], fill=255 if index == 0 else 0)


data = json.load(sys.stdin)
front = Image.new("L", (1024, 512))
for polygon in data["geometry"]:
    draw_rings(front, polygon, .5)

alpha = Image.new("L", front.size)
for layer in data["layers"]:
    mask = front
    spread = layer.get("spread", 0)
    if spread:
        filter_type = ImageFilter.MaxFilter if spread > 0 else ImageFilter.MinFilter
        mask = mask.filter(filter_type(2 * round(abs(spread) / 2) + 1))
    mask = mask.filter(ImageFilter.GaussianBlur(layer["blur"] / 2))
    mask = mask.point(lambda value: round(value * layer["opacity"]))
    alpha = ImageChops.screen(alpha, mask)

shore = Image.new("L", (2048, 1024))
for dx in data["offsets"]:
    for ring in data["shore"]:
        draw_rings(shore, [ring], 1, dx)

alpha = alpha.point(lambda value: round(value * data["opacity"]))
alpha = ImageChops.multiply(alpha.resize(shore.size, Image.Resampling.BILINEAR), shore)
wash = Image.new("RGBA", shore.size, ImageColor.getrgb(data["color"]))
wash.putalpha(alpha)
output = io.BytesIO()
wash.save(output, format="WEBP", lossless=True, method=4)
print(base64.b64encode(output.getvalue()).decode("ascii"))
