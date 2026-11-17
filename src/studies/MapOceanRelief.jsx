import {useEffect} from 'react'
import L from 'leaflet'
import {stableImageOverlay} from '../map-stable-svg.js'

export default function MapOceanRelief({viewer,enabled=true}){
 useEffect(()=>{
  if(!viewer||!enabled)return
  const {map,bounds}=viewer
  const pane=map.getPane('mapOceanRelief')||map.createPane('mapOceanRelief')
  pane.style.zIndex='201';pane.style.pointerEvents='none';pane.style.mixBlendMode='normal'
  // Warm parchment depth bands with restrained shallow highlights, below coast ink.
  // Normal compositing avoids muddy multiply shadows. The mask and palette are
  // baked once; zoom uses the same camera as the terrain.
  const image=document.createElement('img')
  image.alt='';image.setAttribute('aria-hidden','true')
  image.src='/mapplus/natural-ridge-v2/ocean-depth-parchment-v8-q98-v1.webp'
  const overlay=stableImageOverlay(L,image,bounds,{pane:'mapOceanRelief',interactive:false}).addTo(map)
  return()=>overlay.remove()
 },[viewer,enabled])
 return null
}
