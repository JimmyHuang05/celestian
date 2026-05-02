import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'
import Starfield from '../components/encyclopedia/Starfield.jsx'
import DataNode from '../components/encyclopedia/DataNode.jsx'
import StandardDetail from '../components/encyclopedia/StandardDetail.jsx'
import GalleryDetail from '../components/encyclopedia/GalleryDetail.jsx'
import AeonDetail from '../components/encyclopedia/AeonDetail.jsx'

const supabaseUrl = 'https://qunhjfulchaurfxtjoeg.supabase.co'
const supabaseKey = 'sb_publishable_Nkbcb5N92HUqJAGB9TYnJQ_W_09BC-T'
let supabaseClient = null
try {
  supabaseClient = createClient(supabaseUrl, supabaseKey)
} catch (e) {
  console.error('Supabase 初始化失败', e)
}

const desktopNodes = [
  { id: 'aeons', layer: 0, title: '神', subtitle: '神祇', icon: '/data/images/icons/aeons.svg', current: 0, total: 14, alien: 'A E O N S', pos: { top: '55%', left: '50%' }, scale: 1.3 },
  { id: 'characters', layer: 1, title: '角色', subtitle: '角色', icon: '/data/images/icons/characters.svg', current: 0, total: 7, alien: 'C H A R A C T E R', pos: { top: '40%', left: '65%' }, scale: 1.1 },
  { id: 'enemies', layer: 2, title: '敌对物种', subtitle: '敌对物种', icon: '/data/images/icons/enemies.svg', current: 0, total: 27, alien: 'B E A S T M U T A T I O N', pos: { top: '30%', left: '35%' }, scale: 0.9 },
  { id: 'relics', layer: 3, title: '圣物', subtitle: '圣物', icon: '/data/images/icons/relics.svg', current: 0, total: 12, alien: 'A R T I F A C T S', pos: { top: '76%', left: '72%' }, scale: 0.85 },
  { id: 'factions', layer: 4, title: '势力', subtitle: '势力', icon: '/data/images/icons/factions.svg', current: 0, total: 25, alien: 'F A C T I O N S', pos: { top: '65%', left: '30%' }, scale: 0.85 },
  { id: 'gallery', layer: 5, title: '留影', subtitle: '视觉档案', icon: '/data/images/icons/titans.svg', current: 0, total: 11, alien: 'G A L L E R Y', pos: { top: '50%', left: '18%' }, scale: 0.75 },
  { id: 'terms', layer: 6, title: '专有名词', subtitle: '专有名词', icon: '/data/images/icons/terms.svg', current: 0, total: 129, alien: 'I N D E X T E R M S', pos: { top: '50%', left: '80%' }, scale: 0.75 },
]

const mobileNodes = [
  { id: 'aeons', layer: 0, title: '神', subtitle: '神祇', icon: '/data/images/icons/aeons.svg', current: 0, total: 14, alien: 'A E O N S', pos: { top: '50%', left: '50%' }, scale: 1.1 },
  { id: 'characters', layer: 1, title: '角色', subtitle: '角色', icon: '/data/images/icons/characters.svg', current: 0, total: 7, alien: 'C H A R A C T E R', pos: { top: '32%', left: '25%' }, scale: 0.9 },
  { id: 'enemies', layer: 2, title: '敌对物种', subtitle: '敌对物种', icon: '/data/images/icons/enemies.svg', current: 0, total: 27, alien: 'B E A S T M U T A T I O N', pos: { top: '70%', left: '28%' }, scale: 0.8 },
  { id: 'relics', layer: 3, title: '圣物', subtitle: '圣物', icon: '/data/images/icons/relics.svg', current: 0, total: 12, alien: 'A R T I F A C T S', pos: { top: '25%', left: '75%' }, scale: 0.75 },
  { id: 'factions', layer: 4, title: '势力', subtitle: '势力', icon: '/data/images/icons/factions.svg', current: 0, total: 25, alien: 'F A C T I O N S', pos: { top: '65%', left: '75%' }, scale: 0.75 },
  { id: 'gallery', layer: 5, title: '留影', subtitle: '视觉档案', icon: '/data/images/icons/titans.svg', current: 0, total: 11, alien: 'G A L L E R Y', pos: { top: '85%', left: '60%' }, scale: 0.65 },
  { id: 'terms', layer: 6, title: '专有名词', subtitle: '专有名词', icon: '/data/images/icons/terms.svg', current: 0, total: 129, alien: 'I N D E X T E R M S', pos: { top: '15%', left: '50%' }, scale: 0.65 },
]

