import { fusionConcepts, createFusionTemplates, handleFusionAction } from './gallery-fusion.js';
import { applyScenePalette } from './gallery-palette.js';
const concepts = [
  { name: '银幕手记', english: 'CINEMA NOTES', mood: '克制 · 暗场 · 电影字幕', description: '宽幅画面与低位双栏字幕。让观看先发生，再让文字抵达。', layout: 'cinema' },
  { name: '画册对页', english: 'THE FOLIO', mood: '纸感 · 留白 · 编辑设计', description: '标题独占左页，场景与纪事展开在右页。像翻开一本关于世界的收藏画册。', layout: 'folio' },
  { name: '光色映界', english: 'AFTERIMAGE', mood: '光晕 · 悬浮 · 感官沉浸', description: '场景的光色延伸进界面，画面浮在其中。标题轻触画框，正文收敛为一则引言。', layout: 'afterimage' },
  { name: '世界图志', english: 'THE ATLAS', mood: '精密 · 档案 · 探索感', description: '独立标题、横幅图像、纵向纪事。用细线与编号组织一个可被探索的世界。', layout: 'atlas' },
  { name: '漫游长卷', english: 'A SLOW PASSAGE', mood: '巨幅字形 · 全宽 · 叙事', description: '先读标题，再走进风景。画面横贯页面，纪事在下一幕展开，允许观看慢下来。', layout: 'passage' },
  ...fusionConcepts,
];
const $ = (selector, parent = document) => parent.querySelector(selector);
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
const num = n => String(n).padStart(2, '0');
const icons = {
  left: '<path d="m14 5-7 7 7 7"/>',
  right: '<path d="m10 5 7 7-7 7"/>',
  expand: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
};
const icon = name => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true">'+icons[name]+'</svg>';
const params = new URLSearchParams(location.search);
let concept = Math.min(10, Math.max(1, Number(params.get('concept')) || 6));
let index = 0, photo = 0, scenes = [], clean = false, returnFocus = null;
let photoRequest = 0, photoTransition = Promise.resolve();
let photoTimer;
let sceneRequest=0, requestedScene=null, sceneTransition;
function schedulePhotos() {
  clearTimeout(photoTimer);
  if (concept !== 9 || !scene() || scene().images.length < 2 || document.hidden || document.querySelector('dialog[open]')) return;
  photoTimer=setTimeout(()=>changePhoto((photo+1)%scene().images.length,true),10000);
}
const stage = $('#stage');
const scene = () => scenes[index];
const e = key => escapeHTML(scene()[key]);
const text = (limit = Infinity) => scene().paragraphs.slice(0, limit).map(p=>'<p>'+escapeHTML(p)+'</p>').join('');
const intro = () => '<p>'+escapeHTML(scene().paragraphs[0] || '')+'</p>';
const position = () => num(index + 1) + ' <span>/ ' + num(scenes.length) + '</span>';
const locator = () => '<span class="locator">'+e('location')+'</span>';
const readButton = (label = '阅读完整纪事') => '<button class="text-button" data-action="read">'+label+icon('arrow')+'</button>';
const navigation = () => '<div class="scene-navigation"><span class="counter">'+position()+'</span><button class="round-button" data-action="previous" aria-label="上一处留影">'+icon('left')+'</button><button class="round-button" data-action="next" aria-label="下一处留影">'+icon('right')+'</button></div>';
const picture = (extra = '') => '<figure class="scene-figure '+extra+'"><div class="picture"><img src="'+escapeHTML(scene().images[photo])+'" alt="'+e('name')+'的场景插图" fetchpriority="high" draggable="false"/><button class="expand-image" data-action="image" aria-label="查看完整插图" title="查看完整插图">'+icon('expand')+'</button></div></figure>';
const photoSwitch = () => '<div class="photo-switch" aria-label="场景视角">'+scene().images.map((_,i)=>'<button data-photo="'+i+'" aria-pressed="'+(i===photo)+'" aria-label="切换到视角'+(i+1)+'"><span></span><small>'+num(i+1)+'</small></button>').join('')+'</div>';
const templates = [
  () => '<section class="concept cinema"><div class="cinema-shell"><header class="cinema-top"><span class="wordmark">CELESTIAN <i> / </i> STILL ARCHIVE</span><span class="eyebrow">一帧世界，一段未完的旅程</span></header>'+picture()+'<div class="cinema-under"><div class="cinema-caption"><header class="title-block"><span class="eyebrow">'+e('english')+'</span><h1>'+e('name')+'</h1><p class="subtitle">'+e('subtitle')+'</p></header><div class="cinema-location">'+locator()+'</div></div><article class="cinema-description"><div class="article-label"><span>场景纪事</span><span>CHRONICLE — '+num(index+1)+'</span></div><div class="prose">'+intro()+'</div>'+readButton()+'</article></div><footer class="cinema-footer"><span class="eyebrow">留影 / ORLANIA</span>'+photoSwitch()+navigation()+'</footer></div></section>',
  () => '<section class="concept folio"><header class="folio-masthead"><span class="wordmark">THE CELESTIAN JOURNAL</span><span class="eyebrow">留影辑 · 世界的另一页</span><span class="folio-edition">VOL. I / '+num(index+1)+'</span></header><div class="folio-spread"><div class="folio-title"><span class="folio-kicker">THE PLACES WE REMEMBER</span><div class="folio-english">'+e('english')+'</div><header class="title-block"><h1>'+e('name')+'</h1><p class="subtitle">'+e('subtitle')+'</p></header><div class="folio-metadata"><span class="tiny-label">DESTINATION</span>'+locator()+'<div class="folio-seal"><span>藏</span><small>CELESTIAN<br>COLLECTION</small></div></div></div><div class="folio-right">'+picture()+'<div class="folio-image-caption"><span>FIG. '+num(index+1)+' &nbsp; '+e('name')+'</span>'+photoSwitch()+'</div><article class="folio-article prose">'+text()+'</article></div></div><footer class="folio-footer"><span>把世界的一隅，留在纸上。</span>'+navigation()+'</footer></section>',
  () => '<section class="concept afterimage"><div class="ambient" aria-hidden="true"></div><div class="after-shell"><header class="after-top"><span class="wordmark">C E L E S T I A N</span><span class="eyebrow">A PLACE TO LINGER</span></header><div class="after-frame">'+picture()+'<header class="title-block after-title"><span class="eyebrow">'+e('english')+'</span><h1>'+e('name')+'</h1><p class="subtitle">'+e('subtitle')+'</p></header><div class="after-photo">'+photoSwitch()+'</div></div><div class="after-bottom"><div class="after-location"><span class="tiny-label">SOMEWHERE IN ORLANIA</span>'+locator()+'</div><article class="after-description"><div class="prose">'+intro()+'</div>'+readButton('走近这段故事')+'</article></div><footer class="after-footer"><span class="eyebrow">留住此刻 / AFTERIMAGE</span>'+navigation()+'</footer></div></section>',
  () => '<section class="concept atlas"><header class="atlas-top"><span class="wordmark"><span class="atlas-symbol">✧</span> CELESTIAN ATLAS</span><span class="eyebrow">世界图志 / 地理档案</span>'+navigation()+'</header><div class="atlas-layout"><div class="atlas-visual"><header class="title-block atlas-title"><div class="atlas-label"><span class="tiny-label">FIELD RECORD</span><span class="eyebrow">NO. '+num(index+1)+'</span></div><h1>'+e('name')+'</h1><p class="atlas-english">'+e('english')+'</p></header><div class="atlas-plate">'+picture()+'<span class="plate-corner one" aria-hidden="true"></span><span class="plate-corner two" aria-hidden="true"></span></div><div class="atlas-caption"><span>'+e('subtitle')+'</span>'+photoSwitch()+'<span class="eyebrow">ORLANIA / ARCHIVE</span></div></div><aside class="atlas-details"><header><span class="tiny-label">LOCATION / 地点</span><p>'+e('location')+'</p></header><div class="atlas-story"><div class="article-label"><h2>场景纪事</h2><span>CHRONICLE</span></div>'+scene().paragraphs.map((p,i)=>'<section class="atlas-paragraph"><span>'+num(i+1)+'</span><p>'+escapeHTML(p)+'</p></section>').join('')+'<div class="atlas-end">— END OF RECORD —</div></div></aside></div><footer class="atlas-footer"><span class="eyebrow">CELESTIAN FIELD NOTES</span><span>风景，是世界留下的证词。</span></footer></section>',
  () => '<section class="concept passage"><header class="passage-masthead"><span class="wordmark">CELESTIAN / PASSAGES</span><span class="eyebrow">CHAPTER '+num(index+1)+'</span>'+navigation()+'</header><header class="title-block passage-title"><div class="passage-english">'+e('english')+'</div><div class="passage-chinese"><h1>'+e('name')+'</h1><p class="subtitle">'+e('subtitle')+'</p></div></header><div class="passage-image">'+picture()+'<div class="passage-frame-caption"><span>'+e('name')+' · ORLANIA</span>'+photoSwitch()+'<a href="#passage-story">向下阅读 ↓</a></div></div><section class="passage-reading" id="passage-story"><div class="passage-preface"><span class="tiny-label">CHAPTER '+num(index+1)+' / 场景纪事</span><h2>'+e('subtitle')+'</h2>'+locator()+'<span class="passage-large-number">'+num(index+1)+'</span></div><article class="passage-story prose">'+text()+'<div class="passage-story-end">◇</div></article></section><footer class="passage-next"><span class="tiny-label">THE JOURNEY CONTINUES / 下一处留影</span><button data-action="next">'+escapeHTML(scenes[(index+1)%scenes.length].name)+icon('arrow')+'</button><span class="eyebrow">继续漫游这个世界</span></footer></section>',
];
templates.push(...createFusionTemplates({e,scene,escapeHTML,num,index:()=>index,intro,text,picture,photoSwitch,navigation,locator,readButton,icon}));
function renderTabs() {
  const group=concept>5?1:0;
  $('.concept-tabs').innerHTML=concepts.slice(group*5,group*5+5).map((c,i)=>{
    const n=group*5+i+1;
    return '<button data-concept="'+n+'" aria-pressed="'+(n===concept)+'"><small>'+num(n)+'</small> '+(c.short||['银幕','对页','映界','图志','长卷'][i])+'</button>';
  }).join('');
  $('.series-toggle').textContent=group?'Ⅱ · 融合新稿 ⇄':'Ⅰ · 初稿 ⇄';
  $('.series-toggle').setAttribute('aria-label',group?'查看第一组方案':'查看第二组融合方案');
}
function render({focus=false}={}) {
  photoRequest++;
  const s=scene();
  stage.innerHTML=templates[concept-1]();
  if (concept === 9) applyScenePalette(stage.querySelector('.marginalia'));
  document.body.dataset.concept=concept;
  renderTabs();
  stage.style.setProperty('--scene-image', 'url("'+s.images[photo]+'")');
  document.querySelectorAll('[data-concept]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.concept)===concept)));
  $('#scene-select').value=s.id;
  const url=new URL(location.href);
  url.searchParams.set('concept',concept);
  url.searchParams.set('scene',s.id);
  history.replaceState(null,'',url.pathname+url.search);
  document.title=concepts[concept-1].name+' · 留影设计方案';
  window.scrollTo({top:0,behavior:'instant'});
  $('#announcement').textContent='方案'+concept+'：'+concepts[concept-1].name+'；场景：'+s.name;
  if(focus) stage.focus({preventScroll:true});
  stage.querySelectorAll('img').forEach(img=>{
    img.addEventListener('error',()=>{img.closest('.picture').classList.add('image-failed');img.alt='插图未能载入，请刷新重试';});
  });
  schedulePhotos();
}
async function changePhoto(next, automatic=false) {
  clearTimeout(photoTimer);
  if (concept !== 9) {
    photo=next;
    const top=scrollY;
    render();
    scrollTo({top,behavior:'instant'});
    return;
  }
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
    if(automatic && (document.hidden || document.querySelector('dialog[open]')))return;
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
function changeConcept(value) {
  sceneRequest++;
  requestedScene=null;
  sceneTransition?.skipTransition();
  concept=Number(value);
  render();
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
  document.body.classList.add('modal-open');
  d.showModal();
  if(id==='reader') {
    d.scrollTop=0;
    $('.reader-story').scrollTop=0;
    $('#reader-title').focus({preventScroll:true});
  }
}
document.querySelectorAll('dialog').forEach(d=>{
  d.addEventListener('close',()=>{
    document.body.classList.remove('modal-open');
    if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});
    schedulePhotos();
  });
  d.addEventListener('click',event=>{if(event.target===d && d.id!=='viewer') {const r=d.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)d.close();}});
});
document.addEventListener('visibilitychange',()=>{
  photoRequest++;
  schedulePhotos();
});
document.addEventListener('click',event=>{
  const button=event.target.closest('button');
  if(!button)return;
  if(scenes.length && handleFusionAction(button,stage,scene()))return;
  if(button.dataset.concept){$('#overview').close();changeConcept(button.dataset.concept);return;}
  if(button.dataset.photo!==undefined){changePhoto(Number(button.dataset.photo));return;}
  switch(button.dataset.action) {
    case 'series':changeConcept(concept>5?concept-5:concept+5);break;
    case 'next':nextScene(1);break;
    case 'previous':nextScene(-1);break;
    case 'read':openDialog('reader');break;
    case 'image':openDialog('viewer');break;
    case 'overview':openDialog('overview');break;
    case 'close':button.closest('dialog').close();break;
    case 'preview':
      clean=!clean;document.body.classList.toggle('clean-preview',clean);
      $('.studio').inert=clean;$('.restore').hidden=!clean;
      if(clean){$('.restore').focus();}else{$('[data-action="preview"]').focus();}
      break;
  }
});
$('#scene-select').addEventListener('change',event=>changeScene(scenes.findIndex(s=>s.id===event.target.value)));
document.addEventListener('keydown',event=>{
  if(document.querySelector('dialog[open]')||event.altKey||event.ctrlKey||event.metaKey||['INPUT','SELECT','TEXTAREA'].includes(event.target.tagName))return;
  if(/^[1-5]$/.test(event.key)){event.preventDefault();changeConcept(Number(event.key)+(concept>5?5:0));}
  if(event.key==='Escape'&&clean) $('.restore').click();
});
async function start() {
  try {
    const response=await fetch('/gallery-concepts/scenes.json');
    if(!response.ok)throw new Error('Unable to load local scenes');
    scenes=await response.json();
    index=Math.max(0,scenes.findIndex(s=>s.id===params.get('scene')));
    $('#scene-select').innerHTML=scenes.map(s=>'<option value="'+s.id+'">'+escapeHTML(s.name)+'</option>').join('');
    $('.overview-grid').innerHTML=concepts.map((c,i)=>'<button data-concept="'+(i+1)+'"><div class="layout-diagram diagram-'+c.layout+'" aria-hidden="true"><i class="diagram-image"></i><i class="diagram-title"></i><i class="diagram-text"></i></div><div class="overview-name"><span>'+num(i+1)+'</span><h3>'+c.name+'</h3></div><span class="overview-mood">'+c.mood+'</span><p>'+c.description+'</p><small>'+c.english+' ↗</small></button>').join('');
    render();
  } catch(error) {
    stage.innerHTML='<div class="loading"><h1>场景未能载入</h1><p>请确认本地服务正在运行。</p><button onclick="location.reload()">重新加载</button></div>';
    console.error(error);
  }
}
start();
