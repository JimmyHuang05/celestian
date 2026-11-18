const NS = 'http://www.w3.org/2000/svg'
// Flag identity follows saved region IDs; display names may change freely.
export const COUNTRY_FLAGS = Object.freeze({
  'custom-region-69809':'/flags/kelovia-northern-dragon-v3.webp',
  'political-7':'/flags/velogoriya-white-bear-v15-75pct.webp',
  'custom-region-44930':'/flags/boravia-governorate-half-hoist-bold-v19.webp',
  'custom-region-55999':'/flags/arzania-dynastic-rosette-v2.webp',
  'custom-region-53260':'/flags/kartvelia-woven-cross-v2.webp',
  'custom-region-34341':'/flags/vardarija-red-black-fist-v3.webp',
  'custom-region-31013':'/flags/alberia-diagonal-eagle-v2.webp',
  'custom-region-34879':'/flags/velia-roman-gate-v2.webp',
  'custom-region-7878':'/flags/dalmerija-blue-white-lion-v2.webp',
  'custom-pannovia':'/flags/pannovia-republic-stag-local-v3.webp',
  'custom-tatria':'/flags/tatria-mountain-sun-v3.webp',
  'custom-region-58112':'/flags/montara-raised-torch-v3.webp',
  'custom-region-33599':'/flags/friula-golden-goat-v1.webp',
  'custom-region-42232':'/flags/dravija-crowned-marten-v1.webp',
  'custom-region-42338':'/flags/karnija-twelve-spoke-wheel-v2.webp',
  'custom-region-57007':'/flags/steiermark-governorate-half-hoist-v18.webp', // 施泰尔马克专员辖区
  'custom-region-60414':'/flags/valkonia-governorate-half-hoist-v18.webp', // 瓦尔科尼亚专员辖区
  'custom-region-63066':'/flags/frienza-governorate-half-hoist-v18.webp', // 弗里恩扎军事行政区
  'custom-region-64473':'/flags/feldkirch-governorate-half-hoist-v18.webp', // 费尔德基希专员辖区
  'custom-region-61881':'/flags/klavina-governorate-half-hoist-v18.webp', // 克拉维纳专员辖区
  'custom-ciampiana':'/flags/ciampiana-spice-amphora-v1.webp', // 香佩安自由市
  'custom-1d92e13a-b16c-47e6-a8aa-4764e2a01136':'/flags/voronzo-imperial-colonial-v2.webp', // 沃龙佐边疆区
  'custom-a4b74f76-7439-4c19-941a-1ca12b73808c':'/flags/new-draventon-colonial-v3.webp', // 新德拉文顿自治领
  'custom-0ee60450-6068-414c-922e-02d8b89ebab8':'/flags/providentia-colonial-v3.webp', // 普罗维登提亚联合拓殖区
  'custom-c037d371-0a4e-411b-99ab-e5133cc71dc8':'/flags/north-ingleton-colonial-v3.webp', // 北英普顿殖民地
  'custom-4b691d1c-b1c3-4533-8432-044c260d391a':'/flags/clemeny-colonial-v3.webp', // 克莱曼尼殖民地
  'custom-east-illyria':'/flags/siria-republic-olive-lion-v1.webp', // 锡里亚共和国
  'custom-west-illyria':'/flags/siria-state-sword-lion-v1.webp', // 锡里亚国
  'custom-hohentein':'/flags/hohentein-horizontal-black-white-gold-v5.webp', // 神圣的霍亨泰因帝国
  'custom-isfar':'/flags/isfar-ivory-lion-v2.webp', // 伊斯法尔崇高国
  'political-1':'/flags/alania-imperial-v3.webp', // 奥兰尼亚帝国
  'political-2':'/flags/estavira-royal-tides-v2.webp', // 伊斯塔维拉王国
  'custom-san-telmo':'/flags/estavira-royal-tides-v2.webp',
  'political-3':'/flags/ambra-kingdom-pannovia-colors-v13.webp', // 琥珀王国
  'political-4':'/flags/ambra-republic-pannovia-colors-v11.webp', // 琥珀共和国
  'political-5':'/flags/coast-confederation-v2.webp', // 海岸邦联
  'political-6':'/flags/roland-lantern-v8.webp', // 罗兰骑士团国
  'political-10':'/flags/herdor-crown-v4.webp', // 赫尔铎王国
  'custom-d894a805-9988-44e3-9086-f8a305761d29':'/flags/hispernia-pegasus-v3.webp', // 希斯伯尼亚
  'political-8':'/flags/hispernia-pegasus-v3.webp', // 希斯伯尼亚
  'custom-38e5ee7b-44d1-42ec-bb8f-794a72e8b725':'/flags/tyrsenia-western-roman-v2.webp', // 提尔塞尼亚
  'custom-ionia':'/flags/ionia-dolphins-v2.webp', // 伊奥尼亚
  'custom-delos':'/flags/delos-balance-anchor-v2.webp', // 提洛斯城邦
  'custom-pharos':'/flags/pharos-lighthouse-v2.webp', // 法罗斯城邦
  'custom-valesia':'/flags/valesia-saltire-golden-bird-v2.webp', // 瓦莱西亚同盟
  'custom-occitania':'/flags/occitania-knot-geometric-center-v4.webp', // 奥克塔尼亚公国
  'custom-savaldia':'/flags/savaldia-ibex-gate-v2.webp', // 萨瓦尔迪亚公国
  'custom-armorica':'/flags/brittonia-ermine-v2.webp', // 布列托尼亚公国
})

