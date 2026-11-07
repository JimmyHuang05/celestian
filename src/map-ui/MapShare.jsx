import { useEffect, useRef, useState } from 'react'
import MapIcon from './MapIcon.jsx'

export default function MapShare({ value, onClose }) {
  const dialog = useRef(null), input = useRef(null)
  const [message, setMessage] = useState('')
  useEffect(() => {
    const previous = document.activeElement, element = dialog.current
    element.showModal()
    input.current?.focus(); input.current?.select()
    return () => { element.close(); (previous?.isConnected ? previous : document.querySelector('[aria-label="地图显示设置"]'))?.focus({ preventScroll: true }) }
  }, [])
  async function copy() {
    try {
      await navigator.clipboard.writeText(value.url)
      setMessage('链接已复制')
    } catch {
      input.current?.focus(); input.current?.select()
      setMessage('请复制上方已选中的链接')
    }
  }
  return <dialog ref={dialog} className="map-share" aria-labelledby="map-share-title" onCancel={event => { event.preventDefault(); onClose() }} onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose() } }} onClick={event => { if (event.target === dialog.current) { const b = dialog.current.getBoundingClientRect(); if (event.clientX < b.left || event.clientX > b.right || event.clientY < b.top || event.clientY > b.bottom) onClose() } }}>
    <div className="map-share__heading"><h2 id="map-share-title">{value.title}</h2><button className="map-icon-button" aria-label="关闭分享" onClick={onClose}><MapIcon name="close" /></button></div>
    <p>{value.selection ? '打开链接即可查看这份资料及分享时的地图视野。' : '打开链接即可回到这片视野，并保留当前图层显示。'}</p>
    <label htmlFor="map-share-url">分享链接</label>
    <input ref={input} id="map-share-url" type="text" readOnly value={value.url} onFocus={event => event.target.select()} />
    <button className="map-share__copy" onClick={copy}><MapIcon name={message === '链接已复制' ? 'check' : 'share'} />{message === '链接已复制' ? '已复制' : '复制链接'}</button>
    <span role="status" className="map-share__message">{message}</span>
  </dialog>
}
