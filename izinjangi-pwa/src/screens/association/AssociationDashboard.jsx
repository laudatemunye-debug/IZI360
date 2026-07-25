import { ArrowLeft, Wallet, Users, FileText, Landmark } from 'lucide-react'
import { ASSOCIATION_TYPES } from '../../data/associations'

const C = { g: '#1D9E75', text2: '#5F5E5A', grb: '#D3D1C7', white: '#FFFFFF', bg: '#F4F4F0', dark: '#1A1A18' }

const MODULES_BY_TYPE = {
  ong:      [{ key: 'tontine', label: 'Tontine', Icon: Wallet, active: true }, { key: 'membres', label: 'Membres', Icon: Users, active: false }, { key: 'projets', label: 'Projets', Icon: FileText, active: false }],
  asbl:     [{ key: 'tontine', label: 'Tontine', Icon: Wallet, active: true }, { key: 'membres', label: 'Membres', Icon: Users, active: false }, { key: 'cotisations', label: 'Cotisations', Icon: Landmark, active: false }],
  mutuelle: [{ key: 'tontine', label: 'Tontine', Icon: Wallet, active: true }, { key: 'membres', label: 'Membres', Icon: Users, active: false }, { key: 'cotisations', label: 'Cotisations', Icon: Landmark, active: false }],
  groupe:   [{ key: 'tontine', label: 'Tontine', Icon: Wallet, active: true }],
}

export default function AssociationDashboard({ association, onOpenModule, onBack }) {
  const modules = MODULES_BY_TYPE[association.type] || MODULES_BY_TYPE.groupe
  const typeLabel = ASSOCIATION_TYPES[association.type]?.label || association.type

  return (
    <div style={{ width: '100%', maxWidth: 1100, margin: '0 auto', minHeight: '100vh', backgroundColor: C.bg, display: 'flex', flexDirection: 'column', boxSizing: 'border-box', padding: '0 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 0 4px' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <ArrowLeft size={22} color={C.dark} />
        </button>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: C.dark, margin: 0 }}>{association.name}</h1>
          <span style={{ fontSize: 12, color: C.text2 }}>{typeLabel}</span>
        </div>
      </div>

      <div style={{ padding: '20px 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
        {modules.map(({ key, label, Icon, active }) => (
          <button
            key={key}
            onClick={() => onOpenModule(key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '16px',
              backgroundColor: C.white, border: `1px solid ${C.grb}`, borderRadius: 12,
              cursor: 'pointer', textAlign: 'left', opacity: active ? 1 : 0.6,
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: active ? '#EAF6F0' : '#EEEEEC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={20} color={active ? C.g : C.text2} strokeWidth={2} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: C.dark }}>{label}</div>
              {!active && <div style={{ fontSize: 12, color: C.text2, marginTop: 2 }}>Bientôt disponible</div>}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
