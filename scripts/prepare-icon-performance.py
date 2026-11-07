from pathlib import Path
import json,urllib.parse,hashlib
base=Path('D:/Projects/celestian/deploy/performance-20261018')
out=base/'release'; (out/'shared').mkdir(parents=True,exist_ok=True);(out/'assets').mkdir(exist_ok=True)
script=(base/'baseline/icons.js').read_text(encoding='utf8')
icons={}
for key,index in [('aeons',0),('relics',3),('terms',6)]:
    svg=Path(f'D:/Projects/celestian/audit/assets-20261018/{index}.body').read_text(encoding='utf8')
    icons[key]='data:image/svg+xml,'+urllib.parse.quote(svg,safe='')
for key in ['characters','enemies','gallery','factions']:
    icons[key]='data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"/%3E'
# Retain existing src-based optical-size CSS without triggering network requests.
for key,name in {'aeons':'deity-vortex-','characters':'characters-ensemble-','enemies':'enemies-crystal-flames-','gallery':'gallery-mechanical-','factions':'factions-convergence-'}.items():
    icons[key]+='#/'+name
script=script.replace('const seen=new WeakSet();','window.CelestianNodeImages='+json.dumps(icons,ensure_ascii=False)+';\nconst seen=new WeakSet();')
old='const key=Object.keys(mappings).find(k=>img.src.includes(k));if(!key)return;'
new="const kind={enemies:'dragon',gallery:'gallery',factions:'factions',characters:'characters'}[img.dataset.emblemId];const key=Object.keys(mappings).find(k=>mappings[k]===kind);if(!key)return;"
assert old in script;script=script.replace(old,new)
script += "\nconst deityStyle=document.createElement('style');deityStyle.textContent='#encyclopedia-app img[data-emblem-id=aeons]{transform:none;border-radius:0;object-fit:contain;animation:deity-vortex-turn 28s linear infinite;animation-play-state:paused}#encyclopedia-app .group:hover img[data-emblem-id=aeons]{animation-play-state:running}@media(prefers-reduced-motion:reduce){#encyclopedia-app img[data-emblem-id=aeons]{animation:none}}';document.head.append(deityStyle);\n"
(out/'shared/encyclopedia-icons-perf-v2.js').write_text(script,encoding='utf8')
main=(base/'baseline/main.js').read_text(encoding='utf8')
old='src:n.icon,className:`node-image'
assert main.count(old)==1
main=main.replace(old,'src:window.CelestianNodeImages?.[n.id]||n.icon,"data-emblem-id":n.id,className:`node-image')
(out/'assets/main-perf-20261018.js').write_text(main,encoding='utf8')
html=(base/'baseline/index.html').read_text(encoding='utf8')
html=html.replace('/assets/main-BTDGsAim-astrology-20261017.js','/assets/main-perf-20261018.js')
import re
html,n=re.subn(r'<script[^>]+src="/shared/encyclopedia-icon-motion-v2.js"[^>]*></script>','<script src="/shared/encyclopedia-icons-perf-v2.js"></script>',html)
assert n==1
(out/'index.html').write_text(html,encoding='utf8')
print('Prepared seven-icon delivery, preserving the four existing interactive SVGs and deity rotation.')
