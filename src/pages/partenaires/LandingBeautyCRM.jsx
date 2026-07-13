import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import beautyLogo from '../../assets/beautycrm-logo.jpg'

const API = 'https://izi360-backend.vercel.app/api'

const C = {
  bg:        '#0D1117',
  card:      '#1A1F36',
  accent:    '#3D5AFE',
  accent2:   '#5C6BC0',
  success:   '#26A69A',
  warning:   '#FFA726',
  pink:      '#D4537E',
  text:      '#E5E7EB',
  muted:     '#9CA3AF',
  border:    'rgba(255,255,255,0.08)',
}

const DOMAINES = [
  'Cosmétiques / Beauté',
  'Coiffure / Barbier',
  'Spa / Bien-être',
  'MLM / Vente directe',
  'Commerce général',
  'Restauration / Alimentation',
  'Mode / Textile',
  'Santé / Pharmacie',
  'Autre',
]

function Countdown({ targetDate }) {
  const [time, setTime] = useState({ j: 0, h: 0, m: 0, s: 0 })
  useEffect(() => {
    const tick = () => {
      const diff = new Date(targetDate) - new Date()
      if (diff <= 0) return setTime({ j: 0, h: 0, m: 0, s: 0 })
      setTime({
        j: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      })
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [targetDate])
  const box = (val, label) => (
    <div style={{ textAlign: 'center', minWidth: 60 }}>
      <div style={{ fontSize: 'clamp(1.6rem,6vw,2.5rem)', fontWeight: 900, color: C.accent, lineHeight: 1 }}>
        {String(val).padStart(2, '0')}
      </div>
      <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{label}</div>
    </div>
  )
  return (
    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center' }}>
      {box(time.j, 'JOURS')}
      <div style={{ color: C.accent, fontWeight: 900, fontSize: 24, marginBottom: 16 }}>:</div>
      {box(time.h, 'HEURES')}
      <div style={{ color: C.accent, fontWeight: 900, fontSize: 24, marginBottom: 16 }}>:</div>
      {box(time.m, 'MINUTES')}
      <div style={{ color: C.accent, fontWeight: 900, fontSize: 24, marginBottom: 16 }}>:</div>
      {box(time.s, 'SECONDES')}
    </div>
  )
}

export default function LandingBeautyCRM() {
  const navigate = useNavigate()
  const formRef = useRef(null)
  const [formation, setFormation] = useState(null)
  const [nbInscrits, setNbInscrits] = useState(0)
  const [inscrit, setInscrit] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [form, setForm] = useState({
    nom: '', telephone: '', email: '', ville: '',
    domaine: '', utilise_beautycrm: '', version_beautycrm: '', entendu_parler: '',
  })

  useEffect(() => {
    fetch(`${API}/formations/slug/lancement-beautycrm`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) { setFormation(data); setNbInscrits(data.nb_inscrits || 0) }
      }).catch(() => {})
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const soumettre = async (e) => {
    e.preventDefault()
    if (!form.nom.trim() || !form.telephone.trim()) {
      setErreur('Nom et téléphone sont requis')
      return
    }
    setEnvoi(true); setErreur('')
    try {
      const res = await fetch(`${API}/formations/${formation?.id || 'beautycrm'}/inscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      setInscrit(true)
      setNbInscrits(n => n + 1)
    } catch {
      setErreur("Erreur lors de l'inscription, réessayez.")
    } finally {
      setEnvoi(false)
    }
  }

  const dateFormation = formation?.date_evenement || '2026-08-15'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, color: C.text, fontFamily: "'Inter', sans-serif" }}>

      {/* HERO */}
      <div style={{
        background: `linear-gradient(135deg, #0D1117 0%, #1A1F36 50%, #0D1117 100%)`,
        padding: 'clamp(40px,8vw,80px) 20px clamp(30px,6vw,60px)',
        textAlign: 'center',
        borderBottom: `1px solid ${C.border}`,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Glow */}
        <div style={{ position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)', width: 600, height: 300, background: 'radial-gradient(ellipse, rgba(61,90,254,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <img src={beautyLogo} alt="BeautyCRM" style={{ width: 72, height: 72, borderRadius: 18, objectFit: 'cover', border: `2px solid ${C.accent}`, marginBottom: 16, display: 'block', margin: '0 auto 16px' }} />

        <div style={{ fontSize: 12, letterSpacing: 3, color: C.accent, textTransform: 'uppercase', marginBottom: 12, fontWeight: 600 }}>
          🚀 Événement officiel · IZIsoft
        </div>

        <h1 style={{ fontSize: 'clamp(1.6rem,5.5vw,2.8rem)', fontWeight: 900, lineHeight: 1.2, maxWidth: 700, margin: '0 auto 16px', background: `linear-gradient(135deg, #fff 0%, ${C.accent} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Lancement Officiel de BeautyCRM
        </h1>

        <p style={{ color: C.muted, fontSize: 'clamp(14px,2.5vw,17px)', maxWidth: 560, margin: '0 auto 32px', lineHeight: 1.7 }}>
          La première formation complète sur l'outil CRM dédié aux professionnels de la beauté et du commerce en Afrique francophone.
        </p>

        {/* Compteur */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 12, letterSpacing: 1 }}>LA FORMATION COMMENCE DANS</div>
          <Countdown targetDate={dateFormation} />
        </div>

        {/* Social proof */}
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 32 }}>
          <div style={{ background: 'rgba(61,90,254,0.1)', border: `1px solid rgba(61,90,254,0.3)`, borderRadius: 12, padding: '10px 20px' }}>
            <span style={{ fontWeight: 900, fontSize: 20, color: C.accent }}>{nbInscrits}</span>
            <span style={{ color: C.muted, fontSize: 13, marginLeft: 8 }}>personnes inscrites</span>
          </div>
          <div style={{ background: 'rgba(38,166,154,0.1)', border: `1px solid rgba(38,166,154,0.3)`, borderRadius: 12, padding: '10px 20px' }}>
            <span style={{ fontWeight: 900, fontSize: 20, color: C.success }}>Gratuit</span>
            <span style={{ color: C.muted, fontSize: 13, marginLeft: 8 }}>· Places limitées</span>
          </div>
        </div>

        <button
          onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth' })}
          style={{ padding: '14px 36px', borderRadius: 14, background: `linear-gradient(135deg, ${C.accent} 0%, ${C.pink} 100%)`, color: '#fff', fontWeight: 700, fontSize: 16, border: 'none', cursor: 'pointer', boxShadow: `0 8px 32px rgba(61,90,254,0.4)` }}
        >
          Je m'inscris maintenant →
        </button>
      </div>

      {/* POURQUOI CETTE FORMATION */}
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '48px 20px' }}>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.2rem,4vw,1.6rem)', fontWeight: 800, marginBottom: 8 }}>
          Pourquoi cette formation ?
        </h2>
        <p style={{ textAlign: 'center', color: C.muted, marginBottom: 32, fontSize: 15 }}>
          BeautyCRM est l'outil qu'il vous faut pour gérer votre activité comme un pro.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {[
            { icon: '📱', titre: 'Application mobile', desc: 'Gérez votre activité depuis votre téléphone, partout au Congo' },
            { icon: '👥', titre: 'Gestion clients', desc: 'Centralisez tous vos prospects et clients en un seul endroit' },
            { icon: '🧾', titre: 'Facturation rapide', desc: 'Créez des factures en quelques secondes, suivez vos ventes' },
            { icon: '📊', titre: 'Statistiques', desc: 'Visualisez la croissance de votre activité avec des graphiques clairs' },
            { icon: '🔄', titre: 'Sync Google Drive', desc: 'Vos données sauvegardées automatiquement, zéro perte' },
            { icon: '💬', titre: 'Relance WhatsApp', desc: 'Envoyez des rappels à vos clients directement depuis l\'app' },
          ].map(f => (
            <div key={f.titre} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 16px' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 15 }}>{f.titre}</div>
              <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FORMULAIRE */}
      <div ref={formRef} style={{ maxWidth: 560, margin: '0 auto', padding: '0 20px 60px' }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 24, padding: 'clamp(24px,5vw,40px)' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 12, letterSpacing: 2, color: C.accent, textTransform: 'uppercase', marginBottom: 8 }}>📝 Inscription gratuite</div>
            <h2 style={{ fontSize: 'clamp(1.2rem,4vw,1.5rem)', fontWeight: 800 }}>Réservez votre place</h2>
            <p style={{ color: C.muted, fontSize: 13, marginTop: 6 }}>Places limitées · Inscription en 1 minute</p>
          </div>

          {inscrit ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
              <div style={{ color: C.success, fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Inscription confirmée !</div>
              <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6 }}>
                Merci <strong style={{ color: C.text }}>{form.nom}</strong> ! Nous vous contacterons sur WhatsApp au <strong style={{ color: C.text }}>{form.telephone}</strong> avec tous les détails.
              </p>
              <div style={{ marginTop: 24, padding: 16, background: 'rgba(38,166,154,0.1)', borderRadius: 12, border: '1px solid rgba(38,166,154,0.2)' }}>
                <div style={{ fontSize: 13, color: C.success }}>📲 Téléchargez BeautyCRM en attendant</div>
                <a href="https://beautycrm-web.vercel.app?ref=LAUD-K99N" target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-block', marginTop: 10, padding: '10px 20px', background: C.success, color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
                  Télécharger gratuitement
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={soumettre} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Infos de base */}
              <div style={{ fontSize: 12, color: C.accent, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginBottom: -4 }}>Vos coordonnées</div>
              <input value={form.nom} onChange={e => set('nom', e.target.value)} placeholder="Nom complet *" style={inp} />
              <input value={form.telephone} onChange={e => set('telephone', e.target.value)} placeholder="Téléphone WhatsApp * (+243...)" style={inp} type="tel" />
              <input value={form.email} onChange={e => set('email', e.target.value)} placeholder="Email (optionnel)" style={inp} type="email" />
              <input value={form.ville} onChange={e => set('ville', e.target.value)} placeholder="Ville / Pays" style={inp} />

              {/* Domaine */}
              <div style={{ fontSize: 12, color: C.accent, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginTop: 4, marginBottom: -4 }}>Votre activité</div>
              <select value={form.domaine} onChange={e => set('domaine', e.target.value)} style={{ ...inp, color: form.domaine ? C.text : C.muted }}>
                <option value="" disabled>Domaine d'activité *</option>
                {DOMAINES.map(d => <option key={d} value={d} style={{ background: C.card }}>{d}</option>)}
              </select>

              {/* Statut BeautyCRM */}
              <div style={{ fontSize: 12, color: C.accent, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginTop: 4, marginBottom: -4 }}>Votre rapport avec BeautyCRM</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '14px 16px', border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>Utilisez-vous déjà BeautyCRM ?</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {['Oui', 'Non'].map(v => (
                    <button key={v} type="button"
                      onClick={() => set('utilise_beautycrm', v)}
                      style={{ flex: 1, padding: '8px', borderRadius: 10, border: `1px solid ${form.utilise_beautycrm === v ? C.accent : C.border}`, background: form.utilise_beautycrm === v ? 'rgba(61,90,254,0.15)' : 'transparent', color: form.utilise_beautycrm === v ? C.accent : C.muted, cursor: 'pointer', fontSize: 14, fontWeight: form.utilise_beautycrm === v ? 700 : 400 }}>
                      {v}
                    </button>
                  ))}
                </div>

                {form.utilise_beautycrm === 'Oui' && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 13, color: C.muted, marginBottom: 6 }}>Quelle version utilisez-vous ?</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {['Mobile', 'Web', 'Les deux'].map(v => (
                        <button key={v} type="button"
                          onClick={() => set('version_beautycrm', v)}
                          style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${form.version_beautycrm === v ? C.success : C.border}`, background: form.version_beautycrm === v ? 'rgba(38,166,154,0.15)' : 'transparent', color: form.version_beautycrm === v ? C.success : C.muted, cursor: 'pointer', fontSize: 13 }}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {form.utilise_beautycrm === 'Non' && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 13, color: C.muted, marginBottom: 6 }}>Avez-vous déjà entendu parler de BeautyCRM ?</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {['Oui', 'Non'].map(v => (
                        <button key={v} type="button"
                          onClick={() => set('entendu_parler', v)}
                          style={{ flex: 1, padding: '6px', borderRadius: 8, border: `1px solid ${form.entendu_parler === v ? C.warning : C.border}`, background: form.entendu_parler === v ? 'rgba(255,167,38,0.1)' : 'transparent', color: form.entendu_parler === v ? C.warning : C.muted, cursor: 'pointer', fontSize: 13 }}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {erreur && <div style={{ color: '#F87171', fontSize: 13, padding: '8px 12px', background: 'rgba(239,83,80,0.1)', borderRadius: 8 }}>{erreur}</div>}

              <button type="submit" disabled={envoi}
                style={{ padding: '15px', borderRadius: 14, background: envoi ? C.muted : `linear-gradient(135deg, ${C.accent} 0%, ${C.pink} 100%)`, color: '#fff', fontWeight: 700, fontSize: 16, border: 'none', cursor: envoi ? 'wait' : 'pointer', marginTop: 4, boxShadow: envoi ? 'none' : `0 8px 24px rgba(61,90,254,0.35)` }}>
                {envoi ? 'Inscription en cours...' : '🎯 Confirmer mon inscription'}
              </button>

              <div style={{ textAlign: 'center', fontSize: 12, color: C.muted }}>
                🔒 Vos données sont sécurisées · Zéro spam
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 40, padding: '20px 0', borderTop: `1px solid ${C.border}`, color: C.muted, fontSize: 12 }}>
          <img src={beautyLogo} alt="BeautyCRM" style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover', verticalAlign: 'middle', marginRight: 8 }} />
          BeautyCRM · IZIsoft © 2026 · Butembo, Nord-Kivu, DRC
        </div>
      </div>
    </div>
  )
}

const inp = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.1)',
  backgroundColor: 'rgba(255,255,255,0.04)',
  color: '#E5E7EB',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
}
