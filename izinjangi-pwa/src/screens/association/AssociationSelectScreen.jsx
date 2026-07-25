import { useState } from 'react'
import { Plus, Building2, HeartHandshake, Globe, Users2, ChevronRight, Sparkles } from 'lucide-react'
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

function AssocCard({ assoc, onSelect }) {
  const [hover, setHover] = useState(false)
  const Icon = TYPE_ICON[assoc.type] || Users2
  const typeLabel = ASSOCIATION_TYPES[assoc.type]?.label || assoc.type
  const colors = TYPE_COLORS[assoc.type] || TYPE_COLORS.groupe

  return (
    <button
      onClick={() => onSelect(assoc)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px',
        backgroundColor: C.white,
        border: `1px solid ${hover ? C.g : C.grb}`,
        borderRadius: 14,
        cursor: 'pointer', textAlign: 'left', width: '100%', boxSizing: 'border-box',
        boxShadow: hover ? '0 6px 18px rgba(29,158,117,0.14)' : '0 1px 2px rgba(0,0,0,0.03)',
        transform: hover ? 'translateY(-1px)' : 'none',
        transition: 'all 0.15s ease',
      }}
    >
      <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={21} color={colors.fg} strokeWidth={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15.5, fontWeight: 700, color: C.dark, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {assoc.name}
        </div>
        <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, color: colors.fg, backgroundColor: colors.bg, borderRadius: 6, padding: '2px 8px', marginTop: 5 }}>
          {typeLabel}
        </div>
      </div>
      <ChevronRight size={18} color={hover ? C.g : C.text2} style={{ transition: 'color 0.15s ease', flexShrink: 0 }} />
    </button>
  )
}

export default function AssociationSelectScreen({ associations, onSelect, onNew }) {
  const isEmpty = associations.length === 0

  return (
    <div style={{ position: 'fixed', inset: 0, height: '100dvh', display: 'flex', justifyContent: 'center', backgroundColor: C.bg }}>
      <div style={{ width: '100%', maxWidth: 720, display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>

        <div style={{ backgroundColor: C.g, padding: 'calc(env(safe-area-inset-top) + 28px) 20px 24px', textAlign: 'center', flexShrink: 0 }}>
          <div style={{
            width: 52, height: 52, margin: '0 auto 12px', borderRadius: 16,
            backgroundColor: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={24} color="#fff" strokeWidth={2} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: -0.3 }}>UnionPro</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 6 }}>Choisissez une association ou créez-en une nouvelle</p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', boxSizing: 'border-box' }}>
          {isEmpty ? (
            <div style={{
              textAlign: 'center', padding: '48px 24px', backgroundColor: C.white,
              border: `1px dashed ${C.grb}`, borderRadius: 16,
            }}>
              <div style={{
                width: 64, height: 64, margin: '0 auto 16px', borderRadius: 18,
                backgroundColor: C.gl, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Users2 size={28} color={C.gd} strokeWidth={1.8} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.dark, marginBottom: 6 }}>
                Aucune association pour l'instant
              </div>
              <div style={{ fontSize: 13.5, color: C.text2, maxWidth: 320, margin: '0 auto', lineHeight: 1.5 }}>
                Créez votre première association pour commencer à gérer vos tontines, membres et cotisations.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {associations.map((assoc) => (
                <AssocCard key={assoc.id} assoc={assoc} onSelect={onSelect} />
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: '16px 20px calc(env(safe-area-inset-bottom) + 20px)', flexShrink: 0, backgroundColor: C.bg, borderTop: `1px solid ${C.grb}` }}>
          <button
            onClick={onNew}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '15px', backgroundColor: C.g, color: C.white, border: 'none', borderRadius: 14,
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(29,158,117,0.28)',
            }}
          >
            <Plus size={19} />
            Nouvelle association
          </button>
        </div>

      </div>
    </div>
  )
}
