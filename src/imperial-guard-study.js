const $=selector=>document.querySelector(selector);
const WIDTH=1672,HEIGHT=941,FOOT=.95,storageKey='celestian-guard-study-v1';
const frame=$('#hall-frame'),artboard=$('#artboard'),viewport=$('#viewport');
const limits={x:[0,WIDTH],y:[0,HEIGHT],height:[36,320],brightness:[.25,2]};
let defaults=[],guards=[],hosts=[],selected=2,view='hall',camera=[0,0,WIDTH,HEIGHT],ready=false,drag=null;
let undoStack=[],redoStack=[],editSnapshot=null;
const round=n=>Math.round(n*100)/100;
const snapshot=()=>JSON.stringify(guards);
const clamp=(key,value)=>Math.max(limits[key][0],Math.min(limits[key][1],value));
const current=()=>guards[selected];
const payload=()=>({version:1,artboard:{width:WIDTH,height:HEIGHT,footRatio:FOOT},arrangement:guards.map(g=>g.variant).join(''),guards:guards.map(g=>({...g}))});

function validConfiguration(data){
  return data?.version===1&&Array.isArray(data.guards)&&data.guards.length===6&&data.guards.every((g,i)=>g.id===defaults[i].id&&g.variant===defaults[i].variant&&Object.keys(limits).every(key=>Number.isFinite(g[key])&&g[key]>=limits[key][0]&&g[key]<=limits[key][1]));
}
function adopt(data){return data.guards.map((g,i)=>({...defaults[i],...Object.fromEntries(Object.keys(limits).map(key=>[key,g[key]]))}));}
function save(){
  const json=JSON.stringify(payload(),null,2);$('#config-output').value=json;
  try{localStorage.setItem(storageKey,json);$('#save-status').textContent='已自动保存 · 仅保存在此校准页';}
  catch{$('#save-status').textContent='浏览器无法保存，请导出配置留存';}
}
function historyButtons(){$('#undo').disabled=!undoStack.length;$('#redo').disabled=!redoStack.length;}
function commit(before){if(before&&before!==snapshot()){undoStack.push(before);if(undoStack.length>50)undoStack.shift();redoStack=[];}historyButtons();}
function finishEdit(){commit(editSnapshot);editSnapshot=null;}
function paint(){
  guards.forEach((g,i)=>{
    const host=hosts[i],width=g.height*2/3,top=g.y-g.height*FOOT;
    Object.assign(host.style,{left:`${g.x/WIDTH*100}%`,top:`${top/HEIGHT*100}%`,bottom:'auto',width:`${width/WIDTH*100}%`,height:`${g.height/HEIGHT*100}%`});
    host.style.setProperty('--guard-light',g.brightness);
    const handle=$(`[data-handle="${i}"]`);
    Object.assign(handle.style,{left:`${g.x}px`,top:`${top}px`,width:`${width}px`,height:`${g.height}px`});
    handle.classList.toggle('selected',i===selected);handle.setAttribute('aria-pressed',String(i===selected));
  });
  for(const button of document.querySelectorAll('[data-guard]'))button.setAttribute('aria-pressed',String(Number(button.dataset.guard)===selected));
}
function inspector(){
  const g=current();$('#selected-title').textContent=`${String(selected+1).padStart(2,'0')} · ${g.variant==='A'?'披风甲':'沟槽甲'}`;
  $('#selected-description').textContent=`${['最左侧','左侧第二根','中央左侧','中央右侧','右侧第二根','最右侧'][selected]}石柱 · ${g.variant} 款`;
  for(const key of Object.keys(limits)){
    const value=round(g[key]*(key==='brightness'?100:1));
    $(`#${key}-range`).value=value;
    if(document.activeElement!==$(`#${key}-number`))$(`#${key}-number`).value=value;
  }
  $('#brightness-label').value=`${Math.round(g.brightness*100)}%`;
}
function fit(){
  if(!ready)return;
  const w=viewport.clientWidth,h=viewport.clientHeight;
  const scale=Math.min(w/camera[2],h/camera[3]);
  const x=(w-camera[2]*scale)/2-camera[0]*scale,y=(h-camera[3]*scale)/2-camera[1]*scale;
  artboard.style.transform=`translate(${x}px,${y}px) scale(${scale})`;
}
function setView(mode){
  view=mode;
  if(mode==='hall')camera=[0,0,WIDTH,HEIGHT];
  else if(mode==='floor')camera=[0,590,WIDTH,351];
  else{const g=current(),width=Math.max(300,g.height*2.5),height=Math.max(290,g.height*1.6);camera=[Math.max(0,Math.min(WIDTH-width,g.x-width/2)),Math.max(0,Math.min(HEIGHT-height,g.y-height*.73)),width,height];}
  for(const button of document.querySelectorAll('[data-view]'))button.setAttribute('aria-pressed',String(button.dataset.view===mode));
  fit();
}
function select(index,focusCamera=true){finishEdit();selected=index;paint();inspector();if(view==='guard'&&focusCamera)setView('guard');}
function changed(){paint();inspector();save();}
function update(key,value){
  if(!Number.isFinite(value))return;
  value=clamp(key,value);
  const previous=current()[key];
  if($('#link-guards').checked&&['height','brightness'].includes(key)){
    const ratio=value/previous;guards.forEach(g=>g[key]=round(clamp(key,g[key]*ratio)));
  }else current()[key]=round(value);
  changed();
}
function move(dx,dy){const before=snapshot();current().x=round(clamp('x',current().x+dx));current().y=round(clamp('y',current().y+dy));changed();commit(before);}

