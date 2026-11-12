import { getSoundManager } from '../sound-manager.js'
import { pageUrl } from '../page-registry.js'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { fetchEntryCounts } from '../lib/entries-api.js'
import StaticStarfield from '../components/encyclopedia/StaticStarfield.jsx'
import GalaxyVeil from '../components/encyclopedia/GalaxyVeil.jsx'
import { galaxyTextureMask } from '../components/encyclopedia/galaxyDensity.js'
import DataNode from '../components/encyclopedia/DataNode.jsx'
import StandardDetail from '../components/encyclopedia/StandardDetail.jsx'
import AeonDetail from '../components/encyclopedia/AeonDetail.jsx'
import '../page-actions.css'
import './encyclopedia.css'
import VersionBadge from '../components/VersionBadge.jsx'
import ASSETS_BASE from '../constants.js'
import { openCharacterProfile } from '../profile-navigation.js'
import useGalaxyArrival from '../components/encyclopedia/useGalaxyArrival.js'
import { openMusicPage } from '../music-navigation.js'

const desktopNodes = [
  { id: 'aeons', layer: 0, title: '神', subtitle: '神祇', icon: '/images/icons/aeons.svg', current: 0, total: 14, alien: 'A E O N S', pos: { top: '55%', left: '50%' }, scale: 1.3 },
  { id: 'characters', layer: 1, title: '角色', subtitle: '角色', icon: '/images/icons/characters.svg', current: 0, total: 7, alien: 'C H A R A C T E R', pos: { top: '40%', left: '65%' }, scale: 1.1 },
  { id: 'enemies', layer: 2, title: '敌对物种', subtitle: '敌对物种', icon: '/images/icons/enemies.svg', current: 0, total: 27, alien: 'B E A S T M U T A T I O N', pos: { top: '30%', left: '35%' }, scale: 0.9 },
  { id: 'relics', layer: 3, title: '圣物', subtitle: '圣物', icon: '/images/icons/relics.svg', current: 0, total: 12, alien: 'A R T I F A C T S', pos: { top: '76%', left: '72%' }, scale: 0.85 },
  { id: 'factions', layer: 4, title: '势力', subtitle: '势力', icon: '/images/icons/factions.svg', current: 0, total: 25, alien: 'F A C T I O N S', pos: { top: '65%', left: '30%' }, scale: 0.85 },
  { id: 'gallery', layer: 5, title: '留影', subtitle: '视觉档案', destination: '/map/', icon: '/images/icons/titans.svg', current: 0, total: 11, alien: 'G A L L E R Y', pos: { top: '50%', left: '18%' }, scale: 0.75 },
  { id: 'terms', layer: 6, title: '专有名词', subtitle: '专有名词', icon: '/images/icons/terms.svg', current: 0, total: 129, alien: 'I N D E X T E R M S', pos: { top: '50%', left: '80%' }, scale: 0.75 },
]

const mobileNodes = [
  { id: 'aeons', layer: 0, title: '神', subtitle: '神祇', icon: '/images/icons/aeons.svg', current: 0, total: 14, alien: 'A E O N S', pos: { top: '50%', left: '50%' }, scale: 1.1 },
  { id: 'characters', layer: 1, title: '角色', subtitle: '角色', icon: '/images/icons/characters.svg', current: 0, total: 7, alien: 'C H A R A C T E R', pos: { top: '32%', left: '25%' }, scale: 0.9 },
  { id: 'enemies', layer: 2, title: '敌对物种', subtitle: '敌对物种', icon: '/images/icons/enemies.svg', current: 0, total: 27, alien: 'B E A S T M U T A T I O N', pos: { top: '70%', left: '28%' }, scale: 0.8 },
  { id: 'relics', layer: 3, title: '圣物', subtitle: '圣物', icon: '/images/icons/relics.svg', current: 0, total: 12, alien: 'A R T I F A C T S', pos: { top: '25%', left: '75%' }, scale: 0.75 },
  { id: 'factions', layer: 4, title: '势力', subtitle: '势力', icon: '/images/icons/factions.svg', current: 0, total: 25, alien: 'F A C T I O N S', pos: { top: '65%', left: '75%' }, scale: 0.75 },
  { id: 'gallery', layer: 5, title: '留影', subtitle: '视觉档案', destination: '/map/', icon: '/images/icons/titans.svg', current: 0, total: 11, alien: 'G A L L E R Y', pos: { top: '85%', left: '60%' }, scale: 0.65 },
  { id: 'terms', layer: 6, title: '专有名词', subtitle: '专有名词', icon: '/images/icons/terms.svg', current: 0, total: 129, alien: 'I N D E X T E R M S', pos: { top: '15%', left: '50%' }, scale: 0.65 },
]

