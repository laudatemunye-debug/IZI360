import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import logoLight from '../assets/logo-light.png'

const API = 'import.meta.env.VITE_API_URL'

export default function Profil() {
  const [darkMode, setDarkMode] = useState(true)
  const [profil, setProfil] = useState(null)
  const [licences, setLicences] = useState([])
  const [loading, setLoading] = useState(true)
  const [section, setSection] = useState('infos')
  const [nomForm, setNomForm] = useState('')
  const [pwForm, setPwForm] = useState({ ancien: '', nouveau: '', confirm: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const token = localStorage.getItem('izi360_token')
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const theme = {
    bg:        darkMode ? '#0F1117' : '#F7F8FA',
    card:      darkMode ? '#1A1D27' : '#FFFFFF',
    text:      darkMode ? '#F0F0F0' : '#111111',
    textSub:   darkMode ? '#9CA3AF' : '#6B7280',
    border:    darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
    accent:    '#1D9E75',
    accentDim: darkMode ? 'rgba(29,158,117,0.15)' : 'rgba(29,158,117,0.1)',
    input:     darkMode ? '#0F1117' : '#F7F8FA',
  }

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [p, l] = await Promise.all([
        fetch(`${API}/user/profile`, { headers }).then(r => r.json()),
        fetch(`${API}/user/my-licences`, { headers }).then(r => r.json()),
      ])
      setProfil(p)
      setNomForm(p.nom || '')
      setLicences(Array.isArray(l) ? l : [])
    } catch {}
    setLoading(false)
  }

  const msg = (text, isError = false) => {
    if (isError) setError(text); else setMessage(text)
    setTimeout(() => { setMessage(''); setError('') }, 4000)
  }

  const updateNom = async () => {
    if (!nomForm.trim()) { msg('Nom requis', true); return }
    const res = await fetch(`${API}/user/profile`, { method: 'PUT', headers, body: JSON.stringify({ nom: nomForm }) })
    const data = await res.json()
    if (res.ok) {
      setProfil(p => ({ ...p, nom: data.nom }))
      localStorage.setItem('izi360_user', JSON.stringify({ ...JSON.parse(localStorage.getItem('izi360_user') || '{}'), nom: data.nom }))
      msg('Nom mis à jour !')
    } else msg(data.message, true)
  }

  const changePassword = async () => {
    if (!pwForm.ancien || !pwForm.nouveau) { msg('Tous les champs sont requis', true); return }
    if (pwForm.nouveau !== pwForm.confirm) { msg('Les mots de passe ne correspondent pas', true); return }
    const res = await fetch(`${API}/user/change-password`, { method: 'PUT', headers, body: JSON.stringify({ ancien: pwForm.ancien, nouveau: pwForm.nouveau }) })
    const data = await res.json()
    if (res.ok) { msg(data.message); setPwForm({ ancien: '', nouveau: '', confirm: '' }) }
    else msg(data.message, true)
  }

  const inp = { width: '100%', padding: '11px 14px', backgroundColor: theme.input, border: `1px solid ${theme.border}`, borderRadius: '10px', fontSize: '14px', color: theme.text, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }

  const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : ''

  const initiales = (nom) => nom?.split(' ').map(w => w[0]?.toUpperCase()).join('').slice(0, 2) || '?'

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: theme.textSub }}>Chargement...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, fontFamily: '-apple-system, BlinkMacSystemFont, Inter, sans-serif' }}>

      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', borderBottom: `1px solid ${theme.border}`, backgroundColor: theme.card, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#FFFFFF', border: `2px solid ${theme.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <img src={logoLight} alt="IZI360" style={{ width: '30px', height: '30px', objectFit: 'contain' }} />
          </div>
          <span style={{ color: theme.text, fontWeight: '700', fontSize: '15px' }}>IZI<span style={{ color: theme.accent }}>360</span></span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => navigate('/')} style={{ background: theme.accentDim, border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px', color: theme.accent, fontFamily: 'inherit' }}>← Accueil</button>
          <button onClick={() => setDarkMode(d => !d)} style={{ background: theme.accentDim, border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px', color: theme.accent, fontFamily: 'inherit' }}>
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Avatar + nom */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: theme.accentDim, border: `2px solid ${theme.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '800', color: theme.accent, flexShrink: 0 }}>
            {initiales(profil?.nom)}
          </div>
          <div>
            <div style={{ color: theme.text, fontSize: '1.4rem', fontWeight: '800' }}>{profil?.nom}</div>
            <div style={{ color: theme.textSub, fontSize: '13px', marginTop: '2px' }}>{profil?.email}</div>
            <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
              <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', backgroundColor: theme.accentDim, color: theme.accent, fontWeight: '600' }}>
                {profil?.role === 'admin' ? '🛡️ Admin' : '👤 Utilisateur'}
              </span>
              <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', backgroundColor: 'rgba(96,165,250,0.15)', color: '#60A5FA', fontWeight: '600' }}>
                Membre depuis {fmtDate(profil?.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', backgroundColor: theme.card, borderRadius: '10px', padding: '4px', marginBottom: '24px', border: `1px solid ${theme.border}` }}>
          {[{ key: 'infos', label: '👤 Infos' }, { key: 'securite', label: '🔒 Sécurité' }, { key: 'licences', label: '🔑 Licences' }].map(t => (
            <button key={t.key} onClick={() => section !== t.key && setSection(t.key)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: section === t.key ? theme.accent : 'transparent', color: section === t.key ? '#fff' : theme.textSub, fontSize: '13px', fontWeight: '600', fontFamily: 'inherit', transition: 'all 0.2s' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Messages */}
        {message && <p style={{ color: theme.accent, fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>✅ {message}</p>}
        {error && <p style={{ color: '#E24B4A', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>{error}</p>}

        {/* INFOS */}
        {section === 'infos' && (
          <div style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '24px' }}>
            <h2 style={{ color: theme.text, fontSize: '1rem', fontWeight: '700', marginBottom: '20px' }}>Informations personnelles</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: theme.textSub, display: 'block', marginBottom: '6px' }}>Nom complet</label>
                <input style={inp} type="text" value={nomForm} onChange={e => setNomForm(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: theme.textSub, display: 'block', marginBottom: '6px' }}>Adresse email</label>
                <input style={{ ...inp, opacity: 0.6, cursor: 'not-allowed' }} type="email" value={profil?.email || ''} disabled />
                <p style={{ color: theme.textSub, fontSize: '11px', marginTop: '4px' }}>L'email ne peut pas être modifié.</p>
              </div>
              <button onClick={updateNom} style={{ padding: '12px', backgroundColor: theme.accent, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                Sauvegarder
              </button>
            </div>
          </div>
        )}

        {/* SECURITE */}
        {section === 'securite' && (
          <div style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '24px' }}>
            <h2 style={{ color: theme.text, fontSize: '1rem', fontWeight: '700', marginBottom: '20px' }}>Changer le mot de passe</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { label: 'Mot de passe actuel', key: 'ancien', placeholder: '••••••••' },
                { label: 'Nouveau mot de passe', key: 'nouveau', placeholder: '••••••••' },
                { label: 'Confirmer le nouveau', key: 'confirm', placeholder: '••••••••' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: theme.textSub, display: 'block', marginBottom: '6px' }}>{f.label}</label>
                  <input style={inp} type="password" placeholder={f.placeholder} value={pwForm[f.key]} onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))} />
                </div>
              ))}
              <button onClick={changePassword} style={{ padding: '12px', backgroundColor: theme.accent, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                Mettre à jour
              </button>
            </div>
          </div>
        )}

        {/* LICENCES */}
        {section === 'licences' && (
          <div style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '24px' }}>
            <h2 style={{ color: theme.text, fontSize: '1rem', fontWeight: '700', marginBottom: '20px' }}>Mes licences ({licences.length})</h2>
            {licences.length === 0 ? (
              <p style={{ color: theme.textSub, fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>Aucune licence active.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {licences.map((l, i) => {
                  const jours = l.jours_restants !== null ? Math.ceil(l.jours_restants) : null
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', backgroundColor: theme.bg, borderRadius: '10px', border: `1px solid ${theme.border}` }}>
                      <div>
                        <div style={{ color: theme.text, fontWeight: '600', fontSize: '14px' }}>{l.nom}</div>
                        <div style={{ color: theme.textSub, fontSize: '12px', marginTop: '2px' }}>
                          {l.type === 'trial' ? `Essai gratuit` : l.type} · {l.date_fin ? `Expire le ${new Date(l.date_fin).toLocaleDateString('fr-FR')}` : 'Sans expiration'}
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', backgroundColor: jours !== null && jours <= 3 ? 'rgba(245,158,11,0.15)' : theme.accentDim, color: jours !== null && jours <= 3 ? '#F59E0B' : theme.accent, fontWeight: '700' }}>
                        {jours !== null ? `${jours}j restants` : '✓ Actif'}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
            <button onClick={() => navigate('/')} style={{ width: '100%', marginTop: '16px', padding: '12px', backgroundColor: theme.accentDim, color: theme.accent, border: `1px solid rgba(29,158,117,0.3)`, borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>
              + Ajouter un module
            </button>
          </div>
        )}

        {/* Déconnexion */}
        <button onClick={() => { localStorage.removeItem('izi360_token'); localStorage.removeItem('izi360_user'); navigate('/login') }}
          style={{ width: '100%', marginTop: '16px', padding: '12px', backgroundColor: 'rgba(226,75,74,0.1)', color: '#E24B4A', border: '1px solid rgba(226,75,74,0.2)', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>
          Déconnexion
        </button>
      </div>
    </div>
  )
}