function initialize(){
  if(ready)return;
  const doc=frame.contentDocument,scene=doc?.querySelector('.hall-scene');
  if(!scene){$('#loading').textContent='大厅未能加载，请刷新重试';return;}
  const style=doc.createElement('style');
  style.textContent='html,body{width:1672px!important;height:941px!important;overflow:hidden!important}.hall{min-height:0!important;padding:0!important}.hall-scene{width:1672px!important;height:941px!important;max-width:none!important;margin:0!important;aspect-ratio:auto!important}.topbar,.hall-index,.gallery-hint{display:none!important}.standards-gallery{overflow:visible!important}';
  doc.head.append(style);
  const motion=doc.querySelector('#motion-toggle');if(motion?.getAttribute('aria-pressed')==='false')motion.click();
  hosts=Array.from(scene.querySelectorAll('.hall-guard'));
  if(hosts.length!==6){$('#loading').textContent='未找到完整的六名卫兵，请检查正式页面';return;}
  const sceneRect=scene.getBoundingClientRect();
  defaults=hosts.map((host,i)=>{const rect=host.getBoundingClientRect(),css=frame.contentWindow.getComputedStyle(host);return{id:`guard-${i+1}`,variant:host.classList.contains('guard-a')?'A':'B',x:round(rect.left-sceneRect.left+rect.width/2),y:round(rect.top-sceneRect.top+rect.height*FOOT),height:round(rect.height),brightness:Number(css.getPropertyValue('--guard-light'))};});
  guards=structuredClone(defaults);
  try{const data=JSON.parse(localStorage.getItem(storageKey));if(validConfiguration(data))guards=adopt(data);}catch{/* Keep the initial arrangement when storage is absent or invalid. */}
  $('#guard-tabs').innerHTML=guards.map((g,i)=>`<button data-guard="${i}" aria-pressed="${i===selected}"><span class="index">${String(i+1).padStart(2,'0')}</span><span class="kind">${g.variant} · ${g.variant==='A'?'披风甲':'沟槽甲'}</span></button>`).join('');
  $('#handles').innerHTML=guards.map((g,i)=>`<button type="button" class="guard-handle" data-handle="${i}" aria-label="拖动第 ${i+1} 名${g.variant==='A'?'披风甲':'沟槽甲'}卫兵" aria-pressed="${i===selected}"><span>${String(i+1).padStart(2,'0')} · ${g.variant}</span></button>`).join('');
  ready=true;$('#loading').hidden=true;artboard.classList.add('ready');
  $('#controls').disabled=false;['export','copy','reset-all'].forEach(id=>$(`#${id}`).disabled=false);
  paint();inspector();save();setView('hall');
}
frame.addEventListener('load',initialize);
if(frame.contentDocument?.readyState==='complete'&&frame.contentDocument.querySelector('.hall-guards'))initialize();
new ResizeObserver(fit).observe(viewport);

