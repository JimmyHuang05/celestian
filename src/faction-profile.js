import { afterArtwork } from './page-loading.js';
import './faction-profile.css';

import { mountFactionNavigation } from './faction-navigation.js';
import { factionItems, navigateFaction } from './faction-catalog.js';

const root = document.querySelector('.faction-public');
const disposeNavigation = mountFactionNavigation(root.querySelector('.faction-identity'), {
  theme: 'eternal-astrology',
  selectedId: 'eternal-astrology',
  items: factionItems,
  onSelect: navigateFaction,
});
const paintings = [...root.querySelectorAll('.astrology-art img')];
let disposed = false;
// Each painting reveals independently; the tiny inline preview remains until decoded.
paintings.forEach(async image => {
  if (!image.complete) image.classList.add('decoding');
  try {
    await image.decode();
    if (disposed) return;
    image.classList.remove('decoding');
    image.classList.add('decoded');
    image.closest('.astrology-art').style.backgroundImage = 'none';
  }
  catch { image.classList.add('unavailable'); }
});
let atmosphere;
const stopLoading = afterArtwork(root.querySelectorAll('img'), async () => {
  try {
    const { mountAstrologyAtmosphere } = await import('./eternal-astrology.js');
    if (!disposed) atmosphere = mountAstrologyAtmosphere(root);
  } catch { /* The static artwork remains available without WebGL. */ }
});
if (import.meta.hot) import.meta.hot.dispose(() => {
  disposed = true;
  stopLoading();
  atmosphere?.destroy();
  disposeNavigation();
});
