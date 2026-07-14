import { useState, useEffect } from 'react'
import beautyLogo from '../../assets/beautycrm-logo.jpg'
import beautyAd from '../../assets/beautycrm-ad.png'
import iconAppMobile from '../../assets/icon-app-mobile.png'
import iconGestionClients from '../../assets/icon-gestion-clients.png'
import iconFacturation from '../../assets/icon-facturation.png'
import iconStatistiques from '../../assets/icon-statistiques.png'
import iconModeEntreprise from '../../assets/icon-mode-entreprise.png'
import iconRelanceWhatsapp from '../../assets/icon-relance-whatsapp.png'

const API = 'https://izi360-backend.vercel.app/api'

function FadeStep({ children, stepKey }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    setVisible(false)
    const t = setTimeout(() => setVisible(true), 20)
    return () => clearTimeout(t)
  }, [stepKey])
  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(16px)',
      transition: 'opacity 0.35s ease, transform 0.35s ease',
    }}>
      {children}
    </div>
  )
}

const C = {
  bg:        '#F5F6FA',
  card:      '#FFFFFF',
  accent:    '#3D5AFE',
  accent2:   '#5C6BC0',
  success:   '#26A69A',
  warning:   '#FFA726',
  pink:      '#D4537E',
  text:      '#1A1F36',
  muted:     '#6B7280',
  border:    '#E8EAF0',
}

const DOMAINES = [
  'Cosmétiques / Beauté',
  'Coiffure / Barbier',
  'Spa / Bien-être',
  'Boutique',
  'Prestation de service',
  'MLM / Vente directe',
  'Commerce général',
  'Restauration / Alimentation',
  'Mode / Textile',
  'Santé / Pharmacie',
  'Autre',
]

const PAYS = [
  { nom: 'RD Congo', indicatif: '+243' },
  { nom: 'Rwanda', indicatif: '+250' },
  { nom: 'Burundi', indicatif: '+257' },
  { nom: 'Ouganda', indicatif: '+256' },
  { nom: 'Kenya', indicatif: '+254' },
  { nom: 'Tanzanie', indicatif: '+255' },
  { nom: 'Congo-Brazzaville', indicatif: '+242' },
  { nom: 'Cameroun', indicatif: '+237' },
  { nom: "Côte d'Ivoire", indicatif: '+225' },
  { nom: 'Sénégal', indicatif: '+221' },
  { nom: 'Mali', indicatif: '+223' },
  { nom: 'Burkina Faso', indicatif: '+226' },
  { nom: 'Togo', indicatif: '+228' },
  { nom: 'Bénin', indicatif: '+229' },
  { nom: 'Gabon', indicatif: '+241' },
  { nom: 'France', indicatif: '+33' },
  { nom: 'Belgique', indicatif: '+32' },
  { nom: 'Canada', indicatif: '+1' },
  { nom: 'États-Unis', indicatif: '+1' },
  { nom: 'Autre pays', indicatif: '+' },
]

const STEP_LABELS = ['Bienvenue', 'Avantages', 'Coordonnées', 'Votre activité']

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

function ProgressBar({ step }) {
  return (
    <div style={{ display: 'flex', gap: 6, maxWidth: 420, margin: '0 auto 28px', padding: '0 20px' }}>
      {STEP_LABELS.map((label, i) => (
        <div key={label} style={{ flex: 1 }}>
          <div style={{ height: 4, borderRadius: 4, background: i <= step ? C.accent : C.border, transition: 'background 0.3s ease' }} />
        </div>
      ))}
    </div>
  )
}

