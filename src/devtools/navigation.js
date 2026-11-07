// Injected by the serve-only Vite plugin. No production entry imports this file.
if (import.meta.env.DEV && window === window.top && !document.getElementById('celestian-dev-navigation')) {
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(`celestian-dev:${key}`)) ?? fallback } catch { return fallback } }
  const save = (key, value) => { try { localStorage.setItem(`celestian-dev:${key}`, JSON.stringify(value)) } catch { /* Storage can be disabled. */ } }
  const entry = new URL(location.href)
  if (entry.pathname === '/' && entry.searchParams.has('dev-entry')) {
    try {
      const target = entry.searchParams.get('dev-entry') === 'opening' ? 'opening' : 'hall'
      sessionStorage.setItem('celestian-dev-entry', target)
      if (target === 'opening') sessionStorage.removeItem('hasSeenIntro')
      else sessionStorage.setItem('hasSeenIntro', 'true')
    } catch { /* Continue with the application's default entry. */ }
    entry.searchParams.delete('dev-entry')
    history.replaceState(history.state, '', entry.pathname + entry.search + entry.hash)
    // The application entry may have run before this module; reload once after setting its entry state.
    location.replace(entry.href)
  } else {
    const host = document.createElement('div')
    host.id = 'celestian-dev-navigation'
    host.style.cssText = 'position:fixed;inset:0;z-index:2147483647;pointer-events:none;'
    const shadow = host.attachShadow({ mode: 'open' })
    shadow.innerHTML = `<style>
      :host{all:initial;color-scheme:dark;font-family:system-ui,"Microsoft YaHei",sans-serif;font-size:13px;color:#eee8da}*{box-sizing:border-box}button,input,a{font:inherit}button,a{touch-action:manipulation}button{cursor:pointer}button:focus-visible,a:focus-visible,input:focus-visible{outline:2px solid #e3c28a;outline-offset:3px}[hidden]{display:none!important}
      #toggle{position:fixed;right:20px;top:100px;pointer-events:auto;touch-action:none;user-select:none;border:1px solid #ae96735e;border-radius:24px;background:#171b20ed;color:#ead5ac;box-shadow:0 6px 24px #0007;padding:10px 14px;display:flex;align-items:center;gap:7px;font-size:12px}#toggle span{font-size:9px;color:#94999f;letter-spacing:.08em}
      #panel{position:fixed;right:20px;top:150px;width:min(430px,calc(100vw - 24px));max-height:calc(100dvh - 30px);pointer-events:auto;background:#14181ef7;border:1px solid #c3ad7e55;border-radius:16px;box-shadow:0 18px 70px #000b;display:flex;flex-direction:column;overflow:hidden;backdrop-filter:blur(18px)}header{display:flex;justify-content:space-between;align-items:center;padding:17px 18px 10px}header strong{font-weight:600}header small{display:block;color:#92979e;font-size:11px;margin-top:5px}#close{border:0;background:none;color:#c3c6cc;padding:6px 9px;font-size:20px}.search{padding:7px 16px 12px}input{width:100%;background:#0c1015;border:1px solid #64708066;border-radius:8px;padding:11px 12px;color:#f1eadc;outline:none}nav{display:flex;gap:5px;padding:0 16px 12px}nav button{background:transparent;border:0;border-radius:6px;color:#9ca2ac;padding:6px 10px;font-size:12px}nav button[aria-pressed=true]{background:#c2a87425;color:#e7cf9f}#list{overflow:auto;overscroll-behavior:contain;min-height:0;max-height:420px;padding:0 10px 9px}a{display:block;color:#e2dfd5;text-decoration:none;border:1px solid transparent;border-radius:8px;padding:10px;margin-bottom:3px}a:hover,a:focus{background:#ffffff09;border-color:#b4a07a55}a.current{background:#c2a87415}a strong{font-weight:500;font-size:13px;display:block;line-height:1.5}a small{font-size:10px;color:#7f8996;display:block;overflow-wrap:anywhere;margin-top:4px}.empty{color:#969da8;padding:24px 12px;line-height:1.8}footer{padding:11px 18px;border-top:1px solid #ffffff0b;font-size:10px;color:#818b97;display:flex;justify-content:space-between;gap:10px}#retry{border:1px solid #a48d65;background:none;color:#e7cf9f;border-radius:6px;padding:6px 10px}
      @media(max-width:500px){#panel{max-height:calc(100dvh - 24px)}#list{max-height:50dvh}#toggle{padding:9px 12px}}
      @media(max-width:640px){:host-context(body:has(.tiled-map)) #toggle{top:132px}}
    </style><button id="toggle" aria-label="开发导航" aria-expanded="false" aria-controls="panel" title="开发导航 · Alt+K · 可拖动">⌘ 页面 <span>DEV</span></button>
    <section id="panel" role="dialog" aria-label="开发页面导航" hidden><header><div><strong>开发导航</strong><small>搜索页面，直接跳转</small></div><button id="close" aria-label="关闭开发导航">×</button></header><div class="search"><input id="search" aria-label="搜索页面或输入本地路径" placeholder="搜索名称 / 文件名，或输入 /路径" autocomplete="off" /></div><nav aria-label="页面分类"><button data-group="全部" aria-pressed="true">全部</button><button data-group="正式页面" aria-pressed="false">正式页面</button><button data-group="设计预览" aria-pressed="false">设计预览</button><button data-group="最近" aria-pressed="false">最近</button></nav><div id="list" aria-live="polite"></div><footer><span id="count">正在读取页面…</span><span>Alt+K 开关 · Esc 关闭 · 拖动悬浮钮</span></footer></section>`
    document.body.append(host)
    const $ = selector => shadow.querySelector(selector)
    const toggle = $('#toggle'), panel = $('#panel'), input = $('#search'), list = $('#list')
    let pages = [], group = '全部', loaded = false, failed = false, previousFocus
    const recentValue = read('recent', [])
    let recent = Array.isArray(recentValue) ? recentValue.filter(x => typeof x === 'string').slice(0, 12) : []
    let position = read('position', null)
    function place() {
      if (position && Number.isFinite(position.x) && Number.isFinite(position.y)) {
        position.x = Math.max(8, Math.min(innerWidth - toggle.offsetWidth - 8, position.x))
        position.y = Math.max(8, Math.min(innerHeight - toggle.offsetHeight - 8, position.y))
        toggle.style.left = `${position.x}px`; toggle.style.top = `${position.y}px`; toggle.style.right = 'auto'
      }
      if (!panel.hidden) {
        const r = toggle.getBoundingClientRect()
        const height = panel.offsetHeight
        panel.style.left = `${Math.max(12, Math.min(innerWidth - panel.offsetWidth - 12, r.right - panel.offsetWidth))}px`
        panel.style.top = `${Math.max(12, Math.min(innerHeight - height - 12, r.bottom + 10))}px`
        panel.style.right = 'auto'
      }
    }
    function render() {
      list.replaceChildren()
      if (failed) { const box = document.createElement('div'); box.className = 'empty'; box.textContent = '页面列表暂时加载失败。'; const retry = document.createElement('button'); retry.id = 'retry'; retry.textContent = '重新加载'; retry.onclick = load; box.append(document.createElement('br'), retry); list.append(box); return }
      const query = input.value.trim().toLowerCase()
      let matches = pages.filter(p => (group === '全部' || (group === '最近' ? recent.includes(p.url) : p.group === group)) && `${p.title} ${p.url}`.toLowerCase().includes(query))
      if (group === '最近') matches.sort((a,b) => recent.indexOf(a.url) - recent.indexOf(b.url))
      if (query.startsWith('/') && !query.startsWith('//')) {
        const custom = new URL(input.value.trim(), location.origin)
        if (custom.origin === location.origin && !matches.some(p => p.url === custom.pathname + custom.search + custom.hash)) matches.unshift({title:'跳转到输入的本地路径',url:custom.pathname+custom.search+custom.hash})
      }
      for (const page of matches) {
        const a = document.createElement('a'); a.href = page.url
        if (page.url === location.pathname + location.search) { a.className = 'current'; a.setAttribute('aria-current', 'page') }
        const title = document.createElement('strong'); title.textContent = page.title
        const path = document.createElement('small'); path.textContent = page.url
        a.append(title,path)
        a.addEventListener('click', event => { recent = [page.url, ...recent.filter(x => x !== page.url)].slice(0,12); save('recent',recent); if (!event.ctrlKey && !event.metaKey && !event.shiftKey && event.button === 0) { event.preventDefault(); location.assign(page.url) } })
        list.append(a)
      }
      if (!matches.length) { const empty = document.createElement('div'); empty.className = 'empty'; empty.textContent = loaded ? '没有匹配的页面。也可以直接输入 / 开头的本地路径。' : '正在读取本地页面…'; list.append(empty) }
      $('#count').textContent = `${matches.length} 个页面 · 仅开发环境`
      place()
    }
    async function load() { failed = false; try { const response = await fetch('/__dev-navigation/pages.json'); if (!response.ok) throw new Error('catalog'); pages = await response.json(); loaded = true } catch { failed = true } render() }
    function setOpen(open) { panel.hidden = !open; toggle.setAttribute('aria-expanded',String(open)); if(open) { previousFocus = document.activeElement; render(); input.focus(); if(!loaded) load() } else { (previousFocus?.isConnected ? previousFocus : toggle).focus() } }
    let dragging, suppressClick = false
    toggle.addEventListener('pointerdown', event => { if(event.button !== 0) return; const r = toggle.getBoundingClientRect(); dragging = { x:event.clientX,y:event.clientY,left:r.left,top:r.top }; suppressClick = false; toggle.setPointerCapture(event.pointerId) })
    toggle.addEventListener('pointermove', event => { if(!dragging) return; const dx=event.clientX-dragging.x,dy=event.clientY-dragging.y; if(Math.hypot(dx,dy)>5) suppressClick=true; if(suppressClick){ position={x:dragging.left+dx,y:dragging.top+dy};place() } })
    const endDrag = () => { if(dragging && suppressClick) save('position',position); dragging=null }
    toggle.addEventListener('pointerup',endDrag); toggle.addEventListener('pointercancel',endDrag)
    toggle.addEventListener('click',()=>{if(suppressClick){suppressClick=false;return}setOpen(panel.hidden)})
    $('#close').onclick=()=>setOpen(false)
    input.addEventListener('input',render)
    input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();list.querySelector('a')?.click()}if(event.key==='ArrowDown'){event.preventDefault();list.querySelector('a')?.focus()}})
    shadow.querySelector('nav').addEventListener('click',event=>{const button=event.target.closest('[data-group]');if(!button)return;group=button.dataset.group;shadow.querySelectorAll('[data-group]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));render()})
    document.addEventListener('keydown',event=>{if(event.altKey&&event.key.toLowerCase()==='k'){event.preventDefault();setOpen(panel.hidden)}else if(event.key==='Escape'&&!panel.hidden){event.preventDefault();event.stopImmediatePropagation();setOpen(false)}},true)
    document.addEventListener('pointerdown',event=>{if(!panel.hidden&&!event.composedPath().includes(host))setOpen(false)})
    window.addEventListener('resize',place)
    window.addEventListener('popstate',()=>{if(!panel.hidden)render()})
    place()
  }
}
