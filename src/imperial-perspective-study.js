import { homography, project, validQuad, panelGeometry } from './imperial-perspective-geometry.js';

// Manually traced on the original 1672 x 941 plate. The quad follows the
// REAR wall/inner reveal, not the moulding's outer rim or the page viewport.
// Metric aspect is an initial visual estimate, not a recovered camera model.
const defaults = [
  {id:'lion', name:'逐猎之狮', code:'I', color:'#e9cc82', pin:[216,246],
    wall:[[130,300],[290,300],[280,669],[134,669]], apex:[213,194],
    curve:[[129,241],[168,199],[254,199],[291,243]], wallAspect:153/369,
    panel:{center:.54,top:-.045,size:.82}, note:'左侧外拱 · 检查右边线与石柱的夹角'},
  {id:'bear', name:'熊', code:'II', color:'#a8c5a1', pin:[476,246],
    wall:[[399,301],[554,301],[546,670],[401,670]], apex:[476,199],
    curve:[[401,248],[435,204],[517,204],[554,248]], wallAspect:150/369,
    panel:{center:.51,top:-.045,size:.82}, note:'左侧内拱 · 以内侧石墙边缘为参照'},
  {id:'imperial', name:'帝国主旗', code:'III', color:'#d8b168', pin:[838,112],
    wall:[[698,210],[973,210],[974,673],[696,673]], apex:[838,93],
    curve:[[709,151],[770,97],[909,98],[961,153]], wallAspect:276.5/463,
    panel:{center:.51,top:-.065,size:.84}, note:'中央主拱 · 更大的方形标板'},
  {id:'lynx', name:'猞猁', code:'IV', color:'#d4b3e9', pin:[1198,246],
    wall:[[1124,302],[1273,302],[1277,670],[1126,670]], apex:[1198,202],
    curve:[[1128,247],[1161,207],[1238,206],[1270,250]], wallAspect:150/368,
    panel:{center:.49,top:-.045,size:.82}, note:'右侧内拱 · 检查左右边线的收敛'},
  {id:'wolf', name:'狼', code:'V', color:'#a4c1e9', pin:[1447,246],
    wall:[[1379,301],[1544,301],[1550,670],[1390,670]], apex:[1462,199],
    curve:[[1383,248],[1421,204],[1508,203],[1541,249]], wallAspect:162.5/369,
    panel:{center:.42,top:-.045,size:.82}, note:'右侧外拱 · 挂点与壁龛中心分别校准'},
];
const storageKey = 'celestian-hall-perspective-study-v1';
let arches = structuredClone(defaults), selected = 'lion', focused = false, detail = false;
try {
  const saved = JSON.parse(localStorage.getItem(storageKey));
  if (Array.isArray(saved) && saved.length === 5 && saved.every((a,i) => a.id===defaults[i].id && validQuad(a.wall) && a.pin?.length===2 && a.pin.every(Number.isFinite) && ['center','top','size'].every(k=>Number.isFinite(a.panel?.[k])))) {
    arches = defaults.map((a,i)=>({...a,wall:saved[i].wall,pin:saved[i].pin,panel:saved[i].panel}));
  }
} catch { /* The study remains usable when browser storage is unavailable. */ }
const $ = selector => document.querySelector(selector);
const scene = $('#scene');
const pointLabels = ['A 左上','B 右上','C 右下','D 左下'];
const fmt = n => Number(n.toFixed(2));
const points = list => list.map(p=>p.map(fmt).join(',')).join(' ');
const line = (a,b,attrs='')=>`<line x1="${fmt(a[0])}" y1="${fmt(a[1])}" x2="${fmt(b[0])}" y2="${fmt(b[1])}" ${attrs}/>`;
const current = ()=>arches.find(a=>a.id===selected);
const save = ()=>{try {localStorage.setItem(storageKey,JSON.stringify(arches));$('#save-status').textContent='调整已保存在本机 · 正式页面未改动';} catch {$('#save-status').textContent='浏览器无法保存，请导出参数留存';}};

$('#arch-tabs').innerHTML=arches.map(a=>`<button data-arch="${a.id}" aria-pressed="${a.id===selected}"><span>${a.code}</span>${a.name}</button>`).join('');
for(const button of document.querySelectorAll('[data-arch]'))button.addEventListener('click',()=>select(button.dataset.arch));

