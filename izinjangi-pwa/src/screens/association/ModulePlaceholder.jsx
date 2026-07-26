import { ArrowLeft, Clock } from 'lucide-react'

const C = { g: '#1D9E75', text2: '#5F5E5A', grb: '#D3D1C7', white: '#FFFFFF', bg: '#F4F4F0', dark: '#1A1A18' }

export default function ModulePlaceholder({ moduleLabel, onBack }) {
  return (
    <div style={{ position: 'fixed', inset: 0, height: '100dvh', display: 'flex', justifyContent: 'center', backgroundColor: C.bg }}>
      <div style={{ width: '100%', maxWidth: 680, display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>

        <div style={{ backgroundColor: C.g, padding: 'calc(env(safe-area-inset-top) + 16px) 20px 16px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.16)', border: 'none', borderRadius: 9, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <ArrowLeft size={18} color="#fff" />
          </button>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: '#fff', margin: 0 }}>{moduleLabel}</h1>
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
    </div>
  )
}
