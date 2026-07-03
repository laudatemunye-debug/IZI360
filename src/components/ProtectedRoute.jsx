import { Navigate } from 'react-router-dom'

export function ProtectedRoute({ children }) {
  const token = localStorage.getItem('izi360_token')
  if (!token) return <Navigate to="/login" replace />
  return children
}

export function AdminRoute({ children }) {
  const token = localStorage.getItem('izi360_token')
  if (!token) return <Navigate to="/login" replace />
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (payload.role !== 'admin') return <Navigate to="/" replace />
    // Vérifier expiration
    if (payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('izi360_token')
      localStorage.removeItem('izi360_user')
      return <Navigate to="/login" replace />
    }
  } catch {
    return <Navigate to="/login" replace />
  }
  return children
}

export function FormateurRoute({ children }) {
  const token = localStorage.getItem('izi360_token')
  if (!token) return <Navigate to="/login" replace />
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('izi360_token')
      localStorage.removeItem('izi360_user')
      return <Navigate to="/login" replace />
    }
    if (payload.role === 'admin') return <Navigate to="/admin" replace />
    if (payload.role !== 'formateur') return <Navigate to="/" replace />
  } catch {
    return <Navigate to="/login" replace />
  }
  return children
}

export function PublicRoute({ children }) {
  const token = localStorage.getItem('izi360_token')
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.exp * 1000 > Date.now()) return <Navigate to="/" replace />
    } catch {}
  }
  return children
}
