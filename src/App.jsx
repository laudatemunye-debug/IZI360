import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Accueil from './pages/Accueil'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Accueil />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
