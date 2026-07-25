import { ArrowLeft, Clock } from 'lucide-react'

const C = { g: '#1D9E75', text2: '#5F5E5A', grb: '#D3D1C7', white: '#FFFFFF', bg: '#F4F4F0', dark: '#1A1A18' }

export default function ModulePlaceholder({ moduleLabel, onBack }) {
  return (
    <div style={{ width: '100%', maxWidth: 680, margin: '0 auto', minHeight: '100vh', backgroundColor: C.bg, display: 'flex', flexDirection: 'column', boxSizing: 'border-box', padding: '0 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 0 4px' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <ArrowLeft size={22} color={C.dark} />
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: C.dark, margin: 0 }}>{moduleLabel}</h1>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20 }}>
        <div style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#EAF6F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Clock size={26} color={C.g} />
        </div>
        <p style={{ fontSize: 15, fontWeight: 600, color: C.dark, margin: 0 }}>Module bientôt disponible</p>
        <p style={{ fontSize: 13, color: C.text2, textAlign: 'center', maxWidth: 260, margin: 0 }}>
          Le module {moduleLabel} est en préparation. Revenez bientôt.
        </p>
      </div>
    </div>
  )
}
