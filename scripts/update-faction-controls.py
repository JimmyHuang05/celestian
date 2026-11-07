from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
def edit(file, old, new):
 p=root/file
 s=p.read_text(encoding='utf-8')
 assert old in s,(file,old)
 p.write_text(s.replace(old,new),encoding='utf-8')
edit('src/faction-catalog.js',"name: '帝国骑士团', affiliation: '帝国'","name: '五军同盟', affiliation: '霍亨泰因帝国'")
p=root/'imperial-knights.html'
s=p.read_text(encoding='utf-8').replace('帝国骑士团','五军同盟')
import re
s=re.sub(r'<button[^>]*id="motion-toggle".*?</button>','',s)
p.write_text(s,encoding='utf-8')
p=root/'src/imperial-knights.js'
s=p.read_text(encoding='utf-8')
s=re.sub(r"const toggle=document.querySelector\('#motion-toggle'\);\n",'',s)
s=re.sub(r"function setMotion\(\).*?\n", "function setMotion(){document.body.dataset.motion=paused?'paused':'playing';syncClothMotion()}\n",s)
s=re.sub(r"toggle.addEventListener\('click'.*?\n",'',s)
p.write_text(s,encoding='utf-8')
p=root/'src/eternal-astrology.js'
s=p.read_text(encoding='utf-8').replace('root.prepend(still, canvas, toggle);','root.prepend(still, canvas);')
p.write_text(s,encoding='utf-8')
p=root/'unconventional-affairs.html'
s=re.sub(r'<button class="affairs-profile__sky-toggle".*?</button>','',p.read_text(encoding='utf-8'))
p.write_text(s,encoding='utf-8')
p=root/'src/unconventional-affairs.js'
s=p.read_text(encoding='utf-8')
s='\n'.join(line for line in s.split('\n') if 'skyToggle' not in line and 'function toggleSky' not in line)
p.write_text(s,encoding='utf-8')
edit('src/faction-profile.js',"import { mountAstrologyAudio } from './astrology-audio.js';",'')
edit('src/faction-profile.js','const disposeAudio = mountAstrologyAudio(root);','const disposeAudio = () => {};')
edit('src/faction-navigation.js',"import './faction-navigation.css';","import './faction-navigation.css';\nimport { mountFactionSound } from './faction-sound.js';")
edit('src/faction-navigation.js','  host.replaceWith(nav);','  host.replaceWith(nav);\n  const disposeSound = mountFactionSound(document.body, theme);')
edit('src/faction-navigation.js','    nav.replaceWith(host);','    disposeSound();\n    nav.replaceWith(host);')
edit('src/faction-navigation.css',"'Astrology Page Song'","'Faction Navigation Song'")
edit('src/faction-navigation.css',"'Celestian Faction Song'","'Faction Navigation Song'")
sys.path.insert(0,str(root.parent/'.tools/font-optimization'))
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
font=TTFont(root.parent/'audit/eternal-astrology/NotoSerifSC-variable.ttf')
chars=(root/'src/faction-catalog.js').read_text(encoding='utf-8')+'势力静音开启声音'
sub=subset.Subsetter();sub.populate(text=chars);sub.subset(font)
font=instantiateVariableFont(font,{'wght':400},inplace=True)
font.flavor='woff2';font.save(root/'src/fonts/identity/faction-navigation.woff2')
with (root/'src/faction-navigation.css').open('a',encoding='utf-8') as f:
 f.write("\n@font-face{font-family:'Faction Navigation Song';src:url('./fonts/identity/faction-navigation.woff2') format('woff2');font-weight:400;font-display:swap}\n")
