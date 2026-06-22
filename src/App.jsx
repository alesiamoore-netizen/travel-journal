import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Editor from './pages/Editor'
import Capture from './pages/Capture'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/journal/:id" element={<Editor />} />
      <Route path="/journal/:id/capture" element={<Capture />} />
    </Routes>
  )
}
