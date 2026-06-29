import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import logoLight from '../assets/logo-light.png'

const API = import.meta.env.VITE_API_URL

export default function ResetPassword() {
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const theme = {
    bg: '#0F1117', card: '#1A1D27', text: '#F0F0F0',
    textSub: '#9CA3AF', border: 'rgba(255,255,255,0.08)',
    input: '#0F1117', accent: '#1D9E75',
  }

  const handleSubmit = async () => {
    if (!form.password || !form.confirm) { setError('Tous les champs sont requis'); return }
    if (form.password !== form.confirm) { setError('Les mots de passe ne correspondent pas'); return }
    if (form.password.length < 6) { setError('Mot de passe trop court (6 caractères min)'); return }
    setLoading(true); setError('')
    try {
      const token = searchParams.get('token')
      const res = await fetch(`${API}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: form.password })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message); setLoading(false); return }
      setMessage(data.message)
      setTimeout(() => navigate('/login'), 2000)
    } catch {
      setError('Impossible de contacter le serveur.')
    }
    setLoading(false)
  }

  const inp = { width: '100%', padding: '12px 14px', backgroundColor: theme.input, border: `1px solid ${theme.border}`, borderRadius: '10px', fontSize: '14px', color: theme.text, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: '-apple-system, BlinkMacSystemFont, Inter, sans-serif' }}>
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#FFFFFF', border: `2px solid ${theme.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', margin: '0 auto 16px', boxShadow: '0 0 24px rgba(29,158,117,0.3)' }}>
          <img src={logoLight} alt="IZI360" style={{ width: '56px', height: '56px', objectFit: 'contain' }} />
        </div>
        <h1 style={{ color: theme.text, fontSize: '1.8rem', fontWeight: '800', margin: 0 }}>IZI<span style={{ color: theme.accent }}>360</span></h1>
      </div>

      <div style={{ width: '100%', maxWidth: '400px', backgroundColor: theme.card, borderRadius: '16px', border: `1px solid ${theme.border}`, padding: '32px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
        <h2 style={{ color: theme.text, fontSize: '1.2rem', fontWeight: '700', marginBottom: '8px' }}>Nouveau mot de passe</h2>
        <p style={{ color: theme.textSub, fontSize: '13px', marginBottom: '24px' }}>Choisissez un nouveau mot de passe pour votre compte.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: theme.textSub, display: 'block', marginBottom: '6px' }}>Nouveau mot de passe</label>
            <input style={inp} type="password" placeholder="••••••••" value={form.password} onChange={e => { setForm(p => ({ ...p, password: e.target.value })); setError('') }} />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: theme.textSub, display: 'block', marginBottom: '6px' }}>Confirmer le mot de passe</label>
            <input style={inp} type="password" placeholder="••••••••" value={form.confirm} onChange={e => { setForm(p => ({ ...p, confirm: e.target.value })); setError('') }} />
          </div>

          {error && <p style={{ color: '#E24B4A', fontSize: '13px', margin: 0, textAlign: 'center' }}>{error}</p>}
          {message && <p style={{ color: theme.accent, fontSize: '13px', margin: 0, textAlign: 'center' }}>{message}</p>}

          <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', padding: '13px', backgroundColor: loading ? 'rgba(29,158,117,0.5)' : theme.accent, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit' }}>
            {loading ? 'Mise à jour...' : 'Mettre à jour'}
          </button>
        </div>
      </div>
    </div>
  )
}
