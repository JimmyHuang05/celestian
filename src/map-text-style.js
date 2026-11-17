import './map-text-overlay.css'
import {curveSeaLabel,hasLabelCurve} from './map-curved-sea-label.js'
// Both editors and the published map use the same bilingual label element.
export function createMapText(row, { editable = false } = {}) {
  const element = document.createElement('span')
  element.className = `map-bilingual-label ${editable ? 'text-placement-label' : 'mapplus-synced-text'}`
  if(hasLabelCurve(row)){
    const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),g=document.createElementNS(ns,'g')
    g.id='curve-editor-'+crypto.randomUUID();g.setAttribute('text-anchor','middle');g.setAttribute('fill','currentColor')
    for(const [i,value] of [row.title,row.foreignTitle||row.foreign_title].entries()){
      if(!value)continue
      const text=document.createElementNS(ns,'text');text.textContent=value;text.setAttribute('font-family',i?'CelestianAtlasEn, serif':'CelestianAtlasZh, serif');text.setAttribute('font-size',i?'.42':'1');text.style.pointerEvents='auto';g.append(text)
    }
    curveSeaLabel(g,row,1,0,0);svg.append(g);svg.setAttribute('viewBox','-32 -32 64 64')
    Object.assign(svg.style,{position:'absolute',left:'-31.5em',top:'-31.5em',width:'64em',height:'64em',overflow:'visible',pointerEvents:'none'})
    Object.assign(element.style,{width:'1em',height:'1em',textShadow:'none'})
    element.append(svg);return element
  }
  const title = document.createElement('span')
  title.className = 'map-bilingual-label__title'
  title.textContent = row.title
  element.append(title)
  const foreign = row.foreignTitle || row.foreign_title
  if (foreign) {
    const subtitle = document.createElement('span')
    subtitle.className = 'map-bilingual-label__foreign'
    subtitle.textContent = foreign
    element.append(subtitle)
  }
  return element
}
