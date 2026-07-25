import { Plus, Building2, HeartHandshake, Globe, Users2, ChevronRight } from 'lucide-react'
import { ASSOCIATION_TYPES } from '../../data/associations'

const C = { g: '#1D9E75', text2: '#5F5E5A', grb: '#D3D1C7', white: '#FFFFFF', bg: '#F4F4F0', dark: '#1A1A18' }

const TYPE_ICON = { ong: Globe, asbl: Building2, mutuelle: HeartHandshake, groupe: Users2 }

export default function AssociationSelectScreen({ associations, onSelect, onNew }) {
  return (
    <div style={{ width: '100%', maxWidth: 1100, margin: '0 auto', minHeight: '100vh', backgroundColor: C.bg, display: 'flex', flexDirection: 'column', boxSizing: 'border-box', padding: '0 20px' }}>
      <div style={{ padding: '32px 0 20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.dark, margin: 0 }}>UnionPro</h1>
        <p style={{ fontSize: 14, color: C.text2, marginTop: 4 }}>Choisissez une association ou créez-en une nouvelle</p>
      </div>

      <div style={{ flex: 1 }}>
        {associations.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 16px', color: C.text2, fontSize: 14 }}>
            Aucune association pour l'instant.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {associations.map((assoc) => {
            const Icon = TYPE_ICON[assoc.type] || Users2
            const typeLabel = ASSOCIATION_TYPES[assoc.type]?.label || assoc.type
            return (
              <button
                key={assoc.id}
                onClick={() => onSelect(assoc)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                  backgroundColor: C.white, border: `1px solid ${C.grb}`, borderRadius: 12,
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#EAF6F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={20} color={C.g} strokeWidth={2} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: C.dark, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {assoc.name}
                  </div>
                  <div style={{ fontSize: 12, color: C.text2, marginTop: 2 }}>{typeLabel}</div>
                </div>
                <ChevronRight size={18} color={C.text2} />
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ padding: '24px 0', display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={onNew}
          style={{
            width: '100%', maxWidth: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '14px', backgroundColor: C.g, color: C.white, border: 'none', borderRadius: 12,
            fontSize: 15, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Plus size={18} />
          Nouvelle association
        </button>
      </div>
    </div>
  )
}