function EncyclopediaPage() {
  const navigate = useNavigate()
  const { nodeId } = useParams()
  const [searchParams] = useSearchParams()
  const entryId = searchParams.get('id')

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  const allNodes = isMobile ? mobileNodes : desktopNodes

  const nodeFromUrl = nodeId ? allNodes.find(n => n.id === nodeId) || null : null

  const [nodes, setNodes] = useState(allNodes)
  const [activeNode, setActiveNode] = useState(nodeFromUrl)
  const [mouseX, setMouseX] = useState(0)
  const [mouseY, setMouseY] = useState(0)
  const [isPlayingBgm, setIsPlayingBgm] = useState(true)
  const [ripples, setRipples] = useState([])
  const [isTransitioning, setIsTransitioning] = useState(false)

  const bgmAudioRef = useRef(null)
  const hoverAudioRef = useRef(null)
  const animationFrameRef = useRef(null)
  const targetX = useRef(0)
  const targetY = useRef(0)
  const currentMouseX = useRef(0)
  const currentMouseY = useRef(0)

  const lightState = useRef({
    center: { x: 0, y: 0 },
    width: 10,
    height: 10,
    borderRadius: '50%',
    opacity: 1,
    color: 'white',
    active: false,
    transition: 'none',
  })

  const [lightStyle, setLightStyle] = useState({
    display: 'none',
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: 200,
    left: '50%',
    top: '50%',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    opacity: 1,
    transform: 'translate(-50%, -50%)',
    transition: 'none',
    backgroundColor: '#f9fafb',
    boxShadow: '0 0 80px rgba(255,255,255,0.2)',
  })

  const currentDetailComponent = useCallback(() => {
    if (!activeNode) return null
    if (activeNode.id === 'gallery') return 'GalleryDetail'
    if (activeNode.id === 'aeons') return 'AeonDetail'
    return 'StandardDetail'
  }, [activeNode])

  useEffect(() => {
    const updateParallax = () => {
      if (Number.isFinite(targetX.current)) {
        currentMouseX.current += (targetX.current - currentMouseX.current) * 0.05
      }
      if (Number.isFinite(targetY.current)) {
        currentMouseY.current += (targetY.current - currentMouseY.current) * 0.05
      }
      setMouseX(currentMouseX.current)
      setMouseY(currentMouseY.current)
      animationFrameRef.current = requestAnimationFrame(updateParallax)
    }
    animationFrameRef.current = requestAnimationFrame(updateParallax)
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    }
  }, [])

  const onMouseMove = useCallback((e) => {
    const w = window.innerWidth || 1
    const h = window.innerHeight || 1
    targetX.current = (e.clientX / w - 0.5) * 2
    targetY.current = (e.clientY / h - 0.5) * 2
  }, [])

  const onTouchMove = useCallback((e) => {
    if (e.touches.length > 0) {
      const w = window.innerWidth || 1
      const h = window.innerHeight || 1
      targetX.current = (e.touches[0].clientX / w - 0.5) * 2
      targetY.current = (e.touches[0].clientY / h - 0.5) * 2
    }
  }, [])

  const playHoverSfx = useCallback(() => {
    if (hoverAudioRef.current && hoverAudioRef.current.src !== '' && !hoverAudioRef.current.src.endsWith(window.location.pathname)) {
      hoverAudioRef.current.currentTime = 0
      hoverAudioRef.current.play().catch(() => {})
    }
  }, [])

  const toggleBgm = useCallback(() => {
    if (!bgmAudioRef.current) return
    if (isPlayingBgm) {
      bgmAudioRef.current.pause()
    } else {
      bgmAudioRef.current.play().catch(() => {})
    }
    setIsPlayingBgm(prev => !prev)
  }, [isPlayingBgm])

  useEffect(() => {
    if (bgmAudioRef.current) {
      bgmAudioRef.current.volume = 0.25
      bgmAudioRef.current.play().catch((e) => {
        const startBgm = () => {
          if (isPlayingBgm && bgmAudioRef.current) bgmAudioRef.current.play().catch(() => {})
          document.removeEventListener('click', startBgm)
          document.removeEventListener('touchstart', startBgm)
        }
        document.addEventListener('click', startBgm)
        document.addEventListener('touchstart', startBgm)
      })
    }
    if (hoverAudioRef.current) hoverAudioRef.current.volume = 0.05
  }, [])

  useEffect(() => {
    const fetchNodeCounts = async () => {
      if (!supabaseClient) return
      try {
        const { data, error } = await supabaseClient.from('entries').select('node_id')
        if (error) throw error
        const counts = {}
        data.forEach(row => { counts[row.node_id] = (counts[row.node_id] || 0) + 1 })
        setNodes(prev => prev.map(node => ({ ...node, current: counts[node.id] || 0 })))
      } catch (err) {
        console.error('获取节点进度失败:', err)
      }
    }
    fetchNodeCounts()
  }, [])

  useEffect(() => {
    if (nodeFromUrl) {
      setActiveNode(nodeFromUrl)
    } else {
      setActiveNode(null)
    }
  }, [nodeId])

  const openDetail = useCallback((node, event) => {
    if (isTransitioning) return
    setIsTransitioning(true)

    const bgColors = {
      aeons: '#070709',
      gallery: '#050505',
    }
    const bgColor = bgColors[node.id] || '#f9fafb'
    const isDark = bgColor !== '#f9fafb'

    let cx = window.innerWidth / 2
    let cy = window.innerHeight / 2
    if (event && event.currentTarget) {
      const rect = event.currentTarget.getBoundingClientRect()
      cx = rect.left + rect.width / 2
      cy = rect.top + rect.height / 2
    }

    let targetW = 1024, targetH = window.innerHeight * 0.75, targetRadius = '1rem'
    if (isMobile) { targetW = window.innerWidth; targetH = window.innerHeight; targetRadius = '0' }
    else if (window.innerWidth >= 768 && window.innerWidth * 0.8333 < 1024) targetW = window.innerWidth * 0.8333

    setLightStyle({
      display: 'block',
      position: 'fixed',
      pointerEvents: 'none',
      zIndex: 200,
      left: cx + 'px',
      top: cy + 'px',
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      opacity: 1,
      transform: 'translate(-50%, -50%)',
      transition: 'none',
      backgroundColor: bgColor,
      boxShadow: isDark ? '0 0 80px rgba(0,0,0,0.8)' : '0 0 80px rgba(255,255,255,0.2)',
    })

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setLightStyle(prev => ({
          ...prev,
          transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1), height 0.5s cubic-bezier(0.4, 0, 0.2, 1), left 0.5s cubic-bezier(0.4, 0, 0.2, 1), top 0.5s cubic-bezier(0.4, 0, 0.2, 1), border-radius 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          left: '50%',
          top: '50%',
          width: targetW + 'px',
          height: targetH + 'px',
          borderRadius: targetRadius,
          transform: 'translate(-50%, -50%)',
          backgroundColor: bgColor,
        }))

        setTimeout(() => {
          navigate(`/encyclopedia/${node.id}`)
          setLightStyle(prev => ({ ...prev, display: 'none' }))
          setIsTransitioning(false)
        }, 500)
      })
    })
  }, [isMobile, isTransitioning, navigate])

  const closeDetail = useCallback(() => {
    navigate('/encyclopedia')
  }, [navigate])

  const handleBack = useCallback(() => {
    navigate('/')
  }, [navigate])

  const onEntryChange = useCallback((id) => {
    if (nodeId && id) {
      navigate(`/encyclopedia/${nodeId}?id=${id}`, { replace: true })
    }
  }, [nodeId, navigate])

  const renderDetailComponent = () => {
    if (!activeNode) return null
    const compType = currentDetailComponent()
    const commonProps = { node: activeNode, isMobile, onClose: closeDetail, supabaseClient, entryId, onEntryChange }
    if (compType === 'StandardDetail') return <StandardDetail {...commonProps} />
    if (compType === 'GalleryDetail') return <GalleryDetail {...commonProps} />
    if (compType === 'AeonDetail') return <AeonDetail {...commonProps} />
    return null
  }

  return (
    <div id="encyclopedia-app">
      {nodeId ? (
        <div className="w-full h-screen overflow-hidden" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Serif SC', sans-serif" }}>
          {renderDetailComponent()}
          <div style={lightStyle} />
        </div>
      ) : (
      <div className="relative w-full h-screen overflow-hidden font-sans select-none bg-gray-900 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"
        onMouseMove={onMouseMove} onTouchMove={onTouchMove} onContextMenu={(e) => e.preventDefault()}
      >
        <Starfield mouseX={mouseX} mouseY={mouseY} onRipples={setRipples} />

        <div className="absolute top-6 left-6 z-[150]">
          <button onClick={handleBack}
            className="flex items-center gap-2 text-[#d4b58e]/40 hover:text-[#d4b58e]/80 transition-colors text-[10px] font-mono tracking-[0.4em] uppercase cursor-pointer group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span>HOME</span>
          </button>
        </div>

        <div className="absolute inset-0 z-10">
          <div className="absolute inset-0 pointer-events-none z-[1]" style={{ transform: `translate(${-mouseX * 8}px, ${-mouseY * 8}px)` }}>
            <div className="milky-way" />
          </div>

          <div className="absolute inset-0" style={{ zIndex: 20 }}>
            {nodes.map(node => (
              <DataNode
                key={node.id}
                node={node}
                mouseX={mouseX}
                mouseY={mouseY}
                isMobile={isMobile}
                onHoverNode={playHoverSfx}
                onClickNode={openDetail}
              />
            ))}
          </div>

          <div className="absolute top-6 left-8 text-[#d4b58e]/40 font-mono text-[10px] tracking-[0.6em] flex items-center gap-4" style={{ zIndex: 30 }}>
            <span className="w-12 h-px bg-[#d4b58e]/30" /> D A T A B A N K // G A L A X Y
          </div>

          <div className="absolute bottom-4 left-6 flex items-center gap-3 hardware-accelerated" style={{ zIndex: 30 }}>
            <div className="w-1 h-1 bg-[#d4b58e] opacity-50 rounded-full animate-ping" />
            <div className="text-[#d4b58e]/30 text-[10px] font-mono tracking-widest">SYS.UID: 1008611</div>
          </div>

          <div className="absolute bottom-6 right-8 flex items-center gap-3 cursor-pointer group hardware-accelerated" style={{ zIndex: 150 }} onClick={toggleBgm}>
            <div className="text-[#d4b58e]/30 text-[10px] font-mono tracking-widest group-hover:text-[#d4b58e]/80 transition-colors uppercase drop-shadow-md">
              {isPlayingBgm ? 'BGM : ON' : 'BGM : OFF'}
            </div>
            <div className="w-8 h-8 rounded-full border border-[#d4b58e]/20 flex items-center justify-center group-hover:border-[#d4b58e]/60 group-hover:bg-[#d4b58e]/10 transition-all bg-black/20 backdrop-blur-sm">
              {isPlayingBgm ? (
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#d4b58e]" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#d4b58e]/50" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L9 17.25H4.5A2.25 2.25 0 012.25 15V9A2.25 2.25 0 014.5 6.75h3.8l7.039-3.328a2.25 2.25 0 012.254.103z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 10.5l-3 3m0-3l3 3" />
                </svg>
              )}
            </div>
          </div>
        </div>

        <div style={lightStyle} />

        <audio ref={bgmAudioRef} autoPlay loop src="/data/audio/bgm/encyclopedia.mp3" />
        <audio ref={hoverAudioRef} src="/data/audio/sfx/hover.mp3" />
      </div>
      )}
    </div>
  )
}

export default EncyclopediaPage
