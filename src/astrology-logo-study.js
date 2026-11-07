import { emblemOptions } from './astrology-emblem-options.js';
import './astrology-logo-study.css';

export function mountAstrologyLogoStudy(root) {
  const emblem = root.querySelector('.astrology-emblem');
  const choices = [{ id: 0, name: '原版垂弦', group: '原版对照', width: 166, height: 480 }, ...emblemOptions];
  let activeId = 1;
  const controls = document.createElement('div');
  controls.className = 'astrology-logo-study';
  controls.setAttribute('role', 'group');
  controls.setAttribute('aria-label', '占星会徽记切换');
  controls.innerHTML = '<div class="astrology-logo-options"><button type="button" class="emblem-prev" aria-label="上一个徽记">‹</button><select aria-label="选择占星会徽记"></select><button type="button" class="emblem-next" aria-label="下一个徽记">›</button></div><a href="/astrology-fifteen-svg.html">十五款对照 ↗</a>';
  const picker = controls.querySelector('select');
  for (const groupName of [...new Set(choices.map(choice => choice.group))]) {
    const group = document.createElement('optgroup');
    group.label = groupName;
    for (const choice of choices.filter(item => item.group === groupName)) {
      const option = document.createElement('option');
      option.value = String(choice.id);
      option.textContent = choice.id ? String(choice.id).padStart(2, '0') + ' · ' + choice.name : choice.name;
      group.append(option);
    }
    picker.append(group);
  }
  const note = document.createElement('p');
  note.className = 'astrology-logo-note';
  note.setAttribute('aria-live', 'polite');
  root.append(controls, note);
  root.dataset.logoStudy = 'true';
  function requested() {
    const param = new URLSearchParams(location.search).get('emblem');
    const id = param === null ? 1 : Number(param);
    return choices.some(design => design.id === id) ? id : 1;
  }
  function select(id, updateUrl = false) {
    const design = choices.find(item => item.id === id);
    if (!design) return;
    activeId = id;
    emblem.src = id ? '/eternal-astrology/emblems/' + design.stem + '.svg' : '/eternal-astrology/emblem-study-v1.svg';
    emblem.width = design.width;
    emblem.height = design.height;
    emblem.alt = '占星会徽记提案：' + design.name;
    emblem.dataset.flat = String(Boolean(design.flat));
    picker.value = String(id);
    note.textContent = id ? String(id).padStart(2, '0') + ' / ' + emblemOptions.length + ' · ' + design.name + ' · ' + design.group : '原版垂弦 · 对照';
    if (updateUrl) {
      const url = new URL(location.href);
      url.searchParams.set('emblem', String(id));
      history.replaceState(history.state, '', url);
    }
  }
  function step(direction) {
    const index = choices.findIndex(choice => choice.id === activeId);
    select(choices[(index + direction + choices.length) % choices.length].id, true);
  }
  controls.querySelector('.emblem-prev').addEventListener('click', () => step(-1));
  controls.querySelector('.emblem-next').addEventListener('click', () => step(1));
  picker.addEventListener('change', () => select(Number(picker.value), true));
  const onHistory = () => select(requested());
  window.addEventListener('popstate', onHistory);
  select(requested());
  return { destroy() {
    window.removeEventListener('popstate', onHistory);
    controls.remove();
    note.remove();
    delete root.dataset.logoStudy;
  } };
}

