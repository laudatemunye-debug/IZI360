import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import beautyLogo from '../../assets/beautycrm-logo.jpg'

const API = 'https://izi360-backend.vercel.app/api'
const CLOUDINARY_CLOUD_NAME = 'ch1oxlkl'
const CLOUDINARY_UPLOAD_PRESET = 'izi360_formations'
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`

const C = {
  bg:        '#F5F6FA',
  card:      '#FFFFFF',
  accent:    '#3D5AFE',
  success:   '#26A69A',
  pink:      '#D4537E',
  danger:    '#E24B4A',
  text:      '#1A1F36',
  muted:     '#6B7280',
  border:    '#E8EAF0',
}

const inp = { width: '100%', padding: '10px 12px', backgroundColor: C.bg, border: `1px solid ${C.border}`, borderRadius: '8px', color: C.text, fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }

function getEmbedUrl(url) {
  if (!url) return null
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`
  if (url.includes('youtube.com/embed/')) return url
  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`
  return null
}

function getAuth() {
  const token = localStorage.getItem('izi360_token')
  if (!token) return { token: null, isAuthorized: false }
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (payload.exp * 1000 < Date.now()) return { token: null, isAuthorized: false }
    const isAuthorized = payload.role === 'admin' || payload.role === 'formateur'
    return { token, isAuthorized }
  } catch {
    return { token: null, isAuthorized: false }
  }
}

function getVisiteurId() {
  let vid = localStorage.getItem('izi360_visiteur_id')
  if (!vid) {
    vid = crypto.randomUUID()
    localStorage.setItem('izi360_visiteur_id', vid)
  }
  return vid
}

export default function FormationContenus() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [formation, setFormation] = useState(null)
  const [contenus, setContenus] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const { token, isAuthorized } = getAuth()
  const headers = token ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } : { 'Content-Type': 'application/json' }

  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form, setForm] = useState({ titre: '', description: '', urlVideo: '', typeContenu: 'video', ordre: 0 })
  const [sourceMode, setSourceMode] = useState('lien') // 'lien' ou 'fichier'
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState('')
  const [likes, setLikes] = useState({})
  const [comments, setComments] = useState({})
  const [commentaireOuvert, setCommentaireOuvert] = useState(null)
  const [nouveauCommentaire, setNouveauCommentaire] = useState('')
  const visiteurId = getVisiteurId()

  function fetchContenus() {
    return fetch(`${API}/formations/${id}/videos`).then(r => r.ok ? r.json() : []).catch(() => [])
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`${API}/formations/${id}`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetchContenus(),
    ]).then(([f, v]) => {
      setFormation(f)
      setContenus(Array.isArray(v) ? v : [])
      setLoading(false)
    })
  }, [id])

  useEffect(() => {
    contenus.forEach(item => {
      fetch(`${API}/formations/${id}/videos/${item.id}/likes?visiteurId=${visiteurId}`)
        .then(r => r.json())
        .then(d => setLikes(p => ({ ...p, [item.id]: d })))
    })
  }, [contenus])

  function ouvrirAjout() {
    setEditingItem(null)
    setForm({ titre: '', description: '', urlVideo: '', typeContenu: 'video', ordre: 0 })
    setShowModal(true)
  }

  function ouvrirEdition(item) {
    setEditingItem(item)
    setForm({
      titre: item.titre || '',
      description: item.description || '',
      urlVideo: item.url_video || '',
      typeContenu: item.type_contenu || 'video',
      ordre: item.ordre || 0,
    })
    setShowModal(true)
  }

  function uploaderVersCloudinary(file) {
    setUploadError('')
    setUploading(true)
    setUploadProgress(0)

    const data = new FormData()
    data.append('file', file)
    data.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', CLOUDINARY_UPLOAD_URL)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setUploadProgress(Math.round((event.loaded / event.total) * 100))
      }
    }

    xhr.onload = () => {
      setUploading(false)
      if (xhr.status >= 200 && xhr.status < 300) {
        const res = JSON.parse(xhr.responseText)
        setForm(p => ({ ...p, urlVideo: res.secure_url }))
      } else {
        setUploadError('Échec de l\'import. Réessayez.')
      }
    }

    xhr.onerror = () => {
      setUploading(false)
      setUploadError('Erreur réseau pendant l\'import.')
    }

    xhr.send(data)
  }

  function gererSelectionFichier(e) {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('video/')) {
      setUploadError('Veuillez choisir un fichier vidéo.')
      return
    }
    uploaderVersCloudinary(file)
  }

  async function sauvegarderContenu() {
    if (!form.titre.trim()) { alert('Le titre est requis'); return }
    if (form.typeContenu === 'video' && !form.urlVideo.trim()) { alert('L\u2019URL de la vid\u00e9o est requise'); return }
    setSaving(true)
    try {
      const body = JSON.stringify({
        titre: form.titre,
        description: form.description,
        urlVideo: form.urlVideo,
        typeContenu: form.typeContenu,
        ordre: form.ordre,
      })
      const url = editingItem
        ? `${API}/formations/${id}/videos/${editingItem.id}`
        : `${API}/formations/${id}/videos`
      const method = editingItem ? 'PATCH' : 'POST'
      const res = await fetch(url, { method, headers, body })
      if (!res.ok) { alert('Erreur lors de l\u2019enregistrement'); return }
      const updated = await fetchContenus()
      setContenus(Array.isArray(updated) ? updated : [])
      setShowModal(false)
      setEditingItem(null)
    } finally {
      setSaving(false)
    }
  }

  async function supprimerContenu(item) {
    if (!confirm(`Supprimer "${item.titre}" ?`)) return
    const res = await fetch(`${API}/formations/${id}/videos/${item.id}`, { method: 'DELETE', headers })
    if (!res.ok) { alert('Erreur lors de la suppression'); return }
    setContenus(prev => prev.filter(c => c.id !== item.id))
  }

  function toggleLike(item) {
    fetch(`${API}/formations/${id}/videos/${item.id}/likes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visiteurId })
    }).then(r => r.json()).then(d => setLikes(p => ({ ...p, [item.id]: d })))
  }

  function ouvrirCommentaires(item) {
    if (commentaireOuvert === item.id) { setCommentaireOuvert(null); return }
    setCommentaireOuvert(item.id)
    fetch(`${API}/formations/${id}/videos/${item.id}/comments`)
      .then(r => r.json())
      .then(d => setComments(p => ({ ...p, [item.id]: Array.isArray(d) ? d : [] })))
  }

  function envoyerCommentaire(item) {
    if (!nouveauCommentaire.trim()) return
    fetch(`${API}/formations/${id}/videos/${item.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentaire: nouveauCommentaire })
    }).then(r => r.json()).then(c => {
      setComments(p => ({ ...p, [item.id]: [...(p[item.id] || []), c] }))
      setNouveauCommentaire('')
    })
  }

  function partager(item) {
    const url = `${window.location.origin}/formation/${id}/contenus#${item.id}`
    if (navigator.share) {
      navigator.share({ title: item.titre, url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url)
      alert('Lien copié !')
    }
  }

  const contenusTries = [...contenus].sort((a, b) => {
    const da = a.created_at ? new Date(a.created_at).getTime() : 0
    const db = b.created_at ? new Date(b.created_at).getTime() : 0
    return db - da
  })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, color: C.text, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ background: `linear-gradient(160deg, #EEF0FF 0%, #FFFFFF 60%, #F0F4FF 100%)`, padding: '32px 20px', textAlign: 'center', borderBottom: `1px solid ${C.border}` }}>
        <img src={beautyLogo} alt="BeautyCRM" style={{ width: 56, height: 56, borderRadius: 14, objectFit: 'cover', display: 'block', margin: '0 auto 12px' }} />
        <div style={{ fontSize: 12, letterSpacing: 2, color: C.accent, textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>
          📚 Espace formation
        </div>
        <h1 style={{ fontSize: 'clamp(1.2rem,4.5vw,1.7rem)', fontWeight: 900, margin: 0 }}>
          {loading ? '...' : (formation?.titre || 'Formation')}
        </h1>
        <p style={{ color: C.muted, fontSize: 14, marginTop: 8 }}>
          Retrouvez ici les vidéos et explications sur les fonctionnalités de l'application.
        </p>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 20px 60px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {isAuthorized && (
          <button
            onClick={ouvrirAjout}
            style={{ padding: '14px 20px', background: C.accent, color: '#fff', border: 'none', borderRadius: 14, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
          >
            ➕ Ajouter un contenu
          </button>
        )}

        {loading && (
          <div style={{ textAlign: 'center', color: C.muted, padding: '40px 0' }}>Chargement...</div>
        )}

        {!loading && contenusTries.length === 0 && (
          <div style={{ textAlign: 'center', color: C.muted, padding: '40px 0', background: C.card, borderRadius: 16, border: `1px solid ${C.border}` }}>
            Aucun contenu publié pour l'instant. Revenez bientôt !
          </div>
        )}

        {contenusTries.map(item => {
          const embedUrl = getEmbedUrl(item.url_video)
          return (
            <div key={item.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, overflow: 'hidden' }}>
              {item.url_video && (
                embedUrl ? (
                  <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                    <iframe
                      src={embedUrl}
                      title={item.titre}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                    />
                  </div>
                ) : (
                  <video controls style={{ width: '100%', display: 'block', backgroundColor: '#000' }}>
                    <source src={item.url_video} />
                  </video>
                )
              )}
              <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ fontSize: 11, letterSpacing: 1, color: item.type_contenu === 'article' ? C.success : C.accent, textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>
                    {item.type_contenu === 'article' ? '📝 Explication' : '🎥 Vidéo'}
                  </div>
                  {item.created_at && (
                    <div style={{ fontSize: 11, color: C.muted, whiteSpace: 'nowrap' }}>
                      {new Date(item.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  )}
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>{item.titre}</h2>
                {item.description && (
                  <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{item.description}</p>
                )}

                <div style={{ display: 'flex', borderTop: `1px solid ${C.border}`, marginTop: 14, paddingTop: 6 }}>
                  <button
                    onClick={() => toggleLike(item)}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 0', background: 'none', border: 'none', borderRadius: 8, cursor: 'pointer', color: likes[item.id]?.liked ? C.accent : C.muted, fontWeight: 700, fontSize: 13, transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = C.bg}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <span style={{ fontSize: 16 }}>{likes[item.id]?.liked ? '👍' : '👍🏻'}</span>
                    J'aime{likes[item.id]?.count > 0 ? ` · ${likes[item.id].count}` : ''}
                  </button>

                  <button
                    onClick={() => ouvrirCommentaires(item)}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 0', background: 'none', border: 'none', borderRadius: 8, cursor: 'pointer', color: commentaireOuvert === item.id ? C.accent : C.muted, fontWeight: 700, fontSize: 13, transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = C.bg}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    💬 Commenter{comments[item.id]?.length > 0 ? ` · ${comments[item.id].length}` : ''}
                  </button>

                  <button
                    onClick={() => partager(item)}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 0', background: 'none', border: 'none', borderRadius: 8, cursor: 'pointer', color: C.muted, fontWeight: 700, fontSize: 13, transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = C.bg}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    ↗️ Partager
                  </button>
                </div>

                {commentaireOuvert === item.id && (
                  <div style={{ marginTop: 4, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
                    {(comments[item.id] || []).map(c => (
                      <div key={c.id} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                          {(c.auteur || 'A')[0].toUpperCase()}
                        </div>
                        <div style={{ background: C.bg, borderRadius: 16, padding: '8px 14px', maxWidth: '80%' }}>
                          <div style={{ fontSize: 12, fontWeight: 700 }}>{c.auteur || 'Anonyme'}</div>
                          <div style={{ fontSize: 13, color: C.text }}>{c.commentaire}</div>
                        </div>
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.border, flexShrink: 0 }} />
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: C.bg, borderRadius: 20, padding: '4px 6px 4px 14px' }}>
                        <input
                          value={nouveauCommentaire}
                          onChange={e => setNouveauCommentaire(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && envoyerCommentaire(item)}
                          placeholder="Écrire un commentaire..."
                          style={{ flex: 1, border: 'none', outline: 'none', background: 'none', fontSize: 13, fontFamily: 'inherit', color: C.text }}
                        />
                        <button
                          onClick={() => envoyerCommentaire(item)}
                          disabled={!nouveauCommentaire.trim()}
                          style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: nouveauCommentaire.trim() ? C.accent : C.border, color: '#fff', cursor: nouveauCommentaire.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}
                        >
                          ➤
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {isAuthorized && (
                  <div style={{ display: 'flex', gap: 10, marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
                    <button onClick={() => ouvrirEdition(item)} style={{ flex: 1, padding: '10px', background: C.bg, border: `1px solid ${C.border}`, color: C.accent, borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                      Modifier
                    </button>
                    <button onClick={() => supprimerContenu(item)} style={{ flex: 1, padding: '10px', background: 'rgba(226,75,74,0.1)', border: 'none', color: C.danger, borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                      Supprimer
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 24, textAlign: 'center', marginTop: 12 }}>
          <div style={{ fontSize: 13, color: C.success, fontWeight: 700, marginBottom: 10 }}>📲 Téléchargez BeautyCRM</div>
          <a href="https://beautycrm-web.vercel.app?ref=LAUD-K99N" target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-block', padding: '12px 24px', background: `linear-gradient(135deg, ${C.accent} 0%, ${C.pink} 100%)`, color: '#fff', borderRadius: 12, textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
            Télécharger gratuitement
          </a>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: C.card, borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>
                {editingItem ? 'Modifier le contenu' : 'Nouveau contenu'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: C.muted, fontSize: '22px', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: C.muted, fontWeight: '600', display: 'block', marginBottom: '4px' }}>Type de contenu</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setForm(p => ({ ...p, typeContenu: 'video' }))}
                    style={{ flex: 1, padding: '10px', borderRadius: 8, border: `1px solid ${C.border}`, background: form.typeContenu === 'video' ? C.accent : C.bg, color: form.typeContenu === 'video' ? '#fff' : C.text, fontWeight: 600, cursor: 'pointer' }}
                  >
                    🎥 Vidéo
                  </button>
                  <button
                    onClick={() => setForm(p => ({ ...p, typeContenu: 'article' }))}
                    style={{ flex: 1, padding: '10px', borderRadius: 8, border: `1px solid ${C.border}`, background: form.typeContenu === 'article' ? C.success : C.bg, color: form.typeContenu === 'article' ? '#fff' : C.text, fontWeight: 600, cursor: 'pointer' }}
                  >
                    📝 Explication
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: C.muted, fontWeight: '600', display: 'block', marginBottom: '4px' }}>Titre *</label>
                <input style={inp} value={form.titre} onChange={e => setForm(p => ({ ...p, titre: e.target.value }))} placeholder="Titre du contenu" />
              </div>

              {form.typeContenu === 'video' && (
                <div>
                  <label style={{ fontSize: '12px', color: C.muted, fontWeight: '600', display: 'block', marginBottom: '8px' }}>Vidéo *</label>

                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    <button
                      onClick={() => setSourceMode('lien')}
                      style={{ flex: 1, padding: '8px', borderRadius: 8, border: `1px solid ${C.border}`, background: sourceMode === 'lien' ? C.accent : C.bg, color: sourceMode === 'lien' ? '#fff' : C.text, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                    >
                      🔗 Coller un lien
                    </button>
                    <button
                      onClick={() => setSourceMode('fichier')}
                      style={{ flex: 1, padding: '8px', borderRadius: 8, border: `1px solid ${C.border}`, background: sourceMode === 'fichier' ? C.accent : C.bg, color: sourceMode === 'fichier' ? '#fff' : C.text, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                    >
                      💻 Importer depuis l'ordinateur
                    </button>
                  </div>

                  {sourceMode === 'lien' ? (
                    <input style={inp} value={form.urlVideo} onChange={e => setForm(p => ({ ...p, urlVideo: e.target.value }))} placeholder="https://youtube.com/watch?v=..." />
                  ) : (
                    <div>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={gererSelectionFichier}
                        disabled={uploading}
                        style={{ ...inp, padding: '8px', cursor: uploading ? 'default' : 'pointer' }}
                      />

                      {uploading && (
                        <div style={{ marginTop: 10 }}>
                          <div style={{ height: 8, borderRadius: 4, background: C.bg, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${uploadProgress}%`, background: C.accent, transition: 'width 0.2s' }} />
                          </div>
                          <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Import en cours... {uploadProgress}%</div>
                        </div>
                      )}

                      {!uploading && form.urlVideo && (
                        <div style={{ fontSize: 12, color: C.success, marginTop: 8, fontWeight: 600 }}>✓ Vidéo importée avec succès</div>
                      )}

                      {uploadError && (
                        <div style={{ fontSize: 12, color: C.danger, marginTop: 8 }}>{uploadError}</div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label style={{ fontSize: '12px', color: C.muted, fontWeight: '600', display: 'block', marginBottom: '4px' }}>Description</label>
                <textarea style={{ ...inp, minHeight: '90px', resize: 'vertical' }} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: C.muted, fontWeight: '600', display: 'block', marginBottom: '4px' }}>Ordre d'affichage (optionnel)</label>
                <input type="number" style={inp} value={form.ordre} onChange={e => setForm(p => ({ ...p, ordre: parseInt(e.target.value) || 0 }))} />
              </div>

              <button
                onClick={sauvegarderContenu}
                disabled={saving}
                style={{ padding: '13px', background: C.accent, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1, marginTop: 4 }}
              >
                {saving ? 'Enregistrement...' : (editingItem ? 'Enregistrer les modifications' : '➕ Publier')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
