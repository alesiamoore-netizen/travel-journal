import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Editor from './pages/Editor'
import Capture from './pages/Capture'
import ShareView from './pages/ShareView'
import Memories from './pages/Memories'
import Timeline from './pages/Timeline'
import PhotoLibrary from './pages/PhotoLibrary'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/memories" element={<Memories />} />
      <Route path="/timeline" element={<Timeline />} />
      <Route path="/photo-library" element={<PhotoLibrary />} />
      <Route path="/journal/:id" element={<Editor />} />
      <Route path="/journal/:id/capture" element={<Capture />} />
      <Route path="/share/:id" element={<ShareView />} />
    </Routes>
  )
}
