import { Navigate, Route, Routes } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import MapPage from './pages/MapPage.jsx'
import { lazy, Suspense } from 'react'
const EncyclopediaPage = lazy(() => import('./pages/EncyclopediaPage.jsx'))
const MapPainterPage = lazy(() => import('./pages/MapPainterPage.jsx'))

export default function App() {
  const encyclopedia = <ErrorBoundary><Suspense fallback={null}><EncyclopediaPage /></Suspense></ErrorBoundary>
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/encyclopedia/" replace />} />
      <Route path="/encyclopedia" element={encyclopedia} />
      <Route path="/encyclopedia/gallery" element={<Navigate to="/map/" replace />} />
      <Route path="/encyclopedia/:nodeId" element={encyclopedia} />
      <Route path="/map" element={<ErrorBoundary><MapPage /></ErrorBoundary>} />
      <Route path="/map-painter" element={<ErrorBoundary><Suspense fallback={<div>正在打开涂色工作台…</div>}><MapPainterPage /></Suspense></ErrorBoundary>} />
      <Route path="/functions/*" element={<Navigate to="/encyclopedia/" replace />} />
    </Routes>
  )
}
