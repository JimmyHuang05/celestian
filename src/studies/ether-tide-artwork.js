// Fourth Era 1818: five years after the 1813 tide. Coordinates follow the
// user's latest eight annotations, registered to the 2048 × 1024 world.
// Reference image registration: source 4096px map × .3832, offset (18, 18).
export const ETHER_TIDE_SITES = Object.freeze([
  {id:'north-west',x:593.7,y:79.6,rx:155,ry:95,rotation:-12},
  {id:'western-mountains',x:371.5,y:273.8,rx:132,ry:118,rotation:-24},
  {id:'far-north-east',x:1833.2,y:33.9,rx:170,ry:105,rotation:8},
  {id:'eastern-bay',x:1509.7,y:281.8,rx:135,ry:112,rotation:-18},
  {id:'orthys-ocean',x:1940.2,y:524.5,rx:205,ry:155,rotation:13},
  {id:'proerth-ocean',x:1221.8,y:887.5,rx:190,ry:145,rotation:-8},
  {id:'southern-islands',x:1709.3,y:812.9,rx:140,ry:108,rotation:17},
  {id:'southern-ice',x:443.6,y:943.4,rx:150,ry:100,rotation:-7},
])

// Broad, asymmetric lobes break up the radial envelope before the fibre/noise
// filter disperses the pigment. Stable seeds keep the paper still while panning.
function seepagePath(rx,ry,seed) {
  const points=Array.from({length:48},(_,index)=>{
    const angle=index/48*Math.PI*2
    const radius=1+.13*Math.sin(3*angle+seed)+.08*Math.sin(5*angle-seed*.7)+.045*Math.cos(9*angle+seed*.3)
    return [Math.cos(angle)*rx*radius,Math.sin(angle)*ry*radius]
  })
  const at=index=>points[(index+points.length)%points.length]
  const point=p=>p.map(value=>value.toFixed(2)).join(' ')
  return `M ${point(at(0))} `+points.map((_,index)=>{
    const p0=at(index-1),p1=at(index),p2=at(index+1),p3=at(index+2)
    return `C ${point(p1.map((v,i)=>v+(p2[i]-p0[i])/6))} ${point(p2.map((v,i)=>v-(p3[i]-p1[i])/6))} ${point(p2)}`
  }).join(' ')+' Z'
}

export function etherTideArtwork() {
  const filters=ETHER_TIDE_SITES.map((site,index)=>`
    <filter id="ether-tide-bleed-${site.id}" x="-40%" y="-50%" width="180%" height="200%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency=".005 .008" numOctaves="3" seed="${41+index*7}" result="spread"/>
      <feDisplacementMap in="SourceGraphic" in2="spread" scale="115" xChannelSelector="R" yChannelSelector="G" result="seeped"/>
      <feTurbulence type="fractalNoise" baseFrequency=".024 .037" numOctaves="3" seed="${97+index*11}" result="fibres"/>
      <feColorMatrix in="fibres" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  .8 .5 .2 0 -.1" result="absorption"/>
      <feComposite in="seeped" in2="absorption" operator="in"/>
      <feGaussianBlur stdDeviation="1.8"/>
    </filter>`).join('')
  const stains=ETHER_TIDE_SITES.map((site,index)=>`
    <g data-tide-site="${site.id}" transform="translate(${site.x} ${site.y}) rotate(${site.rotation})">
      <g filter="url(#ether-tide-bleed-${site.id})">
        <path d="${seepagePath(site.rx*1.6,site.ry*1.6,index+1)}" fill="url(#ether-tide-wash)"/>
        <path transform="translate(${site.rx*.52} ${-site.ry*.31}) rotate(29)" d="${seepagePath(site.rx*1.13,site.ry*.98,index+12)}" fill="url(#ether-tide-wash)" opacity=".22"/>
        <path transform="translate(${-site.rx*.63} ${site.ry*.45}) rotate(-21)" d="${seepagePath(site.rx*.94,site.ry*1.07,index+23)}" fill="url(#ether-tide-wash)" opacity=".2"/>
      </g>
    </g>`).join('')
  const seals=ETHER_TIDE_SITES.map(({id,x,y})=>`
    <image href="/mapplus/ether-tide-core-ink-v1.png" x="${x-33}" y="${y-22}" width="66" height="44" opacity=".86" data-tide-core="${id}"/>`).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 1024" preserveAspectRatio="none" aria-hidden="true" class="map-ether-tide-artwork">
    <defs>
      <radialGradient id="ether-tide-wash">
        <stop offset="0" stop-color="#ad5147" stop-opacity=".18"/>
        <stop offset=".23" stop-color="#b45c4f" stop-opacity=".15"/>
        <stop offset=".5" stop-color="#bb6b58" stop-opacity=".098"/>
        <stop offset=".77" stop-color="#c27c65" stop-opacity=".039"/>
        <stop offset="1" stop-color="#bf7059" stop-opacity="0"/>
      </radialGradient>
      ${filters}
    </defs>
    ${stains}
    ${seals}
  </svg>`
}
