import {applyScenePalette} from './gallery-palette.js';
export function mountGallery(root,scenes,{initialId,onClose,onSceneChange,onToggleMusic,music=false}){
const events=new AbortController(),signal=events.signal;
root.innerHTML="  <main id=\"stage\" tabindex=\"-1\" aria-label=\"留影\"><div class=\"loading\">正在展开留影…</div></main>\n  <dialog id=\"reader\" class=\"reader-dialog\" aria-labelledby=\"reader-title\">\n    <div class=\"reader-landscape\" aria-hidden=\"true\"><img alt=\"\" /><div class=\"reader-wash\"></div></div>\n    <header class=\"reader-masthead\"><span>CELESTIAN <i>/</i> CHRONICLES</span><span class=\"reader-edition\"></span></header>\n    <button data-action=\"close\" class=\"reader-close\" aria-label=\"关闭详情\"><span>返回风景</span><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.2\" aria-hidden=\"true\"><path d=\"m6 6 12 12M18 6 6 18\" /></svg></button>\n    <div class=\"reader-layout\">\n      <header class=\"reader-scene\">\n        <span class=\"reader-english\"></span>\n        <h2 id=\"reader-title\" tabindex=\"-1\"></h2>\n        <p class=\"reader-subtitle\"></p>\n        <div class=\"reader-place\"><span>地点</span><p></p></div>\n      </header>\n      <section class=\"reader-story\" tabindex=\"0\" aria-label=\"完整纪事\">\n        <div class=\"reader-story-heading\"><span>场景纪事</span><i></i><small>CHRONICLE</small></div>\n        <div class=\"reader-copy prose\"></div>\n        <footer class=\"reader-colophon\"><span></span><small>CELESTIAN · 留影</small><span></span></footer>\n      </section>\n    </div>\n  </dialog>\n  <dialog id=\"viewer\" class=\"viewer-dialog\" aria-label=\"完整插图\">\n    <button data-action=\"close\" class=\"round-button viewer-close\" aria-label=\"关闭完整插图\">×</button><img alt=\"\" /><p>完整插图 <span>ESC 关闭</span></p>\n  </dialog>\n  <dialog id=\"overview\" class=\"overview-dialog\" aria-labelledby=\"overview-title\"><header><div><span class=\"eyebrow\">CELESTIAN / ARCHIVE</span><h2 id=\"overview-title\">留影目录</h2></div><button data-action=\"close\" class=\"round-button\" aria-label=\"关闭留影目录\">×</button></header><div class=\"gallery-index-grid\"></div></dialog>\n  <p id=\"announcement\" class=\"sr-only\" aria-live=\"polite\"></p>\n";
const $ = (selector, parent = root) => parent.querySelector(selector);
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
const num = n => String(n).padStart(2, '0');
const icons = {
  left: '<path d="m14 5-7 7 7 7"/>',
  right: '<path d="m10 5 7 7-7 7"/>',
  expand: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
};
const icon = name => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true">'+icons[name]+'</svg>';
const concept=9;
let index=Math.max(0,scenes.findIndex(s=>s.id===initialId)), photo=0, returnFocus=null;
let photoRequest = 0, photoTransition = Promise.resolve();
let photoTimer;
let destroyed=false;
let sceneRequest=0, requestedScene=null, sceneTransition;
function schedulePhotos() {
  clearTimeout(photoTimer);
  if (destroyed || concept !== 9 || !scene() || scene().images.length < 2 || document.hidden || root.querySelector('dialog[open]')) return;
  photoTimer=setTimeout(()=>changePhoto((photo+1)%scene().images.length,true),10000);
}
const stage = $('#stage');
const scene = () => scenes[index];
const e = key => escapeHTML(scene()[key]);
const text = (limit = Infinity) => scene().paragraphs.slice(0, limit).map(p=>'<p>'+escapeHTML(p)+'</p>').join('');
const position = () => num(index + 1) + ' <span>/ ' + num(scenes.length) + '</span>';
const locator = () => '<span class="locator">'+e('location')+'</span>';
const readButton = (label = '阅读完整纪事') => '<button class="text-button" data-action="read">'+label+icon('arrow')+'</button>';
const navigation = () => '<div class="scene-navigation"><button class="gallery-index-button" data-action="index" aria-label="打开全部留影">▦ <span>留影目录</span></button><span class="counter">'+position()+'</span><button class="round-button" data-action="previous" aria-label="上一处留影">'+icon('left')+'</button><button class="round-button" data-action="next" aria-label="下一处留影">'+icon('right')+'</button></div>';
const picture = (extra = '') => '<figure class="scene-figure '+extra+'"><div class="picture"><img src="'+escapeHTML(scene().images[photo])+'" alt="'+e('name')+'的场景插图" fetchpriority="high" draggable="false"/><button class="expand-image" data-action="image" aria-label="查看完整插图" title="查看完整插图">'+icon('expand')+'</button></div></figure>';
const photoSwitch = () => '<div class="photo-switch" aria-label="场景视角">'+scene().images.map((_,i)=>'<button data-photo="'+i+'" aria-pressed="'+(i===photo)+'" aria-label="切换到视角'+(i+1)+'"><span></span><small>'+num(i+1)+'</small></button>').join('')+'</div>';
const header=label=>'<header class="fusion-header"><span class="wordmark">CELESTIAN <i>/</i> '+label+'</span><div class="gallery-header-tools"><button data-action="music"></button><button class="round-button" data-action="return" aria-label="返回百科" title="返回百科">×</button></div></header>';
const footer=()=>'<footer class="fusion-footer">'+locator()+navigation()+'</footer>';
const template = () => '<section class="concept fusion marginalia">'+header('ANNOTATED LANDSCAPE')+'<div class="margin-world">'+picture('margin-image')+'<div class="margin-shade" aria-hidden="true"></div><header class="title-block margin-title"><span class="eyebrow">'+e('english')+'</span><h1>'+e('name')+'</h1></header><article class="margin-story"><p class="subtitle">'+e('subtitle')+'</p><div class="note-steps" aria-label="选择纪事段落">'+scene().paragraphs.map((_,i)=>'<button data-note="'+i+'" aria-label="纪事第'+(i+1)+'段" aria-pressed="'+(i===0)+'">'+num(i+1)+'</button>').join('')+'</div><p id="note-copy" class="prose" aria-live="polite">'+escapeHTML(scene().paragraphs[0]||'')+'</p>'+readButton('展开全部纪事')+'</article><div class="margin-view">'+photoSwitch()+'</div></div>'+footer()+'</section>';
function render({focus=false}={}) {
  photoRequest++;
  const s=scene();
  stage.innerHTML=template();
  if (concept === 9) applyScenePalette(stage.querySelector('.marginalia'));
  updateMusic();
  stage.style.setProperty('--scene-image', 'url("'+s.images[photo]+'")');
  onSceneChange(s.id);
  root.parentElement.scrollTo({top:0,behavior:'instant'});
  $('#announcement').textContent=s.name;
  if(focus) stage.focus({preventScroll:true});
  stage.querySelectorAll('img').forEach(img=>{
    img.addEventListener('error',()=>{img.closest('.picture').classList.add('image-failed');img.alt='插图未能载入，请刷新重试';});
  });
  schedulePhotos();
}
async function changePhoto(next, automatic=false) {
  clearTimeout(photoTimer);
    const request=++photoRequest;
  const section=stage.querySelector('.marginalia');
  const incoming=new Image();
  incoming.src=scene().images[next];
  incoming.alt=scene().name+'的场景插图';
  incoming.draggable=false;
  try {
    // Keep the current frame visible until the new image is fully decoded.
    await incoming.decode();
    await photoTransition;
    if(request!==photoRequest || !section.isConnected || next===photo)return;
    if(automatic && (document.hidden || root.querySelector('dialog[open]')))return;
    const old=section.querySelector('.picture img');
    incoming.className='photo-incoming';
    old.after(incoming);
    old.setAttribute('aria-hidden','true');
    const duration=matchMedia('(prefers-reduced-motion: reduce)').matches?0:1100;
    applyScenePalette(section,{image:incoming,duration});
    photo=next;
    section.querySelectorAll('[data-photo]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.photo)===photo)));
    if(!automatic)$('#announcement').textContent=scene().name+'，视角'+num(photo+1);
    const fade=incoming.animate([{opacity:0},{opacity:1}],{duration,easing:'cubic-bezier(.4,0,.2,1)',fill:'both'});
    photoTransition=fade.finished.catch(()=>{}).then(()=>{
      old.remove();
      incoming.classList.remove('photo-incoming');
      fade.cancel();
    });
  } catch {
    if(request===photoRequest)$('#announcement').textContent='该视角暂时无法载入，请重试。';
  } finally {
    if(request===photoRequest)schedulePhotos();
  }
}
function nextScene(delta) {
  changeScene(((requestedScene ?? index)+delta+scenes.length)%scenes.length);
}
async function changeScene(next) {
  const request=++sceneRequest;
  requestedScene=next;
  clearTimeout(photoTimer);
  photoRequest++;
  const image=new Image();
  image.src=scenes[next].images[0];
  try {
    await image.decode();
    if(request!==sceneRequest)return;
    sceneTransition?.skipTransition();
    const commit=async()=>{
      if(request!==sceneRequest)return;
      index=next;
      photo=0;
      render();
      // Let the decoded image's palette settle before capturing the new scene.
      await stage.querySelector('.picture img').decode();
    };
    if(concept===9 && document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches){
      sceneTransition=document.startViewTransition(commit);
      await sceneTransition.finished;
    } else await commit();
  } catch {
    if(request===sceneRequest)$('#announcement').textContent='下一处留影暂时无法载入，请重试。';
  } finally {
    if(request===sceneRequest){requestedScene=null;schedulePhotos();}
  }
}
function openDialog(id) {
  sceneRequest++;
  requestedScene=null;
  sceneTransition?.skipTransition();
  clearTimeout(photoTimer);
  photoRequest++;
  returnFocus=document.activeElement;
  const d=$('#'+id);
  if(id==='reader') {
    $('#reader-title').textContent=scene().name;
    $('.reader-english').textContent=scene().english;
    $('.reader-edition').textContent=num(index+1)+' / '+num(scenes.length);
    $('.reader-subtitle').textContent=scene().subtitle;
    $('.reader-place p').textContent=scene().location;
    $('.reader-copy').innerHTML=text();
    const image=$('.reader-landscape img');
    image.src=scene().images[photo];
    d.style.setProperty('--scene-rgb',stage.querySelector('.marginalia')?.style.getPropertyValue('--scene-rgb') || '26 28 29');
    applyScenePalette(d,{image});
  }
  if(id==='viewer') {const img=$('#viewer img');img.src=scene().images[photo];img.alt=scene().name+'完整插图';}
  root.classList.add('modal-open');
  d.showModal();
  if(id==='reader') {
    d.scrollTop=0;
    $('.reader-story').scrollTop=0;
    $('#reader-title').focus({preventScroll:true});
  }
}
root.querySelectorAll('dialog').forEach(d=>{
  d.addEventListener('close',()=>{
    root.classList.remove('modal-open');
    if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});
    schedulePhotos();
  });
  d.addEventListener('click',event=>{if(event.target===d && d.id!=='viewer') {const r=d.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)d.close();}});
});
document.addEventListener('visibilitychange',()=>{
  photoRequest++;
  schedulePhotos();
},{signal});
root.addEventListener('click',event=>{
  const button=event.target.closest('button');
  if(!button)return;
  if(button.dataset.note!==undefined){
    const i=Number(button.dataset.note);
    $('#note-copy').textContent=scene().paragraphs[i]||'';
    stage.querySelectorAll('[data-note]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.note)===i)));
    return;
  }
  if(button.dataset.scene!==undefined){$('#overview').close();changeScene(Number(button.dataset.scene));return;}
  if(button.dataset.photo!==undefined){changePhoto(Number(button.dataset.photo));return;}
  switch(button.dataset.action) {
    case 'next':nextScene(1);break;
    case 'previous':nextScene(-1);break;
    case 'read':openDialog('reader');break;
    case 'image':openDialog('viewer');break;
    case 'index':openDialog('overview');break;
    case 'return':onClose();break;
    case 'music':onToggleMusic?.();break;
    case 'close':button.closest('dialog').close();break;

  }
},{signal});
document.addEventListener('keydown',event=>{
  if(root.querySelector('dialog[open]')||event.altKey||event.ctrlKey||event.metaKey||['INPUT','SELECT','TEXTAREA'].includes(event.target.tagName))return;
  if(event.key==='Escape')onClose();
  if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();nextScene(event.key==='ArrowRight'?1:-1);}
},{signal});
  $('.gallery-index-grid').innerHTML=scenes.map((s,i)=>'<button data-scene="'+i+'"><img src="'+escapeHTML(s.images[0]||'')+'" alt="" loading="lazy"><span><small>'+num(i+1)+'</small> '+escapeHTML(s.name)+'</span></button>').join('');
  function updateMusic(){const b=$('[data-action="music"]');if(b){b.textContent='音乐 · '+(music?'开':'关');b.setAttribute('aria-label',music?'静音背景音乐':'开启背景音乐');}}
  render();
  return {
    select(id){const next=scenes.findIndex(s=>s.id===id);if(next>=0&&next!==index&&next!==requestedScene)changeScene(next);},
    setMusic(value){music=value;updateMusic();},
    destroy(){destroyed=true;sceneRequest++;photoRequest++;clearTimeout(photoTimer);events.abort();sceneTransition?.skipTransition();root.querySelectorAll('dialog[open]').forEach(d=>d.close());root.replaceChildren();}
  };
}
