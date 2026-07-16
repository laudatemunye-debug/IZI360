import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const API = 'https://izi360-backend.vercel.app/api'

const T = {
  bg: '#0F1117', card: '#1A1D27', text: '#F0F0F0',
  textSub: '#9CA3AF', textMuted: '#4B5563',
  border: 'rgba(255,255,255,0.06)', accent: '#1D9E75',
  accentDim: 'rgba(29,158,117,0.15)', bg2: '#13151F',
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

export default function FormationDashboard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [formation, setFormation] = useState(null)
  const [inscrits, setInscrits] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedInscrit, setSelectedInscrit] = useState(null)
  const [filtreDomaine, setFiltreDomaine] = useState('')
  const [filtreStatut, setFiltreStatut] = useState('')
  const [message, setMessage] = useState('')
  const [showContenus, setShowContenus] = useState(false)
  const [contenus, setContenus] = useState([])
  const [editContenu, setEditContenu] = useState(null)
  const [formContenu, setFormContenu] = useState({ titre: '', description: '', urlVideo: '', typeContenu: 'video' })
  const [showEditFormation, setShowEditFormation] = useState(false)
  const [formFormation, setFormFormation] = useState({ titre: '', description: '', lieu: '', duree: '', dateDebut: '', heureDebut: '', fuseauHoraire: 'Africa/Lubumbashi', formateur: '' })

  const FUSEAUX = [
    { v: 'Africa/Lubumbashi', l: 'RD Congo Est (UTC+2)' },
    { v: 'Africa/Kinshasa', l: 'RD Congo Ouest (UTC+1)' },
    { v: 'Africa/Kigali', l: 'Rwanda / Burundi (UTC+2)' },
    { v: 'Africa/Nairobi', l: 'Kenya / EAT (UTC+3)' },
    { v: 'Europe/Paris', l: 'France / Belgique (UTC+1/+2)' },
  ]

  const token = localStorage.getItem('izi360_token')
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
  const user = JSON.parse(localStorage.getItem('izi360_user') || '{}')
  const retourPath = user.role === 'admin' ? '/admin' : '/espace-formateur'

  const msg = (m) => { setMessage(m); setTimeout(() => setMessage(''), 3000) }

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [fRes, iRes] = await Promise.all([
        fetch(`${API}/formations/${id}`),
        fetch(`${API}/formations/${id}/inscriptions`, { headers }),
      ])
      const fData = await fRes.json()
      const iData = await iRes.json()
      setFormation(fData)
      setInscrits(Array.isArray(iData) ? iData : [])
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const fetchContenus = async () => {
    try {
      const res = await fetch(`${API}/formations/${id}/videos`)
      const data = await res.json()
      setContenus(Array.isArray(data) ? data : [])
    } catch (e) { console.error(e) }
  }

  const ouvrirContenus = () => {
    setShowContenus(true)
    fetchContenus()
  }

  const ouvrirEdition = (c) => {
    setEditContenu(c)
    setFormContenu(c
      ? { titre: c.titre, description: c.description || '', urlVideo: c.url_video || '', typeContenu: c.type_contenu || 'video' }
      : { titre: '', description: '', urlVideo: '', typeContenu: 'video' })
  }

  const sauvegarderContenu = async () => {
    if (!formContenu.titre.trim()) { msg('Titre requis'); return }
    if (formContenu.typeContenu === 'video' && !formContenu.urlVideo.trim()) { msg('URL de la vidéo requise'); return }
    try {
      const url = editContenu ? `${API}/formations/${id}/videos/${editContenu.id}` : `${API}/formations/${id}/videos`
      const method = editContenu ? 'PATCH' : 'POST'
      const res = await fetch(url, { method, headers, body: JSON.stringify(formContenu) })
      if (!res.ok) throw new Error()
      msg(editContenu ? '✅ Contenu modifié' : '✅ Contenu ajouté')
      setEditContenu(null)
      setFormContenu({ titre: '', description: '', urlVideo: '', typeContenu: 'video' })
      fetchContenus()
    } catch {
      msg('Erreur lors de l\'enregistrement')
    }
  }

  const ouvrirEditionFormation = () => {
    setFormFormation({
      titre: formation.titre || '',
      description: formation.description || '',
      lieu: formation.lieu || '',
      duree: formation.duree || '',
      dateDebut: formation.date_debut ? formation.date_debut.slice(0, 10) : '',
      heureDebut: formation.heure_debut || '',
      fuseauHoraire: formation.fuseau_horaire || 'Africa/Lubumbashi',
      formateur: formation.formateur || '',
    })
    setShowEditFormation(true)
  }

  const sauvegarderFormation = async () => {
    if (!formFormation.titre.trim()) { msg('Titre requis'); return }
    try {
      const res = await fetch(`${API}/formations/${id}`, { method: 'PATCH', headers, body: JSON.stringify(formFormation) })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setFormation(updated)
      setShowEditFormation(false)
      msg('✅ Formation modifiée')
    } catch {
      msg('Erreur lors de l\'enregistrement')
    }
  }

  const supprimerContenu = async (contenuId) => {
    if (!confirm('Supprimer ce contenu ?')) return
    const res = await fetch(`${API}/formations/${id}/videos/${contenuId}`, { method: 'DELETE', headers })
    if (!res.ok) { msg('Erreur lors de la suppression'); return }
    setContenus(p => p.filter(x => x.id !== contenuId))
    msg('🗑️ Contenu supprimé')
  }

  const supprimerInscrit = async (inscritId, nom) => {
    if (!confirm(`Supprimer l'inscription de ${nom} ?`)) return
    const res = await fetch(`${API}/formations/${id}/inscriptions/${inscritId}`, { method: 'DELETE', headers })
    if (!res.ok) { msg('Erreur lors de la suppression'); return }
    setInscrits(p => p.filter(x => x.id !== inscritId))
    setSelectedInscrit(null)
    msg('🗑️ Inscrit supprimé')
  }

  const domaines = Array.from(new Set(inscrits.map(i => i.domaine).filter(Boolean)))

  const inscritsFiltres = inscrits.filter(i => {
    if (filtreDomaine && i.domaine !== filtreDomaine) return false
    if (filtreStatut && i.utilise_beautycrm !== filtreStatut) return false
    return true
  })

  const dejaUtilisateurs = inscrits.filter(i => i.utilise_beautycrm === 'Oui').length
  const nouveaux = inscrits.filter(i => i.utilise_beautycrm === 'Non').length

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textSub, fontFamily: '-apple-system, BlinkMacSystemFont, Inter, sans-serif' }}>
        Chargement...
      </div>
    )
  }

  if (!formation) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: T.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: T.textSub, fontFamily: '-apple-system, BlinkMacSystemFont, Inter, sans-serif', gap: '16px' }}>
        <div>Formation introuvable.</div>
        <Btn onClick={() => navigate(retourPath)}>← Retour</Btn>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: T.bg, fontFamily: '-apple-system, BlinkMacSystemFont, Inter, sans-serif' }}>
      <div style={{ padding: 'clamp(12px,3vw,20px) 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <button onClick={() => navigate(retourPath)} style={{ background: 'none', border: 'none', color: T.textSub, fontSize: '13px', cursor: 'pointer', padding: 0, fontFamily: 'inherit', marginBottom: '6px' }}>← Retour</button>
          <div style={{ color: T.text, fontSize: 'clamp(1.05rem,4vw,1.3rem)', fontWeight: '800' }}>{formation.titre}</div>
          <div style={{ color: T.textSub, fontSize: '12px', marginTop: '2px' }}>{formation.lieu} {formation.duree ? `— ${formation.duree}` : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Btn onClick={ouvrirEditionFormation} color="rgba(96,165,250,0.15)" textColor="#60A5FA">
            ✏️ Modifier
          </Btn>
          <Btn onClick={ouvrirContenus} color="rgba(167,139,250,0.15)" textColor="#A78BFA">
            🎥 Contenus
          </Btn>
          <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', backgroundColor: formation.actif ? 'rgba(29,158,117,0.15)' : 'rgba(226,75,74,0.15)', color: formation.actif ? T.accent : '#E24B4A', fontWeight: '700' }}>
            {formation.actif ? 'Active' : 'Désactivée'}
          </span>
        </div>
      </div>

      {message && (
        <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', backgroundColor: T.card, border: `1px solid ${T.border}`, borderRadius: '8px', padding: '10px 18px', color: T.text, fontSize: '13px', zIndex: 2000 }}>
          {message}
        </div>
      )}

      <div style={{ padding: 'clamp(14px,4vw,32px)', maxWidth: '1100px', margin: '0 auto' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px', marginBottom: '28px' }}>
          <Card style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '26px', fontWeight: '800', color: T.accent }}>{inscrits.length}</div>
            <div style={{ fontSize: '11px', color: T.textSub, marginTop: '4px' }}>Inscrits</div>
          </Card>
          <Card style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '26px', fontWeight: '800', color: '#60A5FA' }}>{dejaUtilisateurs}</div>
            <div style={{ fontSize: '11px', color: T.textSub, marginTop: '4px' }}>Déjà utilisateurs</div>
          </Card>
          <Card style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '26px', fontWeight: '800', color: '#F59E0B' }}>{nouveaux}</div>
            <div style={{ fontSize: '11px', color: T.textSub, marginTop: '4px' }}>Nouveaux</div>
          </Card>
          <Card style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '26px', fontWeight: '800', color: '#A78BFA' }}>{domaines.length}</div>
            <div style={{ fontSize: '11px', color: T.textSub, marginTop: '4px' }}>Domaines</div>
          </Card>
        </div>

        {/* Filtres */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <select value={filtreDomaine} onChange={e => setFiltreDomaine(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: T.card, border: `1px solid ${T.border}`, color: T.text, fontSize: '13px' }}>
            <option value="">Tous les domaines</option>
            {domaines.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: T.card, border: `1px solid ${T.border}`, color: T.text, fontSize: '13px' }}>
            <option value="">Tous les statuts</option>
            <option value="Oui">Utilise déjà BeautyCRM</option>
            <option value="Non">Nouveau</option>
          </select>
        </div>

        {/* Liste inscrits */}
        <div style={{ backgroundColor: T.card, border: `1px solid ${T.border}`, borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {['Nom', 'Téléphone', 'Pays', 'Domaine', 'Statut', 'Date'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: T.textSub, fontWeight: '600', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inscritsFiltres.length === 0 ? (
                  <tr><td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: T.textSub }}>Aucun inscrit pour l'instant.</td></tr>
                ) : (
                  inscritsFiltres.map(i => (
                    <tr key={i.id} onClick={() => setSelectedInscrit(i)} style={{ borderBottom: `1px solid ${T.border}`, cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background = T.bg2} onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <td style={{ padding: '10px 14px', color: T.text, fontWeight: '600' }}>{i.nom}</td>
                      <td style={{ padding: '10px 14px', color: T.textSub, whiteSpace: 'nowrap' }}>{i.telephone}</td>
                      <td style={{ padding: '10px 14px', color: T.textSub }}>{i.pays || '—'}</td>
                      <td style={{ padding: '10px 14px', color: T.textSub }}>{i.domaine || '—'}</td>
                      <td style={{ padding: '10px 14px' }}>
                        {i.utilise_beautycrm && (
                          <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', backgroundColor: i.utilise_beautycrm === 'Oui' ? 'rgba(96,165,250,0.15)' : 'rgba(245,158,11,0.15)', color: i.utilise_beautycrm === 'Oui' ? '#60A5FA' : '#F59E0B', fontWeight: '600' }}>
                            {i.utilise_beautycrm === 'Oui' ? 'Déjà utilisateur' : 'Nouveau'}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px', color: T.textSub, whiteSpace: 'nowrap' }}>{i.created_at ? new Date(i.created_at).toLocaleDateString('fr-FR') : '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedInscrit && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: T.card, borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '480px', border: `1px solid ${T.border}`, maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: T.text, margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>{selectedInscrit.nom}</h2>
              <button onClick={() => setSelectedInscrit(null)} style={{ background: 'none', border: 'none', color: T.textSub, fontSize: '22px', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {[
                ['Téléphone', selectedInscrit.telephone || '—'],
                ['Email', selectedInscrit.email || '—'],
                ['Pays', selectedInscrit.pays || '—'],
                ['Ville', selectedInscrit.ville || '—'],
                ['Domaine', selectedInscrit.domaine || '—'],
                ['Utilise déjà BeautyCRM', selectedInscrit.utilise_beautycrm || '—'],
                ['Version utilisée', selectedInscrit.version_beautycrm || '—'],
                ['Entendu parler de BeautyCRM', selectedInscrit.entendu_parler || '—'],
                ["Date d'inscription", selectedInscrit.created_at ? new Date(selectedInscrit.created_at).toLocaleString('fr-FR') : '—'],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', backgroundColor: T.bg, border: `1px solid ${T.border}`, borderRadius: '8px', padding: '10px 14px' }}>
                  <span style={{ color: T.textSub, fontSize: '12px', fontWeight: '600' }}>{label}</span>
                  <span style={{ color: T.text, fontSize: '13px', fontWeight: '600', textAlign: 'right' }}>{value}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
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

            <Btn onClick={() => supprimerInscrit(selectedInscrit.id, selectedInscrit.nom)} color="rgba(226,75,74,0.15)" textColor="#E24B4A" style={{ width: '100%' }}>
              Supprimer
            </Btn>
          </div>
        </div>
      )}

      {showEditFormation && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: T.card, borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '520px', border: `1px solid ${T.border}`, maxHeight: '88vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: T.text, margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>✏️ Modifier la formation</h2>
              <button onClick={() => setShowEditFormation(false)} style={{ background: 'none', border: 'none', color: T.textSub, fontSize: '22px', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: T.textSub, fontWeight: '600', display: 'block', marginBottom: '4px' }}>Titre *</label>
                <input style={inp} value={formFormation.titre} onChange={e => setFormFormation(p => ({ ...p, titre: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: T.textSub, fontWeight: '600', display: 'block', marginBottom: '4px' }}>Description</label>
                <textarea style={{ ...inp, minHeight: '70px', resize: 'vertical' }} value={formFormation.description} onChange={e => setFormFormation(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: T.textSub, fontWeight: '600', display: 'block', marginBottom: '4px' }}>Lieu</label>
                <input style={inp} value={formFormation.lieu} onChange={e => setFormFormation(p => ({ ...p, lieu: e.target.value }))} placeholder="Ex: En ligne sur Google Meet" />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: T.textSub, fontWeight: '600', display: 'block', marginBottom: '4px' }}>Date</label>
                  <input type="date" style={inp} value={formFormation.dateDebut} onChange={e => setFormFormation(p => ({ ...p, dateDebut: e.target.value }))} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: T.textSub, fontWeight: '600', display: 'block', marginBottom: '4px' }}>Heure</label>
                  <input type="time" style={inp} value={formFormation.heureDebut} onChange={e => setFormFormation(p => ({ ...p, heureDebut: e.target.value }))} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: T.textSub, fontWeight: '600', display: 'block', marginBottom: '4px' }}>Fuseau horaire</label>
                <select style={inp} value={formFormation.fuseauHoraire} onChange={e => setFormFormation(p => ({ ...p, fuseauHoraire: e.target.value }))}>
                  {FUSEAUX.map(tz => <option key={tz.v} value={tz.v}>{tz.l}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: T.textSub, fontWeight: '600', display: 'block', marginBottom: '4px' }}>Durée</label>
                <input style={inp} value={formFormation.duree} onChange={e => setFormFormation(p => ({ ...p, duree: e.target.value }))} placeholder="Ex: 2h" />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: T.textSub, fontWeight: '600', display: 'block', marginBottom: '4px' }}>Formateur</label>
                <input style={inp} value={formFormation.formateur} onChange={e => setFormFormation(p => ({ ...p, formateur: e.target.value }))} />
              </div>
              <Btn onClick={sauvegarderFormation} style={{ padding: '12px', marginTop: '6px' }}>
                Enregistrer les modifications
              </Btn>
            </div>
          </div>
        </div>
      )}

      {showContenus && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: T.card, borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '600px', border: `1px solid ${T.border}`, maxHeight: '88vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: T.text, margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>🎥 Contenus de la formation</h2>
              <button onClick={() => { setShowContenus(false); setEditContenu(null) }} style={{ background: 'none', border: 'none', color: T.textSub, fontSize: '22px', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
              {contenus.length === 0 && (
                <p style={{ color: T.textSub, fontSize: '13px' }}>Aucun contenu publié pour l'instant.</p>
              )}
              {contenus.map(c => (
                <div key={c.id} style={{ backgroundColor: T.bg, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ color: T.text, fontWeight: '600', fontSize: '13px' }}>
                      {c.type_contenu === 'article' ? '📝' : '🎥'} {c.titre}
                    </div>
                    {c.description && <div style={{ color: T.textSub, fontSize: '12px', marginTop: '2px' }}>{c.description.slice(0, 80)}{c.description.length > 80 ? '…' : ''}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <Btn onClick={() => ouvrirEdition(c)} color="rgba(96,165,250,0.15)" textColor="#60A5FA" style={{ padding: '6px 10px' }}>Modifier</Btn>
                    <Btn onClick={() => supprimerContenu(c.id)} color="rgba(226,75,74,0.15)" textColor="#E24B4A" style={{ padding: '6px 10px' }}>Suppr.</Btn>
                  </div>
                </div>
              ))}
            </div>

            <h3 style={{ color: T.text, fontSize: '0.95rem', fontWeight: '700', marginBottom: '12px' }}>
              {editContenu ? 'Modifier le contenu' : 'Ajouter un contenu'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[{ v: 'video', l: '🎥 Vidéo' }, { v: 'article', l: '📝 Explication texte' }].map(t => (
                  <button key={t.v} type="button"
                    onClick={() => setFormContenu(p => ({ ...p, typeContenu: t.v }))}
                    style={{ flex: 1, padding: '10px', borderRadius: '10px', border: `1px solid ${formContenu.typeContenu === t.v ? T.accent : T.border}`, background: formContenu.typeContenu === t.v ? T.accentDim : 'transparent', color: formContenu.typeContenu === t.v ? T.accent : T.textSub, cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                    {t.l}
                  </button>
                ))}
              </div>
              <div>
                <label style={{ fontSize: '12px', color: T.textSub, fontWeight: '600', display: 'block', marginBottom: '4px' }}>Titre *</label>
                <input style={inp} value={formContenu.titre} onChange={e => setFormContenu(p => ({ ...p, titre: e.target.value }))} placeholder="Ex: Comment créer une facture" />
              </div>
              {formContenu.typeContenu === 'video' && (
                <div>
                  <label style={{ fontSize: '12px', color: T.textSub, fontWeight: '600', display: 'block', marginBottom: '4px' }}>URL de la vidéo * (YouTube, Vimeo, ou lien direct .mp4)</label>
                  <input style={inp} value={formContenu.urlVideo} onChange={e => setFormContenu(p => ({ ...p, urlVideo: e.target.value }))} placeholder="https://youtube.com/watch?v=..." />
                </div>
              )}
              <div>
                <label style={{ fontSize: '12px', color: T.textSub, fontWeight: '600', display: 'block', marginBottom: '4px' }}>Description</label>
                <textarea style={{ ...inp, minHeight: '90px', resize: 'vertical' }} value={formContenu.description} onChange={e => setFormContenu(p => ({ ...p, description: e.target.value }))} placeholder="Expliquez la fonctionnalité présentée..." />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                {editContenu && (
                  <Btn onClick={() => ouvrirEdition(null)} color="transparent" textColor={T.textSub} style={{ border: `1px solid ${T.border}` }}>
                    Annuler
                  </Btn>
                )}
                <Btn onClick={sauvegarderContenu} style={{ flex: 1, padding: '12px' }}>
                  {editContenu ? 'Enregistrer les modifications' : '➕ Publier'}
                </Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const inp = { width: '100%', padding: '10px 12px', backgroundColor: T.bg, border: `1px solid ${T.border}`, borderRadius: '8px', color: T.text, fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }
