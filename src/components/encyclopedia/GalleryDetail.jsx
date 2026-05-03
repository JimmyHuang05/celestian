import { useState, useEffect, useCallback, useRef } from 'react'

function GalleryDetail({ node, isMobile, onClose, supabaseClient, entryId, onEntryChange }) {
  const [characters, setCharacters] = useState([])
  const [ids, setIds] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [isTocOpen, setIsTocOpen] = useState(false)
  const [galleryImageIndex, setGalleryImageIndex] = useState(0)
  const [isHoveringImage, setIsHoveringImage] = useState(false)
  const carouselTimerRef = useRef(null)

  const character = characters[currentIndex] || null

  useEffect(() => {
    const fetchEntries = async () => {
      if (!supabaseClient || !node) return
      setIsLoading(true)
      try {
        const { data, error } = await supabaseClient
          .from('entries').select('*').eq('node_id', node.id).order('created_at', { ascending: false })
        if (error) throw error
        if (data && data.length > 0) {
          const parsedData = data.map(row => {
            let galleryImages = []
            if (row.gallery_images) {
              try { galleryImages = JSON.parse(row.gallery_images) } catch (e) {}
            }

            const blocksArr = []
            const kv = []
            if (row.blocks) {
              try {
                JSON.parse(row.blocks).forEach(b => {
                  if (b.type === 'paragraph' && b.content) blocksArr.push({ type: 'paragraph', content: b.content })
                  if (b.type === 'key-value' && b.key) kv.push({ key: b.key, value: b.value })
                  if (b.type === 'quote' && b.content) blocksArr.push({ type: 'quote', content: b.content, author: b.author })
                })
              } catch (e) {}
            } else if (row.content) {
              blocksArr.push({ type: 'paragraph', content: row.content })
            }

            return {
              id: row.id,
              name: row.title || '未知卷宗',
              title: row.subtitle || '',
              image_url: row.image_url || '',
              bg_image_url: row.bg_image_url || '',
              bg_image_scale: row.bg_image_scale || 120,
              main_image_scale: row.main_image_scale || 100,
              title_icon_url: row.title_icon_url || '',
              title_icon_scale: row.title_icon_scale || 100,
              alien_text: row.alien_text || '',
              sort_order: row.sort_order || 0,
              blocks: blocksArr,
              kv,
              gallery_images: galleryImages,
            }
          })
          parsedData.sort((a, b) => a.sort_order - b.sort_order)
          const extractedIds = parsedData.map(c => c.id)
          setIds(extractedIds)
          setCharacters(parsedData)
        } else {
          setCharacters([])
          setIds([])
        }
      } catch (e) {
        setCharacters([])
        setIds([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchEntries()
  }, [node, supabaseClient])

  useEffect(() => {
    if (ids.length === 0) return
    if (entryId) {
      const foundIndex = ids.indexOf(entryId)
      if (foundIndex !== -1) setCurrentIndex(foundIndex)
    } else if (onEntryChange && ids[0]) {
      onEntryChange(ids[0])
    }
  }, [ids])

  const currentImages = character ? (() => {
    const bgUrl = character.bg_image_url
    if (bgUrl) {
      try { const p = JSON.parse(bgUrl); if (Array.isArray(p) && p.length > 0) return p } catch (e) {}
      if (typeof bgUrl === 'string' && bgUrl.startsWith('http')) return [bgUrl]
    }
    if (character.gallery_images && character.gallery_images.length > 0) return character.gallery_images
    if (character.image_url) return [character.image_url]
    return []
  })() : []
  const hasMultipleImages = currentImages.length > 1

  useEffect(() => {
    setGalleryImageIndex(0)
  }, [currentIndex])

  useEffect(() => {
    if (!hasMultipleImages || isHoveringImage) return
    carouselTimerRef.current = setInterval(() => {
      setGalleryImageIndex(prev => (prev + 1) % currentImages.length)
    }, 4000)
    return () => { if (carouselTimerRef.current) clearInterval(carouselTimerRef.current) }
  }, [hasMultipleImages, isHoveringImage, currentImages.length])

  const goToImage = (idx) => { setGalleryImageIndex(idx) }

  const prev = () => { if (currentIndex > 0) { const ni = currentIndex - 1; setCurrentIndex(ni); setScrollProgress(0); if (onEntryChange && ids[ni]) onEntryChange(ids[ni]) } }
  const next = () => { if (currentIndex < characters.length - 1) { const ni = currentIndex + 1; setCurrentIndex(ni); setScrollProgress(0); if (onEntryChange && ids[ni]) onEntryChange(ids[ni]) } }
  const toggleToc = () => setIsTocOpen(prev => !prev)
  const selectFromToc = (idx) => { setCurrentIndex(idx); setIsTocOpen(false); setScrollProgress(0); if (onEntryChange && ids[idx]) onEntryChange(ids[idx]) }

  const handleScroll = useCallback((e) => {
    const target = e.target
    const maxScroll = target.scrollHeight - target.clientHeight
    setScrollProgress(maxScroll <= 0 ? 100 : (target.scrollTop / maxScroll) * 100)
  }, [])

  return (
    <div className="w-full h-screen bg-gray-900 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Serif SC', sans-serif" }}>
      <div className="relative w-full h-full flex items-center justify-center">
        <div className={`relative flex flex-col z-10 overflow-hidden bg-[#050505] ${isMobile ? 'w-full h-full rounded-none' : 'w-11/12 md:w-10/12 max-w-5xl h-[80vh] md:h-[75vh] rounded-xl border border-white/10'}`}>
        
        <button onClick={onClose} className={`absolute z-[400] w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 transition-all cursor-pointer hover:scale-110 ${isMobile ? 'top-4 right-4' : 'top-5 right-5'}`}>
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <svg className="animate-spin w-8 h-8 text-gray-500 mb-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
            <span className="text-xs font-mono tracking-widest text-gray-500 uppercase">Loading Gallery Assets...</span>
          </div>
        ) : characters.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <svg className="w-12 h-12 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
            <span className="text-xs font-mono tracking-widest text-gray-600 uppercase">Gallery Archive Not Found</span>
          </div>
        ) : (
          <>
            <div className="absolute top-0 bottom-0 left-0 w-min z-[200] flex items-center justify-start pointer-events-auto">
              <button disabled={currentIndex === 0} onClick={prev} className={`ml-2 md:ml-6 w-9 h-9 md:w-12 md:h-12 rounded-full bg-black/50 md:bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 transition-all duration-300 hover:scale-110 hover:bg-black/80 hover:text-[#d4b58e] hover:border-[#d4b58e]/50 ${currentIndex === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
            </div>
            <div className="absolute top-0 bottom-0 right-0 w-min z-[200] flex items-center justify-end pointer-events-auto">
              <button disabled={currentIndex === characters.length - 1} onClick={next} className={`mr-2 md:mr-6 w-9 h-9 md:w-12 md:h-12 rounded-full bg-black/50 md:bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 transition-all duration-300 hover:scale-110 hover:bg-black/80 hover:text-[#d4b58e] hover:border-[#d4b58e]/50 ${currentIndex === characters.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>

            <div className="flex-1 w-full h-full flex flex-col relative z-0 min-h-0 bg-[#050505]">
              <div className="w-full shrink-0 relative flex items-center justify-center overflow-hidden z-10 bg-[#000000]" style={{ aspectRatio: '21/9' }}
                onMouseEnter={() => setIsHoveringImage(true)} onMouseLeave={() => setIsHoveringImage(false)}>
                {currentImages.length > 0 && (
                  <img key={'gallery-img-' + currentIndex + '-' + galleryImageIndex}
                    src={currentImages[galleryImageIndex]}
                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500" draggable="false" />
                )}
                {hasMultipleImages && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
                    {currentImages.map((_, idx) => (
                      <button key={idx} onClick={(e) => { e.stopPropagation(); goToImage(idx) }}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === galleryImageIndex ? 'bg-white/90 w-2.5' : 'bg-white/30 hover:bg-white/60'}`} />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex-1 w-full relative z-10 bg-[#050505] pointer-events-auto border-t border-white/5">
                <div className="absolute inset-0 px-6 py-5 md:px-12 md:py-8 overflow-y-auto md:overflow-hidden extreme-dark-scrollbar flex flex-col md:flex-row gap-6 md:gap-10">

                  <div className="shrink-0 w-full md:w-[35%] flex flex-col justify-start border-l-[2px] border-[#d4b58e]/30 pl-4 md:pl-6 min-h-0">
                    <div className="flex-none md:flex-1 overflow-visible md:overflow-y-auto extreme-dark-scrollbar pr-2 flex flex-col w-full">
                      <div key={'gallery-title-' + currentIndex} className="flex flex-col w-full">
                        <div className="flex flex-col w-full gap-1 pt-1">
                          {character.alien_text && (
                            <span className="text-[10px] md:text-xs font-medium tracking-[0.2em] text-[#d4b58e]/80 uppercase font-cinzel break-words whitespace-normal mb-1" dangerouslySetInnerHTML={{ __html: character.alien_text }} />
                          )}
                          <h1 className="flex flex-col">
                            {character.name && character.name.split('\\n').map((line, idx) => (
                              <span key={'gal-title-' + idx} className="text-2xl md:text-3xl font-bold tracking-[0.1em] text-white uppercase font-serif-sc break-words leading-tight" dangerouslySetInnerHTML={{ __html: line }} />
                            ))}
                          </h1>
                          {character.title && (
                            <h2 className="text-[#d4b58e] text-sm tracking-[0.15em] font-medium uppercase mt-2 break-words whitespace-normal font-serif-sc" dangerouslySetInnerHTML={{ __html: character.title }} />
                          )}
                        </div>
                        {character.kv && character.kv.length > 0 && (
                          <div className="mt-4 md:mt-5 flex flex-col items-start gap-3 pb-2 font-serif">
                            {character.kv.map((item, idx) => (
                              <div key={'gal-kv-' + idx} className="flex items-center gap-2.5 px-3 py-2 bg-white/[0.03] border border-white/5 rounded-md">
                                <span className="text-[#d4b58e]/40 text-[11px] md:text-xs uppercase tracking-widest">{item.key}</span>
                                <span className="w-px h-3 bg-white/10" />
                                <span className="text-white/80 text-[11px] md:text-xs uppercase tracking-wider" dangerouslySetInnerHTML={{ __html: item.value }} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 pt-3 md:border-t border-white/5 shrink-0">
                      <button onClick={(e) => { e.stopPropagation(); toggleToc() }} className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-[4px] border border-white/10 hover:border-[#d4b58e]/50 hover:bg-white/5 transition-all group z-50 cursor-pointer shadow-md bg-white/[0.02] backdrop-blur-md">
                        <svg className="w-3.5 h-3.5 text-white/40 group-hover:text-[#d4b58e] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                        <span className="text-white/40 font-mono text-[10px] tracking-[0.2em] group-hover:text-[#d4b58e] transition-colors mt-[1px]">
                          {String(currentIndex + 1).padStart(2, '0')} / {String(characters.length).padStart(2, '0')}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 w-full flex flex-col min-h-0 md:border-l border-white/5 md:pl-8">
                    <div className="flex-none md:flex-1 overflow-visible md:overflow-y-auto extreme-dark-scrollbar pr-2 md:pr-4" onScroll={handleScroll}>
                      <div key={'gallery-desc-' + currentIndex} className="text-gray-300 text-[12px] md:text-[13px] leading-[2] md:leading-[2.2] tracking-wider text-justify font-sans pb-8 md:pb-0">
                        {character.blocks && character.blocks.length > 0 ? (
                          character.blocks.map((block, index) => {
                            if (block.type === 'paragraph') {
                              return <p key={'block-' + index} className="mb-3 opacity-90 indent-6" dangerouslySetInnerHTML={{ __html: block.content }} />
                            } else if (block.type === 'quote') {
                              return (
                                <div key={'block-' + index} className="my-4 border-l-[1.5px] border-[#d4b58e]/40 pl-4 italic text-gray-400 bg-white/[0.02] py-2.5 pr-3 rounded-r-md">
                                  <span dangerouslySetInnerHTML={{ __html: block.content }} />
                                  {block.author && <div className="mt-2 text-[10px] tracking-widest uppercase font-cinzel">—— <span dangerouslySetInnerHTML={{ __html: block.author }} /></div>}
                                </div>
                              )
                            }
                            return null
                          })
                        ) : (
                          <span className="italic text-gray-600 font-mono tracking-widest text-xs">NO ARCHIVE DATA FOUND.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {isTocOpen && (
              <div className="absolute inset-0 z-[600] bg-black/95 backdrop-blur-xl flex flex-col p-6 md:p-12 pointer-events-auto">
                <div className="flex justify-between items-center mb-8 shrink-0">
                  <div className="text-[#d4b58e] tracking-[0.4em] text-sm font-bold uppercase" style={{ fontFamily: "'Cinzel', serif" }}>Archive Index</div>
                  <button onClick={toggleToc} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all">
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto extreme-dark-scrollbar flex flex-col gap-3 items-center pt-4 pb-12 px-2">
                  {characters.map((char, idx) => (
                    <div key={'toc-' + idx} onClick={() => selectFromToc(idx)}
                      className="group cursor-pointer flex items-center gap-6 w-full max-w-2xl px-6 py-4 bg-white/5 border border-white/5 hover:border-[#d4b58e]/50 hover:bg-white/10 rounded-xl transition-all">
                      <span className={`font-mono text-xl group-hover:text-[#d4b58e] transition-colors w-8 text-right ${currentIndex === idx ? 'text-[#d4b58e]' : 'text-white/20'}`} style={{ fontFamily: "'Cinzel', serif" }}>{String(idx + 1).padStart(2, '0')}</span>
                      <div className="flex flex-col flex-1 border-l border-white/10 group-hover:border-[#d4b58e]/30 pl-5 transition-colors">
                        <span className={`text-lg md:text-xl group-hover:text-white transition-colors ${currentIndex === idx ? 'text-white' : 'text-white/60'}`} style={{ fontFamily: "'Cinzel', serif" }} dangerouslySetInnerHTML={{ __html: char.name ? char.name.replace(/\\n/g, ' ') : '' }} />
                        <span className={`text-[10px] md:text-xs tracking-widest mt-1 uppercase ${currentIndex === idx ? 'text-[#d4b58e]/80' : 'text-white/40'}`} style={{ fontFamily: "'Noto Serif SC', serif" }} dangerouslySetInnerHTML={{ __html: char.title }} />
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-5 h-5 text-[#d4b58e]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  </div>
  )
}

export default GalleryDetail