export function countryFlagUrl(row) {
  return COUNTRY_FLAGS[row?.region_id] || COUNTRY_FLAGS[row?.sourceRegionId] || null
}
let sequence = 0

// These overlays belong to the rendered map, never the editable geometry.
export function countryFlagHover(svg, before) {
  const overlays = new Map()
  function show(path, row, visible) {
    const flag = countryFlagUrl(row)
    let overlay = overlays.get(path)
    if (!flag || !visible) {
      if (overlay) overlay.style.opacity = '0'
      return false
    }
    if (!overlay) {
      const box = path.getBBox()
      if (!(box.width > 0 && box.height > 0)) return false
      const id = `country-flag-pattern-${++sequence}`
      const defs = document.createElementNS(NS, 'defs')
      // Paint the flag into the country itself. A clipped image in a blended,
      // transformed SVG group can lose its clip on mobile compositors.
      const pattern = document.createElementNS(NS, 'pattern')
      pattern.id = id
      pattern.setAttribute('patternUnits', 'userSpaceOnUse')
      pattern.setAttribute('patternContentUnits', 'userSpaceOnUse')
      for (const key of ['x','y','width','height']) pattern.setAttribute(key, box[key])
      const shape = path.cloneNode(false)
      for (const attribute of [...shape.attributes]) {
        if (!['d','points','transform','fill-rule'].includes(attribute.name)) shape.removeAttribute(attribute.name)
      }
      shape.setAttribute('fill-rule', path.getAttribute('fill-rule') || 'evenodd')
      shape.setAttribute('fill', `url(#${id})`)
      shape.setAttribute('stroke', 'none')
      // Leaflet explicitly enables pointer events on descendant SVG paths,
      // overriding the group's inherited value. The decoration must not steal taps.
      shape.style.pointerEvents = 'none'
      overlay = document.createElementNS(NS, 'g')
      overlay.classList.add('map-country-flag')
      overlay.setAttribute('aria-hidden', 'true')
      const transforms = []
      for (let parent = path.parentElement; parent && parent !== svg; parent = parent.parentElement) {
        if (parent.hasAttribute('transform')) transforms.unshift(parent.getAttribute('transform'))
      }
      if (transforms.length) overlay.setAttribute('transform', transforms.join(' '))
      overlay.style.opacity = '0'
      overlay.style.pointerEvents = 'none'
      const image = document.createElementNS(NS, 'image')
      image.style.pointerEvents = 'none'
      image.setAttribute('href', flag)
      // Pattern content starts at the tile origin, not at the country's world
      // coordinates. Reusing box.x/y here shifts distant countries out of view.
      image.setAttribute('x', '0')
      image.setAttribute('y', '0')
      for (const key of ['width','height']) image.setAttribute(key, box[key])
      image.setAttribute('preserveAspectRatio', 'xMidYMid slice')
      pattern.append(image)
      defs.append(pattern)
      svg.append(defs)
      overlay.append(shape)
      svg.insertBefore(overlay, before)
      overlays.set(path, overlay)
      // Establish the initial transparent frame before the first fade-in.
      overlay.getBoundingClientRect()
    }
    overlay.style.opacity = '.14'
    return true
  }
  return {show}
}
