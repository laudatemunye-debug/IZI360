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
  const [showAncienModal, setShowAncienModal] = useState(false)
  const [selectedAncien, setSelectedAncien] = useState(null)
  const [selectedBrevet, setSelectedBrevet] = useState(null)
  const [editBrevet, setEditBrevet] = useState(null)
  const [qrDataUrlBrevet, setQrDataUrlBrevet] = useState('')
  const [formations, setFormations] = useState([])
  const [selectedFormationInscrits, setSelectedFormationInscrits] = useState(null)
  const [selectedInscrit, setSelectedInscrit] = useState(null)
  const [message, setMessage] = useState('')
  const brevetCertRef = useRef(null)
  const navigate = useNavigate()

  const token = localStorage.getItem('izi360_token')
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
  const user = JSON.parse(localStorage.getItem('izi360_user') || '{}')

  const msg = (m) => { setMessage(m); setTimeout(() => setMessage(''), 3000) }

  useEffect(() => {
    if (!token) { navigate('/login'); return }
    fetchBrevets()
    fetchFormations()
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

  const fetchFormations = async () => {
    try {
      const res = await fetch(`${API}/formations/all`, { headers })
      const data = await res.json()
      setFormations(Array.isArray(data) ? data : [])
    } catch (e) { console.error(e) }
  }

  useEffect(() => {
    if (page === 'brevets') fetchBrevets()
  }, [page])

  const openAncienModal = () => {
    if (brevets.length === 0) fetchBrevets()
    setShowAncienModal(true)
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

  const totalBrevets = brevets.length
  const totalAnciens = new Set(brevets.map(b => `${b.participant}|${b.telephone}`)).size
  const prochainNumero = String(totalBrevets + 1).padStart(3, '0')

  const inp = { width: '100%', padding: '10px 12px', backgroundColor: T.bg, border: `1px solid ${T.border}`, borderRadius: '8px', color: T.text, fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: T.bg, fontFamily: '-apple-system, BlinkMacSystemFont, Inter, sans-serif' }}>
      <div style={{ padding: 'clamp(12px,3vw,20px) 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: T.text, fontSize: '18px', fontWeight: '800' }}>IZI<span style={{ color: T.accent }}>360</span></div>
          <div style={{ color: T.accent, fontSize: '11px', fontWeight: '600', marginTop: '2px' }}>ESPACE FORMATEUR{user.formation_titre ? ` · ${user.formation_titre}` : ''}</div>
        </div>
        <Btn onClick={() => { localStorage.removeItem('izi360_token'); localStorage.removeItem('izi360_user'); navigate('/login') }} color="rgba(226,75,74,0.15)" textColor="#E24B4A">
          Déconnexion
        </Btn>
      </div>

      {message && (
        <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', backgroundColor: T.card, border: `1px solid ${T.border}`, borderRadius: '8px', padding: '10px 18px', color: T.text, fontSize: '13px', zIndex: 2000 }}>
          {message}
        </div>
      )}

      <div style={{ padding: 'clamp(14px,4vw,32px)', maxWidth: '1100px', margin: '0 auto' }}>
        {page === 'accueil' && (
          <div className="espace-formateur-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <Card onClick={() => navigate('/admin/brevet/champignon')} style={{ cursor: 'pointer', textAlign: 'center', padding: '28px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', fontWeight: '700', color: '#fff', lineHeight: 1 }}>
                +
              </div>
              <div style={{ color: T.textSub, fontWeight: '600', fontSize: '13px' }}>Générer un brevet</div>
            </Card>
            <Card onClick={() => setPage('brevets')} style={{ cursor: 'pointer', textAlign: 'center', padding: '32px 20px' }}>
              <div style={{ fontSize: '28px', fontWeight: '800', color: T.accent, marginBottom: '10px' }}>{totalBrevets}</div>
              <div style={{ color: T.text, fontWeight: '700', fontSize: '15px' }}>Brevet généré</div>
            </Card>
            <Card onClick={openAncienModal} style={{ cursor: 'pointer', textAlign: 'center', padding: '32px 20px' }}>
              <div style={{ fontSize: '28px', fontWeight: '800', color: T.accent, marginBottom: '10px' }}>{totalAnciens}</div>
              <div style={{ color: T.text, fontWeight: '700', fontSize: '15px' }}>Ancien participant</div>
            </Card>
          </div>
        )}

        {page === 'accueil' && formations.length > 0 && (
          <div style={{ marginTop: '24px' }}>
            <h2 style={{ color: T.text, fontSize: '1rem', fontWeight: '700', marginBottom: '12px' }}>Ma formation</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {page === 'brevets' && (
          <div>
            <button onClick={() => setPage('accueil')} style={{ background: 'none', border: 'none', color: T.textSub, fontSize: '13px', cursor: 'pointer', marginBottom: '16px', padding: 0, fontFamily: 'inherit' }}>← Retour</button>
            <h1 style={{ color: T.text, fontSize: 'clamp(1.1rem, 4vw, 1.4rem)', fontWeight: '700', marginBottom: '16px' }}>Brevet généré ({brevets.length})</h1>

            {loading && <p style={{ color: T.textSub }}>Chargement...</p>}

            {!loading && (
              <div style={{ backgroundColor: T.card, border: `1px solid ${T.border}`, borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                        {['N°', 'Participant', 'Formation', 'Date', 'Durée', 'Lieu', 'Formateur'].map(h => (
                          <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: T.textSub, fontWeight: '600', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {brevets.length === 0 ? (
                        <tr><td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: T.textSub }}>Aucun brevet généré pour votre formation.</td></tr>
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
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

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
                    <Btn onClick={telechargerBrevetPDF} color="rgba(96,165,250,0.15)" textColor="#60A5FA">Télécharger PDF</Btn>
                    <Btn onClick={sauvegarderBrevet}>Modifier</Btn>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showAncienModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: T.card, borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '480px', border: `1px solid ${T.border}`, maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: T.text, margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>
                {selectedAncien ? selectedAncien.participant : 'Anciens participants'}
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
  )
}