const bgColors = {
  aeons: '#070709',
  gallery: '#050505',
}

function EncyclopediaPage({ onArrivalReady }) {
  const arrival = useGalaxyArrival(onArrivalReady)
  const navigate = useNavigate()
  const { nodeId } = useParams()
  const [searchParams] = useSearchParams()
  const entryId = searchParams.get('id')

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  const allNodes = isMobile ? mobileNodes : desktopNodes
  const arrivalOrder = [...allNodes].sort((a, b) => a.scale - b.scale || a.layer - b.layer)

  const nodeFromUrl = nodeId ? allNodes.find(n => n.id === nodeId) || null : null

  const [nodes, setNodes] = useState(allNodes)
  const [activeNode, setActiveNode] = useState(nodeFromUrl)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  const [panelStyle, setPanelStyle] = useState(null)

  const hasEverHadEntryId = useRef(false)

  useEffect(() => {
    if (entryId) {
      hasEverHadEntryId.current = true
    }
    if (nodeId && !entryId && hasEverHadEntryId.current) {
      navigate('/encyclopedia', { replace: true })
      hasEverHadEntryId.current = false
    }
    if (!nodeId) {
      hasEverHadEntryId.current = false
      setPanelStyle(null)
      setIsClosing(false)
      setIsTransitioning(false)
    }
  }, [entryId, nodeId, navigate])

  const playHoverSfx = useCallback(() => {
    getSoundManager().play('hover')
  }, [])

  useEffect(() => {
    const countsRequest = new AbortController()
    const fetchNodeCounts = async () => {
      try {
        const data = await fetchEntryCounts(countsRequest.signal)
        if (countsRequest.signal.aborted) return
        const counts = {}
        data.forEach(row => { counts[row.node_id] = Number(row.count) || 0 })
        setNodes(prev => prev.map(node => ({ ...node, current: node.id === 'factions' ? node.current : counts[node.id] || 0 })))
      } catch (err) {
        if (!countsRequest.signal.aborted) console.error('获取节点进度失败:', err)
      }
    }
    fetchNodeCounts()
    const archiveRequest = new AbortController()
    fetch('/faction-profile/factions.json', { signal: archiveRequest.signal })
      .then(response => { if (!response.ok) throw new Error('Archive unavailable'); return response.json() })
      .then(entries => { if (Array.isArray(entries)) setNodes(prev => prev.map(node => node.id === 'factions' ? { ...node, current: entries.length } : node)) })
      .catch(() => {})
    return () => { countsRequest.abort(); archiveRequest.abort() }
  }, [])

  useEffect(() => {
    if (nodeFromUrl) {
      if (nodeFromUrl.id === 'factions') {
        navigate('/encyclopedia', { replace: true })
        const target = pageUrl('factions') + (entryId ? `?id=${encodeURIComponent(entryId)}` : '')
        setTimeout(() => openMusicPage(target), 0)
        return;
      }
      if (nodeFromUrl.id === 'characters') {
        const target = `/character-profile.html${window.location.search}`
        navigate('/encyclopedia', { replace: true })
        setTimeout(() => openCharacterProfile(target), 0)
        return
      }
      setActiveNode(nodeFromUrl)
    } else {
      setActiveNode(null)
    }
  }, [nodeId])

  const openDetail = useCallback((node, event) => {
    if (node.destination) {
      navigate(node.destination)
      return
    }
    if (node.id === 'factions') {
      openMusicPage(pageUrl('factions'));
      return;
    }
    if (node.id === 'characters') {
      openCharacterProfile('/character-profile.html')
      return
    }
    if (isTransitioning) return
    setIsTransitioning(true)

    const bgColor = bgColors[node.id] || '#f9fafb'

    let cx = window.innerWidth / 2
    let cy = window.innerHeight / 2
    if (event && event.currentTarget) {
      const rect = event.currentTarget.getBoundingClientRect()
      cx = rect.left + rect.width / 2
      cy = rect.top + rect.height / 2
    }

    let targetW = 1024, targetH = window.innerHeight * 0.75, targetRadius = '1rem'
    if (isMobile || node.id === 'gallery') { targetW = window.innerWidth; targetH = window.innerHeight; targetRadius = '0' }
    else if (window.innerWidth >= 768 && window.innerWidth * 0.8333 < 1024) targetW = window.innerWidth * 0.8333

    setPanelStyle({
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
    })

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setPanelStyle({
          position: 'fixed',
          pointerEvents: 'none',
          zIndex: 200,
          left: '50%',
          top: '50%',
          width: targetW + 'px',
          height: targetH + 'px',
          borderRadius: targetRadius,
          opacity: 1,
          transform: 'translate(-50%, -50%)',
          transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1), height 0.5s cubic-bezier(0.4, 0, 0.2, 1), left 0.5s cubic-bezier(0.4, 0, 0.2, 1), top 0.5s cubic-bezier(0.4, 0, 0.2, 1), border-radius 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          backgroundColor: bgColor,
        })

        setTimeout(() => {
          setIsTransitioning(false)
          navigate(`/encyclopedia/${node.id}`)
        }, 500)
      })
    })
  }, [isMobile, isTransitioning, navigate])

  const closeDetail = useCallback(() => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setIsClosing(true)
    setPanelStyle(prev => ({
      ...prev,
      transition: 'width 0.35s ease, height 0.35s ease, opacity 0.25s ease',
      width: '0',
      height: '0',
      opacity: 0,
      borderRadius: '50%',
    }))
    setTimeout(() => {
      navigate('/encyclopedia', { replace: true })
      setPanelStyle(null)
      setIsClosing(false)
      setIsTransitioning(false)
    }, 380)
  }, [isTransitioning, navigate])

  const onEntryChange = useCallback((id) => {
    if (nodeId && id) {
      navigate(`/encyclopedia/${nodeId}?id=${id}`, { replace: true })
    }
  }, [nodeId, navigate])

  const renderDetailComponent = () => {
    if (!activeNode) return null
    const compType = activeNode.id === 'aeons' ? 'AeonDetail' : 'StandardDetail'
    const commonProps = { node: activeNode, isMobile, onClose: closeDetail, entryId, onEntryChange }
    if (compType === 'StandardDetail') return <StandardDetail {...commonProps} />
    if (compType === 'AeonDetail') return <AeonDetail {...commonProps} />
    return null
  }

  return (
    <div id="encyclopedia-app" data-arrival={arrival.phase || undefined} tabIndex={-1} aria-busy={Boolean(arrival.phase)}>
      <div inert={Boolean(nodeId)} aria-hidden={Boolean(nodeId)} className="encyclopedia-sky relative w-full h-screen overflow-hidden font-serif select-none bg-gray-900"
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="encyclopedia-arrival-texture absolute inset-0 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" style={{ maskImage: galaxyTextureMask, maskSize: '100% 100%', maskRepeat: 'no-repeat' }} aria-hidden="true" />
        <div className="encyclopedia-arrival-stars absolute inset-0 pointer-events-none">
          {activeNode?.id !== 'gallery' && <StaticStarfield />}
        </div>
        <div className="encyclopedia-arrival-stars absolute inset-0 pointer-events-none z-[1]">
          {activeNode?.id !== 'gallery' && <GalaxyVeil />}
        </div>



        <div inert={Boolean(arrival.phase)} className="encyclopedia-arrival-content absolute inset-0 z-10">
          <div className="absolute inset-0" style={{ zIndex: 20 }}>
            {nodes.map(node => (
              <DataNode
                key={node.id}
                node={node}
                arrivalOrder={arrivalOrder.findIndex(item => item.id === node.id)}
                isMobile={isMobile}
                onHoverNode={playHoverSfx}
                onClickNode={openDetail}
              />
            ))}
          </div>

          <VersionBadge position="bottom-right" />
        </div>

      </div>

      {panelStyle && <div style={panelStyle} />}

      {nodeId && nodeFromUrl && (
        <div className={`fixed inset-0 z-[201] transition-opacity duration-200 ${isClosing ? 'opacity-0' : 'opacity-100'}`} style={{ fontFamily: "var(--font-body)" }}>
          {renderDetailComponent()}
        </div>
      )}
    </div>
  )
}

export default EncyclopediaPage
