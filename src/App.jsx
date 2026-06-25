import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Accueil from './pages/Accueil'
import Login from './pages/Login'
import JangiApp from './modules/jangi/JangiApp'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Accueil />} />
        <Route path="/jangi/*" element={<JangiApp />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
