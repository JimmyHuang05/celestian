const asset = '/unconventional-affairs/reimagined-v1/';
const directions = {
  fog: { name: '雾都的另一面', index: 'A', art: 'fog.webp' },
  cabinet: { name: '被封存的奇迹', index: 'B', art: 'cabinet.webp' },
  watch: { name: '替世界守夜', index: 'C', art: 'watch.webp' },
};
const main = document.querySelector('#study-root');
const bar = document.querySelector('.study-bar');
const reading = document.querySelector('.reading-layer');
const sheet = document.querySelector('.reading-sheet');
const content = document.querySelector('#reading-content');
const announcement = document.querySelector('.view-announcement');
let active = 'compare';
let returnFocus = null;

const cases = {
  fog: {
    eyebrow: '异闻记录 · 雾都', title: '倒影中的建筑', english: 'The unrecorded reflection',
    lead: '河岸没有这座建筑。\n水中却亮着它的每一扇窗。',
    body: '夜雾散开时，观测者发现倒影与河岸不再对应。水面之下的建筑仍然明亮，钟楼的尖顶指向深处。它没有出现在任何一段真实的天际线上。',
    entries: [ ['异常表现', '同一片水面，映出两个不相容的世界。'], ['观测重点', '确认倒影是否随视点、光照与水流改变。'], ['职责表达', '在未知进入日常之前，找到现实仍然成立的边界。'] ],
  },
  cabinet: {
    eyebrow: '特藏案卷 · 封存物', title: '一场未结束的雨', english: 'A night, preserved',
    lead: '室外已是白昼。\n玻璃之内，雨夜尚未过去。',
    body: '薄薄一层玻璃，容纳着完全不同的天气。云层、雨与海面在其中自行延续。封存记录的第一条，并非为它命名，而是确认它仍在这里。',
    entries: [ ['形态记录', '一只玻璃匣，以及其中持续存在的雨夜。'], ['观测重点', '记录内部时间与外部昼夜之间的关系。'], ['职责表达', '以审慎的记录与研究，对待每一个尚未理解的奇迹。'] ],
  },
  watch: {
    eyebrow: '夜巡记录 · 黎明以前', title: '天空留下的空白', english: 'Where the night comes undone',
    lead: '城市的灯没有熄灭。\n只是星空，少了一部分。',
    body: '从屋顶望去，那片空白没有边界应有的形状。远处的建筑轮廓正在它旁边失去颜色。守夜者停下脚步，辨认仍然能够信任的道路。',
    entries: [ ['异常表现', '夜空与远景的局部，正在失去原有的形态。'], ['行动重心', '辨识影响范围，并守住通向日常生活的街区。'], ['职责表达', '有些长夜，由我们走完。'] ],
  },
};

function definitions(entries) {
  return `<dl class="reading-definitions">${entries.map(([key,value]) => `<div><dt>${key}</dt><dd>${value}</dd></div>`).join('')}</dl>`;
}
function panelMarkup(kind) {
  if (kind === 'case') {
    const entry = cases[active];
    return `<p class="reading-eyebrow">${entry.eyebrow}</p><h2 id="reading-title">${entry.title}</h2><p class="reading-english">${entry.english}</p><img class="reading-case-image" src="${asset}${directions[active].art}" alt="${directions[active].name}的概念主视觉"><p class="reading-lead">${entry.lead.replace('\n','<br>')}</p><p class="reading-body">${entry.body}</p>${definitions(entry.entries)}<p class="reading-note">本事件为本次视觉方案的叙事示意，尚未纳入正式世界观设定。</p>`;
  }
  if (kind === 'people') {
    return `<p class="reading-eyebrow">人员名录 · 榆树小姐</p><h2 id="reading-title">伊洛薇恩</h2><p class="reading-english">Elowen · Melville · Stuart</p><p class="reading-lead">在法庭上，追问公正。<br>在秩序之外，修补规则。</p><p class="reading-body">在翡兰珀的社交圈和司法界，伊洛薇恩·梅尔维尔·斯图亚特是一个让人又敬又畏的名字。她以近乎偏执的正义感闻名，同僚称她为“审判魔女”。</p>${definitions([['公开身份','「第三意见」律师事务所'],['另一重身份','奥兰尼亚非常规事务署核心成员'],['代号与途径','「榆树小姐」 · 「秩序」']])}<blockquote class="reading-quote">规则被打破后，<br>必然有人来修补。</blockquote><p class="reading-note">人物身份与引文沿用现有资料；主视觉中的背影为概念角色，不代表已确定的人物形象。</p>`;
  }
  return `<p class="reading-eyebrow">奥兰尼亚 · 署务总览</p><h2 id="reading-title">吾等守护界限</h2><p class="reading-english">Servamus Limen</p><p class="reading-lead">让世界，继续如常。</p><p class="reading-body">有些事物无法以常理解释，有些规则在无人察觉时被打破。我们以审慎面对未知，以行动守护日常。</p>${definitions([['看见','发现日常之中失常的细节，确认异常的边界。'],['理解','通过观测与记录，辨认被打破的规则。'],['守护','修补秩序，让每一盏灯背后的生活继续。']])}<blockquote class="reading-quote">行走于黑暗，<br>侍奉于光明。</blockquote><p class="reading-note">本页职责文案为设计提案，依据现有“修补自然规则”的设定编排。</p>`;
}

