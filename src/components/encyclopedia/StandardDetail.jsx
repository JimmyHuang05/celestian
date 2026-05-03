import { useState, useEffect, useRef, useCallback } from 'react'
import BlobImage from '../BlobImage.jsx'

function StandardDetail({ node, isMobile, onClose, supabaseClient, entryId, onEntryChange }) {
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
      if (!supabaseClient || !node) return
      setIsLoading(true)
      try {
        const { data, error } = await supabaseClient
          .from('entries').select('*').eq('node_id', node.id).order('created_at', { ascending: false })
        if (error) throw error
        if (data && data.length > 0) {
          const parsedData = data.map(row => {
            const blocksArr = []
            const kv = []
            if (row.blocks) {
              try {
                let firstParagraphFound = false
                JSON.parse(row.blocks).forEach(b => {
                  if (b.type === 'paragraph' && b.content) {
                    if (b.dropCap === undefined) b.dropCap = !firstParagraphFound
                    firstParagraphFound = true
                    blocksArr.push({ type: 'paragraph', content: b.content, dropCap: b.dropCap })
                  }
                  if (b.type === 'image' && b.url) blocksArr.push({ type: 'image', url: b.url, caption: b.caption, scale: b.scale || 100 })
                  if (b.type === 'key-value' && b.key) kv.push({ key: b.key, value: b.value })
                  if (b.type === 'quote' && b.content) blocksArr.push({ type: 'quote', content: b.content, author: b.author })
                })
              } catch (e) {}
            } else if (row.content) {
              blocksArr.push({ type: 'paragraph', content: row.content, dropCap: true })
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
            }
          })
          parsedData.sort((a, b) => a.sort_order - b.sort_order)
          const extractedIds = parsedData.map(c => c.id)
          setIds(extractedIds)
          setCharacters(parsedData)
          hasInitializedRef.current = true
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

  const renderBlockContent = (content) => {
    return { __html: content }
  }

  return (
    <div className="w-full h-screen bg-gray-900 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] flex items-center justify-center" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Serif SC', sans-serif" }}>
      <div className={`relative flex z-10 shadow-2xl ${isMobile ? 'w-full h-[100dvh] flex-col rounded-none p-0 overflow-y-auto no-scrollbar bg-[#f9fafb]' : 'bg-[#f9fafb] w-11/12 md:w-10/12 max-w-5xl h-[80vh] md:h-[75vh] flex-col md:flex-row p-5 md:p-8 gap-6 md:gap-10 rounded-2xl border border-white/60'}`}
        onScroll={isMobile ? handleScroll : null} ref={scrollContainerMobileRef}
      >
        <button onClick={onClose} className={`z-[400] w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-sm border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all cursor-pointer ${isMobile ? 'fixed top-4 right-4' : 'absolute top-4 right-4 md:top-5 md:right-5 hover:scale-110'}`}>
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className={`flex-shrink-0 relative z-50 flex items-center justify-center pointer-events-none ${isMobile ? 'w-full aspect-[9/16] overflow-hidden bg-[#f9fafb]' : 'w-full md:w-1/3 h-[40%] md:h-full'}`}>
          <div className={`absolute bg-transparent rounded-xl border-[2px] border-[#d4b58e]/50 flex items-center justify-center overflow-hidden pointer-events-none ${isMobile ? 'inset-4 md:inset-0 border-none rounded-none' : 'inset-4 md:inset-0'}`}>
            <div className="absolute inset-1.5 border border-[#d4b58e]/30 rounded-lg pointer-events-none" />
            <svg className="absolute top-0 left-0 w-6 h-6 text-[#d4b58e]/80 -translate-x-1 -translate-y-1" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10Z" /></svg>
            <svg className="absolute top-0 right-0 w-6 h-6 text-[#d4b58e]/80 translate-x-1 -translate-y-1" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10Z" /></svg>
            <svg className="absolute bottom-0 left-0 w-6 h-6 text-[#d4b58e]/80 -translate-x-1 translate-y-1" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10Z" /></svg>
            <svg className="absolute bottom-0 right-0 w-6 h-6 text-[#d4b58e]/80 translate-x-1 translate-y-1" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10Z" /></svg>
            {character && character.bg_image_url && (
              <BlobImage key={'bg-' + character.bg_image_url} src={character.bg_image_url}
                style={{ width: (character.bg_image_scale || 120) + '%', height: (character.bg_image_scale || 120) + '%' }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 object-cover opacity-40 mix-blend-multiply transition-all duration-300 pointer-events-none z-10" draggable="false" />
            )}
          </div>

          <div className="absolute inset-0 flex items-center justify-center z-[300] pointer-events-none">
            {character && character.image_url ? (
              <div key={'img-' + character.image_url} className="relative pointer-events-auto flex-shrink-0 transition-transform duration-500 hover:scale-[1.03]"
                style={isMobile ? { width: '100%', height: '100%' } : { width: (character.main_image_scale || 100) + '%' }}>
                <BlobImage src={character.image_url}
                  className={`max-w-none object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.25)] block ${isMobile ? 'w-full h-full p-4' : 'w-full h-auto'}`} draggable="false" />
              </div>
            ) : node && node.icon ? (
              <div key={'icon-' + node.icon} className="relative pointer-events-auto flex-shrink-0 transition-transform duration-300 hover:scale-[1.03]"
                style={isMobile ? { width: '60%', height: '100%' } : { width: ((character ? (character.main_image_scale || 100) : 100) * 0.6) + '%' }}>
                <BlobImage src={node.icon}
                  className={`max-w-none object-contain opacity-80 drop-shadow-[0_15px_35px_rgba(0,0,0,0.15)] block ${isMobile ? 'w-full h-full p-4' : 'w-full h-auto'}`} draggable="false" />
              </div>
            ) : null}
          </div>
        </div>

        <div className={`bg-[#fdfdfc] flex flex-col relative pointer-events-auto ${isMobile ? 'w-full rounded-t-3xl mt-0 flex-none shadow-[0_-5px_20px_rgba(0,0,0,0.05)] border-t border-white/80 overflow-visible min-h-[50vh]' : 'flex-1 border border-gray-100 rounded-xl shadow-sm h-[60%] md:h-full'}`}>
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center pt-20 md:pt-0">
              <div className="flex flex-col items-center opacity-50">
                <svg className="animate-spin w-8 h-8 text-gray-400 mb-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                <span className="text-xs font-mono tracking-widest text-gray-400 uppercase">Fetching Database...</span>
              </div>
            </div>
          ) : characters.length === 0 ? (
            <div className="flex-1 flex items-center justify-center pt-20 md:pt-0">
              <div className="flex flex-col items-center opacity-50">
                <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                <span className="text-xs font-mono tracking-widest text-gray-400 uppercase">Archive Not Found</span>
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
                          className={`font-bold tracking-tight text-gray-900 uppercase ${isMobile ? 'text-2xl' : 'text-3xl md:text-4xl'}`}
                          style={{ fontFamily: "'Cinzel', serif", lineHeight: 1.2 }}
                          dangerouslySetInnerHTML={{ __html: line }} />
                      ))}
                      {character.title && (
                        <h2 className={`text-gray-500 mt-1 md:mt-2 font-light tracking-wide ${isMobile ? 'text-base' : 'text-lg md:text-xl'}`} dangerouslySetInnerHTML={{ __html: character.title }} />
                      )}
                    </div>
                    {character && character.title_icon_url && !isMobile && (
                      <div className="relative shrink-0 w-14 h-14 md:w-20 md:h-20 flex items-center justify-center transition-transform duration-300 hover:scale-[1.05]">
                        <BlobImage src={character.title_icon_url}
                          style={{ transform: 'scale(' + ((character.title_icon_scale || 100) / 100) + ')' }}
                          className="w-full h-full object-contain opacity-90 drop-shadow-md pointer-events-none select-none block" draggable="false" />
                      </div>
                    )}
                  </div>
                  <hr className="border-t border-gray-100 my-6 md:my-8" />
                  {character.kv && character.kv.length > 0 && (
                    <div className="mb-6 md:mb-8 pb-6 border-b border-dashed border-gray-200 space-y-4 text-base relative z-10 leading-[2.25] font-serif">
                      {character.kv.map((item, idx) => (
                        <p key={idx}><strong className="text-gray-900 mr-2 font-bold">{item.key}</strong> <span className="text-gray-600" dangerouslySetInnerHTML={{ __html: item.value }} /></p>
                      ))}
                    </div>
                  )}
                  <div className="space-y-6 text-sm md:text-base leading-[2.25] text-gray-700 relative">
                    {character.blocks && character.blocks.map((block, index) => {
                      if (block.type === 'paragraph') {
                        return <p key={'block-' + index} className="text-justify relative z-10 indent-8" dangerouslySetInnerHTML={{ __html: block.content }} />
                      } else if (block.type === 'image') {
                        return (
                          <div key={'block-' + index} className="flex flex-col items-center my-8 md:my-10 relative z-50 w-full overflow-visible">
                            <div className="relative transition-transform duration-500 hover:scale-[1.02] flex-shrink-0" style={{ width: block.scale ? block.scale + '%' : '100%' }}>
                              <BlobImage src={block.url} className="w-full h-auto max-w-none object-contain drop-shadow-xl rounded-md block" draggable="false" />
                            </div>
                            {block.caption && <span className="text-xs text-gray-500 mt-4 tracking-widest bg-white border border-gray-100 px-3 py-1 rounded-full relative z-50">{block.caption}</span>}
                          </div>
                        )
                      } else if (block.type === 'quote') {
                        return (
                          <div key={'block-' + index} className="my-6 md:my-8 px-4 md:px-8 relative">
                            <div className="text-gray-800 text-justify font-normal flex items-start">
                              <span className="text-3xl font-serif text-[#d4b58e] mr-2 pt-1 leading-none">"</span>
                              <span className="flex-1" dangerouslySetInnerHTML={{ __html: block.content }} />
                              <span className="text-3xl font-serif text-[#d4b58e] ml-2 pt-1 leading-none">"</span>
                            </div>
                            {block.author && <div className="text-right mt-4 text-sm text-gray-500 tracking-widest font-normal">— <span dangerouslySetInnerHTML={{ __html: block.author }} /></div>}
                          </div>
                        )
                      }
                      return null
                    })}
                  </div>
                </div>
              </div>

              <div className={`bg-white/95 backdrop-blur-md z-[60] flex flex-col shadow-[0_10px_30px_rgba(0,0,0,0.03)] border-b border-gray-100 ${isListOpen ? '' : 'hidden'} ${isMobile ? 'fixed top-0 left-0 right-0 bottom-[56px]' : 'absolute top-0 left-0 right-0 bottom-[60px] rounded-t-xl'}`}>
                <div className="p-6 md:px-10 border-b border-gray-100 shrink-0">
                  <div className="flex items-center bg-gray-50 border border-gray-200 rounded-full px-5 py-2.5 focus-within:border-[#d4b58e]/50 focus-within:ring-1 focus-within:ring-[#d4b58e]/30 focus-within:bg-white transition-all shadow-sm">
                    <svg className="w-4 h-4 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} type="text" placeholder="搜索角色名或称号..." className="w-full bg-transparent text-sm focus:outline-none text-gray-700 placeholder-gray-400 font-serif tracking-wide" />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 md:px-8 no-scrollbar">
                  {filteredCharacters.length === 0 && <div className="text-center text-gray-400 text-sm py-10">没有找到相关条目</div>}
                  {filteredCharacters.map(char => (
                    <button key={char.originalIndex} onClick={() => selectCharacter(char.originalIndex)}
                      className={`w-full text-left px-4 py-4 rounded-md mb-2 transition-colors flex justify-between items-center group ${currentIndex === char.originalIndex ? 'bg-gray-100 border border-gray-200' : 'hover:bg-gray-50 border border-transparent'}`}>
                      <div className="flex flex-col">
                        <span className={`uppercase tracking-wide ${currentIndex === char.originalIndex ? 'text-gray-900 font-semibold' : 'text-gray-600'}`} style={{ fontFamily: "'Cinzel', serif" }} dangerouslySetInnerHTML={{ __html: char.name }} />
                        <span className={`text-xs mt-1 ${currentIndex === char.originalIndex ? 'text-gray-500' : 'text-gray-400'}`} dangerouslySetInnerHTML={{ __html: char.title }} />
                      </div>
                      <span className="text-xs font-mono tracking-widest text-gray-400 group-hover:text-gray-600 transition-colors">{String(char.originalIndex + 1).padStart(2, '0')}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={`border-t border-gray-200/60 bg-[#fbfbfa] shrink-0 select-none z-[40] pointer-events-none ${isMobile ? 'fixed bottom-0 left-0 right-0 h-[56px]' : 'relative h-[60px] w-full rounded-b-xl'}`}>
                <div className="absolute bottom-0 left-0 h-[3px] bg-[#d4b58e] transition-[width] duration-150 ease-out z-40 rounded-r-full" style={{ width: scrollProgress + '%' }} />
              </div>

              <div className={`flex items-center justify-between shrink-0 select-none z-[60] pointer-events-none ${isMobile ? 'fixed bottom-0 left-0 right-0 h-[56px] px-4' : 'absolute bottom-0 left-0 right-0 h-[60px] px-4 md:px-8'}`}>
                <button onClick={prev} disabled={currentIndex === 0}
                  className="pointer-events-auto group flex items-center gap-3 text-gray-400 hover:text-[#d4b58e] disabled:opacity-30 disabled:hover:text-gray-400 disabled:cursor-not-allowed transition-all duration-300">
                  <div className="w-8 h-8 rounded-full border border-gray-200 group-hover:border-[#d4b58e]/50 flex items-center justify-center transition-all bg-white shadow-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 19l-7-7 7-7" /></svg>
                  </div>
                  <span className="hidden md:block uppercase tracking-[0.2em] text-[10px] font-bold" style={{ fontFamily: "'Cinzel', serif" }}>Prev</span>
                </button>

                <button onClick={toggleList} className="pointer-events-auto relative group flex items-center gap-4 px-2 py-2 transition-all duration-300">
                  <div className="w-6 md:w-12 h-px bg-gradient-to-r from-transparent to-gray-300 group-hover:to-[#d4b58e] transition-colors" />
                  <div className="flex items-center gap-2 text-gray-800 group-hover:text-[#d4b58e] transition-colors">
                    {isListOpen ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 12h16M4 18h16" /></svg>
                    )}
                    <span className="tracking-[0.2em] font-mono text-xs font-medium">{String(currentIndex + 1).padStart(2, '0')} <span className="text-gray-300 mx-1">/</span> <span className="text-gray-400">{String(characters.length).padStart(2, '0')}</span></span>
                  </div>
                  <div className="w-6 md:w-12 h-px bg-gradient-to-l from-transparent to-gray-300 group-hover:to-[#d4b58e] transition-colors" />
                </button>

                <button onClick={next} disabled={currentIndex === characters.length - 1}
                  className="pointer-events-auto group flex items-center gap-3 text-gray-400 hover:text-[#d4b58e] disabled:opacity-30 disabled:hover:text-gray-400 disabled:cursor-not-allowed transition-all duration-300">
                  <span className="hidden md:block uppercase tracking-[0.2em] text-[10px] font-bold" style={{ fontFamily: "'Cinzel', serif" }}>Next</span>
                  <div className="w-8 h-8 rounded-full border border-gray-200 group-hover:border-[#d4b58e]/50 flex items-center justify-center transition-all bg-white shadow-sm">
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
