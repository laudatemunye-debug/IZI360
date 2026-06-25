import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import logoLight from '../assets/logo-light.png'

const API = 'http://localhost:5000/api'

export default function VerifyEmail() {
  const [status, setStatus] = useState('loading')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) { setStatus('error'); return }
    fetch(`${API}/auth/verify-email?token=${token}`)
      .then(res => res.json())
      .then(data => { if (data.message) setStatus('success'); else setStatus('error') })
      .catch(() => setStatus('error'))
  }, [])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0F1117', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: '-apple-system, BlinkMacSystemFont, Inter, sans-serif' }}>
      <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#FFFFFF', border: '2px solid #1D9E75', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', margin: '0 auto 24px', boxShadow: '0 0 24px rgba(29,158,117,0.3)' }}>
        <img src={logoLight} alt="IZI360" style={{ width: '56px', height: '56px', objectFit: 'contain' }} />
      </div>

      {status === 'loading' && <p style={{ color: '#9CA3AF', fontSize: '16px' }}>Vérification en cours...</p>}

      {status === 'success' && (
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#1D9E75', fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Email confirmé !</p>
          <p style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '24px' }}>Votre compte est maintenant actif.</p>
          <button onClick={() => navigate('/login')} style={{ backgroundColor: '#1D9E75', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px 24px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
            Se connecter
          </button>
        </div>
      )}

      {status === 'error' && (
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#E24B4A', fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Lien invalide ou expiré</p>
          <p style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '24px' }}>Demandez un nouveau lien de confirmation.</p>
          <button onClick={() => navigate('/login')} style={{ backgroundColor: '#1D9E75', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px 24px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
            Retour au login
          </button>
        </div>
      )}
    </div>
  )
}
