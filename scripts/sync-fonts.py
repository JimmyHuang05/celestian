"""Vendor the shared web fonts. Reuse the lock by default; --refresh updates upstream CSS.

Requires fonttools and brotli. Runtime pages never contact the font providers.
"""
import argparse
import concurrent.futures
import hashlib
import json
import re
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
for local in [ROOT.parent / '.tools/font-optimization', ROOT.parent / 'design/svg-trace-tools']:
    if local.exists():
        sys.path.insert(0, str(local))
from fontTools.ttLib import TTFont
from fontTools import subset

FONT_DIR = ROOT / 'public/fonts/v1'
CONFIG_DIR = ROOT / 'src/fonts'
LOCK = CONFIG_DIR / 'font-sources.json'
GOOGLE_CSS = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400..900&family=JetBrains+Mono:wght@400..700&family=Mrs+Saint+Delafield&family=Noto+Serif+SC:wght@200..900&display=swap'
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
FULL_SONG_URL = 'https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifsc/NotoSerifSC%5Bwght%5D.ttf'
LICENSES = {name: f'https://raw.githubusercontent.com/google/fonts/main/ofl/{folder}/OFL.txt' for name, folder in [
    ('Noto Serif SC', 'notoserifsc'), ('Cinzel', 'cinzel'), ('JetBrains Mono', 'jetbrainsmono'), ('Mrs Saint Delafield', 'mrssaintdelafield')]}

def download(url):
    for attempt in range(3):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=45).read()
        except Exception:
            if attempt == 2:
                raise
            time.sleep(attempt + 1)

def ranges(points):
    groups = []
    for point in sorted(points):
        if groups and point == groups[-1][1] + 1:
            groups[-1][1] = point
        else:
            groups.append([point, point])
    return ','.join(f'{a:X}' if a == b else f'{a:X}-{b:X}' for a, b in groups)

def points_from_ranges(value):
    result = set()
    for part in value.split(','):
        if not part:
            continue
        a, _, b = part.partition('-')
        result.update(range(int(a, 16), int(b or a, 16) + 1))
    return result

def allowed(point, value):
    if not value:
        return True
    for part in value.upper().replace('U+', '').split(','):
        part = part.strip()
        lo, _, hi = part.partition('-')
        if '?' in lo:
            lo, hi = lo.replace('?', '0'), lo.replace('?', 'F')
        if int(lo, 16) <= point <= int(hi or lo, 16):
            return True
    return False

def parse_faces(css):
    faces = []
    for block in re.findall(r'@font-face\s*\{([^}]+)\}', css):
        props = dict(re.findall(r'([\w-]+)\s*:\s*([^;]+)', block))
        source = re.search(r'url\([\'"]?(https://[^)\'" ]+)', props.get('src', ''))
        if not source:
            continue
        faces.append({'family': props['font-family'].strip('\'"'), 'source': source[1],
                      'style': props.get('font-style', 'normal'), 'weight': props.get('font-weight', '400'),
                      'range': props.get('unicode-range', '')})
    return faces

