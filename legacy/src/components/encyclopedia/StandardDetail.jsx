import { useState, useEffect, useRef, useCallback } from 'react'
import { normalizeEntries, fetchEntriesForNode } from '../../lib/entryContent.js'

function StandardDetail({ node, isMobile, onClose, entryId, onEntryChange, isDark = false }) {
  const [characters, setCharacters] = useState([])
  const [ids, setIds] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isListOpen, setIsListOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [scrollProgress, setScrollProgress] = useState(0)
  const scrollContainerMobileRef = useRef(null)
  const scrollContainerDesktopRef = useRef(null)
  const hasInitializedRef = useRef(false)

  const character = characters[currentIndex] || null

  useEffect(() => {
    const fetchEntries = async () => {
      if (!node) return
      setIsLoading(true)
      try {
        const data = await fetchEntriesForNode(node.id)
        if (data && data.length > 0) {
          const parsedData = normalizeEntries(data)
          const extractedIds = parsedData.map(c => c.id)
          setIds(extractedIds)
          setCharacters(parsedData)
          hasInitializedRef.current = true
        } else {
          setCharacters([])
          setIds([])
        }
      } catch {
        setCharacters([])
        setIds([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchEntries()
  }, [node])

  useEffect(() => {
    if (ids.length === 0) return
    if (entryId) {
      const foundIndex = ids.indexOf(entryId)
      if (foundIndex !== -1) setCurrentIndex(foundIndex)
    } else if (onEntryChange && ids[0]) {
      onEntryChange(ids[0])
    }
  }, [ids])

  const prev = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1
      setCurrentIndex(newIndex)
      setScrollProgress(0)
      if (onEntryChange && ids[newIndex]) onEntryChange(ids[newIndex])
    }
  }
  const next = () => {
    if (currentIndex < characters.length - 1) {
      const newIndex = currentIndex + 1
      setCurrentIndex(newIndex)
      setScrollProgress(0)
      if (onEntryChange && ids[newIndex]) onEntryChange(ids[newIndex])
    }
  }

  const toggleList = () => {
    setIsListOpen(prev => !prev)
    if (isListOpen) setSearchQuery('')
  }

  const selectCharacter = (index) => {
    setCurrentIndex(index)
    setIsListOpen(false)
    setSearchQuery('')
    if (onEntryChange && ids[index]) onEntryChange(ids[index])
  }

  const handleScroll = useCallback((e) => {
    const target = e.target
    const maxScroll = target.scrollHeight - target.clientHeight
    setScrollProgress(maxScroll <= 0 ? 100 : (target.scrollTop / maxScroll) * 100)
  }, [])

  const filteredCharacters = searchQuery.trim()
    ? characters.map((c, i) => ({ ...c, originalIndex: i })).filter(c =>
        (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.title || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : characters.map((c, i) => ({ ...c, originalIndex: i }))

  return (
    <div className={`w-full h-screen ${isDark ? 'bg-[#050505]' : 'bg-gray-900'} bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] flex items-center justify-center`} style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Serif SC', sans-serif" }}>
      <div className={`relative flex z-10 shadow-2xl ${isMobile ? `w-full h-[100dvh] flex-col rounded-none p-0 overflow-y-auto no-scrollbar ${isDark ? 'bg-stoneBg' : 'bg-[#f9fafb]'}` : `${isDark ? 'bg-stoneBg' : 'bg-[#f9fafb]'} w-11/12 md:w-10/12 max-w-5xl h-[80vh] md:h-[75vh] flex-col md:flex-row p-5 md:p-8 gap-6 md:gap-10 rounded-2xl ${isDark ? 'border border-stoneBorder' : 'border border-white/60'}`}`}
        onScroll={isMobile ? handleScroll : null} ref={scrollContainerMobileRef}
      >
        <button onClick={onClose} className={`z-[400] w-8 h-8 rounded-full backdrop-blur-sm shadow-sm border flex items-center justify-center transition-all cursor-pointer ${isMobile ? 'fixed top-4 right-4' : 'absolute top-4 right-4 md:top-5 md:right-5 hover:scale-110'} ${isDark ? 'bg-stoneCard/90 border-stoneBorder text-stone-400 hover:text-[#d4b58e] hover:bg-stoneCard' : 'bg-white/90 border-gray-200 text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`}>
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className={`flex-shrink-0 relative z-50 flex items-center justify-center pointer-events-none ${isMobile ? `w-full aspect-[9/16] overflow-hidden ${isDark ? 'bg-stoneBg' : 'bg-[#f9fafb]'}` : 'w-full md:w-1/3 h-[40%] md:h-full'}`}>
          <div className={`absolute bg-transparent rounded-xl border-[2px] border-[#d4b58e]/50 flex items-center justify-center overflow-hidden pointer-events-none ${isMobile ? 'inset-4 md:inset-0 border-none rounded-none' : 'inset-4 md:inset-0'}`}>
            <div className="absolute inset-1.5 border border-[#d4b58e]/30 rounded-lg pointer-events-none" />
            <svg className="absolute top-0 left-0 w-6 h-6 text-[#d4b58e]/80 -translate-x-1 -translate-y-1" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10Z" /></svg>
            <svg className="absolute top-0 right-0 w-6 h-6 text-[#d4b58e]/80 translate-x-1 -translate-y-1" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10Z" /></svg>
            <svg className="absolute bottom-0 left-0 w-6 h-6 text-[#d4b58e]/80 -translate-x-1 translate-y-1" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10Z" /></svg>
            <svg className="absolute bottom-0 right-0 w-6 h-6 text-[#d4b58e]/80 translate-x-1 translate-y-1" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10Z" /></svg>
            {character && character.bg_image_url && (
              <img key={'bg-' + character.bg_image_url} src={character.bg_image_url}
                style={{ width: (character.bg_image_scale || 120) + '%', height: (character.bg_image_scale || 120) + '%' }}
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 object-cover transition-all duration-300 pointer-events-none z-10 ${isDark ? 'opacity-40 mix-blend-multiply' : 'opacity-40 mix-blend-multiply'}`} draggable="false" />
            )}
          </div>

          <div className="absolute inset-0 flex items-center justify-center z-[300] pointer-events-none">
            {character && character.image_url ? (
              <div key={'img-' + character.image_url} className="relative pointer-events-auto flex-shrink-0 transition-transform duration-500 hover:scale-[1.03]"
                style={isMobile ? { width: '100%', height: '100%' } : { width: (character.main_image_scale || 100) + '%' }}>
                <img src={character.image_url}
                  className={`max-w-none object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.25)] block ${isMobile ? 'w-full h-full p-4' : 'w-full h-auto'}`} draggable="false" />
              </div>
            ) : node && node.icon ? (
              <div key={'icon-' + node.icon} className="relative pointer-events-auto flex-shrink-0 transition-transform duration-300 hover:scale-[1.03]"
                style={isMobile ? { width: '60%', height: '100%' } : { width: ((character ? (character.main_image_scale || 100) : 100) * 0.6) + '%' }}>
                <img src={node.icon}
                  className={`max-w-none object-contain drop-shadow-[0_15px_35px_rgba(0,0,0,0.15)] block ${isMobile ? 'w-full h-full p-4' : 'w-full h-auto'} ${isDark ? 'opacity-80' : 'opacity-80'}`} draggable="false" />
              </div>
            ) : null}
          </div>
        </div>

        <div className={`flex flex-col relative pointer-events-auto ${isMobile ? `w-full rounded-t-3xl mt-0 flex-none overflow-visible min-h-[50vh] ${isDark ? 'shadow-[0_-5px_20px_rgba(0,0,0,0.3)] border-t border-stoneBorder/80 bg-stoneCard' : 'shadow-[0_-5px_20px_rgba(0,0,0,0.05)] border-t border-white/80 bg-[#fdfdfc]'}` : `${isDark ? 'flex-1 border border-stoneBorder rounded-xl shadow-sm h-[60%] md:h-full bg-stoneCard' : 'flex-1 border border-gray-100 rounded-xl shadow-sm h-[60%] md:h-full bg-[#fdfdfc]'}`}`}>
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center pt-20 md:pt-0">
              <div className="flex flex-col items-center opacity-50">
                <svg className={`animate-spin w-8 h-8 mb-4 ${isDark ? 'text-stone-500' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                <span className={`text-xs font-mono tracking-widest uppercase ${isDark ? 'text-stone-500' : 'text-gray-400'}`}>Fetching Database...</span>
              </div>
            </div>
          ) : characters.length === 0 ? (
            <div className="flex-1 flex items-center justify-center pt-20 md:pt-0">
              <div className="flex flex-col items-center opacity-50">
                <svg className={`w-12 h-12 mb-4 ${isDark ? 'text-stone-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                <span className={`text-xs font-mono tracking-widest uppercase ${isDark ? 'text-stone-500' : 'text-gray-400'}`}>Archive Not Found</span>
              </div>
            </div>
          ) : (
            <>
              <div className={`flex flex-col text-left relative z-0 ${isMobile ? 'px-6 pt-10 pb-[120px]' : 'flex-1 overflow-y-auto px-8 py-10 md:px-12 md:py-14 no-scrollbar rounded-t-xl'}`}
                onScroll={!isMobile ? handleScroll : null} ref={scrollContainerDesktopRef}>
                <div key={currentIndex}>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0 flex flex-col gap-2">
                      {character.name && character.name.split('\\n').map((line, idx) => (
                        <h1 key={'std-title-' + idx}
                          className={`font-bold tracking-tight uppercase ${isMobile ? 'text-2xl' : 'text-3xl md:text-4xl'} ${isDark ? 'text-[#dcd6cc]' : 'text-gray-900'}`}
                          style={{ fontFamily: "'Cinzel', serif", lineHeight: 1.2 }}
                          dangerouslySetInnerHTML={{ __html: line }} />
                      ))}
                      {character.title && (
                        <h2 className={`mt-1 md:mt-2 font-light tracking-wide ${isMobile ? 'text-base' : 'text-lg md:text-xl'} ${isDark ? 'text-stone-400' : 'text-gray-500'}`} dangerouslySetInnerHTML={{ __html: character.title }} />
                      )}
                    </div>
                    {character && character.title_icon_url && !isMobile && (
                      <div className="relative shrink-0 w-14 h-14 md:w-20 md:h-20 flex items-center justify-center transition-transform duration-300 hover:scale-[1.05]">
                        <img src={character.title_icon_url}
                          style={{ transform: 'scale(' + ((character.title_icon_scale || 100) / 100) + ')' }}
                          className={`w-full h-full object-contain drop-shadow-md pointer-events-none select-none block ${isDark ? 'opacity-70' : 'opacity-90'}`} draggable="false" />
                      </div>
                    )}
                  </div>
                  <hr className={`border-t my-6 md:my-8 ${isDark ? 'border-stoneBorder' : 'border-gray-100'}`} />
                  {character.kv && character.kv.length > 0 && (
                    <div className={`mb-6 md:mb-8 pb-6 border-b border-dashed space-y-4 text-base relative z-10 leading-[2.25] font-serif ${isDark ? 'border-stoneBorder' : 'border-gray-200'}`}>
                      {character.kv.map((item, idx) => (
                        <p key={idx}><strong className={`mr-2 font-bold ${isDark ? 'text-[#dcd6cc]' : 'text-gray-900'}`}>{item.key}</strong> <span className={`${isDark ? 'text-stone-400' : 'text-gray-600'}`} dangerouslySetInnerHTML={{ __html: item.value }} /></p>
                      ))}
                    </div>
                  )}
                  <div className={`space-y-6 text-sm md:text-base leading-[2.25] relative ${isDark ? 'text-stone-300' : 'text-gray-700'}`}>
                    {character.blocks && character.blocks.map((block, index) => {
                      if (block.type === 'paragraph') {
                        return <p key={'block-' + index} className="text-justify relative z-10 indent-8" dangerouslySetInnerHTML={{ __html: block.content }} />
                      } else if (block.type === 'image') {
                        return (
                          <div key={'block-' + index} className="flex flex-col items-center my-8 md:my-10 relative z-50 w-full overflow-visible">
                            <div className="relative transition-transform duration-500 hover:scale-[1.02] flex-shrink-0" style={{ width: block.scale ? block.scale + '%' : '100%' }}>
                              <img src={block.url} className="w-full h-auto max-w-none object-contain drop-shadow-xl rounded-md block" draggable="false" />
                            </div>
                            {block.caption && <span className={`text-xs mt-4 tracking-widest px-3 py-1 rounded-full relative z-50 ${isDark ? 'text-stone-400 bg-stoneBg border border-stoneBorder' : 'text-gray-500 bg-white border border-gray-100'}`}>{block.caption}</span>}
                          </div>
                        )
                      } else if (block.type === 'quote') {
                        return (
                          <div key={'block-' + index} className="my-6 md:my-8 px-4 md:px-8 relative">
                            <div className={`text-justify font-normal flex items-start ${isDark ? 'text-stone-200' : 'text-gray-800'}`}>
                              <span className="text-3xl font-serif text-[#d4b58e] mr-2 pt-1 leading-none">"</span>
                              <span className="flex-1" dangerouslySetInnerHTML={{ __html: block.content }} />
                              <span className="text-3xl font-serif text-[#d4b58e] ml-2 pt-1 leading-none">"</span>
                            </div>
                            {block.author && <div className={`text-right mt-4 text-sm tracking-widest font-normal ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>—— <span dangerouslySetInnerHTML={{ __html: block.author }} /></div>}
                          </div>
                        )
                      }
                      return null
                    })}
                  </div>
                </div>
              </div>

              <div className={`backdrop-blur-md z-[60] flex flex-col shadow-[0_10px_30px_rgba(0,0,0,0.03)] border-b ${isListOpen ? '' : 'hidden'} ${isMobile ? 'fixed top-0 left-0 right-0 bottom-[56px]' : 'absolute top-0 left-0 right-0 bottom-[60px] rounded-t-xl'} ${isDark ? 'bg-stoneBg/95 border-stoneBorder' : 'bg-white/95 border-gray-100'}`}>
                <div className={`p-6 md:px-10 border-b shrink-0 ${isDark ? 'border-stoneBorder' : 'border-gray-100'}`}>
                  <div className={`flex items-center rounded-full px-5 py-2.5 focus-within:border-[#d4b58e]/50 focus-within:ring-1 focus-within:ring-[#d4b58e]/30 transition-all shadow-sm ${isDark ? 'bg-stoneCard border border-stoneBorder focus-within:bg-stoneCard' : 'bg-gray-50 border border-gray-200 focus-within:bg-white'}`}>
                    <svg className={`w-4 h-4 mr-3 ${isDark ? 'text-stone-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} type="text" placeholder="搜索角色名或称号..." className={`w-full bg-transparent text-sm focus:outline-none font-serif tracking-wide ${isDark ? 'text-stone-300 placeholder-stone-500' : 'text-gray-700 placeholder-gray-400'}`} />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 md:px-8 no-scrollbar">
                  {filteredCharacters.length === 0 && <div className={`text-center text-sm py-10 ${isDark ? 'text-stone-500' : 'text-gray-400'}`}>没有找到相关条目</div>}
                  {filteredCharacters.map(char => (
                    <button key={char.originalIndex} onClick={() => selectCharacter(char.originalIndex)}
                      className={`w-full text-left px-4 py-4 rounded-md mb-2 transition-colors flex justify-between items-center group ${currentIndex === char.originalIndex ? (isDark ? 'bg-stoneCard border border-stoneBorder' : 'bg-gray-100 border border-gray-200') : (isDark ? 'hover:bg-stoneCard/50 border border-transparent' : 'hover:bg-gray-50 border border-transparent')}`}>
                      <div className="flex flex-col">
                        <span className={`uppercase tracking-wide ${currentIndex === char.originalIndex ? (isDark ? 'text-[#dcd6cc] font-semibold' : 'text-gray-900 font-semibold') : (isDark ? 'text-stone-400' : 'text-gray-600')}`} style={{ fontFamily: "'Cinzel', serif" }} dangerouslySetInnerHTML={{ __html: char.name }} />
                        <span className={`text-xs mt-1 ${currentIndex === char.originalIndex ? (isDark ? 'text-stone-400' : 'text-gray-500') : (isDark ? 'text-stone-500' : 'text-gray-400')}`} dangerouslySetInnerHTML={{ __html: char.title }} />
                      </div>
                      <span className={`text-xs font-mono tracking-widest transition-colors ${isDark ? 'text-stone-500 group-hover:text-stone-400' : 'text-gray-400 group-hover:text-gray-600'}`}>{String(char.originalIndex + 1).padStart(2, '0')}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={`border-t shrink-0 select-none z-[40] pointer-events-none ${isMobile ? 'fixed bottom-0 left-0 right-0 h-[56px]' : 'relative h-[60px] w-full rounded-b-xl'} ${isDark ? 'border-stoneBorder/60 bg-stoneBg' : 'border-gray-200/60 bg-[#fbfbfa]'}`}>
                <div className="absolute bottom-0 left-0 h-[3px] bg-[#d4b58e] transition-[width] duration-150 ease-out z-40 rounded-r-full" style={{ width: scrollProgress + '%' }} />
              </div>

              <div className={`flex items-center justify-between shrink-0 select-none z-[60] pointer-events-none ${isMobile ? 'fixed bottom-0 left-0 right-0 h-[56px] px-4' : 'absolute bottom-0 left-0 right-0 h-[60px] px-4 md:px-8'}`}>
                <button onClick={prev} disabled={currentIndex === 0}
                  className={`pointer-events-auto group flex items-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 ${isDark ? 'text-stone-400 hover:text-[#d4b58e] disabled:hover:text-stone-400' : 'text-gray-400 hover:text-[#d4b58e] disabled:hover:text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all shadow-sm ${isDark ? 'border-stoneBorder group-hover:border-[#d4b58e]/50 bg-stoneCard' : 'border-gray-200 group-hover:border-[#d4b58e]/50 bg-white'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 19l-7-7 7-7" /></svg>
                  </div>
                  <span className="hidden md:block uppercase tracking-[0.2em] text-[10px] font-bold" style={{ fontFamily: "'Cinzel', serif" }}>Prev</span>
                </button>

                <button onClick={toggleList} className="pointer-events-auto relative group flex items-center gap-4 px-2 py-2 transition-all duration-300">
                  <div className={`w-6 md:w-12 h-px bg-gradient-to-r from-transparent transition-colors ${isDark ? 'to-stoneBorder group-hover:to-[#d4b58e]' : 'to-gray-300 group-hover:to-[#d4b58e]'}`} />
                  <div className={`flex items-center gap-2 transition-colors ${isDark ? 'text-stone-300 group-hover:text-[#d4b58e]' : 'text-gray-800 group-hover:text-[#d4b58e]'}`}>
                    {isListOpen ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 12h16M4 18h16" /></svg>
                    )}
                    <span className="tracking-[0.2em] font-mono text-xs font-medium">{String(currentIndex + 1).padStart(2, '0')} <span className={isDark ? 'text-stone-500 mx-1' : 'text-gray-300 mx-1'}>/</span> <span className={isDark ? 'text-stone-500' : 'text-gray-400'}>{String(characters.length).padStart(2, '0')}</span></span>
                  </div>
                  <div className={`w-6 md:w-12 h-px bg-gradient-to-l from-transparent transition-colors ${isDark ? 'to-stoneBorder group-hover:to-[#d4b58e]' : 'to-gray-300 group-hover:to-[#d4b58e]'}`} />
                </button>

                <button onClick={next} disabled={currentIndex === characters.length - 1}
                  className={`pointer-events-auto group flex items-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 ${isDark ? 'text-stone-400 hover:text-[#d4b58e] disabled:hover:text-stone-400' : 'text-gray-400 hover:text-[#d4b58e] disabled:hover:text-gray-400'}`}>
                  <span className="hidden md:block uppercase tracking-[0.2em] text-[10px] font-bold" style={{ fontFamily: "'Cinzel', serif" }}>Next</span>
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all shadow-sm ${isDark ? 'border-stoneBorder group-hover:border-[#d4b58e]/50 bg-stoneCard' : 'border-gray-200 group-hover:border-[#d4b58e]/50 bg-white'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5l7 7-7 7" /></svg>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default StandardDetail
