import {useEffect} from 'react'
import L from 'leaflet'
import {stableSvgOverlay} from '../map-stable-svg.js'

export default function MapCottonTexture({viewer}){
 useEffect(()=>{
  if(!viewer)return
  const {map,bounds,metadata}=viewer,ns='http://www.w3.org/2000/svg'
  const pane=map.getPane('mapCottonTexture')||map.createPane('mapCottonTexture')
  // Paper covers all printed artwork, including routes, symbols and lettering.
  // The metal frame (645) and Leaflet tooltips/popups remain above the paper.
  pane.style.zIndex='640';pane.style.pointerEvents='none';pane.style.mixBlendMode='multiply';pane.style.opacity='.3'
  const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox',`0 0 ${metadata.width} ${metadata.height}`)
  const defs=document.createElementNS(ns,'defs'),pattern=document.createElementNS(ns,'pattern'),image=document.createElementNS(ns,'image'),rect=document.createElementNS(ns,'rect')
  const size=metadata.width/8
  pattern.id='mapplus-cotton-paper';pattern.setAttribute('patternUnits','userSpaceOnUse');pattern.setAttribute('width',size);pattern.setAttribute('height',size)
  image.setAttribute('href','/map-cotton-study/handmade-cotton-paper-2k-q88-v1.webp');image.setAttribute('width',size);image.setAttribute('height',size)
  pattern.append(image);defs.append(pattern);rect.setAttribute('width',metadata.width);rect.setAttribute('height',metadata.height);rect.setAttribute('fill','url(#mapplus-cotton-paper)');svg.append(defs,rect)
  const overlay=stableSvgOverlay(L,svg,bounds,{pane:'mapCottonTexture',interactive:false}).addTo(map)
  return()=>overlay.remove()
 },[viewer])
 return null
}
