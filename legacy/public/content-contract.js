(function initCelestianContentContract(root) {
  const entryTypes = [
    { id: 'aeons', title: '神祇', frontTitle: '神', subtitle: '神祇', renderer: 'aeon', blocks: ['paragraph', 'quote', 'image', 'key-value'], icon: '/images/icons/aeons.svg', total: 14, alien: 'A E O N S', layer: 0, desktop: { top: '55%', left: '50%', scale: 1.3 }, mobile: { top: '50%', left: '50%', scale: 1.1 } },
    { id: 'characters', title: '角色', frontTitle: '角色', subtitle: '角色', renderer: 'standard', blocks: ['paragraph', 'quote', 'image', 'key-value'], icon: '/images/icons/characters.svg', total: 7, alien: 'C H A R A C T E R', layer: 1, desktop: { top: '40%', left: '65%', scale: 1.1 }, mobile: { top: '32%', left: '25%', scale: 0.9 } },
    { id: 'enemies', title: '敌对物种', frontTitle: '敌对物种', subtitle: '敌对物种', renderer: 'standard', blocks: ['paragraph', 'quote', 'image', 'key-value'], icon: '/images/icons/enemies.svg', total: 27, alien: 'B E A S T M U T A T I O N', layer: 2, desktop: { top: '30%', left: '35%', scale: 0.9 }, mobile: { top: '70%', left: '28%', scale: 0.8 } },
    { id: 'relics', title: '圣物', frontTitle: '圣物', subtitle: '圣物', renderer: 'standard', blocks: ['paragraph', 'quote', 'image', 'key-value'], icon: '/images/icons/relics.svg', total: 12, alien: 'A R T I F A C T S', layer: 3, desktop: { top: '76%', left: '72%', scale: 0.85 }, mobile: { top: '25%', left: '75%', scale: 0.75 } },
    { id: 'gallery', title: '留影', frontTitle: '留影', subtitle: '视觉档案', renderer: 'gallery', blocks: ['paragraph', 'quote', 'key-value'], icon: '/images/icons/titans.svg', total: 11, alien: 'G A L L E R Y', layer: 5, desktop: { top: '50%', left: '18%', scale: 0.75 }, mobile: { top: '85%', left: '60%', scale: 0.65 } },
    { id: 'factions', title: '势力', frontTitle: '势力', subtitle: '势力', renderer: 'standard', blocks: ['paragraph', 'quote', 'image', 'key-value'], icon: '/images/icons/factions.svg', total: 25, alien: 'F A C T I O N S', layer: 4, desktop: { top: '65%', left: '30%', scale: 0.85 }, mobile: { top: '65%', left: '75%', scale: 0.75 } },
    { id: 'terms', title: '专有名词', frontTitle: '专有名词', subtitle: '专有名词', renderer: 'standard', blocks: ['paragraph', 'quote', 'image', 'key-value'], icon: '/images/icons/terms.svg', total: 129, alien: 'I N D E X T E R M S', layer: 6, desktop: { top: '50%', left: '80%', scale: 0.75 }, mobile: { top: '15%', left: '50%', scale: 0.65 } },
  ]

  const mapMarkerTypes = [
    { value: '首都', label: '首都', english: 'Capital' },
    { value: '主要城市', label: '主要城市', english: 'Major City' },
    { value: '城市', label: '城市/城镇', english: 'City' },
    { value: '要塞', label: '要塞', english: 'Fortress' },
    { value: '基地', label: '基地', english: 'Base' },
    { value: '港口', label: '港口', english: 'Port' },
    { value: '遗迹', label: '遗迹', english: 'Ruin' },
    { value: '据点', label: '据点', english: 'Camp' },
    { value: '观测站', label: '观测站', english: 'Observation' },
    { value: '异常', label: '异常', english: 'Anomaly' },
    { value: '资源', label: '资源', english: 'Resource' },
    { value: '其他', label: '其他', english: 'Other' },
  ]

  const entryTypeMap = Object.fromEntries(entryTypes.map((type) => [type.id, type]))
  const markerTypeMap = Object.fromEntries(mapMarkerTypes.map((type) => [type.value, type]))
  const entryEditorProfiles = Object.freeze({
    aeons: { description: '神祇、权柄与神性档案', visualLabel: '神祇立绘与神域底图', defaults: { alien_text: 'A E O N S', main_image_scale: 100, bg_image_scale: 100 } },
    characters: { description: '人物身份、经历与关系', visualLabel: '角色立绘与背景', defaults: { alien_text: 'C H A R A C T E R', main_image_scale: 100, bg_image_scale: 120 } },
    enemies: { description: '敌对生物、异变与威胁记录', visualLabel: '物种立绘与栖息背景', defaults: { alien_text: 'B E A S T M U T A T I O N', main_image_scale: 100, bg_image_scale: 120 } },
    relics: { description: '器物来历、能力与持有记录', visualLabel: '圣物主图与背景', defaults: { alien_text: 'A R T I F A C T S', main_image_scale: 100, bg_image_scale: 120 } },
    gallery: { description: '画面、事件与视觉档案', visualLabel: '轮播图片', defaults: { alien_text: 'G A L L E R Y', main_image_scale: 100, bg_image_scale: 100 } },
    factions: { description: '组织、阵营与势力关系', visualLabel: '势力标志与背景', defaults: { alien_text: 'F A C T I O N S', main_image_scale: 100, bg_image_scale: 120 } },
    terms: { description: '概念、制度与专有名词释义', visualLabel: '可选示意图', defaults: { alien_text: 'I N D E X T E R M S', main_image_scale: 100, bg_image_scale: 120 } },
  })

  function getEntryType(nodeId) {
    return entryTypeMap[nodeId] || null
  }

  function getSupportedBlocks(nodeId) {
    return getEntryType(nodeId)?.blocks || []
  }

  function getEntryEditorProfile(nodeId) {
    return entryEditorProfiles[nodeId] || entryEditorProfiles.characters
  }

  function normalizeMapMarkerType(type) {
    if (type === '城市/城镇') return '城市'
    return markerTypeMap[type] ? type : '其他'
  }

  function getMapMarkerType(type) {
    return markerTypeMap[normalizeMapMarkerType(type)] || markerTypeMap['其他']
  }

  function parseEntryBlocks(value) {
    if (Array.isArray(value)) return value.filter((block) => block && typeof block === 'object')
    if (!value) return []
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed.filter((block) => block && typeof block === 'object') : []
    } catch {
      return []
    }
  }

  function validateEntryPayload(payload) {
    const errors = []
    const node = getEntryType(payload?.node_id)
    if (!node) errors.push('未知的百科分类')
    if (!String(payload?.title || '').trim()) errors.push('必须填写标题')

    if (payload?.blocks != null) {
      let parsed
      try {
        parsed = Array.isArray(payload.blocks) ? payload.blocks : JSON.parse(payload.blocks)
      } catch {
        errors.push('内容块格式无效')
      }
      if (parsed && !Array.isArray(parsed)) errors.push('内容块必须是数组')
      if (Array.isArray(parsed) && node) {
        parsed.forEach((block, index) => {
          if (!block || typeof block !== 'object' || !node.blocks.includes(block.type)) {
            errors.push(`第 ${index + 1} 个内容块不适用于${node.title}`)
            return
          }
          if (block.type === 'image' && !String(block.url || '').trim()) errors.push(`第 ${index + 1} 个图片块缺少图片地址`)
          if (block.type === 'quote' && !String(block.content || '').replace(/<[^>]*>/g, '').trim()) errors.push(`第 ${index + 1} 个引用块缺少正文`)
          if (block.type === 'key-value' && (!String(block.key || '').trim() || !String(block.value || '').replace(/<[^>]*>/g, '').trim())) {
            errors.push(`第 ${index + 1} 个资料项需要同时填写名称和内容`)
          }
        })
      }
    }
    return errors
  }

  function getMapMarkerSvg(type, color, size = 32) {
    const safeType = normalizeMapMarkerType(type)
    const safeColor = /^#[0-9a-f]{6}$/i.test(color || '') ? color : '#d4b58e'
    let svgContent
    switch (safeType) {
      case '首都':
        svgContent = `<circle cx="16" cy="16" r="12" fill="none" stroke="${safeColor}" stroke-width="3"/><circle cx="16" cy="16" r="4.5" fill="${safeColor}"/>`
        break
      case '主要城市':
        svgContent = `<circle cx="16" cy="16" r="8" fill="none" stroke="${safeColor}" stroke-width="2.5"/><circle cx="16" cy="16" r="3" fill="${safeColor}"/>`
        break
      case '城市':
        svgContent = `<circle cx="16" cy="16" r="3" fill="${safeColor}"/>`
        break
      case '要塞':
        svgContent = `<polygon points="27,16 21.5,25.5 10.5,25.5 5,16 10.5,6.5 21.5,6.5" fill="none" stroke="${safeColor}" stroke-width="2.5"/><circle cx="16" cy="16" r="3" fill="${safeColor}"/>`
        break
      case '据点':
      case '基地':
        svgContent = `<circle cx="16" cy="16" r="3" fill="none" stroke="${safeColor}" stroke-width="2"/>`
        break
      case '观测站':
        svgContent = `<polygon points="16,8 22,19 10,19" fill="none" stroke="${safeColor}" stroke-width="2"/>`
        break
      case '异常':
        svgContent = `<polygon points="16,2.6 29.4,16 16,29.4 2.6,16" fill="none" stroke="${safeColor}" stroke-width="2.5"/><circle cx="16" cy="16" r="3" fill="${safeColor}"/>`
        break
      case '港口':
        svgContent = `<path d="M7,16 A9,9 0 0,0 25,16" fill="none" stroke="${safeColor}" stroke-width="2.5"/><line x1="16" y1="7" x2="16" y2="25" stroke="${safeColor}" stroke-width="2.5"/><line x1="11" y1="11" x2="21" y2="11" stroke="${safeColor}" stroke-width="2.5"/>`
        break
      case '遗迹':
        svgContent = `<rect x="6.5" y="6.5" width="19" height="19" fill="none" stroke="${safeColor}" stroke-width="2.5" stroke-dasharray="4 4"/>`
        break
      case '资源':
        svgContent = `<polygon points="16,2 20,12 30,16 20,20 16,30 12,20 2,16 12,12" fill="${safeColor}"/>`
        break
      default:
        svgContent = `<circle cx="16" cy="16" r="4.5" fill="${safeColor}"/>`
        break
    }
    return `<svg width="${size}" height="${size}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:auto;">${svgContent}</svg>`
  }

  root.CelestianContentContract = Object.freeze({
    entryTypes,
    mapMarkerTypes,
    getEntryType,
    getEntryEditorProfile,
    getSupportedBlocks,
    normalizeMapMarkerType,
    getMapMarkerType,
    parseEntryBlocks,
    validateEntryPayload,
    getMapMarkerSvg,
  })
})(globalThis)
