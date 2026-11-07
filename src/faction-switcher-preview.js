import { mountFactionSwitcher } from './faction-switcher.js';
import { mountAstrologyAtmosphere } from './eternal-astrology.js';
import { mountAstrologyLogoStudy } from './astrology-logo-study.js';

const countries = {
  orlania: { name: '奥兰尼亚', base: '#18345a', shade: '#0d1c32', glow: '#6a809b', accent: '#e1d7ce' },
  indigo: { name: '阿斯特拉王国', base: '#344761', shade: '#203044', glow: '#6a809b', accent: '#c5d1e0' },
  verdant: { name: '维瑞迪安联邦', base: '#35584c', shade: '#203c34', glow: '#7f9c83', accent: '#bbd0b8' },
  garnet: { name: '奥瑞恩帝国', base: '#68434d', shade: '#3c2733', glow: '#a57883', accent: '#dec0b1' },
  independent: { name: '独立势力', base: '#111b2b', shade: '#080f1a', glow: '#53658a', accent: '#c5cbde' },
};
const items = [
  { id: 'eternal-astrology', name: '永恒不灭的占星会', countryId: 'independent', icon: 'moon', accent: '#e5dbc4' },
  { id: 'unconventional-affairs', name: '非常规事务署', countryId: 'orlania', icon: 'star' },
  { id: 'cartographers', name: '王立测绘局', countryId: 'indigo', icon: 'compass' },
  { id: 'verdant-council', name: '苍庭议会', countryId: 'verdant', icon: 'leaf' },
  { id: 'wayfarers', name: '远行者公会', countryId: 'verdant', icon: 'horizon' },
  { id: 'crimson-knights', name: '绯冕骑士团', countryId: 'garnet', icon: 'shield' },
  { id: 'astral-society', name: '群星观测会', countryId: 'independent', icon: 'moon' },
].map(item => ({ ...item, countryName: countries[item.countryId].name, accent: item.accent || countries[item.countryId].accent }));
const preview = document.getElementById('preview');
const logoStudy = mountAstrologyLogoStudy(preview);
let astrologyAtmosphere;
const flagProposals = [
  ['01-white-iris-union.svg', '白鸢联旗'], ['02-crown-triband.svg', '王冠三带'],
  ['03-gate-star.svg', '海门之星'], ['04-white-bridge.svg', '白桥之盟'], ['05-three-irises-ensign.svg', '三鸢海旗'],
];
const requested = new URLSearchParams(location.search).get('faction');
const initialId = items.some(item => item.id === requested) ? requested : items[0].id;
function show(item, push = false) {
  const country = countries[item.countryId];
  const isAstrology = item.id === 'eternal-astrology';
  preview.dataset.faction = item.id;
  preview.dataset.country = item.countryId;
  document.getElementById('astrology-view').hidden = !isAstrology;
  document.getElementById('preview-content').hidden = isAstrology;
  document.getElementById('preview-header-label').textContent = isAstrology ? 'CELESTIAN' : '势力切换 · 控件预览';
  document.getElementById('preview-flag-link').hidden = isAstrology;
  if (isAstrology && !astrologyAtmosphere) astrologyAtmosphere = mountAstrologyAtmosphere(preview);
  astrologyAtmosphere?.setActive(isAstrology);
  preview.style.setProperty('--base', country.base); preview.style.setProperty('--shade', country.shade); preview.style.setProperty('--glow', country.glow);
  document.getElementById('preview-country').textContent = country.name;
  document.getElementById('preview-name').textContent = item.name;
  const requestedFlag = Number(new URLSearchParams(location.search).get('flag'));
  const flagIndex = Number.isInteger(requestedFlag) && requestedFlag >= 1 && requestedFlag <= 5 ? requestedFlag - 1 : 0;
  document.getElementById('preview-flag').src = `/orlania-flags/${flagProposals[flagIndex][0]}`;
  document.getElementById('preview-flag-link').href = `/orlania-flags.html?flag=${flagIndex + 1}`;
  document.getElementById('preview-note').textContent = item.countryId === 'orlania' ? `国旗提案 0${flagIndex + 1} · ${flagProposals[flagIndex][1]} · 尚未定稿` : '示例内容 · 仅用于查看切换效果';
  document.title = `${item.name} · 势力切换预览`;
  const url = new URL(location.href); url.searchParams.set('faction', item.id);
  url.searchParams.delete('atmosphere');
  history[push ? 'pushState' : 'replaceState']({ ...history.state, faction: item.id }, '', url);
  document.querySelector('meta[name="theme-color"]').content = isAstrology ? '#080807' : country.base;
}
const switcher = mountFactionSwitcher({ items, initialId, onSelect: item => show(item, true) });
show(switcher.getActive());
if (import.meta.hot) import.meta.hot.dispose(() => { astrologyAtmosphere?.destroy(); logoStudy.destroy(); });
window.addEventListener('popstate', () => {
  const id = new URLSearchParams(location.search).get('faction');
  switcher.setActive(items.some(item => item.id === id) ? id : items[0].id); show(switcher.getActive());
});
const stars = document.getElementById('preview-stars');
for (let i = 0; i < 120; i++) {
  const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  dot.setAttribute('cx', String((i * 811 + 57) % 1400)); dot.setAttribute('cy', String((i * i * 31 + 91) % 900));
  dot.setAttribute('r', i % 17 === 0 ? '1.6' : '.7'); dot.setAttribute('fill', '#d9e2f5'); dot.setAttribute('opacity', String(.15 + i % 6 * .1)); stars.append(dot);
}
