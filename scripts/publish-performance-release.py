from pathlib import Path
import hashlib,shutil,os,subprocess
stage=Path('/tmp/celestian-performance-20261018')
root=Path('/var/www/celestian');backup=Path('/var/backups/celestian-performance-20261018')
assert not backup.exists(), 'Inspect prior deployment before retry'
rows=[line.split('  ',1) for line in (stage/'SHA256SUMS').read_text().splitlines()]
for digest,rel in rows:
    assert '..' not in Path(rel).parts and not Path(rel).is_absolute()
    assert hashlib.sha256((stage/'release'/rel).read_bytes()).hexdigest()==digest,rel
# Reject stale patches rather than overwriting concurrent homepage changes.
assert hashlib.sha256((root/'index.html').read_bytes()).hexdigest()==(stage/'baseline-index.sha256').read_text().strip()
backup.mkdir(parents=True)
configs=[Path('/etc/nginx/sites-available/celestian'),Path('/etc/nginx/sites-available/assets')]
for c in configs: shutil.copy2(c,backup/(c.name+'.nginx'))
snippet=Path('/etc/nginx/snippets/celestian-delivery.conf')
assert not snippet.exists()
snippet.write_text('gzip on;\ngzip_vary on;\ngzip_comp_level 5;\ngzip_min_length 1024;\ngzip_types text/css application/javascript application/json image/svg+xml application/xml text/plain;\n')
for c in configs:
    text=c.read_text();text=text.replace('server {','server {\n    include /etc/nginx/snippets/celestian-delivery.conf;',1)
    if c.name=='celestian':
        text=text.replace('location / { try_files $uri $uri/ /index.html; }','location / { add_header Cache-Control "no-cache"; try_files $uri $uri/ /index.html; }')
        text=text.replace('    location /assets/', '    location ~ ^/(imperial-knights|unconventional-affairs|eternal-astrology)/ { expires 7d; add_header Cache-Control "public, max-age=604800"; try_files $uri =404; }\n    location = /shared/encyclopedia-icons-perf-v1.js { expires 1y; add_header Cache-Control "public, immutable"; }\n    location /assets/',1)
    c.write_text(text)
try: subprocess.run(['nginx','-t'],check=True)
except:
    for c in configs: shutil.copy2(backup/(c.name+'.nginx'),c)
    snippet.unlink();raise
new=[]
for digest,rel in sorted(rows,key=lambda row:row[1].endswith('.html')):
    dst=root/rel
    if dst.exists():
        saved=backup/'site'/rel;saved.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(dst,saved)
    else:new.append(rel)
    dst.parent.mkdir(parents=True,exist_ok=True)
    temp=dst.with_name(dst.name+'.perf-new');shutil.copyfile(stage/'release'/rel,temp);temp.chmod(0o644);os.replace(temp,dst)
    assert hashlib.sha256(dst.read_bytes()).hexdigest()==digest
(backup/'new-files.txt').write_text('\n'.join(new))
subprocess.run(['systemctl','reload','nginx'],check=True)
print(f'Published {len(rows)} verified files; nginx config valid; backup {backup}')
