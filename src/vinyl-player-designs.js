import { getMusicManager } from './music-manager.js';
import { musicLibrary } from './music-library.js';

const designs = [
  {id:'obsidian',name:'曜黑金线',en:'OBSIDIAN',mark:'✦',note:'黑漆唱片匣与克制的金线，安静地融入深色页面。',tag:'推荐 · 全站通用'},
  {id:'brass',name:'黄铜铭牌',en:'BRASS ARCHIVE',mark:'✥',note:'像一块嵌在古老留声机上的黄铜铭牌。',tag:'古典 · 有分量'},
  {id:'nocturne',name:'午夜星轨',en:'NOCTURNE',mark:'✧',note:'曜黑唱片匣、哑金星轨，只留下曲名与一线旋律。',tag:'黑金 · 精修版'},
  {id:'parchment',name:'羊皮乐谱',en:'PARCHMENT',mark:'❦',note:'温暖纸面、墨色刻度，像从唱片后抽出的一页谱。',tag:'文献 · 诗意'},
  {id:'glass',name:'银雾玻璃',en:'SMOKED GLASS',mark:'✣',note:'烟色玻璃透出背景，冷银唱片心保持清晰。',tag:'轻透 · 现代'},
  {id:'garnet',name:'暗红封蜡',en:'GARNET SEAL',mark:'✤',note:'暗红皮革与封蜡唱片心，像一段被封存的旋律。',tag:'仪式 · 隐秘'},
];
const tracks={
  'imperial-knights':{name:musicLibrary['imperial-knights'].title,faction:'五军同盟'},
  'unconventional-affairs':{name:musicLibrary['unconventional-affairs'].title,faction:'非常规事务署'},
  'eternal-astrology':{name:musicLibrary['eternal-astrology'].title,faction:'永恒不灭的占星会'},
};
for(const option of document.querySelectorAll('#preview-track option')){
  const track=tracks[option.value];
  option.textContent=`${track.name} · ${track.faction}`;
}
// Filled play has its visual centroid at (12, 12); the other controls are symmetric about it.
const paths={play:'M8.5 6.5 19 12 8.5 17.5Z',pause:'M7.5 6h3v12h-3zM13.5 6h3v12h-3z',volume:'M11 5 6 9H3v6h3l5 4zM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14',muted:'M11 5 6 9H3v6h3l5 4zM16 9l5 6M21 9l-5 6',expand:'M14 4h6v6M20 4l-8 8M10 20H4v-6M4 20l8-8',close:'m6 6 12 12M18 6 6 18',left:'m15 6-6 6 6 6',right:'m9 6 6 6-6 6'};
const icon=name=>`<svg class="control-icon control-icon--${name}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${paths[name]}"/></svg>`;
const nocturneMark='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m12 3 2.1 6.9L21 12l-6.9 2.1L12 21l-2.1-6.9L3 12l6.9-2.1Z"/></svg>';
const manager=getMusicManager();
let trackId='imperial-knights', started=false, gain=1, muted=false, mode='open', selectedDesign=0;
let activeAudio, detachAudio=()=>{}, playing=false;
const instances=new Set();
const status=document.querySelector('.audio-status');
const dialog=document.querySelector('.scene-dialog');
const slot=document.querySelector('.scene-player-slot');
const sceneSelect=document.querySelector('#scene-select');
const time=n=>Number.isFinite(n)?`${Math.floor(n/60)}:${String(Math.floor(n%60)).padStart(2,'0')}`:'—:—';

function markup(design){
  const play=`<button class="play-control" type="button" aria-label="播放">${icon('play')}</button>`;
  const controls=`<div class="player-controls">${play}<div class="volume-group"><button class="mute-control" type="button" aria-label="静音" aria-pressed="false">${icon('volume')}</button><div class="volume-popover"><input class="volume-control" type="range" min="0" max="100" value="100" aria-label="音量"></div></div></div>`;
  const seek='<input class="seek-control" type="range" min="0" max="1000" value="0" step="1" aria-label="播放进度" disabled>';
  const information=design.id==='nocturne'
    ? `<div class="nocturne-information"><span class="track-title"></span>${seek}</div><div class="player-controls">${play}</div>`
    : `<div class="track-line"><span class="track-title"></span>${controls}</div><div class="track-meta"><span class="track-faction"></span><span class="track-time"><b class="elapsed-time">0:00</b> / <span class="duration-time">—:—</span></span></div>${seek}`;
  return `<div class="vinyl-player vinyl-player--${design.id}" data-playing="false" data-open="true" aria-label="${design.name}播放器">
  <div class="vinyl-sleeve"><div class="sleeve-ornament" aria-hidden="true"></div><div class="vinyl-content">${information}</div></div>
  <button class="vinyl-disc" type="button" aria-label="收起${design.name}播放器" aria-expanded="true"><span class="disc-ornament"></span><span class="record-rotation"><span class="record-label"><span class="label-mark">${design.id==='nocturne'?nocturneMark:design.mark}</span><span class="record-hole"></span></span></span></button>
</div>`}

