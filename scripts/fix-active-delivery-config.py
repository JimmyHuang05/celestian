from pathlib import Path
import shutil,subprocess
backup=Path('/var/backups/celestian-performance-20261018')
p=Path('/etc/nginx/sites-enabled/celestian')
shutil.copy2(p,backup/'celestian-active.nginx')
text=p.read_text().replace('server {','server {\n    include /etc/nginx/snippets/celestian-delivery.conf;',1)
text=text.replace('location / { try_files $uri $uri/ /index.html; }','location / { add_header Cache-Control "no-cache"; try_files $uri $uri/ /index.html; }')
text=text.replace('    location /assets/','    location ~ ^/(imperial-knights|unconventional-affairs|eternal-astrology)/ { expires 7d; add_header Cache-Control "public, max-age=604800"; try_files $uri =404; }\n    location = /shared/encyclopedia-icons-perf-v2.js { expires 1y; add_header Cache-Control "public, immutable"; }\n    location /assets/',1)
p.write_text(text)
try: subprocess.run(['nginx','-t'],check=True)
except: shutil.copy2(backup/'celestian-active.nginx',p);raise
shutil.copy2(backup/'celestian.nginx','/etc/nginx/sites-available/celestian')
subprocess.run(['systemctl','reload','nginx'],check=True)
print('Active config updated and inactive config restored')
