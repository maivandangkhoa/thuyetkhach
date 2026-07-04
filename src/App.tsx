import { Routes, Route, Navigate } from 'react-router-dom'
import GamePage from './pages/GamePage'

// Standalone game site — `/` is the game, nothing else.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<GamePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
