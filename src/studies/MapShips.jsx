import {useEffect,useRef,useState} from 'react'
import L from 'leaflet'
import {anchorWorldMarker} from '../map-stable-svg.js'
import './map-ships.css'
const assetUrl=n=>`/map-ships/ship-${String(n).padStart(2,'0')}.webp`
export default function MapShips({viewer,editing=false}){
 const [collapsed,setCollapsed]=useState(false)
 const [ships,setShips]=useState([]),[selected,setSelected]=useState(''),[asset,setAsset]=useState(14),[adding,setAdding]=useState(false),[status,setStatus]=useState('正在载入船只…'),[ready,setReady]=useState(false)
 const state=useRef({ships:[],dirty:false,busy:false,revision:null,token:null,blocked:false,alive:true}),markers=useRef(new Map())
 useEffect(()=>{
  const s=state.current;s.alive=true
  async function refresh(){if(s.dirty||s.busy)return;try{const r=await fetch(editing?'/__map-ships':'/map-ships/placements.json',{cache:import.meta.env.DEV?'no-store':'default'});if(!r.ok)throw Error('船只读取失败');const d=await r.json();if(!s.alive||s.dirty||s.busy)return;s.revision=d.revision;s.token=d.token;if(JSON.stringify(s.ships)!==JSON.stringify(d.ships)){s.ships=d.ships;setShips(d.ships)}setReady(true);setStatus('已保存到项目')}catch(e){if(s.alive)setStatus(e.message)}}
  async function save(){if(!editing||!s.dirty||s.busy||s.blocked||!s.token)return;s.busy=true;const snapshot=s.ships;try{const r=await fetch('/__map-ships',{method:'PUT',headers:{'Content-Type':'application/json','X-Ship-Token':s.token},body:JSON.stringify({version:1,ships:snapshot,revision:s.revision})});const d=await r.json();if(!r.ok){if(r.status===409||r.status===403)s.blocked=true;throw Error(d.error||'保存失败')}s.revision=d.revision;s.dirty=s.ships!==snapshot;if(s.alive)setStatus(s.dirty?'正在保存…':'已保存到项目 · 地图已同步')}catch(e){if(s.alive)setStatus(e.message)}finally{s.busy=false}}
  const tick=()=>{if(s.dirty)void save();else void refresh()};void refresh();const timer=import.meta.env.DEV?setInterval(tick,600):null;const notify=()=>void refresh();import.meta.hot?.on('map-ships-updated',notify)
  return()=>{s.alive=false;clearInterval(timer);import.meta.hot?.off('map-ships-updated',notify)}
 },[editing])
 function commit(next){const s=state.current;if(s.blocked)return;s.ships=next;s.dirty=true;setShips(next);setStatus('正在保存…')}
 function update(id,values){commit(state.current.ships.map(s=>s.id===id?{...s,...values}:s))}
 useEffect(()=>{
  if(!viewer)return
  const {map,bounds}=viewer,pane=map.getPane('mapShips')||map.createPane('mapShips');pane.style.zIndex='470';pane.style.pointerEvents=editing?'auto':'none'
  const ll=s=>[bounds.getNorth()-s.y*(bounds.getNorth()-bounds.getSouth()),bounds.getWest()+s.x*(bounds.getEast()-bounds.getWest())]
  const xy=p=>({x:Math.max(0,Math.min(1,(p.lng-bounds.getWest())/(bounds.getEast()-bounds.getWest()))),y:Math.max(0,Math.min(1,(bounds.getNorth()-p.lat)/(bounds.getNorth()-bounds.getSouth())))})
  let dragging=false
  const size=(s,z=map.getZoom())=>Math.abs(map.project(bounds.getSouthEast(),z).x-map.project(bounds.getNorthWest(),z).x)*s.width/21600
  const icon=s=>{const px=size(s);return L.divIcon({className:'map-ship'+(s.id===selected&&editing?' is-selected':''),html:`<img draggable="false" src="${assetUrl(s.asset)}" alt="船只 ${s.asset}">`,iconSize:[px,px],iconAnchor:[px/2,px/2]})}
  for(const s of ships){const marker=L.marker(ll(s),{pane:'mapShips',icon:icon(s),draggable:editing,interactive:editing,keyboard:editing,bubblingMouseEvents:false});anchorWorldMarker(map,marker,z=>size(s,z));markers.current.set(s.id,marker);if(editing){marker.on('click',e=>{L.DomEvent.stop(e.originalEvent);setSelected(s.id);setAdding(false)});marker.on('dragstart',()=>{dragging=true});marker.on('dragend',()=>{update(s.id,xy(marker.getLatLng()));setSelected(s.id);setTimeout(()=>{dragging=false},0)})}}
  const syncShips=()=>{
   const view=map.getBounds().pad(.1),worldWidth=bounds.getEast()-bounds.getWest()
   for(const s of ships){
    const marker=markers.current.get(s.id);if(!marker)continue
    const [lat,lng]=ll(s),half=worldWidth*s.width/21600/2
    const visible=editing||view.intersects(L.latLngBounds([[lat-half,lng-half],[lat+half,lng+half]]))
    if(visible&&!map.hasLayer(marker))marker.addTo(map)
    else if(!visible&&map.hasLayer(marker))marker.remove()
   }
  }
  syncShips();map.on('moveend zoomend resize',syncShips)
  const click=e=>{if(!editing||!adding||!ready||dragging||state.current.blocked||!asset||state.current.ships.some(s=>s.asset===asset))return;const p=xy(e.latlng),id=crypto.randomUUID();commit([...state.current.ships,{id,asset,...p,width:550}]);setSelected(id);setAdding(false)};map.on('click',click)
  return()=>{map.off('click',click);map.off('moveend zoomend resize',syncShips);for(const m of markers.current.values())m.remove();markers.current.clear()}
 },[viewer,ships,selected,editing,adding,asset,ready])
 const available=Array.from({length:23},(_,i)=>i+1).filter(n=>!ships.some(s=>s.asset===n))
 useEffect(()=>{if(!available.includes(asset)){setAsset(available[0]??0);setAdding(false)}},[ships,asset])
 const current=ships.find(s=>s.id===selected)
 if(!editing)return null
 return <aside className={`ship-editor${collapsed?' is-collapsed':''}`} aria-label="船只摆放编辑"><header className="ship-editor-heading"><h2>船只摆放</h2><button aria-expanded={!collapsed} aria-controls="ship-editor-body" aria-label={collapsed?'展开船只面板':'收起船只面板'} onClick={()=>setCollapsed(v=>!v)}>{collapsed?'展开':'收起'}</button></header><div id="ship-editor-body" hidden={collapsed}><div className="ship-picker">{available.map(n=><button key={n} className={asset===n?'chosen':''} onClick={()=>setAsset(n)} aria-label={`选择船只 ${n}`}><img src={assetUrl(n)} loading="lazy" alt=""/><span>{String(n).padStart(2,'0')}</span></button>)}</div>{available.length===0&&<p>全部船型均已摆放</p>}<button disabled={!ready||state.current.blocked||!available.includes(asset)||ships.length>=200} onClick={()=>setAdding(!adding)}>{adding?'取消放置':'添加所选船只'}</button><p>{adding?'点击地图放置船只':'点击船只选中，拖动调整位置'}</p>{current&&<><label>大小 · {current.width}<input aria-label="船只大小" type="range" min="40" max="2000" step="10" value={current.width} onChange={e=>update(current.id,{width:Number(e.target.value)})}/></label><button disabled={!available.includes(asset)} onClick={()=>update(current.id,{asset})}>替换为所选船型</button><button onClick={()=>{commit(state.current.ships.filter(s=>s.id!==selected));setSelected('')}}>删除这艘</button></>}<p role="status">{status}</p><a href="/mapplus/" target="_blank" rel="noreferrer">打开地图查看</a></div></aside>
}
