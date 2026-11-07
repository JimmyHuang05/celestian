import { ornamentDefs, bannerBorder } from './imperial-ornaments.js';
import { BANNER, bannerSilhouette, crossCommands, shieldCommands, pathData } from './imperial-banner-shape.js';

export const flags = [
  { id: 'lion', name: '瑞德皇家王冠骑士团', germanName: 'Königlicher Kronenorden von Rheid', role: '追猎 · 特战 · 精锐', asset: 'lion', artwork: '/imperial-knights/delivery-v2/lion-damask-320.webp', artworkWidth: 799, artworkHeight: 1920, artworkAlt: '瑞德皇家王冠骑士团战旗：象牙白栎叶暗纹旗面、酒红盾牌与回首单头金狮', note: '象牙白 · 酒红盾 · 回首金狮', outer: true, delay: '-2s', speed: '9.4s' },
  { id: 'bear', name: '霍恩瓦赫特家族骑士团', germanName: 'Ritterorden des Hauses Hohenwacht', role: '国土防卫 · 山地作战', asset: 'bear', artwork: '/imperial-knights/delivery-v2/bear-selected-320.webp', artworkWidth: 809, artworkHeight: 1944, artworkAlt: '霍恩瓦赫特家族骑士团战旗：森林绿旗面、金色巨熊扶堡，金框绿盾与橡叶', note: '森林绿织物 · 扶堡金熊 · 古林镇守', delay: '-5s', speed: '10.2s' },
  { id: 'imperial', name: '帝国十字骑士团', germanName: 'Orden vom Reichskreuz', role: '拱卫皇帝 · 中央禁军', asset: 'eagle', artwork: '/imperial-knights/delivery-v2/imperial-damask-320.webp', artworkWidth: 819, artworkHeight: 1920, artworkAlt: '帝国十字骑士团战旗：黑金暗纹旗面、皇冠、双头金鹰与银盾铁十字', note: '黑缎金绣 · 双头鹰 · 铁十字', main: true, delay: '-1s', speed: '11.8s' },
  { id: 'lynx', name: '银猞猁骑士团', germanName: 'Orden vom Silbernen Luchs', role: '侦察 · 轻骑 · 快反', asset: 'lynx', artwork: '/imperial-knights/delivery-v2/lynx-selected-320.webp', artworkWidth: 799, artworkHeight: 1920, artworkAlt: '银猞猁骑士团战旗：深紫旗面、银色古典猞猁伏身回望，银框紫盾、新月与秘钥', note: '深紫织物 · 伏月回望 · 秘钥巡影', delay: '-7s', speed: '9.8s' },
  { id: 'wolf', name: '北境骑士团', germanName: 'Ritterorden des Nordens', role: '远征 · 极地 · 高原', asset: 'wolf', artwork: '/imperial-knights/delivery-v2/wolf-selected-320.webp', artworkWidth: 800, artworkHeight: 1920, artworkAlt: '北境骑士团战旗：深靛蓝旗面、斜向跃起的银狼、银框蓝盾、导航星与雪山', note: '深靛蓝 · 越隘银狼 · 极星远征', outer: true, delay: '-4s', speed: '10.6s' },
];

function hangingHardware() {
  return `<g class="header-fitting">
    <path d="M26 67L110 23 194 67" fill="none" stroke="#514330" stroke-width="2"/>
    <circle cx="110" cy="23" r="3.4" fill="url(#BRONZE)" stroke="#d8bb77" stroke-width=".7"/>
    <path d="M10 69H210" stroke="#211f1a" stroke-width="4.8"/>
    <path d="M13 67.9H207" stroke="#8d8066" stroke-width=".65"/>
    ${[8,212].map(x=>`<g transform="translate(${x} 69)"><path d="M-6 0-2-4H2L6 0 2 4H-2Z" fill="url(#BRONZE)" stroke="#ddc184" stroke-width=".6"/><path d="M-2-3V3M1-3V3" stroke="#a38044" stroke-width=".7"/></g>`).join('')}
    ${[28,69,110,151,192].map(x=>`<g><rect x="${x-3}" y="64" width="6" height="17" rx="2" fill="#c5b68d" stroke="#9f7d43" stroke-width=".6"/><path d="M${x-2} 65V80M${x+2} 65V80" stroke="#e5c888" stroke-width=".8"/></g>`).join('')}
  </g>`;
}

function smallCrown() {
  return `<g transform="translate(110 193) scale(.68)" fill="url(#GOLD)" stroke="#6a4e23" stroke-width=".5">
    <path d="M-25 2-29-14-17-8-15-20-5-10 0-25 5-10 15-20 17-8 29-14 25 2Z"/>
    <path d="M-25 1Q0 6 25 1L24 9Q0 13-24 9Z"/>
    <path d="M-24 4Q0 9 24 4" fill="none" stroke="#f3db99" stroke-width="1"/>
    ${[-29,-15,0,15,29].map((x,i)=>`<circle cx="${x}" cy="${[-14,-20,-25,-20,-14][i]}" r="1.9"/>`).join('')}
    <path d="M0-30V-23M-3-27H3" fill="none" stroke="#cdaa65" stroke-width="1.4"/>
  </g>`;
}

export function flagSVG(flag) {
  const cross = pathData(crossCommands), shield = pathData(shieldCommands);
  let svg = `<svg viewBox="${BANNER.viewLeft} ${BANNER.viewTop} ${BANNER.width} ${BANNER.height}" aria-hidden="true"><defs>
    <linearGradient id="GOLD"><stop stop-color="#e6c57d"/><stop offset=".32" stop-color="#b18a43"/><stop offset=".62" stop-color="#ead39a"/><stop offset="1" stop-color="#997337"/></linearGradient>
    <linearGradient id="CLOTH"><stop stop-color="#c7c0ae"/><stop offset=".25" stop-color="#eee8d9"/><stop offset=".52" stop-color="#d6cebb"/><stop offset=".8" stop-color="#eee8d9"/><stop offset="1" stop-color="#c8c0ab"/></linearGradient>
    <clipPath id="CUT"><path d="${bannerSilhouette}"/></clipPath>${ornamentDefs}</defs>
    <g class="cloth">
      <path class="banner-base" d="${bannerSilhouette}" fill="url(#CLOTH)"/>
      <g class="iron-cross" clip-path="url(#CUT)"><path d="${cross}" fill="#111311"/></g>
      <g class="three-trim-fallback" fill="none" stroke="url(#GOLD)" stroke-width="1.8"><path d="${cross}"/></g>
      <g class="badge-artwork">
        <path d="${shield}" fill="#141613"/>
        ${smallCrown()}
        <image href="/imperial-knights/goldwork-v1/${flag.asset}.webp" x="65" y="203" width="90" height="90" preserveAspectRatio="xMidYMid meet"/>
      </g>
      <path class="three-trim-fallback" d="${shield}" fill="none" stroke="url(#GOLD)" stroke-width="3"/>
      ${bannerBorder(BANNER.bottom, BANNER.notch)}
    </g>${hangingHardware()}</svg>`;
  return svg.replaceAll(/id="([A-Z]+)"/g, `id="${flag.id}-$1"`).replaceAll(/url\(#([A-Z]+)\)/g, `url(#${flag.id}-$1)`).replaceAll(/href="#([A-Z]+)"/g, `href="#${flag.id}-$1"`);
}

