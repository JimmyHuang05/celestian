import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import AtlasMusicControl from '../AtlasMusicControl.jsx'
import paths from './aeon-paths.json'
import AeonInscription from './AeonInscription.jsx'
import { drawPaperGrain } from '../../studies/paper-grain.js'
import '../../page-colophon.css'
import './aeon-paper-study.css'

function Arrow({ back = false }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d={back ? 'm6 15 6-6 6 6' : 'm6 9 6 6 6-6'} />
  </svg>
}

function Catalog({ entry, index, onSelect }) {
  const dialog = useRef(null)
  function choose(pathway) {
    dialog.current.close()
    onSelect(pathway)
  }
  return <nav className="aeon-paper__nav" aria-label="切换神祇">
    <button type="button" className="aeon-paper__turn" disabled={index === 0} aria-label="上一位神祇" onClick={() => onSelect(paths[index - 1].pathway)}>
      <Arrow back />
    </button>
    {paths.map(record => <button key={record.pathway} className="aeon-paper__dot" type="button"
      aria-current={record === entry ? 'true' : undefined} aria-label={record.name} title={record.name}
      onClick={() => onSelect(record.pathway)} />)}
    <button type="button" className="aeon-paper__turn" disabled={index === paths.length - 1} aria-label="下一位神祇" onClick={() => onSelect(paths[index + 1].pathway)}>
      <Arrow />
    </button>
    <button type="button" className="aeon-paper__catalog-toggle" onClick={() => dialog.current.showModal()}
      aria-label="神祇目录" title="神祇目录" aria-haspopup="dialog">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6h14M5 12h14M5 18h14" /></svg>
    </button>
    <dialog ref={dialog} className="aeon-paper__catalog" aria-labelledby="aeon-catalog-title">
      <div className="aeon-paper__catalog-head">
        <h2 id="aeon-catalog-title">神祇目录</h2>
        <button type="button" className="aeon-paper__step" aria-label="关闭目录" onClick={() => dialog.current.close()}>×</button>
      </div>
      {['神祇', '伪神'].map(group => <section key={group}>
        <h3>{group}</h3>
        <div>{paths.filter(record => record.group === group).map(record =>
          <button key={record.pathway} type="button" aria-current={record === entry ? 'true' : undefined}
            onClick={() => choose(record.pathway)}>{record.name}</button>)}</div>
      </section>)}
    </dialog>
  </nav>
}

export default function AeonPaperStudy({ onClose, initialId }) {
  const [params, setParams] = useSearchParams()
  const reader = useRef(null)
  const paper = useRef(null)
  useEffect(() => { drawPaperGrain(paper.current) }, [])
  const entry = paths.find(record => record.pathway === params.get('path'))
    || paths.find(record => record.legacyId && record.legacyId === initialId) || paths[0]
  const index = paths.indexOf(entry)
  useEffect(() => {
    reader.current?.scrollTo({ top: 0 })
  }, [entry.pathway])

  function select(pathway) {
    const next = new URLSearchParams(params)
    next.set('path', pathway)
    next.delete('view')
    setParams(next, { replace: true })
  }
  return <section className="aeon-paper" aria-label="神祇档案">
    <canvas ref={paper} className="aeon-paper__grain" aria-hidden="true" />
    <header className="aeon-paper__header" aria-label="页面操作">
      <AtlasMusicControl showPlayer={false} />
      <button className="page-action page-action--close" type="button" onClick={onClose}
        aria-label="关闭并返回百科">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>
      </button>
    </header>
    <div className="aeon-paper__spread" ref={reader} tabIndex={-1} aria-label="预览">
        <section className="aeon-paper__frontispiece" aria-labelledby="aeon-name">
          <AeonInscription entry={entry} />
        </section>
    </div>
    <Catalog index={index} entry={entry} onSelect={select} />
    <footer className="page-colophon aeon-paper__band">
      <span><span lang="la">NOMEN EST LIMEN</span> · 名为界，亦为门</span>
    </footer>
  </section>
}