function select(id){selected=id;render();renderInspector();}
function render(){
  const active=current();
  for(const button of document.querySelectorAll('#arch-tabs [data-arch]'))button.setAttribute('aria-pressed',button.dataset.arch===selected);
  scene.classList.toggle('hide-walls',!$('#show-walls').checked);
  scene.classList.toggle('hide-grid',!$('#show-grid').checked);
  scene.classList.toggle('hide-guides',!$('#show-guides').checked);
  scene.classList.toggle('hide-panels',!$('#show-panels').checked);
  let view=[0,0,1672,941];
  if(focused){
    const xs=active.wall.map(p=>p[0]), x=Math.min(...xs)-78;
    const top=active.id==='imperial'?40:140;
    view=[x,top,Math.max(...xs)-x+78,735-top];
    if(detail)view=[Math.min(...xs)-45,active.apex[1]-38,Math.max(...xs)-Math.min(...xs)+90,active.wall[0][1]-active.apex[1]+210];
  }
  scene.setAttribute('viewBox',view.join(' '));
  ['x','y','width','height'].forEach((key,i)=>$('#view-crop').setAttribute(key,view[i]));
  $('#overview').setAttribute('aria-pressed',!focused);$('#focus').setAttribute('aria-pressed',focused&&!detail);$('#detail').setAttribute('aria-pressed',focused&&detail);
  $('#view-label').textContent=focused?`${active.name} · ${detail?'顶部细节':'局部放大'}`:'1672 × 941 · 原图坐标';
  $('#wall-layer').innerHTML=arches.map(a=>{
    const [A,B,C,D]=a.wall, [c1,c2,c3,c4]=a.curve;
    return `<g class="wall ${a.id===selected?'selected':''}" data-arch="${a.id}">
      <path class="arch-trace" d="M${points([D])}L${points([A])}C${points([c1,c2,a.apex])}C${points([c3,c4,B])}L${points([C])}"/>
      <polygon class="wall-quad" points="${points(a.wall)}"/>
    </g>`;
  }).join('');
  $('#panel-layer').innerHTML=arches.map(a=>{
    const geo=panelGeometry(a), [A,B,C,D]=geo.corners;
    const grid=[.25,.5,.75].map(t=>line(geo.sample(t,0),geo.sample(t,1))+line(geo.sample(0,t),geo.sample(1,t))).join('');
    const center=geo.sample(.5,.5), upper=geo.sample(.5,.31), lower=geo.sample(.5,.68);
    return `<g class="panel ${a.id===selected?'selected':''}" style="--panel-color:${a.color}" data-panel="${a.id}">
      <path class="suspension" d="M${points([A])}L${points([a.pin])}L${points([B])}"/>
      <polygon class="square-fill" points="${points(geo.corners)}"/>
      <g class="square-grid">${grid}${line(A,C,'class="diagonal"')}${line(B,D,'class="diagonal"')}</g>
      <polygon class="square-border" points="${points(geo.corners)}"/>
      ${line(A,B,'class="rod"')}
      <text class="square-index" x="${upper[0]}" y="${upper[1]}">${a.code}</text>
      <text class="square-name" x="${center[0]}" y="${center[1]}">${a.name}</text>
      <text class="square-ratio" x="${lower[0]}" y="${lower[1]}">1 : 1</text>
      <circle class="pin" cx="${a.pin[0]}" cy="${a.pin[1]}" r="3"/>
    </g>`;
  }).join('');
  $('#guide-layer').innerHTML=arches.map(a=>{
    const geo=panelGeometry(a);
    return `<g class="edge-guides ${a.id===selected?'selected':''}" style="--panel-color:${a.color}">${[geo.left,geo.right].map(u=>line(project(geo.matrix,u,-.08),project(geo.matrix,u,1.02))).join('')}</g>`;
  }).join('');
  const handle=(p,key,label,cls='')=>`<g class="handle ${cls}" data-handle="${key}" tabindex="0" role="button" aria-label="${label}控制点，方向键微调"><circle class="handle-target" cx="${p[0]}" cy="${p[1]}" r="11"/><circle cx="${p[0]}" cy="${p[1]}" r="3.8"/><text x="${p[0]+9}" y="${p[1]-8}">${label}</text></g>`;
  $('#handle-layer').innerHTML=active.wall.map((p,i)=>handle(p,i,['A','B','C','D'][i])).join('')+handle(active.pin,'pin','P','pin-handle');
  const angle=(top,bottom)=>Math.atan2(bottom[0]-top[0],bottom[1]-top[1])*180/Math.PI;
  const l=angle(active.wall[0],active.wall[3]),r=angle(active.wall[1],active.wall[2]);
  $('#measurements').innerHTML=`<span>墙边相对垂直方向</span><strong>左 ${l>=0?'+':''}${l.toFixed(2)}° <i>/</i> 右 ${r>=0?'+':''}${r.toFixed(2)}°</strong><small>正值向右倾斜 · 标板与墙面使用同一投影</small>`;
  $('#center-value').value=`${Math.round(active.panel.center*100)}%`;
  $('#top-value').value=`${Math.round(active.panel.top*100)}%`;
  $('#size-value').value=`${Math.round(active.panel.size*100)}%`;
}
function coordinateFields(label,key,p){return `<div class="point-row"><span>${label}</span>${['x','y'].map((axis,i)=>`<label>${axis.toUpperCase()}<input type="number" aria-label="${label} ${axis.toUpperCase()}坐标" data-point="${key}" data-axis="${i}" min="0" max="${i?941:1672}" step="0.5" value="${fmt(p[i])}"></label>`).join('')}</div>`;}
function renderInspector(){
  const a=current();$('#arch-name').textContent=a.name;$('#arch-note').textContent=a.note;
  $('#point-fields').innerHTML=a.wall.map((p,i)=>coordinateFields(pointLabels[i],i,p)).join('');
  $('#pin-fields').innerHTML=coordinateFields('P 挂点','pin',a.pin);
  for(const key of ['center','top','size'])$(`#panel-${key}`).value=a.panel[key];
}
function updatePoint(key,axis,value){
  if(!Number.isFinite(value))return false;
  const a=current(), next=structuredClone(a);
  (key==='pin'?next.pin:next.wall[Number(key)])[axis]=Math.max(0,Math.min(axis?941:1672,value));
  if(!validQuad(next.wall)){$('#save-status').textContent='四角不能交叉或重合，请沿石墙边线调整';return false;}
  arches[arches.indexOf(a)]=next;return true;
}
$('.inspector').addEventListener('change',event=>{
  const input=event.target;if(!input.matches('[data-point]'))return;
  updatePoint(input.dataset.point,Number(input.dataset.axis),input.valueAsNumber);save();render();renderInspector();
});
for(const key of ['center','top','size'])$(`#panel-${key}`).addEventListener('input',event=>{current().panel[key]=Number(event.target.value);save();render();});
for(const id of ['show-walls','show-grid','show-guides','show-panels'])$(`#${id}`).addEventListener('change',render);
$('#overview').addEventListener('click',()=>{focused=false;detail=false;render();});
$('#focus').addEventListener('click',()=>{focused=true;detail=false;render();});
$('#detail').addEventListener('click',()=>{focused=true;detail=true;render();});
$('#reset').addEventListener('click',()=>{const i=arches.findIndex(a=>a.id===selected);arches[i]=structuredClone(defaults[i]);save();render();renderInspector();});
scene.addEventListener('click',event=>{const panel=event.target.closest('[data-panel]');if(panel)select(panel.dataset.panel);});

