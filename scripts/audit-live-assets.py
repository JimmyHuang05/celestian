import concurrent.futures, subprocess, pathlib, json, re, gzip
OUT=pathlib.Path('D:/Projects/celestian/audit/assets-20261018'); OUT.mkdir(parents=True,exist_ok=True)
icons=['deity-vortex-gothic-20261012','characters-ensemble-20261012','enemies-crystal-flames-20261011','relics','gallery-mechanical-20261012','factions-convergence-20261012','terms']
urls=['https://assets.jimmyhuang.cn/celestian/images/icons/'+x+'.svg' for x in icons]
urls += ['https://celestian.jimmyhuang.cn/'+x for x in ['assets/imperial-cloth-sZ5jyO_3.js','imperial-knights/selected-heraldry-v3/bear-selected.svg','unconventional-affairs/backgrounds/white-palace-oil-v1.png','assets/faction-catalog-tQzOHVv1.js']]
def check(pair):
 i,url=pair; body=OUT/f'{i}.body'; headers=OUT/f'{i}.headers'
 p=subprocess.run(['curl.exe','-sS','--compressed','--max-time','90','-D',str(headers),'-o',str(body),'-w','%{json}',url],capture_output=True,text=True)
 try: timing=json.loads(p.stdout)
 except: return {'url':url,'error':p.stderr}
 data=body.read_bytes() if body.exists() else b''; h=headers.read_text(errors='replace') if headers.exists() else ''
 row={'url':url,'status':timing.get('http_code'),'bytes':len(data),'wire_bytes':timing.get('size_download'),'ttfb':timing.get('time_starttransfer'),'seconds':timing.get('time_total'),'headers':{k:re.findall('^'+k+': *(.*)$',h,re.I|re.M) for k in ['content-type','content-encoding','cache-control','etag','age','cf-cache-status']},'error':p.stderr}
 if '.svg' in url or '.js' in url:
  row.update(gzip_bytes=len(gzip.compress(data)),paths=data.count(b'<path'),embedded_images=data.count(b'data:image'),filters=data.count(b'<filter'))
 return row
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool: rows=list(pool.map(check,enumerate(urls)))
(OUT/'network.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(rows,ensure_ascii=False,indent=2))
