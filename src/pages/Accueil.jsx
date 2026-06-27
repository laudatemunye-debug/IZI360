import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import logoLight from '../assets/logo-light.png'

const API = 'http://localhost:5000/api'

const MODULES = [
  { id: 'jangi', nom: 'Izi Jangi', description: 'Gestion de tontine', detail: 'Épargne communautaire & rotative', emoji: '💰', route: '/jangi' },
  { id: 'hospi', nom: 'Izi Hospi', description: 'Gestion hospitalière', detail: 'Patients, consultations & facturation', emoji: '🏥', route: '/hospi' },
  { id: 'school', nom: 'Izi School', description: 'Gestion scolaire', detail: 'Élèves, notes & communication', emoji: '🎓', route: '/school' },
  { id: 'shop', nom: 'Izi Shop', description: 'Gestion de boutique', detail: 'Ventes, stock & caisse', emoji: '🛒', route: '/shop' },
  { id: 'transit', nom: 'Izi Transit', description: 'Gestion de transport', detail: 'Lignes, billets & flotte', emoji: '🚌', route: '/transit' },
  { id: 'beautycrm', nom: 'Beauty CRM', description: 'CRM & Gestion commerciale', detail: 'Clients, ventes, stock, prospects & séminaires', emoji: '💄', route: null, url: 'https://beautycrm-web.vercel.app' }
]

