const C = { g:'#1D9E75', text2:'#5F5E5A', grb:'#D3D1C7', white:'#FFFFFF' }

const items = [
  { key:'home',      label:'Accueil',    icon:'🏠' },
  { key:'membres',   label:'Membres',    icon:'👥' },
  { key:'paiements', label:'Paiements',  icon:'💳' },
  { key:'rapport',   label:'Rapports',   icon:'📊' },
  { key:'settings',  label:'Paramètres', icon:'⚙️' },
]

export default function BottomNav({ current, onNav }) {
  return (
    <div style={{ position:'fixed', bottom:0, left:0, right:0, backgroundColor:C.white, borderTop:`1px solid ${C.grb}`, display:'flex', maxWidth:480, margin:'0 auto', zIndex:100 }}>
      {items.map(({ key, label, icon }) => {
        const active = current === key
        return (
          <button key={key} onClick={() => onNav(key)}
            style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'8px 4px 10px', background:'none', border:'none', cursor:'pointer', position:'relative' }}>
            <span style={{ fontSize:20, opacity: active ? 1 : 0.45 }}>{icon}</span>
            <span style={{ fontSize:10, fontWeight:600, color: active ? C.g : C.text2, marginTop:2 }}>{label}</span>
            {active && <div style={{ width:4, height:4, borderRadius:2, backgroundColor:C.g, marginTop:2 }} />}
          </button>
        )
      })}
    </div>
  )
}
