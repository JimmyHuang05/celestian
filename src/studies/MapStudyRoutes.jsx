import { useEffect, useState } from 'react'
import L from 'leaflet'
import { stableSvgOverlay } from '../map-stable-svg.js'
import { routePath, validRoutes } from './route-curves.js'
import { routeInk } from './route-ink.js'
import { appendRouteLabels } from './route-labels.js'
import { pairedRoute } from './route-paired.js'
import { routeDirections } from './route-directions.js'
import { longDashRoute, routeJunctions } from './route-long-dashes.js'

// Routes are authored in the project; the map only displays them.
export default function MapStudyRoutes({ viewer, originalStyle = true, visible = true }) {
  const [routes, setRoutes] = useState([])
  const [pixelsPerUnit, setPixelsPerUnit] = useState(1)
  const [labelMask,setLabelMask] = useState(null)
  useEffect(()=>{
    let alive=true
    const image=new Image()
    image.onload=()=>{const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(image,0,0);if(alive)setLabelMask({pixels:context.getImageData(0,0,image.width,image.height).data,width:image.width,height:image.height})}
    image.src='/map-cotton-study/route-land-mask.png'
    return()=>{alive=false}
  },[])
  useEffect(() => {
    if (!viewer || originalStyle) return
    const { map, bounds } = viewer
    const update = () => {
      const width = map.project(bounds.getSouthEast()).x - map.project(bounds.getNorthWest()).x
      setPixelsPerUnit(Math.max(.001, width / 21600))
    }
    update()
    // Rebuild only once a zoom settles, not on animation frames.
    map.on('zoomend resize', update)
    return () => map.off('zoomend resize', update)
  }, [viewer, originalStyle])
  useEffect(() => {
    const controller = new AbortController()
    let previous = '', busy = false, pending = false
    async function refresh() {
      if (controller.signal.aborted) return
      if (busy) { pending = true; return }
      busy = true
      try {
        const response = await fetch(import.meta.env.DEV ? '/__map-routes' : '/map-cotton-study/routes.json', { cache: import.meta.env.DEV ? 'no-store' : 'default', signal: controller.signal })
        if (!response.ok) throw Error('航线读取失败')
        const data = await response.json()
        if (!validRoutes(data)) throw Error('航线格式无效')
        const signature = JSON.stringify(data.routes)
        if (!controller.signal.aborted && signature !== previous) {
          previous = signature
          setRoutes(data.routes)
        }
      } catch (error) {
        if (!controller.signal.aborted) console.warn('无法更新项目航线，保留当前显示', error)
      } finally {
        busy = false
        if (pending) { pending = false; void refresh() }
      }
    }
    void refresh()
    const onSaved=()=>{void refresh()}
    import.meta.hot?.on('map-routes-updated',onSaved)
    if(import.meta.env.DEV)window.addEventListener('focus',onSaved)
    const onVisible=()=>{if(document.visibilityState==='visible')onSaved()}
    if(import.meta.env.DEV)document.addEventListener('visibilitychange',onVisible)
    const timer = import.meta.env.DEV ? setInterval(refresh, 2000) : null
    return () => { controller.abort(); clearInterval(timer);import.meta.hot?.off('map-routes-updated',onSaved);window.removeEventListener('focus',onSaved);document.removeEventListener('visibilitychange',onVisible) }
  }, [])

  useEffect(() => {
    if (!viewer || !routes.length || !visible) return
    const { map, bounds, metadata } = viewer
    const pane = map.getPane('studyRoutes') || map.createPane('studyRoutes')
    pane.style.zIndex = '460'
    pane.style.pointerEvents = 'none'
    const ns = 'http://www.w3.org/2000/svg'
    const svg = document.createElementNS(ns, 'svg')
    svg.setAttribute('data-map-layer','shipping-routes')
    svg.setAttribute('xmlns',ns)
    svg.setAttribute('aria-label','航线与航线名称')
    svg.setAttribute('viewBox', `0 0 ${metadata.width} ${metadata.height}`)
    svg.setAttribute('preserveAspectRatio', 'none')
    const junctions=routeJunctions(routes)
    for (const route of routes) {
      const ink = originalStyle ? null : routeInk(route, { pixelsPerUnit })
      const offsets = [0]
      if (route.curves?.some(c => c.some(p => p[0] < 0))) offsets.push(metadata.width)
      if (route.curves?.some(c => c.some(p => p[0] > 1))) offsets.push(-metadata.width)
      for (const offset of offsets) {
      if(originalStyle){
        const group=document.createElementNS(ns,'g')
        group.setAttribute('transform',`translate(${offset} 0) scale(${metadata.width/21600} ${metadata.height/10800})`)
        group.setAttribute('stroke','#ad9876')
        group.setAttribute('stroke-width',route.pairedDirection?String(14*2/3):'14')
        group.setAttribute('stroke-linejoin','round')
        group.setAttribute('fill','none')
        if(route.seasonal)group.setAttribute('opacity','.65')
        for(const mark of longDashRoute(route,junctions)){
          const line=document.createElementNS(ns,'path');line.setAttribute('d',mark.d);group.append(line)
          if(mark.arrow){const head=document.createElementNS(ns,'path');head.setAttribute('d',mark.arrow);head.setAttribute('fill','#ad9876');head.setAttribute('stroke','none');group.append(head)}
        }
        svg.append(group)
        continue
      }
      if (ink) {
        const group = document.createElementNS(ns, 'g')
        group.setAttribute('transform', `translate(${offset} 0) scale(${metadata.width / 21600} ${metadata.height / 10800})`)
        group.setAttribute('fill', 'none')
        group.setAttribute('stroke-linecap', 'round')
        group.setAttribute('stroke-linejoin', 'round')
        for (const mark of ink) {
          const path = document.createElementNS(ns, 'path')
          path.setAttribute('d', mark.d)
          path.setAttribute('stroke', mark.color)
          path.setAttribute('stroke-width', mark.width)
          path.setAttribute('opacity', mark.opacity)
          group.append(path)
        }
        svg.append(group)
      } else {
      const path = document.createElementNS(ns, 'path')
      path.setAttribute('d', routePath(route.points, metadata.width, metadata.height, route.smooth, route.curves, route.hiddenCurves))
      path.setAttribute('transform', `translate(${offset} 0)`)
      path.setAttribute('fill', 'none')
      path.setAttribute('stroke', '#ad9876')
      // Original 21600-wide artboard, with finer solid ink.
      const sourceScale = metadata.width / 21600
      path.setAttribute('stroke-width', String(14 * sourceScale))
      if (route.seasonal) {
        path.setAttribute('opacity', '.65')
      }
      path.setAttribute('stroke-linecap', 'butt')
      path.setAttribute('stroke-linejoin', 'round')
      svg.append(path)
      }
      if (route.pairedDirection) {
        const group=document.createElementNS(ns,'g')
        group.setAttribute('transform',`translate(${offset} 0) scale(${metadata.width/21600} ${metadata.height/10800})`)
        group.setAttribute('fill','none')
        group.setAttribute('stroke','#ad9876')
        group.setAttribute('stroke-linejoin','round')
        for(const lane of pairedRoute(route)) {
          for(const [i,d] of [lane.d,...lane.arrows].entries()) {
            const mark=document.createElementNS(ns,'path')
            mark.setAttribute('d',d)
            mark.setAttribute('stroke-width',i?'7':'14')
            group.append(mark)
          }
        }
        svg.append(group)
      }
      if (!route.pairedDirection) {
        for (const d of routeDirections(route)) {
          const arrow = document.createElementNS(ns, 'path')
          arrow.setAttribute('d', d)
          arrow.setAttribute('transform',`translate(${offset} 0) scale(${metadata.width/21600} ${metadata.height/10800})`)
          arrow.setAttribute('fill', 'none')
          arrow.setAttribute('stroke', '#ad9876')
          arrow.setAttribute('stroke-width', '7')
          arrow.setAttribute('opacity', '.85')
          arrow.setAttribute('stroke-linecap', 'round')
          svg.append(arrow)
        }
      }
      }
    }
    if(labelMask)appendRouteLabels(svg,routes,metadata,([x,y])=>x>=0&&x<1&&y>=0&&y<1&&labelMask.pixels[(Math.floor(y*labelMask.height)*labelMask.width+Math.floor(x*labelMask.width))*4]<128)
    const overlay = stableSvgOverlay(L, svg, bounds, { pane: 'studyRoutes', interactive: false }).addTo(map)
    return () => overlay.remove()
  }, [viewer, routes, pixelsPerUnit, originalStyle,labelMask,visible])
  return null
}