export default function LandingBeautyCRM() {
  const [step, setStep] = useState(0)
  const [formation, setFormation] = useState(null)
  const [nbInscrits, setNbInscrits] = useState(0)
  const [inscrit, setInscrit] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [dejaInscrit, setDejaInscrit] = useState(false)
  const [form, setForm] = useState({
    nom: '', pays: '', telephone: '', email: '', ville: '',
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

  const setPays = (nomPays) => {
    const p = PAYS.find(x => x.nom === nomPays)
    setForm(f => {
      const dejaUnIndicatif = PAYS.some(x => f.telephone.trim() === x.indicatif || f.telephone.trim().startsWith(x.indicatif + ' '))
      const telephone = (!f.telephone.trim() || dejaUnIndicatif) ? (p ? p.indicatif + ' ' : '') : f.telephone
      return { ...f, pays: nomPays, telephone }
    })
  }

  const goNext = () => {
    setErreur('')
    if (step === 2) {
      if (!form.nom.trim() || !form.pays.trim() || !form.telephone.trim() || !form.email.trim()) {
        setErreur('Nom, pays, téléphone et email sont requis')
        return
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(form.email.trim())) {
        setErreur('Email invalide')
        return
      }
    }
    if (step === 3) {
      soumettre()
      return
    }
    setStep(s => s + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goBack = () => {
    setErreur('')
    setStep(s => Math.max(0, s - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const soumettre = async () => {
    if (!form.domaine) {
      setErreur("Merci de préciser votre domaine d'activité")
      return
    }
    if (!form.utilise_beautycrm) {
      setErreur("Merci de préciser si vous utilisez déjà BeautyCRM")
      return
    }
    setEnvoi(true); setErreur('')
    try {
      const res = await fetch(`${API}/formations/${formation?.id || 'beautycrm'}/inscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if ((data.message || '').toLowerCase().includes('déjà inscrit')) {
          setDejaInscrit(true)
        } else {
          setErreur(data.message || "Erreur lors de l'inscription, réessayez.")
        }
        return
      }
      setInscrit(true)
      setNbInscrits(n => n + 1)
      setStep(4)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setErreur("Erreur de connexion, réessayez.")
    } finally {
      setEnvoi(false)
    }
  }

  const dateFormation = formation?.date_debut || '2026-08-15'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, color: C.text, fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column' }}>

      {step > 0 && step < 4 && <div style={{ paddingTop: 24 }}><ProgressBar step={step} /></div>}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

        {/* ÉTAPE 0 — HERO */}
        {step === 0 && (
          <FadeStep stepKey="hero">
            <div style={{
              background: '#F5F6FA',
              padding: 'clamp(40px,8vw,80px) 20px clamp(30px,6vw,60px)',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)', width: 600, height: 300, background: 'radial-gradient(ellipse, rgba(61,90,254,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

              <img src={beautyLogo} alt="BeautyCRM" style={{ width: 72, height: 72, borderRadius: 18, objectFit: 'cover', border: `2px solid ${C.accent}`, marginBottom: 16, display: 'block', margin: '0 auto 16px' }} />

              <div style={{ fontSize: 12, letterSpacing: 3, color: C.accent, textTransform: 'uppercase', marginBottom: 12, fontWeight: 600 }}>
                Événement officiel · IZIsoft
              </div>

              <h1 style={{ fontSize: 'clamp(1.6rem,5.5vw,2.8rem)', fontWeight: 900, lineHeight: 1.2, maxWidth: 700, margin: '0 auto 16px', color: C.text }}>
                Lancement Officiel de{' '}
                <span style={{ color: C.accent }}>BeautyCRM</span>
              </h1>

              <p style={{ color: C.muted, fontSize: 'clamp(14px,2.5vw,17px)', maxWidth: 560, margin: '0 auto 32px', lineHeight: 1.7 }}>
                Apprenez à gérer vos clients, suivre vos ventes, contrôler votre stock et relancer vos prospects automatiquement — depuis votre téléphone, tablette ou ordinateur.
              </p>

              <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize: 12, color: C.accent, marginBottom: 12, letterSpacing: 2, fontWeight: 700 }}>LA FORMATION COMMENCE DANS</div>
                <Countdown targetDate={dateFormation} />
              </div>

              <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 32 }}>
                <div style={{ background: C.accent, borderRadius: 12, padding: '10px 20px', boxShadow: '0 4px 16px rgba(61,90,254,0.25)' }}>
                  <span style={{ fontWeight: 900, fontSize: 20, color: '#fff' }}>{nbInscrits}</span>
                  <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginLeft: 8 }}>personnes inscrites</span>
                </div>
                <div style={{ background: C.success, borderRadius: 12, padding: '10px 20px', boxShadow: '0 4px 16px rgba(38,166,154,0.25)' }}>
                  <span style={{ fontWeight: 900, fontSize: 20, color: '#fff' }}>Gratuit</span>
                  <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginLeft: 8 }}>· Places limitées</span>
                </div>
              </div>

              <button
                onClick={goNext}
                style={{ padding: '14px 36px', borderRadius: 14, background: C.accent, color: '#fff', fontWeight: 700, fontSize: 16, border: 'none', cursor: 'pointer', boxShadow: `0 8px 32px rgba(61,90,254,0.4)` }}
              >
                Je m'inscris maintenant →
              </button>
            </div>
          </FadeStep>
        )}

        {/* ÉTAPE 1 — POURQUOI */}
        {step === 1 && (
          <FadeStep stepKey="pourquoi">
            <div style={{ maxWidth: 700, margin: '0 auto', padding: '20px 20px 48px' }}>
              <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.2rem,4vw,1.6rem)', fontWeight: 800, marginBottom: 8 }}>
                Pourquoi cette formation ?
              </h2>
              <p style={{ textAlign: 'center', color: C.muted, marginBottom: 24, fontSize: 15 }}>
                BeautyCRM est l'outil qu'il vous faut pour gérer votre activité comme un pro.
              </p>
              <img src={beautyAd} alt="BeautyCRM" style={{ width: '100%', borderRadius: 20, marginBottom: 32, display: 'block', boxShadow: '0 12px 32px rgba(61,90,254,0.15)' }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
                {[
                  { icon: iconAppMobile, titre: 'Application mobile', desc: 'Gérez votre activité depuis votre téléphone, où que vous soyez' },
                  { icon: iconGestionClients, titre: 'Gestion clients', desc: 'Centralisez tous vos prospects et clients en un seul endroit' },
                  { icon: iconFacturation, titre: 'Facturation rapide', desc: 'Créez des factures en quelques secondes, suivez vos ventes' },
                  { icon: iconStatistiques, titre: 'Statistiques', desc: 'Visualisez la croissance de votre activité avec des graphiques clairs' },
                  { icon: iconModeEntreprise, titre: 'Mode Entreprise', desc: 'Accès en temps réel aux ventes de tous vos vendeurs, journal de paie intégré et comptabilité complète' },
                  { icon: iconRelanceWhatsapp, titre: 'Relance WhatsApp', desc: "Envoyez des rappels à vos clients directement depuis l'app" },
                ].map(f => (
                  <div key={f.titre} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 16px', overflow: 'hidden' }}>
                    <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 15 }}>{f.titre}</div>
                    <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>{f.desc}</div>
                    <div style={{ width: '100%', height: 120, borderRadius: 12, background: '#F5F6FA', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      <img src={f.icon} alt={f.titre} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                  </div>
                ))}
              </div>
              <StepNav onBack={goBack} onNext={goNext} nextLabel="Continuer →" />
            </div>
          </FadeStep>
        )}

        {/* ÉTAPE 2 — COORDONNÉES */}
        {step === 2 && (
          <FadeStep stepKey="coordonnees">
            <div style={{ maxWidth: 480, margin: '0 auto', padding: '10px 20px 48px' }}>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 24, padding: 'clamp(24px,5vw,40px)' }}>
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                  <div style={{ fontSize: 12, letterSpacing: 2, color: C.accent, textTransform: 'uppercase', marginBottom: 8 }}>Étape 1 / 2</div>
                  <h2 style={{ fontSize: 'clamp(1.2rem,4vw,1.5rem)', fontWeight: 800 }}>Vos coordonnées</h2>
                  <p style={{ color: C.muted, fontSize: 13, marginTop: 6 }}>Places limitées · Inscription en 1 minute</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <input value={form.nom} onChange={e => set('nom', e.target.value)} placeholder="Nom complet *" style={inp} />
                  <select value={form.pays} onChange={e => setPays(e.target.value)} style={{ ...inp, color: form.pays ? C.text : C.muted }}>
                    <option value="" disabled>Pays *</option>
                    {PAYS.map(p => <option key={p.nom} value={p.nom} style={{ background: '#fff', color: '#1A1F36' }}>{p.nom} ({p.indicatif})</option>)}
                  </select>
                  <input value={form.telephone} onChange={e => set('telephone', e.target.value)} placeholder="Téléphone WhatsApp *" style={inp} type="tel" />
                  <input value={form.email} onChange={e => set('email', e.target.value)} placeholder="Email *" style={inp} type="email" />
                  <input value={form.ville} onChange={e => set('ville', e.target.value)} placeholder="Ville" style={inp} />

                  {erreur && <div style={{ color: '#F87171', fontSize: 13, padding: '8px 12px', background: 'rgba(239,83,80,0.1)', borderRadius: 8 }}>{erreur}</div>}
                </div>
              </div>
              <StepNav onBack={goBack} onNext={goNext} nextLabel="Suivant →" />
            </div>
          </FadeStep>
        )}

        {/* ÉTAPE 3 — ACTIVITÉ */}
        {step === 3 && (
          <FadeStep stepKey="activite">
            <div style={{ maxWidth: 480, margin: '0 auto', padding: '10px 20px 48px' }}>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 24, padding: 'clamp(24px,5vw,40px)' }}>
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                  <div style={{ fontSize: 12, letterSpacing: 2, color: C.accent, textTransform: 'uppercase', marginBottom: 8 }}>Étape 2 / 2</div>
                  <h2 style={{ fontSize: 'clamp(1.2rem,4vw,1.5rem)', fontWeight: 800 }}>Votre activité</h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <select value={form.domaine} onChange={e => set('domaine', e.target.value)} style={{ ...inp, color: form.domaine ? C.text : C.muted }}>
                    <option value="" disabled>Domaine d'activité *</option>
                    {DOMAINES.map(d => <option key={d} value={d} style={{ background: '#fff', color: '#1A1F36' }}>{d}</option>)}
                  </select>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#F9FAFB', borderRadius: 12, padding: '14px 16px', border: `1px solid ${C.border}` }}>
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

                  <div style={{ textAlign: 'center', fontSize: 12, color: C.muted }}>
                    Vos données sont sécurisées
                  </div>
                </div>
              </div>
              <StepNav onBack={goBack} onNext={goNext} nextLabel={envoi ? 'Envoi...' : 'Confirmer mon inscription'} nextDisabled={envoi} />
            </div>
          </FadeStep>
        )}

        {/* ÉTAPE 4 — CONFIRMATION */}
        {step === 4 && inscrit && (
          <FadeStep stepKey="confirmation">
            <div style={{ maxWidth: 480, margin: '0 auto', padding: '40px 20px 60px', textAlign: 'center' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
              <div style={{ color: C.success, fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Inscription confirmée !</div>
              <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6 }}>
                Merci <strong style={{ color: C.text }}>{form.nom}</strong> ! Nous vous contacterons sur WhatsApp au <strong style={{ color: C.text }}>{form.telephone}</strong> avec tous les détails.
              </p>
              <div style={{ marginTop: 24, padding: 16, background: 'rgba(38,166,154,0.1)', borderRadius: 12, border: '1px solid rgba(38,166,154,0.2)' }}>
                <div style={{ fontSize: 13, color: C.success }}>Téléchargez BeautyCRM en attendant</div>
                <a href="https://beautycrm-web.vercel.app?ref=LAUD-K99N" target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-block', marginTop: 10, padding: '10px 20px', background: C.success, color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
                  Télécharger gratuitement
                </a>
              </div>

              {formation?.id && (
                <a href={`/formation/${formation.id}/contenus`}
                  style={{ display: 'block', marginTop: 12, padding: '12px 20px', background: C.card, border: `1px solid ${C.border}`, color: C.accent, borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 14, textAlign: 'center' }}>
                  🎥 Voir la vidéo du lancement et les explications de l'app
                </a>
              )}
            </div>
          </FadeStep>
        )}
      </div>

      <div style={{ textAlign: 'center', padding: '20px 0', borderTop: `1px solid ${C.border}`, color: C.muted, fontSize: 12 }}>
        <img src={beautyLogo} alt="BeautyCRM" style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover', verticalAlign: 'middle', marginRight: 8 }} />
        BeautyCRM · IZIsoft © 2026 · Tous droits réservés.
      </div>

      {dejaInscrit && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: C.card, borderRadius: 24, padding: 'clamp(28px,6vw,40px)', width: '100%', maxWidth: 400, textAlign: 'center', position: 'relative' }}>
            <button onClick={() => setDejaInscrit(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: C.muted, fontSize: 24, cursor: 'pointer', lineHeight: 1 }}>×</button>
            <div style={{ fontSize: 44, marginBottom: 12 }}>✅</div>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Vous êtes déjà inscrit(e) !</h2>
            <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Ce numéro est déjà enregistré pour cette formation. Retrouvez dès maintenant les vidéos et explications sur l'utilisation de l'application.
            </p>
            {formation?.id && (
              <a href={`/formation/${formation.id}/contenus`}
                style={{ display: 'block', padding: '14px 20px', background: C.accent, color: '#fff', borderRadius: 14, textDecoration: 'none', fontWeight: 700, fontSize: 15, marginBottom: 10 }}>
                Voir les vidéos et explications de l'app
              </a>
            )}
            <button onClick={() => setDejaInscrit(false)} style={{ width: '100%', padding: '12px 20px', background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, borderRadius: 14, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function StepNav({ onBack, onNext, nextLabel, nextDisabled }) {
  return (
    <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
      <button onClick={onBack} style={{ padding: '13px 20px', borderRadius: 14, background: 'transparent', color: C.muted, fontWeight: 600, fontSize: 14, border: `1px solid ${C.border}`, cursor: 'pointer' }}>
        ← Retour
      </button>
      <button onClick={onNext} disabled={nextDisabled} style={{ flex: 1, padding: '13px 20px', borderRadius: 14, background: nextDisabled ? C.muted : C.accent, color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: nextDisabled ? 'wait' : 'pointer', boxShadow: nextDisabled ? 'none' : `0 8px 24px rgba(61,90,254,0.35)` }}>
        {nextLabel}
      </button>
    </div>
  )
}

const inp = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: 10,
  border: '1px solid #D1D5DB',
  backgroundColor: '#F9FAFB',
  color: C.text,
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
}
