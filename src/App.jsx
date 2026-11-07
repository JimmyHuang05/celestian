import { Navigate, Route, Routes } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import EncyclopediaPage from './pages/EncyclopediaPage.jsx'
import MapPage from './pages/MapPage.jsx'
import { lazy, Suspense } from 'react'
const MapPainterPage = lazy(() => import('./pages/MapPainterPage.jsx'))

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/encyclopedia/" replace />} />
      <Route path="/encyclopedia" element={<ErrorBoundary><EncyclopediaPage /></ErrorBoundary>} />
      <Route path="/encyclopedia/gallery" element={<Navigate to="/map/" replace />} />
      <Route path="/encyclopedia/:nodeId" element={<ErrorBoundary><EncyclopediaPage /></ErrorBoundary>} />
      <Route path="/map" element={<ErrorBoundary><MapPage /></ErrorBoundary>} />
      <Route path="/map-painter" element={<ErrorBoundary><Suspense fallback={<div>正在打开涂色工作台…</div>}><MapPainterPage /></Suspense></ErrorBoundary>} />
      <Route path="/functions/*" element={<Navigate to="/encyclopedia/" replace />} />
    </Routes>
  )
}
