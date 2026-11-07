from pathlib import Path
import hashlib,shutil,tarfile
root=Path(__file__).resolve().parents[1]
stage=root.parent/'deploy/imperial-bronze-20261018'
release=stage/'release'
dst=release/'factions/imperial-knights/index.html'
dst.parent.mkdir(parents=True,exist_ok=True)
shutil.copyfile(release/'imperial-knights.html',dst)
files=sorted(p for p in release.rglob('*') if p.is_file())
(stage/'SHA256SUMS').write_text('\n'.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.relative_to(release).as_posix() for p in files))
(stage/'publish.py').write_text((root/'scripts/publish-factions-release.py').read_text().replace('celestian-factions-20261018','celestian-imperial-bronze-20261018'))
with tarfile.open(stage/'release.tar.gz','w:gz') as t:
 for name in ['release','SHA256SUMS','publish.py']:t.add(stage/name,arcname=name)
print(f'{len(files)} verified files; archive {(stage/"release.tar.gz").stat().st_size} bytes')
