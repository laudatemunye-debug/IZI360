import { useState } from 'react'
import { ArrowLeft, Globe, Building2, HeartHandshake, Users2, Check } from 'lucide-react'
import { ASSOCIATION_TYPES } from '../../data/associations'

const C = {
  g: '#1D9E75', gd: '#0F6E56', gl: '#E1F5EE',
  text2: '#5F5E5A', grb: '#D3D1C7', white: '#FFFFFF', bg: '#F4F4F0', dark: '#1A1A18',
}

const TYPE_ICON = { ong: Globe, asbl: Building2, mutuelle: HeartHandshake, groupe: Users2 }
const TYPE_COLORS = {
  ong:      { bg: '#E6F1FB', fg: '#0C447C' },
  asbl:     { bg: '#EEEDFE', fg: '#3C3489' },
  mutuelle: { bg: '#FCEBEB', fg: '#791F1F' },
  groupe:   { bg: C.gl,      fg: C.gd },
}

export default function AssociationSetupScreen({ onDone, onBack }) {
  const [type, setType] = useState(null)
  const [name, setName] = useState('')

  const canSubmit = type && name.trim().length > 0

  const submit = () => {
    if (!canSubmit) return
    onDone({ type, name: name.trim() })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, height: '100dvh', display: 'flex', justifyContent: 'center', backgroundColor: C.bg }}>
      <div style={{ width: '100%', maxWidth: 720, display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>

        <div style={{ backgroundColor: C.g, padding: 'calc(env(safe-area-inset-top) + 16px) 20px 16px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          {onBack && (
            <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.16)', border: 'none', borderRadius: 9, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <ArrowLeft size={18} color="#fff" />
            </button>
          )}
          <h1 style={{ fontSize: 17, fontWeight: 700, color: '#fff', margin: 0 }}>Nouvelle association</h1>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 700, color: C.text2, marginBottom: 10, display: 'block', textTransform: 'uppercase', letterSpacing: 0.4 }}>
              Type d'association
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.values(ASSOCIATION_TYPES).map((t) => {
                const Icon = TYPE_ICON[t.key]
                const active = type === t.key
                const colors = TYPE_COLORS[t.key] || TYPE_COLORS.groupe
                return (
                  <button
                    key={t.key}
                    onClick={() => setType(t.key)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                      backgroundColor: active ? C.gl : C.white,
                      border: `1.5px solid ${active ? C.g : C.grb}`, borderRadius: 14,
                      cursor: 'pointer', textAlign: 'left', width: '100%', boxSizing: 'border-box',
                      boxShadow: active ? '0 4px 12px rgba(29,158,117,0.12)' : '0 1px 2px rgba(0,0,0,0.03)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ width: 42, height: 42, borderRadius: 11, backgroundColor: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={19} color={colors.fg} strokeWidth={2} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: C.dark }}>{t.label}</div>
                      <div style={{ fontSize: 12.5, color: C.text2, marginTop: 2 }}>{t.description}</div>
                    </div>
                    {active ? (
                      <div style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: C.g, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Check size={13} color={C.white} strokeWidth={3} />
                      </div>
                    ) : (
                      <div style={{ width: 22, height: 22, borderRadius: 11, border: `1.5px solid ${C.grb}`, flexShrink: 0 }} />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12.5, fontWeight: 700, color: C.text2, marginBottom: 8, display: 'block', textTransform: 'uppercase', letterSpacing: 0.4 }}>
              Nom de l'association
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex : Solidarité Butembo"
              style={{
                width: '100%', padding: '13px 14px', fontSize: 15, borderRadius: 12,
                border: `1.5px solid ${C.grb}`, backgroundColor: C.white, boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>
        </div>

        <div style={{ padding: '16px 20px calc(env(safe-area-inset-bottom) + 20px)', flexShrink: 0, backgroundColor: C.bg, borderTop: `1px solid ${C.grb}` }}>
          <button
            onClick={submit}
            disabled={!canSubmit}
            style={{
              width: '100%', padding: '15px', backgroundColor: canSubmit ? C.g : C.grb,
              color: C.white, border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              boxShadow: canSubmit ? '0 4px 14px rgba(29,158,117,0.28)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Créer l'association
          </button>
        </div>

      </div>
    </div>
  )
}
