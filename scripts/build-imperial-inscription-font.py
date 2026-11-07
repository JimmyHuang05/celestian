"""Build the hall's local Noto Serif SC subset; no page text leaves this machine.

Usage: python scripts/build-imperial-inscription-font.py path/to/NotoSerifSC-VF.ttf
Requires fontTools and brotli. Font license: src/fonts/identity/OFL.txt.
"""
import re
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
local_tools = root.parent / '.tools' / 'font-optimization'
if local_tools.exists():
    sys.path.insert(0, str(local_tools))

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

source = Path(sys.argv[1])
artwork = (root / 'src/imperial-banner-artwork.js').read_text(encoding='utf-8')
names = ' '.join(re.findall(r"(?:name|germanName): '([^']+)'", artwork))
requested = set(map(ord, names))
old = TTFont(root / 'src/fonts/identity/faction-song-400.woff')
missing_old = sorted(requested - set(old.getBestCmap()))
print('Previous subset missing:', ', '.join(f'U+{point:04X}' for point in missing_old))
old.close()

font = TTFont(source)
missing = requested - set(font.getBestCmap())
if missing:
    raise ValueError(f'Source font is missing {sorted(missing)}')
options = subset.Options()
options.layout_features = ['kern', 'liga', 'locl']
options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]
subsetter = subset.Subsetter(options=options)
subsetter.populate(unicodes=requested)
subsetter.subset(font)
if 'fvar' in font:
    font = instantiateVariableFont(font, {'wght': 400}, inplace=True)
font.flavor = 'woff2'
output = root / 'src/fonts/identity/imperial-inscription-400.woff2'
font.save(output)
font.close()
result = TTFont(output)
assert not requested - set(result.getBestCmap()), 'The generated subset lost required glyphs'
result.close()
print(f'{output.name}: {output.stat().st_size} bytes; all {len(requested)} required characters included')
