from pathlib import Path
import hashlib, shutil, os

stage = Path('/tmp/celestian-factions-20261018')
root = Path('/var/www/celestian')
backup = Path('/var/backups/celestian-factions-20261018')
entries = []
for line in (stage / 'SHA256SUMS').read_text().splitlines():
    digest, rel = line.split('  ', 1)
    assert not Path(rel).is_absolute() and '..' not in Path(rel).parts
    src = stage / 'release' / rel
    assert hashlib.sha256(src.read_bytes()).hexdigest() == digest, rel
    entries.append((rel, digest))
assert not backup.exists(), 'Backup already exists; inspect before retrying'
backup.mkdir(parents=True)
new = []
for rel, digest in entries:
    dst = root / rel
    if dst.exists():
        saved = backup / rel
        saved.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(dst, saved)
    else:
        new.append(rel)
(backup / 'new-files.txt').write_text('\n'.join(new))
# Publish resources before HTML entry points, retaining all old assets.
for rel, digest in sorted(entries, key=lambda e: e[0].endswith('.html')):
    dst = root / rel
    dst.parent.mkdir(parents=True, exist_ok=True)
    tmp = dst.with_name(dst.name + '.factions-new')
    shutil.copyfile(stage / 'release' / rel, tmp)
    tmp.chmod(0o644)
    os.replace(tmp, dst)
    assert hashlib.sha256(dst.read_bytes()).hexdigest() == digest
print(f'Published {len(entries)} verified files. Backup: {backup}')
