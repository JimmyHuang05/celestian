import { createRoot } from 'react-dom/client'
import LayerStudy from './components/EdenArtworkLayerStudy'

// Retain one React root even if Vite re-evaluates this entry during development.
const root = import.meta.hot?.data.root ?? createRoot(document.getElementById('root'))
if (import.meta.hot) import.meta.hot.data.root = root
root.render(<LayerStudy />)
