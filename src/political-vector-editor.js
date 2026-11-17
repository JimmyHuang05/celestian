import L from 'leaflet'
import {regionColor} from './region-color.js'
import {countryProfiles} from './political-country-profiles.js'
import {politicalPublisher} from './political-live.js'
import {countryIdentities} from './map-country-display.js'
import {countryCultureProfile} from './mapplus-culture.js'
import {preparePoliticalCoast,snapOceanNode,rebuildCoastalRegions as rebuildRegions} from './political-coast.js'
import {emptyDraft,validateDraft,vectorSVG} from './political-vector.js'
import {initializeGraph,splitGraphEdge,removeGraphNode,removeGraphLine} from './political-region-graph.js'
import {installPollutionEditor} from './map-pollution.js'

export async function installVectorEditor(map,svg,countries,getSelected,onUpdate){
 await preparePoliticalCoast()
 const panel=document.createElement('section');panel.id='vector-editor';panel.className='studio-card'
 panel.innerHTML=`
   <div class="flex items-center justify-between mb-2">
     <h2 class="text-xs font-serif-sc font-bold text-gray-900 flex items-center gap-1.5">
       <i data-lucide="pen-tool" class="w-3.5 h-3.5 text-[#9a7442]"></i> 矢量折线与拓扑闭合
     </h2>
     <span class="text-[10px] px-2 py-0.5 rounded-full bg-[#d4b58e]/15 text-[#845e2c] border border-[#d4b58e]/30 font-mono font-bold">GPT 核心</span>
   </div>
   <div class="bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5 text-[11px] font-serif-sc text-amber-900 leading-relaxed mb-3 space-y-1">
     <div>• <b>左键连线</b>：空白放新点，点击已有节点自动识别闭合区域并编号。</div>
     <div>• <b>右键删改</b>：右键节点删除点，右键连线删除整段分界线并合并区域。</div>
     <div>• <b>快捷操作</b>：中键拖拽地图，Esc 中断当前连线。</div>
   </div>
   <div class="grid grid-cols-3 gap-1.5 mb-2">
     <button id="vector-undo" class="px-2 py-1.5 rounded-lg text-xs font-serif-sc font-medium bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1">
       <i data-lucide="undo" class="w-3 h-3"></i> 撤销
     </button>
     <button id="vector-redo" class="px-2 py-1.5 rounded-lg text-xs font-serif-sc font-medium bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1">
       <i data-lucide="redo" class="w-3 h-3"></i> 重做
     </button>
     <button id="vector-save" class="px-2 py-1.5 rounded-lg text-xs font-serif-sc font-bold btn-gold shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1">
       <i data-lucide="save" class="w-3 h-3"></i> 保存
     </button>
   </div>
   <div class="grid grid-cols-2 gap-1.5 mb-2.5">
     <button id="vector-export" class="px-2 py-1.5 rounded-lg text-xs font-serif-sc font-bold bg-[#9a7442]/10 hover:bg-[#9a7442]/20 text-[#845e2c] border border-[#d4b58e]/40 shadow-xs transition-all flex items-center justify-center gap-1">
       <i data-lucide="download" class="w-3.5 h-3.5"></i> 导出 SVG
     </button>
     <label class="cursor-pointer px-2 py-1.5 rounded-lg text-xs font-serif-sc font-medium bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-xs transition-all flex items-center justify-center gap-1">
       <i data-lucide="upload" class="w-3.5 h-3.5 text-gray-500"></i>
       <span>导入 SVG</span>
       <input id="vector-import" type="file" accept=".svg" class="hidden">
     </label>
   </div>
   <div id="vector-status" role="status" class="px-2.5 py-1.5 rounded-lg bg-white border border-gray-200/80 text-[11px] font-mono text-gray-600 flex items-center gap-1.5 leading-normal shadow-xs">
   </div>
 `
 document.querySelector('#countries').before(panel)
 document.querySelector('#countries').style.display='none'
 document.querySelector('#detail').style.display='none'
 document.querySelector('#clear').hidden=true
 const status=panel.querySelector('#vector-status'),say=t=>status.textContent=t
 const response=await fetch('/__political-vector')
 let token,revision,raw
 if(response.ok&&response.headers.get('content-type')?.includes('json')){const data=await response.json();raw=data.draft;token=data.token;revision=data.revision}
 else{const r=await fetch('/mapplus/political-study-v2/vector-draft.json');raw=r.ok?await r.json():emptyDraft();panel.querySelector('#vector-save').disabled=true}
 const ids=new Set(countries.map(c=>c.region_id))
 if(!validateDraft(raw,ids))throw Error('区域数据无效')
 let draft=initializeGraph(raw),saved=JSON.stringify(draft),history=[],future=[],gesture=null,publisher,lastPublished=''
 // Register metadata only; opening this editor must not assign any regions.
 draft.countries||=[]
 for(const [title,identity] of Object.entries(countryIdentities)){
  if(!draft.countries.some(c=>c.title===title||c.region_id===identity.region_id))draft.countries.push({...identity,title})
 }
 const beforeCoastRepair=JSON.stringify(draft);let repaired=0
 for(const [id,p] of Object.entries(draft.nodes)){if(id.startsWith('vshore-'))continue;const q=snapOceanNode(p);if(Math.hypot(q[0]-p[0],q[1]-p[1])>1e-6){draft.nodes[id]=q;repaired++}}
 if(repaired)history.push(beforeCoastRepair)
 rebuildRegions(draft)
 const controls=L.layerGroup().addTo(map),container=map.getContainer(),lat=p=>[-p[1],p[0]],clone=()=>JSON.stringify(draft)
 const checkpoint=()=>{history.push(clone());if(history.length>80)history.shift();future=[]}
 const profiles=await countryProfiles(countries)
 const catalog=()=>[...new Map([
  ...countries.filter(c=>!c.draftName&&!profiles.some(p=>p.region_id===c.region_id)),
  ...profiles,...(draft.countries||[]),
 ].map(countryCultureProfile).map(c=>[c.group_id||c.title,c])).values()]
 const ownership=document.createElement('section');ownership.id='country-assignment';ownership.className='studio-card'
 ownership.innerHTML=`
   <div class="flex items-center justify-between mb-1.5">
     <h2 class="text-xs font-serif-sc font-bold text-gray-900 flex items-center gap-1.5">
       <i data-lucide="crown" class="w-3.5 h-3.5 text-[#9a7442]"></i> 分配国家主权 (29+ 国)
     </h2>
     <span class="text-[10px] text-gray-400 font-mono">拖拽着色</span>
   </div>
   <p class="text-[11px] font-serif-sc text-gray-500 mb-2.5 leading-relaxed">
     把国家拖到区域上即可分配；同一国家可拖给多个区域。拖入“取消归属”可恢复独立区域颜色。
   </p>
   <div id="country-cards" class="space-y-1 max-h-64 overflow-y-auto pr-1"></div>
   <details class="mt-2.5 pt-2 border-t border-gray-200 text-xs font-serif-sc group">
     <summary class="cursor-pointer text-xs font-bold text-[#9a7442] hover:text-[#845e2c] flex items-center gap-1 select-none py-1">
       <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i> 新建国家
     </summary>
     <form id="country-create" class="mt-2 space-y-2 p-2.5 bg-white border border-gray-200 rounded-xl shadow-xs">
       <div>
         <label class="block text-[11px] text-gray-500 mb-1">名称</label>
         <input name="title" required maxlength="80" placeholder="例如：新维斯廷公国" class="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#d4b58e] focus:ring-2 focus:ring-[#d4b58e]/20">
       </div>
       <div>
         <label class="block text-[11px] text-gray-500 mb-1">颜色</label>
         <div class="flex items-center gap-2">
           <input name="color" type="color" value="#547c98" class="w-8 h-8 rounded-lg cursor-pointer border border-gray-200 p-0.5">
           <span class="text-[11px] text-gray-400 font-mono">点击选择主权色彩</span>
         </div>
       </div>
       <div>
         <label class="block text-[11px] text-gray-500 mb-1">简介</label>
         <textarea name="description" maxlength="5000" rows="2" placeholder="国家历史或地理设定..." class="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#d4b58e] focus:ring-2 focus:ring-[#d4b58e]/20"></textarea>
       </div>
       <button type="submit" class="w-full py-1.5 rounded-lg text-xs font-serif-sc font-bold btn-gold shadow-sm flex items-center justify-center gap-1">
         <i data-lucide="check" class="w-3.5 h-3.5"></i> 创建国家
       </button>
     </form>
   </details>
 `
 panel.after(ownership)
 if(window.lucide)lucide.createIcons()
 let cardSignature='',dragCountry=null,selectedCountry=null
 function renderCardHighlights(){
  const list=ownership.querySelector('#country-cards')
  if(!list)return
  list.querySelectorAll('button[data-country-id]').forEach(btn=>{
   const isSel=btn.dataset.countryId===(selectedCountry||'')
   if(isSel){
    btn.classList.add('ring-2','ring-[#d4b58e]','bg-[#d4b58e]/20','border-[#d4b58e]')
   }else{
    btn.classList.remove('ring-2','ring-[#d4b58e]','bg-[#d4b58e]/20','border-[#d4b58e]')
   }
  })
 }
 function renderCards(){
  const rows=catalog(),signature=JSON.stringify([rows,draft.rings.map(r=>[r.regionNumber,r.country,r.hole])]);if(signature===cardSignature)return;cardSignature=signature
  const list=ownership.querySelector('#country-cards');list.replaceChildren()
  for(const c of [...rows,{region_id:'',title:'取消归属',politicalColor:'#94a3b8'}]){
   const card=document.createElement('button');card.type='button';card.draggable=true;card.dataset.countryId=c.region_id;card.style.cursor='grab'
   card.className='w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#d4b58e]/10 border border-gray-200 hover:border-[#d4b58e]/50 text-gray-800 text-xs font-serif-sc text-left transition-all shadow-xs cursor-grab active:cursor-grabbing select-none'
   if(!c.region_id){
     card.className='w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 border border-dashed border-gray-300 text-gray-500 text-xs font-serif-sc text-left transition-all shadow-xs cursor-grab active:cursor-grabbing select-none'
   }
   const swatch=document.createElement('i');swatch.className='w-3 h-3 rounded-full shrink-0 shadow-xs border border-white/80';swatch.style.background=c.politicalColor
   const count=draft.rings.filter(r=>!r.hole&&r.country===c.region_id).length
   const label=document.createElement('span');label.className='font-medium truncate flex-1';label.textContent=c.group_id||c.title
   card.append(swatch,label)
   if(c.region_id){
     const badge=document.createElement('span');badge.className='text-[10px] font-mono px-1.5 py-0.2 rounded bg-gray-100 text-gray-600 shrink-0';badge.textContent=`${count} 区域`
     card.append(badge)
   }
   card.onclick=()=>{
     if(selectedCountry===(c.region_id||'unassigned')){
       selectedCountry=null
       say('已取消选中国家')
     }else{
       selectedCountry=c.region_id||'unassigned'
       say(`已选中「${c.group_id||c.title}」，可直接点击地图闭合区域分配，或继续拖拽`)
     }
     renderCardHighlights()
   }
   card.ondragstart=e=>{
     dragCountry=c.region_id||'unassigned'
     try{
       e.dataTransfer.setData('text/plain',c.region_id||'unassigned')
       e.dataTransfer.setData('application/x-celestian-country',c.region_id||'unassigned')
     }catch(_){}
     e.dataTransfer.effectAllowed='copy'
   }
   card.ondragend=()=>{
     setTimeout(()=>{dragCountry=null},100)
   }
   list.append(card)
  }
  if(window.lucide)lucide.createIcons()
  renderCardHighlights()
 }
 ownership.querySelector('form').onsubmit=e=>{
  e.preventDefault();const form=e.currentTarget,title=form.elements.title.value.trim();if(!title)return
  if(catalog().some(c=>c.title===title||c.group_id===title)){say('已有同名国家，请直接拖拽已有国家');return}
  if((draft.countries||[]).length>=200){say('新建国家数量已达上限');return}
  checkpoint();(draft.countries||=[]).push({region_id:'custom-'+crypto.randomUUID(),title,politicalColor:form.elements.color.value,description:form.elements.description.value.trim()});draw();form.reset();say('国家已创建，可拖到一个或多个区域上')
 }
 function dropRegion(e){
  const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY
  const matrix=svg.getScreenCTM();if(!matrix)return null
  const local=p.matrixTransform(matrix.inverse())
  return Array.from(svg.querySelectorAll('path[data-region-id]')).reverse().find(path=>path.isPointInFill(local))?.dataset.regionId
 }
 container.addEventListener('dragover',e=>{
   if(dragCountry!==null||selectedCountry!==null||Array.from(e.dataTransfer?.types||[]).includes('application/x-celestian-country')||Array.from(e.dataTransfer?.types||[]).includes('text/plain')){
     e.preventDefault()
     if(e.dataTransfer)e.dataTransfer.dropEffect='copy'
   }
 })
 container.addEventListener('drop',e=>{
  e.preventDefault();e.stopPropagation()
  let value=''
  try{
    value=e.dataTransfer.getData('application/x-celestian-country')||e.dataTransfer.getData('text/plain')
  }catch(_){}
  if(!value)value=dragCountry||selectedCountry
  if(!value)return
  const country=value==='unassigned'?null:value
  if(country&&!catalog().some(c=>c.region_id===country))return
  const id=dropRegion(e);if(!id){say('请把国家拖到已闭合区域内');return}
  const number=Number(id.replace('region-','')),rings=draft.rings.filter(r=>r.regionNumber===number)
  if(!rings.length){say('未找到对应区域');return}
  if(rings.every(r=>r.country===country)){
    say(country?'该区域已属于该国家':'该区域已是无归属状态')
    return
  }
  checkpoint();for(const r of rings)r.country=country;draw()
  const cObj=catalog().find(c=>c.region_id===country)
  say(country?`已将区域 ${number} 分配给「${cObj?.group_id||cObj?.title||country}」`:`已取消区域 ${number} 的国家归属`)
 })
 map.dragging.disable();map.doubleClickZoom.disable();map.boxZoom.disable()
 function renderSource(){
  const rows=draft.rings.filter(r=>!r.hole).map(r=>({region_id:'region-'+r.regionNumber,title:'区域 '+String(r.regionNumber).padStart(3,'0'),politicalColor:catalog().find(c=>c.region_id===r.country)?.politicalColor||regionColor(r.regionNumber)}))
  return vectorSVG({...draft,rings:draft.rings.map(r=>({...r,country:'region-'+r.regionNumber}))},rows)
 }
 function draw(){
  renderCards()
  const parsed=new DOMParser().parseFromString(renderSource(),'image/svg+xml').documentElement;svg.replaceChildren(...Array.from(parsed.childNodes))
  if(!document.querySelector('#fill').checked)svg.querySelectorAll('path').forEach(p=>p.style.fillOpacity='0')
  controls.clearLayers()
  L.polyline((draft.displayEdges||draft.edges).map(([a,b])=>[lat(draft.nodes[a]),lat(draft.nodes[b])]),{color:'#6e7771',weight:1,opacity:.55,interactive:false}).addTo(controls)
  const visible=map.getBounds().pad(.1)
  for(const [id,p] of Object.entries(draft.nodes))if(!id.startsWith('vshore-')&&!draft.derivedNodes?.includes(id)&&visible.contains(lat(p)))L.circleMarker(lat(p),{radius:id===draft.activeNode?5:3.5,color:'#fff',weight:1,fillColor:id===draft.activeNode?'#c34b3d':'#315b70',fillOpacity:1,interactive:false}).addTo(controls)
  for(const r of draft.rings.filter(r=>!r.hole)){
   const pts=r.nodes.map(n=>draft.nodes[n]),center=pts.reduce((a,p)=>[a[0]+p[0]/pts.length,a[1]+p[1]/pts.length],[0,0])
   const country=catalog().find(c=>c.region_id===r.country),label=document.createElement('span')
   label.textContent=country?(country.group_id||country.title):'区域 '+String(r.regionNumber).padStart(3,'0')
   L.marker(lat(center),{interactive:false,icon:L.divIcon({className:'state-label',html:label,iconSize:[90,20],iconAnchor:[45,10]})}).addTo(controls)
  }
  panel.querySelector('#vector-undo').disabled=!history.length;panel.querySelector('#vector-redo').disabled=!future.length
  const value=clone();if(publisher&&value!==lastPublished){lastPublished=value;publisher.update()}
  say('已识别 '+draft.rings.filter(r=>!r.hole).length+' 个闭合区域'+(value===saved?' · 已保存':' · 未保存')+(repaired?' · 已修正 '+repaired+' 个旧海上节点（可撤销）':''))
 }
 const point=e=>{const p=map.mouseEventToLatLng(e);return [Math.max(0,Math.min(2048,p.lng)),Math.max(0,Math.min(1024,-p.lat))]}
 document.querySelector('#fill').onchange=draw
 function hit(p,exclude){
  const screen=map.latLngToContainerPoint(lat(p));let target=null,distance=9
  for(const [id,q] of Object.entries(draft.nodes)){if(id===exclude||id.startsWith('vshore-')||draft.derivedNodes?.includes(id))continue;const v=screen.distanceTo(map.latLngToContainerPoint(lat(q)));if(v<distance){target={id,p:q};distance=v}}
  if(target)return target
  for(const route of draft.edgeRoutes||draft.edges.map(([a,b])=>({a,b,points:[draft.nodes[a],draft.nodes[b]]}))){
   const {a,b,points}=route;if(a===exclude||b===exclude)continue
   for(let i=1;i<points.length;i++){const x=map.latLngToContainerPoint(lat(points[i-1])),y=map.latLngToContainerPoint(lat(points[i])),dx=y.x-x.x,dy=y.y-x.y,len=dx*dx+dy*dy;if(!len)continue;const t=Math.max(0,Math.min(1,((screen.x-x.x)*dx+(screen.y-x.y)*dy)/len)),q=L.point(x.x+t*dx,x.y+t*dy),v=q.distanceTo(screen);if(v<distance){const ll=map.containerPointToLatLng(q);target={a,b,p:[ll.lng,-ll.lat]};distance=v}}
  }
  return target
 }
 function down(e){
  if(e.target.closest('.leaflet-control')||![0,1,2].includes(e.button))return
  e.preventDefault();e.stopPropagation()
  let p=point(e),target=hit(p)
  if(e.button===0&&!target?.id){
   const snapped=snapOceanNode(p)
   if(snapped!==p){p=snapped;target=hit(p)}
  }
  if(e.button===0&&selectedCountry&&!target?.id&&!target?.a){
   const id=dropRegion(e)
   if(id){
    const country=selectedCountry==='unassigned'?null:selectedCountry
    if(!country||catalog().some(c=>c.region_id===country)){
     const number=Number(id.replace('region-','')),rings=draft.rings.filter(r=>r.regionNumber===number)
     if(rings.length){
      checkpoint();for(const r of rings)r.country=country;draw()
      const cObj=catalog().find(c=>c.region_id===country)
      say(country?`已将区域 ${number} 分配给「${cObj?.group_id||cObj?.title||country}」`:`已取消区域 ${number} 的国家归属`)
      return
     }
    }
   }
  }
  if(e.button===2){
   if(target?.id){checkpoint();removeGraphNode(draft,target.id);rebuildRegions(draft);draw()}
   else if(target?.a&&draft.edges.some(e=>e.includes(target.a)&&e.includes(target.b))){checkpoint();removeGraphLine(draft,target.a,target.b);rebuildRegions(draft);draw()}
   return
  }
  let inserted=false
  if(e.button===0&&target?.a){
   checkpoint();const id='v'+crypto.randomUUID()
   splitGraphEdge(draft,target.a,target.b,id,target.p)
   target={id,p:target.p};inserted=true;rebuildRegions(draft);draw()
  }
  gesture={button:e.button,start:[e.clientX,e.clientY],last:[e.clientX,e.clientY],target,p,moved:false,inserted}
 }
 function move(e){
  if(!gesture)return
  const g=gesture,dx=e.clientX-g.last[0],dy=e.clientY-g.last[1]
  if(g.button===1){map.panBy([-dx,-dy],{animate:false});g.last=[e.clientX,e.clientY];return}
  if(!g.target?.id)return
  if(!g.moved&&Math.hypot(e.clientX-g.start[0],e.clientY-g.start[1])>3){if(!g.inserted)checkpoint();g.moved=true}
  if(g.moved){draft.nodes[g.target.id]=snapOceanNode(point(e));draw()}
 }
 function up(e){
  if(!gesture||e.button!==gesture.button)return
  const g=gesture;gesture=null
  if(g.button===1)return
  if(g.moved){
   const id=g.target.id,q=draft.nodes[id],target=hit(q,id)
   if(target?.id)draft.nodes[id]=[...draft.nodes[target.id]]
   else if(target?.a&&target.a!==id&&target.b!==id)splitGraphEdge(draft,target.a,target.b,id,target.p)
   rebuildRegions(draft);draw();return
  }
  if(g.target?.id&&!g.inserted){
   const active=draft.activeNode
   if(draft.drawing&&active&&active!==g.target.id){
    checkpoint();draft.edges.push([active,g.target.id]);draft.activeNode=null;draft.drawing=false;rebuildRegions(draft)
   }else if(!draft.drawing){draft.activeNode=g.target.id;draft.drawing=draft.edges.filter(edge=>edge.includes(g.target.id)).length<=1}
   draw();return
  }
  if(g.inserted){
   const active=draft.activeNode
   const before=draft.rings.filter(r=>!r.hole).length
   if(draft.drawing&&active&&active!==g.target.id)draft.edges.push([active,g.target.id])
   draft.activeNode=g.target.id;rebuildRegions(draft)
   if(draft.drawing||draft.rings.filter(r=>!r.hole).length>before){draft.activeNode=null;draft.drawing=false}
   draw();return
  }
  checkpoint()
  let id=g.target?.id
  if(!id){id='v'+crypto.randomUUID();if(g.target?.a)splitGraphEdge(draft,g.target.a,g.target.b,id,g.target.p);else draft.nodes[id]=g.p}
  const active=draft.activeNode,before=draft.rings.filter(r=>!r.hole).length
  if(active&&active!==id)draft.edges.push([active,id])
  draft.activeNode=id;draft.drawing=true;rebuildRegions(draft)
  if(draft.rings.filter(r=>!r.hole).length>before){draft.activeNode=null;draft.drawing=false}
  draw()
 }
 if(import.meta.env.DEV) installPollutionEditor(L, map, [[-1024,0],[0,2048]], svg, () => {
  const assigned = new Set(draft.rings.filter(r => !r.hole).map(r => r.country))
  return catalog().filter(row => assigned.has(row.region_id))
 }, rows => new DOMParser().parseFromString(vectorSVG(draft,rows),'image/svg+xml').documentElement)
 container.addEventListener('mousedown',down,true);window.addEventListener('mousemove',move);window.addEventListener('mouseup',up)
 const context=e=>e.preventDefault();container.addEventListener('contextmenu',context)
 const key=e=>{if(e.key==='Escape'){draft.activeNode=null;draft.drawing=false;if(selectedCountry){selectedCountry=null;renderCardHighlights();say('已取消选中国家')}draw()}}
 window.addEventListener('keydown',key);map.on('moveend',draw)
 for(const name of ['undo','redo'])panel.querySelector('#vector-'+name).onclick=()=>{const from=name==='undo'?history:future,to=name==='undo'?future:history;if(!from.length)return;to.push(clone());draft=JSON.parse(from.pop());draw()}
 panel.querySelector('#vector-save').onclick=async()=>{const data=clone();try{const r=await fetch('/__political-vector',{method:'PUT',headers:{'Content-Type':'application/json','X-Political-Token':token},body:JSON.stringify({draft,revision})}),result=await r.json();if(!r.ok)throw Error(result.error);revision=result.revision;saved=data;draw()}catch(e){say(e.message)}}
 panel.querySelector('#vector-export').onclick=()=>{const doc=new DOMParser().parseFromString(renderSource(),'image/svg+xml'),meta=doc.createElementNS('http://www.w3.org/2000/svg','metadata');meta.id='celestian-vector';meta.textContent=clone();doc.documentElement.prepend(meta);const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(doc)],{type:'image/svg+xml'})),a=document.createElement('a');a.href=url;a.download='celestian-regions.svg';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 panel.querySelector('#vector-import').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;const doc=new DOMParser().parseFromString(await file.text(),'image/svg+xml'),meta=doc.querySelector('#celestian-vector');if(!meta)throw Error('请导入包含区域数据的工作台 SVG');const next=JSON.parse(meta.textContent);if(!validateDraft(next,ids))throw Error('区域数据无效');checkpoint();draft=rebuildRegions(initializeGraph(next));draw()}catch(error){say(error.message)}finally{e.target.value=''}}
 window.addEventListener('beforeunload',e=>{if(clone()!==saved){e.preventDefault();e.returnValue=''}})
 publisher=politicalPublisher(()=>draft);draw()
 window.addEventListener('pagehide',()=>{publisher.destroy();window.removeEventListener('mousemove',move);window.removeEventListener('mouseup',up);window.removeEventListener('keydown',key)},{once:true})
 return {get draft(){return draft}}
}
