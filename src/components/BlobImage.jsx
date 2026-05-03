import { useState, useEffect, useRef } from 'react'

let cache = {}

function useBlobImage(src) {
  const [blobUrl, setBlobUrl] = useState(null)
  const cacheKeyRef = useRef('')

  useEffect(() => {
    if (!src) return

    cacheKeyRef.current = src

    if (cache[src]) {
      setBlobUrl(cache[src])
      return
    }

    let cancelled = false
    const xhr = new XMLHttpRequest()
    xhr.open('GET', src, true)
    xhr.responseType = 'blob'
    xhr.onload = () => {
      if (cancelled) return
      if (xhr.status === 200) {
        const url = URL.createObjectURL(xhr.response)
        cache[src] = url
        setBlobUrl(url)
      }
    }
    xhr.send()

    return () => { cancelled = true }
  }, [src])

  return blobUrl
}

function BlobImage({ src, alt, className, style, draggable, loading, decoding, onError, ...rest }) {
  const blobUrl = useBlobImage(src)
  return (
    <img
      src={blobUrl || ''}
      alt={alt || ''}
      className={className}
      style={style}
      draggable={draggable ?? false}
      loading={loading}
      decoding={decoding}
      onError={onError}
      {...rest}
    />
  )
}

export { useBlobImage }
export default BlobImage
