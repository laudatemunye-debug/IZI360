import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Accueil from './pages/Accueil'
import Login from './pages/Login'
import VerifyEmail from './pages/VerifyEmail'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import JangiApp from './modules/jangi/JangiApp'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/" element={<Accueil />} />
        <Route path="/jangi/*" element={<JangiApp />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
