import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'

const API = 'https://izi360-backend.vercel.app/api'

export default function LandingFormation() {
  const [searchParams] = useSearchParams()
  const id = searchParams.get('id') || ''
  const [brevet, setBrevet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

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
            marginTop: '20px',
            backgroundColor: '#1A1D27',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '20px',
            maxWidth: '400px',
            margin: '20px auto 0',
          }}
        >
          <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Délivré à</div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', margin: '4px 0' }}>{brevet.participant}</div>
          <div style={{ fontSize: '12px', color: '#6B7280' }}>
            Le {new Date(brevet.date_formation).toLocaleDateString('fr-FR')} — {brevet.duree} — {brevet.lieu}
          </div>
          <div style={{ fontSize: '11px', color: '#4B5563', marginTop: '6px' }}>N° {brevet.id}</div>
          <div style={{ fontSize: '11px', color: '#4B5563', marginTop: '2px' }}>Formateur : {brevet.formateur}</div>
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
