"""Build web delivery assets; keep the original PNG artwork untouched."""
import json
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent / 'public'
catalog = root / 'character-profile/characters.json'
characters = json.loads(catalog.read_text(encoding='utf-8'))
sizes = []
for character in characters:
    source = root / character['image'].lstrip('/')
    source = source.with_suffix('.png')
    image = Image.open(source).convert('RGBA')
    target = source.with_suffix('.webp')
    image.save(target, 'WEBP', quality=92, method=6, exact=True)
    avatar = source.with_name(source.stem + '-avatar.webp')
    image.resize((326, 435), Image.Resampling.LANCZOS).save(avatar, 'WEBP', quality=86, method=6, exact=True)
    character['image'] = '/' + target.relative_to(root).as_posix()
    character['avatar'] = '/' + avatar.relative_to(root).as_posix()
    sizes.append([source.name, source.stat().st_size, target.stat().st_size, avatar.stat().st_size])

for folder, size in [('elowen-motion',(420,340)), ('sylvia-motion',(420,400)),
                     ('euphemia-motion',(420,380)), ('xianna-motion',(420,360)),
                     ('day-fourteen-motion',(400,360))]:
    source = root / folder / 'closed-eyes.png'
    target = source.with_name('closed-eyes-v2.webp')
    Image.open(source).convert('RGBA').resize(size, Image.Resampling.LANCZOS).save(target, 'WEBP', lossless=True, method=6)
    sizes.append([folder + '/eyes', source.stat().st_size, target.stat().st_size])
source = root / 'sylvia-motion/blade-under-hair.png'
target = source.with_name('blade-under-hair-v2.webp')
Image.open(source).convert('RGBA').resize((300,240), Image.Resampling.LANCZOS).save(target, 'WEBP', lossless=True, method=6)
sizes.append(['sylvia-motion/blade', source.stat().st_size, target.stat().st_size])
catalog.write_text(json.dumps(characters, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps(sizes, indent=2))
