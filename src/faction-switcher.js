import './faction-switcher.css';

const icons = {
  star: '<path d="m16 3 3.5 9.5L29 16l-9.5 3.5L16 29l-3.5-9.5L3 16l9.5-3.5Z"/><circle cx="16" cy="16" r="10" fill="none" stroke="currentColor" stroke-width=".7"/>',
  compass: '<circle cx="16" cy="16" r="12" fill="none" stroke="currentColor"/><path d="m22 10-4 8-8 4 4-8Z"/><circle cx="16" cy="16" r="2" fill="var(--fs-panel)"/>',
  leaf: '<path d="M25 5C8 4 3 15 9 23s19 2 16-18Z" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="m6 28 16-18M12 21l-1-7m5 2 6 1" fill="none" stroke="currentColor"/>',
  horizon: '<path d="M3 24h26M7 19h18M16 3v5M5 8l4 4m18-4-4 4" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M8 19a8 8 0 0 1 16 0Z"/>',
  shield: '<path d="M16 3 27 7v8c0 6-5 11-11 14C10 26 5 21 5 15V7Z" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="m16 7 2 7 6 2-6 2-2 7-2-7-6-2 6-2Z"/>',
  moon: '<path d="M23 5a12 12 0 1 0 4 18A12 12 0 0 1 23 5Z" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="m22 10 1.5 4.5L28 16l-4.5 1.5L22 22l-1.5-4.5L16 16l4.5-1.5Z"/>',
};
const svg = (content, className = '') => `<svg class="${className}" viewBox="0 0 32 32" aria-hidden="true" fill="currentColor">${content}</svg>`;
const direction = delta => svg(`<path d="${delta < 0 ? 'm20 8-8 8 8 8' : 'm12 8 8 8-8 8'}" fill="none" stroke="currentColor" stroke-width="1.4"/>`);
function element(tag, className, text) {
  const node = document.createElement(tag); node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** Shared navigation only. The host decides how each faction's detail is rendered. */
export function mountFactionSwitcher({ root = document.body, items, initialId, onSelect = () => {} }) {
  if (!Array.isArray(items) || !items.length) throw new Error('Faction switcher needs at least one item.');
  const list = items.map(item => ({ ...item, id: String(item.id), name: String(item.name), countryId: item.countryId || 'independent', countryName: item.countryName || '独立势力' }));
  if (new Set(list.map(item => item.id)).size !== list.length) throw new Error('Faction IDs must be unique.');
  let index = Math.max(0, list.findIndex(item => item.id === initialId));
  let destroyed = false;
  const abort = new AbortController(), { signal } = abort;
  const wrapper = element('div', 'faction-switcher');
  const nav = element('nav', 'fs-dock'); nav.setAttribute('aria-label', '势力切换');
  const previous = element('button', 'fs-step'); previous.type = 'button'; previous.innerHTML = direction(-1);
  const trigger = element('button', 'fs-current'); trigger.type = 'button'; trigger.setAttribute('aria-haspopup', 'dialog'); trigger.setAttribute('aria-expanded', 'false');
  const currentEmblem = element('span', 'fs-emblem');
  const currentText = element('span', 'fs-current-text');
  const country = element('span', 'fs-country');
  const name = element('span', 'fs-name'); currentText.append(country, name);
  const opener = element('span', 'fs-directory-hint');
  opener.innerHTML = '<span>目录</span>' + svg('<path d="m10 19 6-6 6 6" fill="none" stroke="currentColor" stroke-width="1.2"/>');
  trigger.append(currentEmblem, currentText, opener);
  const next = element('button', 'fs-step'); next.type = 'button'; next.innerHTML = direction(1);
  nav.append(previous, trigger, next);
  const status = element('span', 'fs-sr-only'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  const dialog = element('dialog', 'fs-directory'); dialog.setAttribute('aria-label', '势力目录');
  const header = element('header', 'fs-directory-header');
  const heading = element('div', 'fs-directory-title'); heading.append(element('h2', '', '势力目录'), element('span', '', `${list.length} 个势力`));
  const closeButton = element('button', 'fs-close'); closeButton.type = 'button'; closeButton.setAttribute('aria-label', '关闭势力目录');
  closeButton.innerHTML = svg('<path d="m10 10 12 12M22 10 10 22" fill="none" stroke="currentColor" stroke-width="1.2"/>');
  header.append(heading, closeButton);
  const groups = element('div', 'fs-groups');
  const grouped = new Map();
  for (const item of list) {
    if (!grouped.has(item.countryId)) grouped.set(item.countryId, []);
    grouped.get(item.countryId).push(item);
  }
  const choices = new Map();
  for (const members of grouped.values()) {
    const section = element('section', 'fs-group'); section.setAttribute('aria-label', members[0].countryName);
    const groupHeading = element('h3', 'fs-group-heading');
    const dot = element('span', 'fs-country-dot'); dot.setAttribute('aria-hidden', 'true'); dot.style.backgroundColor = members[0].accent || '#c8cbd5';
    groupHeading.append(dot, document.createTextNode(members[0].countryName));
    const rows = element('div', 'fs-choices');
    for (const item of members) {
      const choice = element('button', 'fs-choice'); choice.type = 'button'; choice.dataset.faction = item.id;
      const mark = element('span', 'fs-choice-emblem'); mark.style.color = item.accent || '#c8cbd5'; mark.innerHTML = svg(icons[item.icon] || icons.star);
      const label = element('span', 'fs-choice-name', item.name);
      const check = element('span', 'fs-choice-check'); check.innerHTML = svg('<path d="m8 16 5 5 11-11" fill="none" stroke="currentColor" stroke-width="1.4"/>');
      choice.append(mark, label, check); rows.append(choice); choices.set(item.id, choice);
      choice.addEventListener('click', () => { dialog.close(); select(item.id, true); }, { signal });
    }
    section.append(groupHeading, rows); groups.append(section);
  }
  const hint = element('footer', 'fs-directory-footer', '选择势力，进入它的故事。');
  dialog.append(header, groups, hint); wrapper.append(nav, dialog, status); root.append(wrapper);
  function update() {
    const item = list[index];
    wrapper.style.setProperty('--fs-accent', item.accent || '#c8cbd5');
    currentEmblem.innerHTML = svg(icons[item.icon] || icons.star);
    country.textContent = item.countryName; name.textContent = item.name;
    trigger.setAttribute('aria-label', `${item.name}，${item.countryName}，打开势力目录`);
    previous.setAttribute('aria-label', `上一势力：${list[(index - 1 + list.length) % list.length].name}`);
    next.setAttribute('aria-label', `下一势力：${list[(index + 1) % list.length].name}`);
    previous.disabled = next.disabled = list.length === 1;
    for (const item of list) {
      const active = item.id === list[index].id;
      choices.get(item.id).setAttribute('aria-current', active ? 'page' : 'false');
    }
  }
  function select(id, notify = false) {
    if (destroyed) return;
    const target = list.findIndex(item => item.id === id);
    if (target < 0) return;
    const changed = target !== index; index = target; update();
    if (changed && notify) {
      status.textContent = `已切换至${list[index].name}，${list[index].countryName}`;
      onSelect(list[index]);
    }
  }
  function open() {
    if (destroyed || dialog.open) return;
    dialog.showModal(); trigger.setAttribute('aria-expanded', 'true'); choices.get(list[index].id).focus();
  }
  trigger.addEventListener('click', open, { signal });
  previous.addEventListener('click', () => select(list[(index - 1 + list.length) % list.length].id, true), { signal });
  next.addEventListener('click', () => select(list[(index + 1) % list.length].id, true), { signal });
  nav.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault(); select(list[(index + (event.key === 'ArrowLeft' ? -1 : 1) + list.length) % list.length].id, true);
  }, { signal });
  closeButton.addEventListener('click', () => dialog.close(), { signal });
  dialog.addEventListener('close', () => { trigger.setAttribute('aria-expanded', 'false'); if (!destroyed) trigger.focus({ preventScroll: true }); }, { signal });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
  }, { signal });
  update();
  return { setActive: id => select(id), getActive: () => list[index], open, close: () => dialog.close(), destroy() { destroyed = true; if (dialog.open) dialog.close(); abort.abort(); wrapper.remove(); } };
}
