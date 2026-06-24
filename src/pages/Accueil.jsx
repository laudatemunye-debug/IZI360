import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logoLight from '../assets/logo-light.png'
import logoDark from '../assets/logo-dark.png'

const modules = [
  { id: 'jangi', nom: 'Izi Jangi', description: 'Gestion de tontine', detail: 'Épargne communautaire & rotative', emoji: '💰', route: '/jangi' },
  { id: 'hospi', nom: 'Izi Hospi', description: 'Gestion hospitalière', detail: 'Patients, consultations & facturation', emoji: '🏥', route: '/hospi' },
  { id: 'school', nom: 'Izi School', description: 'Gestion scolaire', detail: 'Élèves, notes & communication', emoji: '🎓', route: '/school' },
  { id: 'shop', nom: 'Izi Shop', description: 'Gestion de boutique', detail: 'Ventes, stock & caisse', emoji: '🛒', route: '/shop' },
  { id: 'transit', nom: 'Izi Transit', description: 'Gestion de transport', detail: 'Lignes, billets & flotte', emoji: '🚌', route: '/transit' }
]

export default function Accueil() {
  const [darkMode, setDarkMode] = useState(true)
  const [hover, setHover] = useState(null)
  const navigate = useNavigate()

  const theme = {
    bg:          darkMode ? '#0F1117' : '#F7F8FA',
    card:        darkMode ? '#1A1D27' : '#FFFFFF',
    cardHover:   darkMode ? '#1F2335' : '#F0FDF8',
    text:        darkMode ? '#F0F0F0' : '#111111',
    textSub:     darkMode ? '#6B7280' : '#6B7280',
    textMuted:   darkMode ? '#4B5563' : '#9CA3AF',
    border:      darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
    accent:      '#1D9E75',
    accentDim:   darkMode ? 'rgba(29,158,117,0.15)' : 'rgba(29,158,117,0.1)',
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, transition: 'all 0.3s ease', fontFamily: '-apple-system, BlinkMacSystemFont, Inter, sans-serif' }}>

      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 32px',
        borderBottom: `1px solid ${theme.border}`,
        backgroundColor: theme.card,
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          backgroundColor: '#FFFFFF',
          border: `2px solid ${theme.accent}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          boxShadow: `0 0 12px rgba(29,158,117,0.3)`
        }}>
          <img src={logoLight} alt="IZI360" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
        </div>

        <button
          onClick={() => setDarkMode(!darkMode)}
          style={{
            background: theme.accentDim,
            border: `1px solid ${theme.accent}44`,
            borderRadius: '8px',
            padding: '6px 14px',
            cursor: 'pointer',
            fontSize: '13px',
            color: theme.accent,
            fontWeight: '500',
            transition: 'all 0.2s'
          }}
        >
          {darkMode ? '☀️ Clair' : '🌙 Sombre'}
        </button>
      </header>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '60px 20px 40px' }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: '800',
          color: theme.text,
          marginBottom: '12px',
          letterSpacing: '-0.02em'
        }}>
          Bienvenue sur <span style={{ color: theme.accent }}>IZI360</span>
        </h1>
        <p style={{ color: theme.textSub, fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto' }}>
          Choisissez votre module pour commencer
        </p>
      </div>

      {/* Grille des modules */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '0 24px 60px'
      }}>
        {modules.map((mod) => (
          <div
            key={mod.id}
            onClick={() => navigate(mod.route)}
            onMouseEnter={() => setHover(mod.id)}
            onMouseLeave={() => setHover(null)}
            style={{
              backgroundColor: hover === mod.id ? theme.cardHover : theme.card,
              border: `1px solid ${hover === mod.id ? theme.accent + '66' : theme.border}`,
              borderRadius: '16px',
              padding: '28px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              transform: hover === mod.id ? 'translateY(-4px)' : 'translateY(0)',
              boxShadow: hover === mod.id ? `0 12px 32px rgba(29,158,117,0.15)` : 'none'
            }}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              backgroundColor: theme.accentDim,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              marginBottom: '16px'
            }}>
              {mod.emoji}
            </div>

            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: theme.text, marginBottom: '6px' }}>
              {mod.nom}
            </h2>

            <p style={{ color: theme.accent, fontSize: '0.8rem', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {mod.description}
            </p>

            <p style={{ color: theme.textSub, fontSize: '0.9rem', lineHeight: '1.5' }}>
              {mod.detail}
            </p>

            <div style={{ marginTop: '20px', color: hover === mod.id ? theme.accent : theme.textMuted, fontSize: '0.9rem', fontWeight: '600', transition: 'all 0.2s' }}>
              Ouvrir →
            </div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', padding: '20px', color: theme.textMuted, fontSize: '0.75rem', borderTop: `1px solid ${theme.border}` }}>
        IZI360 — La suite logicielle IZISOFT · v1.0
      </div>
    </div>
  )
}
