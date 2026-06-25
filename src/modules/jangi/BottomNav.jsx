const items = [
  { key:'home',      label:'Accueil',    icon:'🏠' },
  { key:'membres',   label:'Membres',    icon:'👥' },
  { key:'paiements', label:'Paiements',  icon:'💳' },
  { key:'rapport',   label:'Rapports',   icon:'📊' },
  { key:'settings',  label:'Paramètres', icon:'⚙️' },
]

export default function BottomNav({ current, onNav, darkMode=true }) {
  const bg     = darkMode ? '#1A1D27' : '#FFFFFF'
  const border = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const active = '#1D9E75'
  const inactive= darkMode ? '#6B7280' : '#9CA3AF'

  return (
    <div style={{ position:'fixed', bottom:0, left:0, right:0, backgroundColor:bg, borderTop:`1px solid ${border}`, display:'flex', maxWidth:480, margin:'0 auto', zIndex:100 }}>
      {items.map(({ key, label, icon }) => {
        const isActive = current === key
        return (
          <button key={key} onClick={() => onNav(key)}
            style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'8px 4px 10px', background:'none', border:'none', cursor:'pointer', position:'relative' }}>
            <span style={{ fontSize:20, opacity: isActive ? 1 : 0.45 }}>{icon}</span>
            <span style={{ fontSize:10, fontWeight:600, color: isActive ? active : inactive, marginTop:2 }}>{label}</span>
            {isActive && <div style={{ width:4, height:4, borderRadius:2, backgroundColor:active, marginTop:2 }} />}
          </button>
        )
      })}
    </div>
  )
}
