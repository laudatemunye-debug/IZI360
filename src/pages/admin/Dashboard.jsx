import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import QRCode from 'qrcode'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const API = 'https://izi360-backend.vercel.app/api'
const SITE_URL = 'https://izi-360.vercel.app'

const MOIS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

function parseDureeJours(duree) {
  if (!duree) return 1
  const match = duree.match(/(\d+)/)
  const n = match ? parseInt(match[1], 10) : 1
  if (/semaine/i.test(duree)) return n * 7
  if (/mois/i.test(duree)) return n * 30
  return n
}

function formatPeriode(dateFormation, duree) {
  if (!dateFormation) return ''
  const debut = new Date(dateFormation)
  const jours = parseDureeJours(duree)
  const fin = new Date(debut)
  fin.setDate(fin.getDate() + Math.max(jours - 1, 0))
  const jj1 = String(debut.getDate()).padStart(2, '0')
  const mm1 = MOIS_FR[debut.getMonth()]
  const jj2 = String(fin.getDate()).padStart(2, '0')
  const mm2 = MOIS_FR[fin.getMonth()]
  if (debut.getMonth() === fin.getMonth() && debut.getFullYear() === fin.getFullYear()) {
    return `${jj1} au ${jj2} ${mm2} ${fin.getFullYear()}`
  }
  return `${jj1} ${mm1} au ${jj2} ${mm2} ${fin.getFullYear()}`
}

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

