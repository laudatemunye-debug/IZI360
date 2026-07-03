import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API = 'https://izi360-backend.vercel.app/api'

const T = {
  bg: '#0F1117', card: '#1A1D27', text: '#F0F0F0',
  textSub: '#9CA3AF', textMuted: '#4B5563',
  border: 'rgba(255,255,255,0.06)', accent: '#1D9E75',
  accentDim: 'rgba(29,158,117,0.15)',
}

const Card = ({ children, style = {}, onClick }) => (
  <div onClick={onClick} style={{ backgroundColor: T.card, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '16px', ...style }}>
    {children}
  </div>
)

const Btn = ({ children, onClick, color = T.accent, textColor = '#fff', style = {} }) => (
  <button onClick={onClick} style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', backgroundColor: color, color: textColor, fontWeight: '600', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', ...style }}>
    {children}
  </button>
)

export default function EspaceFormateur() {
  const [page, setPage] = useState('accueil')
  const [brevets, setBrevets] = useState([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const token = localStorage.getItem('izi360_token')
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
  const user = JSON.parse(localStorage.getItem('izi360_user') || '{}')

  useEffect(() => {
    if (!token) { navigate('/login'); return }
  }, [])

  const fetchBrevets = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/brevets/all`, { headers })
      const data = await res.json()
      setBrevets(Array.isArray(data) ? data : [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => {
    if (page === 'brevets') fetchBrevets()
  }, [page])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: T.bg, fontFamily: '-apple-system, BlinkMacSystemFont, Inter, sans-serif' }}>
      <div style={{ padding: '20px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: T.text, fontSize: '18px', fontWeight: '800' }}>IZI<span style={{ color: T.accent }}>360</span></div>
          <div style={{ color: T.accent, fontSize: '11px', fontWeight: '600', marginTop: '2px' }}>ESPACE FORMATEUR{user.formation_titre ? ` · ${user.formation_titre}` : ''}</div>
        </div>
        <Btn onClick={() => { localStorage.removeItem('izi360_token'); localStorage.removeItem('izi360_user'); navigate('/login') }} color="rgba(226,75,74,0.15)" textColor="#E24B4A">
          Déconnexion
        </Btn>
      </div>

      <div style={{ padding: '32px', maxWidth: '900px', margin: '0 auto' }}>
        {page === 'accueil' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <Card onClick={() => navigate('/admin/brevet/champignon')} style={{ cursor: 'pointer', textAlign: 'center', padding: '32px 20px' }}>
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>🎓</div>
              <div style={{ color: T.text, fontWeight: '700', fontSize: '15px' }}>Générer un brevet</div>
            </Card>
            <Card onClick={() => setPage('brevets')} style={{ cursor: 'pointer', textAlign: 'center', padding: '32px 20px' }}>
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>📋</div>
              <div style={{ color: T.text, fontWeight: '700', fontSize: '15px' }}>Mes brevets</div>
            </Card>
          </div>
        )}

        {page === 'brevets' && (
          <div>
            <button onClick={() => setPage('accueil')} style={{ background: 'none', border: 'none', color: T.textSub, fontSize: '13px', cursor: 'pointer', marginBottom: '16px', padding: 0, fontFamily: 'inherit' }}>← Retour</button>
            <h1 style={{ color: T.text, fontSize: '1.4rem', fontWeight: '700', marginBottom: '16px' }}>Mes brevets ({brevets.length})</h1>

            {loading && <p style={{ color: T.textSub }}>Chargement...</p>}

            {!loading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {brevets.length === 0 && <p style={{ color: T.textSub, fontSize: '14px' }}>Aucun brevet généré pour votre formation.</p>}
                {brevets.map(b => (
                  <Card key={b.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <div style={{ color: T.text, fontWeight: '600', fontSize: '14px' }}>{b.participant}</div>
                        <div style={{ color: T.textSub, fontSize: '12px', marginTop: '2px' }}>
                          {b.date_formation ? new Date(b.date_formation).toLocaleDateString('fr-FR') : '—'} · {b.lieu}
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', color: '#F59E0B', fontWeight: '700' }}>N° {b.numero || '—'}</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
