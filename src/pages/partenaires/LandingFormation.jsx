import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import QRCode from 'qrcode'

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

const API = 'https://izi360-backend.vercel.app/api'

export default function LandingFormation() {
  const [searchParams] = useSearchParams()
  const id = searchParams.get('id') || ''
  const [brevet, setBrevet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [formation, setFormation] = useState(null)
  const [nom, setNom] = useState('')
  const [telephone, setTelephone] = useState('')
  const [email, setEmail] = useState('')
  const [ville, setVille] = useState('')
  const [inscrit, setInscrit] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [erreurInscription, setErreurInscription] = useState('')

  useEffect(() => {
    fetch(`${API}/formations/slug/champignon`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => setFormation(data))
      .catch(() => {})
  }, [])

  const soumettreInscription = async (e) => {
    e.preventDefault()
    if (!nom.trim() || !telephone.trim()) {
      setErreurInscription('Nom et telephone requis')
      return
    }
    if (!formation) {
      setErreurInscription("Formation indisponible pour le moment")
      return
    }
    setEnvoi(true)
    setErreurInscription('')
    try {
      const res = await fetch(`${API}/formations/${formation.id}/inscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom, telephone, email, ville }),
      })
      if (!res.ok) throw new Error()
      setInscrit(true)
    } catch {
      setErreurInscription("Erreur lors de l'inscription, reessaie.")
    } finally {
      setEnvoi(false)
    }
  }

  useEffect(() => {
    async function chargerBrevet() {
      if (!id) {
        setLoading(false)
        setNotFound(true)
        return
      }
      try {
        const res = await fetch(`${API}/brevets/${id}`)
        if (!res.ok) {
          setNotFound(true)
        } else {
          const data = await res.json()
          setBrevet(data)
        }
      } catch (err) {
        console.error('Erreur lecture brevet', err)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    chargerBrevet()
  }, [id])

  useEffect(() => {
    if (!id) return
    QRCode.toDataURL(`${SITE_URL}/formation/champignon?id=${id}`, {
      width: 300,
      margin: 1,
      color: { dark: '#1A1D27', light: '#FFFFFF' },
    }).then(setQrDataUrl).catch(() => {})
  }, [id])

  if (loading) {
    return (
      <PageShell>
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#9CA3AF' }}>Vérification du brevet...</div>
      </PageShell>
    )
  }

  if (notFound || !brevet) {
    return (
      <PageShell>
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: '13px', letterSpacing: '2px', color: '#EF4444', textTransform: 'uppercase', marginBottom: '8px' }}>
            ❌ Brevet introuvable
          </div>
          <p style={{ color: '#9CA3AF', fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
            Ce code QR ne correspond à aucun brevet enregistré. Vérifie que tu as bien scanné un brevet officiel IZI360.
          </p>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div style={{ textAlign: 'center', padding: '48px 20px 32px', background: 'linear-gradient(180deg, #1A1D27 0%, #0F1117 100%)' }}>
        <div style={{ fontSize: '13px', letterSpacing: '2px', color: '#10B981', textTransform: 'uppercase', marginBottom: '8px' }}>
          ✅ Brevet vérifié
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', maxWidth: '700px', margin: '0 auto', lineHeight: 1.3 }}>
          Espace Brevet de Participation
          <br />
          Formation sur la Production de Champignons
        </h1>

        <div
          style={{
            position: 'relative',
            width: '700px',
            maxWidth: '100%',
            margin: '20px auto 0',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          <img
            src="/brevet-champignon-template.jpg"
            alt="Brevet de participation"
            style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '12px' }}
          />
          <div
            style={{
              position: 'absolute',
              left: '41.8%',
              top: '40.1%',
              width: '53.3%',
              height: '7.7%',
              display: 'flex',
              alignItems: 'center',
              fontFamily: '"Arial Black", Arial, sans-serif',
              fontSize: '23px',
              fontWeight: 900,
              color: '#111827',
              overflow: 'hidden',
            }}
          >
            {brevet.participant}
          </div>
          <div
            style={{
              position: 'absolute',
              left: '62%',
              top: '28.7%',
              width: '3.9%',
              height: '6.7%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '17px',
              fontWeight: 'bold',
              color: '#DC2626',
            }}
          >
            {brevet.numero}
          </div>
          <div
            style={{
              position: 'absolute',
              left: '50.1%',
              top: '58.2%',
              width: '40.4%',
              height: '6.5%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              fontFamily: 'Arial, sans-serif',
              fontStyle: 'italic',
              fontSize: '13px',
              fontWeight: 'bold',
              color: '#DC2626',
              overflow: 'hidden',
            }}
          >
            {formatPeriode(brevet.date_formation, brevet.duree)}
          </div>
          {qrDataUrl && (
            <div
              style={{
                position: 'absolute',
                left: '81.3%',
                top: '78.2%',
                width: '13.7%',
                height: '17.0%',
                backgroundColor: '#FFFFFF',
              }}
            >
              <img src={qrDataUrl} alt="QR Code" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
          )}
        </div>
        <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '11px', color: '#4B5563' }}>
          N° {brevet.id}
        </div>
      </div>

      <div style={{ maxWidth: '600px', margin: '40px auto', padding: '0 20px' }}>
        <div
          style={{
            backgroundColor: '#1A1D27',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            padding: '32px',
            textAlign: 'center',
            marginBottom: '20px',
          }}
        >
          <div style={{ fontSize: '13px', color: '#10B981', letterSpacing: '1px', marginBottom: '8px' }}>
            📚 PROCHAINE SESSION
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '12px' }}>Inscrivez-vous a la formation</h2>
          {inscrit ? (
            <p style={{ color: '#10B981', fontSize: '14px' }}>✅ Inscription enregistree, nous vous contacterons bientot.</p>
          ) : (
            <form onSubmit={soumettreInscription} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '340px', margin: '0 auto' }}>
              <input value={nom} onChange={e => setNom(e.target.value)} placeholder="Nom complet *" style={inputStyle} />
              <input value={telephone} onChange={e => setTelephone(e.target.value)} placeholder="Telephone *" style={inputStyle} />
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" style={inputStyle} />
              <input value={ville} onChange={e => setVille(e.target.value)} placeholder="Ville" style={inputStyle} />
              {erreurInscription && <div style={{ color: '#F87171', fontSize: '12px' }}>{erreurInscription}</div>}
              <button type="submit" disabled={envoi} style={btnDownload}>{envoi ? 'Envoi...' : "S'inscrire"}</button>
            </form>
          )}
        </div>

        <div
          style={{
            backgroundColor: '#1A1D27',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            padding: '32px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '13px', color: '#10B981', letterSpacing: '1px', marginBottom: '8px' }}>
            💼 ET APRÈS LA FORMATION ?
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '12px' }}>
            Organisez votre activité avec Beauty CRM
          </h2>
          <p style={{ color: '#9CA3AF', fontSize: '14px', lineHeight: 1.6, marginBottom: '20px' }}>
            Passez à l'échelle avec votre nouvelle activité de production de champignons : gérez votre facturation,
            suivez votre stock et centralisez vos clients, le tout dans une seule application pensée pour organiser
            votre entreprise.
          </p>

          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', textAlign: 'left', maxWidth: '340px', marginLeft: 'auto', marginRight: 'auto' }}>
            {['Facturation simple et rapide', 'Gestion de stock en temps réel', 'Fichier clients centralisé', 'Statistiques de vente'].map(item => (
              <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#D1D5DB', marginBottom: '8px' }}>
                <span style={{ color: '#10B981' }}>✓</span> {item}
              </li>
            ))}
          </ul>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/app/beauty-crm" style={btnDownload}>🎁 Essai gratuit 14 jours</Link>
          </div>
        </div>

        <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/login" style={btnOutline}>Connexion</Link>
          <Link to="/inscription" style={btnPrimaryLink}>Créer un compte sur IZI360</Link>
        </div>

        <div
          style={{
            marginTop: '32px',
            backgroundColor: '#1A1D27',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '20px',
            textAlign: 'center',
          }}
        >
          <img
            src="/logo-cli.jpeg"
            alt="Congo Leadership Initiative"
            style={{ height: '60px', objectFit: 'contain', marginBottom: '8px' }}
            onError={e => (e.target.style.display = 'none')}
          />
          <div style={{ color: '#6B7280', fontSize: '12px' }}>En partenariat avec Congo Leadership Initiative — DRC 2010</div>
        </div>
      </div>
    </PageShell>
  )
}

function PageShell({ children }) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0F1117', color: '#E5E7EB', fontFamily: 'sans-serif' }}>
      {children}
      <div style={{ textAlign: 'center', padding: '20px', color: '#4B5563', fontSize: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        IZI360 — La suite logicielle IZISOFT © 2026
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.1)',
  backgroundColor: '#0F1117',
  color: '#E5E7EB',
  fontSize: '14px',
}
const btnDownload = {
  padding: '14px 28px',
  borderRadius: '12px',
  backgroundColor: '#10B981',
  color: '#fff',
  fontWeight: 'bold',
  textDecoration: 'none',
  fontSize: '14px',
  display: 'inline-block',
}
const btnOutline = {
  padding: '12px 24px',
  borderRadius: '10px',
  border: '1px solid rgba(255,255,255,0.2)',
  color: '#E5E7EB',
  textDecoration: 'none',
  fontSize: '14px',
}
const btnPrimaryLink = {
  padding: '12px 24px',
  borderRadius: '10px',
  backgroundColor: '#374151',
  color: '#fff',
  fontWeight: 'bold',
  textDecoration: 'none',
  fontSize: '14px',
}
