import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qunhjfulchaurfxtjoeg.supabase.co'
const supabaseKey = 'sb_publishable_Nkbcb5N92HUqJAGB9TYnJQ_W_09BC-T'
let supabaseClient = null
try { supabaseClient = createClient(supabaseUrl, supabaseKey) } catch (e) { console.error('Supabase init error', e) }

function FunctionsPage() {
  const navigate = useNavigate()
  const [activePage, setActivePage] = useState('overview')
  const [particles, setParticles] = useState([])
  const [uptime, setUptime] = useState('00:00:00')
  const [dailyUsageCount, setDailyUsageCount] = useState(0)
  const [hasStartedChat, setHasStartedChat] = useState(false)
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [aiQuery, setAiQuery] = useState('')
  const [isBgmPlaying, setIsBgmPlaying] = useState(false)
  const [logs, setLogs] = useState([])
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', content: '欢迎接入「全知之眼」在轨平台，我是逻各斯。\n巴别塔通用计算有限公司承诺：无论您身处何方，我们都将为您提供高速、稳定、不受限制的全球计算和通信链路服务。' }
  ])
  const chatContainerRef = useRef(null)
  const aiInputRef = useRef(null)
  const bgmAudioRef = useRef(null)
  const threeInitRef = useRef(false)
  const [customLogoPath] = useState('')

  const getIcon = (name, cls = '') => `<i data-lucide="${name}" class="${cls}"></i>`

  const subsystems = [
    { name: '统一制证服务平台', icon: 'shield', statusIcon: 'activity', desc: '本平台为巴别塔联合工业集群干员提供各类身份凭证的在线办理与统一管理服务。', actionText: 'Access Terminal', url: 'badge' },
    { name: '低轨卫星通信门户', icon: 'satellite', statusIcon: 'radio-tower', desc: '维持与远方方舟的握手协议，上行发送故乡余温。当前环境干涉强度：高。', actionText: 'Link Offline', url: null },
  ]

  const tools = [
    { name: 'Tencent Cloud', role: 'Infrastructure', icon: 'server' },
    { name: 'Supabase', role: 'Serverless Functions', icon: 'cloud-lightning' },
    { name: 'Vue 3', role: 'Reactive Architecture', icon: 'zap' },
    { name: 'Tailwind CSS', role: 'Visual Framework', icon: 'layout' },
    { name: 'Three.js', role: '3D Topography Engine', icon: 'diamond' },
    { name: 'Gemini 3', role: 'Collaborative Architect', icon: 'bot' },
    { name: 'DeepSeek v4', role: 'AI Neural Core', icon: 'brain-circuit' },
    { name: 'Suno', role: 'Acoustic Synth Engine', icon: 'headphones' },
    { name: 'Holopix AI', role: 'Visual Synth', icon: 'image-plus' },
    { name: 'Lucide Icons', role: 'Interface Assets', icon: 'shapes' },
    { name: 'PaintTool SAI Ver.2', role: 'Linework Architect', icon: 'pencil' },
    { name: 'ZeoSeven™ Fonts', role: 'Typography Engine', icon: 'type' },
  ]

  const returnHome = () => navigate('/')
  const openLink = (url) => {
    if (url === 'badge') navigate('/functions/badge')
    else if (url === 'editor') navigate('/editor')
    else if (url) window.open(url, '_blank')
  }

  const getTodayString = () => {
    const d = new Date()
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }, 100)
  }

  const submitAIQuery = useCallback(async () => {
    const query = aiQuery.trim()
    if (!query) return
    setChatHistory(prev => [...prev, { role: 'user', content: query }])
    setAiQuery('')
    setIsAiLoading(true)
    scrollToBottom()

    try {
      const SUPABASE_URL = "https://qunhjfulchaurfxtjoeg.supabase.co"
      const ANON_KEY = "sb_publishable_Nkbcb5N92HUqJAGB9TYnJQ_W_09BC-T"
      const res = await fetch(`${SUPABASE_URL}/functions/v1/Deepseek_API`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}`, 'apikey': ANON_KEY },
        body: JSON.stringify({ messages: chatHistory.concat([{ role: 'user', content: query }]) })
      })
      if (res.status === 429) throw new Error("429_RATE_LIMIT")
      const data = await res.json()
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.choices?.[0]?.message?.content || "无信号。" }])
      setDailyUsageCount(prev => {
        const newCount = prev + 1
        localStorage.setItem('babel_ai_quota', JSON.stringify({ date: getTodayString(), count: newCount }))
        return newCount
      })
    } catch (err) {
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: err.message === "429_RATE_LIMIT" ? "ERROR 429 // 连接已被服务器切断，该 IP 今日配额已耗尽。" : "系统连接错误。"
      }])
    } finally {
      setIsAiLoading(false)
      scrollToBottom()
    }
  }, [aiQuery, chatHistory])

  const handleStartChat = useCallback(() => {
    setHasStartedChat(true)
    const audio = new Audio('/data/audio/sfx/uplink.mp3')
    audio.volume = 0.9
    audio.play().catch(() => {})
    setTimeout(() => { if (aiInputRef.current) aiInputRef.current.focus(); scrollToBottom() }, 500)
  }, [])

  const toggleBgm = useCallback(() => {
    if (!bgmAudioRef.current) return
    if (isBgmPlaying) { bgmAudioRef.current.pause(); setIsBgmPlaying(false) }
    else { bgmAudioRef.current.play().catch(() => {}); setIsBgmPlaying(true) }
  }, [isBgmPlaying])

  useEffect(() => {
    setParticles(Array.from({ length: 45 }).map((_, i) => ({
      id: i, size: Math.random() * 2 + 1, left: Math.random() * 100,
      duration: Math.random() * 15 + 10, delay: Math.random() * -20, drift: (Math.random() - 0.5) * 150
    })))

    const initBgm = () => {
      const audio = new Audio('/data/audio/bgm/functions.mp3')
      audio.loop = true
      audio.volume = 0.10
      bgmAudioRef.current = audio
      audio.play().then(() => setIsBgmPlaying(true)).catch(() => {
        const startBgm = () => {
          if (bgmAudioRef.current) bgmAudioRef.current.play().then(() => setIsBgmPlaying(true)).catch(() => {})
          window.removeEventListener('click', startBgm)
        }
        window.addEventListener('click', startBgm)
      })
    }
    initBgm()

    const stored = localStorage.getItem('babel_ai_quota')
    if (stored) {
      try {
        const data = JSON.parse(stored)
        setDailyUsageCount(data.date === getTodayString() ? data.count : 0)
      } catch (e) { setDailyUsageCount(0) }
    }

    const timer = setInterval(() => {
      const now = new Date()
      setUptime(now.toTimeString().split(' ')[0])
    }, 1000)

    return () => { clearInterval(timer); if (bgmAudioRef.current) { bgmAudioRef.current.pause(); bgmAudioRef.current = null } }
  }, [])

  useEffect(() => {
    if (!supabaseClient) return
    supabaseClient.from('system_logs').select('code, time, title, desc').order('created_at', { ascending: false }).then(({ data, error }) => {
      if (!error && data) setLogs(data)
    })
  }, [])

  useEffect(() => {
    const container = document.getElementById('three-canvas-container-fn')
    if (!container || threeInitRef.current || !window.THREE) return
    threeInitRef.current = true
    const THREE = window.THREE

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    const geometry = new THREE.PlaneGeometry(80, 80, 256, 256)
    const material = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec2 vUv;
        varying float vElevation;
        vec2 hash( vec2 p ) { p = vec2( dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)) ); return -1.0 + 2.0*fract(sin(p)*43758.5453123); }
        float noise( in vec2 p ) { const float K1 = 0.366025404; const float K2 = 0.211324865; vec2 i = floor( p + (p.x+p.y)*K1 ); vec2 a = p - i + (i.x+i.y)*K2; float m = step( a.y, a.x ); vec2 o = vec2( m, 1.0 - m ); vec2 b = a - o + K2; vec2 c = a - 1.0 + 2.0*K2; vec3 h = max( 0.5-vec3(dot(a,a), dot(b,b), dot(c,c) ), 0.0 ); vec3 n = h*h*h*h*vec3( dot(a,hash(i+0.0)), dot(b,hash(i+o)), dot(c,hash(i+1.0))); return dot( n, vec3(70.0) ); }
        float fbm(vec2 p) { float f = 0.0; float w = 0.5; for(int i = 0; i < 4; i++) { f += w * noise(p); p *= 1.8; w *= 0.45; } return f; }
        void main() { vUv = uv; float elevation = fbm(uv * 2.2) * 16.0; vElevation = elevation; vec3 newPos = position; newPos.z += elevation; gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0); }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying float vElevation;
        void main() {
          float density = 8.0; float phase = vElevation * density;
          float f = abs(fract(phase) - 0.5); float line = smoothstep(0.42, 0.5, f);
          vec3 baseColor = vec3(0.11, 0.10, 0.09); vec3 lineColor = vec3(0.83, 0.71, 0.55);
          vec3 finalColor = mix(baseColor, lineColor, line * 0.85);
          float dist = distance(vUv, vec2(0.5)); float vignette = smoothstep(0.7, 0.1, dist);
          gl_FragColor = vec4(finalColor, vignette);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
    })

    const terrain = new THREE.Mesh(geometry, material)
    terrain.rotation.x = -Math.PI / 2.2
    terrain.position.y = -6
    scene.add(terrain)
    camera.position.z = 14
    camera.position.y = 1.8

    let mouseX = 0, mouseY = 0
    const mouseHandler = (e) => { mouseX = (e.clientX / window.innerWidth) - 0.5; mouseY = (e.clientY / window.innerHeight) - 0.5 }
    document.addEventListener('mousemove', mouseHandler)

    const animate = () => {
      requestAnimationFrame(animate)
      const time = Date.now() * 0.0002
      terrain.rotation.z = time * 0.3
      terrain.rotation.x = -Math.PI / 2.2 + Math.sin(time * 0.5) * 0.1
      terrain.rotation.y = Math.cos(time * 0.4) * 0.08
      terrain.position.x = Math.sin(time * 0.6) * 2.5
      terrain.position.z = Math.cos(time * 0.5) * 2.5
      camera.position.x += (mouseX * 4.0 - camera.position.x) * 0.03
      camera.position.y += (-mouseY * 3.5 + 1.8 - camera.position.y) * 0.03
      camera.lookAt(0, -1, 0)
      renderer.render(scene, camera)
    }
    animate()

    const resize = () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight) }
    window.addEventListener('resize', resize)

    return () => {
      document.removeEventListener('mousemove', mouseHandler)
      window.removeEventListener('resize', resize)
      renderer.dispose()
    }
  }, [])

  useEffect(() => {
    if (window.lucide) requestAnimationFrame(() => window.lucide.createIcons())
  })

  return (
    <div id="functions-app" className="w-full h-full relative">
      <div id="three-canvas-container-fn" style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.85 }} />
      <div className="noise-overlay-fn" />
      <div className="bg-overlay-fn" />
      <div className="ambient-glow-fn" />

      <div className="particle-field-fn">
        {particles.map(p => (
          <div key={p.id} className="particle-fn" style={{
            width: p.size + 'px', height: p.size + 'px', left: p.left + 'vw',
            animationDuration: p.duration + 's', animationDelay: p.delay + 's',
            ['--drift' ]: p.drift + 'px',
          }} />
        ))}
      </div>

      <div className={`hud-container-fn ${activePage === 'ai' ? '!left-1/2 md:!left-[calc(50%+32px)]' : ''}`}
        style={{ display: activePage === 'overview' || activePage === 'ai' ? 'block' : 'none' }}>
        <div className="ring ring-outer" />
        <div className="ring ring-mid" />
        <div className="ring ring-inner" />
      </div>

      <div className="flex flex-col-reverse md:flex-row w-full h-full relative">
        <aside className="sidebar-fn flex md:flex-col items-center py-0 md:py-6 shrink-0 shadow-2xl relative z-50 border-t md:border-t-0 w-full h-[64px] md:w-[64px] md:h-full">
          <div className="hidden md:flex mb-8 flex-col items-center gap-1 transition-all duration-300">
            <div className={`w-6 h-1 transition-all duration-500 ${activePage === 'overview' || activePage === 'credits' ? 'bg-[#d4b58e] shadow-[0_0_8px_#d4b58e]' : 'bg-gray-500/40'}`} />
            <div className={`w-6 h-1 transition-all duration-500 ${activePage === 'ai' || activePage === 'credits' ? 'bg-[#d4b58e] shadow-[0_0_8px_#d4b58e]' : 'bg-gray-500/40'}`} />
            <div className={`w-6 h-1 transition-all duration-500 ${activePage === 'carg' || activePage === 'credits' ? 'bg-[#d4b58e] shadow-[0_0_8px_#d4b58e]' : 'bg-gray-500/40'}`} />
          </div>

          <nav className="w-full flex flex-row md:flex-col gap-0 md:gap-2 h-full md:h-auto">
            {[
              { key: 'overview', icon: 'home' },
              { key: 'ai', icon: 'bot' },
              { key: 'carg', icon: 'radio' },
              { key: 'credits', icon: 'database' },
            ].map(item => (
              <button key={item.key} onClick={() => setActivePage(item.key)}
                className={`nav-link-fn w-full ${activePage === item.key ? 'active' : ''}`} aria-label={item.key}>
                <span dangerouslySetInnerHTML={{ __html: getIcon(item.icon, 'w-5 h-5') }} />
              </button>
            ))}
          </nav>

          <div className="hidden md:flex mt-auto flex-col items-center gap-6 opacity-40 pb-4 text-gray-400">
            <button onClick={toggleBgm} className="hover:text-[#d4b58e] transition-colors relative group" aria-label="BGM 开关">
              <span dangerouslySetInnerHTML={{ __html: getIcon(isBgmPlaying ? 'volume-2' : 'volume-x', 'w-5 h-5') }} />
              <span className="absolute left-10 top-1/2 -translate-y-1/2 bg-black/80 px-2 py-1 text-[10px] font-mono whitespace-nowrap rounded border border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                BGM: {isBgmPlaying ? 'ON' : 'OFF'}
              </span>
            </button>
            <button onClick={() => window.open('/editor/', '_blank')} className="hover:text-[#d4b58e] transition-colors" aria-label="开发者中心">
               <span dangerouslySetInnerHTML={{ __html: getIcon('code-2', 'w-5 h-5') }} />
            </button>
            <button onClick={returnHome} className="hover:text-[#d4b58e] transition-colors" aria-label="电源">
              <span dangerouslySetInnerHTML={{ __html: getIcon('power', 'w-5 h-5') }} />
            </button>
          </div>
        </aside>

        <main className="flex-1 relative z-10 overflow-hidden flex flex-col h-full">
          {activePage === 'overview' && (
            <div className="h-full p-8 md:p-20 overflow-y-auto flex flex-col lg:flex-row justify-between lg:items-center">
              <div className="w-full lg:w-3/5 xl:w-1/2">
                <header className="flex justify-between items-end mb-12 border-b border-stoneBorder pb-8 relative">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-[#d4b58e] flex items-center justify-center text-stoneBg">
                        <span dangerouslySetInnerHTML={{ __html: getIcon('lock', 'w-2.5 h-2.5') }} />
                      </div>
                      <span className="font-mono-ef text-[11px] font-bold tracking-[0.4em] text-[#d4b58e] uppercase">Babel United Industrial Cluster</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-serif-sc font-black tracking-tighter text-[#e7e5e4]">巴别塔工业</h1>
                  </div>
                  <div className="absolute bottom-0 left-0 w-24 h-[2px] bg-[#d4b58e] shadow-[0_0_10px_#d4b58e]" />
                </header>

                <div className="space-y-12 pb-10">
                  <div className="space-y-6">
                    <div className="h-0.5 w-10 bg-[#d4b58e]" />
                    <h2 className="text-3xl font-serif-sc font-bold leading-tight text-[#e7e5e4]">
                      建筑超越地平线。<br />
                      <span className="text-xl text-[#a8a29e] font-normal mt-3 block font-mono-ef tracking-tighter uppercase">"Build Beyond the Horizon."</span>
                    </h2>
                    <div className="space-y-6 text-sm text-[#a8a29e] leading-loose text-justify border-l border-stoneBorder pl-8">
                      <p className="text-[#e7e5e4] font-bold">巴别塔工业，全称巴别塔联合工业集群，成立于大灾变末期。</p>
                      <p>当板块崩裂、怒海吞陆，当毒雾蔽日、大地寸草不生。<br />我们承载着人类最后的夙愿，构建足以跨越引力的"巴别塔"，将文明的火种播撒至遥远的深空。<br />本页面为A.R.K.数据库留存的宣传资料，真实记录了那场以星辰为彼岸、以毁灭为倒计时的伟大逃亡。</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 pt-4">
                    {['巴别塔丨Tower of Babel', '遗落王座丨Forsaken Throne', '逻各斯丨L.O.G.O.S'].map(tag => (
                      <div key={tag} className="px-4 py-1.5 bg-stoneCard border border-stoneBorder text-[12px] font-serif-sc text-[#d4b58e] tracking-widest uppercase">{tag}</div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="hidden lg:flex w-[350px] h-[75vh] flex-col justify-between relative pl-12 pr-6 py-8">
                <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-[#d4b58e]/40 to-transparent" />
                <div className="absolute right-[-1px] top-0 w-[3px] h-24 bg-gradient-to-b from-transparent via-[#d4b58e] to-transparent scan-beam-fn" />
                <div className="absolute right-4 top-0 text-[9px] font-mono-ef text-[#a8a29e] tracking-[0.4em] rotate-90 origin-right whitespace-nowrap opacity-40">STRUCTURAL_DECONSTRUCTION</div>

                {[
                  { label: 'GEO SPACE STATION', sub: '同步轨道空间站', meta: '+36,000KM' },
                  { label: 'SPACE ELEVATOR', sub: '太空电梯', meta: '+12,000M' },
                  { label: 'OFFSHORE PLATFORM', sub: '海上作业平台', meta: '±0.00M' },
                  { label: 'NUCLEAR REACTOR', sub: '核反应堆', meta: '-1,500M' },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-end group w-full relative">
                    <div className="flex items-center gap-4 w-full justify-end">
                      <div className="text-right">
                        <div className="text-[9px] font-mono-ef text-[#a8a29e] tracking-widest uppercase">{item.label}</div>
                        <div className="text-xs font-serif-sc text-white/30 tracking-wider">{item.sub} <span className="text-[10px] ml-2 text-white/20">[{item.meta}]</span></div>
                      </div>
                      <div className="relative flex items-center shrink-0">
                        <div className="w-10 h-[1px] bg-white/10 group-hover:bg-white/30 transition-colors" />
                        <div className="w-2.5 h-2.5 rounded-full border border-white/20 bg-stoneBg group-hover:border-[#d4b58e] transition-colors absolute right-[-5px]" />
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex flex-col items-end group w-full relative">
                  <div className="flex items-center gap-4 w-full justify-end">
                    <div className="text-right">
                      <div className="text-[9px] font-mono-ef text-[#d4b58e] tracking-widest uppercase flex items-center justify-end gap-2">
                        <span className="w-1.5 h-1.5 bg-[#d4b58e] rounded-full animate-ping" /> ANOMALY AND POLLUTED ENTITY CONTAINMENT ZONE
                      </div>
                      <div className="text-sm font-serif-sc text-[#e7e5e4] tracking-wider font-bold mt-1">异常和污染实体收容区 <span className="text-[10px] ml-2 text-[#d4b58e]">[-2,000M]</span></div>
                    </div>
                    <div className="relative flex items-center shrink-0">
                      <div className="w-12 h-[1px] bg-[#d4b58e]/60" />
                      <div className="absolute right-[-9px] flex items-center justify-center">
                        <div className="w-5 h-5 rounded-full border border-[#d4b58e]/30 animate-[fn-spin_3s_linear_infinite] border-t-[#d4b58e]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#d4b58e] absolute shadow-[0_0_10px_#d4b58e]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePage === 'ai' && (
            <div className="h-full p-6 md:p-12 overflow-hidden flex flex-col relative w-full z-10 max-w-5xl mx-auto">
              {!hasStartedChat ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20" onClick={handleStartChat}>
                  <div className="relative flex flex-col items-center group cursor-pointer">
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border border-[#d4b58e]/20 relative flex items-center justify-center mb-8 group-hover:border-[#d4b58e]/50 group-hover:shadow-[0_0_40px_rgba(212,181,142,0.2)] transition-all duration-700 bg-black/10 backdrop-blur-sm">
                      <div className="absolute inset-0 rounded-full border-t-2 border-[#d4b58e] animate-[fn-spin_3s_linear_infinite] opacity-50" />
                      <div className="absolute inset-2 rounded-full border-b-2 border-[#d4b58e] animate-[fn-spin-rev_4s_linear_infinite] opacity-30" />
                      <span className="z-10" dangerouslySetInnerHTML={{ __html: getIcon('eye', 'w-12 h-12 text-[#d4b58e] opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-all duration-500') }} />
                    </div>
                    <h2 className="text-3xl md:text-5xl font-serif-sc font-black text-[#e7e5e4] tracking-[0.2em] mb-4">全知之眼</h2>
                    <p className="font-mono-ef text-xs md:text-sm text-[#a8a29e] tracking-[0.5em] uppercase mb-12">Omniscient Orbiting Platform</p>
                    <div className="w-64 md:w-96 border-b border-[#d4b58e]/30 pb-3 text-center group-hover:border-[#d4b58e] transition-colors relative">
                      <span className="font-mono-ef text-[10px] md:text-xs text-[#a8a29e] group-hover:text-[#d4b58e] transition-colors uppercase tracking-widest">[ Click to Establish Uplink ]</span>
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-[#d4b58e] shadow-[0_0_8px_#d4b58e] group-hover:w-full transition-all duration-700" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-full w-full relative z-10 pt-4">
                  <div className="shrink-0 mb-8 flex items-center justify-between border-b border-[#d4b58e]/20 pb-4">
                    <div className="flex items-center gap-3">
                      <span dangerouslySetInnerHTML={{ __html: getIcon('radio', 'w-4 h-4 text-[#d4b58e]') }} />
                      <span className="font-mono-ef text-xs tracking-[0.3em] text-[#a8a29e] uppercase">Channel // Logos_</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-[9px] font-mono-ef tracking-widest uppercase border px-2 py-0.5 rounded-sm transition-colors border-[#d4b58e]/30 text-[#d4b58e]">Uplinks Today: {dailyUsageCount}</div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#d4b58e] animate-pulse shadow-[0_0_8px_#d4b58e]" />
                        <span className="font-mono-ef text-[9px] tracking-widest text-[#d4b58e] uppercase">Online</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-4 flex flex-col gap-10 pb-10" ref={chatContainerRef}>
                    {chatHistory.map((msg, idx) => (
                      <div key={idx} className={`w-full flex animate-[fn-fadeIn_0.8s_ease-out_forwards] ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'assistant' ? (
                          <div className="w-full md:max-w-[85%] relative border-l-[2px] border-[#d4b58e] pl-5 md:pl-6 py-1">
                            <div className="text-[#e7e5e4] font-serif-sc leading-[2.2] text-sm md:text-base tracking-wide text-justify opacity-95 drop-shadow-sm whitespace-pre-wrap">{msg.content}</div>
                          </div>
                        ) : (
                          <div className="w-full md:max-w-[85%] relative border-r-[2px] border-stoneBorder pr-5 md:pr-6 py-1 text-right flex justify-end ml-auto">
                            <div className="text-[#a8a29e] font-serif-sc leading-[2.2] text-sm md:text-base tracking-wide text-justify opacity-80 whitespace-pre-wrap" style={{ textAlignLast: 'right' }}>{msg.content}</div>
                          </div>
                        )}
                      </div>
                    ))}
                    {isAiLoading && (
                      <div className="w-full flex justify-start animate-[fn-fadeIn_0.5s_ease-out_forwards]">
                        <div className="relative border-l-[2px] border-[#d4b58e]/50 pl-5 md:pl-6 py-1 flex items-center gap-4 h-8">
                          <span dangerouslySetInnerHTML={{ __html: getIcon('loader-2', 'w-4 h-4 text-[#d4b58e] animate-spin') }} />
                          <span className="font-mono-ef text-[10px] text-[#a8a29e] tracking-[0.3em] uppercase animate-pulse">Parsing_Signal...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 pt-6 mt-auto">
                    <div className="relative flex items-center border-b border-stoneBorder pb-3 transition-colors focus-within:border-[#d4b58e]/80">
                      <span className="font-mono-ef text-[10px] uppercase tracking-[0.2em] opacity-80 mr-4 shrink-0 flex items-center gap-2 text-[#d4b58e]">
                        <span dangerouslySetInnerHTML={{ __html: getIcon('terminal', 'w-3.5 h-3.5') }} /> Guest_
                      </span>
                      <input ref={aiInputRef} value={aiQuery} onChange={e => setAiQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') submitAIQuery() }}
                        type="text" placeholder="输入终端指令..."
                        className="flex-1 bg-transparent outline-none text-[#e7e5e4] font-serif-sc text-base md:text-lg tracking-wide placeholder-[#a8a29e]/30"
                        disabled={isAiLoading} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activePage === 'carg' && (
            <div className="h-full p-8 md:p-12 overflow-y-auto">
              <header className="w-full border-b border-stoneBorder mb-8 pb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <span dangerouslySetInnerHTML={{ __html: getIcon('activity', 'text-red-500 w-6 h-6 shrink-0') }} />
                  <h2 className="text-xl md:text-3xl font-serif-sc font-black tracking-widest uppercase text-[#e7e5e4]">C.A.R.G. 实时监控</h2>
                </div>
                <div className="inline-flex items-center self-start md:self-auto text-[11px] font-mono-ef tracking-widest text-[#d4b58e] uppercase px-3 py-1 rounded bg-[#d4b58e]/10 border border-[#d4b58e]/30">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#d4b58e] mr-2 animate-pulse" /> Cruising_Uptime: {uptime}
                </div>
              </header>

              <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12 overflow-hidden">
                <div className="lg:col-span-2 flex flex-col overflow-hidden">
                  <div className="border-b border-stoneBorder pb-3 mb-6">
                    <h3 className="text-lg md:text-xl font-serif-sc font-bold tracking-widest text-[#e7e5e4]">系统监控日志</h3>
                    <p className="text-[11px] text-[#d4b58e] font-mono-ef mt-1 uppercase opacity-60">C.A.R.G. Operational Logs</p>
                  </div>
                  <div className="flex-1 overflow-y-auto pr-2 md:pr-4 space-y-6 relative pb-10">
                    <div className="absolute left-[11px] top-4 bottom-4 w-[1px] bg-stoneBorder" />
                    {logs.map((log, idx) => (
                      <div key={idx} className="relative pl-10 group">
                        <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full border border-stoneBorder flex items-center justify-center bg-[#1c1917] z-10">
                          <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-[#d4b58e] shadow-[0_0_8px_#d4b58e]' : 'bg-stoneBorder'}`} />
                        </div>
                        <div className="bg-stoneCard/80 border border-stoneBorder rounded-xl p-4 md:p-5 hover:border-[#d4b58e]/50 transition-all">
                          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-3 border-b border-stoneBorder pb-2 gap-2">
                            <div className="flex items-center gap-3">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-mono-ef border ${idx === 0 ? 'text-[#d4b58e] border-[#d4b58e]/30' : 'text-[#a8a29e] border-stoneBorder'} uppercase`}>{log.code}</span>
                              <h4 className="font-serif-sc font-bold text-[#e7e5e4] text-sm md:text-base group-hover:text-[#d4b58e] transition-colors">{log.title}</h4>
                            </div>
                            <span className="text-[11px] font-mono-ef text-[#a8a29e] tracking-tighter">{log.time}</span>
                          </div>
                          <p className="text-xs text-[#a8a29e] leading-relaxed whitespace-pre-wrap">{log.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col overflow-hidden">
                  <div className="border-b border-stoneBorder pb-3 mb-6">
                    <h3 className="text-lg md:text-xl font-serif-sc font-bold tracking-widest text-[#e7e5e4]">子系统分配</h3>
                    <p className="text-[11px] text-[#d4b58e] font-mono-ef mt-1 uppercase opacity-60">Subsystem Allocation</p>
                  </div>
                  <div className="flex-1 overflow-y-auto px-1 space-y-4 pb-10 lg:pb-0">
                    {subsystems.map(sys => (
                      <button key={sys.name} onClick={() => sys.url ? openLink(sys.url) : null}
                        className={`w-full text-left bg-stoneCard/80 border border-stoneBorder rounded-xl p-5 transition-all group relative overflow-hidden focus:outline-none text-[#e7e5e4] ${sys.url ? 'hover:border-[#d4b58e] hover:bg-[#d4b58e]/5 cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}>
                        <span dangerouslySetInnerHTML={{ __html: getIcon(sys.icon, 'absolute -right-4 -bottom-4 w-20 h-20 text-[#d4b58e] opacity-5 group-hover:scale-110 transition-transform') }} />
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-[#d4b58e]/10 text-[#d4b58e] rounded-lg"><span dangerouslySetInnerHTML={{ __html: getIcon(sys.statusIcon, 'w-4 h-4') }} /></div>
                          <h5 className="text-sm font-bold font-serif-sc">{sys.name}</h5>
                        </div>
                        <p className="text-xs text-[#a8a29e] leading-relaxed">{sys.desc}</p>
                        <div className="mt-4 pt-3 border-t border-stoneBorder flex justify-between items-center text-[10px] font-mono uppercase tracking-widest">
                          <span className={sys.url ? 'text-[#d4b58e]' : 'text-gray-500'}>{sys.actionText}</span>
                          <span dangerouslySetInnerHTML={{ __html: getIcon(sys.url ? 'external-link' : 'lock', sys.url ? 'w-3 h-3 text-[#d4b58e] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform' : 'w-3 h-3 text-gray-500') }} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePage === 'credits' && (
            <div className="h-full flex flex-col lg:overflow-hidden p-6 md:p-12">
              <header className="w-full border-b border-stoneBorder mb-8 pb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <span dangerouslySetInnerHTML={{ __html: getIcon('terminal', 'text-[#d4b58e] w-6 h-6 shrink-0') }} />
                  <h2 className="text-xl md:text-3xl font-serif-sc font-black tracking-widest uppercase text-[#e7e5e4]">数据库终端</h2>
                </div>
                <div className="self-start md:self-auto font-mono-ef text-[11px] tracking-widest text-[#a8a29e] uppercase">Terminal_ID: ARCHIVIST_B01</div>
              </header>

              <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 overflow-hidden pb-10 lg:pb-0">
                <div className="flex flex-col overflow-hidden">
                  <div className="border-b border-stoneBorder pb-3 mb-6">
                    <h3 className="text-lg md:text-xl font-serif-sc font-bold tracking-widest text-[#e7e5e4]">数据库构建协议</h3>
                    <p className="text-[11px] text-[#d4b58e] font-mono-ef mt-1 uppercase opacity-60">Technical Stack & Tools</p>
                  </div>
                  <div className="flex-1 overflow-y-auto pr-2 md:pr-4 space-y-4">
                    {tools.map(tool => (
                      <div key={tool.name} className="bg-stoneCard/80 border border-stoneBorder rounded-xl p-4 md:p-5 flex items-center gap-5 group hover:border-[#d4b58e]/50 transition-all text-[#e7e5e4]">
                        <div className="w-12 h-12 flex-shrink-0 bg-stoneBg rounded-lg flex items-center justify-center border border-stoneBorder text-[#d4b58e]">
                          <span dangerouslySetInnerHTML={{ __html: getIcon(tool.icon, 'w-6 h-6') }} />
                        </div>
                        <div>
                          <h4 className="font-mono-ef font-bold text-[#e7e5e4] tracking-wide text-sm">{tool.name}</h4>
                          <p className="text-[11px] text-[#a8a29e] uppercase tracking-widest mt-1">{tool.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col overflow-y-auto pr-2 text-[#e7e5e4]">
                  <div className="border-b border-stoneBorder pb-3 mb-6">
                    <h3 className="text-lg md:text-xl font-serif-sc font-bold tracking-widest text-[#e7e5e4]">核心构建者</h3>
                    <p className="text-[11px] text-[#d4b58e] font-mono-ef mt-1 uppercase opacity-60">Producer & Credits</p>
                  </div>
                  <div className="bg-stoneCard/80 border border-stoneBorder border-l-2 border-l-[#d4b58e] p-6 md:p-8 rounded-r-xl">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#d4b58e] flex items-center justify-center text-stoneBg">
                        <span dangerouslySetInnerHTML={{ __html: getIcon('user', 'w-7 h-7 md:w-8 md:h-8') }} />
                      </div>
                      <div>
                        <h4 className="text-xl md:text-2xl font-serif-sc font-black tracking-widest uppercase">Jimmy Huang</h4>
                        <p className="text-[11px] font-mono-ef text-[#d4b58e] tracking-widest mt-1 uppercase">Lead Architect // Gemini AI</p>
                      </div>
                    </div>
                    <div className="space-y-4 text-xs md:text-sm text-[#a8a29e] leading-loose text-[#e7e5e4]">
                      <p>本系统由「巴别塔工业」授权搭建。</p>
                      <p>在文明逝去的第三个千年，被判定为永久沉寂的灾变，已重新出现活性反应。</p>
                      <p>第三次污染，第二次灾变。</p>
                      <p>它比前两次更暗哑，更汹涌，也更接近终末。</p>
                      <p>作为最后的观测者，工业污染评估与处理组将履行应有的使命。</p>
                      <p>尽可能完整、精确地记录每一次灾变的特征。</p>
                      <p>为了遥远未来的，那次回归。</p>
                    </div>
                    <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-stoneBorder flex justify-between items-center opacity-60">
                      <span className="font-mono-ef text-[10px] md:text-xs text-[#e7e5e4]">© 2026 BABEL PROJECT</span>
                      <button className="cursor-pointer hover:text-[#d4b58e] hover:scale-110 transition-all focus:outline-none" aria-label="进入编辑器">
                        <span dangerouslySetInnerHTML={{ __html: getIcon('qr-code', 'w-5 h-5 md:w-6 md:h-6') }} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <footer className="hidden md:flex mt-auto p-8 justify-between items-center opacity-40 border-t border-stoneBorder">
            <div className="font-mono-ef text-[10px] tracking-[0.5em] uppercase text-[#e7e5e4]">Babel Industrial // Confidential Deep Sea Layer // Low_Alt_Cruise</div>
            <div className="flex gap-4"><div className="w-1 h-1 bg-gray-400" /><div className="w-1 h-1 bg-[#d4b58e]" /></div>
          </footer>
        </main>
      </div>
    </div>
  )
}

export default FunctionsPage
