import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ProtectedRoute, AdminRoute, PublicRoute, FormateurRoute, AdminOrFormateurRoute } from './components/ProtectedRoute'
import Accueil from './pages/Accueil'
import Login from './pages/Login'
import VerifyEmail from './pages/VerifyEmail'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import JangiApp from './modules/jangi/JangiApp'
import AdminDashboard from './pages/admin/Dashboard'
import Profil from './pages/Profil'
import FormationChampignon from './pages/partenaires/FormationChampignon'
import LandingFormation from './pages/partenaires/LandingFormation'
import DevenirFormateur from './pages/partenaires/DevenirFormateur'
import EspaceFormateur from './pages/partenaires/EspaceFormateur'
import FormationDashboard from './pages/FormationDashboard'
import FormationContenus from './pages/partenaires/FormationContenus'
import LandingBeautyCRM from './pages/partenaires/LandingBeautyCRM'

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
        <Route path="/profil" element={<ProtectedRoute><Profil /></ProtectedRoute>} />
        <Route path="/admin/brevet/champignon" element={<ProtectedRoute><FormationChampignon /></ProtectedRoute>} />
        <Route path="/formation/champignon" element={<LandingFormation />} />
        <Route path="/devenir-formateur" element={<DevenirFormateur />} />
        <Route path="/formation/lancement-beautycrm" element={<LandingBeautyCRM />} />
        <Route path="/espace-formateur" element={<FormateurRoute><EspaceFormateur /></FormateurRoute>} />
        <Route path="/formation/:id/dashboard" element={<AdminOrFormateurRoute><FormationDashboard /></AdminOrFormateurRoute>} />
        <Route path="/formation/:id/contenus" element={<FormationContenus />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
