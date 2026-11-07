from pathlib import Path
import shutil,hashlib,tarfile
root=Path(__file__).resolve().parents[1]
stage=root.parent/'deploy/faction-sound-20261018'
release=stage/'release'
for name,route in [('imperial-knights','imperial-knights'),('unconventional-affairs','unconventional-affairs'),('faction-profile','eternal-astrology')]:
 dst=release/'factions'/route/'index.html';dst.parent.mkdir(parents=True,exist_ok=True)
 shutil.copyfile(release/(name+'.html'),dst)
files=sorted(p for p in release.rglob('*') if p.is_file())
(stage/'SHA256SUMS').write_text('\n'.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.relative_to(release).as_posix() for p in files))
publish=(root/'scripts/publish-factions-release.py').read_text().replace('celestian-factions-20261018','celestian-faction-sound-20261018')
(stage/'publish.py').write_text(publish)
with tarfile.open(stage/'release.tar.gz','w:gz') as tar:
 tar.add(release,arcname='release');tar.add(stage/'SHA256SUMS',arcname='SHA256SUMS');tar.add(stage/'publish.py',arcname='publish.py')
print(len(files),'files', (stage/'release.tar.gz').stat().st_size,'bytes')
