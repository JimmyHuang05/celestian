"""Preserve ImageGen originals and create small alpha-preserving web assets."""
from pathlib import Path
from PIL import Image
import shutil

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(r'C:\Users\admin\.codex\generated_images\01a1475f-5eea-7f01-b3d7-eb3df51c6abf')
FILES = {
    'eagle': 'exec-6ed88d1a-ac5d-426d-b96c-6b449af28d8f.png',
    'lion': 'exec-6a555227-97cf-470e-a416-58d3ed5c2c63.png',
    'tiger': 'exec-6c16290c-292c-4e93-bf89-88deac04acdd.png',
    'leopard': 'exec-e57c7f2e-3d8d-4c73-90a3-e6c23e262a01.png',
    'wolf': 'exec-3df60635-046a-4ae1-bf4e-37b5be42a2ed.png',
}
originals = ROOT.parent / 'design' / 'imperial-knights-goldwork-v1'
public = ROOT / 'public' / 'imperial-knights' / 'goldwork-v1'
originals.mkdir(parents=True, exist_ok=True)
public.mkdir(parents=True, exist_ok=True)
for name, filename in FILES.items():
    image = Image.open(SOURCE / filename).convert('RGBA')
    assert image.getchannel('A').getextrema()[0] == 0, 'Real alpha is required'
    shutil.copy2(SOURCE / filename, originals / (name + '.png'))
    image.thumbnail((512, 512), Image.Resampling.LANCZOS)
    destination = public / (name + '.webp')
    image.save(destination, 'WEBP', quality=88, method=6)
    print(name, image.size, destination.stat().st_size)
