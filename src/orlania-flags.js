const proposals = [
  { id: '1', file: '01-white-iris-union.svg', name: '白鸢联旗', theme: '联合王国', lead: '古老王权、联合传统与海上影响力，收束在一朵白鸢尾中。', form: '深蓝底，白色斜十字贯穿四角；绯红菱形托起白色鸢尾，形成清晰的视觉中心。', meaning: '白带可解释为通向各地的海路；红色菱形代表王国核心，鸢尾作为奥兰尼亚的传统纹章。', character: '庄严、古典、辨识度强。兼有联合旗的力量感与宫廷纹章的优雅。', verdict: '首推这一版：国家感最完整，也适合成为非常规事务署背后的权威象征。' },
  { id: '2', file: '02-crown-triband.svg', name: '王冠三带', theme: '王室与制度', lead: '一面更加克制、制度化的国旗，让王冠成为唯一的识别符号。', form: '蓝、白、红横向三带，带高比例为 3:4:3；中央白带置一顶简化蓝色王冠。', meaning: '蓝可代表海洋，白代表公共秩序，红代表国家意志；王冠将三者纳入同一国家身份。', character: '稳重、规整、近代感更强。缩小后仍清晰，适合证件、制服与政府标识。', verdict: '适合强调成熟国家机器的方向；三色横带较常见，独特性主要由王冠承担。' },
  { id: '3', file: '03-gate-star.svg', name: '海门之星', theme: '航海与开拓', lead: '从红色海门驶向深蓝远海，航星指示一个面向世界的国家。', form: '蓝色占据大部分旗面；旗杆侧红色三角向外推进，白边划开海面，八芒星落在红区。', meaning: '红色三角可代表母国与海港；白边代表海峡，八芒星对应远航与导航传统。', character: '鲜明、进取、有方向感。更偏向海权与探索，星形也能与 Celestian 的视觉语言呼应。', verdict: '适合突出舰队、航路和海外影响力；宫廷感相对较弱。' },
  { id: '4', file: '04-white-bridge.svg', name: '白桥之盟', theme: '两岸与联盟', lead: '用一条跨越红蓝的白桥，表达连接不同土地的国家意志。', form: '左上深蓝、右下绯红，宽阔白带斜贯旗面，三枚蓝色四芒星沿带排列。', meaning: '红蓝可代表不同的历史传统；白带将其连接。三颗星暂作共同誓约的象征，不预设省份数量。', character: '简洁、舒展、开放。几何轮廓明显，也适合铺成宽幅背景。', verdict: '适合强调共同体与联合身份；比另外几版更轻盈、更具现代感。' },
  { id: '5', file: '05-three-irises-ensign.svg', name: '三鸢海旗', theme: '帝国与海军', lead: '大面积绯红保留帝国旗的威仪，三朵白鸢尾在蓝色旗角中延续王朝记忆。', form: '绯红主旗，左上蓝色旗角以白边收束；三朵鸢尾按二上一下排列，下方一道白色水平带。', meaning: '鸢尾组纹可作为王室传统标识；白色水平带代表海平线，让海洋成为国家叙事的一部分。', character: '厚重、传统、海军气质最强。旗角纹章可以继续用于官印、舰徽与军服。', verdict: '适合突出老牌海权帝国；仪式感很强，也最接近海军旗的视觉气质。' },
];
const asset = file => `/orlania-flags/${file}`;
const options = document.getElementById('flag-options');
let mode = 'original';
let selected = proposals[0];
for (const proposal of proposals) {
  const button = document.createElement('button'); button.type = 'button'; button.className = 'flag-option';
  button.dataset.flag = proposal.id; button.setAttribute('aria-label', `方案 ${proposal.id}：${proposal.name}`); button.setAttribute('aria-pressed', 'false');
  const img = document.createElement('img'); img.src = asset(proposal.file); img.alt = ''; img.width = 90; img.height = 60;
  const label = document.createElement('span'); const name = document.createElement('strong'); name.textContent = `${proposal.id.padStart(2, '0')} ${proposal.name}`;
  const theme = document.createElement('small'); theme.textContent = proposal.theme; label.append(name, theme); button.append(img, label); options.append(button);
  button.addEventListener('click', () => select(proposal.id, true));
}
function setMode(value, push = true) {
  mode = value === 'background' ? 'background' : 'original';
  document.getElementById('flag-stage').dataset.mode = mode;
  document.getElementById('office-preview').hidden = mode !== 'background';
  document.querySelectorAll('[data-mode]').forEach(button => { if (button.tagName === 'BUTTON') button.setAttribute('aria-pressed', String(button.dataset.mode === mode)); });
  document.getElementById('view-caption').textContent = mode === 'background' ? '非常规事务署 · 背景试用' : '3:2 · 纯色矢量';
  document.getElementById('stage-note').textContent = mode === 'background' ? '在旗面上叠加深蓝遮罩，保留红白蓝的国家身份，并保证文字可读。' : '旗面使用三种纯色；阴影仅用于展示，不包含在 SVG 中。';
  if (push) syncUrl(true);
}
function syncUrl(push) {
  const url = new URL(location.href); url.searchParams.set('flag', selected.id);
  if (mode === 'background') url.searchParams.set('view', mode); else url.searchParams.delete('view');
  if (url.href !== location.href) history[push ? 'pushState' : 'replaceState']({}, '', url);
}
function select(id, push = false) {
  selected = proposals.find(p => p.id === id) || proposals[0];
  options.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.flag === selected.id)));
  document.getElementById('selected-flag').src = asset(selected.file); document.getElementById('selected-flag').alt = `奥兰尼亚国旗提案：${selected.name}`;
  document.getElementById('design-number').textContent = `${selected.id.padStart(2, '0')} / ${selected.theme}`;
  for (const [key, value] of Object.entries({ name: selected.name, lead: selected.lead, form: selected.form, meaning: selected.meaning, character: selected.character, verdict: selected.verdict })) document.getElementById(`design-${key}`).textContent = value;
  const download = document.getElementById('download-svg'); download.href = asset(selected.file); download.download = `奥兰尼亚-${selected.id}-${selected.name}.svg`;
  document.getElementById('office-link').href = `/faction-switcher.html?faction=unconventional-affairs&flag=${selected.id}`;
  document.title = `${selected.name} · 奥兰尼亚国旗提案`; syncUrl(push);
}
document.querySelectorAll('.view-modes button').forEach(button => button.addEventListener('click', () => setMode(button.dataset.mode)));
function fromUrl() { const params = new URLSearchParams(location.search); setMode(params.get('view'), false); select(params.get('flag')); }
window.addEventListener('popstate', fromUrl); fromUrl();
