import { logoDesigns, logoPath } from './astrology-logo-designs.js';
const grid = document.getElementById('logo-grid');
for (const design of logoDesigns) {
  const card = document.createElement('article');
  card.className = 'card';
  card.innerHTML = `<span class="number">0${design.id}</span><div class="art"><img src="${logoPath(design)}" width="320" height="440" alt="${design.name}徽记"></div><h2>${design.name}</h2><p class="theme">${design.theme}</p><p class="description">${design.description}</p><div class="actions"><a href="/faction-switcher.html?faction=eternal-astrology&emblem=${design.id}">放入页面 ↗</a><a href="${logoPath(design)}" download>下载 SVG ↓</a></div>`;
  grid.append(card);
}
