import { Home, Users, Wallet, BarChart3, Settings } from 'lucide-react'

const C = { g:'#1D9E75', text2:'#5F5E5A', grb:'#D3D1C7', white:'#FFFFFF' }

const items = [
  { key:'home',      label:'Accueil',    Icon:Home },
  { key:'membres',   label:'Membres',    Icon:Users },
  { key:'paiements', label:'Paiements',  Icon:Wallet },
  { key:'rapport',   label:'Rapports',   Icon:BarChart3 },
  { key:'settings',  label:'Paramètres', Icon:Settings },
]

export default function BottomNav({ current, onNav }) {
  return (
    <div style={{ position:'fixed', bottom:0, left:0, right:0, backgroundColor:C.white, borderTop:`1px solid ${C.grb}`, display:'flex', maxWidth:480, margin:'0 auto', zIndex:100, paddingBottom:'env(safe-area-inset-bottom)' }}>
      {items.map(({ key, label, Icon }) => {
        const active = current === key
        return (
          <button key={key} onClick={() => onNav(key)}
            style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'8px 4px 10px', background:'none', border:'none', cursor:'pointer', position:'relative' }}>
            <Icon size={21} strokeWidth={active ? 2.3 : 1.8} color={active ? C.g : C.text2} style={{ opacity: active ? 1 : 0.7 }} />
            <span style={{ fontSize:10, fontWeight:600, color: active ? C.g : C.text2, marginTop:3 }}>{label}</span>
            {active && <div style={{ width:4, height:4, borderRadius:2, backgroundColor:C.g, marginTop:2 }} />}
          </button>
        )
      })}
    </div>
  )
}

