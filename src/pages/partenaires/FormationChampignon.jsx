import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
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
  const annee = fin.getFullYear()
  return `${jj1} ${mm1} au ${jj2} ${mm2} ${annee}`
}

export default function FormationChampignon() {
  const [participant, setParticipant] = useState('')
  const [telephone, setTelephone] = useState('')
  const [email, setEmail] = useState('')
  const [lieu, setLieu] = useState('Kinshasa, RDC')
  const [dateFormation, setDateFormation] = useState('')
  const [duree, setDuree] = useState('3 jours')
  const [formateur, setFormateur] = useState('Congo Leadership Initiative')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [certificatId, setCertificatId] = useState('')
  const [numero, setNumero] = useState('')
  const [generating, setGenerating] = useState(false)
  const [erreur, setErreur] = useState('')
  const [existingId, setExistingId] = useState('')
  const certificateRef = useRef(null)
  const location = useLocation()

  useEffect(() => {
    if (location.state) {
      if (location.state.participant) setParticipant(location.state.participant)
      if (location.state.telephone) setTelephone(location.state.telephone)
      if (location.state.email) setEmail(location.state.email)
      if (location.state.lieu) setLieu(location.state.lieu)
      if (location.state.formateur) setFormateur(location.state.formateur)
    }
  }, [location.state])

  const genererBrevet = async () => {
    if (!participant.trim() || !dateFormation) {
      alert('Merci de renseigner au minimum le nom du participant et la date de formation.')
      return
    }
    if (!telephone.trim()) {
      alert('Le numéro de téléphone du participant est obligatoire.')
      return
    }
    setGenerating(true)
    setErreur('')
    setExistingId('')

    try {
      const token = localStorage.getItem('izi360_token')
      const res = await fetch(`${API}/brevets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ participant, telephone, email, lieu, dateFormation, duree, formateur }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.existingId) setExistingId(data.existingId)
        throw new Error(data.message || 'Erreur serveur')
      }

      const landingUrl = `${SITE_URL}/formation/champignon?id=${data.id}`
      const url = await QRCode.toDataURL(landingUrl, {
        width: 300,
        margin: 1,
        color: { dark: '#1A1D27', light: '#FFFFFF' },
      })

      setCertificatId(data.id)
      setNumero(data.numero || '')
      setQrDataUrl(url)
    } catch (err) {
      console.error('Erreur génération/sauvegarde du brevet', err)
      setErreur(err.message || "Le brevet n'a pas pu être sauvegardé.")
    } finally {
      setGenerating(false)
    }
  }

  const telechargerPDF = async () => {
    if (!certificateRef.current) return
    const canvas = await html2canvas(certificateRef.current, { scale: 3, backgroundColor: '#ffffff' })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = pageWidth
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    const y = Math.max((pageHeight - imgHeight) / 2, 0)
    pdf.addImage(imgData, 'PNG', 0, y, imgWidth, imgHeight)
    pdf.save(`Brevet_Champignon_${participant.replace(/\s+/g, '_')}.pdf`)
  }

  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0F1117', padding: '32px', color: '#E5E7EB' }}>
      <button
        onClick={() => navigate('/admin')}
        style={{
          background: 'none',
          border: 'none',
          color: '#9CA3AF',
          fontSize: '13px',
          cursor: 'pointer',
          marginBottom: '16px',
          padding: 0,
          fontFamily: 'inherit',
        }}
      >
        ← Retour
      </button>
      <h1 style={{ fontSize: '26px', marginBottom: '4px', fontWeight: 800 }}>
        🍄 Générateur de Brevet
      </h1>
      <p style={{ fontSize: '14px', color: '#9CA3AF', marginBottom: '28px' }}>
        Formation Production de Champignons — Congo Leadership Initiative
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          backgroundColor: '#161922',
          padding: '28px',
          borderRadius: '18px',
          marginBottom: '28px',
          border: '1px solid rgba(34,197,94,0.15)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
        }}
      >
        <Champ label="Nom du participant *">
          <input value={participant} onChange={e => setParticipant(e.target.value)} style={inputStyle} placeholder="Ex: Jean Mukendi" />
        </Champ>
        <Champ label="Téléphone *">
          <input value={telephone} onChange={e => setTelephone(e.target.value)} style={inputStyle} placeholder="Ex: +243 8xx xxx xxx" />
        </Champ>
        <Champ label="Email">
          <input value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} placeholder="Ex: jean@email.com" />
        </Champ>
        <Champ label="Date de la formation *">
          <input type="date" value={dateFormation} onChange={e => setDateFormation(e.target.value)} style={inputStyle} />
        </Champ>
        <Champ label="Durée">
          <input value={duree} onChange={e => setDuree(e.target.value)} style={inputStyle} />
        </Champ>
        <Champ label="Lieu">
          <input value={lieu} onChange={e => setLieu(e.target.value)} style={inputStyle} />
        </Champ>
        <Champ label="Formateur / Partenaire">
          <input value={formateur} onChange={e => setFormateur(e.target.value)} style={inputStyle} />
        </Champ>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
        <button onClick={genererBrevet} disabled={generating} style={btnPrimary}>
          {generating ? 'Génération...' : 'Générer le brevet'}
        </button>
        {qrDataUrl && (
          <button onClick={telechargerPDF} style={btnSecondary}>
            Télécharger le PDF
          </button>
        )}
      </div>

      {erreur && (
        <div style={{ backgroundColor: '#3B1D1D', border: '1px solid #7F1D1D', color: '#FCA5A5', padding: '12px 16px', borderRadius: '10px', marginBottom: '24px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span>⚠️ {erreur}</span>
          {existingId && (
            <a href={`${SITE_URL}/formation/champignon?id=${existingId}`} target="_blank" rel="noreferrer" style={{ color: '#FCA5A5', textDecoration: 'underline', fontWeight: 'bold' }}>
              Voir le brevet existant →
            </a>
          )}
        </div>
      )}

      {qrDataUrl && (
        <div
          ref={certificateRef}
          style={{
            position: 'relative',
            width: '1200px',
            maxWidth: '100%',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          <img
            src="/brevet-champignon-template.jpg"
            alt="Modèle brevet"
            style={{ width: '100%', height: 'auto', display: 'block' }}
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
              fontSize: '40px',
              fontWeight: 900,
              color: '#111827',
              overflow: 'hidden',
              zIndex: 2,
            }}
          >
            {participant}
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
              fontSize: '30px',
              fontWeight: 'bold',
              color: '#DC2626',
              zIndex: 2,
            }}
          >
            {numero}
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
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#DC2626',
              overflow: 'hidden',
              zIndex: 2,
            }}
          >
            {formatPeriode(dateFormation, duree)}
          </div>

          <div
            style={{
              position: 'absolute',
              left: '81.3%',
              top: '78.2%',
              width: '13.7%',
              height: '17.0%',
              backgroundColor: '#FFFFFF',
              zIndex: 2,
            }}
          >
            <img src={qrDataUrl} alt="QR Code" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
        </div>
      )}
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
const btnSecondary = {
  padding: '14px 28px',
  borderRadius: '10px',
  border: '1px solid rgba(34,197,94,0.4)',
  backgroundColor: 'transparent',
  color: '#22C55E',
  fontWeight: 800,
  fontSize: '14px',
  cursor: 'pointer',
}
