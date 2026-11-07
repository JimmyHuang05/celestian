"""Versioned delivery encodings only; preserve source artwork and SVG geometry."""
from pathlib import Path
from PIL import Image
import re, base64, io, json
root=Path(__file__).resolve().parents[1]/'public'
report=[]
def encode(src,dst,height=None,mask=False):
    im=Image.open(src).convert('RGBA')
    if height and im.height>height:
        im=im.resize((round(im.width*height/im.height),height),Image.Resampling.LANCZOS)
    if mask:
        alpha=im.getchannel('A');im=Image.new('RGBA',im.size,(255,255,255,0));im.putalpha(alpha)
    dst.parent.mkdir(parents=True,exist_ok=True)
    im.save(dst,'WEBP',lossless=mask,quality=90,method=6)
    report.append({'source':str(src.relative_to(root)),'output':str(dst.relative_to(root)),'before':src.stat().st_size,'after':dst.stat().st_size})
for name in ['mantled','fluted']:
    encode(root/f'imperial-knights/guards-v1/guard-{name}.png',root/f'imperial-knights/delivery-v1/guard-{name}.webp',height=384)
for name,mask in [('white-palace-oil-v1',False),('palace-original-clouds-v1',True),('palace-silhouette-v1',True)]:
    encode(root/f'unconventional-affairs/backgrounds/{name}.png',root/f'unconventional-affairs/delivery-v1/{name}.webp',mask=mask)
encode(root/'unconventional-affairs/crests-v6/raven-red-navy.png',root/'unconventional-affairs/delivery-v1/raven-red-navy.webp')
for source in ['damask-v1/lion-damask.svg','damask-v1/imperial-damask.svg','selected-heraldry-v3/bear-selected.svg','selected-heraldry-v3/lynx-selected.svg','selected-heraldry-v3/wolf-selected.svg']:
    src=root/'imperial-knights'/source
    def optimize_svg(text):
        def replace(m):
            raw=base64.b64decode(m[2])
            if m[1]=='svg+xml':
                return 'data:image/svg+xml;base64,'+base64.b64encode(optimize_svg(raw.decode()).encode()).decode()
            im=Image.open(io.BytesIO(raw)).convert('RGBA')
            im.thumbnail((1280,1280),Image.Resampling.LANCZOS)
            out=io.BytesIO();im.save(out,'WEBP',quality=88,method=6)
            return 'data:image/webp;base64,'+base64.b64encode(out.getvalue()).decode()
        return re.sub(r'data:image/(png|webp|svg\+xml);base64,([A-Za-z0-9+/=\s]+)(?=["\x27])',replace,text)
    text=optimize_svg(src.read_text(encoding='utf8'))
    dst=root/'imperial-knights/delivery-v1'/src.name;dst.write_text(text,encoding='utf8')
    report.append({'source':str(src.relative_to(root)),'output':str(dst.relative_to(root)),'before':src.stat().st_size,'after':dst.stat().st_size})
print(json.dumps(report,indent=2))