function ModuleCard({ module, onUpdate }) {
  const [prixMensuel, setPrixMensuel] = useState(module.prix_mensuel ?? '')
  const [prixAnnuel, setPrixAnnuel] = useState(module.prix_annuel ?? '')
  const [trialDays, setTrialDays] = useState(module.trial_days ?? '')
  const [actif, setActif] = useState(!!module.actif)
  const [saved, setSaved] = useState(false)

  const inp = { width: '100%', padding: '8px 10px', backgroundColor: T.bg, border: `1px solid ${T.border}`, borderRadius: '8px', color: T.text, fontSize: '13px', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }

  const save = () => {
    onUpdate(module.id, Number(prixMensuel) || 0, Number(prixAnnuel) || 0, actif, Number(trialDays) || 0)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ minWidth: '140px' }}>
          <div style={{ color: T.text, fontWeight: '700', fontSize: '15px' }}>{module.nom}</div>
          <div style={{ color: T.textSub, fontSize: '12px', marginTop: '2px' }}>{module.code}</div>
          <span style={{ display: 'inline-block', marginTop: '8px', fontSize: '10px', padding: '2px 8px', borderRadius: '4px', backgroundColor: actif ? 'rgba(29,158,117,0.15)' : 'rgba(226,75,74,0.15)', color: actif ? T.accent : '#E24B4A', fontWeight: '600' }}>
            {actif ? 'Actif' : 'Désactivé'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px', flex: 1, minWidth: '240px' }}>
          <div>
            <label style={{ fontSize: '11px', color: T.textSub, fontWeight: '600', display: 'block', marginBottom: '4px' }}>Prix mensuel ($)</label>
            <input style={inp} type="number" value={prixMensuel} onChange={e => setPrixMensuel(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: T.textSub, fontWeight: '600', display: 'block', marginBottom: '4px' }}>Prix annuel ($)</label>
            <input style={inp} type="number" value={prixAnnuel} onChange={e => setPrixAnnuel(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: T.textSub, fontWeight: '600', display: 'block', marginBottom: '4px' }}>Essai (jours)</label>
            <input style={inp} type="number" value={trialDays} onChange={e => setTrialDays(e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Btn onClick={() => setActif(a => !a)} color={actif ? 'rgba(226,75,74,0.15)' : 'rgba(29,158,117,0.15)'} textColor={actif ? '#E24B4A' : T.accent}>
            {actif ? 'Désactiver' : 'Activer'}
          </Btn>
          <Btn onClick={save}>{saved ? '✅ Sauvegardé' : 'Sauvegarder'}</Btn>
        </div>
      </div>
    </Card>
  )
}

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
  const [formations, setFormations] = useState([])
  const [selectedFormationInscrits, setSelectedFormationInscrits] = useState(null)
  const [selectedInscrit, setSelectedInscrit] = useState(null)
  const [brevets, setBrevets] = useState([])
  const [showAncienModal, setShowAncienModal] = useState(false)
  const [selectedAncien, setSelectedAncien] = useState(null)
  const [sidebarOuverte, setSidebarOuverte] = useState(() => typeof window !== 'undefined' ? window.innerWidth > 900 : true)
  const [showFormationModal, setShowFormationModal] = useState(false)
  const [formateurDemandes, setFormateurDemandes] = useState([])
  const [nouvelleFormation, setNouvelleFormation] = useState({ slug: '', titre: '', description: '', lieu: '', duree: '', dateDebut: '', formateur: '' })
  const [selectedBrevet, setSelectedBrevet] = useState(null)
  const [editBrevet, setEditBrevet] = useState(null)
  const [qrDataUrlBrevet, setQrDataUrlBrevet] = useState('')
  const brevetCertRef = useRef(null)
  const navigate = useNavigate()

  const token = localStorage.getItem('izi360_token')
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  useEffect(() => { if (!token) { navigate('/login'); return }; fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [s, as, u, m, bu, bs, par, fo, br, fd] = await Promise.all([
        fetch(`${API}/admin/stats`, { headers }).then(r => r.json()),
        fetch(`${API}/admin/stats/advanced`, { headers }).then(r => r.json()),
        fetch(`${API}/admin/users`, { headers }).then(r => r.json()),
        fetch(`${API}/admin/modules`, { headers }).then(r => r.json()),
        fetch(`${API}/beautycrm/users`, { headers }).then(r => r.json()),
        fetch(`${API}/beautycrm/stats`, { headers }).then(r => r.json()),
        fetch(`${API}/beautycrm/parrainage`, { headers }).then(r => r.json()),
        fetch(`${API}/formations/all`, { headers }).then(r => r.json()),
        fetch(`${API}/brevets/all`, { headers }).then(r => r.json()),
        fetch(`${API}/formateurs/demandes`, { headers }).then(r => r.json()),
      ])
      setStats(s); setAdvStats(as); setUsers(Array.isArray(u) ? u : []); setModules(Array.isArray(m) ? m : []); setBeautyCrmUsers(Array.isArray(bu) ? bu : []); setBeautyCrmStats(bs); setParrainage(Array.isArray(par) ? par : []); setFormations(Array.isArray(fo) ? fo : []); setBrevets(Array.isArray(br) ? br : []); setFormateurDemandes(Array.isArray(fd) ? fd : [])
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
  const creerFormation = async () => {
    if (!nouvelleFormation.slug.trim() || !nouvelleFormation.titre.trim()) { msg('Slug et titre requis'); return }
    const res = await fetch(`${API}/formations`, { method: 'POST', headers, body: JSON.stringify(nouvelleFormation) })
    const data = await res.json()
    if (!res.ok) { msg(data.message || 'Erreur'); return }
    msg('✅ Formation créée !')
    setNouvelleFormation({ slug: '', titre: '', description: '', lieu: '', duree: '', dateDebut: '', formateur: '' })
    setShowFormationModal(false)
    fetchAll()
  }

  const ouvrirBrevet = async (b) => {
    setSelectedBrevet(b)
    setEditBrevet({ ...b, dateFormation: b.date_formation ? b.date_formation.substring(0, 10) : '' })
    try {
      const url = await QRCode.toDataURL(`${SITE_URL}/formation/champignon?id=${b.id}`, { width: 300, margin: 1, color: { dark: '#1A1D27', light: '#FFFFFF' } })
      setQrDataUrlBrevet(url)
    } catch { setQrDataUrlBrevet('') }
  }

  const sauvegarderBrevet = async () => {
    const res = await fetch(`${API}/brevets/${selectedBrevet.id}`, {
      method: 'PATCH', headers,
      body: JSON.stringify({ participant: editBrevet.participant, lieu: editBrevet.lieu, dateFormation: editBrevet.dateFormation, duree: editBrevet.duree, formateur: editBrevet.formateur }),
    })
    const data = await res.json()
    if (!res.ok) { msg(data.message || 'Erreur'); return }
    setBrevets(p => p.map(x => x.id === data.id ? data : x))
    setSelectedBrevet(data)
    msg('✅ Brevet modifié !')
  }

  const telechargerBrevetPDF = async () => {
    if (!brevetCertRef.current) return
    const canvas = await html2canvas(brevetCertRef.current, { scale: 3, backgroundColor: '#ffffff' })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = pageWidth
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    const y = Math.max((pageHeight - imgHeight) / 2, 0)
    pdf.addImage(imgData, 'PNG', 0, y, imgWidth, imgHeight)
    pdf.save(`Brevet_${(selectedBrevet.participant || '').replace(/\s+/g, '_')}.pdf`)
  }

  const supprimerBrevet = async () => {
    if (!confirm(`Supprimer le brevet de ${selectedBrevet.participant} ?`)) return
    const res = await fetch(`${API}/brevets/${selectedBrevet.id}`, { method: 'DELETE', headers })
    if (!res.ok) { msg('Erreur lors de la suppression'); return }
    setBrevets(p => p.filter(x => x.id !== selectedBrevet.id))
    setSelectedBrevet(null)
    setEditBrevet(null)
    msg('🗑️ Brevet supprimé')
  }

  const updateModule = async (id, prix_mensuel, prix_annuel, actif, trial_days) => {
    await fetch(`${API}/admin/modules/${id}`, { method: 'PATCH', headers, body: JSON.stringify({ prix_mensuel, prix_annuel, actif, trial_days }) })
    fetchAll()
  }

  const validerFormateur = async (id, nom) => {
    const res = await fetch(`${API}/formateurs/demandes/${id}/valider`, { method: 'PATCH', headers })
    const data = await res.json()
    msg(res.ok ? `✅ ${data.message}` : data.message)
    if (res.ok) fetchAll()
  }
  const refuserFormateur = async (id) => {
    if (!window.confirm('Refuser cette demande formateur ?')) return
    const res = await fetch(`${API}/formateurs/demandes/${id}/refuser`, { method: 'PATCH', headers })
    const data = await res.json()
    msg(res.ok ? `✅ ${data.message}` : data.message)
    if (res.ok) fetchAll()
  }

  const isMobile = () => typeof window !== 'undefined' && window.innerWidth <= 900
  const gotoPage = (key) => {
    setPage(key)
    if (isMobile()) setSidebarOuverte(false)
  }

  const navItems = [
    { key: 'stats', label: 'Dashboard', icon: '📊' },
    { key: 'users', label: 'Utilisateurs', icon: '👥' },
    { key: 'licences', label: 'Licences', icon: '🔑' },
    { key: 'modules', label: 'Modules', icon: '📦' },
    { key: 'notifications', label: 'Notifications', icon: '📧' },
    { key: 'beautycrm', label: 'Beauty CRM', icon: '💄' },
    { key: 'parrainage', label: 'Parrainage', icon: '🔗' },
    { key: 'formations', label: 'Formations', icon: '🎓' },
    { key: 'autorisations', label: 'Autorisations & Accès', icon: '🔐' },
  ]

  const inp = { width: '100%', padding: '10px 12px', backgroundColor: T.bg, border: `1px solid ${T.border}`, borderRadius: '8px', color: T.text, fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: T.bg, display: 'flex', fontFamily: '-apple-system, BlinkMacSystemFont, Inter, sans-serif' }}>

      {/* Sidebar */}
      {sidebarOuverte && (
      <div onClick={() => isMobile() && setSidebarOuverte(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9, display: window.innerWidth <= 900 ? 'block' : 'none' }} />
      )}
      {sidebarOuverte && (
      <div style={{ width: '220px', backgroundColor: T.card, borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', position: 'fixed', height: '100vh', zIndex: 10 }}>
        <div style={{ padding: '20px 16px', borderBottom: `1px solid ${T.border}` }}>
          <div style={{ color: T.text, fontSize: '18px', fontWeight: '800' }}>IZI<span style={{ color: T.accent }}>360</span></div>
          <div style={{ color: T.accent, fontSize: '11px', fontWeight: '600', marginTop: '2px' }}>ESPACE ADMIN</div>
        </div>
        <nav style={{ padding: '12px 8px', flex: 1 }}>
          {navItems.map(item => (
            <button key={item.key} onClick={() => gotoPage(item.key)} style={{
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
      )}

      {/* Contenu */}
      <div style={{ marginLeft: sidebarOuverte ? '220px' : '0', flex: 1, padding: 'clamp(14px,4vw,32px)', maxWidth: sidebarOuverte ? 'calc(100vw - 220px)' : '100vw' }}>
        {!sidebarOuverte && (
          <button onClick={() => setSidebarOuverte(true)} style={{
            position: 'fixed', top: '20px', left: '20px', zIndex: 20,
            width: '40px', height: '40px', borderRadius: '10px', border: `1px solid ${T.border}`,
            backgroundColor: T.card, color: T.text, fontSize: '18px', cursor: 'pointer',
          }}>
            ☰
          </button>
        )}
        {message && <div style={{ backgroundColor: T.accentDim, border: `1px solid rgba(29,158,117,0.3)`, borderRadius: '8px', padding: '10px 16px', marginBottom: '20px', color: T.accent, fontSize: '14px' }}>{message}</div>}
        {loading && <p style={{ color: T.textSub }}>Chargement...</p>}

        {/* DASHBOARD */}
        {!loading && page === 'stats' && (
          <div>
            <h1 style={{ color: T.text, fontSize: 'clamp(1.15rem, 4vw, 1.5rem)', fontWeight: '700', marginBottom: '24px' }}>Tableau de bord</h1>
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
            <h1 style={{ color: T.text, fontSize: 'clamp(1.15rem, 4vw, 1.5rem)', fontWeight: '700', marginBottom: '16px' }}>Utilisateurs ({users.length})</h1>

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
                      <select
                        value={u.role}
                        onChange={(e) => setRole(u.id, e.target.value)}
                        style={{ padding: '6px 10px', backgroundColor: 'rgba(245,158,11,0.15)', border: 'none', borderRadius: '8px', color: '#F59E0B', fontSize: '12px', fontWeight: '600', fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }}
                      >
                        <option value="user">Utilisateur</option>
                        <option value="formateur">Formateur</option>
                        <option value="admin">Admin</option>
                      </select>
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
            <h1 style={{ color: T.text, fontSize: 'clamp(1.15rem, 4vw, 1.5rem)', fontWeight: '700', marginBottom: '24px' }}>Attribuer une licence</h1>
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
            <h1 style={{ color: T.text, fontSize: 'clamp(1.15rem, 4vw, 1.5rem)', fontWeight: '700', marginBottom: '24px' }}>Modules & Tarifs</h1>
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
              <h1 style={{ color: T.text, fontSize: 'clamp(1.15rem, 4vw, 1.5rem)', fontWeight: '700', margin: 0 }}>Beauty CRM — Utilisateurs</h1>
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
            <h1 style={{ color: T.text, fontSize: 'clamp(1.15rem, 4vw, 1.5rem)', fontWeight: '700', marginBottom: '24px' }}>Parrainage BeautyCRM</h1>
            
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

        {/* FORMATIONS */}
        {!loading && page === 'formations' && (
          <div>
            <button onClick={() => setPage('stats')} style={{ background: 'none', border: 'none', color: T.textSub, fontSize: '13px', cursor: 'pointer', marginBottom: '16px', padding: 0, fontFamily: 'inherit' }}>← Dashboard</button>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '10px' }}>
              <h1 style={{ color: T.text, fontSize: 'clamp(1.15rem, 4vw, 1.5rem)', fontWeight: '700', margin: 0 }}>Formations</h1>
              <div className="formations-btns" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <Btn onClick={() => setShowFormationModal(true)} color="#A78BFA" style={{ padding: '10px 20px' }}>
                  ➕ Ajouter une formation
                </Btn>
                <Btn onClick={() => setShowAncienModal(true)} color="#F59E0B" style={{ padding: '10px 20px' }}>
                  👤 Ancien participant
                </Btn>
                <Btn onClick={() => navigate('/admin/brevet/champignon')} style={{ padding: '10px 20px' }}>
                  🍄 Générer un brevet
                </Btn>
              </div>
            </div>

            {showAncienModal && (
              <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div style={{ backgroundColor: T.card, borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '480px', border: `1px solid ${T.border}`, maxHeight: '80vh', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ color: T.text, margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>
                      👤 {selectedAncien ? selectedAncien.participant : 'Anciens participants'}
                    </h2>
                    <button onClick={() => { setShowAncienModal(false); setSelectedAncien(null) }} style={{ background: 'none', border: 'none', color: T.textSub, fontSize: '22px', cursor: 'pointer' }}>×</button>
                  </div>

                  {selectedAncien ? (
                    <div>
                      <button onClick={() => setSelectedAncien(null)} style={{ background: 'none', border: 'none', color: T.textSub, fontSize: '13px', cursor: 'pointer', marginBottom: '16px', padding: 0, fontFamily: 'inherit' }}>← Retour à la liste</button>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                        {[
                          ['Téléphone', selectedAncien.telephone || '—'],
                          ['Email', selectedAncien.email || '—'],
                          ['Formation suivie', selectedAncien.formation || '—'],
                          ['Lieu', selectedAncien.lieu || '—'],
                          ['Date de formation', selectedAncien.date_formation ? new Date(selectedAncien.date_formation).toLocaleDateString('fr-FR') : '—'],
                          ['N° de brevet', selectedAncien.numero || '—'],
                          ['Date de délivrance', selectedAncien.created_at ? new Date(selectedAncien.created_at).toLocaleDateString('fr-FR') : '—'],
                        ].map(([label, value]) => (
                          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: T.bg, border: `1px solid ${T.border}`, borderRadius: '8px', padding: '10px 14px' }}>
                            <span style={{ color: T.textSub, fontSize: '12px', fontWeight: '600' }}>{label}</span>
                            <span style={{ color: T.text, fontSize: '13px', fontWeight: '600' }}>{value}</span>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <Btn
                          onClick={() => selectedAncien.telephone
                            ? window.open(`https://wa.me/${(selectedAncien.telephone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour ${selectedAncien.participant},`)}`, '_blank')
                            : msg('Aucun téléphone enregistré pour ce participant')}
                          color="#25D366" textColor="#fff" style={{ flex: 1, opacity: selectedAncien.telephone ? 1 : 0.5 }}
                        >
                          WhatsApp
                        </Btn>
                        <Btn
                          onClick={() => selectedAncien.email
                            ? window.open(`mailto:${selectedAncien.email}?subject=IZI360&body=Bonjour ${selectedAncien.participant},`, '_blank')
                            : msg('Aucun email enregistré pour ce participant')}
                          color="#3B82F6" style={{ flex: 1, opacity: selectedAncien.email ? 1 : 0.5 }}
                        >
                          Email
                        </Btn>
                      </div>
                    </div>
                  ) : brevets.length === 0 ? (
                    <p style={{ color: T.textSub, fontSize: '13px' }}>Aucun ancien participant pour l'instant.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {Array.from(new Map(brevets.map(b => [`${b.participant}|${b.telephone}`, b])).values()).map(b => (
                        <div
                          key={b.id}
                          onClick={() => setSelectedAncien(b)}
                          style={{ backgroundColor: T.bg, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '12px 14px', cursor: 'pointer' }}
                        >
                          <div style={{ color: T.text, fontWeight: '600', fontSize: '14px' }}>{b.participant}</div>
                          <div style={{ color: T.textSub, fontSize: '12px', marginTop: '2px' }}>{b.telephone || '—'}{b.email ? ` · ${b.email}` : ''}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <Card style={{ cursor: 'pointer' }} onClick={() => setPage('formationsListe')}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎓</div>
                <div style={{ fontSize: '26px', fontWeight: '800', color: T.accent }}>{formations.length}</div>
                <div style={{ fontSize: '11px', color: T.textSub, marginTop: '4px' }}>Formations</div>
              </Card>
              <Card style={{ cursor: 'pointer' }} onClick={() => setPage('brevetsListe')}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>🍄</div>
                <div style={{ fontSize: '26px', fontWeight: '800', color: '#F59E0B' }}>{brevets.length}</div>
                <div style={{ fontSize: '11px', color: T.textSub, marginTop: '4px' }}>Brevets générés</div>
              </Card>
              <Card style={{ cursor: formations.length > 0 ? 'pointer' : 'default' }} onClick={async () => {
                if (formations.length === 0) return
                const f = formations[0]
                const res = await fetch(`${API}/formations/${f.id}/inscriptions`, { headers })
                const data = await res.json()
                setSelectedFormationInscrits({ formation: f, inscrits: Array.isArray(data) ? data : [] })
              }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>👥</div>
                <div style={{ fontSize: '26px', fontWeight: '800', color: '#A78BFA' }}>{formations.reduce((a, f) => a + parseInt(f.nb_inscrits || 0), 0)}</div>
                <div style={{ fontSize: '11px', color: T.textSub, marginTop: '4px' }}>Inscrits au total</div>
              </Card>
            </div>

            <div id="liste-formations" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {formations.map(f => (
                <Card key={f.id}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ color: T.text, fontWeight: '600', fontSize: '15px' }}>{f.titre}</div>
                      <div style={{ color: T.textSub, fontSize: '12px', marginTop: '2px' }}>{f.lieu} — {f.duree}</div>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', backgroundColor: f.actif ? 'rgba(29,158,117,0.15)' : 'rgba(226,75,74,0.15)', color: f.actif ? T.accent : '#E24B4A', fontWeight: '600' }}>
                          {f.actif ? 'Active' : 'Désactivée'}
                        </span>
                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(167,139,250,0.15)', color: '#A78BFA', fontWeight: '600' }}>
                          {f.nb_inscrits || 0} inscrit(s)
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <Btn onClick={async () => {
                        const res = await fetch(`${API}/formations/${f.id}/inscriptions`, { headers })
                        const data = await res.json()
                        setSelectedFormationInscrits({ formation: f, inscrits: Array.isArray(data) ? data : [] })
                      }} color="rgba(96,165,250,0.15)" textColor="#60A5FA">
                        Voir inscrits
                      </Btn>
                      <Btn onClick={async () => {
                        await fetch(`${API}/formations/${f.id}`, { method: 'PATCH', headers, body: JSON.stringify({ actif: !f.actif }) })
                        fetchAll()
                      }} color={f.actif ? 'rgba(226,75,74,0.15)' : 'rgba(29,158,117,0.15)'} textColor={f.actif ? '#E24B4A' : T.accent}>
                        {f.actif ? 'Désactiver' : 'Activer'}
                      </Btn>
                    </div>
                  </div>
                </Card>
              ))}
              {formations.length === 0 && (
                <p style={{ color: T.textSub, fontSize: '14px' }}>Aucune formation enregistrée.</p>
              )}
            </div>

            {showFormationModal && (
              <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div style={{ backgroundColor: T.card, borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '520px', border: `1px solid ${T.border}`, maxHeight: '90vh', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ color: T.text, margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>Nouvelle formation</h2>
                    <button onClick={() => setShowFormationModal(false)} style={{ background: 'none', border: 'none', color: T.textSub, fontSize: '22px', cursor: 'pointer' }}>×</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: T.textSub, fontWeight: '600', display: 'block', marginBottom: '4px' }}>Slug (identifiant unique, ex: champignon) *</label>
                      <input style={inp} value={nouvelleFormation.slug} onChange={e => setNouvelleFormation(p => ({ ...p, slug: e.target.value }))} placeholder="champignon" />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: T.textSub, fontWeight: '600', display: 'block', marginBottom: '4px' }}>Titre *</label>
                      <input style={inp} value={nouvelleFormation.titre} onChange={e => setNouvelleFormation(p => ({ ...p, titre: e.target.value }))} placeholder="Formation Production de Champignons" />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: T.textSub, fontWeight: '600', display: 'block', marginBottom: '4px' }}>Description</label>
                      <textarea style={{ ...inp, minHeight: '80px', resize: 'vertical' }} value={nouvelleFormation.description} onChange={e => setNouvelleFormation(p => ({ ...p, description: e.target.value }))} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '12px', color: T.textSub, fontWeight: '600', display: 'block', marginBottom: '4px' }}>Lieu</label>
                        <input style={inp} value={nouvelleFormation.lieu} onChange={e => setNouvelleFormation(p => ({ ...p, lieu: e.target.value }))} placeholder="Kinshasa, RDC" />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: T.textSub, fontWeight: '600', display: 'block', marginBottom: '4px' }}>Durée</label>
                        <input style={inp} value={nouvelleFormation.duree} onChange={e => setNouvelleFormation(p => ({ ...p, duree: e.target.value }))} placeholder="3 jours" />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: T.textSub, fontWeight: '600', display: 'block', marginBottom: '4px' }}>Date de début</label>
                        <input type="date" style={inp} value={nouvelleFormation.dateDebut} onChange={e => setNouvelleFormation(p => ({ ...p, dateDebut: e.target.value }))} />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: T.textSub, fontWeight: '600', display: 'block', marginBottom: '4px' }}>Formateur / Partenaire</label>
                        <input style={inp} value={nouvelleFormation.formateur} onChange={e => setNouvelleFormation(p => ({ ...p, formateur: e.target.value }))} placeholder="Congo Leadership Initiative" />
                      </div>
                    </div>
                    <Btn onClick={creerFormation} style={{ padding: '12px', fontSize: '14px', marginTop: '8px' }}>Créer la formation</Btn>
                  </div>
                </div>
              </div>
            )}

            {selectedFormationInscrits && (
              <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div style={{ backgroundColor: T.card, borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '540px', border: `1px solid ${T.border}`, maxHeight: '80vh', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ color: T.text, margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>
                      {selectedInscrit ? selectedInscrit.nom : `Inscrits — ${selectedFormationInscrits.formation.titre}`}
                    </h2>
                    <button onClick={() => { setSelectedFormationInscrits(null); setSelectedInscrit(null) }} style={{ background: 'none', border: 'none', color: T.textSub, fontSize: '22px', cursor: 'pointer' }}>×</button>
                  </div>

                  {selectedInscrit ? (
                    <div>
                      <button onClick={() => setSelectedInscrit(null)} style={{ background: 'none', border: 'none', color: T.textSub, fontSize: '13px', cursor: 'pointer', marginBottom: '16px', padding: 0, fontFamily: 'inherit' }}>← Retour à la liste</button>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                        {[
                          ['Téléphone', selectedInscrit.telephone || '—'],
                          ['Email', selectedInscrit.email || '—'],
                          ['Ville', selectedInscrit.ville || '—'],
                          ['Date d\'inscription', selectedInscrit.created_at ? new Date(selectedInscrit.created_at).toLocaleDateString('fr-FR') : '—'],
                        ].map(([label, value]) => (
                          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: T.bg, border: `1px solid ${T.border}`, borderRadius: '8px', padding: '10px 14px' }}>
                            <span style={{ color: T.textSub, fontSize: '12px', fontWeight: '600' }}>{label}</span>
                            <span style={{ color: T.text, fontSize: '13px', fontWeight: '600' }}>{value}</span>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <Btn
                          onClick={() => selectedInscrit.telephone
                            ? window.open(`https://wa.me/${(selectedInscrit.telephone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour ${selectedInscrit.nom},`)}`, '_blank')
                            : msg('Aucun téléphone enregistré')}
                          color="#25D366" textColor="#fff" style={{ flex: 1, opacity: selectedInscrit.telephone ? 1 : 0.5 }}
                        >
                          WhatsApp
                        </Btn>
                        <Btn
                          onClick={() => selectedInscrit.email
                            ? window.open(`mailto:${selectedInscrit.email}?subject=IZI360&body=Bonjour ${selectedInscrit.nom},`, '_blank')
                            : msg('Aucun email enregistré')}
                          color="#3B82F6" style={{ flex: 1, opacity: selectedInscrit.email ? 1 : 0.5 }}
                        >
                          Email
                        </Btn>
                      </div>

                      <Btn
                        onClick={async () => {
                          if (!confirm(`Supprimer l'inscription de ${selectedInscrit.nom} ?`)) return
                          const res = await fetch(`${API}/formations/${selectedFormationInscrits.formation.id}/inscriptions/${selectedInscrit.id}`, { method: 'DELETE', headers })
                          if (!res.ok) { msg('Erreur lors de la suppression'); return }
                          setSelectedFormationInscrits(p => ({ ...p, inscrits: p.inscrits.filter(x => x.id !== selectedInscrit.id) }))
                          setFormations(p => p.map(f => f.id === selectedFormationInscrits.formation.id ? { ...f, nb_inscrits: Math.max(0, parseInt(f.nb_inscrits || 0) - 1) } : f))
                          setSelectedInscrit(null)
                          msg('🗑️ Inscrit supprimé')
                        }}
                        color="rgba(226,75,74,0.15)" textColor="#E24B4A" style={{ width: '100%', marginTop: '10px' }}
                      >
                        Supprimer
                      </Btn>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selectedFormationInscrits.inscrits.map(i => (
                        <div key={i.id} onClick={() => setSelectedInscrit(i)} style={{ padding: '10px 14px', backgroundColor: T.bg, borderRadius: '8px', border: `1px solid ${T.border}`, cursor: 'pointer' }}>
                          <div style={{ color: T.text, fontWeight: '600', fontSize: '13px' }}>{i.nom}</div>
                          <div style={{ color: T.textSub, fontSize: '12px' }}>{i.telephone} {i.email ? `— ${i.email}` : ''} {i.ville ? `— ${i.ville}` : ''}</div>
                        </div>
                      ))}
                      {selectedFormationInscrits.inscrits.length === 0 && (
                        <p style={{ color: T.textSub, fontSize: '13px' }}>Aucune inscription pour l'instant.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* LISTE DES FORMATIONS */}
        {!loading && page === 'formationsListe' && (
          <div>
            <button onClick={() => setPage('formations')} style={{ background: 'none', border: 'none', color: T.textSub, fontSize: '13px', cursor: 'pointer', marginBottom: '16px', padding: 0, fontFamily: 'inherit' }}>← Formations</button>
            <h1 style={{ color: T.text, fontSize: 'clamp(1.15rem, 4vw, 1.5rem)', fontWeight: '700', marginBottom: '24px' }}>Toutes les formations ({formations.length})</h1>

            <div style={{ backgroundColor: T.card, border: `1px solid ${T.border}`, borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                      {['Titre', 'Lieu', 'Durée', 'Statut', 'Inscrits'].map(h => (
                        <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: T.textSub, fontWeight: '600', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {formations.length === 0 ? (
                      <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: T.textSub }}>Aucune formation enregistrée</td></tr>
                    ) : (
                      formations.map(f => (
                        <tr key={f.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                          <td style={{ padding: '10px 14px', color: T.text, fontWeight: '600' }}>{f.titre}</td>
                          <td style={{ padding: '10px 14px', color: T.textSub }}>{f.lieu || '—'}</td>
                          <td style={{ padding: '10px 14px', color: T.textSub }}>{f.duree || '—'}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: f.actif ? 'rgba(29,158,117,0.15)' : 'rgba(226,75,74,0.15)', color: f.actif ? T.accent : '#E24B4A', fontWeight: '600' }}>
                              {f.actif ? 'Active' : 'Désactivée'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px', color: T.textSub }}>{f.nb_inscrits || 0}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* LISTE DES BREVETS */}
        {!loading && page === 'brevetsListe' && (
          <div>
            <button onClick={() => setPage('formations')} style={{ background: 'none', border: 'none', color: T.textSub, fontSize: '13px', cursor: 'pointer', marginBottom: '16px', padding: 0, fontFamily: 'inherit' }}>← Formations</button>
            <h1 style={{ color: T.text, fontSize: 'clamp(1.15rem, 4vw, 1.5rem)', fontWeight: '700', marginBottom: '24px' }}>Brevets générés ({brevets.length})</h1>

            <div style={{ backgroundColor: T.card, border: `1px solid ${T.border}`, borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                      {['N°', 'Participant', 'Formation', 'Date', 'Durée', 'Lieu', 'Formateur', 'ID'].map(h => (
                        <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: T.textSub, fontWeight: '600', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {brevets.length === 0 ? (
                      <tr><td colSpan="8" style={{ padding: '24px', textAlign: 'center', color: T.textSub }}>Aucun brevet généré</td></tr>
                    ) : (
                      brevets.map(b => (
                        <tr key={b.id} onClick={() => ouvrirBrevet(b)} style={{ borderBottom: `1px solid ${T.border}`, cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background = T.bg2} onMouseLeave={e => e.currentTarget.style.background = ''}>
                          <td style={{ padding: '10px 14px', color: '#F59E0B', fontWeight: '700' }}>{b.numero || '—'}</td>
                          <td style={{ padding: '10px 14px', color: T.text, fontWeight: '600' }}>{b.participant}</td>
                          <td style={{ padding: '10px 14px', color: T.textSub }}>{b.formation}</td>
                          <td style={{ padding: '10px 14px', color: T.textSub, whiteSpace: 'nowrap' }}>{b.date_formation ? new Date(b.date_formation).toLocaleDateString('fr-FR') : '—'}</td>
                          <td style={{ padding: '10px 14px', color: T.textSub }}>{b.duree}</td>
                          <td style={{ padding: '10px 14px', color: T.textSub }}>{b.lieu}</td>
                          <td style={{ padding: '10px 14px', color: T.textSub }}>{b.formateur}</td>
                          <td style={{ padding: '10px 14px', color: T.textMuted, fontSize: '11px', fontFamily: 'monospace' }}>{b.id}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedBrevet && editBrevet && (
              <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}>
                <div style={{ backgroundColor: T.card, borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '780px', border: `1px solid ${T.border}`, maxHeight: '92vh', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ color: T.text, margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>Brevet N° {editBrevet.numero || '—'}</h2>
                    <button onClick={() => { setSelectedBrevet(null); setEditBrevet(null) }} style={{ background: 'none', border: 'none', color: T.textSub, fontSize: '22px', cursor: 'pointer' }}>×</button>
                  </div>

                  <div ref={brevetCertRef} style={{ position: 'relative', width: '700px', maxWidth: '100%', margin: '0 auto 20px', fontFamily: 'Arial, sans-serif' }}>
                    <img src="/brevet-champignon-template.jpg" alt="Brevet" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '12px' }} />
                    <div style={{ position: 'absolute', left: '41.8%', top: '40.1%', width: '53.3%', height: '7.7%', display: 'flex', alignItems: 'center', fontFamily: '"Kalam", cursive', fontWeight: 700, fontSize: 'clamp(11px, 3.3vw, 23px)', color: '#111827', overflow: 'hidden' }}>
                      {editBrevet.participant}
                    </div>
                    <div style={{ position: 'absolute', left: '62%', top: '28.7%', width: '3.9%', height: '6.7%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'clamp(8px, 2.4vw, 17px)', fontWeight: 'bold', color: '#DC2626' }}>
                      {editBrevet.numero}
                    </div>
                    <div style={{ position: 'absolute', left: '50.1%', top: '58.2%', width: '40.4%', height: '6.5%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontFamily: 'Arial, sans-serif', fontStyle: 'italic', fontSize: 'clamp(9px, 3vw, 21px)', fontWeight: 'bold', color: '#DC2626', overflow: 'hidden' }}>
                      {formatPeriode(editBrevet.dateFormation, editBrevet.duree)}
                    </div>
                    <div style={{ position: 'absolute', left: '21.5%', top: '74.5%', width: '39%', height: '3.5%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontFamily: 'Arial, sans-serif', fontStyle: 'italic', fontSize: 'clamp(5px, 0.9vw, 11px)', fontWeight: 'bold', color: '#111827', overflow: 'hidden' }}>
                      Délivré à {editBrevet.lieu}, le {editBrevet.created_at ? new Date(editBrevet.created_at).toLocaleDateString('fr-FR') : ''}
                    </div>
                    {qrDataUrlBrevet && (
                      <div style={{ position: 'absolute', left: '81.3%', top: '78.2%', width: '13.7%', height: '17.0%', backgroundColor: '#FFFFFF' }}>
                        <img src={qrDataUrlBrevet} alt="QR" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>
                    )}
                  </div>

                  <h3 style={{ color: T.text, fontSize: '0.9rem', fontWeight: '700', marginBottom: '10px' }}>Modifier</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: T.textSub, fontWeight: '600', display: 'block', marginBottom: '4px' }}>Participant</label>
                      <input style={inp} value={editBrevet.participant || ''} onChange={e => setEditBrevet(p => ({ ...p, participant: e.target.value }))} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: T.textSub, fontWeight: '600', display: 'block', marginBottom: '4px' }}>Lieu</label>
                      <input style={inp} value={editBrevet.lieu || ''} onChange={e => setEditBrevet(p => ({ ...p, lieu: e.target.value }))} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: T.textSub, fontWeight: '600', display: 'block', marginBottom: '4px' }}>Date de formation</label>
                      <input type="date" style={inp} value={editBrevet.dateFormation || ''} onChange={e => setEditBrevet(p => ({ ...p, dateFormation: e.target.value }))} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: T.textSub, fontWeight: '600', display: 'block', marginBottom: '4px' }}>Durée</label>
                      <input style={inp} value={editBrevet.duree || ''} onChange={e => setEditBrevet(p => ({ ...p, duree: e.target.value }))} />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: '11px', color: T.textSub, fontWeight: '600', display: 'block', marginBottom: '4px' }}>Formateur / Partenaire</label>
                      <input style={inp} value={editBrevet.formateur || ''} onChange={e => setEditBrevet(p => ({ ...p, formateur: e.target.value }))} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    {editBrevet.telephone && (
                      <Btn onClick={() => window.open(`https://wa.me/${(editBrevet.telephone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour ${editBrevet.participant}, félicitations pour votre brevet IZI360 !`)}`, '_blank')} color="#25D366" textColor="#fff">
                        WhatsApp
                      </Btn>
                    )}
                    {editBrevet.email && (
                      <Btn onClick={() => window.open(`mailto:${editBrevet.email}?subject=Votre brevet IZI360&body=Bonjour ${editBrevet.participant},`, '_blank')} color="#3B82F6">
                        Email
                      </Btn>
                    )}
                    <Btn onClick={supprimerBrevet} color="rgba(226,75,74,0.15)" textColor="#E24B4A">Effacer</Btn>
                    <Btn onClick={telechargerBrevetPDF} color="rgba(96,165,250,0.15)" textColor="#60A5FA">Télécharger PDF</Btn>
                    <Btn onClick={sauvegarderBrevet}>Modifier</Btn>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* NOTIFICATIONS */}
        {!loading && page === 'notifications' && (
          <div>
            <button onClick={() => setPage('stats')} style={{ background: 'none', border: 'none', color: T.textSub, fontSize: '13px', cursor: 'pointer', marginBottom: '16px', padding: 0, fontFamily: 'inherit' }}>← Dashboard</button>
            <h1 style={{ color: T.text, fontSize: 'clamp(1.15rem, 4vw, 1.5rem)', fontWeight: '700', marginBottom: '24px' }}>Envoyer une notification</h1>

            <Card>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                <div>
                  <label style={{ fontSize: '12px', color: T.textSub, fontWeight: '600', display: 'block', marginBottom: '6px' }}>Destinataires</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <Btn
                      onClick={() => setEmailForm(p => ({ ...p, tous: true, module_filter: '', user_id: '' }))}
                      color={emailForm.tous ? T.accent : T.bg}
                      textColor={emailForm.tous ? '#fff' : T.textSub}
                      style={{ border: `1px solid ${T.border}` }}
                    >
                      Tous les utilisateurs
                    </Btn>
                    <Btn
                      onClick={() => setEmailForm(p => ({ ...p, tous: false, user_id: '' }))}
                      color={!emailForm.tous ? T.accent : T.bg}
                      textColor={!emailForm.tous ? '#fff' : T.textSub}
                      style={{ border: `1px solid ${T.border}` }}
                    >
                      Filtrer / utilisateur précis
                    </Btn>
                  </div>
                </div>

                {!emailForm.tous && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: T.textSub, fontWeight: '600', display: 'block', marginBottom: '6px' }}>Filtrer par module (optionnel)</label>
                      <select style={inp} value={emailForm.module_filter || ''} onChange={e => setEmailForm(p => ({ ...p, module_filter: e.target.value, user_id: '' }))}>
                        <option value="">— Aucun filtre —</option>
                        {modules.map(m => <option key={m.code} value={m.code}>{m.nom}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: T.textSub, fontWeight: '600', display: 'block', marginBottom: '6px' }}>Ou un utilisateur précis</label>
                      <select style={inp} value={emailForm.user_id || ''} onChange={e => setEmailForm(p => ({ ...p, user_id: e.target.value, module_filter: '' }))}>
                        <option value="">— Sélectionner —</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.nom} ({u.email})</option>)}
                      </select>
                    </div>
                  </div>
                )}

                <div>
                  <label style={{ fontSize: '12px', color: T.textSub, fontWeight: '600', display: 'block', marginBottom: '6px' }}>Sujet</label>
                  <input style={inp} type="text" placeholder="Sujet de l'email..." value={emailForm.subject || ''} onChange={e => setEmailForm(p => ({ ...p, subject: e.target.value }))} />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: T.textSub, fontWeight: '600', display: 'block', marginBottom: '6px' }}>Message</label>
                  <textarea style={{ ...inp, minHeight: '140px', resize: 'vertical' }} placeholder="Votre message..." value={emailForm.message || ''} onChange={e => setEmailForm(p => ({ ...p, message: e.target.value }))} />
                </div>

                <Btn onClick={sendEmail} style={{ padding: '12px', fontSize: '14px' }}>
                  📧 Envoyer{emailForm.tous ? ` à tous (${users.length})` : emailForm.module_filter ? ` (filtré : ${emailForm.module_filter})` : ''}
                </Btn>
              </div>
            </Card>
          </div>
        )}

        {/* AUTORISATIONS & ACCES */}
        {!loading && page === 'autorisations' && (
          <div>
            <button onClick={() => setPage('stats')} style={{ background: 'none', border: 'none', color: T.textSub, fontSize: '13px', cursor: 'pointer', marginBottom: '16px', padding: 0, fontFamily: 'inherit' }}>← Dashboard</button>
            <h1 style={{ color: T.text, fontSize: 'clamp(1.15rem, 4vw, 1.5rem)', fontWeight: '700', marginBottom: '16px' }}>Autorisations & Accès ({formateurDemandes.length})</h1>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {formateurDemandes.length === 0 && (
                <p style={{ color: T.textSub, fontSize: '14px' }}>Aucune demande formateur pour le moment.</p>
              )}
              {formateurDemandes.map(d => (
                <Card key={d.id}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ color: T.text, fontWeight: '600', fontSize: '15px' }}>{d.nom}</div>
                      <div style={{ color: T.textSub, fontSize: '12px', marginTop: '2px' }}>{d.email}{d.telephone ? ` · ${d.telephone}` : ''}</div>
                      <div style={{ color: T.textSub, fontSize: '12px', marginTop: '2px' }}>Formation demandée : {d.formation_titre || '—'}</div>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '10px', padding: '2px 8px', borderRadius: '4px', fontWeight: '600',
                          backgroundColor: d.statut === 'validee' ? 'rgba(29,158,117,0.15)' : d.statut === 'refusee' ? 'rgba(226,75,74,0.15)' : 'rgba(245,158,11,0.15)',
                          color: d.statut === 'validee' ? T.accent : d.statut === 'refusee' ? '#E24B4A' : '#F59E0B',
                        }}>
                          {d.statut === 'validee' ? '✓ Validée' : d.statut === 'refusee' ? '✗ Refusée' : '⏳ En attente'}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {d.email && (
                        <Btn onClick={() => window.open(`mailto:${d.email}`, '_blank')} color="rgba(59,130,246,0.15)" textColor="#3B82F6">
                          ✉️ Email
                        </Btn>
                      )}
                      {d.telephone && (
                        <Btn onClick={() => window.open(`https://wa.me/${d.telephone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour ${d.nom}, concernant votre demande formateur IZI360 (${d.formation_titre || ''})...`)}`, '_blank')} color="#25D366" textColor="#fff">
                          WhatsApp
                        </Btn>
                      )}
                      {d.statut === 'en_attente' && (
                        <>
                          <Btn onClick={() => validerFormateur(d.id, d.nom)} color="rgba(29,158,117,0.15)" textColor={T.accent}>
                            Valider
                          </Btn>
                          <Btn onClick={() => refuserFormateur(d.id)} color="rgba(226,75,74,0.15)" textColor="#E24B4A">
                            Refuser
                          </Btn>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