let drag=null;
scene.addEventListener('pointerdown',event=>{
  const target=event.target.closest('[data-handle]');if(!target)return;
  drag={key:target.dataset.handle,id:event.pointerId};scene.setPointerCapture(event.pointerId);event.preventDefault();
});
scene.addEventListener('pointermove',event=>{
  if(!drag||event.pointerId!==drag.id)return;
  const p=new DOMPoint(event.clientX,event.clientY).matrixTransform(scene.getScreenCTM().inverse());
  updatePoint(drag.key,0,Math.round(p.x*2)/2);updatePoint(drag.key,1,Math.round(p.y*2)/2);
  render();renderInspector();
});
const endDrag=()=>{if(drag){drag=null;save();}};
scene.addEventListener('pointerup',endDrag);scene.addEventListener('pointercancel',endDrag);
scene.addEventListener('keydown',event=>{
  const target=event.target.closest('[data-handle]');
  if(!target||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
  event.preventDefault();const key=target.dataset.handle,axis=['ArrowLeft','ArrowRight'].includes(event.key)?0:1;
  const delta=(['ArrowLeft','ArrowUp'].includes(event.key)?-1:1)*(event.shiftKey?5:.5);
  const p=key==='pin'?current().pin:current().wall[Number(key)];
  updatePoint(key,axis,p[axis]+delta);save();render();renderInspector();
  scene.querySelector(`[data-handle="${key}"]`).focus();
});
$('#export').addEventListener('click',()=>{
  const data={version:1,image:{path:'/imperial-knights/hall-v1/hall.webp',width:1672,height:941},coordinateOrder:'TL, TR, BR, BL',note:'Manual wall traces; wallAspect is an estimated local metric. Not yet applied to the live flags.',arches:arches.map(a=>({id:a.id,wall:a.wall,pin:a.pin,apex:a.apex,curve:a.curve,wallAspect:a.wallAspect,panel:a.panel,homography:homography(a.wall),squareCorners:panelGeometry(a).corners}))};
  const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download='imperial-hall-perspective.json';link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);$('#save-status').textContent='已导出校准参数 · 可用于迁回正式页面';
});
render();renderInspector();
