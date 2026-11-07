import { mountFactionNavigation } from './faction-navigation.js';
import { factionItems, navigateFaction } from './faction-catalog.js';
import './unconventional-affairs.css';

const disposeNavigation = mountFactionNavigation(document.querySelector('#faction-navigation-host'), {
  theme: 'unconventional-affairs',
  selectedId: 'unconventional-affairs',
  items: factionItems,
  onSelect: navigateFaction,
});
if (import.meta.hot) import.meta.hot.dispose(() => {
  disposeNavigation();
});
