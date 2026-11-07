import { pageIsActive, subscribePageActivity } from './page-lifecycle.js';
import { afterArtwork } from './page-loading.js';
import { mountFactionNavigation } from './faction-navigation.js';
import { factionItems, navigateFaction } from './faction-catalog.js';
import { flags, flagSVG } from './imperial-banner-artwork.js';
import { BANNER } from './imperial-banner-shape.js';
import { hallFlagCalibration, hallInscriptionCalibration } from './imperial-hall-calibration.js';
import { bannerProjection, projectionCSS } from './imperial-hall-projection.js';
import { homography } from './imperial-perspective-geometry.js';
import { applyGuardCalibration } from './imperial-guard-calibration.js';
applyGuardCalibration(document);
const disposeNavigation = mountFactionNavigation(document.querySelector('#faction-navigation-host'), {
  theme: 'imperial-knights', selectedId: 'imperial-knights', items: factionItems, onSelect: navigateFaction,
});
if (import.meta.hot) import.meta.hot.dispose(disposeNavigation);
const stage=document.querySelector('.standards');
const projections=new Map();
const inscriptionPlanes=new Map(hallInscriptionCalibration.map(plane=>[plane.id,plane]));
const inscriptionWidth=160,inscriptionHeight=88;
stage.innerHTML=flags.map(f=>{
 const arch=hallFlagCalibration.find(a=>a.id===f.id);
 const projection=bannerProjection(arch,f.artwork?f.artworkHeight/f.artworkWidth:BANNER.height/BANNER.width);
 projections.set(f.id,projection);
 const {x,y,width,height}=projection.bounds;
 const inscription=inscriptionPlanes.get(f.id);
 const placement=`--flag-x:${(x+width/2)/1672*100}%;--flag-width:${width/1672*100}%;--mount-top:${y/941*100}%;--engraving-ink:${inscription.ink};--engraving-lip:${inscription.lip}`;
 const sources=`${f.artwork} 1x, ${f.artwork?.replace('-320.webp','-640.webp')} 2x`;
 const artwork=f.artwork?`<img class="illustrated-standard" src="${f.artwork}" srcset="${sources}" width="${f.artworkWidth}" height="${f.artworkHeight}" alt="${f.artworkAlt}" fetchpriority="${f.main?'high':'auto'}" decoding="async"><img class="illustrated-rigging" src="${f.artwork}" srcset="${sources}" width="${f.artworkWidth}" height="${f.artworkHeight}" alt="" aria-hidden="true" decoding="async">`:flagSVG(f);
 return `<figure class="standard ${f.main?'imperial':''} ${f.outer?'outer':''}" style="--delay:${f.delay};--speed:${f.speed};--swing:${f.main?'.55':'1'}deg;--artwork-aspect:${width}/${height};${placement}"><div class="standard-button" data-id="${f.id}" data-hall-projection='${JSON.stringify(projection)}' data-hall-x="${x}" data-hall-y="${y}" data-hall-width="${width}">${artwork}</div><figcaption class="stone-inscription"><h2><span>${f.name.slice(0,-3)}</span><span>骑士团</span></h2><p lang="de">${f.germanName}</p></figcaption></figure>`;
}).join('');
const fallbackObserver=new ResizeObserver(entries=>{
 for(const {target,contentRect:{width,height}} of entries){
  if(!width||!height)continue;
  const projection=projections.get(target.dataset.id);
  target.querySelector('.illustrated-standard').style.transform=projectionCSS(projection.body,width,height);
  target.querySelector('.illustrated-rigging').style.transform=projectionCSS(projection.rigging,width,height);
  // Project the fixed inscription into its stone face, not into the moving flag.
  const plane=inscriptionPlanes.get(target.dataset.id);
  const scale=width/projection.bounds.width;
  const quad=plane.quad.map(([px,py])=>[
   (px-projection.bounds.x)*scale/inscriptionWidth,
   (py-projection.bounds.y)*scale/inscriptionHeight,
  ]);
  target.parentElement.querySelector('.stone-inscription').style.transform=projectionCSS(homography(quad),inscriptionWidth,inscriptionHeight);
 }
});
stage.querySelectorAll('.standard-button').forEach(host=>fallbackObserver.observe(host));
const gallery=document.querySelector('.standards-gallery');
if(matchMedia('(max-width:760px)').matches)gallery.scrollLeft=(gallery.scrollWidth-gallery.clientWidth)/2;
// Existing bookmarks now lead to the single remaining hall.
if(location.hash==='#chronicle')history.replaceState(null,'','#hall');
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
let paused=reduce.matches;
let clothRenderer;
let disposed=false;
const clothSetup=new AbortController();
function syncClothMotion(){clothRenderer?.setPaused(paused||!pageIsActive())}
function setMotion(){document.body.dataset.motion=paused?'paused':'playing';syncClothMotion()}
const onReducedMotion=event=>{paused=event.matches;setMotion()};
reduce.addEventListener('change',onReducedMotion);setMotion();
const stopActivity=subscribePageActivity(syncClothMotion);

// Keep the artwork and selection interactive while the optional cloth renderer loads.
const stopLoading=afterArtwork(stage.querySelectorAll('.illustrated-standard'),async()=>{
 try{
  const {createKnightlyCloths}=await import('./imperial-cloth.js');
  if(disposed)return;
  const phases=[-1.4,1.8,0,3.7,5.1];
  const standards=flags.map((flag,i)=>({host:stage.querySelector(`[data-id="${flag.id}"]`),phase:phases[i],speed:11.8/parseFloat(flag.speed)}));
  const renderer=await createKnightlyCloths(stage,standards,{paused:paused||!pageIsActive(),signal:clothSetup.signal});
  if(disposed){renderer.dispose();return}
  clothRenderer=renderer;
  syncClothMotion();
 }catch(error){if(error.name!=='AbortError')console.warn('Knightly cloth unavailable; keeping original artwork.',error)}
});
if(import.meta.hot)import.meta.hot.dispose(()=>{
 disposed=true;stopLoading();clothSetup.abort();clothRenderer?.dispose();
 reduce.removeEventListener('change',onReducedMotion);
 stopActivity();
 fallbackObserver.disconnect();
});