$('#guard-tabs').addEventListener('click',event=>{const button=event.target.closest('[data-guard]');if(button)select(Number(button.dataset.guard));});
for(const button of document.querySelectorAll('[data-view]'))button.addEventListener('click',()=>{if(ready)setView(button.dataset.view);});
$('#show-handles').addEventListener('change',event=>$('#handles').classList.toggle('hidden',!event.target.checked));
for(const input of document.querySelectorAll('[data-key]')){
  input.addEventListener('focus',()=>{if(ready&&editSnapshot===null)editSnapshot=snapshot();});
  input.addEventListener('pointerdown',()=>{if(ready&&editSnapshot===null)editSnapshot=snapshot();});
  input.addEventListener('input',()=>{if(!ready)return;if(editSnapshot===null)editSnapshot=snapshot();update(input.dataset.key,input.valueAsNumber/(input.dataset.key==='brightness'?100:1));});
  input.addEventListener('change',finishEdit);input.addEventListener('blur',()=>{finishEdit();if(ready)inspector();});
}
for(const button of document.querySelectorAll('[data-dx]'))button.addEventListener('click',()=>move(Number(button.dataset.dx),Number(button.dataset.dy)));
$('#handles').addEventListener('pointerdown',event=>{
  if(event.button!==0)return;const handle=event.target.closest('[data-handle]');if(!handle)return;
  select(Number(handle.dataset.handle),false);handle.focus();
  const scale=artboard.getBoundingClientRect().width/WIDTH;
  drag={id:event.pointerId,handle,startX:event.clientX,startY:event.clientY,x:current().x,y:current().y,scale,before:snapshot()};
  handle.setPointerCapture(event.pointerId);handle.classList.add('dragging');event.preventDefault();
});
$('#handles').addEventListener('pointermove',event=>{
  if(!drag||drag.id!==event.pointerId)return;
  current().x=round(clamp('x',drag.x+(event.clientX-drag.startX)/drag.scale));current().y=round(clamp('y',drag.y+(event.clientY-drag.startY)/drag.scale));changed();
});
function finishDrag(event){if(!drag||event.pointerId!==drag.id)return;const last=drag;drag=null;last.handle.classList.remove('dragging');commit(last.before);if(last.handle.hasPointerCapture(event.pointerId))last.handle.releasePointerCapture(event.pointerId);}
$('#handles').addEventListener('pointerup',finishDrag);$('#handles').addEventListener('pointercancel',finishDrag);$('#handles').addEventListener('lostpointercapture',finishDrag);
$('#handles').addEventListener('keydown',event=>{
  const directions={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
  if(directions[event.key]){event.preventDefault();const step=event.shiftKey?10:1;move(...directions[event.key].map(v=>v*step));}
});
$('#undo').addEventListener('click',()=>{finishEdit();if(!undoStack.length)return;redoStack.push(snapshot());guards=JSON.parse(undoStack.pop());changed();historyButtons();});
$('#redo').addEventListener('click',()=>{if(!redoStack.length)return;undoStack.push(snapshot());guards=JSON.parse(redoStack.pop());changed();historyButtons();});
$('#reset-current').addEventListener('click',()=>{const before=snapshot();guards[selected]=structuredClone(defaults[selected]);changed();commit(before);});
$('#reset-all').addEventListener('click',()=>{const before=snapshot();guards=structuredClone(defaults);changed();commit(before);});
$('#export').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(payload(),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='imperial-guard-calibration.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('#save-status').textContent='配置已导出 · 本地调整仍然保留';});
$('#copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(JSON.stringify(payload(),null,2));$('#save-status').textContent='配置已复制，可以直接粘贴到聊天中';}catch{$('details').open=true;$('#config-output').focus();$('#config-output').select();$('#save-status').textContent='请按 Ctrl+C 复制下方已选中的配置';}});
$('#import-file').addEventListener('change',async event=>{
  const file=event.target.files?.[0];if(!file||!ready)return;
  try{const data=JSON.parse(await file.text());if(!validConfiguration(data))throw new Error('配置需要包含六名卫兵，且排列为 BBAABB、数值在允许范围内。');const before=snapshot();guards=adopt(data);changed();commit(before);$('#save-status').textContent='配置已导入，并保存在此浏览器';}
  catch(error){$('#save-status').textContent=`导入失败：${error.message}`;}finally{event.target.value='';}
});
