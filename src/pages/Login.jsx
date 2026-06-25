import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logoLight from '../assets/logo-light.png'

export default function Login() {
  const [darkMode, setDarkMode] = useState(true)
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ email: '', password: '', nom: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const theme = {
    bg:       darkMode ? '#0F1117' : '#F7F8FA',
    card:     darkMode ? '#1A1D27' : '#FFFFFF',
    text:     darkMode ? '#F0F0F0' : '#111111',
    textSub:  darkMode ? '#9CA3AF' : '#6B7280',
    border:   darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    input:    darkMode ? '#0F1117' : '#F7F8FA',
    accent:   '#1D9E75',
    accentDim: darkMode ? 'rgba(29,158,117,0.15)' : 'rgba(29,158,117,0.1)',
  }

  const f = patch => { setForm(p => ({ ...p, ...patch })); setError('') }

  const handleSubmit = async () => {
    if (!form.email || !form.password) { setError('Email et mot de passe requis.'); return }
    if (mode === 'register') {
      if (!form.nom) { setError('Votre nom est requis.'); return }
      if (form.password !== form.confirm) { setError('Les mots de passe ne correspondent pas.'); return }
      if (form.password.length < 6) { setError('Mot de passe trop court (6 caracteres min).'); return }
    }
    setLoading(true)
    setTimeout(() => { setLoading(false); navigate('/') }, 1200)
  }

  const inp = {
    width: '100%', padding: '12px 14px',
    backgroundColor: theme.input, border: `1px solid ${theme.border}`,
    borderRadius: '10px', fontSize: '14px', color: theme.text,
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', transition: 'all 0.3s', fontFamily: '-apple-system, BlinkMacSystemFont, Inter, sans-serif' }}>

      <button onClick={() => setDarkMode(d => !d)} style={{ position: 'fixed', top: 16, right: 16, background: theme.accentDim, border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '13px', color: theme.accent, fontWeight: '600' }}>
        {darkMode ? 'Clair' : 'Sombre'}
      </button>

      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#FFFFFF', border: `2px solid ${theme.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', margin: '0 auto 16px', boxShadow: '0 0 24px rgba(29,158,117,0.3)' }}>
          <img src={logoLight} alt="IZI360" style={{ width: '56px', height: '56px', objectFit: 'contain' }} />
        </div>
        <h1 style={{ color: theme.text, fontSize: '1.8rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em' }}>
          IZI<span style={{ color: theme.accent }}>360</span>
        </h1>
        <p style={{ color: theme.textSub, fontSize: '0.85rem', marginTop: '6px' }}>La suite logicielle IZISOFT</p>
      </div>

      <div style={{ width: '100%', maxWidth: '400px', backgroundColor: theme.card, borderRadius: '16px', border: `1px solid ${theme.border}`, padding: '32px', boxShadow: darkMode ? '0 8px 32px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.08)' }}>

        <div style={{ display: 'flex', gap: '4px', backgroundColor: theme.bg, borderRadius: '10px', padding: '4px', marginBottom: '24px' }}>
          {['login', 'register'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError('') }} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: mode === m ? theme.accent : 'transparent', color: mode === m ? '#fff' : theme.textSub, fontSize: '13px', fontWeight: '600', fontFamily: 'inherit' }}>
              {m === 'login' ? 'Connexion' : 'Inscription'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {mode === 'register' && (
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: theme.textSub, display: 'block', marginBottom: '6px' }}>Nom complet</label>
              <input style={inp} type="text" placeholder="Ex: Jean Dupont" value={form.nom} onChange={e => f({ nom: e.target.value })} />
            </div>
          )}
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: theme.textSub, display: 'block', marginBottom: '6px' }}>Adresse email</label>
            <input style={inp} type="email" placeholder="vous@email.com" value={form.email} onChange={e => f({ email: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: theme.textSub, display: 'block', marginBottom: '6px' }}>Mot de passe</label>
            <input style={inp} type="password" placeholder="••••••••" value={form.password} onChange={e => f({ password: e.target.value })} />
          </div>
          {mode === 'register' && (
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: theme.textSub, display: 'block', marginBottom: '6px' }}>Confirmer le mot de passe</label>
              <input style={inp} type="password" placeholder="••••••••" value={form.confirm} onChange={e => f({ confirm: e.target.value })} />
            </div>
          )}
          {error && (
            <div style={{ backgroundColor: 'rgba(226,75,74,0.1)', border: '1px solid rgba(226,75,74,0.3)', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: '#E24B4A' }}>
              {error}
            </div>
          )}
          {mode === 'login' && (
            <div style={{ textAlign: 'right' }}>
              <button style={{ background: 'none', border: 'none', color: theme.accent, fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>Mot de passe oublie ?</button>
            </div>
          )}
          <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', padding: '13px', backgroundColor: loading ? 'rgba(29,158,117,0.5)' : theme.accent, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit', marginTop: '4px' }}>
            {loading ? 'Connexion...' : mode === 'login' ? 'Se connecter' : 'Creer mon compte'}
          </button>
        </div>
      </div>

      <p style={{ color: theme.textSub, fontSize: '0.75rem', marginTop: '24px' }}>IZI360 - La suite logicielle IZISOFT v1.0</p>
    </div>
  )
}