function closePanel(restoreFocus = true) {
  if (reading.hidden) return;
  reading.hidden = true;
  main.inert = false;
  bar.inert = false;
  document.querySelector('.exit-clean').inert = false;
  document.body.classList.remove('is-reading');
  if (restoreFocus && returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
  returnFocus = null;
}
function openPanel(kind, trigger) {
  if (!directions[active]) return;
  returnFocus = trigger;
  content.innerHTML = panelMarkup(kind);
  reading.dataset.theme = active;
  reading.querySelector('.reading-index').textContent = active === 'cabinet' ? 'THE BUREAU / SPECIAL COLLECTION' : active === 'watch' ? 'NIGHT WATCH / FIELD NOTES' : 'UNCONVENTIONAL AFFAIRS / RECORDS';
  reading.hidden = false;
  main.inert = true;
  bar.inert = true;
  document.querySelector('.exit-clean').inert = true;
  document.body.classList.add('is-reading');
  sheet.scrollTop = 0;
  sheet.focus({ preventScroll: true });
}
function setClean(value) {
  document.body.classList.toggle('is-clean', value);
  document.querySelector('.clean-toggle').setAttribute('aria-pressed', String(value));
  if (value) document.querySelector('.exit-clean').focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'instant' });
}
function setView(view, updateHash = false) {
  if (view !== 'compare' && !directions[view]) view = 'compare';
  closePanel(false);
  active = view;
  if (view === 'compare') setClean(false);
  for (const concept of document.querySelectorAll('[data-concept]')) {
    concept.hidden = concept.dataset.concept !== view;
    concept.classList.toggle('is-entering', !concept.hidden);
  }
  document.querySelector('.comparison').hidden = view !== 'compare';
  document.querySelectorAll('[data-view]').forEach(button => button.setAttribute('aria-current', String(button.dataset.view === view)));
  document.querySelector('.clean-toggle').hidden = view === 'compare';
  document.title = `${directions[view]?.name || '三版对照'} · 非常规事务署`;
  announcement.textContent = view === 'compare' ? '三版设计对照' : `${directions[view].index}版：${directions[view].name}`;
  if (updateHash && location.hash !== `#${view}`) history.pushState({ view }, '', `#${view}`);
  window.scrollTo({ top: 0, behavior: 'instant' });
}

document.addEventListener('click', event => {
  const viewButton = event.target.closest('[data-view]');
  if (viewButton) { setView(viewButton.dataset.view, true); return; }
  const panelButton = event.target.closest('[data-panel]');
  if (panelButton) { openPanel(panelButton.dataset.panel, panelButton); return; }
  if (event.target.closest('.reading-close,.reading-scrim')) closePanel();
  if (event.target.closest('.clean-toggle')) setClean(true);
  if (event.target.closest('.exit-clean')) { setClean(false); document.querySelector(`[data-view="${active}"]`).focus({ preventScroll:true }); }
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    if (!reading.hidden) closePanel();
    else if (document.body.classList.contains('is-clean')) setClean(false);
    return;
  }
  if (!reading.hidden && event.key === 'Tab') {
    const focusable = [...sheet.querySelectorAll('button,a[href]')].filter(element => !element.hidden);
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && (document.activeElement === first || document.activeElement === sheet)) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || document.activeElement === sheet)) { event.preventDefault(); first.focus(); }
  }
});
window.addEventListener('hashchange', () => setView(location.hash.slice(1)));
window.addEventListener('popstate', () => setView(location.hash.slice(1)));
setView(location.hash.slice(1) || 'compare');
