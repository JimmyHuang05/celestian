import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

function BadgePage() {
  const navigate = useNavigate()

  useEffect(() => {
    if (window.lucide) requestAnimationFrame(() => window.lucide.createIcons())
  })
  const badgeRef = useRef(null)
  const frontContentRef = useRef(null)
  const backContentRef = useRef(null)
  const sceneRef = useRef(null)
  const glareRef = useRef(null)
  const avatarRef = useRef(null)
  const barcodeRef = useRef(null)
  const diamondInnerRef = useRef(null)
  const badgeElRef = useRef(null)
  const mainContentRef = useRef(null)

  const [cardData, setCardData] = useState({
    company: 'B.U.I.C.丨巴别塔联合工业集群',
    name: '',
    dept: 'UNKNOWN丨未指派',
    gender: 'UNKNOWN',
    dob: '1800.01.01',
    join: '1800.01.01',
    tier: '?',
    isAwakened: false,
    sat: 100, con: 100, bri: 100,
  })
  const [currentEditingField, setCurrentEditingField] = useState(null)
  const [activeEditEl, setActiveEditEl] = useState(null)

  const startDragRef = useRef(null)
  const isDraggingRef = useRef(false)
  const currentXRot = useRef(5)
  const currentYRot = useRef(-10)

  const generateRandomID = useCallback(() => {
    const chars = 'ABCDEF0123456789'
    let result = ''
    for (let i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) result += '-'
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return 'ID:' + result
  }, [])

  useEffect(() => {
    if (barcodeRef.current) barcodeRef.current.innerText = generateRandomID()
  }, [generateRandomID])

  const parseDisplayTitle = (val, defaultVal) => {
    let str = (val || '').trim() || defaultVal
    if (str.includes('丨')) return str.split('丨')[0].trim()
    if (str.includes(' ')) return str.split(' ')[0].trim()
    return str
  }

  const updateCardUI = useCallback(() => {
    if (!badgeElRef.current || !mainContentRef.current) return
    if (cardData.isAwakened) {
      badgeElRef.current.classList.add('is-awakened')
      if (mainContentRef.current) mainContentRef.current.classList.add('is-awakened-hud')
      if (diamondInnerRef.current) {
        const match = cardData.tier.match(/\d/)
        diamondInnerRef.current.innerText = match ? match[0] : cardData.tier
      }
    } else {
      badgeElRef.current.classList.remove('is-awakened')
      if (mainContentRef.current) mainContentRef.current.classList.remove('is-awakened-hud')
      if (diamondInnerRef.current) {
        diamondInnerRef.current.innerHTML = '<i data-lucide="eye" class="w-4 h-4 normal-only"></i>'
        if (window.lucide) window.lucide.createIcons({ root: diamondInnerRef.current })
      }
    }
    applyAvatarFilters()
  }, [cardData])

  const applyAvatarFilters = useCallback(() => {
    if (avatarRef.current) {
      avatarRef.current.style.filter = `saturate(${cardData.sat}%) contrast(${cardData.con}%) brightness(${cardData.bri}%)`
    }
  }, [cardData.sat, cardData.con, cardData.bri])

  const toggleAwakenedMode = useCallback(() => {
    setCurrentEditingField(null)
    setActiveEditEl(null)
    setCardData(prev => ({ ...prev, isAwakened: !prev.isAwakened }))
  }, [])

  const editorConfig = {
    company: { title: '所属组织 ORGANIZATION', type: 'select', options: ['B.A.I.G.丨航天工业集团', 'B.M.I.G.丨军事工业集团', 'B.P.C.丨生物制药有限公司', 'B.G.C.丨通用计算有限公司'] },
    name: { title: '姓名 NAME / CALLSIGN', type: 'text' },
    dept: { title: '隶属部门 DEPARTMENT ASSIGNMENT', type: 'select', options: ['C.A.R.G.丨工业污染评估与处理组'] },
    gender: { title: '生理性别 BIOLOGICAL GENDER', type: 'select', options: ['男 MALE', '女 FEMALE'] },
    dob: { title: '出生日期 DATE OF BIRTH', type: 'date' },
    join: { title: '入职日期 DATE OF JOINING', type: 'date' },
    avatar: { title: 'BIOMETRIC SCAN', type: 'avatar' },
  }

  const selectOption = useCallback((fieldKey, value) => {
    setCardData(prev => ({ ...prev, [fieldKey]: value }))
    setCurrentEditingField(null)
    setActiveEditEl(null)
  }, [])

  const saveText = useCallback(() => {
    if (!currentEditingField || currentEditingField === 'avatar') return
    const config = editorConfig[currentEditingField]
    if (!config) return
    if (config.type === 'text') {
      const input = document.getElementById('hud-input')
      if (input) {
        setCardData(prev => ({ ...prev, [currentEditingField]: input.value.trim() }))
      }
    } else if (config.type === 'date') {
      const y = (document.getElementById('hud-date-y')?.value || '').trim().padStart(4, '0') || '1800'
      const m = (document.getElementById('hud-date-m')?.value || '').trim().padStart(2, '0') || '01'
      const d = (document.getElementById('hud-date-d')?.value || '').trim().padStart(2, '0') || '01'
      setCardData(prev => ({ ...prev, [currentEditingField]: `${y}.${m}.${d}` }))
    }
    setCurrentEditingField(null)
    setActiveEditEl(null)
  }, [currentEditingField])

  const closeEditor = useCallback(() => {
    setCurrentEditingField(null)
    setActiveEditEl(null)
  }, [])

  const openEditor = useCallback((fieldKey, targetElement) => {
    const config = editorConfig[fieldKey]
    if (!config) return
    setCurrentEditingField(fieldKey)
    setActiveEditEl(targetElement)
  }, [])

  const getLocalBounds = (el) => {
    let top = 0, left = 0
    const w = el.offsetWidth, h = el.offsetHeight
    let current = el
    while (current && !current.classList.contains('card-face') && current.id !== 'badge') {
      top += current.offsetTop
      left += current.offsetLeft
      current = current.offsetParent
    }
    return { left, right: left + w, top, y: top + h / 2, height: h }
  }

  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('#badge-app .editable') || e.target.closest('button')) return
    isDraggingRef.current = false
    startDragRef.current = { x: e.clientX, y: e.clientY }
    if (badgeRef.current) badgeRef.current.style.transition = 'none'
  }, [])

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!startDragRef.current) return
      if (Math.abs(e.clientX - startDragRef.current.x) > 5 || Math.abs(e.clientY - startDragRef.current.y) > 5) {
        isDraggingRef.current = true
        currentYRot.current += (e.clientX - startDragRef.current.x) * 0.5
        currentXRot.current -= (e.clientY - startDragRef.current.y) * 0.5
        if (badgeRef.current) {
          badgeRef.current.style.transform = `translateX(0px) rotateX(${currentXRot.current}deg) rotateY(${currentYRot.current}deg)`
        }
        if (glareRef.current) {
          const angle = currentYRot.current + currentXRot.current
          glareRef.current.style.background = `linear-gradient(${105 + angle}deg, transparent 40%, rgba(212, 181, 142, 0.12) 45%, transparent 50%)`
        }
        startDragRef.current = { x: e.clientX, y: e.clientY }
      }
    }
    const handleMouseUp = (e) => {
      if (!startDragRef.current) return
      if (!isDraggingRef.current) {
        const target = e.target.closest('#badge-app .editable')
        if (target) {
          const field = target.getAttribute('data-field')
          if (field === currentEditingField) closeEditor()
          else if (field) openEditor(field, target)
        } else if (currentEditingField && !e.target.closest('#badge-app .editor-hud')) {
          closeEditor()
        }
      }
      isDraggingRef.current = false
      startDragRef.current = null
      if (badgeRef.current) badgeRef.current.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [currentEditingField, closeEditor, openEditor])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && currentEditingField) closeEditor()
      if (e.key === 'Enter' && currentEditingField) saveText()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentEditingField, closeEditor, saveText])

  const downloadBadge = useCallback(async () => {
    closeEditor()
    const btn = document.getElementById('download-btn')
    if (!btn) return
    btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i>'
    if (window.lucide) window.lucide.createIcons()
    btn.disabled = true

    const exportWrapper = document.createElement('div')
    Object.assign(exportWrapper.style, {
      position: 'fixed', top: '200vh', left: '0', display: 'flex',
      gap: '40px', padding: '40px', background: '#111', borderRadius: '24px',
    })
    if (cardData.isAwakened) exportWrapper.classList.add('is-awakened')

    const frontClone = frontContentRef.current.cloneNode(true)
    const backClone = backContentRef.current.cloneNode(true)
    const removeVisuals = (node) => {
      node.querySelectorAll('.editable').forEach(el => el.classList.remove('editable'))
      node.querySelectorAll('.active-edit-target').forEach(el => el.classList.remove('active-edit-target'))
      node.querySelectorAll('#editor-hud, #hud-connector').forEach(el => el.remove())
    }
    const setupClone = (clone) => {
      clone.style.position = 'relative'
      clone.style.setProperty('transform', 'none', 'important')
      clone.style.width = '320px'
      clone.style.height = '480px'
      clone.classList.remove('card-face')
      clone.style.setProperty('backface-visibility', 'visible', 'important')
      clone.style.setProperty('-webkit-backface-visibility', 'visible', 'important')
      clone.style.overflow = 'hidden'
      clone.style.borderRadius = '16px'
      clone.style.boxShadow = '0 0 30px rgba(0,0,0,0.5)'
      clone.style.margin = '0'
      removeVisuals(clone)
    }
    setupClone(frontClone)
    setupClone(backClone)
    exportWrapper.appendChild(frontClone)
    exportWrapper.appendChild(backClone)
    document.body.appendChild(exportWrapper)

    await new Promise(resolve => setTimeout(resolve, 300))
    try {
      const canvas = await html2canvas(exportWrapper, { scale: 3, backgroundColor: '#111', useCORS: true, logging: false })
      const imgData = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      const safeName = (cardData.name || 'UNKNOWN').replace(/\s+/g, '_')
      link.download = `ACUP_ID_Card_${safeName}.png`
      link.href = imgData
      link.click()
    } catch (error) {
      alert("生成凭证失败。可能是设备性能限制或您上传的相片尺寸过大。")
    } finally {
      document.body.removeChild(exportWrapper)
      btn.disabled = false
      btn.innerHTML = '<i data-lucide="download" class="w-6 h-6"></i>'
      if (window.lucide) window.lucide.createIcons()
    }
  }, [cardData, closeEditor])

  const handleAvatarUpload = useCallback((e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (avatarRef.current) avatarRef.current.style.backgroundImage = `url(${event.target.result})`
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const renderEditorHUD = () => {
    if (!currentEditingField || !activeEditEl) return null
    const config = editorConfig[currentEditingField]
    if (!config) return null

    const bounds = getLocalBounds(activeEditEl)
    const side = activeEditEl.getAttribute('data-side') || 'right'
    const hudWidth = 260
    const gap = 30
    const x1 = side === 'left' ? bounds.left - 20 : bounds.right + 20
    const y1 = bounds.y
    const hudX = side === 'left' ? -(hudWidth + gap) : 320 + gap
    const hudY = bounds.y - 25
    const x2 = side === 'left' ? hudX + hudWidth : hudX
    const y2 = hudY + 12

    const inputClass = "w-full bg-transparent border-b border-[#d4b58e]/40 text-white font-serif-sc font-bold focus:border-[#d4b58e] focus:bg-[#d4b58e]/10 outline-none py-1 text-[15px] transition-all"

    return (
      <>
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-50" style={{ overflow: 'visible', transform: 'translateZ(15px)' }}>
          <circle cx={x1} cy={y1} r="2.5" className="hud-svg-dot" />
          <line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="1.5" className="hud-svg-line" />
        </svg>
        <div className="absolute transition-all duration-300 pointer-events-auto flex flex-col z-50"
          style={{ transform: 'translateZ(15px)', left: hudX + 'px', top: hudY + 'px', width: '260px' }}>
          <h3 className="text-[#d4b58e] font-mono text-[10px] font-bold tracking-widest mb-2 uppercase flex items-center gap-1.5 hud-title drop-shadow-md">
            <i data-lucide="terminal-square" className="w-3.5 h-3.5" /> <span>{config.title}</span>
          </h3>

          <div className="mb-3 w-full">
            {config.type === 'text' && (
              <input type="text" id="hud-input" defaultValue={cardData[currentEditingField] || ''}
                className={inputClass} placeholder="ENTER YOUR NAME" autoFocus />
            )}
            {config.type === 'date' && (() => {
              const parts = (cardData[currentEditingField] || '1800.01.01').split('.')
              return (
                <div className="flex items-end gap-2 w-full mt-1">
                  <div className="flex-1">
                    <label className="text-[8px] text-[#d4b58e]/60 font-mono mb-1 block uppercase">年 Year</label>
                    <input type="text" id="hud-date-y" defaultValue={parts[0]} maxLength="4" className={`${inputClass} text-center text-sm`} placeholder="1800" />
                  </div>
                  <span className="text-[#d4b58e]/50 font-bold mb-1">.</span>
                  <div className="w-14">
                    <label className="text-[8px] text-[#d4b58e]/60 font-mono mb-1 block uppercase">月 Month</label>
                    <input type="text" id="hud-date-m" defaultValue={parts[1]} maxLength="2" className={`${inputClass} text-center text-sm`} placeholder="01" />
                  </div>
                  <span className="text-[#d4b58e]/50 font-bold mb-1">.</span>
                  <div className="w-14">
                    <label className="text-[8px] text-[#d4b58e]/60 font-mono mb-1 block uppercase">日 Day</label>
                    <input type="text" id="hud-date-d" defaultValue={parts[2]} maxLength="2" className={`${inputClass} text-center text-sm`} placeholder="01" />
                  </div>
                </div>
              )
            })()}
            {config.type === 'select' && (
              <div className="w-full mt-2 flex flex-col gap-0.5 bg-transparent">
                {config.options.map(opt => {
                  const isSelected = cardData[currentEditingField] === opt
                  return (
                    <div key={opt} onClick={() => selectOption(currentEditingField, opt)}
                      className={`cursor-pointer py-1.5 transition-colors flex items-center gap-2.5 group ${isSelected ? 'text-[#d4b58e] font-bold' : 'text-gray-500 hover:text-[#d4b58e]'}`}>
                      <div className={`w-1 h-1 rounded-full transition-colors ${isSelected ? 'bg-[#d4b58e] shadow-[0_0_4px_#d4b58e]' : 'bg-gray-700 group-hover:bg-[#d4b58e]'}`} />
                      <span className="text-[11.5px] font-serif-sc tracking-wide flex-1">{opt}</span>
                    </div>
                  )
                })}
              </div>
            )}
            {config.type === 'avatar' && (
              <div className="mb-3 w-full">
                <label htmlFor="hud-upload-avatar" className="cursor-pointer text-[#d4b58e] hover:text-white text-xs font-serif-sc flex items-center gap-2 border-b border-[#d4b58e]/30 pb-1.5 transition-colors hud-title">
                  <i data-lucide="upload" className="w-3.5 h-3.5" /> 载入本地全息相片
                </label>
                <input type="file" id="hud-upload-avatar" accept="image/png, image/jpeg, image/jpg, image/webp" onChange={handleAvatarUpload} />
                <div className="space-y-2.5 pt-1 w-full">
                  {['sat', 'con', 'bri'].map(key => (
                    <div key={key}>
                      <div className="flex justify-between text-[9px] text-gray-400 font-mono mb-1">
                        <span>{key === 'sat' ? '色彩 (SAT)' : key === 'con' ? '反差 (CON)' : '流明 (BRI)'}</span>
                        <span>{cardData[key]}%</span>
                      </div>
                      <input type="range" min={key === 'sat' ? 0 : 50} max={key === 'sat' ? 200 : 150} value={cardData[key]}
                        onChange={(e) => setCardData(prev => ({ ...prev, [key]: parseInt(e.target.value) }))} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {config.type !== 'select' && (
            <div className="flex gap-4 w-full">
              <button onClick={closeEditor} className="text-gray-500 hover:text-white text-[10px] font-mono tracking-widest uppercase transition-colors text-left flex items-center gap-1">
                <i data-lucide="x" className="w-3 h-3" /> 取消
              </button>
              <button onClick={saveText} className="text-[#d4b58e] hud-title hover:text-white text-[10px] font-mono tracking-widest uppercase transition-colors flex items-center gap-1 font-bold">
                <i data-lucide="check" className="w-3 h-3" /> 确认
              </button>
            </div>
          )}
        </div>
      </>
    )
  }

  const handleBack = () => navigate('/functions/')

  return (
    <div id="badge-app" className="w-full h-full relative" ref={mainContentRef}
      style={{ fontFamily: "'Noto Serif SC', serif", backgroundColor: '#050505', color: '#e7e5e4', overflow: 'hidden' }}>
      <div className="noise-bg" />
      <main className="w-full h-full relative flex items-center justify-center"
        style={{ background: 'radial-gradient(ellipse at center, #1a1816, #0a0a0a, black)' }}>
        
        <div className="dynamic-radar" id="radar-bg">
          <div className="radar-circle" /><div className="radar-circle" /><div className="radar-circle" />
        </div>

        <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-black/40 border border-gray-800 px-4 py-2 rounded-full text-gray-500 text-xs font-serif-sc tracking-[0.2em] uppercase pointer-events-none flex items-center gap-3 z-20 shadow-sm backdrop-blur">
          <i data-lucide="scan-face" className="w-4 h-4 text-[#d4b58e] animate-pulse" />
          <span>点击文字以修改 / 拖拽以旋转视角</span>
        </div>

        <div className="scene" ref={sceneRef} onMouseDown={handleMouseDown}>
          <div className="badge-card" ref={badgeElRef} id="badge">
            <div className="glare" ref={glareRef} />

            <div className="card-face card-front flex flex-col relative" ref={frontContentRef}>
              <div className="h-2 w-full theme-gradient shadow-md relative z-10" />
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-3 bg-black rounded-full border border-gray-700 shadow-inner z-20" />

              <div className="flex-1 p-6 pt-10 flex flex-col relative">
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none text-[#d4b58e]">
                  <i data-lucide="eye" className="w-48 h-48" />
                </div>

                <div className="flex justify-between items-start mb-6 border-b border-gray-700 pb-3 relative z-10">
                  <div>
                    <div className="editable inline-block" data-field="company" data-side="left" onClick={(e) => { e.stopPropagation(); openEditor('company', e.currentTarget) }}>
                      <h2 className="font-black text-xl text-white font-serif-sc tracking-widest">{parseDisplayTitle(cardData.company, 'B.U.I.C.')}</h2>
                    </div>
                    <p className="text-[7px] font-mono tracking-widest uppercase mt-1 text-[#d4b58e]">Permanent Credential</p>
                  </div>
                  <div className={`w-8 h-8 rounded border flex items-center justify-center rotate-45 transition-colors duration-300 border-[#d4b58e]/30 bg-[#d4b58e]/10 ${cardData.isAwakened ? 'awakened-only diamond-awake-border' : 'normal-only'} shadow-sm`} data-field="tier" data-side="right">
                    <div ref={diamondInnerRef} className="-rotate-45 text-[#d4b58e] font-black font-serif-sc flex items-center justify-center transition-colors duration-300 diamond-awake-text">
                      {cardData.isAwakened ? '' : <i data-lucide="eye" className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 mb-5 relative z-10">
                  <div className="w-24 h-[116px] bg-black border-2 border-gray-700 rounded overflow-hidden relative shadow-inner shrink-0 group editable"
                    data-field="avatar" data-side="left" onClick={(e) => { e.stopPropagation(); openEditor('avatar', e.currentTarget) }}>
                    <div ref={avatarRef} id="card-avatar" className="absolute inset-0 bg-cover bg-center transition-all duration-300"
                      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&w=200&q=80')" }} />
                    <div className="absolute top-0 w-full h-[2px] bg-[#d4b58e]/50 opacity-50 shadow-[0_0_5px_#d4b58e] pointer-events-none theme-bg theme-border"
                      style={{ animation: 'radarExpand 3s linear infinite', animationName: 'scanDown' }} />
                  </div>
                  <div className="flex-1 flex flex-col justify-end">
                    <div className="mb-3">
                      <p className="text-[7px] text-gray-500 font-mono uppercase tracking-widest mb-0.5">Name / Callsign</p>
                      <div className="editable inline-block" data-field="name" data-side="right" onClick={(e) => { e.stopPropagation(); openEditor('name', e.currentTarget) }}>
                        <p className="text-[22px] font-black text-white font-serif-sc leading-none tracking-wide">{cardData.name.trim() || 'UNKNOWN'}</p>
                      </div>
                    </div>
                    <div className="mb-1">
                      <p className="text-[7px] text-gray-500 font-mono uppercase tracking-widest mb-0.5">Assigned Dept.</p>
                      <div className="editable inline-block" data-field="dept" data-side="right" onClick={(e) => { e.stopPropagation(); openEditor('dept', e.currentTarget) }}>
                        <p className="text-[11px] font-bold text-[#d4b58e] font-serif-sc leading-tight theme-text">{parseDisplayTitle(cardData.dept, 'UNKNOWN')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-3 gap-x-3 bg-black/40 p-3.5 rounded border border-gray-800 mb-4 relative z-10">
                  <div>
                    <p className="text-[7px] text-gray-500 font-mono uppercase tracking-wider mb-0.5 flex items-center gap-1"><i data-lucide="activity" className="w-2 h-2 text-gray-400" /> Gender</p>
                    <div className="editable inline-block" data-field="gender" data-side="left" onClick={(e) => { e.stopPropagation(); openEditor('gender', e.currentTarget) }}>
                      <p className="text-[11px] font-serif-sc text-gray-300 whitespace-nowrap">{cardData.gender}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[7px] text-gray-500 font-mono uppercase tracking-wider mb-0.5 flex items-center gap-1"><i data-lucide="lock" className="w-2 h-2 text-gray-600" /> Clearance</p>
                    <div className="inline-block">
                      <p className="text-[11px] font-serif-sc text-white uppercase">Silver</p>
                    </div>
                  </div>
                  <div className="border-t border-gray-800 pt-2.5">
                    <p className="text-[7px] text-gray-500 font-mono uppercase tracking-wider mb-0.5 flex items-center gap-1"><i data-lucide="calendar" className="w-2 h-2 text-gray-400" /> D.O.B</p>
                    <div className="editable inline-block" data-field="dob" data-side="left" onClick={(e) => { e.stopPropagation(); openEditor('dob', e.currentTarget) }}>
                      <p className="text-[11px] font-mono text-gray-300">{cardData.dob}</p>
                    </div>
                  </div>
                  <div className="border-t border-gray-800 pt-2.5">
                    <p className="text-[7px] text-gray-500 font-mono uppercase tracking-wider mb-0.5 flex items-center gap-1"><i data-lucide="log-in" className="w-2 h-2 text-gray-400" /> D.O.J</p>
                    <div className="editable inline-block" data-field="join" data-side="right" onClick={(e) => { e.stopPropagation(); openEditor('join', e.currentTarget) }}>
                      <p className="text-[11px] font-mono text-gray-300">{cardData.join}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-auto relative z-10 flex flex-col pt-2 border-t border-gray-800">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="grid grid-cols-5 grid-rows-2 gap-0.5 opacity-40">
                      <div className="w-1 h-1 bg-[#d4b58e] theme-bg" /><div className="w-1 h-1 bg-[#d4b58e] theme-bg" /><div className="w-1 h-1 bg-[#d4b58e] theme-bg" /><div className="w-1 h-1 bg-transparent border border-[#d4b58e] theme-border" /><div className="w-1 h-1 bg-[#d4b58e] theme-bg" />
                      <div className="w-1 h-1 bg-transparent border border-[#d4b58e] theme-border" /><div className="w-1 h-1 bg-[#d4b58e] theme-bg" /><div className="w-1 h-1 bg-transparent border border-[#d4b58e] theme-border" /><div className="w-1 h-1 bg-[#d4b58e] theme-bg" /><div className="w-1 h-1 bg-transparent border border-[#d4b58e] theme-border" />
                    </div>
                    <p ref={barcodeRef} className="text-[9px] font-mono text-gray-400 tracking-[0.1em] flex-1 break-all uppercase" />
                  </div>
                  <p className="text-[9px] font-serif-sc text-gray-500 font-bold bg-black/50 px-2 py-1 rounded border border-gray-800 tracking-wider">
                    Issued by the Headquarters in C.A.R.G.
                  </p>
                </div>
              </div>
            </div>

            <div className="card-face card-back flex flex-col" ref={backContentRef}>
              <div className="w-full h-[55px] bg-[#0a0a0a] mt-7 shadow-sm relative z-10 border-y border-[#1a1a1a]" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-700 pointer-events-none z-0"
                style={{ opacity: cardData.isAwakened ? 0.15 : 0 }}>
                <i data-lucide="hurricane" className="w-48 h-48 text-red-600" style={{ animation: 'fn-spin 30s linear infinite' }} />
              </div>
              <div className="px-7 py-5 relative z-10 flex-1 flex flex-col">
                <h3 className="theme-text font-black text-[13px] font-serif-sc mb-4 flex items-center gap-2 uppercase tracking-widest">
                  <i data-lucide="shield-check" className="w-[18px] h-[18px]" /> Official Directives
                </h3>
                <div className="text-[10px] text-gray-400 font-mono leading-[1.8] text-left space-y-4 mb-6">
                  <p className="flex items-start gap-2.5"><span className="theme-text font-black text-[18px] leading-[0.6] mt-[1px]">·</span><span>This credential grants the bearer unrestricted access to designated Continental Hubs and secure archives.</span></p>
                  <p className="flex items-start gap-2.5"><span className="theme-text font-black text-[18px] leading-[0.6] mt-[1px]">·</span><span>In the event of Abyss corruption or vital sign failure, this unit will initiate thermal self-destruction to prevent data breach.</span></p>
                  <p className="flex items-start gap-2.5"><span className="theme-text font-black text-[18px] leading-[0.6] mt-[1px]">·</span><span>Do not surrender this badge to unauthorized personnel. Knowledge is Eternal.</span></p>
                </div>
                <div className="mt-auto flex flex-col gap-1 w-full pt-4 border-t border-gray-900">
                  <div className="flex justify-between items-end w-full">
                    <div className="flex flex-col">
                      <span className="text-[7px] text-[#777] font-mono tracking-[0.2em] uppercase mb-1 flex items-center gap-1.5">
                        <i data-lucide="feather" className="w-2.5 h-2.5" /> Authorized Signature
                      </span>
                      <div className="relative w-36 h-8 border-b border-dashed border-[#333]">
                        <span className="absolute bottom-[-2px] left-4 text-[26px] text-[#d4b58e] opacity-60 whitespace-nowrap signature-font theme-text">Jimmy Huang</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 border border-[#333] bg-[#0a0a0a] flex items-center justify-center rounded overflow-hidden shadow-inner relative theme-border">
                      <div className="absolute inset-0 bg-[#d4b58e]/5 mix-blend-overlay theme-bg" />
                      <i data-lucide="fingerprint" className="w-8 h-8 text-[#555] opacity-80" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-center pb-5 text-[8px] font-mono text-[#444] tracking-[0.3em] uppercase relative z-10 border-t border-gray-900 mx-6 pt-4">
                PROPERTY OF A.C.U.P. AND Continental Alliance
              </div>
            </div>

            {activeEditEl && currentEditingField && renderEditorHUD()}
          </div>
        </div>

        <div className="absolute bottom-8 right-8 flex flex-col gap-4 z-40">
          <button id="download-btn" onClick={downloadBadge}
            className="w-14 h-14 bg-[#111] border border-stoneBorder hover:border-[#d4b58e] text-gray-400 hover:text-[#d4b58e] rounded-full shadow-2xl flex items-center justify-center transition-all group relative">
            <i data-lucide="download" className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
          </button>
          <button onClick={toggleAwakenedMode}
            className="w-14 h-14 bg-[#111] border border-stoneBorder hover:border-red-500 text-gray-400 hover:text-red-500 rounded-full shadow-2xl flex items-center justify-center transition-all group relative overflow-hidden">
            <i data-lucide="flame" className="w-6 h-6 relative z-10 group-hover:scale-110 transition-transform" />
          </button>
          <button onClick={handleBack}
            className="w-14 h-14 bg-[#111] border border-stoneBorder hover:border-[#d4b58e] text-gray-400 hover:text-[#d4b58e] rounded-full shadow-2xl flex items-center justify-center transition-all">
            <i data-lucide="arrow-left" className="w-6 h-6" />
          </button>
        </div>
      </main>
    </div>
  )
}

export default BadgePage
