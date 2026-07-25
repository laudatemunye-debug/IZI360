import { useState } from 'react'
import { ArrowLeft, Globe, Building2, HeartHandshake, Users2, Check } from 'lucide-react'
import { ASSOCIATION_TYPES } from '../../data/associations'

const C = { g: '#1D9E75', text2: '#5F5E5A', grb: '#D3D1C7', white: '#FFFFFF', bg: '#F4F4F0', dark: '#1A1A18' }

const TYPE_ICON = { ong: Globe, asbl: Building2, mutuelle: HeartHandshake, groupe: Users2 }

export default function AssociationSetupScreen({ onDone, onBack }) {
  const [type, setType] = useState(null)
  const [name, setName] = useState('')

  const canSubmit = type && name.trim().length > 0

  const submit = () => {
    if (!canSubmit) return
    onDone({ type, name: name.trim() })
  }

  return (
    <div style={{ width: '100%', maxWidth: 680, margin: '0 auto', minHeight: '100vh', backgroundColor: C.bg, display: 'flex', flexDirection: 'column', boxSizing: 'border-box', padding: '0 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 0 8px' }}>
        {onBack && (
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <ArrowLeft size={22} color={C.dark} />
          </button>
        )}
        <h1 style={{ fontSize: 18, fontWeight: 700, color: C.dark, margin: 0 }}>Nouvelle association</h1>
      </div>

      <div style={{ flex: 1, padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: C.text2, marginBottom: 8, display: 'block' }}>
            Type d'association
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
            {Object.values(ASSOCIATION_TYPES).map((t) => {
              const Icon = TYPE_ICON[t.key]
              const active = type === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => setType(t.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                    backgroundColor: active ? '#EAF6F0' : C.white,
                    border: `1.5px solid ${active ? C.g : C.grb}`, borderRadius: 12,
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <Icon size={19} color={active ? C.g : C.text2} strokeWidth={2} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.dark }}>{t.label}</div>
                    <div style={{ fontSize: 12, color: C.text2 }}>{t.description}</div>
                  </div>
                  {active && (
                    <div style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: C.g, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={13} color={C.white} strokeWidth={3} />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ maxWidth: 420 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: C.text2, marginBottom: 8, display: 'block' }}>
            Nom de l'association
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex : Solidarité Butembo"
            style={{
              width: '100%', padding: '12px 14px', fontSize: 15, borderRadius: 10,
              border: `1.5px solid ${C.grb}`, backgroundColor: C.white, boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      <div style={{ padding: '20px 0', display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={submit}
          disabled={!canSubmit}
          style={{
            width: '100%', maxWidth: 420, padding: '14px', backgroundColor: canSubmit ? C.g : C.grb,
            color: C.white, border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
          }}
        >
          Créer l'association
        </button>
      </div>
    </div>
  )
}
