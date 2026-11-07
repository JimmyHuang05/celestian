const stage = document.getElementById('stage');
const query = new URLSearchParams(location.search);
const nations = {
  indigo: { name: '阿斯特拉王国', english: 'ASTRA', description: '靛蓝 · 银白', place: '王都', type: '王室直属机构' },
  verdant: { name: '维瑞迪安联邦', english: 'VIRIDIAN', description: '苍绿 · 米白', place: '林都', type: '联邦直属机构' },
  garnet: { name: '奥瑞恩帝国', english: 'AUREN', description: '绛红 · 浅金', place: '帝都', type: '帝国直属机构' },
  independent: { name: '群星之间', english: 'BEYOND BORDERS', description: '无国家 · 星空', place: '高地', type: '独立学术组织' },
};
const requestedCountry = query.get('country') || (query.get('affiliation') === 'independent' ? 'independent' : 'indigo');
const state = {
  design: Math.min(5, Math.max(1, Math.trunc(Number(query.get('design')) || 1))),
  country: Object.hasOwn(nations, requestedCountry) ? requestedCountry : 'indigo',
  chapter: 0,
  narrow: false,
  clean: false,
};
const concepts = [
  { name: '同源', subtitle: '非对称构图', description: '以一片国家色容纳名称、徽记与正文；国旗的斜带成为画面的光。' },
  { name: '环心', subtitle: '中轴构图', description: '徽记与名称共用一个中心，星盘向页面边缘退去，正文顺势向下展开。' },
  { name: '铭文', subtitle: '纵向构图', description: '以竖排势力名称建立重心，横向正文和徽记在同一底色上相互平衡。' },
  { name: '循弧', subtitle: '章节构图', description: '一条连续星轨串起势力概述、宗旨与历史，让导航也成为构图的一部分。' },
  { name: '余晖', subtitle: '叙事构图', description: '从国家与势力的归属开始，沿着一片连续的色彩，读完组织的来处与今日。' },
];
const chapters = [
  { label: '势力概述', title: '为大地，记录群星。', english: 'A WATCH OVER THE WORLD', paragraphs: ['星象院立于都城最高处，观测天象、修订历法，也保存历代观测者留下的星图。入夜之后，高塔的灯火与远方的观测站一同亮起。', '一份观测可以跨越千里，一次发现可能历经数代。那些被细心保存的笔迹，最终汇成了人们认识世界的方式。'] },
  { label: '组织与宗旨', title: '让求知，成为共同的誓言。', english: 'A SHARED CONVICTION', paragraphs: ['观测席仰望天空，历法席校准时间，档案席守护记忆。三个席位相互独立，又共同签署每一份正式的观测记录。', '每位成员都相信，知识必须能够被后来者验证。面对权力与未知，观测者仍须如实写下自己看见的天空。'] },
  { label: '历史沿革', title: '从一座高塔，到万里星图。', english: 'AN UNFINISHED HISTORY', paragraphs: ['最初，这里只是一座校准节令的高塔。随着航路开拓，历法与星图逐渐成为远行者共同使用的语言。', '此后，分散的观测者开始使用同一套记录方式。最早的铜制仪器仍保留在塔顶，提醒后来者：所有结论，都始于一次耐心的观察。'] },
];
const affiliated = () => state.country !== 'independent';
const nation = () => nations[state.country];
const faction = () => ({ indigo: '王立星象院', verdant: '联邦星象院', garnet: '帝国星象院', independent: '群星观测会' }[state.country]);
const displayText = text => affiliated() ? text : text.replaceAll('星象院', '观测会').replaceAll('都城', '高地');
const arrow = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15m-5-5 5 5-5 5"/></svg>';

