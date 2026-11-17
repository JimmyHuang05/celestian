import { newWorldMarker } from '../map-marker-overrides.js'
import {useProjectPlacements} from '../use-project-placements.js'
import {useEffect,useRef,useState} from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './map-placement.css'
import climateLegend from '../map-ui/climate-legend.json'

import {markerIcon} from '../map-markers.js'
import {MAP_ROOT} from '../map-assets.js'
const styleUrl=(meta,style)=>style==='currents'?meta.placementCurrentsUrl:style==='climate'?meta.placementClimateUrl:style==='geo'?(meta.placementImageUrl||meta.compositeImageUrl):meta.compositeImageUrl
const KEY='celestian-placement-new-estra-20cbce0ed04d'
export default function MapPlacementPage({navigation,viewRef}){
 const host=useRef(null),map=useRef(null),group=useRef(null),selected=useRef(null)
 const [rows,setRows]=useState([]),[query,setQuery]=useState(''),[filter,setFilter]=useState('pending'),[error,setError]=useState(''),[choice,setChoice]=useState(null)
 const basemap=useRef(null),basemapMeta=useRef(null)
 const [mapStyle,setMapStyle]=useState('geo')
 const currentStyle=useRef('geo')
 const switchStyle=value=>{currentStyle.current=value;setMapStyle(value);const meta=basemapMeta.current;if(meta&&basemap.current)basemap.current.setUrl(styleUrl(meta,value))}
 const [detail,setDetail]=useState(null)
 const detailClose=useRef(null)
 useEffect(()=>{if(!detail)return;detailClose.current?.focus();const close=e=>{if(e.key==='Escape'){e.preventDefault();setDetail(null)}};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[detail])
 const {entries:positions,status,update}=useProjectPlacements(KEY,setError)
 const place=(id,p)=>{if(p.lat>0||p.lat< -1024||p.lng<0||p.lng>2048)return;update({[id]:[p.lat,p.lng]})}
 useEffect(()=>{let alive=true;const m=L.map(host.current,{crs:L.CRS.Simple,zoomControl:false,attributionControl:false,zoomSnap:0,zoomDelta:.5,minZoom:-3,maxZoom:4});map.current=m;group.current=L.layerGroup().addTo(m);const bounds=[[-1024,0],[0,2048]];m.fitBounds(bounds);if(viewRef?.current)m.setView(viewRef.current.center,viewRef.current.zoom);m.setMaxBounds([[-1200,-200],[200,2248]]);m.on('click',e=>{if(selected.current)place(selected.current,e.latlng)});Promise.all([fetch('/mapplus/manifest.json').then(r=>r.json()),fetch(MAP_ROOT+'/markers.json').then(r=>r.json()),fetch('/mapplus/marker-countries.json').then(r=>{if(!r.ok)throw Error('国家分组加载失败');return r.json()})]).then(([meta,data,countries])=>{if(!alive)return;basemapMeta.current=meta;basemap.current=L.imageOverlay(styleUrl(meta,currentStyle.current),bounds).addTo(m);setRows(data.data.map(newWorldMarker).map(row=>({...row,country:row.country || countries[row.id]?.country || '待确认归属'})))}).catch(e=>setError(e.message));return()=>{alive=false;if(viewRef)viewRef.current={center:m.getCenter(),zoom:m.getZoom()};m.remove();map.current=null}},[])
 useEffect(()=>{if(!group.current)return;group.current.clearLayers();for(const row of rows){const pos=positions[row.id];if(!pos)continue;const marker=L.marker(pos,{draggable:true,icon:L.divIcon({className:'',html:markerIcon(row.type,'#653e28'),iconSize:[28,28],iconAnchor:[14,14]})}).addTo(group.current);marker.bindTooltip(document.createTextNode(row.title),{direction:'top'});marker.on('contextmenu',e=>{L.DomEvent.stop(e.originalEvent);setDetail(row)});marker.on('dragend',()=>place(row.id,marker.getLatLng()));marker.on('click',()=>{selected.current=row.id;setChoice(row.id)})}},[rows,positions])
 const choose=row=>{selected.current=row.id;setChoice(row.id);if(positions[row.id])map.current.panTo(positions[row.id])}
 const exportFile=()=>{const a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify({world:'新埃斯特拉（五）',worldCheck:'b67e7c4b316f',width:2048,height:1024,centralMeridian:31.68515625,markers:rows.filter(r=>positions[r.id]).map(r=>({...r,sourcePosition:{lat:r.lat,lng:r.lng},lat:positions[r.id][0],lng:positions[r.id][1]}))},null,2)],{type:'application/json'}));a.href=url;a.download='新埃斯特拉（五）-地点定位.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 const visible=rows.filter(r=>(r.title+' '+r.type+' '+r.country).toLowerCase().includes(query.trim().toLowerCase())&&(!filter||(filter==='placed')===Boolean(positions[r.id])))
 const countries=[...new Set(visible.map(r=>r.country))].sort((a,b)=>a==='待确认归属'?1:b==='待确认归属'?-1:a.localeCompare(b,'zh-CN'))
 const placed=rows.filter(r=>positions[r.id]).length
 const active=rows.find(r=>r.id===choice)
 return <main className="placement-app">
   <aside className="placement-sidebar">
     <header className="placement-heading">{navigation}<a href="/mapplus/" className="placement-back">← 返回地图</a><span className="placement-eyebrow">CELESTIAN · CARTOGRAPHY</span><h1>地点迁移<span>新埃斯特拉（五）</span></h1><p>将旧世界的故事，安放于新的山海之间。</p></header>
     <section className="placement-progress"><div><span>迁移进度</span><strong>{placed}<small> / {rows.length}</small></strong></div><progress value={placed} max={rows.length||1}/><p role="status">{status}</p></section>
     <div className="placement-filters"><label className="placement-search"><span aria-hidden="true">⌕</span><input aria-label="搜索地点" placeholder="搜索国家、地点或类型" value={query} onChange={e=>setQuery(e.target.value)}/></label><div className="placement-tabs" aria-label="筛选定位状态">{[['pending','待定位',rows.length-placed],['placed','已定位',placed],['','全部',rows.length]].map(([value,label,count])=><button key={value} aria-pressed={filter===value} onClick={()=>setFilter(value)}>{label}<span>{count}</span></button>)}</div></div>
     <div className="placement-list">{error&&<p role="alert">{error}</p>}{countries.map(country=><details className="placement-country" key={country} open><summary><span className="placement-chevron">›</span><span>{country}</span><small>{visible.filter(r=>r.country===country&&positions[r.id]).length} / {visible.filter(r=>r.country===country).length}</small></summary>{visible.filter(r=>r.country===country).map(r=><div className={'placement-card'+(choice===r.id?' is-selected':'')+(positions[r.id]?' is-placed':'')} key={r.id} draggable onContextMenu={e=>{e.preventDefault();e.stopPropagation();setDetail(r)}} onDragStart={e=>{e.dataTransfer.setData('text/plain',r.id);choose(r)}}><span className="placement-grip" aria-hidden="true">⠿</span><button className="placement-place" title="点击选择 · 右键查看详情" onKeyDown={e=>{if(e.key==='ContextMenu'||(e.shiftKey&&e.key==='F10')){e.preventDefault();setDetail(r)}}} onClick={()=>choose(r)}><span className="placement-symbol" aria-hidden="true" dangerouslySetInnerHTML={{__html:markerIcon(r.type,'#cbb58b')}}/><span><strong>{r.title}</strong><small>{r.type}{positions[r.id]?' · 已定位':''}</small></span></button>{positions[r.id]&&<button className="placement-undo" title="撤回到待定位" aria-label={'撤回'+r.title} onClick={()=>update({[r.id]:null})}>↶</button>}</div>)}</details>)}{!visible.length&&<p className="placement-empty">没有符合条件的地点</p>}</div>
     <footer className="placement-footer"><button onClick={exportFile}>↓ 导出定位结果</button><span>右键地点查看详情 · <a href="/mapplus/text" style={{color:'#cbb58b'}}>文字迁移 →</a></span></footer>
   </aside>
   <section className="placement-workspace"><div ref={host} className="placement-map" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const id=e.dataTransfer.getData('text/plain');if(rows.some(r=>r.id===id))place(id,map.current.mouseEventToLatLng(e.nativeEvent))}}/>
     <div className="placement-map-title"><span>新埃斯特拉（五）</span><small>地点迁移工作台</small></div>
     <div className="placement-style-switch" aria-label="底图样式">{[['geo','地形图'],['fantasy','手绘图'],['climate','气候图'],['currents','洋流图']].map(([value,label])=><button key={value} aria-pressed={mapStyle===value} onClick={()=>switchStyle(value)}>{label}</button>)}</div>
     {mapStyle==='currents'&&<details className="placement-climate-legend" open><summary>洋流图例</summary><div><span><i style={{background:'#945d49'}}/>偏暖流</span><span><i style={{background:'#5a7784'}}/>偏冷流</span><span><i style={{background:'#777b70'}}/>温差不明显</span></div><p>沿存档流场绘制；颜色依据模型海温偏差，箭头表示流向。</p></details>}
     {mapStyle==='climate'&&<details className="placement-climate-legend" open><summary>气候分类图例</summary><div>{climateLegend.map(c=><span key={c.code}><i style={{background:c.color}}/>{c.code} · {c.name}</span>)}</div><p>Civ Atlas 依据年均温、年降水估算的气候分类。</p></details>}
     <div className="placement-map-tools"><button aria-label="放大地图" onClick={()=>map.current.zoomIn()}>＋</button><button aria-label="缩小地图" onClick={()=>map.current.zoomOut()}>−</button><button aria-label="查看全图" onClick={()=>map.current.fitBounds([[-1024,0],[0,2048]])}>⊞</button></div>
     <div className="placement-hint">{active?<><span className="placement-hint-dot"/><span><strong>{active.title}</strong><small>点击地图放置 · 拖动标记微调</small></span><button aria-label="取消选择" onClick={()=>{selected.current=null;setChoice(null)}}>×</button></>:<><span aria-hidden="true">◇</span><span>从左侧拖入地点<small>也可先选择地点，再点击地图定位</small></span></>}</div>
     {detail&&<aside className="placement-detail" role="dialog" aria-modal="false" aria-labelledby="placement-detail-title" onContextMenu={e=>e.stopPropagation()}><header><span>地点档案 · {detail.type||'地点'}</span><button ref={detailClose} aria-label="关闭地点详情" onClick={()=>setDetail(null)}>×</button></header><div className="placement-detail-scroll" key={detail.id}><h2 id="placement-detail-title">{detail.title}</h2>{detail.foreign_title&&<p className="placement-detail-foreign">{detail.foreign_title}</p>}<div className="placement-detail-meta"><span>{detail.country}</span><span>{positions[detail.id]?'已定位':'待定位'}</span></div><p className="placement-detail-description">{detail.description||'暂无地点介绍。'}</p></div><footer><button onClick={()=>{choose(detail);setDetail(null)}}>{positions[detail.id]?'在地图上查看':'选择此地点进行定位'}</button></footer></aside>}
   </section>
 </main>
}
