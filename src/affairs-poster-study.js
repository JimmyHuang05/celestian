const versions = {
  fog: '雾中的隐秘王都',
  palimpsest: '被改写的旧画',
  boundary: '灯火之外',
};
const frame = document.querySelector('#poster-frame');
const single = document.querySelector('#single-view');
const compare = document.querySelector('#compare-view');
const pureLink = document.querySelector('#pure-link');
const versionLinks = [...document.querySelectorAll('[data-version]')];
const compareLink = document.querySelector('.study-compare');

function setCurrent(element, active) {
  if (active) element.setAttribute('aria-current', 'page');
  else element.removeAttribute('aria-current');
}

function render() {
  const key = location.hash.slice(1);
  const comparing = key === 'compare';
  const version = Object.hasOwn(versions, key) ? key : 'fog';
  single.hidden = comparing;
  compare.hidden = !comparing;
  pureLink.hidden = comparing;
  setCurrent(compareLink, comparing);
  for (const link of versionLinks) setCurrent(link, !comparing && link.dataset.version === version);
  if (comparing) {
    for (const preview of compare.querySelectorAll('iframe[data-src]')) {
      preview.src = preview.dataset.src;
      delete preview.dataset.src;
    }
  } else {
    const source = '/affairs-poster-' + version + '.html';
    if (frame.getAttribute('src') !== source) frame.src = source;
    frame.title = versions[version] + ' · 静态宣传屏';
    pureLink.href = source;
  }
}

const resizeObserver = new ResizeObserver(entries => {
  for (const entry of entries) {
    entry.target.style.setProperty('--preview-scale', entry.contentRect.width / 1600);
  }
});
for (const art of document.querySelectorAll('.comparison__art')) resizeObserver.observe(art);

window.addEventListener('hashchange', render);
render();

