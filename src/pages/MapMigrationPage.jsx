import {useRef} from 'react'
import {useSearchParams} from 'react-router-dom'
import MapPlacementPage from './MapPlacementPage.jsx'
import MapTextPlacementPage from './MapTextPlacementPage.jsx'
import MapWonderPlacementPage from './MapWonderPlacementPage.jsx'
import {archiveLocalPlacements} from '../map-placement-archive.js'
import {MAPPLUS_WONDERS_ENABLED} from '../map-landmarks.js'

const tabs = {
 places: {title: '地点', Page: MapPlacementPage},
 text: {title: '文字', Page: MapTextPlacementPage},
 ...(MAPPLUS_WONDERS_ENABLED ? {wonders: {title: '奇观', Page: MapWonderPlacementPage}} : {}),
}

export default function MapMigrationPage(){
 const [params,setParams]=useSearchParams(),viewRef=useRef(null)
 const tab=Object.hasOwn(tabs,params.get('tab'))?params.get('tab'):'places'
 const navigation=<nav className="migration-navigation" aria-label="迁移类型">{Object.entries(tabs).map(([id,{title}])=><button key={id} aria-pressed={tab===id} onClick={()=>{archiveLocalPlacements().catch(console.error);setParams({tab:id})}}>{title}</button>)}</nav>
 const {Page}=tabs[tab]
 return <Page key={tab} navigation={navigation} viewRef={viewRef}/>
}
