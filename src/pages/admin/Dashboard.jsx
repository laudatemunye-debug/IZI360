import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API = 'https://izi360-backend.vercel.app/api'

const T = {
  bg: '#0F1117', card: '#1A1D27', text: '#F0F0F0',
  textSub: '#9CA3AF', textMuted: '#4B5563',
  border: 'rgba(255,255,255,0.06)', accent: '#1D9E75',
  accentDim: 'rgba(29,158,117,0.15)', bg2: '#13151F',
}

const Card = ({ children, style = {}, onClick }) => (
  <div onClick={onClick} style={{ backgroundColor: T.card, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '20px', ...style }}>
    {children}
  </div>
)

const Btn = ({ children, onClick, color = T.accent, textColor = '#fff', style = {} }) => (
  <button onClick={onClick} style={{ padding: '6px 14px', backgroundColor: color, color: textColor, border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', fontFamily: 'inherit', ...style }}>
    {children}
  </button>
)

export default function AdminDashboard() {
  const [page, setPage] = useState('stats')
  const [stats, setStats] = useState(null)
  const [advStats, setAdvStats] = useState(null)
  const [users, setUsers] = useState([])
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [beautyCrmUsers, setBeautyCrmUsers] = useState([])
  const [beautyCrmStats, setBeautyCrmStats] = useState(null)
  const [selectedBCUser, setSelectedBCUser] = useState(null)
  const [bcEmailTarget, setBcEmailTarget] = useState(null)
  const [message, setMessage] = useState('')
  const [licenceForm, setLicenceForm] = useState({ user_id: '', module_code: '', type: 'gratuit', date_fin: '' })
  const [emailForm, setEmailForm] = useState({ user_id: '', subject: '', message: '', tous: false })
  const [showNotifModal, setShowNotifModal] = useState(false)
  const [parrainage, setParrainage] = useState([])
  const [selectedBeautyUser, setSelectedBeautyUser] = useState(null)
  const [editBeautyUser, setEditBeautyUser] = useState(null)
  const navigate = useNavigate()

  const token = localStorage.getItem('izi360_token')
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  useEffect(() => { if (!token) { navigate('/login'); return }; fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [s, as, u, m, bu, bs, par] = await Promise.all([
        fetch(`${API}/admin/stats`, { headers }).then(r => r.json()),
        fetch(`${API}/admin/stats/advanced`, { headers }).then(r => r.json()),
        fetch(`${API}/admin/users`, { headers }).then(r => r.json()),
        fetch(`${API}/admin/modules`, { headers }).then(r => r.json()),
        fetch(`${API}/beautycrm/users`, { headers }).then(r => r.json()),
        fetch(`${API}/beautycrm/stats`, { headers }).then(r => r.json()),
        fetch(`${API}/beautycrm/parrainage`, { headers }).then(r => r.json()),
      ])
      setStats(s); setAdvStats(as); setUsers(Array.isArray(u) ? u : []); setModules(Array.isArray(m) ? m : []); setBeautyCrmUsers(Array.isArray(bu) ? bu : []); setBeautyCrmStats(bs)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const msg = (text) => { setMessage(text); setTimeout(() => setMessage(''), 4000) }

  const deleteBCUser = async (id) => {
    await fetch(`${API}/beautycrm/users/${id}`, { method: 'DELETE', headers })
    fetchAll()
    msg('Utilisateur supprimé')
  }

  const toggleUser = async (id) => { await fetch(`${API}/admin/users/${id}/toggle`, { method: 'PATCH', headers }); fetchAll() }
  const setRole = async (id, role) => { await fetch(`${API}/admin/users/${id}/role`, { method: 'PATCH', headers, body: JSON.stringify({ role }) }); fetchAll() }
  const deleteUser = async (id, nom) => {
    if (!window.confirm(`Supprimer ${nom} ? Cette action est irréversible.`)) return
    const res = await fetch(`${API}/admin/users/${id}`, { method: 'DELETE', headers })
    const data = await res.json()
    msg(data.message); fetchAll()
  }
  const grantLicence = async () => {
    if (!licenceForm.user_id || !licenceForm.module_code) { msg('Utilisateur et module requis'); return }
    const res = await fetch(`${API}/admin/licences`, { method: 'POST', headers, body: JSON.stringify(licenceForm) })
    const data = await res.json()
    msg(res.ok ? '✅ Licence attribuée !' : data.message)
    if (res.ok) { setLicenceForm({ user_id: '', module_code: '', type: 'gratuit', date_fin: '' }); fetchAll() }
  }
  const sendEmail = async () => {
    if (!emailForm.subject || !emailForm.message) { msg('Sujet et message requis'); return }
    const endpoint = emailForm.tous || emailForm.module_filter ? '/admin/email/all' : '/admin/email/user'
    const body = emailForm.tous || emailForm.module_filter ? { subject: emailForm.subject, message: emailForm.message, module_filter: emailForm.module_filter || null } : { user_id: emailForm.user_id, subject: emailForm.subject, message: emailForm.message }
    if (!emailForm.tous && !emailForm.user_id) { msg('Sélectionnez un utilisateur'); return }
    const res = await fetch(`${API}${endpoint}`, { method: 'POST', headers, body: JSON.stringify(body) })
    const data = await res.json()
    msg(res.ok ? `✅ ${data.message}` : data.message)
    if (res.ok) setEmailForm({ user_id: '', subject: '', message: '', tous: false })
  }
  const updateModule = async (id, prix_mensuel, prix_annuel, actif, trial_days) => {
    await fetch(`${API}/admin/modules/${id}`, { method: 'PATCH', headers, body: JSON.stringify({ prix_mensuel, prix_annuel, actif, trial_days }) })
    fetchAll()
  }

  const navItems = [
    { key: 'stats', label: 'Dashboard', icon: '📊' },
    { key: 'users', label: 'Utilisateurs', icon: '👥' },
    { key: 'licences', label: 'Licences', icon: '🔑' },
    { key: 'modules', label: 'Modules', icon: '📦' },
    { key: 'notifications', label: 'Notifications', icon: '📧' },
    { key: 'beautycrm', label: 'Beauty CRM', icon: '💄' },
    { key: 'parrainage', label: 'Parrainage', icon: '🔗' },
  ]

  const inp = { width: '100%', padding: '10px 12px', backgroundColor: T.bg, border: `1px solid ${T.border}`, borderRadius: '8px', color: T.text, fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: T.bg, display: 'flex', fontFamily: '-apple-system, BlinkMacSystemFont, Inter, sans-serif' }}>

      {/* Sidebar */}
      <div style={{ width: '220px', backgroundColor: T.card, borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', position: 'fixed', height: '100vh', zIndex: 10 }}>
        <div style={{ padding: '20px 16px', borderBottom: `1px solid ${T.border}` }}>
          <div style={{ color: T.text, fontSize: '18px', fontWeight: '800' }}>IZI<span style={{ color: T.accent }}>360</span></div>
          <div style={{ color: T.accent, fontSize: '11px', fontWeight: '600', marginTop: '2px' }}>ESPACE ADMIN</div>
        </div>
        <nav style={{ padding: '12px 8px', flex: 1 }}>
          {navItems.map(item => (
            <button key={item.key} onClick={() => setPage(item.key)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              backgroundColor: page === item.key ? T.accentDim : 'transparent',
              color: page === item.key ? T.accent : T.textSub,
              fontSize: '14px', fontWeight: page === item.key ? '600' : '400',
              marginBottom: '4px', fontFamily: 'inherit', textAlign: 'left'
            }}>
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: '16px', borderTop: `1px solid ${T.border}` }}>
          <Btn onClick={() => { localStorage.removeItem('izi360_token'); localStorage.removeItem('izi360_user'); navigate('/login') }}
            color="rgba(226,75,74,0.15)" textColor="#E24B4A" style={{ width: '100%', marginBottom: '6px' }}>
            Déconnexion
          </Btn>
          <Btn onClick={() => navigate('/')} color="transparent" textColor={T.textSub} style={{ width: '100%' }}>
            ← Accueil
          </Btn>
        </div>
      </div>

      {/* Contenu */}
      <div style={{ marginLeft: '220px', flex: 1, padding: '32px', maxWidth: 'calc(100vw - 220px)' }}>
        {message && <div style={{ backgroundColor: T.accentDim, border: `1px solid rgba(29,158,117,0.3)`, borderRadius: '8px', padding: '10px 16px', marginBottom: '20px', color: T.accent, fontSize: '14px' }}>{message}</div>}
        {loading && <p style={{ color: T.textSub }}>Chargement...</p>}

        {/* DASHBOARD */}
        {!loading && page === 'stats' && (
          <div>
            <h1 style={{ color: T.text, fontSize: '1.5rem', fontWeight: '700', marginBottom: '24px' }}>Tableau de bord</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {[
                { label: 'Utilisateurs', value: stats?.total_users, icon: '👥', color: T.accent, page: 'users' },
                { label: 'Vérifiés', value: stats?.verified_users, icon: '✅', color: '#60A5FA', page: 'users' },
                { label: 'Nouveaux ce mois', value: advStats?.new_users_this_month, icon: '🆕', color: '#A78BFA', page: 'users' },
                { label: 'Licences actives', value: stats?.licences_actives, icon: '🔑', color: '#F59E0B', page: 'licences' },
                { label: 'Modules actifs', value: stats?.modules_actifs, icon: '📦', color: '#2ED4A0', page: 'modules' },
                { label: 'Revenu mensuel ($)', value: advStats?.monthly_revenue, icon: '💰', color: '#34D399', page: 'licences' },
              ].map(s => (
                <Card key={s.label} style={{ cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setPage(s.page)}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>{s.icon}</div>
                  <div style={{ fontSize: '26px', fontWeight: '800', color: s.color }}>{s.value ?? '—'}</div>
                  <div style={{ fontSize: '11px', color: T.textSub, marginTop: '4px' }}>{s.label}</div>
                </Card>
              ))}
            </div>

            {advStats?.licences_by_module?.length > 0 && (
              <div>
                <h2 style={{ color: T.text, fontSize: '1rem', fontWeight: '700', marginBottom: '12px' }}>Licences par module</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {advStats.licences_by_module.map((l, i) => (
                    <Card key={i} style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: T.text, fontSize: '14px', fontWeight: '600' }}>{l.module_code}</span>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', color: T.textSub }}>{l.type}</span>
                          <span style={{ fontSize: '14px', fontWeight: '700', color: T.accent }}>{l.total}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* UTILISATEURS */}
        {!loading && page === 'users' && (
          <div>
            <button onClick={() => setPage('stats')} style={{ background: 'none', border: 'none', color: T.textSub, fontSize: '13px', cursor: 'pointer', marginBottom: '16px', padding: 0, fontFamily: 'inherit' }}>← Dashboard</button>
            <h1 style={{ color: T.text, fontSize: '1.5rem', fontWeight: '700', marginBottom: '16px' }}>Utilisateurs ({users.length})</h1>

            {/* Filtre par module - liste déroulante */}
            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label style={{ fontSize: '13px', color: T.textSub, fontWeight: '600', whiteSpace: 'nowrap' }}>Filtrer par app :</label>
              <select
                value={emailForm.module_filter}
                onChange={e => setEmailForm(p => ({ ...p, module_filter: e.target.value }))}
                style={{ padding: '8px 14px', backgroundColor: T.card, border: `1px solid ${T.border}`, borderRadius: '8px', color: T.text, fontSize: '14px', fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }}
              >
                <option value="">— Tous les utilisateurs —</option>
                {modules.map(m => (
                  <option key={m.code} value={m.code}>{m.nom}</option>
                ))}
              </select>
              {emailForm.module_filter && (
                <span style={{ fontSize: '12px', color: T.accent, backgroundColor: T.accentDim, padding: '4px 10px', borderRadius: '20px', fontWeight: '600' }}>
                  {users.filter(u => u.licences && u.licences.some(l => l.module === emailForm.module_filter)).length} utilisateur(s)
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {users.filter(u => !emailForm.module_filter || (u.licences && u.licences.some(l => l.module === emailForm.module_filter))).map(u => (
                <Card key={u.id}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ color: T.text, fontWeight: '600', fontSize: '15px' }}>{u.nom}</div>
                      <div style={{ color: T.textSub, fontSize: '12px', marginTop: '2px' }}>{u.email}</div>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', backgroundColor: u.verified ? 'rgba(29,158,117,0.15)' : 'rgba(226,75,74,0.15)', color: u.verified ? T.accent : '#E24B4A', fontWeight: '600' }}>
                          {u.verified ? '✓ Vérifié' : '✗ Non vérifié'}
                        </span>
                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', backgroundColor: u.role === 'admin' ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.06)', color: u.role === 'admin' ? '#F59E0B' : T.textSub, fontWeight: '600' }}>
                          {u.role}
                        </span>
                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', backgroundColor: u.active ? 'rgba(29,158,117,0.15)' : 'rgba(226,75,74,0.15)', color: u.active ? T.accent : '#E24B4A', fontWeight: '600' }}>
                          {u.active ? 'Actif' : 'Désactivé'}
                        </span>
                      </div>
                      {u.licences && <div style={{ fontSize: '11px', color: T.textSub, marginTop: '4px' }}>Modules : {u.licences.map(l => l.module).join(', ') || 'Aucun'}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <Btn onClick={() => setRole(u.id, u.role === 'admin' ? 'user' : 'admin')} color="rgba(245,158,11,0.15)" textColor="#F59E0B">
                        {u.role === 'admin' ? '→ User' : '→ Admin'}
                      </Btn>
                      <Btn onClick={() => toggleUser(u.id)} color={u.active ? 'rgba(226,75,74,0.15)' : 'rgba(29,158,117,0.15)'} textColor={u.active ? '#E24B4A' : T.accent}>
                        {u.active ? 'Désactiver' : 'Activer'}
                      </Btn>
                      <Btn onClick={() => deleteUser(u.id, u.nom)} color="rgba(226,75,74,0.15)" textColor="#E24B4A">
                        Supprimer
                      </Btn>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* LICENCES */}
        {!loading && page === 'licences' && (
          <div>
            <button onClick={() => setPage('stats')} style={{ background: 'none', border: 'none', color: T.textSub, fontSize: '13px', cursor: 'pointer', marginBottom: '16px', padding: 0, fontFamily: 'inherit' }}>← Dashboard</button>
            <h1 style={{ color: T.text, fontSize: '1.5rem', fontWeight: '700', marginBottom: '24px' }}>Attribuer une licence</h1>
            <Card>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: T.textSub, fontWeight: '600', display: 'block', marginBottom: '6px' }}>Utilisateur</label>
                    <select style={inp} value={licenceForm.user_id} onChange={e => setLicenceForm(p => ({ ...p, user_id: e.target.value }))}>
                      <option value="">— Sélectionner —</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.nom} ({u.email})</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: T.textSub, fontWeight: '600', display: 'block', marginBottom: '6px' }}>Module</label>
                    <select style={inp} value={licenceForm.module_code} onChange={e => setLicenceForm(p => ({ ...p, module_code: e.target.value }))}>
                      <option value="">— Sélectionner —</option>
                      {modules.map(m => <option key={m.code} value={m.code}>{m.nom}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: T.textSub, fontWeight: '600', display: 'block', marginBottom: '6px' }}>Type</label>
                    <select style={inp} value={licenceForm.type} onChange={e => setLicenceForm(p => ({ ...p, type: e.target.value }))}>
                      <option value="gratuit">Gratuit</option>
                      <option value="mensuel">Mensuel</option>
                      <option value="annuel">Annuel</option>
                      <option value="lifetime">À vie</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: T.textSub, fontWeight: '600', display: 'block', marginBottom: '6px' }}>Date d'expiration (optionnel)</label>
                    <input type="date" style={inp} value={licenceForm.date_fin} onChange={e => setLicenceForm(p => ({ ...p, date_fin: e.target.value }))} />
                  </div>
                </div>
                <Btn onClick={grantLicence} style={{ padding: '12px', fontSize: '14px' }}>Attribuer la licence</Btn>
              </div>
            </Card>

            <h2 style={{ color: T.text, fontSize: '1rem', fontWeight: '700', margin: '24px 0 12px' }}>Licences actives par utilisateur</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {users.filter(u => u.licences?.length > 0).map(u => (
                <Card key={u.id} style={{ padding: '14px 16px' }}>
                  <div style={{ color: T.text, fontWeight: '600', fontSize: '14px', marginBottom: '8px' }}>{u.nom}</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {u.licences.map((l, i) => (
                      <span key={i} style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', backgroundColor: T.accentDim, color: T.accent, fontWeight: '600' }}>
                        {l.module} — {l.type}
                      </span>
                    ))}
                  </div>
                </Card>
              ))}
              {users.filter(u => u.licences?.length > 0).length === 0 && (
                <p style={{ color: T.textSub, fontSize: '14px' }}>Aucune licence attribuée pour l'instant.</p>
              )}
            </div>
          </div>
        )}

        {/* MODULES */}
        {!loading && page === 'modules' && (
          <div>
            <button onClick={() => setPage('stats')} style={{ background: 'none', border: 'none', color: T.textSub, fontSize: '13px', cursor: 'pointer', marginBottom: '16px', padding: 0, fontFamily: 'inherit' }}>← Dashboard</button>
            <h1 style={{ color: T.text, fontSize: '1.5rem', fontWeight: '700', marginBottom: '24px' }}>Modules & Tarifs</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {modules.map(m => <ModuleCard key={m.id} module={m} onUpdate={updateModule} />)}
            </div>
          </div>
        )}

        {/* BEAUTY CRM */}
        {!loading && page === 'beautycrm' && (
          <div>
            <button onClick={() => setPage('stats')} style={{ background: 'none', border: 'none', color: T.textSub, fontSize: '13px', cursor: 'pointer', marginBottom: '16px', padding: 0, fontFamily: 'inherit' }}>← Dashboard</button>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h1 style={{ color: T.text, fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>Beauty CRM — Utilisateurs</h1>
              <Btn onClick={() => setShowNotifModal(true)} style={{ padding: '10px 20px', backgroundColor: '#A78BFA' }}>
                Notifier les utilisateurs
              </Btn>
            </div>

            {/* Stats */}
            {beautyCrmStats && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                {[
                  { label: 'Total inscrits', value: beautyCrmStats.total, icon: '👥', color: T.accent },
                  { label: 'Ce mois', value: beautyCrmStats.ce_mois, icon: '🆕', color: '#A78BFA' },
                ].map(s => (
                  <Card key={s.label}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>{s.icon}</div>
                    <div style={{ fontSize: '26px', fontWeight: '800', color: s.color }}>{s.value ?? '—'}</div>
                    <div style={{ fontSize: '11px', color: T.textSub, marginTop: '4px' }}>{s.label}</div>
                  </Card>
                ))}
                {beautyCrmStats.par_pays?.length > 0 && (
                  <Card>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: T.text, marginBottom: '8px' }}>Top pays</div>
                    {beautyCrmStats.par_pays.map(p => (
                      <div key={p.pays} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: T.textSub, marginBottom: '4px' }}>
                        <span>{p.pays || 'Inconnu'}</span>
                        <span style={{ color: T.accent, fontWeight: '700' }}>{p.total}</span>
                      </div>
                    ))}
                  </Card>
                )}
                {beautyCrmStats.par_version?.length > 0 && (
                  <Card>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: T.text, marginBottom: '8px' }}>Versions</div>
                    {beautyCrmStats.par_version.map(v => (
                      <div key={v.version} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: T.textSub, marginBottom: '4px' }}>
                        <span>{v.version || '—'}</span>
                        <span style={{ color: T.accent, fontWeight: '700' }}>{v.total}</span>
                      </div>
                    ))}
                  </Card>
                )}
              </div>
            )}

            {/* Table utilisateurs */}
            <div style={{ backgroundColor: T.card, border: `1px solid ${T.border}`, borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                      {['Date', 'Nom', 'Email', 'Téléphone', 'Pays', 'Ville', 'Entreprise', 'Rôle', 'Devise', 'Version', 'IP'].map(h => (
                        <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: T.textSub, fontWeight: '600', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {beautyCrmUsers.length === 0 ? (
                      <tr><td colSpan="10" style={{ padding: '24px', textAlign: 'center', color: T.textSub }}>Aucun utilisateur BeautyCRM enregistré</td></tr>
                    ) : (
                      beautyCrmUsers.map(u => (
                        <tr key={u.id} onClick={() => { setSelectedBeautyUser(u); setEditBeautyUser({...u}) }} style={{ borderBottom: `1px solid ${T.border}`, cursor: 'pointer', transition: 'background 0.15s' }} onMouseEnter={e=>e.currentTarget.style.background=T.bg2} onMouseLeave={e=>e.currentTarget.style.background=''}>
                          <td style={{ padding: '10px 14px', color: T.textSub, whiteSpace: 'nowrap' }}>{new Date(u.created_at).toLocaleDateString('fr-FR')}</td>
                          <td style={{ padding: '10px 14px', color: T.text, fontWeight: '600' }}>{u.nom || '—'}</td>
                          <td style={{ padding: '10px 14px', color: T.textSub }}>{u.email}</td>
                          <td style={{ padding: '10px 14px', color: T.textSub }}>{u.telephone || '—'}</td>
                          <td style={{ padding: '10px 14px', color: T.textSub }}>{u.pays || '—'}</td>
                          <td style={{ padding: '10px 14px', color: T.textSub }}>{u.ville || '—'}</td>
                          <td style={{ padding: '10px 14px', color: T.textSub }}>{u.entreprise || '—'}</td>
                          <td style={{ padding: '10px 14px', color: T.textSub }}>{u.role || '—'}</td>
                          <td style={{ padding: '10px 14px', color: T.textSub }}>{u.devise || '—'}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', backgroundColor: T.accentDim, color: T.accent, fontWeight: '600' }}>
                              {u.version || '—'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px', color: T.textSub, fontSize: '11px', fontFamily: 'monospace' }}>{u.ip_address || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>



            {/* Modal Utilisateur BeautyCRM */}
            {selectedBeautyUser && editBeautyUser && (
              <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div style={{ backgroundColor: T.card, borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '540px', border: `1px solid ${T.border}`, maxHeight: '90vh', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ color: T.text, margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>Fiche utilisateur</h2>
                    <button onClick={() => setSelectedBeautyUser(null)} style={{ background: 'none', border: 'none', color: T.textSub, fontSize: '22px', cursor: 'pointer' }}>×</button>
                  </div>

                  {/* Champs éditables */}
                  {[['nom','Nom'],['email','Email'],['telephone','Téléphone'],['pays','Pays'],['ville','Ville'],['entreprise','Entreprise'],['role','Rôle'],['devise','Devise']].map(([k,l]) => (
                    <div key={k} style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '11px', color: T.textSub, fontWeight: '600', display: 'block', marginBottom: '4px' }}>{l}</label>
                      <input value={editBeautyUser[k] || ''} onChange={e => setEditBeautyUser(p => ({...p, [k]: e.target.value}))}
                        style={{ width: '100%', padding: '8px 12px', backgroundColor: T.bg, border: `1px solid ${T.border}`, borderRadius: '8px', color: T.text, fontSize: '13px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  ))}

                  {/* Code de connexion */}
                  <div style={{ backgroundColor: T.bg, borderRadius: '8px', padding: '12px 16px', margin: '16px 0', border: `1px solid ${T.border}` }}>
                    <label style={{ fontSize: '11px', color: T.textSub, fontWeight: '600', display: 'block', marginBottom: '4px' }}>Email de connexion</label>
                    <span style={{ color: T.accent, fontFamily: 'monospace', fontSize: '14px' }}>{selectedBeautyUser.email}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', marginTop: '20px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Btn onClick={() => window.open(`mailto:${selectedBeautyUser.email}?subject=BeautyCRM&body=Bonjour ${selectedBeautyUser.nom || ''},`, '_blank')} color="#3B82F6">
                        Email
                      </Btn>
                      <Btn onClick={() => window.open(`https://wa.me/${(selectedBeautyUser.telephone||'').replace(/[^0-9]/g,'')}?text=Bonjour ${encodeURIComponent(selectedBeautyUser.nom||'')}`, '_blank')} color="#25D366" textColor="#fff">
                        WhatsApp
                      </Btn>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                    <Btn color="#EF4444" onClick={async () => {
                      if (!confirm('Supprimer cet utilisateur ?')) return
                      await fetch(`${API}/beautycrm/users/${selectedBeautyUser.id}`, { method: 'DELETE', headers })
                      setBeautyCrmUsers(p => p.filter(u => u.id !== selectedBeautyUser.id))
                      setSelectedBeautyUser(null)
                    }}>Supprimer</Btn>
                    <Btn onClick={async () => {
                      await fetch(`${API}/beautycrm/users/${selectedBeautyUser.id}`, {
                        method: 'PATCH', headers,
                        body: JSON.stringify(editBeautyUser)
                      })
                      setBeautyCrmUsers(p => p.map(u => u.id === selectedBeautyUser.id ? editBeautyUser : u))
                      setSelectedBeautyUser(null)
                      setMessage('Modifié !')
                    }}>Sauvegarder</Btn>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Notification */}
            {showNotifModal && (
              <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div style={{ backgroundColor: T.card, borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '520px', border: `1px solid ${T.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ color: T.text, margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>📧 Notifier les utilisateurs BeautyCRM</h2>
                    <button onClick={() => { setShowNotifModal(false); setMessage('') }} style={{ background: 'none', border: 'none', color: T.textSub, fontSize: '20px', cursor: 'pointer' }}>×</button>
                  </div>
                  <div style={{ fontSize: '13px', color: T.textSub, marginBottom: '20px', backgroundColor: T.accentDim, padding: '10px 14px', borderRadius: '8px' }}>
                    📢 Le message sera envoyé automatiquement à tous les <strong style={{ color: T.accent }}>{beautyCrmUsers.length} utilisateurs</strong> BeautyCRM
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: T.textSub, fontWeight: '600', display: 'block', marginBottom: '6px' }}>Sujet</label>
                      <input style={{ width: '100%', padding: '10px 14px', backgroundColor: T.bg, border: `1px solid ${T.border}`, borderRadius: '8px', color: T.text, fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                        type="text" placeholder="Sujet de l'email..."
                        value={emailForm.beautySubject || ''}
                        onChange={e => setEmailForm(p => ({ ...p, beautySubject: e.target.value }))} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: T.textSub, fontWeight: '600', display: 'block', marginBottom: '6px' }}>Message</label>
                      <textarea style={{ width: '100%', padding: '10px 14px', backgroundColor: T.bg, border: `1px solid ${T.border}`, borderRadius: '8px', color: T.text, fontSize: '14px', fontFamily: 'inherit', outline: 'none', minHeight: '140px', resize: 'vertical', boxSizing: 'border-box' }}
                        placeholder="Votre message..."
                        value={emailForm.beautyMessage || ''}
                        onChange={e => setEmailForm(p => ({ ...p, beautyMessage: e.target.value }))} />
                    </div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', alignItems: 'center' }}>
                      {message && <span style={{ color: T.accent, fontSize: '13px' }}>{message}</span>}
                      <Btn onClick={() => { setShowNotifModal(false); setMessage('') }} color={T.bg} textColor={T.textSub} style={{ border: `1px solid ${T.border}` }}>Annuler</Btn>
                      <Btn onClick={async () => {
                        if (!emailForm.beautySubject || !emailForm.beautyMessage) { setMessage('Sujet et message requis'); return }
                        try {
                          const r = await fetch(`${API}/beautycrm/notify`, {
                            method: 'POST', headers,
                            body: JSON.stringify({ subject: emailForm.beautySubject, message: emailForm.beautyMessage })
                          })
                          const d = await r.json()
                          setMessage(d.message || 'Envoyé !')
                          setEmailForm(p => ({ ...p, beautySubject: '', beautyMessage: '' }))
                        } catch { setMessage('Erreur envoi') }
                      }} style={{ padding: '10px 20px', backgroundColor: '#A78BFA' }}>
                        📧 Envoyer à tous ({beautyCrmUsers.length})
                      </Btn>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PARRAINAGE */}
        {!loading && page === 'parrainage' && (
          <div>
            <button onClick={() => setPage('stats')} style={{ background: 'none', border: 'none', color: T.textSub, fontSize: '13px', cursor: 'pointer', marginBottom: '16px', padding: 0, fontFamily: 'inherit' }}>← Dashboard</button>
            <h1 style={{ color: T.text, fontSize: '1.5rem', fontWeight: '700', marginBottom: '24px' }}>Parrainage BeautyCRM</h1>
            
            <Card style={{ marginBottom: '16px', display: 'flex', gap: '24px' }}>
              <div><div style={{ fontSize: '2rem', fontWeight: '700', color: T.accent }}>{parrainage.length}</div><div style={{ color: T.textSub, fontSize: '12px' }}>Parrains actifs</div></div>
              <div><div style={{ fontSize: '2rem', fontWeight: '700', color: '#A78BFA' }}>{parrainage.reduce((a,p) => a + parseInt(p.nb_filleuls||0), 0)}</div><div style={{ color: T.textSub, fontSize: '12px' }}>Total filleuls</div></div>
            </Card>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: T.card, borderRadius: '12px', overflow: 'hidden' }}>
                <thead>
                  <tr style={{ backgroundColor: T.bg2 }}>
                    {['Parrain', 'Email', 'Code', 'Filleuls', 'Détails'].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: T.textSub, fontWeight: '600', fontSize: '12px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parrainage.map(p => (
                    <tr key={p.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '12px 14px', color: T.text, fontWeight: '600' }}>{p.nom || '—'}</td>
                      <td style={{ padding: '12px 14px', color: T.textSub }}>{p.email}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontFamily: 'monospace', backgroundColor: T.accentDim, color: T.accent, padding: '2px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>{p.referral_code}</span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ backgroundColor: parseInt(p.nb_filleuls)>0 ? 'rgba(167,139,250,0.15)' : T.bg, color: parseInt(p.nb_filleuls)>0 ? '#A78BFA' : T.textSub, padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                          {p.nb_filleuls} filleul{parseInt(p.nb_filleuls)>1?'s':''}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', color: T.textSub, fontSize: '12px' }}>
                        {p.filleuls ? p.filleuls.map((f,i) => (
                          <div key={i}>{f.nom || f.email}</div>
                        )) : '—'}
                      </td>
                    </tr>
                  ))}
                  {parrainage.length === 0 && (
                    <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: T.textSub }}>Aucun parrainage enregistré</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS */}
        {!loading && page === 'notifications' && (
          <div>
            <button onClick={() => setPage('stats')} style={{ background: 'none', border: 'none', color: T.textSub, fontSize: '13px', cursor: 'pointer', marginBottom: '16px', padding: 0, fontFamily: 'inherit' }}>← Dashboard</button>
            <h1 style={{ color: T.text, fontSize: '1.5rem', fontWeight: '700', marginBottom: '24px' }}>Envoyer une notification</h1>
            <Card>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                {/* Cible */}
                <div>
                  <label style={{ fontSize: '12px', color: T.textSub, fontWeight: '600', display: 'block', marginBottom: '8px' }}>Envoyer à</label>
                  <select
                    value={emailForm.module_filter ? `module_${emailForm.module_filter}` : emailForm.tous ? 'tous' : 'un'}
                    onChange={e => {
                      const v = e.target.value
                      if (v === 'un') setEmailForm(p => ({ ...p, tous: false, module_filter: '', user_id: '' }))
                      else if (v === 'tous') setEmailForm(p => ({ ...p, tous: true, module_filter: '', user_id: '' }))
                      else setEmailForm(p => ({ ...p, tous: true, module_filter: v.replace('module_', ''), user_id: '' }))
                    }}
                    style={{ width: '100%', padding: '10px 14px', backgroundColor: T.bg, border: `1px solid ${T.border}`, borderRadius: '8px', color: T.text, fontSize: '14px', fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }}
                  >
                    <option value="un">— Un utilisateur spécifique —</option>
                    <option value="tous">Tous les utilisateurs</option>
                    <optgroup label="Par application">
                      {modules.map(m => (
                        <option key={m.code} value={`module_${m.code}`}>{m.nom}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Utilisateur spécifique */}
                {!emailForm.tous && !emailForm.module_filter && (
                  <div>
                    <label style={{ fontSize: '12px', color: T.textSub, fontWeight: '600', display: 'block', marginBottom: '6px' }}>Destinataire</label>
                    <select style={inp} value={emailForm.user_id} onChange={e => setEmailForm(p => ({ ...p, user_id: e.target.value }))}>
                      <option value="">— Sélectionner un utilisateur —</option>
                      {users.filter(u => u.verified).map(u => <option key={u.id} value={u.id}>{u.nom} ({u.email})</option>)}
                    </select>
                  </div>
                )}

                {/* Info filtre module */}
                {emailForm.module_filter && (
                  <div style={{ backgroundColor: T.accentDim, borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: T.accent }}>
                    📦 Envoi aux utilisateurs ayant une licence <strong>{modules.find(m => m.code === emailForm.module_filter)?.nom}</strong>
                  </div>
                )}

                <div>
                  <label style={{ fontSize: '12px', color: T.textSub, fontWeight: '600', display: 'block', marginBottom: '6px' }}>Sujet</label>
                  <input style={inp} type="text" placeholder="Objet de l'email..." value={emailForm.subject} onChange={e => setEmailForm(p => ({ ...p, subject: e.target.value }))} />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: T.textSub, fontWeight: '600', display: 'block', marginBottom: '6px' }}>Message</label>
                  <textarea style={{ ...inp, minHeight: '120px', resize: 'vertical' }} placeholder="Contenu du message..." value={emailForm.message} onChange={e => setEmailForm(p => ({ ...p, message: e.target.value }))} />
                </div>

                <Btn onClick={sendEmail} style={{ padding: '12px', fontSize: '14px' }}>
                  📧 {emailForm.module_filter ? `Envoyer aux utilisateurs ${modules.find(m=>m.code===emailForm.module_filter)?.nom}` : emailForm.tous ? `Envoyer à tous (${users.filter(u => u.verified && u.active).length})` : 'Envoyer'}
                </Btn>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

function ModuleCard({ module: m, onUpdate }) {
  const [pm, setPm] = useState(m.prix_mensuel)
  const [pa, setPa] = useState(m.prix_annuel)
  const [trial, setTrial] = useState(m.trial_days || 14)
  const [saved, setSaved] = useState(false)

  const save = () => { onUpdate(m.id, pm, pa, m.actif, trial); setSaved(true); setTimeout(() => setSaved(false), 2000) }

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ color: T.text, fontWeight: '700', fontSize: '15px' }}>{m.nom}</div>
          <div style={{ color: T.textSub, fontSize: '12px', marginTop: '2px' }}>{m.description}</div>
          <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', backgroundColor: m.actif ? 'rgba(29,158,117,0.15)' : 'rgba(226,75,74,0.15)', color: m.actif ? T.accent : '#E24B4A', fontWeight: '600', marginTop: '6px', display: 'inline-block' }}>
            {m.actif ? 'Actif' : 'Désactivé'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: '11px', color: T.textSub, display: 'block', marginBottom: '4px' }}>Prix/mois ($)</label>
            <input type="number" value={pm} onChange={e => setPm(e.target.value)}
              style={{ width: '80px', padding: '6px 8px', backgroundColor: T.bg, border: `1px solid ${T.border}`, borderRadius: '6px', color: T.text, fontSize: '13px', fontFamily: 'inherit' }} />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: T.textSub, display: 'block', marginBottom: '4px' }}>Jours d'essai</label>
            <input type="number" value={trial} onChange={e => setTrial(e.target.value)}
              style={{ width: '80px', padding: '6px 8px', backgroundColor: T.bg, border: `1px solid ${T.border}`, borderRadius: '6px', color: T.text, fontSize: '13px', fontFamily: 'inherit' }} />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: T.textSub, display: 'block', marginBottom: '4px' }}>Prix/an ($)</label>
            <input type="number" value={pa} onChange={e => setPa(e.target.value)}
              style={{ width: '80px', padding: '6px 8px', backgroundColor: T.bg, border: `1px solid ${T.border}`, borderRadius: '6px', color: T.text, fontSize: '13px', fontFamily: 'inherit' }} />
          </div>
          <Btn onClick={save} color={saved ? 'rgba(29,158,117,0.15)' : T.accent} textColor={saved ? T.accent : '#fff'}>
            {saved ? 'Sauvegardé ✓' : 'Sauvegarder'}
          </Btn>
          <Btn onClick={() => onUpdate(m.id, pm, pa, !m.actif)} color={m.actif ? 'rgba(226,75,74,0.15)' : 'rgba(29,158,117,0.15)'} textColor={m.actif ? '#E24B4A' : T.accent}>
            {m.actif ? 'Désactiver' : 'Activer'}
          </Btn>
        </div>
      </div>
    </Card>
  )
}