function syncContent(){
  const track=tracks[trackId];
  for(const instance of instances){const el=instance.el;el.querySelector('.track-title').textContent=track.name;el.querySelector('.track-title').title=track.name;const faction=el.querySelector('.track-faction');if(faction)faction.textContent=track.faction}
  syncProgress();syncPlayback();
}
function syncProgress(){
  const duration=activeAudio?.duration,position=activeAudio?.currentTime||0;
  const ready=Number.isFinite(duration)&&duration>0;
  for(const {el} of instances){const range=el.querySelector('.seek-control');range.disabled=!ready;if(document.activeElement!==range)range.value=ready?position/duration*1000:0;range.style.setProperty('--progress',`${Number(range.value)/10}%`);range.setAttribute('aria-valuetext',`${time(position)} / ${time(duration)}`);const elapsed=el.querySelector('.elapsed-time'),total=el.querySelector('.duration-time');if(elapsed)elapsed.textContent=time(position);if(total)total.textContent=time(duration)}
}
function syncPlayback(){
  playing=Boolean(activeAudio&&!activeAudio.paused&&manager.enabled);
  for(const {el} of instances){el.dataset.playing=String(playing);const play=el.querySelector('.play-control');play.innerHTML=icon(playing?'pause':'play');play.setAttribute('aria-label',playing?'暂停':'播放');const mute=el.querySelector('.mute-control');if(mute){mute.innerHTML=icon(muted?'muted':'volume');mute.setAttribute('aria-label',muted?'取消静音':'静音');mute.setAttribute('aria-pressed',String(muted))}const volume=el.querySelector('.volume-control');if(volume)volume.value=Math.round(gain*100)}
  status.dataset.error='false';
  status.textContent=manager.controller.blocked?'点击播放继续试听':manager.controller.pending?'正在载入音乐…':playing?'正在试听 · 各款同步':'点击任意播放键试听';
}
function applyVolume(){
  for(const [id,track]of Object.entries(manager.controller.tracks)){track.volume=musicLibrary[id].volume*gain;track.audio.muted=muted;if(!manager.controller.frame&&!manager.controller.pending)track.audio.volume=track.audio.paused?0:track.volume}
  syncPlayback();
}
function attachAudio(){
  detachAudio();activeAudio=manager.getAudio(trackId);activeAudio.muted=muted;manager.controller.tracks[trackId].volume=musicLibrary[trackId].volume*gain;
  const update=()=>{syncProgress();syncPlayback()};
  const onError=()=>{status.dataset.error='true';status.textContent='音乐暂时无法读取，请再次点击播放'};
  const events=['loadedmetadata','timeupdate','play','pause','ended','seeked','canplay'];events.forEach(name=>activeAudio.addEventListener(name,update));activeAudio.addEventListener('error',onError);
  const audio=activeAudio;detachAudio=()=>{events.forEach(name=>audio.removeEventListener(name,update));audio.removeEventListener('error',onError)};
}
function togglePlay(){
  if(!started){started=true;attachAudio();manager.select(trackId);manager.toggle(true)}
  else manager.toggle();
  syncPlayback();
}
function mountPlayer(el,{scene=false}={}){
  let pinned=false,hovered=false,closeTimer;
  const sleeve=el.querySelector('.vinyl-sleeve'),record=el.querySelector('.vinyl-disc');
  const instance={el,refresh:()=>setOpen(!scene&&mode==='open'),destroy:()=>{clearTimeout(closeTimer);instances.delete(instance)}};
  const setOpen=value=>{el.dataset.open=String(value);sleeve.inert=!value;record.setAttribute('aria-expanded',String(value));record.setAttribute('aria-label',`${value?'收起':'展开'}播放器`)};
  const keepOpen=()=>!scene&&mode==='open';
  const closeLater=()=>{clearTimeout(closeTimer);closeTimer=setTimeout(()=>{if(!keepOpen()&&!pinned&&!hovered&&!(el.contains(document.activeElement)&&document.activeElement.matches(':focus-visible')))setOpen(false)},550)};
  el.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch'){hovered=true;clearTimeout(closeTimer);setOpen(true)}});
  el.addEventListener('pointerleave',()=>{hovered=false;closeLater()});
  el.addEventListener('focusin',()=>{clearTimeout(closeTimer);setOpen(true)});
  el.addEventListener('focusout',closeLater);
  record.addEventListener('click',()=>{if(keepOpen()){setOpen(el.dataset.open!=='true')}else{pinned=!pinned;setOpen(pinned)}});
  el.addEventListener('keydown',event=>{if(event.key==='Escape'&&!keepOpen()){event.preventDefault();event.stopPropagation();pinned=false;record.focus();setOpen(false)}});
  el.querySelector('.play-control').addEventListener('click',togglePlay);
  el.querySelector('.mute-control')?.addEventListener('click',()=>{muted=!muted;applyVolume()});
  el.querySelector('.volume-control')?.addEventListener('input',event=>{gain=Number(event.target.value)/100;muted=gain===0;applyVolume()});
  const seek=el.querySelector('.seek-control');
  seek.addEventListener('input',()=>{if(activeAudio&&Number.isFinite(activeAudio.duration)){activeAudio.currentTime=Number(seek.value)/1000*activeAudio.duration;syncProgress()}});
  instances.add(instance);setOpen(!scene&&mode==='open');syncContent();return instance;
}

