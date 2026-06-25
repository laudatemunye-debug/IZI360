import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API = 'http://localhost:5000/api'

const theme = {
  bg: '#0F1117', card: '#1A1D27', text: '#F0F0F0',
  textSub: '#9CA3AF', textMuted: '#4B5563',
  border: 'rgba(255,255,255,0.06)', accent: '#1D9E75',
  accentDim: 'rgba(29,158,117,0.15)',
}

export default function AdminDashboard() {
  const [page, setPage] = useState('stats')
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [licenceForm, setLicenceForm] = useState({ user_id: '', module_code: '', type: 'gratuit', date_fin: '' })
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  const token = localStorage.getItem('izi360_token')

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  useEffect(() => {
    if (!token) { navigate('/login'); return }
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [s, u, m] = await Promise.all([
        fetch(`${API}/admin/stats`, { headers }).then(r => r.json()),
        fetch(`${API}/admin/users`, { headers }).then(r => r.json()),
        fetch(`${API}/admin/modules`, { headers }).then(r => r.json()),
      ])
      setStats(s); setUsers(u); setModules(m)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const toggleUser = async (id) => {
    await fetch(`${API}/admin/users/${id}/toggle`, { method: 'PATCH', headers })
    fetchAll()
  }

  const setRole = async (id, role) => {
    await fetch(`${API}/admin/users/${id}/role`, { method: 'PATCH', headers, body: JSON.stringify({ role }) })
    fetchAll()
  }

  const grantLicence = async () => {
    if (!licenceForm.user_id || !licenceForm.module_code) { setMessage('Utilisateur et module requis'); return }
    const res = await fetch(`${API}/admin/licences`, { method: 'POST', headers, body: JSON.stringify(licenceForm) })
    const data = await res.json()
    setMessage(res.ok ? 'Licence attribuée !' : data.message)
    if (res.ok) { setLicenceForm({ user_id: '', module_code: '', type: 'gratuit', date_fin: '' }); fetchAll() }
  }

  const updateModule = async (id, prix_mensuel, prix_annuel, actif) => {
    await fetch(`${API}/admin/modules/${id}`, { method: 'PATCH', headers, body: JSON.stringify({ prix_mensuel, prix_annuel, actif }) })
    fetchAll()
  }

  const navItems = [
    { key: 'stats', label: 'Dashboard', icon: '📊' },
    { key: 'users', label: 'Utilisateurs', icon: '👥' },
    { key: 'licences', label: 'Licences', icon: '🔑' },
    { key: 'modules', label: 'Modules', icon: '📦' },
  ]

  const card = (children, style = {}) => (
    <div style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '20px', ...style }}>
      {children}
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, display: 'flex', fontFamily: '-apple-system, BlinkMacSystemFont, Inter, sans-serif' }}>

      {/* Sidebar */}
      <div style={{ width: '220px', backgroundColor: theme.card, borderRight: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', position: 'fixed', height: '100vh' }}>
        <div style={{ padding: '20px 16px', borderBottom: `1px solid ${theme.border}` }}>
          <div style={{ color: theme.text, fontSize: '18px', fontWeight: '800' }}>IZI<span style={{ color: theme.accent }}>360</span></div>
          <div style={{ color: theme.accent, fontSize: '11px', fontWeight: '600', marginTop: '2px' }}>ESPACE ADMIN</div>
        </div>
        <nav style={{ padding: '12px 8px', flex: 1 }}>
          {navItems.map(item => (
            <button key={item.key} onClick={() => setPage(item.key)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              backgroundColor: page === item.key ? theme.accentDim : 'transparent',
              color: page === item.key ? theme.accent : theme.textSub,
              fontSize: '14px', fontWeight: page === item.key ? '600' : '400',
              marginBottom: '4px', fontFamily: 'inherit', textAlign: 'left'
            }}>
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: '16px' }}>
          <button onClick={() => { localStorage.removeItem('izi360_token'); localStorage.removeItem('izi360_user'); navigate('/login') }}
            style={{ width: '100%', padding: '8px', backgroundColor: 'rgba(226,75,74,0.1)', color: '#E24B4A', border: '1px solid rgba(226,75,74,0.2)', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit' }}>
            Déconnexion
          </button>
          <button onClick={() => navigate('/')} style={{ width: '100%', padding: '8px', backgroundColor: 'transparent', color: theme.textSub, border: 'none', cursor: 'pointer', fontSize: '13px', marginTop: '6px', fontFamily: 'inherit' }}>
            ← Accueil
          </button>
        </div>
      </div>

      {/* Contenu */}
      <div style={{ marginLeft: '220px', flex: 1, padding: '32px' }}>
        {loading && <p style={{ color: theme.textSub }}>Chargement...</p>}

        {/* STATS */}
        {!loading && page === 'stats' && (
          <div>
            <h1 style={{ color: theme.text, fontSize: '1.5rem', fontWeight: '700', marginBottom: '24px' }}>Tableau de bord</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {[
                { label: 'Utilisateurs', value: stats?.total_users, icon: '👥', color: theme.accent },
                { label: 'Vérifiés', value: stats?.verified_users, icon: '✅', color: '#60A5FA' },
                { label: 'Admins', value: stats?.admins, icon: '🛡️', color: '#F59E0B' },
                { label: 'Licences actives', value: stats?.licences_actives, icon: '🔑', color: '#A78BFA' },
                { label: 'Modules actifs', value: stats?.modules_actifs, icon: '📦', color: '#2ED4A0' },
              ].map(s => card(
                <div>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>{s.icon}</div>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '12px', color: theme.textSub, marginTop: '4px' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* USERS */}
        {!loading && page === 'users' && (
          <div>
            <h1 style={{ color: theme.text, fontSize: '1.5rem', fontWeight: '700', marginBottom: '24px' }}>Utilisateurs ({users.length})</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {users.map(u => card(
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ color: theme.text, fontWeight: '600', fontSize: '15px' }}>{u.nom}</div>
                    <div style={{ color: theme.textSub, fontSize: '12px', marginTop: '2px' }}>{u.email}</div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', backgroundColor: u.verified ? 'rgba(29,158,117,0.15)' : 'rgba(226,75,74,0.15)', color: u.verified ? theme.accent : '#E24B4A', fontWeight: '600' }}>
                        {u.verified ? '✓ Vérifié' : '✗ Non vérifié'}
                      </span>
                      <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', backgroundColor: u.role === 'admin' ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.06)', color: u.role === 'admin' ? '#F59E0B' : theme.textSub, fontWeight: '600' }}>
                        {u.role}
                      </span>
                      <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', backgroundColor: u.active ? 'rgba(29,158,117,0.15)' : 'rgba(226,75,74,0.15)', color: u.active ? theme.accent : '#E24B4A', fontWeight: '600' }}>
                        {u.active ? 'Actif' : 'Désactivé'}
                      </span>
                    </div>
                    {u.licences && <div style={{ fontSize: '11px', color: theme.textSub, marginTop: '4px' }}>Modules : {u.licences.map(l => l.module).join(', ')}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setRole(u.id, u.role === 'admin' ? 'user' : 'admin')}
                      style={{ padding: '6px 12px', backgroundColor: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>
                      {u.role === 'admin' ? '→ User' : '→ Admin'}
                    </button>
                    <button onClick={() => toggleUser(u.id)}
                      style={{ padding: '6px 12px', backgroundColor: u.active ? 'rgba(226,75,74,0.15)' : 'rgba(29,158,117,0.15)', color: u.active ? '#E24B4A' : theme.accent, border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>
                      {u.active ? 'Désactiver' : 'Activer'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LICENCES */}
        {!loading && page === 'licences' && (
          <div>
            <h1 style={{ color: theme.text, fontSize: '1.5rem', fontWeight: '700', marginBottom: '24px' }}>Attribuer une licence</h1>
            {message && <p style={{ color: theme.accent, fontSize: '13px', marginBottom: '16px' }}>{message}</p>}
            {card(
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: theme.textSub, fontWeight: '600', display: 'block', marginBottom: '6px' }}>Utilisateur</label>
                    <select style={{ width: '100%', padding: '10px', backgroundColor: theme.bg, border: `1px solid ${theme.border}`, borderRadius: '8px', color: theme.text, fontSize: '14px', fontFamily: 'inherit' }}
                      value={licenceForm.user_id} onChange={e => setLicenceForm(p => ({ ...p, user_id: e.target.value }))}>
                      <option value="">— Sélectionner —</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.nom} ({u.email})</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: theme.textSub, fontWeight: '600', display: 'block', marginBottom: '6px' }}>Module</label>
                    <select style={{ width: '100%', padding: '10px', backgroundColor: theme.bg, border: `1px solid ${theme.border}`, borderRadius: '8px', color: theme.text, fontSize: '14px', fontFamily: 'inherit' }}
                      value={licenceForm.module_code} onChange={e => setLicenceForm(p => ({ ...p, module_code: e.target.value }))}>
                      <option value="">— Sélectionner —</option>
                      {modules.map(m => <option key={m.code} value={m.code}>{m.nom}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: theme.textSub, fontWeight: '600', display: 'block', marginBottom: '6px' }}>Type</label>
                    <select style={{ width: '100%', padding: '10px', backgroundColor: theme.bg, border: `1px solid ${theme.border}`, borderRadius: '8px', color: theme.text, fontSize: '14px', fontFamily: 'inherit' }}
                      value={licenceForm.type} onChange={e => setLicenceForm(p => ({ ...p, type: e.target.value }))}>
                      <option value="gratuit">Gratuit</option>
                      <option value="mensuel">Mensuel</option>
                      <option value="annuel">Annuel</option>
                      <option value="lifetime">À vie</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: theme.textSub, fontWeight: '600', display: 'block', marginBottom: '6px' }}>Date d'expiration (optionnel)</label>
                    <input type="date" style={{ width: '100%', padding: '10px', backgroundColor: theme.bg, border: `1px solid ${theme.border}`, borderRadius: '8px', color: theme.text, fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' }}
                      value={licenceForm.date_fin} onChange={e => setLicenceForm(p => ({ ...p, date_fin: e.target.value }))} />
                  </div>
                </div>
                <button onClick={grantLicence} style={{ padding: '12px', backgroundColor: theme.accent, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Attribuer la licence
                </button>
              </div>
            )}
          </div>
        )}

        {/* MODULES */}
        {!loading && page === 'modules' && (
          <div>
            <h1 style={{ color: theme.text, fontSize: '1.5rem', fontWeight: '700', marginBottom: '24px' }}>Modules & Tarifs</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {modules.map(m => (
                <ModuleCard key={m.id} module={m} onUpdate={updateModule} theme={theme} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ModuleCard({ module: m, onUpdate, theme }) {
  const [prix_mensuel, setPrixM] = useState(m.prix_mensuel)
  const [prix_annuel, setPrixA] = useState(m.prix_annuel)
  const [saved, setSaved] = useState(false)

  const save = () => {
    onUpdate(m.id, prix_mensuel, prix_annuel, m.actif)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ color: theme.text, fontWeight: '700', fontSize: '15px' }}>{m.nom}</div>
          <div style={{ color: theme.textSub, fontSize: '12px', marginTop: '2px' }}>{m.description}</div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: '11px', color: theme.textSub, display: 'block', marginBottom: '4px' }}>Prix/mois ($)</label>
            <input type="number" value={prix_mensuel} onChange={e => setPrixM(e.target.value)}
              style={{ width: '80px', padding: '6px 8px', backgroundColor: theme.bg, border: `1px solid ${theme.border}`, borderRadius: '6px', color: theme.text, fontSize: '13px', fontFamily: 'inherit' }} />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: theme.textSub, display: 'block', marginBottom: '4px' }}>Prix/an ($)</label>
            <input type="number" value={prix_annuel} onChange={e => setPrixA(e.target.value)}
              style={{ width: '80px', padding: '6px 8px', backgroundColor: theme.bg, border: `1px solid ${theme.border}`, borderRadius: '6px', color: theme.text, fontSize: '13px', fontFamily: 'inherit' }} />
          </div>
          <div style={{ paddingTop: '18px' }}>
            <button onClick={save} style={{ padding: '6px 14px', backgroundColor: saved ? 'rgba(29,158,117,0.15)' : theme.accent, color: saved ? theme.accent : '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', fontFamily: 'inherit' }}>
              {saved ? 'Sauvegardé ✓' : 'Sauvegarder'}
            </button>
          </div>
          <div style={{ paddingTop: '18px' }}>
            <button onClick={() => onUpdate(m.id, prix_mensuel, prix_annuel, !m.actif)}
              style={{ padding: '6px 14px', backgroundColor: m.actif ? 'rgba(226,75,74,0.15)' : 'rgba(29,158,117,0.15)', color: m.actif ? '#E24B4A' : theme.accent, border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>
              {m.actif ? 'Désactiver' : 'Activer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