export default function Accueil() {
  const [darkMode, setDarkMode] = useState(true)
  const [hover, setHover] = useState(null)
  const [licences, setLicences] = useState([])
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [installPrompt, setInstallPrompt] = useState(null)
  const navigate = useNavigate()

  const token = localStorage.getItem('izi360_token')
  const user = JSON.parse(localStorage.getItem('izi360_user') || '{}')
  const isAdmin = user?.role === 'admin'
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  useEffect(() => {
    fetchData()
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); setInstallPrompt(e) })
  }, [])

  const fetchData = async () => {
    try {
      const [l, m] = await Promise.all([
        fetch(`${API}/user/my-licences`, { headers }).then(r => r.json()),
        fetch(`${API}/user/modules`, { headers }).then(r => r.json()),
      ])
      setLicences(Array.isArray(l) ? l : [])
      setModules(Array.isArray(m) ? m : [])
    } catch {}
    setLoading(false)
  }

  const getLicence = (moduleCode) => licences.find(l => l.module_code === moduleCode)

  const startTrial = async (moduleCode) => {
    try {
      const res = await fetch(`${API}/user/start-trial`, { method: 'POST', headers, body: JSON.stringify({ module_code: moduleCode }) })
      const data = await res.json()
      setMessage(res.ok ? `✅ ${data.message}` : data.message)
      if (res.ok) fetchData()
    } catch { setMessage('Erreur serveur.') }
    setTimeout(() => setMessage(''), 5000)
  }

  const requestAccess = async (moduleCode) => {
    try {
      const res = await fetch(`${API}/user/request-access`, { method: 'POST', headers, body: JSON.stringify({ module_code: moduleCode }) })
      const data = await res.json()
      setMessage(data.message)
    } catch { setMessage('Erreur serveur.') }
    setTimeout(() => setMessage(''), 5000)
  }

  const installPWA = async () => {
    if (installPrompt) {
      installPrompt.prompt()
      const result = await installPrompt.userChoice
      if (result.outcome === 'accepted') { setMessage('✅ Application installée !'); setInstallPrompt(null) }
    } else {
      setMessage('Pour installer : Menu du navigateur → "Ajouter à l\'écran d\'accueil"')
    }
    setTimeout(() => setMessage(''), 5000)
  }

  const theme = {
    bg:        darkMode ? '#0F1117' : '#F7F8FA',
    card:      darkMode ? '#1A1D27' : '#FFFFFF',
    cardHover: darkMode ? '#1F2335' : '#F0FDF8',
    text:      darkMode ? '#F0F0F0' : '#111111',
    textSub:   darkMode ? '#9CA3AF' : '#6B7280',
    textMuted: darkMode ? '#4B5563' : '#9CA3AF',
    border:    darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
    accent:    '#1D9E75',
    accentDim: darkMode ? 'rgba(29,158,117,0.15)' : 'rgba(29,158,117,0.1)',
  }

  const getModuleInfo = (id) => modules.find(m => m.code === id) || {}

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, transition: 'all 0.3s ease', fontFamily: '-apple-system, BlinkMacSystemFont, Inter, sans-serif' }}>

      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', borderBottom: `1px solid ${theme.border}`, backgroundColor: theme.card, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#FFFFFF', border: `2px solid ${theme.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <img src={logoLight} alt="IZI360" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
          </div>
          <div>
            <div style={{ color: theme.text, fontWeight: '700', fontSize: '15px' }}>IZI<span style={{ color: theme.accent }}>360</span></div>
            <div onClick={() => navigate('/profil')} style={{ color: theme.accent, fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}>Bonjour, {user?.nom || 'Utilisateur'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {isAdmin && (
            <button onClick={() => navigate('/admin')} style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px', color: '#F59E0B', fontWeight: '600', fontFamily: 'inherit' }}>⚙️ Admin</button>
          )}
          <button onClick={() => setDarkMode(d => !d)} style={{ background: theme.accentDim, border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px', color: theme.accent, fontWeight: '500', fontFamily: 'inherit' }}>
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button onClick={() => { localStorage.removeItem('izi360_token'); localStorage.removeItem('izi360_user'); navigate('/login') }}
            style={{ background: 'rgba(226,75,74,0.1)', border: '1px solid rgba(226,75,74,0.2)', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px', color: '#E24B4A', fontWeight: '500', fontFamily: 'inherit' }}>
            Déconnexion
          </button>
        </div>
      </header>

      {message && (
        <div style={{ margin: '16px 32px 0', backgroundColor: theme.accentDim, border: `1px solid rgba(29,158,117,0.3)`, borderRadius: '8px', padding: '10px 16px', color: theme.accent, fontSize: '14px' }}>
          {message}
        </div>
      )}

      <div style={{ textAlign: 'center', padding: '40px 20px 28px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', color: theme.text, marginBottom: '8px', letterSpacing: '-0.02em' }}>
          Vos modules <span style={{ color: theme.accent }}>IZI360</span>
        </h1>
        <p style={{ color: theme.textSub, fontSize: '0.95rem' }}>
          {loading ? 'Chargement...' : licences.length > 0 ? `${licences.length} module(s) actif(s)` : 'Démarrez un essai gratuit ou contactez-nous'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', maxWidth: '1100px', margin: '0 auto', padding: '0 24px 60px' }}>
        {MODULES.map((mod) => {
          const licence = getLicence(mod.id)
          const modInfo = getModuleInfo(mod.id)
          const joursRestants = licence ? Math.ceil(licence.jours_restants) : null
          const trialExpire = licence?.is_trial && joursRestants !== null && joursRestants <= 0
          const trialUrgent = licence?.is_trial && joursRestants !== null && joursRestants <= 3 && joursRestants > 0

          return (
            <div key={mod.id} onMouseEnter={() => setHover(mod.id)} onMouseLeave={() => setHover(null)}
              style={{ backgroundColor: hover === mod.id ? theme.cardHover : theme.card, border: `1px solid ${trialExpire ? '#E24B4A66' : trialUrgent ? '#F59E0B66' : hover === mod.id ? theme.accent + '66' : theme.border}`, borderRadius: '16px', padding: '28px', transition: 'all 0.2s ease', transform: hover === mod.id ? 'translateY(-4px)' : 'translateY(0)', position: 'relative' }}>

              {/* Badge statut */}
              {licence && (
                <div style={{ position: 'absolute', top: '16px', right: '16px', backgroundColor: trialExpire ? 'rgba(226,75,74,0.15)' : trialUrgent ? 'rgba(245,158,11,0.15)' : theme.accentDim, color: trialExpire ? '#E24B4A' : trialUrgent ? '#F59E0B' : theme.accent, fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '20px' }}>
                  {trialExpire ? '⛔ Expiré' : licence.is_trial ? `⏳ ${joursRestants}j restants` : '✓ Actif'}
                </div>
              )}

              <div style={{ width: '56px', height: '56px', borderRadius: '14px', backgroundColor: theme.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', marginBottom: '16px' }}>
                {mod.emoji}
              </div>

              <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: theme.text, marginBottom: '6px' }}>{mod.nom}</h2>
              <p style={{ color: theme.accent, fontSize: '0.8rem', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{mod.description}</p>
              <p style={{ color: theme.textSub, fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '8px' }}>{mod.detail}</p>

              {/* Prix */}
              {!licence && modInfo.prix_mensuel > 0 && (
                <p style={{ color: theme.textMuted, fontSize: '0.8rem', marginBottom: '16px' }}>
                  À partir de <strong style={{ color: theme.accent }}>${modInfo.prix_mensuel}/mois</strong>
                </p>
              )}

              {/* Trial info */}
              {!licence && modInfo.trial_days && (
                <p style={{ color: theme.textSub, fontSize: '0.8rem', marginBottom: '16px' }}>
                  🎁 Essai gratuit de <strong>{modInfo.trial_days} jours</strong>
                </p>
              )}

              {/* Boutons */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
                {!licence ? (
                  <>
                    <button onClick={() => startTrial(mod.id)} style={{ flex: 1, padding: '10px', backgroundColor: theme.accent, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                      🎁 Essai gratuit
                    </button>
                    <button onClick={() => requestAccess(mod.id)} style={{ padding: '10px 12px', backgroundColor: theme.accentDim, color: theme.accent, border: `1px solid rgba(29,158,117,0.3)`, borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
                      Acheter
                    </button>
                  </>
                ) : trialExpire ? (
                  <button onClick={() => requestAccess(mod.id)} style={{ flex: 1, padding: '10px', backgroundColor: 'rgba(226,75,74,0.15)', color: '#E24B4A', border: '1px solid rgba(226,75,74,0.3)', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                    Souscrire pour continuer
                  </button>
                ) : (
                  <>
                    <button onClick={() => mod.url ? window.open(mod.url, '_blank') : navigate(mod.route)} style={{ flex: 1, padding: '10px', backgroundColor: theme.accent, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                      {mod.url ? 'Ouvrir ↗' : 'Ouvrir →'}
                    </button>
                    <button onClick={installPWA} style={{ padding: '10px 12px', backgroundColor: theme.accentDim, color: theme.accent, border: `1px solid rgba(29,158,117,0.3)`, borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
                      📲
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ textAlign: 'center', padding: '20px', color: theme.textMuted, fontSize: '0.75rem', borderTop: `1px solid ${theme.border}` }}>
        IZI360 — La suite logicielle IZISOFT · v1.0
      </div>
    </div>
  )
}
