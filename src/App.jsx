import { useState, useEffect, useRef, useCallback } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import VersionBadge from './components/VersionBadge.jsx'
import EncyclopediaPage from './pages/EncyclopediaPage.jsx'
import MapPage from './pages/MapPage.jsx'
import FunctionsPage from './pages/FunctionsPage.jsx'
import BadgePage from './pages/BadgePage.jsx'
import ASSETS_BASE from './constants.js'

function App() {
  const bgCanvasRef = useRef(null)
  const bgMusicRef = useRef(null)
  const heroPlaceholderRef = useRef(null)
  const heroCardRef = useRef(null)
  const heroCardInnerRef = useRef(null)
  const heroCardFrontRef = useRef(null)
  const heroBgImgRef = useRef(null)
  const heroHoverLayerRef = useRef(null)
  const otherCardsRef = useRef(null)
  const appContainerRef = useRef(null)
  const foregroundLayerRef = useRef(null)

  const [isMusicPlaying, setIsMusicPlaying] = useState(false)

  const introStateRef = useRef(0)
  const isOverlayVisibleRef = useRef(false)
  const deviceTypeRef = useRef('desktop')
  const isTouchDeviceRef = useRef(false)

  const visibleCardsRef = useRef(new Map())
  const scrollObserverRef = useRef(null)
  const resizeTimerRef = useRef(null)
  const canvasResizeTimerRef = useRef(null)
  const migrateToGridRef = useRef(null)

  const location = useLocation()

  const getDeviceType = useCallback(() => {
    const ua = navigator.userAgent
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'tablet'
    if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) return 'mobile'
    return 'desktop'
  }, [])

  useEffect(() => {
    deviceTypeRef.current = getDeviceType()
    isTouchDeviceRef.current = (deviceTypeRef.current !== 'desktop')
    document.documentElement.classList.add('yishan-loaded')
  }, [getDeviceType])

  function toggleMusic(forcePlay = false) {
    const bgMusic = bgMusicRef.current
    if (!bgMusic) return
    if (isMusicPlaying && !forcePlay) {
      bgMusic.pause()
      setIsMusicPlaying(false)
    } else if (!isMusicPlaying) {
      bgMusic.play().catch(e => console.log('Autoplay blocked', e))
      setIsMusicPlaying(true)
    }
    if (window.lucide) window.lucide.createIcons()
  }

  useEffect(() => {
    const audioStateKey = 'eden_bgm_state'
    const savedAudioState = sessionStorage.getItem(audioStateKey)
    if (savedAudioState) {
      try {
        const state = JSON.parse(savedAudioState)
        if (bgMusicRef.current) bgMusicRef.current.currentTime = state.currentTime || 0
        if (state.isPlaying && bgMusicRef.current) {
          bgMusicRef.current.play().then(() => {
            setIsMusicPlaying(true)
            if (window.lucide) window.lucide.createIcons()
          }).catch(e => {
            console.log('跨页面自动播放被拦截，需要用户交互', e)
          })
        }
      } catch (e) {
        console.error('解析音乐状态失败', e)
      }
    }

    const handleBeforeUnload = () => {
      const bgMusic = bgMusicRef.current
      if (bgMusic) {
        sessionStorage.setItem(audioStateKey, JSON.stringify({
          isPlaying: !bgMusic.paused,
          currentTime: bgMusic.currentTime
        }))
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    const handleVisibilityChange = () => {
      if (document.hidden && bgMusicRef.current) {
        bgMusicRef.current.pause()
        setIsMusicPlaying(false)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  useEffect(() => {
    const foregroundLayer = foregroundLayerRef.current
    if (foregroundLayer) foregroundLayer.classList.add('animate-fade-in')
  })

  useEffect(() => {
    if (window.lucide) window.lucide.createIcons()
  })

  useEffect(() => {
    const otherCards = otherCardsRef.current
    const heroPlaceholder = heroPlaceholderRef.current
    const heroCard = heroCardRef.current
    const heroCardInner = heroCardInnerRef.current
    const heroCardFront = heroCardFrontRef.current
    const heroBgImg = heroBgImgRef.current
    const heroHoverLayer = heroHoverLayerRef.current
    const appContainer = appContainerRef.current

    if (!heroCard || !heroPlaceholder || !otherCards || !appContainer) return

    function setupIntro() {
      introStateRef.current = 0
      appContainer.style.overflow = 'hidden'
      const rect = heroPlaceholder.getBoundingClientRect()
      heroCard.style.transition = 'none'
      heroCard.style.position = 'absolute'
      heroCard.style.width = rect.width + 'px'
      heroCard.style.height = rect.height + 'px'
      heroCard.style.right = 'auto'
      heroCard.style.bottom = 'auto'
      heroCard.style.top = '50%'
      heroCard.style.left = '50%'
      heroCard.style.zIndex = '50'
      const currentScale = window.innerWidth < 1024 ? 1.05 : 1.25
      heroCard.style.transform = `translate(-50%, -50%) scale(${currentScale})`
      appContainer.appendChild(heroCard)
      void heroCard.offsetWidth
    }

    function skipToGrid() {
      introStateRef.current = 2
      sessionStorage.setItem('hasSeenIntro', 'true')
      appContainer.style.overflow = ''
      if (heroCardFront) {
        heroCardFront.classList.remove('animate-pulse-slow', 'shadow-[0_0_25px_rgba(212,181,142,0.4)]')
      }
      heroCard.classList.add('hover:scale-[1.04]', 'hover:shadow-[0_20px_40px_rgba(212,181,142,0.3)]', 'hover:z-20')
      heroCard.style.position = 'absolute'
      heroCard.style.transition = 'none'
      heroCard.style.top = '0'
      heroCard.style.left = '0'
      heroCard.style.right = 'auto'
      heroCard.style.bottom = 'auto'
      heroCard.style.width = '100%'
      heroCard.style.height = '100%'
      heroCard.style.transform = ''
      if (heroCard.parentNode !== heroPlaceholder) {
        heroPlaceholder.appendChild(heroCard)
      }
      otherCards.style.transition = 'none'
      otherCards.classList.remove('opacity-0', 'pointer-events-none')
      otherCards.style.opacity = '1'
    }

    function migrateToGrid() {
      if (introStateRef.current >= 2) return
      introStateRef.current = 2
      sessionStorage.setItem('hasSeenIntro', 'true')
      if (heroCardInner) heroCardInner.style.transform = 'rotateY(0deg)'
      const currentScale = window.innerWidth < 1024 ? 1.05 : 1.25
      const heroStartRect = heroCard.getBoundingClientRect()
      heroPlaceholder.style.display = 'none'
      const otherCardsStartRect = otherCards.getBoundingClientRect()
      heroPlaceholder.style.display = ''
      heroCard.style.transition = 'none'
      heroCard.style.position = 'absolute'
      heroCard.style.top = '0'
      heroCard.style.left = '0'
      heroCard.style.right = 'auto'
      heroCard.style.bottom = 'auto'
      heroCard.style.width = '100%'
      heroCard.style.height = '100%'
      heroCard.style.transform = ''
      heroCard.style.zIndex = '50'
      heroPlaceholder.appendChild(heroCard)
      void heroPlaceholder.offsetWidth
      void otherCards.offsetWidth
      const heroDestRect = heroCard.getBoundingClientRect()
      const otherCardsDestRect = otherCards.getBoundingClientRect()
      const heroMoveX = (heroStartRect.left + heroStartRect.width / 2) - (heroDestRect.left + heroDestRect.width / 2)
      const heroMoveY = (heroStartRect.top + heroStartRect.height / 2) - (heroDestRect.top + heroDestRect.height / 2)
      const otherMoveX = otherCardsStartRect.left - otherCardsDestRect.left
      const otherMoveY = otherCardsStartRect.top - otherCardsDestRect.top
      heroCard.style.transform = `translate(${heroMoveX}px, ${heroMoveY}px) scale(${currentScale})`
      otherCards.style.transition = 'none'
      otherCards.style.transform = `translate(${otherMoveX}px, ${otherMoveY}px)`
      otherCards.classList.remove('opacity-0', 'pointer-events-none')
      otherCards.style.opacity = '0'
      requestAnimationFrame(() => {
        void heroCard.offsetWidth
        void otherCards.offsetWidth
        heroCard.style.transition = 'transform 1.2s cubic-bezier(0.23, 1, 0.32, 1)'
        heroCard.style.transform = 'translate(0px, 0px) scale(1)'
        otherCards.style.transition = 'transform 1.2s cubic-bezier(0.23, 1, 0.32, 1), opacity 1s ease-out'
        otherCards.style.transform = 'translate(0px, 0px)'
        otherCards.style.opacity = '1'
      })
      setTimeout(() => {
        heroCard.style.zIndex = ''
        heroCard.style.transition = ''
        otherCards.style.transition = ''
        otherCards.style.transform = ''
        otherCards.style.opacity = ''
        heroCard.style.transform = ''
        heroCard.classList.add('hover:scale-[1.04]', 'hover:shadow-[0_20px_40px_rgba(212,181,142,0.3)]', 'hover:z-20')
        appContainer.style.overflow = ''
      }, 1200)
    }

    migrateToGridRef.current = migrateToGrid

    function isVerticalLayout() {
      if (!otherCards) return false
      return window.getComputedStyle(otherCards).flexDirection === 'column'
    }

    const thresholds = []
    for (let i = 0; i <= 1.0; i += 0.05) thresholds.push(i)

    scrollObserverRef.current = new IntersectionObserver((entries) => {
      const isVertical = isVerticalLayout()
      if (!isTouchDeviceRef.current || !isVertical) {
        entries.forEach(entry => {
          entry.target.classList.remove('is-active')
          visibleCardsRef.current.set(entry.target, 0)
        })
        return
      }
      entries.forEach(entry => visibleCardsRef.current.set(entry.target, entry.intersectionRatio))
      let maxRatio = 0
      let targetActiveCard = null
      secondaryCardsList.forEach(card => {
        const ratio = visibleCardsRef.current.get(card) || 0
        if (ratio >= 0.55 && ratio > maxRatio) {
          maxRatio = ratio
          targetActiveCard = card
        }
      })
      secondaryCardsList.forEach(card => {
        if (card === targetActiveCard) card.classList.add('is-active')
        else card.classList.remove('is-active')
      })
    }, { threshold: thresholds })

    const secondaryCardsList = otherCards.querySelectorAll('.tarot-card')
    secondaryCardsList.forEach(card => {
      scrollObserverRef.current.observe(card)
      card.addEventListener('click', function(e) {
        const isVertical = isVerticalLayout()
        if (deviceTypeRef.current === 'tablet' && !isVertical) {
          if (!this.classList.contains('is-active')) {
            e.preventDefault()
            secondaryCardsList.forEach(c => { if (c !== this) c.classList.remove('is-active') })
            this.classList.add('is-active')
          }
        }
      })
      card.addEventListener('mouseenter', function() {
        if (!isTouchDeviceRef.current) {
          secondaryCardsList.forEach(c => { if (c !== this) c.classList.remove('is-active') })
        }
      })
    })

    const handleDocumentClick = (e) => {
      if (deviceTypeRef.current === 'tablet' && !isVerticalLayout()) {
        if (!e.target.closest('#other-cards .tarot-card')) {
          secondaryCardsList.forEach(c => c.classList.remove('is-active'))
        }
      }
      if (!e.target.closest('#music-toggle') && !e.target.closest('#hero-card')) {
        if (introStateRef.current === 1) migrateToGrid()
      }
    }
    document.addEventListener('click', handleDocumentClick)

    window.addEventListener('load', () => {
      if (window.lucide) window.lucide.createIcons()
    })

    const domContentLoadedHandler = () => {
      let isReload = false
      let isBackForward = false
      const navEntries = performance.getEntriesByType("navigation")
      if (navEntries.length > 0) {
        isReload = navEntries[0].type === 'reload'
        isBackForward = navEntries[0].type === 'back_forward'
      }
      let shouldSkipIntro = sessionStorage.getItem('hasSeenIntro') === 'true'
      if (isReload) shouldSkipIntro = false
      else if (isBackForward) shouldSkipIntro = true
      if (shouldSkipIntro) skipToGrid()
      else setupIntro()
    }
    domContentLoadedHandler()

    return () => {
      if (scrollObserverRef.current) scrollObserverRef.current.disconnect()
      document.removeEventListener('click', handleDocumentClick)
    }
  }, [location.pathname])

  useEffect(() => {
    const heroCard = heroCardRef.current
    const heroCardInner = heroCardInnerRef.current
    const heroCardFront = heroCardFrontRef.current
    const heroBgImg = heroBgImgRef.current
    const heroHoverLayer = heroHoverLayerRef.current
    const heroPlaceholder = heroPlaceholderRef.current
    const appContainer = appContainerRef.current

    if (!heroCard || !heroPlaceholder) return

    function handleResize() {
      if (resizeTimerRef.current) cancelAnimationFrame(resizeTimerRef.current)
      resizeTimerRef.current = requestAnimationFrame(() => {
        if (introStateRef.current < 2) {
          const rect = heroPlaceholder.getBoundingClientRect()
          heroCard.style.width = rect.width + 'px'
          heroCard.style.height = rect.height + 'px'
          const currentScale = window.innerWidth < 1024 ? 1.05 : 1.25
          heroCard.style.transform = `translate(-50%, -50%) scale(${currentScale})`
        }
        if (otherCardsRef.current && window.getComputedStyle(otherCardsRef.current).flexDirection !== 'column') {
          const secondaryCardsList = otherCardsRef.current.querySelectorAll('.tarot-card')
          secondaryCardsList.forEach(card => {
            card.classList.remove('is-active')
            visibleCardsRef.current.set(card, 0)
          })
        }
      })
    }
    window.addEventListener('resize', handleResize)

    function handleHeroMouseEnter() {
      if (introStateRef.current === 2 && !isTouchDeviceRef.current) {
        isOverlayVisibleRef.current = true
        if (heroHoverLayer) heroHoverLayer.classList.replace('opacity-0', 'opacity-100')
        if (heroBgImg) heroBgImg.classList.add('brightness-50', 'scale-110')
      }
    }
    function handleHeroMouseLeave() {
      if (introStateRef.current === 2 && !isTouchDeviceRef.current) {
        isOverlayVisibleRef.current = false
        if (heroHoverLayer) heroHoverLayer.classList.replace('opacity-100', 'opacity-0')
        if (heroBgImg) heroBgImg.classList.remove('brightness-50', 'scale-110')
      }
    }
    function handleHeroClick(e) {
      if (introStateRef.current === 0) {
        e.stopPropagation()
        introStateRef.current = 1
        if (heroCardInner) heroCardInner.style.transform = 'rotateY(180deg)'
        if (heroCardFront) heroCardFront.classList.remove('animate-pulse-slow', 'shadow-[0_0_25px_rgba(212,181,142,0.4)]')
        toggleMusic(true)
      } else if (introStateRef.current === 1) {
        if (migrateToGridRef.current) migrateToGridRef.current()
      } else if (introStateRef.current === 2) {
        isOverlayVisibleRef.current = !isOverlayVisibleRef.current
        if (isOverlayVisibleRef.current) {
          if (heroHoverLayer) heroHoverLayer.classList.replace('opacity-0', 'opacity-100')
          if (heroBgImg) heroBgImg.classList.add('brightness-50', 'scale-110')
        } else {
          if (heroHoverLayer) heroHoverLayer.classList.replace('opacity-100', 'opacity-0')
          if (heroBgImg) heroBgImg.classList.remove('brightness-50', 'scale-110')
        }
      }
    }

    heroCard.addEventListener('mouseenter', handleHeroMouseEnter)
    heroCard.addEventListener('mouseleave', handleHeroMouseLeave)
    heroCard.addEventListener('click', handleHeroClick)

    return () => {
      window.removeEventListener('resize', handleResize)
      heroCard.removeEventListener('mouseenter', handleHeroMouseEnter)
      heroCard.removeEventListener('mouseleave', handleHeroMouseLeave)
      heroCard.removeEventListener('click', handleHeroClick)
      if (resizeTimerRef.current) cancelAnimationFrame(resizeTimerRef.current)
    }
  }, [isMusicPlaying, location.pathname])

  useEffect(() => {
    const canvas = bgCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false })
    let animationId
    let width, height
    let stars = []
    let mouseX = 0, mouseY = 0
    let targetMouseX = 0, targetMouseY = 0
    let staticBgGradient

    function initGradient() {
      const radius = Math.max(width, height) * 1.5
      staticBgGradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, radius)
      staticBgGradient.addColorStop(0, '#211c15')
      staticBgGradient.addColorStop(0.5, '#0d0b09')
      staticBgGradient.addColorStop(1, '#000000')
    }

    function resize() {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
      initGradient()
      initStars()
    }

    function handleResize() {
      if (canvasResizeTimerRef.current) cancelAnimationFrame(canvasResizeTimerRef.current)
      canvasResizeTimerRef.current = requestAnimationFrame(resize)
    }

    window.addEventListener('resize', handleResize)
    const handleMouseMove = (e) => {
      targetMouseX = (e.clientX / width) * 2 - 1
      targetMouseY = (e.clientY / height) * 2 - 1
    }
    window.addEventListener('mousemove', handleMouseMove)
    const handleTouchMove = (e) => {
      targetMouseX = (e.touches[0].clientX / width) * 2 - 1
      targetMouseY = (e.touches[0].clientY / height) * 2 - 1
    }
    window.addEventListener('touchmove', handleTouchMove, { passive: true })

    class Star {
      constructor() {
        this.x = Math.random() * width
        this.y = Math.random() * height
        this.size = Math.random() * 1.5 + 0.2
        this.baseAlpha = Math.random() * 0.5 + 0.1
        this.alpha = this.baseAlpha
        this.blinkSpeed = Math.random() * 0.01 + 0.005
        this.blinkAngle = Math.random() * Math.PI * 2
        const colors = ['#d4b58e', '#c2a27b', '#e8d5bc', '#f0e6d2', '#a68a61']
        this.color = colors[Math.floor(Math.random() * colors.length)]
        this.depth = Math.random() * 3 + 1
      }
      update(mX, mY) {
        this.blinkAngle += this.blinkSpeed
        this.alpha = this.baseAlpha + Math.sin(this.blinkAngle) * 0.3
        if (this.alpha < 0) this.alpha = 0
        if (this.alpha > 1) this.alpha = 1
        const offsetX = mX * 20 / this.depth
        const offsetY = mY * 20 / this.depth
        this.draw(offsetX, offsetY)
      }
      draw(offsetX, offsetY) {
        ctx.save()
        ctx.globalAlpha = this.alpha
        ctx.fillStyle = this.color
        ctx.beginPath()
        let drawX = (this.x + offsetX) % width
        let drawY = (this.y + offsetY) % height
        if (drawX < 0) drawX += width
        if (drawY < 0) drawY += height
        ctx.arc(Math.floor(drawX), Math.floor(drawY), this.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
    }

    function initStars() {
      stars = []
      const numStars = Math.floor((width * height) / 8000)
      for (let i = 0; i < numStars; i++) stars.push(new Star())
    }

    function animate() {
      mouseX += (targetMouseX - mouseX) * 0.05
      mouseY += (targetMouseY - mouseY) * 0.05
      ctx.save()
      ctx.translate(mouseX * 50, mouseY * 50)
      ctx.fillStyle = staticBgGradient
      ctx.fillRect(-200, -200, width + 400, height + 400)
      ctx.restore()
      stars.forEach(star => star.update(mouseX, mouseY))
      animationId = requestAnimationFrame(animate)
    }

    resize()
    animate()

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleTouchMove)
      if (animationId) cancelAnimationFrame(animationId)
      if (canvasResizeTimerRef.current) cancelAnimationFrame(canvasResizeTimerRef.current)
    }
  }, [location.pathname])

  return (
    <>
      <Routes>
        <Route path="/encyclopedia" element={<ErrorBoundary><EncyclopediaPage /></ErrorBoundary>} />
        <Route path="/encyclopedia/:nodeId" element={<ErrorBoundary><EncyclopediaPage /></ErrorBoundary>} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/functions" element={<ErrorBoundary><FunctionsPage /></ErrorBoundary>} />
        <Route path="/functions/badge" element={<BadgePage />} />
        <Route path="/" element={
          <>
            <audio ref={bgMusicRef} id="bg-music" loop>
              <source src={ASSETS_BASE + "/audio/bgm/home.mp3"} type="audio/mpeg" />
            </audio>

            <div className="fixed inset-0 z-0 pointer-events-none">
              <canvas ref={bgCanvasRef} id="bg-canvas" className="w-full h-full block" />
              <div className="noise-overlay absolute inset-0 z-[1]" />
            </div>

            <button
              id="music-toggle"
              onClick={() => toggleMusic()}
              className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-11 h-11 text-stone-400 hover:text-[#d4b58e] bg-stoneBg/60 rounded-full border border-stoneBorder hover:border-[#d4b58e]/50 backdrop-blur-md transition-all cursor-pointer shadow-lg shadow-black/50"
              dangerouslySetInnerHTML={{
                __html: isMusicPlaying
                  ? '<i data-lucide="volume-2" class="w-5 h-5"></i>'
                  : '<i data-lucide="volume-x" class="w-5 h-5"></i>'
              }}
            />

            <div ref={appContainerRef} id="app-container" className="overflow-y-auto lg:overflow-hidden">
              <div ref={foregroundLayerRef} id="foreground-layer" className="relative z-10 w-full h-full opacity-0">
                <main id="main-content" className="min-h-full py-12 px-6 flex flex-col justify-center">
                  <div className="flex flex-col lg:flex-row items-center justify-center gap-6 w-full lg:h-[45vh] xl:h-[55vh] 2xl:h-[65vh]">
                    <div
                      ref={heroPlaceholderRef}
                      id="hero-card-placeholder"
                      className="w-full lg:w-auto h-auto lg:h-[45vh] xl:h-[55vh] 2xl:h-[65vh] aspect-[3/4] shrink-0 relative perspective-[2000px] z-30"
                    >
                      <svg viewBox="0 0 3 4" className="w-full h-full opacity-0 pointer-events-none" />

                      <div
                        ref={heroCardRef}
                        id="hero-card"
                        className="absolute inset-0 cursor-pointer rounded-xl block transform-gpu"
                      >
                        <div
                          ref={heroCardInnerRef}
                          id="hero-card-inner"
                          className="relative w-full h-full transition-transform duration-[1200ms] ease-[cubic-bezier(0.23,1,0.32,1)] [transform-style:preserve-3d] [container-type:inline-size]"
                        >
                          <div
                            ref={heroCardFrontRef}
                            id="hero-card-front"
                            className="absolute inset-0 rounded-xl overflow-hidden shadow-[0_0_25px_rgba(212,181,142,0.4)] border border-[#d4b58e]/80 bg-stoneBg [backface-visibility:hidden] animate-pulse-slow transition-all duration-500"
                          >
                            <img
                              ref={heroBgImgRef}
                              id="hero-bg-img"
                              src={ASSETS_BASE + "/images/cards/hero-front.webp"}
                              alt="英雄史诗"
                              className="absolute inset-0 w-full h-full object-cover transition-all duration-500"
                              fetchPriority="high"
                            />

                            <div
                              ref={heroHoverLayerRef}
                              id="hero-hover-layer"
                              className="absolute inset-0 transition-all duration-500 opacity-0 pointer-events-none bg-black/40"
                            >
                              <img
                                src={ASSETS_BASE + "/images/cards/hero-hover.webp"}
                                loading="lazy"
                                decoding="async"
                                className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity"
                              />
                              <div className="relative z-10 flex flex-col items-center justify-center h-full p-[clamp(1rem,6cqw,2rem)] text-center">
                                <h3 className="font-yishan text-[#d4b58e] text-[clamp(1.2rem,8cqw,1.875rem)] tracking-[0.2em] mb-[clamp(0.5rem,3cqw,1rem)] drop-shadow-lg">无光的伊甸园</h3>
                                <h3 className="font-serif text-[#dcd6cc] text-[clamp(0.9rem,6cqw,1.25rem)] tracking-[0.2em] mb-[clamp(0.5rem,3cqw,1rem)] drop-shadow-lg -mt-[clamp(0.4rem,2.5cqw,0.75rem)]">无光的伊甸园</h3>
                                <div className="w-12 h-px bg-[#d4b58e]/40 mb-[clamp(1rem,4cqw,1.5rem)]" />

                                <p className="font-yishan text-[#d4b58e] text-[clamp(0.6rem,4cqw,1.05rem)] leading-[2.2] tracking-wider drop-shadow-[0_2px_8px_rgba(0,0,0,1)]">欢迎来到 黯淡无光的伊甸园</p>
                                <p className="font-serif text-[#dcd6cc] text-[clamp(0.45rem,2.5cqw,0.75rem)] leading-[2.2] tracking-wider drop-shadow-[0_2px_8px_rgba(0,0,0,1)] -mt-[clamp(0.3rem,1.5cqw,0.5rem)]">欢迎来到……黯淡无光的伊甸园。</p>
                                <p className="font-yishan text-[#d4b58e] text-[clamp(0.6rem,4cqw,1.05rem)] leading-[2.2] tracking-wider drop-shadow-[0_2px_8px_rgba(0,0,0,1)]">我在此记录一切</p>
                                <p className="font-serif text-[#dcd6cc] text-[clamp(0.45rem,2.5cqw,0.75rem)] leading-[2.2] tracking-wider drop-shadow-[0_2px_8px_rgba(0,0,0,1)] -mt-[clamp(0.3rem,1.5cqw,0.5rem)]">我在此记录一切，</p>
                                <p className="font-yishan text-[#d4b58e] text-[clamp(0.6rem,4cqw,1.05rem)] leading-[2.2] tracking-wider drop-shadow-[0_2px_8px_rgba(0,0,0,1)]">过去 现在 亦是将来</p>
                                <p className="font-serif text-[#dcd6cc] text-[clamp(0.45rem,2.5cqw,0.75rem)] leading-[2.2] tracking-wider drop-shadow-[0_2px_8px_rgba(0,0,0,1)] -mt-[clamp(0.3rem,1.5cqw,0.5rem)]">过去，现在，亦是将来。</p>
                                <p className="font-yishan text-[#d4b58e] text-[clamp(0.6rem,4cqw,1.05rem)] leading-[2.2] tracking-wider drop-shadow-[0_2px_8px_rgba(0,0,0,1)]">若你愿意踏足这片废墟</p>
                                <p className="font-serif text-[#dcd6cc] text-[clamp(0.45rem,2.5cqw,0.75rem)] leading-[2.2] tracking-wider drop-shadow-[0_2px_8px_rgba(0,0,0,1)] -mt-[clamp(0.3rem,1.5cqw,0.5rem)]">若你愿意踏足这片废墟，</p>
                                <p className="font-yishan text-[#d4b58e] text-[clamp(0.6rem,4cqw,1.05rem)] leading-[2.2] tracking-wider drop-shadow-[0_2px_8px_rgba(0,0,0,1)]">请闭上眼</p>
                                <p className="font-serif text-[#dcd6cc] text-[clamp(0.45rem,2.5cqw,0.75rem)] leading-[2.2] tracking-wider drop-shadow-[0_2px_8px_rgba(0,0,0,1)] -mt-[clamp(0.3rem,1.5cqw,0.5rem)]">请闭上眼……</p>
                                <p className="font-yishan text-[#d4b58e] text-[clamp(0.6rem,4cqw,1.05rem)] leading-[2.2] tracking-wider drop-shadow-[0_2px_8px_rgba(0,0,0,1)]">伊甸园 欢迎所有人</p>
                                <p className="font-serif text-[#dcd6cc] text-[clamp(0.45rem,2.5cqw,0.75rem)] leading-[2.2] tracking-wider drop-shadow-[0_2px_8px_rgba(0,0,0,1)] -mt-[clamp(0.3rem,1.5cqw,0.5rem)]">伊甸园，欢迎所有人。</p>
                                <div className="mt-[clamp(2rem,10cqw,4rem)]" />
                                <p className="font-yishan text-[#d4b58e] text-[clamp(0.6rem,4cqw,1.05rem)] leading-[2.2] tracking-wider drop-shadow-[0_2px_8px_rgba(0,0,0,1)]">永恒不灭的占星会</p>
                                <p className="font-serif text-[#dcd6cc] text-[clamp(0.45rem,2.5cqw,0.75rem)] leading-[2.2] tracking-wider drop-shadow-[0_2px_8px_rgba(0,0,0,1)] -mt-[clamp(0.3rem,1.5cqw,0.5rem)]">永恒不灭的占星会</p>
                              </div>
                            </div>
                          </div>

                          <div className="absolute inset-0 rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-[#d4b58e]/60 bg-stoneCard [transform:rotateY(180deg)] [backface-visibility:hidden] vignette-overlay">
                            <div id="back-layer-poem" className="absolute inset-0 flex flex-col items-center justify-center p-[clamp(1rem,6cqw,2rem)] text-center transition-opacity duration-700 opacity-100">
                              <img
                                src={ASSETS_BASE + "/images/cards/hero-back.webp"}
                                loading="lazy"
                                decoding="async"
                                className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-luminosity pointer-events-none"
                              />
                              <div className="relative z-10 text-[#dcd6cc] text-[clamp(0.75rem,1.4vh,0.95rem)] leading-[2.2] tracking-widest flex flex-col gap-[clamp(0.5rem,3cqw,1rem)] drop-shadow-[0_2px_8px_rgba(0,0,0,1)] pointer-events-none">
                                <p className="font-yishan text-[#d4b58e] text-[clamp(0.65rem,4cqw,0.875rem)] -mt-[clamp(0.6rem,4cqw,1rem)]">天上的太阳将要坠下</p>
                                <p className="font-serif text-[#dcd6cc] text-[clamp(0.4rem,2.5cqw,0.55rem)] -mt-[clamp(0.6rem,4cqw,1rem)]">天上的太阳将要坠下，</p>
                                <p className="font-yishan text-[#d4b58e] text-[clamp(0.65rem,4cqw,0.875rem)] -mt-[clamp(0.6rem,4cqw,1rem)]">群星闭上了昏倦的眼睛</p>
                                <p className="font-serif text-[#dcd6cc] text-[clamp(0.4rem,2.5cqw,0.55rem)] -mt-[clamp(0.6rem,4cqw,1rem)]">群星闭上了昏倦的眼睛。</p>
                                <p className="font-yishan text-[#d4b58e] text-[clamp(0.65rem,4cqw,0.875rem)] -mt-[clamp(0.6rem,4cqw,1rem)]">恶魔在人间作祟如鸦</p>
                                <p className="font-serif text-[#dcd6cc] text-[clamp(0.4rem,2.5cqw,0.55rem)] -mt-[clamp(0.6rem,4cqw,1rem)]">恶魔在人间作祟如鸦，</p>
                                <p className="font-yishan text-[#d4b58e] text-[clamp(0.65rem,4cqw,0.875rem)] -mt-[clamp(0.6rem,4cqw,1rem)]">巨龙腾飞掀起灾厄的影</p>
                                <p className="font-serif text-[#dcd6cc] text-[clamp(0.4rem,2.5cqw,0.55rem)] -mt-[clamp(0.6rem,4cqw,1rem)]">巨龙腾飞掀起灾厄的影。</p>
                                <p className="font-yishan text-[#d4b58e] text-[clamp(0.65rem,4cqw,0.875rem)] -mt-[clamp(0.6rem,4cqw,1rem)]">海水毁灭一切高塔</p>
                                <p className="font-serif text-[#dcd6cc] text-[clamp(0.4rem,2.5cqw,0.55rem)] -mt-[clamp(0.6rem,4cqw,1rem)]">海水毁灭一切高塔，</p>
                                <p className="font-yishan text-[#d4b58e] text-[clamp(0.65rem,4cqw,0.875rem)] -mt-[clamp(0.6rem,4cqw,1rem)]">淹没誓言与残破的名</p>
                                <p className="font-serif text-[#dcd6cc] text-[clamp(0.4rem,2.5cqw,0.55rem)] -mt-[clamp(0.6rem,4cqw,1rem)]">淹没誓言与残破的名。</p>
                                <p className="font-yishan text-[#d4b58e] text-[clamp(0.65rem,4cqw,0.875rem)] -mt-[clamp(0.6rem,4cqw,1rem)]">哦 命运啊 可听见这回答</p>
                                <p className="font-serif text-[#dcd6cc] text-[clamp(0.4rem,2.5cqw,0.55rem)] -mt-[clamp(0.6rem,4cqw,1rem)]">哦，命运啊，可听见这回答——</p>
                                <p className="font-yishan text-[#d4b58e] text-[clamp(0.65rem,4cqw,0.875rem)] -mt-[clamp(0.6rem,4cqw,1rem)]">即便末日 也要燃烧成星</p>
                                <p className="font-serif text-[#dcd6cc] text-[clamp(0.4rem,2.5cqw,0.55rem)] -mt-[clamp(0.6rem,4cqw,1rem)]">即便末日，也要燃烧成星。</p>
                                <div className="mt-[clamp(0.5rem,3cqw,1rem)] pt-[clamp(0.5rem,3cqw,1rem)] border-t border-[#d4b58e]/30 w-3/4 mx-auto flex flex-col items-center">
                                  <span className="font-yishan text-[#d4b58e] text-[clamp(0.65rem,4cqw,0.875rem)] tracking-[0.2em] font-bold">大陆战争纪事</span>
                                  <span className="font-serif text-[#dcd6cc]/80 text-[clamp(0.4rem,2.5cqw,0.55rem)] tracking-[0.2em] -mt-[clamp(0.1rem,0.5cqw,0.2rem)]">《大陆战争纪事》</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div
                      ref={otherCardsRef}
                      id="other-cards"
                      className="flex flex-col lg:flex-row items-center justify-center gap-6 w-full lg:w-auto h-auto lg:h-full opacity-0 pointer-events-none z-10"
                    >
                      <a
                        href="/encyclopedia/"
                        draggable="false"
                        className="w-full lg:w-auto h-auto lg:h-[45vh] xl:h-[55vh] 2xl:h-[65vh] aspect-[9/16] shrink-0 tarot-card group border border-stoneBorder hover:border-[#d4b58e]/60 [.is-active]:border-[#d4b58e]/60 [container-type:inline-size]"
                      >
                        <img
                          src={ASSETS_BASE + "/images/cards/encyclopedia-card.webp"}
                          loading="lazy"
                          decoding="async"
                          draggable="false"
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[10s] ease-out group-hover:scale-105 group-[.is-active]:scale-105"
                        />
                        <div className="absolute inset-0 bg-stoneBg/70 group-hover:opacity-0 group-[.is-active]:opacity-0 transition-opacity duration-500" />
                        <div className="absolute inset-0 vignette-overlay pointer-events-none group-hover:opacity-0 group-[.is-active]:opacity-0 transition-opacity duration-500" />
                        <div className="absolute inset-4 border border-[#d4b58e]/40 pointer-events-none z-10 flex items-center justify-center p-1.5 transition-all duration-700 group-hover:inset-3 group-[.is-active]:inset-3 group-hover:border-[#d4b58e]/80 group-[.is-active]:border-[#d4b58e]/80">
                          <div className="w-full h-full border border-[#d4b58e]/20 relative">
                            <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-stoneBg border border-[#d4b58e]/50 rotate-45 group-hover:rotate-90 group-[.is-active]:rotate-90 group-hover:bg-[#d4b58e] group-[.is-active]:bg-[#d4b58e] transition-all duration-700" />
                            <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-stoneBg border border-[#d4b58e]/50 rotate-45 group-hover:rotate-90 group-[.is-active]:rotate-90 group-hover:bg-[#d4b58e] group-[.is-active]:bg-[#d4b58e] transition-all duration-700" />
                            <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-stoneBg border border-[#d4b58e]/50 rotate-45 group-hover:rotate-90 group-[.is-active]:rotate-90 group-hover:bg-[#d4b58e] group-[.is-active]:bg-[#d4b58e] transition-all duration-700" />
                            <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-stoneBg border border-[#d4b58e]/50 rotate-45 group-hover:rotate-90 group-[.is-active]:rotate-90 group-hover:bg-[#d4b58e] group-[.is-active]:bg-[#d4b58e] transition-all duration-700" />
                          </div>
                        </div>
                        <div className="relative z-20 w-full h-full flex flex-col items-center justify-between py-[clamp(1.5rem,8cqw,3rem)] px-4">
                          <i data-lucide="library" className="w-8 h-8 text-[#d4b58e]/70 group-hover:opacity-0 group-[.is-active]:opacity-0 transition-all duration-500 mt-2" />
                          <h3 className="text-[clamp(1.2rem,12cqw,2.25rem)] font-yishan text-[#dcd6cc] vertical-text tracking-[0.4em] drop-shadow-[0_4px_12px_rgba(0,0,0,1)] transition-all duration-500 hover-text-gold-stroke">百科全书</h3>
                          <div className="flex flex-col items-center gap-[clamp(0.3rem,2cqw,0.75rem)]">
                            <span className="text-[clamp(8px,4cqw,10px)] text-[#d4b58e]/60 font-serif font-bold tracking-[0.3em] uppercase group-hover:text-stoneBg group-[.is-active]:text-stoneBg group-hover:font-bold group-[.is-active]:font-bold transition-colors duration-500 bg-stoneBg/50 group-hover:bg-[#d4b58e] group-[.is-active]:bg-[#d4b58e] px-[clamp(0.2rem,1.5cqw,0.5rem)] py-[clamp(0.1rem,0.5cqw,0.125rem)] rounded backdrop-blur">百科全书</span>
                          </div>
                        </div>
                      </a>

                      <a
                        href="/map/"
                        draggable="false"
                        className="w-full lg:w-auto h-auto lg:h-[45vh] xl:h-[55vh] 2xl:h-[65vh] aspect-[9/16] shrink-0 tarot-card group border border-stoneBorder hover:border-[#d4b58e]/60 [.is-active]:border-[#d4b58e]/60 [container-type:inline-size]"
                      >
                        <img
                          src={ASSETS_BASE + "/images/cards/map-card.webp"}
                          loading="lazy"
                          decoding="async"
                          draggable="false"
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[10s] ease-out group-hover:scale-105 group-[.is-active]:scale-105"
                        />
                        <div className="absolute inset-0 bg-stoneBg/70 group-hover:opacity-0 group-[.is-active]:opacity-0 transition-opacity duration-500" />
                        <div className="absolute inset-0 vignette-overlay pointer-events-none group-hover:opacity-0 group-[.is-active]:opacity-0 transition-opacity duration-500" />
                        <div className="absolute inset-4 border border-[#d4b58e]/40 pointer-events-none z-10 flex items-center justify-center p-1.5 transition-all duration-700 group-hover:inset-3 group-[.is-active]:inset-3 group-hover:border-[#d4b58e]/80 group-[.is-active]:border-[#d4b58e]/80">
                          <div className="w-full h-full border border-[#d4b58e]/20 relative">
                            <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-stoneBg border border-[#d4b58e]/50 rotate-45 group-hover:rotate-90 group-[.is-active]:rotate-90 group-hover:bg-[#d4b58e] group-[.is-active]:bg-[#d4b58e] transition-all duration-700" />
                            <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-stoneBg border border-[#d4b58e]/50 rotate-45 group-hover:rotate-90 group-[.is-active]:rotate-90 group-hover:bg-[#d4b58e] group-[.is-active]:bg-[#d4b58e] transition-all duration-700" />
                            <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-stoneBg border border-[#d4b58e]/50 rotate-45 group-hover:rotate-90 group-[.is-active]:rotate-90 group-hover:bg-[#d4b58e] group-[.is-active]:bg-[#d4b58e] transition-all duration-700" />
                            <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-stoneBg border border-[#d4b58e]/50 rotate-45 group-hover:rotate-90 group-[.is-active]:rotate-90 group-hover:bg-[#d4b58e] group-[.is-active]:bg-[#d4b58e] transition-all duration-700" />
                          </div>
                        </div>
                        <div className="relative z-20 w-full h-full flex flex-col items-center justify-between py-[clamp(1.5rem,8cqw,3rem)] px-4">
                          <i data-lucide="map-pinned" className="w-8 h-8 text-[#d4b58e]/70 group-hover:opacity-0 group-[.is-active]:opacity-0 transition-all duration-500 mt-2" />
                          <h3 className="text-[clamp(1.2rem,12cqw,2.25rem)] font-yishan text-[#dcd6cc] vertical-text tracking-[0.4em] drop-shadow-[0_4px_12px_rgba(0,0,0,1)] transition-all duration-500 hover-text-gold-stroke">海陆图志</h3>
                          <div className="flex flex-col items-center gap-[clamp(0.3rem,2cqw,0.75rem)]">
                            <span className="text-[clamp(8px,4cqw,10px)] text-[#d4b58e]/60 font-serif font-bold tracking-[0.3em] uppercase group-hover:text-stoneBg group-[.is-active]:text-stoneBg group-hover:font-bold group-[.is-active]:font-bold transition-colors duration-500 bg-stoneBg/50 group-hover:bg-[#d4b58e] group-[.is-active]:bg-[#d4b58e] px-[clamp(0.2rem,1.5cqw,0.5rem)] py-[clamp(0.1rem,0.5cqw,0.125rem)] rounded backdrop-blur">海陆图志</span>
                          </div>
                        </div>
                      </a>

                      <a
                        href="/functions/"
                        draggable="false"
                        className="w-full lg:w-auto h-auto lg:h-[45vh] xl:h-[55vh] 2xl:h-[65vh] aspect-[9/16] shrink-0 tarot-card group border border-stoneBorder hover:border-[#d4b58e]/60 [.is-active]:border-[#d4b58e]/60 [container-type:inline-size]"
                      >
                        <img
                          src={ASSETS_BASE + "/images/cards/functions-card.webp"}
                          loading="lazy"
                          decoding="async"
                          draggable="false"
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[10s] ease-out group-hover:scale-105 group-[.is-active]:scale-105"
                        />
                        <div className="absolute inset-0 bg-stoneBg/70 group-hover:opacity-0 group-[.is-active]:opacity-0 transition-opacity duration-500" />
                        <div className="absolute inset-0 vignette-overlay pointer-events-none group-hover:opacity-0 group-[.is-active]:opacity-0 transition-opacity duration-500" />
                        <div className="absolute inset-4 border border-[#d4b58e]/40 pointer-events-none z-10 flex items-center justify-center p-1.5 transition-all duration-700 group-hover:inset-3 group-[.is-active]:inset-3 group-hover:border-[#d4b58e]/80 group-[.is-active]:border-[#d4b58e]/80">
                          <div className="w-full h-full border border-[#d4b58e]/20 relative">
                            <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-stoneBg border border-[#d4b58e]/50 rotate-45 group-hover:rotate-90 group-[.is-active]:rotate-90 group-hover:bg-[#d4b58e] group-[.is-active]:bg-[#d4b58e] transition-all duration-700" />
                            <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-stoneBg border border-[#d4b58e]/50 rotate-45 group-hover:rotate-90 group-[.is-active]:rotate-90 group-hover:bg-[#d4b58e] group-[.is-active]:bg-[#d4b58e] transition-all duration-700" />
                            <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-stoneBg border border-[#d4b58e]/50 rotate-45 group-hover:rotate-90 group-[.is-active]:rotate-90 group-hover:bg-[#d4b58e] group-[.is-active]:bg-[#d4b58e] transition-all duration-700" />
                            <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-stoneBg border border-[#d4b58e]/50 rotate-45 group-hover:rotate-90 group-[.is-active]:rotate-90 group-hover:bg-[#d4b58e] group-[.is-active]:bg-[#d4b58e] transition-all duration-700" />
                          </div>
                        </div>
                        <div className="relative z-20 w-full h-full flex flex-col items-center justify-between py-[clamp(1.5rem,8cqw,3rem)] px-4">
                          <i data-lucide="radio-tower" className="w-8 h-8 text-[#d4b58e]/70 group-hover:opacity-0 group-[.is-active]:opacity-0 transition-all duration-500 mt-2" />
                          <h3 className="text-[clamp(1.2rem,12cqw,2.25rem)] font-yishan text-[#dcd6cc] vertical-text tracking-[0.4em] drop-shadow-[0_4px_12px_rgba(0,0,0,1)] transition-all duration-500 hover-text-gold-stroke">有求必应</h3>
                          <div className="flex flex-col items-center gap-[clamp(0.3rem,2cqw,0.75rem)]">
                            <span className="text-[clamp(8px,4cqw,10px)] text-[#d4b58e]/60 font-serif font-bold tracking-[0.3em] uppercase group-hover:text-stoneBg group-[.is-active]:text-stoneBg group-hover:font-bold group-[.is-active]:font-bold transition-colors duration-500 bg-stoneBg/50 group-hover:bg-[#d4b58e] group-[.is-active]:bg-[#d4b58e] px-[clamp(0.2rem,1.5cqw,0.5rem)] py-[clamp(0.1rem,0.5cqw,0.125rem)] rounded backdrop-blur">有求必应</span>
                          </div>
                        </div>
                      </a>
                    </div>
                  </div>
                </main>
              </div>
            </div>
            <VersionBadge position="bottom-left" />
          </>
        } />
      </Routes>
    </>
  )
}

export default App
