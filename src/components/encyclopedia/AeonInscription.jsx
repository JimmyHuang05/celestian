import { useLayoutEffect, useRef, useState } from 'react'
import AeonFirmament from './AeonFirmament.jsx'

export default function AeonInscription({ entry: selected }) {
  const [entry, setEntry] = useState(selected)
  const inscription = useRef(null)
  const reader = useRef(null)
  const initial = useRef(true)
  const [scrollAction, setScrollAction] = useState(null)

  useLayoutEffect(() => {
    const panel = reader.current
    panel.scrollTop = 0
    function update() {
      const travel = panel.scrollHeight - panel.clientHeight
      setScrollAction(travel <= 2 ? null : panel.scrollTop >= travel - 2 ? 'top' : 'next')
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(panel)
    observer.observe(panel.firstElementChild)
    panel.addEventListener('scroll', update, { passive: true })
    return () => {
      observer.disconnect()
      panel.removeEventListener('scroll', update)
    }
  }, [entry])

  useLayoutEffect(() => {
    if (initial.current && entry === selected) return
    initial.current = false
    const leaving = entry !== selected
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (motion.matches && !leaving) return
    const opacity = motion.matches ? [1, 1] : leaving ? [1, 0] : [0, 1]
    const animations = [inscription.current, reader.current].map(element => element.animate(
      { opacity },
      { duration: motion.matches ? 0 : leaving ? 150 : 200, easing: 'ease-in-out', fill: 'both' },
    ))
    if (leaving) animations[0].onfinish = () => setEntry(selected)
    const finish = () => animations.forEach(animation => animation.finish())
    motion.addEventListener('change', finish)
    return () => {
      motion.removeEventListener('change', finish)
      animations[0].onfinish = null
      animations.forEach(animation => animation.cancel())
    }
  }, [entry, selected])

  const [name, ...epithets] = entry.name.split(' · ')
  return (
    <div className="aeon-paper__inscription" style={{ '--name-length': Math.max(1, Array.from(entry.name).length) }}>
      <div className="aeon-paper__stage">
        <AeonFirmament />
        {entry.artwork && <img className="aeon-paper__artwork" src={entry.artwork} alt={entry.name + '立绘'} />}
        <p className="aeon-paper__order">{entry.group}档案</p>
        <div className="aeon-paper__identity" ref={inscription}>
          <p className="aeon-paper__path">{entry.pathway}</p>
          <h1 id="aeon-name" aria-label={entry.name}>
            <span className="aeon-paper__name">{entry.nameBreakAfter
              ? <><span>{entry.nameBreakAfter}</span><wbr /><span>{name.slice(entry.nameBreakAfter.length)}</span></>
              : name}</span>
            {epithets.length > 0 && <span className="aeon-paper__epithet">{epithets.join(' · ')}</span>}
          </h1>
        </div>
      </div>
      <div className="aeon-paper__folio">
        <section id="aeon-reading" className="aeon-paper__details" data-more={scrollAction === 'next'} ref={reader} tabIndex={0} aria-label={entry.name + '的档案'}>
          <div>
            {(entry.lore ?? []).map((block, index) => {
              if (block.type === 'heading') return <h2 key={index}>{block.text}</h2>
              if (block.type === 'list') return <ul key={index}>{block.items.map(item =>
                <li key={item.label}><strong>{item.label}</strong>{item.text}</li>)}</ul>
              return <p key={index}>{block.text}</p>
            })}
            <h2>权柄</h2>
            <dl className="aeon-paper__powers">
              {entry.powers.map(power => <div key={power.label}>
                <dt>{power.label}</dt><dd>{power.text.replace(/^。/, '')}</dd>
              </div>)}
            </dl>
          </div>
        </section>
        {scrollAction && <button className="aeon-paper__read-next" type="button"
          aria-controls="aeon-reading" aria-label={scrollAction === 'top' ? '回到正文开头' : '继续阅读'}
          title={scrollAction === 'top' ? '回到正文开头' : '继续阅读'}
          onClick={() => {
            const panel = reader.current
            panel.scrollTo({
              top: scrollAction === 'top' ? 0 : panel.scrollTop + panel.clientHeight * .8,
              behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
            })
          }}>{scrollAction === 'top' ? '↑' : '↓'}</button>}
      </div>
    </div>
  )
}
