import './faction-navigation.css';
import { mountFactionSound } from './faction-sound.js';

// Position, catalog and selection behavior are shared. The theme owns ornament and color.
export function mountFactionNavigation(host, { theme, items, selectedId, onSelect }) {
  const nav = document.createElement('nav');
  nav.className = 'faction-navigation';
  nav.dataset.theme = theme;
  nav.setAttribute('aria-label', '势力切换');
  const current = items.find(item => item.id === selectedId) || items[0];
  if (!current) return () => {};
  nav.innerHTML = `<div class="faction-navigation__catalog" id="faction-catalog" hidden>
    <div class="faction-navigation__catalog-heading"><span>势力</span><span>${String(items.length).padStart(2, '0')}</span></div>
    <div class="faction-navigation__entries"></div>
  </div>
  <div class="faction-navigation__body">
    <button class="faction-navigation__trigger" type="button" aria-expanded="false" aria-controls="faction-catalog">
      <span class="faction-navigation__identity"><span class="faction-navigation__affiliation"></span><span class="faction-navigation__name"></span></span>
      <span class="faction-navigation__open" aria-hidden="true"><svg viewBox="0 0 24 12" fill="none"><path d="m7 8 5-4 5 4" stroke="currentColor" stroke-width=".8"/></svg></span>
    </button>
  </div>`;
  const trigger = nav.querySelector('.faction-navigation__trigger');
  const catalog = nav.querySelector('.faction-navigation__catalog');
  const entries = nav.querySelector('.faction-navigation__entries');
  trigger.querySelector('.faction-navigation__affiliation').textContent = current.affiliation;
  trigger.querySelector('.faction-navigation__name').textContent = current.name;
  trigger.setAttribute('aria-label', `${current.name}，打开势力目录`);
  const setOpen = open => {
    catalog.hidden = !open;
    trigger.setAttribute('aria-expanded', String(open));
    trigger.setAttribute('aria-label', `${current.name}，${open ? '收起' : '打开'}势力目录`);
  };
  if (items.length > 1) {
    const currentIndex = items.indexOf(current);
    for (const [direction, offset, label] of [['previous', -1, '上一个势力'], ['next', 1, '下一个势力']]) {
      const target = items[(currentIndex + offset + items.length) % items.length];
      const shortcut = document.createElement('button');
      shortcut.type = 'button';
      shortcut.className = `faction-navigation__shortcut faction-navigation__shortcut--${direction}`;
      shortcut.setAttribute('aria-label', `${label}：${target.name}`);
      shortcut.title = `${label}：${target.name}`;
      shortcut.innerHTML = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="${offset < 0 ? 'm14 7-5 5 5 5' : 'm10 7 5 5-5 5'}" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      shortcut.onclick = () => { setOpen(false); onSelect?.(target.id); };
      nav.querySelector('.faction-navigation__body').append(shortcut);
    }
  }
  for (const item of items) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'faction-navigation__entry';
    if (item.id === current.id) button.setAttribute('aria-current', 'true');
    const name = document.createElement('span');
    name.textContent = item.name;
    const mark = document.createElement('span');
    mark.textContent = item.id === current.id ? '✦' : '↗';
    mark.setAttribute('aria-hidden', 'true');
    button.append(name, mark);
    button.onclick = () => {
      setOpen(false);
      trigger.focus();
      if (item.id !== current.id) onSelect?.(item.id);
    };
    entries.append(button);
  }
  trigger.onclick = () => setOpen(catalog.hidden);
  const outside = event => { if (!nav.contains(event.target)) setOpen(false); };
  const escape = event => {
    if (event.key === 'Escape' && !catalog.hidden) { setOpen(false); trigger.focus(); }
  };
  document.addEventListener('pointerdown', outside);
  document.addEventListener('keydown', escape);
  host.replaceWith(nav);
  const disposeSound = mountFactionSound(document.body, theme);
  return () => {
    document.removeEventListener('pointerdown', outside);
    document.removeEventListener('keydown', escape);
    disposeSound();
    nav.replaceWith(host);
  };
}
