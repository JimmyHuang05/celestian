import { useState, useEffect, useCallback } from 'react'

function AeonDetail({ node, isMobile, onClose, supabaseClient, entryId }) {
  const [characters, setCharacters] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [scrollProgress, setScrollProgress] = useState(0)

  const character = characters[currentIndex] || null

  useEffect(() => {
    const fetchEntries = async () => {
      if (!supabaseClient || !node) return
      setIsLoading(true)
      try {
        let query = supabaseClient.from('entries').select('*')
        if (entryId) {
          query = query.eq('id', entryId)
        } else {
          query = query.eq('node_id', node.id).order('created_at', { ascending: false })
        }
        const { data, error } = await query
        if (error) throw error
        if (data && data.length > 0) {
          const parsedData = data.map(row => {
            let mainScale = 100, bgImageUrl = '', bgImageScale = 100, titleIconUrl = '', titleIconScale = 100, sortOrder = 0, alienText = ''
            const content = row.content || ''
            const scaleMatch = content.match(/^<!--MAIN_IMAGE_SCALE:(\d+)-->/m)
            if (scaleMatch) mainScale = parseInt(scaleMatch[1], 10)
            const bgMatch = content.match(/^<!--BG_IMAGE_URL:(.*?)-->/m)
            if (bgMatch) bgImageUrl = bgMatch[1].trim()
            const bgScaleMatch = content.match(/^<!--BG_IMAGE_SCALE:(\d+)-->/m)
            if (bgScaleMatch) bgImageScale = parseInt(bgScaleMatch[1], 10)
            const titleIconMatch = content.match(/^<!--TITLE_ICON_URL:(.*?)-->/m)
            if (titleIconMatch) titleIconUrl = titleIconMatch[1].trim()
            const titleIconScaleMatch = content.match(/^<!--TITLE_ICON_SCALE:(\d+)-->/m)
            if (titleIconScaleMatch) titleIconScale = parseInt(titleIconScaleMatch[1], 10)
            const alienMatch = content.match(/^<!--ALIEN_TEXT:(.*?)-->/m)
            if (alienMatch) alienText = alienMatch[1].trim()
            const sortMatch = content.match(/^<!--SORT_ORDER:(-?\d+)-->/m)
            if (sortMatch) sortOrder = parseInt(sortMatch[1], 10)

            const blocksArr = []
            const kv = []
            const blockMatch = content.match(/<!--BLOCKS:(.*?)-->/m)
            if (blockMatch && blockMatch[1]) {
              try {
                let aeonFirstParagraphFound = false
                JSON.parse(blockMatch[1]).forEach(b => {
                  if (b.type === 'paragraph' && b.content) {
                    if (b.dropCap === undefined) b.dropCap = !aeonFirstParagraphFound
                    aeonFirstParagraphFound = true
                    blocksArr.push({ type: 'paragraph', content: b.content, dropCap: b.dropCap })
                  }
                  if (b.type === 'key-value' && b.key) kv.push({ key: b.key, value: b.value })
                  if (b.type === 'quote' && b.content) blocksArr.push({ type: 'quote', content: b.content, author: b.author })
                })
              } catch (e) {}
            }

            return {
              name: row.title || '未知卷宗',
              title: row.subtitle || '',
              image_url: row.image_url || '',
              bg_image_url: bgImageUrl,
              bg_image_scale: bgImageScale,
              main_image_scale: mainScale,
              title_icon_url: titleIconUrl,
              title_icon_scale: titleIconScale,
              alien_text: alienText,
              sort_order: sortOrder,
              blocks: blocksArr,
              kv,
            }
          })
          parsedData.sort((a, b) => a.sort_order - b.sort_order)
          setCharacters(parsedData)
        } else {
          setCharacters([])
        }
      } catch (e) {
        setCharacters([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchEntries()
  }, [node, supabaseClient])

  const prev = () => { if (currentIndex > 0) { setCurrentIndex(prev => prev - 1); setScrollProgress(0) } }
  const next = () => { if (currentIndex < characters.length - 1) { setCurrentIndex(prev => prev + 1); setScrollProgress(0) } }

  const handleScroll = useCallback((e) => {
    const target = e.target
    const maxScroll = target.scrollHeight - target.clientHeight
    setScrollProgress(maxScroll <= 0 ? 100 : (target.scrollTop / maxScroll) * 100)
  }, [])

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Serif SC', sans-serif" }}>
      <div className="absolute inset-0 bg-gray-900 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] pointer-events-auto" onClick={onClose} />

      <div className={`relative flex flex-col pointer-events-auto z-10 shadow-[0_0_100px_rgba(0,0,0,0.9)] overflow-hidden bg-[#070709] ${isMobile ? 'w-full h-[100dvh] rounded-none' : 'w-11/12 md:w-10/12 max-w-5xl h-[80vh] md:h-[75vh] rounded-xl border border-white/5 md:border-gold/10 backdrop-blur-3xl'}`}>
        
        <button onClick={onClose} className={`z-[400] w-12 h-12 rounded-full bg-black/20 hover:bg-black/50 backdrop-blur-md border border-transparent hover:border-gold/30 flex items-center justify-center text-gray-500/50 hover:text-gold transition-colors cursor-pointer ${isMobile ? 'fixed top-4 right-4' : 'absolute top-6 right-6'}`}>
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none opacity-[0.12] mix-blend-screen"
          style={{ maskImage: 'radial-gradient(circle at center, black 30%, transparent 80%)', WebkitMaskImage: 'radial-gradient(circle at center, black 30%, transparent 80%)' }}>
          {character && character.image_url && (
            <img src={character.image_url}
              style={{ transform: 'scale(' + ((character.main_image_scale || 100) / 100) + ')' }}
              className="w-[90%] md:w-[70%] h-auto object-contain blur-[1px] drop-shadow-[0_0_30px_rgba(212,181,142,0.8)] transition-all duration-700" draggable="false" />
          )}
        </div>

        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gold/10 blur-[120px] pointer-events-none z-0 rounded-full mix-blend-screen" />

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center relative z-10">
            <svg className="animate-spin w-8 h-8 text-gold/50 mb-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
            <span className="text-xs font-cinzel tracking-widest text-gold/50 uppercase">Detecting Divine Signature...</span>
          </div>
        ) : characters.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center relative z-10">
            <svg className="w-12 h-12 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
            <span className="text-xs font-cinzel tracking-widest text-gray-600 uppercase">Divine Archive Not Found</span>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto no-scrollbar relative z-10 w-full scroll-smooth" onScroll={handleScroll}>
              <div key={'aeon-info-' + currentIndex} className="w-full flex flex-col items-center relative">
                
                <div className="w-full min-h-[70vh] md:min-h-[65vh] flex flex-col items-center justify-center py-10 px-6 md:px-20 relative z-10">
                  <div className="relative w-full flex justify-center animate-shrine">
                    <div className="absolute top-1/2 left-1/2 w-[150vw] md:w-[450px] aspect-square pointer-events-none opacity-20 mix-blend-screen">
                      <div className="absolute top-1/2 left-1/2 w-[80%] aspect-square border-[1px] border-gold/40 rounded-full halo-ring-1 border-dashed" style={{ transform: 'translate(-50%, -50%)' }} />
                      <div className="absolute top-1/2 left-1/2 w-[100%] aspect-square border-[1px] border-gold/20 rounded-full halo-ring-2" style={{ transform: 'translate(-50%, -50%)' }} />
                      <div className="absolute top-1/2 left-1/2 w-[60%] aspect-square border-[0.5px] border-gold/60 halo-ring-1 rotate-45" style={{ transform: 'translate(-50%, -50%)' }} />
                    </div>

                    <div className="relative w-[55vw] md:w-[260px] aspect-[1/1.6] arch-window p-[2px] bg-gradient-to-b from-gold/60 via-gold/10 to-transparent shadow-[0_0_50px_rgba(212,181,142,0.15)] group">
                      <div className="w-full h-full arch-window overflow-hidden relative bg-black flex items-center justify-center">
                        {character && character.bg_image_url && (
                          <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden pointer-events-none">
                            <img src={character.bg_image_url}
                              style={{ width: (character.bg_image_scale || 100) + '%', height: (character.bg_image_scale || 100) + '%' }}
                              className="object-cover group-hover:scale-[1.05] transition-transform duration-[2s] ease-out min-w-full min-h-full max-w-none" draggable="false" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center text-gold/40 pointer-events-none">
                    <span className="text-[10px] font-cinzel tracking-widest mb-1">SCROLL</span>
                    <svg className="w-4 h-4 animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                  </div>
                </div>

                <div className="w-full flex flex-col items-center px-6 md:px-20 relative z-10 pb-32 pt-10">
                  <div className="text-center w-full max-w-2xl relative z-20 mb-16">
                    <div className="text-gold/60 font-cinzel text-xs md:text-sm tracking-[0.4em] mb-4 uppercase flex items-center justify-center">
                      <span className="inline-block w-8 h-px bg-gold/30 align-middle mr-3" />
                      Entity
                      <span className="inline-block w-8 h-px bg-gold/30 align-middle ml-3" />
                    </div>

                    <div className="w-full flex flex-col items-center justify-center mb-6 py-2 gap-4">
                      {character.name && character.name.split('\\n').map((line, idx) => (
                        <h1 key={'aeon-title-' + idx}
                          className="text-5xl md:text-7xl font-black text-gray-100 tracking-[0.2em] pl-[0.2em] text-center drop-shadow-[0_0_30px_rgba(255,255,255,0.1)] max-w-full"
                          style={{ fontFamily: "'Noto Serif SC', serif", lineHeight: 1.2 }}
                          dangerouslySetInnerHTML={{ __html: line }} />
                      ))}
                    </div>

                    {character.title_icon_url && (
                      <div className="mb-6 flex justify-center">
                        <img src={character.title_icon_url}
                          style={{ transform: 'scale(' + ((character.title_icon_scale || 100) / 100) + ')' }}
                          className="w-16 h-16 object-contain opacity-90 block" draggable="false" />
                      </div>
                    )}

                    <div className="text-gold font-cinzel text-xl md:text-3xl tracking-[0.3em] font-light opacity-90 mb-8"
                      dangerouslySetInnerHTML={{ __html: character.alien_text || (node ? node.alien : 'A E O N S') }} />

                    {character.title && (
                      <h2 className="text-gray-400 text-lg md:text-xl font-light tracking-[0.15em] leading-relaxed" dangerouslySetInnerHTML={{ __html: character.title }} />
                    )}
                  </div>

                  {character.kv && character.kv.length > 0 && (
                    <div className="w-full max-w-3xl border-y border-gold/10 py-8 mb-16 relative z-20 font-serif">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-16 text-center md:text-left">
                        {character.kv.map((item, idx) => (
                          <div key={idx} className="flex flex-col items-center md:items-start group">
                            <span className="text-xs md:text-sm text-gold/50 tracking-widest uppercase mb-2 group-hover:text-gold transition-colors">{item.key}</span>
                            <span className="text-base md:text-lg text-gray-300 font-medium tracking-wider" dangerouslySetInnerHTML={{ __html: item.value }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="holy-text w-full max-w-2xl text-gray-300 text-base md:text-lg leading-[2.2] tracking-wide font-serif text-justify relative z-20">
                    {character.blocks && character.blocks.map((block, index) => {
                      if (block.type === 'paragraph') {
                        return (
                          <p key={'block-' + index}
                            className={`mb-8 opacity-80 ${block.dropCap ? 'has-drop-cap' : 'indent-8'}`}
                            dangerouslySetInnerHTML={{ __html: block.content }} />
                        )
                      } else if (block.type === 'quote') {
                        return (
                          <div key={'block-' + index} className="my-16 py-10 relative flex flex-col items-center text-center">
                            <div className="absolute top-0 w-24 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
                            <div className="absolute bottom-0 w-24 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
                            <div className="text-2xl md:text-3xl text-gold italic leading-relaxed font-light mb-6 px-4">
                              "<span dangerouslySetInnerHTML={{ __html: block.content }} />"
                            </div>
                            {block.author && (
                              <div className="text-xs md:text-sm text-gold-dim font-cinzel tracking-[0.2em] uppercase">
                                <span className="inline-block w-4 h-[1px] bg-gold-dim align-middle mr-2" />
                                <span dangerouslySetInnerHTML={{ __html: block.author }} />
                                <span className="inline-block w-4 h-[1px] bg-gold-dim align-middle ml-2" />
                              </div>
                            )}
                          </div>
                        )
                      }
                      return null
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-[70px] left-0 right-0 h-32 bg-gradient-to-t from-[#070709] via-[#070709]/80 to-transparent pointer-events-none z-20" />

            <div className="relative h-[70px] border-t border-white/5 bg-[#040405] flex items-center justify-between px-6 md:px-12 shrink-0 z-30 pointer-events-auto">
              <div className="absolute top-0 left-0 h-[2px] bg-gold transition-[width] duration-150 ease-out z-40" style={{ width: scrollProgress + '%' }} />

              <button onClick={prev} disabled={currentIndex === 0}
                className="group flex items-center gap-4 text-gray-600 hover:text-gold disabled:opacity-30 disabled:hover:text-gray-600 disabled:cursor-not-allowed transition-colors">
                <div className="w-8 h-8 rounded-full border border-gray-700 group-hover:border-gold/50 flex items-center justify-center transition-all bg-white/5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </div>
                <span className="text-xs font-cinzel tracking-[0.2em] hidden md:block mt-0.5">PREV AEON</span>
              </button>

              <div className="flex items-center gap-4 group transition-transform">
                <div className="w-1.5 h-1.5 bg-gold/30 rotate-45 group-hover:bg-gold transition-colors" />
                <span className="text-gold font-cinzel text-sm tracking-[0.3em]">
                  {String(currentIndex + 1).padStart(2, '0')} <span className="text-white/20 mx-1">/</span> {String(characters.length).padStart(2, '0')}
                </span>
                <div className="w-1.5 h-1.5 bg-gold/30 rotate-45 group-hover:bg-gold transition-colors" />
              </div>

              <button onClick={next} disabled={currentIndex === characters.length - 1}
                className="group flex items-center gap-4 text-gray-600 hover:text-gold disabled:opacity-30 disabled:hover:text-gray-600 disabled:cursor-not-allowed transition-colors">
                <span className="text-xs font-cinzel tracking-[0.2em] hidden md:block mt-0.5">NEXT AEON</span>
                <div className="w-8 h-8 rounded-full border border-gray-700 group-hover:border-gold/50 flex items-center justify-center transition-all bg-white/5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </div>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default AeonDetail
