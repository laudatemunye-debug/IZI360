import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ProtectedRoute, AdminRoute, PublicRoute } from './components/ProtectedRoute'
import Accueil from './pages/Accueil'
import Login from './pages/Login'
import VerifyEmail from './pages/VerifyEmail'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import JangiApp from './modules/jangi/JangiApp'
import AdminDashboard from './pages/admin/Dashboard'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Routes publiques */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />

        {/* Routes protégées */}
        <Route path="/" element={<ProtectedRoute><Accueil /></ProtectedRoute>} />
        <Route path="/jangi/*" element={<ProtectedRoute><JangiApp /></ProtectedRoute>} />

        {/* Routes admin */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