def complete_song(faces, spec, refresh_source=False):
    # Provider CSS is frequency-split but omits parts of the source repertoire.
    # Add disjoint shards from the matching full source, preserving all weights.
    source = ROOT / 'node_modules/.cache/celestian-fonts/NotoSerifSC-variable.ttf'
    source.parent.mkdir(parents=True, exist_ok=True)
    if refresh_source or not source.exists():
        source.write_bytes(download(spec.get('fullSong', {}).get('source', FULL_SONG_URL)))
    digest = hashlib.sha256(source.read_bytes()).hexdigest()
    if spec.get('fullSong', {}).get('sha256', digest) != digest:
        raise ValueError('Full source checksum mismatch; refresh explicitly to update versions')
    with TTFont(source) as font:
        all_points = set(font.getBestCmap())
        version = font['name'].getDebugName(5)
    song_faces = [f for f in faces if f['family'] == 'Noto Serif SC']
    with TTFont(ROOT / 'public' / song_faces[0]['file'].lstrip('/')) as font:
        if font['name'].getDebugName(5) != version:
            raise ValueError('Provider shards and full source have different versions')
    known = set()
    for face in song_faces:
        for value in face['coverage'].split(','):
            a, _, b = value.partition('-')
            known.update(range(int(a, 16), int(b or a, 16) + 1))
    missing = sorted(all_points - known)
    groups = [missing[i:i + 512] for i in range(0, len(missing), 512)]
    locked = {f['file']: f['sha256'] for f in spec['faces'] if f.get('generated')}
    def build(points):
        coverage = ranges(points)
        filename = 'song-extra-' + hashlib.sha256((digest + coverage).encode()).hexdigest()[:16] + '.woff2'
        target = FONT_DIR / filename
        if not target.exists():
            with TTFont(source) as font:
                options = subset.Options()
                options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]
                worker = subset.Subsetter(options=options)
                worker.populate(unicodes=points)
                worker.subset(font)
                font.flavor = 'woff2'
                font.save(target)
        file_url = '/fonts/v1/' + filename
        file_digest = hashlib.sha256(target.read_bytes()).hexdigest()
        if file_url in locked and file_digest != locked[file_url]:
            raise ValueError(f'Font checksum mismatch: {filename}')
        with TTFont(target) as font:
            if not set(points).issubset(font.getBestCmap()):
                raise ValueError(f'Lost glyphs in {filename}')
        return {'family': 'Noto Serif SC', 'source': FULL_SONG_URL, 'generated': True,
                'style': 'normal', 'weight': '200 900', 'range': ','.join('U+' + part for part in coverage.split(',')),
                'file': file_url, 'sha256': file_digest,
                'bytes': target.stat().st_size, 'coverage': coverage}
    print(f'Completing source repertoire: {len(missing)} additional characters in {len(groups)} on-demand shards.', flush=True)
    # CFF2 subsetting expands the source substantially in memory; build sequentially.
    supplemental = [build(group) for group in groups]
    spec['fullSong'] = {'source': FULL_SONG_URL, 'sha256': digest, 'version': version, 'characters': len(all_points)}
    return faces + supplemental

def prioritize_song(faces, spec):
    # Keep full coverage, but serve current UI from one small shared pack.
    # The remaining page text is grouped by frequency into on-demand packs.
    usage = json.loads(subprocess.check_output(
        ['node', str(ROOT / 'scripts/font-priority.mjs')], cwd=ROOT, encoding='utf-8'))
    source = ROOT / 'node_modules/.cache/celestian-fonts/NotoSerifSC-variable.ttf'
    source_hash = spec['fullSong']['sha256']
    covered = set().union(*(points_from_ranges(f['coverage']) for f in faces if f['family'] == 'Noto Serif SC'))
    critical = set(usage['critical']) & covered
    content = [p for p in usage['content'] if p in covered and p not in critical]
    groups = [('critical', critical)] + [('content', set(content[i:i + 128])) for i in range(0, len(content), 128)]
    locked = {f['file']: f['sha256'] for f in spec['faces'] if f.get('priority')}
    priority = []
    for kind, points in groups:
        coverage = ranges(points)
        name = 'song-' + kind + '-' + hashlib.sha256((source_hash + coverage).encode()).hexdigest()[:16] + '.woff2'
        target = FONT_DIR / name
        if not target.exists():
            print(f'Preparing shared {kind} pack: {len(points)} characters.', flush=True)
            with TTFont(source) as font:
                options = subset.Options()
                options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]
                worker = subset.Subsetter(options=options)
                worker.populate(unicodes=points)
                worker.subset(font)
                font.flavor = 'woff2'
                font.save(target)
        with TTFont(target) as font:
            if not points.issubset(font.getBestCmap()):
                raise ValueError(f'Lost priority glyphs: {name}')
        file_url = '/fonts/v1/' + name
        digest = hashlib.sha256(target.read_bytes()).hexdigest()
        if file_url in locked and digest != locked[file_url]:
            raise ValueError(f'Font checksum mismatch: {name}')
        priority.append({'family': 'Noto Serif SC', 'source': FULL_SONG_URL,
                         'generated': True, 'priority': kind, 'style': 'normal', 'weight': '200 900',
                         'file': file_url, 'sha256': digest,
                         'bytes': target.stat().st_size, 'coverage': coverage,
                         'range': ','.join('U+' + part for part in coverage.split(','))})
    prioritized = critical | set(content)
    optimized = []
    for face in faces:
        if face['family'] == 'Noto Serif SC':
            remaining = points_from_ranges(face['coverage']) - prioritized
            # Preserve the provider's original ranges for reproducible re-sync.
            face = {**face, 'sourceRange': face['range'], 'coverage': ranges(remaining),
                    'range': ','.join('U+' + part for part in ranges(remaining).split(',')) if remaining else ''}
            if not remaining:
                continue
        optimized.append(face)
    spec['priority'] = {'critical': priority[0]['file'], 'characters': len(critical),
                        'bytes': priority[0]['bytes'], 'contentPacks': len(priority) - 1}
    return optimized + priority

