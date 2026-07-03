import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import logoLight from '../../assets/logo-light.png'

const API = 'https://izi360-backend.vercel.app/api'

export default function DevenirFormateur() {
  const [formations, setFormations] = useState([])
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [telephone, setTelephone] = useState('')
  const [password, setPassword] = useState('')
  const [formationId, setFormationId] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState('')

  useEffect(() => {
    fetch(`${API}/formateurs/formations-actives`)
      .then(r => r.json())
      .then(data => setFormations(Array.isArray(data) ? data : []))
      .catch(() => setFormations([]))
  }, [])

  const soumettre = async e => {
    e.preventDefault()
    setErreur('')
    if (!nom.trim() || !email.trim() || !password || !formationId) {
      setErreur('Merci de remplir tous les champs obligatoires (*).')
      return
    }
    if (password.length < 6) {
      setErreur('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }
    setEnvoi(true)
    try {
      const formationTitre = formations.find(f => String(f.id) === String(formationId))?.titre || ''
      const res = await fetch(`${API}/formateurs/demande`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom, email, telephone, password, formationId, formationTitre }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErreur(data.message || 'Erreur lors de l\'envoi de la demande')
        return
      }
      setSucces(data.message || 'Demande envoyée avec succès.')
    } catch (err) {
      setErreur('Erreur réseau, merci de réessayer.')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0F1117', color: '#E5E7EB', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center', padding: '48px 20px 32px', background: 'linear-gradient(180deg, #1A1D27 0%, #0F1117 100%)' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#FFFFFF', border: '2px solid #22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', margin: '0 auto 16px', boxShadow: '0 0 24px rgba(34,197,94,0.3)' }}>
          <img src={logoLight} alt="IZI360" style={{ width: '56px', height: '56px', objectFit: 'contain' }} />
        </div>
        <div style={{ fontSize: '13px', letterSpacing: '2px', color: '#22C55E', textTransform: 'uppercase', marginBottom: '8px' }}>
          Espace formateur
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: 'bold', maxWidth: '600px', margin: '0 auto', lineHeight: 1.3 }}>
          Devenir formateur IZI360
        </h1>
        <p style={{ color: '#9CA3AF', fontSize: '14px', maxWidth: '440px', margin: '12px auto 0' }}>
          Créez votre demande d'accès formateur. Un administrateur validera votre compte pour la formation choisie.
        </p>
      </div>

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '0 20px 60px' }}>
        <div
          style={{
            backgroundColor: '#1A1D27',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            padding: '32px',
          }}
        >
          {succes ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#22C55E', fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>{succes}</p>
              <p style={{ color: '#9CA3AF', fontSize: '13px' }}>Vous recevrez un accès une fois votre demande approuvée.</p>
              <Link to="/login" style={{ display: 'inline-block', marginTop: '20px', color: '#22C55E', fontSize: '13px', textDecoration: 'underline' }}>
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <form onSubmit={soumettre} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Champ label="Nom complet *">
                <input value={nom} onChange={e => setNom(e.target.value)} style={inputStyle} placeholder="Ex: Jean Mukendi" />
              </Champ>
              <Champ label="Email *">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} placeholder="jean@example.com" />
              </Champ>
              <Champ label="Téléphone">
                <input value={telephone} onChange={e => setTelephone(e.target.value)} style={inputStyle} placeholder="+243..." />
              </Champ>
              <Champ label="Mot de passe *">
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} placeholder="6 caractères minimum" />
              </Champ>
              <Champ label="Formation à encadrer *">
                <select value={formationId} onChange={e => setFormationId(e.target.value)} style={inputStyle}>
                  <option value="">-- Choisir une formation --</option>
                  {formations.map(f => (
                    <option key={f.id} value={f.id}>{f.titre}</option>
                  ))}
                </select>
              </Champ>

              {erreur && <div style={{ color: '#F87171', fontSize: '13px', textAlign: 'center' }}>{erreur}</div>}

              <button type="submit" disabled={envoi} style={btnPrimary}>
                {envoi ? 'Envoi...' : 'Envoyer ma demande'}
              </button>
            </form>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link to="/login" style={{ color: '#6B7280', fontSize: '13px', textDecoration: 'underline' }}>
            Déjà formateur ? Connexion
          </Link>
        </div>
      </div>
    </div>
  )
}

function Champ({ label, children }) {
  return (
    <div>
      <label style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 600, letterSpacing: '0.3px' }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%',
  marginTop: '6px',
  padding: '12px 14px',
  borderRadius: '10px',
  border: '1px solid rgba(255,255,255,0.12)',
  backgroundColor: '#0F1117',
  color: '#E5E7EB',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.15s ease',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}
const btnPrimary = {
  padding: '14px 28px',
  borderRadius: '10px',
  border: 'none',
  backgroundColor: '#22C55E',
  color: '#0F1117',
  fontWeight: 800,
  fontSize: '14px',
  cursor: 'pointer',
  boxShadow: '0 4px 14px rgba(34,197,94,0.3)',
}