function emblem({ decorative = false, large = false } = {}) {
  return `<svg class="emblem${large ? ' emblem-ghost' : ''}" viewBox="0 0 400 440" ${decorative ? 'aria-hidden="true"' : 'role="img" aria-label="势力示意徽记：星辰、双翼与环轨"'}>
    <g fill="none" stroke="currentColor" stroke-width="1.35">
      <circle cx="200" cy="176" r="85"/><circle cx="200" cy="176" r="96" stroke-width=".45"/>
      <ellipse cx="200" cy="176" rx="112" ry="34" transform="rotate(-38 200 176)"/>
      <path d="M200 48v38M191 65h18M200 271v52M192 308l8 15 8-15"/>
      <path d="M171 265C104 247 71 185 60 109c31 32 52 45 79 51M229 265c67-18 100-80 111-156-31 32-52 45-79 51"/>
      <path d="M128 235C82 211 48 155 38 78c35 37 59 55 99 69M272 235c46-24 80-80 90-157-35 37-59 55-99 69"/>
      <path d="M107 200C71 178 41 131 24 58c40 47 70 66 115 78M293 200c36-22 66-69 83-142-40 47-70 66-115 78"/>
      <path d="M91 284q22 52 96 57M309 284q-22 52-96 57"/>
    </g>
    <g fill="currentColor">
      <path d="m200 104 14 51 43-36-35 44 50 13-50 13 35 44-43-36-14 51-14-51-43 36 35-44-50-13 50-13-35-44 43 36Z"/>
      <path d="M104 305q-25 0-30-20 22 3 30 20m18 16q-26 5-36-14 25 0 36 14m24 12q-23 11-38-7 24-6 38 7m150-28q25 0 30-20-22 3-30 20m-18 16q26 5 36-14-25 0-36 14m-24 12q23 11 38-7-24-6-38 7"/>
      <circle cx="200" cy="47" r="3"/>
    </g>
    <path d="M156 361h88M177 368h46" stroke="currentColor" opacity=".7"/>
    <text x="200" y="397" text-anchor="middle" fill="currentColor" font-family="Georgia,serif" font-size="10" letter-spacing="5">AD ASTRA</text>
  </svg>`;
}
function flagMarkup(className = '') {
  if (!affiliated()) return '';
  const pattern = state.country === 'verdant'
    ? '<path d="M0 280h900v40H0Z" fill="var(--flag-cream)"/><path d="M284 0h32v600h-32Z" fill="var(--flag-cream)"/>'
    : state.country === 'garnet'
      ? '<path d="M0 0h900L450 360Z" fill="var(--flag-cream)"/>'
      : '<path d="M0 0h170l730 480v120H730L0 120Z" fill="var(--flag-cream)"/>';
  return `<svg class="national-flag ${className}" viewBox="0 0 900 600" aria-hidden="true"><rect width="900" height="600" fill="var(--flag-base)"/>${pattern}<circle cx="450" cy="300" r="93" fill="var(--flag-base)" stroke="var(--flag-gold)" stroke-width="3"/><path d="m450 226 14 52 43-34-33 43 50 13-50 13 33 43-43-34-14 52-14-52-43 34 33-43-50-13 50-13-33-43 43 34Z" fill="var(--flag-gold)"/></svg>`;
}
function sky() {
  let dots = '';
  for (let i = 0; i < 150; i++) {
    const x = (i * 907 + 71) % 1600, y = (i * i * 37 + 173) % 1000;
    dots += `<circle cx="${x}" cy="${y}" r="${i % 19 === 0 ? 1.65 : .7}" opacity="${.15 + (i % 7) * .09}"/>`;
  }
  return `<svg class="open-sky" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g fill="currentColor">${dots}</g></svg>`;
}
function arc(className = '') {
  let ticks = '';
  for (let i = 0; i < 90; i++) {
    const a = i * Math.PI / 45, outer = 480, inner = i % 5 === 0 ? 466 : 474;
    ticks += `M${500 + Math.sin(a) * inner} ${500 + Math.cos(a) * inner}L${500 + Math.sin(a) * outer} ${500 + Math.cos(a) * outer}`;
  }
  return `<svg class="orbit ${className}" viewBox="0 0 1000 1000" fill="none" aria-hidden="true"><g stroke="currentColor"><circle cx="500" cy="500" r="495" stroke-width=".6"/><circle cx="500" cy="500" r="456" stroke-width=".7"/><path d="${ticks}" stroke-width=".7"/><path d="M190 141A474 474 0 0 1 935 685" stroke-width="2" opacity=".5"/><ellipse cx="500" cy="500" rx="453" ry="160" transform="rotate(-28 500 500)" stroke-width=".6" opacity=".35"/></g><g fill="currentColor"><circle cx="111" cy="230" r="4"/><path d="m888 707 3 10 10 3-10 3-3 10-3-10-10-3 10-3Z"/></g></svg>`;
}
function ambience() {
  return `<div class="atmosphere" aria-hidden="true"><div class="country-light"></div><div class="country-weave weave-${state.country}"></div>${affiliated() ? '<div class="country-insignia">✧</div>' : sky()}<div class="surface-grain"></div></div>`;
}
function countryLine() {
  return `<button type="button" class="country-line" data-country-info aria-label="查看${affiliated() ? nation().name + '示例国旗' : '势力归属'}">${flagMarkup('flag-small')}<span>${nation().name}</span><span class="country-line-rule"></span><small>${affiliated() ? '所属国家' : '不隶属于任何国家'}</small></button>`;
}
function chrome() {
  return `<header class="scene-header"><a class="return-link" href="/encyclopedia"><span>←</span>百科 · 势力</a><span class="site-wordmark">CELESTIAN</span><span class="chapter-label">势力志</span></header>`;
}
function title({ split = false } = {}) {
  const name = faction();
  const english = { indigo: 'THE ROYAL OBSERVATORY', verdant: 'THE FEDERAL OBSERVATORY', garnet: 'THE IMPERIAL OBSERVATORY', independent: 'THE ASTRAL SOCIETY' }[state.country];
  return `<h1 class="faction-name">${split ? `${name.slice(0, 2)}<br>${name.slice(2)}` : name}</h1><p class="faction-english">${english}</p>`;
}
function facts() {
  return `<dl class="faction-facts"><div><dt>性质</dt><dd>${nation().type}</dd></div><div><dt>驻地</dt><dd>${nation().place}观星台</dd></div><div><dt>职责</dt><dd>天象与历法</dd></div></dl>`;
}
function prose(index = state.chapter, single = false) {
  const paragraphs = single ? chapters[index].paragraphs.slice(0, 1) : chapters[index].paragraphs;
  return `<div class="reading-copy">${paragraphs.map(p => `<p>${displayText(p)}</p>`).join('')}</div>`;
}
function tabs(className = '') {
  return `<nav class="reading-tabs ${className}" aria-label="势力详情章节">${chapters.map((c, i) => `<button type="button" data-chapter="${i}" aria-pressed="${i === state.chapter}"><span class="tab-point"></span>${c.label}</button>`).join('')}</nav>`;
}
function crestButton(extra = '') {
  return `<button type="button" class="emblem-button ${extra}" data-emblem aria-label="放大势力徽记">${emblem()}</button>`;
}
function pageEnd() {
  return `<footer class="scene-footer"><span>群星之下，求索不息。</span><span>${nation().english} <i>/</i> FACTIONS</span><button type="button" data-emblem>势力徽记 <span>↗</span></button></footer>`;
}
function fieldDesign() {
  return `<div class="surface field theme-${state.country}">${ambience()}${chrome()}<div class="field-body"><div class="field-identity">${countryLine()}${title({ split: true })}<p class="faction-line">以群星为证，以求知为誓。</p></div><div class="field-symbol">${arc('field-orbit')}${crestButton()}<span class="symbol-caption">群星与守望</span></div><article class="field-reading">${tabs()}${prose()}</article><div class="field-facts">${facts()}</div></div>${pageEnd()}</div>`;
}
function heartDesign() {
  return `<div class="surface heart theme-${state.country}">${ambience()}${chrome()}${arc('heart-orbit')}<div class="heart-body"><div class="heart-country">${countryLine()}</div>${crestButton()}${title()}<p class="heart-motto">「让记录长于生命，让知识越过边界。」</p><div class="heart-reading"><div class="heart-reading-head"><span class="subtle-star">✧</span>${tabs()}<span class="subtle-star">✧</span></div>${prose()}${facts()}</div></div>${pageEnd()}</div>`;
}
function inscriptionDesign() {
  return `<div class="surface inscription theme-${state.country}">${ambience()}${chrome()}<div class="inscription-body"><div class="inscription-country">${countryLine()}</div><div class="inscription-symbol">${crestButton()}<p>以群星为证<br>以求知为誓</p></div><article class="inscription-reading"><span class="section-kicker">${chapters[state.chapter].label}</span><h2>${chapters[state.chapter].title}</h2>${prose()}${tabs('inscription-tabs')}${facts()}</article><div class="inscription-name">${title()}<span class="inscription-note">观天象 · 定历法 · 存群星之记</span></div>${arc('inscription-orbit')}</div>${pageEnd()}</div>`;
}
function orbitalDesign() {
  return `<div class="surface passage theme-${state.country}">${ambience()}${chrome()}<div class="passage-body"><div class="passage-identity">${countryLine()}${title()}<p class="faction-line">那些仰望天空的人，也在为大地寻找方向。</p></div><div class="passage-symbol">${crestButton()}</div><div class="passage-track"><svg viewBox="0 0 1000 170" preserveAspectRatio="none" aria-hidden="true"><path d="M-80 155Q500-95 1080 155"/><path d="M-80 166Q500-84 1080 166" opacity=".25"/></svg>${chapters.map((c, i) => `<button type="button" class="passage-stop stop-${i}" data-chapter="${i}" aria-pressed="${i === state.chapter}"><span class="stop-orb">${['Ⅰ','Ⅱ','Ⅲ'][i]}</span><span>${c.label}</span></button>`).join('')}</div><article class="passage-reading"><div class="passage-chapter"><span>0${state.chapter + 1}</span><h2>${chapters[state.chapter].title}</h2></div>${prose()}<button type="button" class="next-chapter" data-next>下一章 ${arrow}</button></article><div class="passage-facts">${facts()}</div></div>${pageEnd()}</div>`;
}
function horizonDesign() {
  return `<div class="surface horizon theme-${state.country}">${ambience()}${chrome()}<section class="horizon-opening"><div class="horizon-country">${countryLine()}</div><div class="horizon-title">${title()}<p>一群仰望星空的人，<br>一部尚未写完的历史。</p><button type="button" class="read-down" data-scroll="horizon-origin">循光而下 <span>↓</span></button></div><div class="horizon-symbol">${crestButton()}${arc('horizon-orbit')}</div><span class="opening-footnote">${nation().english} · ${affiliated() ? '国家之下，群星之上' : '以天空为共同的故乡'}</span></section><section class="horizon-text" id="horizon-origin"><div class="horizon-sticky"><span class="section-kicker">势力详情</span><p>故事由此，<br>继续生长。</p><nav aria-label="长卷章节"><button type="button" data-scroll="horizon-origin">起源</button><button type="button" data-scroll="horizon-covenant">宗旨</button><button type="button" data-scroll="horizon-present">今日</button></nav></div><div class="horizon-essays"><article><span class="essay-number">Ⅰ / 起源</span><h2>从一座高塔，<br>到万里星图。</h2>${prose(2)}</article><article id="horizon-covenant"><span class="essay-number">Ⅱ / 宗旨</span><blockquote>“我们终将离开，<br>群星与记录长存。”</blockquote>${prose(1)}</article><article id="horizon-present"><span class="essay-number">Ⅲ / 今日</span><h2>下一页，仍有空白。</h2>${prose(0)}${facts()}</article></div></section>${pageEnd()}</div>`;
}
const layouts = [fieldDesign, heartDesign, inscriptionDesign, orbitalDesign, horizonDesign];
function render({ top = false } = {}) {
  stage.innerHTML = layouts[state.design - 1]();
  const concept = concepts[state.design - 1];
  document.getElementById('concept-label').textContent = concept.subtitle;
  document.getElementById('concept-name').textContent = concept.name;
  document.getElementById('concept-description').textContent = concept.description;
  document.querySelectorAll('[data-design]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.design) === state.design)));
  document.getElementById('country-select').value = state.country;
  const url = new URL(location.href);
  url.searchParams.set('design', String(state.design));
  url.searchParams.set('country', state.country);
  url.searchParams.delete('affiliation');
  history.replaceState(null, '', url);
  document.title = `${concept.name} · 势力设计第二轮 | Celestian`;
  document.querySelector('meta[name="theme-color"]').content = { indigo: '#344662', verdant: '#35544a', garnet: '#633f4a', independent: '#101828' }[state.country];
  if (top) window.scrollTo({ top: 0, behavior: 'instant' });
}
const announce = text => { document.getElementById('announcement').textContent = text; };
document.querySelectorAll('[data-design]').forEach(button => button.addEventListener('click', () => {
  state.design = Number(button.dataset.design); state.chapter = 0; render({ top: true }); announce(`已切换至${concepts[state.design - 1].name}`);
}));
document.getElementById('country-select').addEventListener('change', event => {
  state.country = event.target.value; render(); announce(`${nation().name}，${nation().description}`);
});
document.getElementById('width-toggle').addEventListener('click', event => {
  state.narrow = !state.narrow; stage.classList.toggle('narrow', state.narrow);
  event.currentTarget.setAttribute('aria-pressed', String(state.narrow)); event.currentTarget.textContent = state.narrow ? '宽屏' : '窄屏';
});
function clean() {
  state.clean = !state.clean; document.body.classList.toggle('clean-preview', state.clean);
  document.querySelector('.restore-studio').hidden = !state.clean;
  document.getElementById('clean-toggle').setAttribute('aria-pressed', String(state.clean));
}
document.getElementById('clean-toggle').addEventListener('click', clean);
document.querySelector('.restore-studio').addEventListener('click', clean);
const dialog = document.getElementById('detail-dialog');
let returnFocus;
stage.addEventListener('click', event => {
  const chapter = event.target.closest('[data-chapter]'), next = event.target.closest('[data-next]');
  const logo = event.target.closest('[data-emblem]'), country = event.target.closest('[data-country-info]'), scroll = event.target.closest('[data-scroll]');
  if (chapter || next) {
    state.chapter = chapter ? Number(chapter.dataset.chapter) : (state.chapter + 1) % chapters.length;
    render(); stage.querySelector(next ? '[data-next]' : `[data-chapter="${state.chapter}"]`)?.focus({ preventScroll: true });
    announce(chapters[state.chapter].label);
  }
  if (logo || country) {
    returnFocus = logo || country;
    dialog.className = `theme-${state.country}`;
    document.getElementById('detail-title').textContent = logo ? faction() : nation().name;
    document.getElementById('detail-art').innerHTML = logo ? emblem() : affiliated() ? flagMarkup('flag-full') : '<span class="independent-mark">✧</span>';
    document.getElementById('detail-caption').textContent = logo ? '星辰、双翼与环轨 · 势力徽记示意' : affiliated() ? `${nation().description} · 国家旗帜示意` : '不隶属于任何国家，以共同的信念相聚。';
    dialog.showModal();
  }
  if (scroll) document.getElementById(scroll.dataset.scroll)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
});
dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => returnFocus?.focus({ preventScroll: true }));
dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
document.addEventListener('keydown', event => {
  if (event.target.closest('input,select,textarea,button') || dialog.open) return;
  if (/^[1-5]$/.test(event.key)) { state.design = Number(event.key); state.chapter = 0; render({ top: true }); }
  if (event.key === 'Escape' && state.clean) clean();
});
render();