const grid=document.querySelector('#design-grid');
grid.innerHTML=designs.map((d,index)=>`<article class="design-card" id="design-${d.id}"><header class="design-header"><div class="design-identity"><span class="design-no">0${index+1}</span><h2>${d.name}</h2><span class="design-en">${d.en}</span></div><button type="button" class="scene-button" data-design="${index}">放入场景 ${icon('expand')}</button></header><div class="design-stage design-stage--${d.id}">${markup(d)}</div><p class="design-note"><span>${d.note}</span><em>${d.tag}</em></p></article>`).join('');
grid.querySelectorAll('.vinyl-player').forEach(el=>mountPlayer(el));
document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>{mode=button.dataset.mode;document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));instances.forEach(i=>i.refresh())}));
document.querySelector('#preview-track').addEventListener('change',event=>{trackId=event.target.value;if(started){attachAudio();manager.select(trackId)}syncContent()});
manager.subscribe(syncPlayback);
let scenePlayer;
function showDesign(index){selectedDesign=(index+designs.length)%designs.length;scenePlayer?.destroy();const design=designs[selectedDesign];slot.innerHTML=markup(design);scenePlayer=mountPlayer(slot.querySelector('.vinyl-player'),{scene:true});document.querySelector('.scene-design-name').textContent=design.name;document.querySelector('.scene-count').textContent=`${selectedDesign+1} / ${designs.length}`}
grid.querySelectorAll('.scene-button').forEach(button=>button.addEventListener('click',()=>{showDesign(Number(button.dataset.design));dialog.showModal();document.body.style.overflow='hidden'}));
document.querySelector('.scene-close').innerHTML=icon('close');document.querySelector('.scene-prev').innerHTML=icon('left');document.querySelector('.scene-next').innerHTML=icon('right');
document.querySelector('.scene-close').addEventListener('click',()=>dialog.close());
document.querySelector('.scene-prev').addEventListener('click',()=>showDesign(selectedDesign-1));
document.querySelector('.scene-next').addEventListener('click',()=>showDesign(selectedDesign+1));
dialog.addEventListener('close',()=>{document.body.style.overflow='';scenePlayer?.destroy();scenePlayer=null;slot.replaceChildren()});
const scenes={imperial:{url:'/imperial-knights/delivery-v2/hall-1672.webp',name:'五军同盟',country:'霍亨泰因帝国'},astrology:{url:'/assets/astrology-v2/chaos.webp',name:'永恒不灭的占星会',country:'独立势力'},affairs:{url:'/unconventional-affairs/delivery-v2/background-1672.webp',name:'非常规事务署',country:'奥兰尼亚'}};
sceneSelect.addEventListener('change',()=>{const s=scenes[sceneSelect.value];document.querySelector('.scene-backdrop').style.backgroundImage=`url("${s.url}")`;document.querySelector('.scene-caption>span').textContent=s.country;document.querySelector('.scene-caption>p').textContent=s.name});
document.addEventListener('visibilitychange',()=>{syncPlayback()});
if(import.meta.hot)import.meta.hot.dispose(()=>{detachAudio();scenePlayer?.destroy();instances.forEach(i=>i.destroy())});
