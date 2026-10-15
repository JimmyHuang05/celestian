"""Overlay character assets onto the existing production API source.

Usage: python prepare-character-release.py BASELINE NEW_OUTPUT
"""
import json
import re
import shutil
import sys
from pathlib import Path

repo = Path(__file__).resolve().parent
baseline, out = map(Path, sys.argv[1:])
out.mkdir(parents=True, exist_ok=False)
for name in ['src', 'public', 'index.html', 'package.json', 'package-lock.json',
             'tailwind.config.cjs', 'postcss.config.cjs', 'vite.config.js']:
    source = baseline / name
    if not source.exists():
        continue
    if source.is_dir():
        shutil.copytree(source, out / name)
    else:
        shutil.copy2(source, out / name)

files = set()
def dependency(relative):
    source = (repo / relative).resolve()
    relative = source.relative_to(repo)
    if relative in files:
        return
    files.add(relative)
    target = out / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)
    if source.suffix not in ['.js', '.jsx', '.css']:
        return
    text = source.read_text(encoding='utf-8')
    for match in re.findall(r"['\"](\.[^'\"]+\.(?:js|jsx|css|json))['\"]", text):
        dependency((source.parent / match).relative_to(repo))
    for match in re.findall(r"/src/fonts/[^'\")]+", text):
        dependency(match.lstrip('/'))

dependency('src/character-profile.js')
shutil.copy2(repo / 'src/main.jsx', out / 'src/main.jsx')
shutil.copy2(repo / 'character-profile.html', out / 'character-profile.html')
assets = {'character-profile/characters.json', 'character-profile/star-dust.svg', 'character-profile/medic.png'}
entries = json.loads((repo / 'public/character-profile/characters.json').read_text(encoding='utf-8'))
for entry in entries:
    assets.update([entry['image'].lstrip('/'), entry['emblem'].lstrip('/'), entry['avatar'].lstrip('/')])
for folder in ['audio/characters', 'elowen-motion', 'sylvia-motion', 'euphemia-motion', 'xianna-motion', 'day-fourteen-motion']:
    assets.update(str(p.relative_to(repo / 'public')).replace('\\', '/') for p in (repo / 'public' / folder).rglob('*') if p.is_file() and p.suffix != '.png')
for name in assets:
    target = out / 'public' / name
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(repo / 'public' / name, target)

page = out / 'src/pages/EncyclopediaPage.jsx'
text = page.read_text(encoding='utf-8')
assert "apiGet('/entries/counts')" in text, 'Production API baseline required'
text = text.replace("import ASSETS_BASE from '../constants.js'", "import ASSETS_BASE from '../constants.js'\nimport { openCharacterProfile } from '../profile-navigation.js'")
text = text.replace('    if (nodeFromUrl) {', '''    if (nodeFromUrl) {
      if (nodeFromUrl.id === 'characters') {
        const target = `/character-profile.html${window.location.search}`
        navigate('/encyclopedia', { replace: true })
        setTimeout(() => openCharacterProfile(target), 0)
        return
      }''')
text = text.replace('  const openDetail = useCallback((node, event) => {', '''  const openDetail = useCallback((node, event) => {
    if (node.id === 'characters') {
      openCharacterProfile('/character-profile.html')
      return
    }''')
page.write_text(text, encoding='utf-8')
config = out / 'vite.config.js'
text = config.read_text(encoding='utf-8').replace('    define: {', "    build: { rollupOptions: { input: { main: 'index.html', characters: 'character-profile.html' } } },\n    define: {")
config.write_text(text, encoding='utf-8')
(out / 'character-release-manifest.json').write_text(json.dumps({'source':sorted(map(str, files)), 'assets':sorted(assets)}, indent=2), encoding='utf-8')
print(f'Prepared {len(files)} source dependencies and {len(assets)} assets in {out}')
