from pathlib import Path
import shutil,hashlib,json
root=Path(__file__).resolve().parents[1]
base=root.parent/'deploy/performance-20261018';out=base/'release'
for group in ['imperial-knights','unconventional-affairs']:
    shutil.copytree(root/'public'/group/'delivery-v1',out/group/'delivery-v1',dirs_exist_ok=True)
    target=out/'factions'/group;target.mkdir(parents=True,exist_ok=True)
    shutil.copyfile(out/f'{group}.html',target/'index.html')
rows=[]
for f in sorted(out.rglob('*')):
    if f.is_file(): rows.append(hashlib.sha256(f.read_bytes()).hexdigest()+'  '+f.relative_to(out).as_posix())
(base/'SHA256SUMS').write_text('\n'.join(rows)+'\n')
print(f'{len(rows)} files; {sum(f.stat().st_size for f in out.rglob("*") if f.is_file())/1e6:.2f} MB before archive compression')
