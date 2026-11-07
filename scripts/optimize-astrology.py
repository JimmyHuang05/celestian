from pathlib import Path
import sys, re, base64, io, json
sys.path.insert(0, 'D:/Projects/celestian/.tools/font-optimization')
from PIL import Image
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools import subset

root=Path(__file__).resolve().parents[1]
out=root/'public/assets/astrology-v2'
out.mkdir(parents=True, exist_ok=True)
page=root/'faction-profile.html'
html=page.read_text(encoding='utf-8')
originals=['01-garden','02-riven-sky','03-falling-stars','04-night-voyage']
for name in originals:
    im=Image.open(root/f'public/eternal-astrology/{name}-v1.webp').convert('RGB')
    for w in [320,640,948]:
        resized=im.resize((w,round(im.height*w/im.width)),Image.Resampling.LANCZOS)
        resized.save(out/f'{name}-{w}.webp',quality=76,method=6)
        resized.save(out/f'{name}-{w}.avif',quality=58,speed=6)
    tiny=im.resize((24,42),Image.Resampling.LANCZOS)
    b=io.BytesIO();tiny.save(b,format='WEBP',quality=35)
    placeholder='data:image/webp;base64,'+base64.b64encode(b.getvalue()).decode()
    pattern=r'<div class="astrology-art"><img src="/eternal-astrology/'+name+r'-v1.webp"([^>]+)></div>'
    sizes='(max-width: 650px) 42vw, 23vw'
    sources=''.join(f'<source type="image/{ext}" srcset="'+', '.join(f'/assets/astrology-v2/{name}-{w}.{ext} {w}w' for w in [320,640,948])+f'" sizes="{sizes}">' for ext in ['avif','webp'])
    html,n=re.subn(pattern,lambda m:f'<div class="astrology-art" style="background-image:url({placeholder});background-size:cover"><picture>{sources}<img src="/assets/astrology-v2/{name}-640.webp"'+m[1]+'></picture></div>',html)
    assert n==1,name

# A single versioned texture serves both the CSS fallback and WebGL.
Image.open(root/'public/eternal-astrology/chaos-v1.png').convert('RGB').save(out/'chaos.webp',quality=80,method=6)

# Preserve the exact seal glyph outlines, independent of font-loading timing.
fonts=[TTFont(f) for f in (root/'src/fonts/yishan-title').glob('*.woff2')]
paths=[]
for i,ch in enumerate('永恒不灭的占星会'):
    font=next(f for f in fonts if ord(ch) in f.getBestCmap())
    glyphs=font.getGlyphSet();pen=SVGPathPen(glyphs)
    glyphs[font.getBestCmap()[ord(ch)]].draw(pen)
    scale=1000/font['head'].unitsPerEm
    paths.append(f'<path transform="translate({i*1240} 1000) scale({scale} {-scale})" d="{pen.getCommands()}"/>')
svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="-40 -100 10000 1400" aria-hidden="true" fill="currentColor">'+''.join(paths)+'</svg>'
html=html.replace('<h1 class="astrology-title" id="astrology-title">永恒不灭的占星会</h1>', '<h1 class="astrology-title" id="astrology-title" aria-label="永恒不灭的占星会">'+svg+'</h1>')

font=TTFont(root/'src/fonts/identity/faction-song-400.woff')
text=re.sub('<[^>]*>','',html)+'暂停流动恢复流动百科全书独立势力永恒不灭的占星会'
options=subset.Options();options.flavor='woff2'
sub=subset.Subsetter(options=options);sub.populate(text=text);sub.subset(font)
font.flavor='woff2';font.save(out/'song.woff2')
html=html.replace('</head>','<link rel="preload" href="/assets/astrology-v2/song.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/assets/astrology-v2/chaos.webp" as="image"></head>')
html=html.replace('<main class="preview faction-public"','<main data-artwork="/assets/astrology-v2/chaos.webp" class="preview faction-public"')
page.write_text(html,encoding='utf-8')
print(json.dumps({f.name:f.stat().st_size for f in out.iterdir()},indent=2))