def update_preloads(spec):
    marker = '<!-- shared-font-preload:start -->'
    for entry in ['index.html', 'character-profile.html', 'faction-profile.html', 'unconventional-affairs.html', 'imperial-knights.html']:
        file = ROOT / entry
        html = file.read_text(encoding='utf-8')
        html = re.sub(r'\s*<!-- shared-font-preload:start -->.*?<!-- shared-font-preload:end -->', '', html, flags=re.S)
        html = re.sub(r'\s*<link rel="stylesheet" href="/src/fonts/index.css">', '', html)
        block = f'''\n  {marker}
  <link rel="preload" href="{spec['priority']['critical']}" as="font" type="font/woff2" crossorigin fetchpriority="high">
  <link rel="stylesheet" href="/src/fonts/index.css">
  <!-- shared-font-preload:end -->'''
        # Keep charset first; discover the critical font before page assets/scripts.
        html = re.sub(r'(<meta\s+charset=[^>]+>)', lambda m: m[0] + block, html, count=1, flags=re.I)
        file.write_text(html, encoding='utf-8')

def main():
    args = argparse.ArgumentParser()
    args.add_argument('--refresh', action='store_true')
    refresh = args.parse_args().refresh
    FONT_DIR.mkdir(parents=True, exist_ok=True)
    if refresh or not LOCK.exists():
        # Keep the existing seal font's provider metadata for reproducible local hosting.
        seal_source = CONFIG_DIR / 'yishan-source.css'
        if not seal_source.exists():
            seal_source.write_text((CONFIG_DIR / 'yishan.css').read_text(encoding='utf-8-sig'), encoding='utf-8')
        faces = parse_faces(download(GOOGLE_CSS).decode()) + parse_faces(seal_source.read_text(encoding='utf-8'))
        spec = {'googleCss': GOOGLE_CSS, 'sealSource': 'Existing ZeoSeven 236 CSS; see yishan-source.css attribution.', 'faces': faces}
    else:
        spec = json.loads(LOCK.read_text(encoding='utf-8'))
    def fetch(face):
        slug = {'Noto Serif SC': 'song', 'Cinzel': 'display', 'JetBrains Mono': 'mono',
                'Mrs Saint Delafield': 'signature', '峄山碑篆体': 'seal'}[face['family']]
        filename = slug + '-' + hashlib.sha256(face['source'].encode()).hexdigest()[:16] + '.woff2'
        target = FONT_DIR / filename
        if not target.exists():
            target.write_bytes(download(face['source']))
        digest = hashlib.sha256(target.read_bytes()).hexdigest()
        if face.get('sha256') and face['sha256'] != digest:
            raise ValueError(f'Font checksum mismatch: {filename}')
        source_range = face.get('sourceRange', face['range'])
        with TTFont(target) as font:
            points = {p for p in font.getBestCmap() if allowed(p, source_range)}
        return {**face, 'range': source_range, 'file': '/fonts/v1/' + filename, 'sha256': digest,
                'bytes': target.stat().st_size, 'coverage': ranges(points)}
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        faces = list(pool.map(fetch, [f for f in spec['faces'] if not f.get('generated')]))
    faces = complete_song(faces, spec, refresh_source=refresh)
    faces = prioritize_song(faces, spec)
    css = ['/* Generated by scripts/sync-fonts.py. Same URLs in every document; character ranges load on demand. */']
    for face in faces:
        declarations = [f"font-family:'{face['family']}'", f"font-style:{face['style']}",
                        f"font-weight:{face['weight']}", 'font-display:swap',
                        f"src:url('{face['file']}') format('woff2')"]
        if face['range']:
            declarations.append('unicode-range:' + face['range'])
        css.append('@font-face{' + ';'.join(declarations) + '}')
    (CONFIG_DIR / 'faces.css').write_text('\n'.join(css) + '\n', encoding='utf-8')
    spec['faces'] = faces
    LOCK.write_text(json.dumps(spec, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    update_preloads(spec)
    for family, url in LICENSES.items():
        target = FONT_DIR / (family.replace(' ', '-') + '-OFL.txt')
        if not target.exists():
            target.write_bytes(download(url))
    print(json.dumps({'faces': len(faces), 'bytes': sum(f['bytes'] for f in faces),
                      'families': sorted(set(f['family'] for f in faces))}, ensure_ascii=False))

if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()
