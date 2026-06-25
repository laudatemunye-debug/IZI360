import { useState } from 'react'

const C = {
  g:'#1D9E75', gd:'#085041', gl:'#E1F5EE',
  amb:'#BA7517', ambl:'#FAEEDA', ambd:'#633806',
  rd:'#E24B4A', rdl:'#FCEBEB',
  bl:'#378ADD', bll:'#E6F1FB', bld:'#0C447C',
  gr:'#F1EFE8', grb:'#D3D1C7',
  bg:'#F4F4F0', white:'#FFFFFF', text:'#1A1A1A', text2:'#5F5E5A',
  pur:'#EEEDFE', purd:'#3C3489',
}

const AV_COLORS = [
  { bg:C.gl, fg:C.gd }, { bg:C.bll, fg:C.bld },
  { bg:C.ambl, fg:C.ambd }, { bg:C.rdl, fg:'#791F1F' }, { bg:C.pur, fg:C.purd },
]

const initials = (name='') => name.trim().split(' ').slice(0,2).map(w=>w[0]?.toUpperCase()||'').join('')

const Avatar = ({ name='', index=0, size=40 }) => {
  const col = AV_COLORS[index % AV_COLORS.length]
  return (
    <div style={{ width:size, height:size, borderRadius:size/2, backgroundColor:col.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      <span style={{ color:col.fg, fontSize:size*0.32, fontWeight:700 }}>{initials(name)}</span>
    </div>
  )
}

const ProgBar = ({ pct, color=C.g }) => (
  <div style={{ height:5, backgroundColor:C.gr, borderRadius:3, overflow:'hidden' }}>
    <div style={{ height:'100%', width:`${Math.min(pct,100)}%`, backgroundColor:color, borderRadius:3 }} />
  </div>
)

const Badge = ({ label, type='ok' }) => {
  const colors = { ok:{bg:C.gl,fg:C.gd}, warn:{bg:C.ambl,fg:C.ambd}, bad:{bg:C.rdl,fg:'#791F1F'} }
  const col = colors[type]||colors.ok
  return <span style={{ backgroundColor:col.bg, color:col.fg, fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:20 }}>{label}</span>
}

export default function MembresScreen({ members, payments, config, onAddMember, onSelectMember }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('tous')
  const cycle = config.currentCycle || 1
  const paidIds = new Set(payments.filter(p=>p.cycle===cycle&&p.type==='cotisation').map(p=>p.memberId))

  const getStatus = (m) => {
    if (m.status==='sorti') return 'sorti'
    if (paidIds.has(m.id)) return 'actif'
    return 'impaye'
  }

  const filtered = members
    .filter(m => m.name.toLowerCase().includes(search.toLowerCase()))
    .filter(m => filter==='tous' || getStatus(m)===filter)

  const counts = {
    tous: members.length,
    actif: members.filter(m=>paidIds.has(m.id)).length,
    impaye: members.filter(m=>!paidIds.has(m.id)&&m.status!=='sorti').length,
    sorti: members.filter(m=>m.status==='sorti').length,
  }

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <div style={{ backgroundColor:C.g, padding:'14px 16px 16px' }}>
        <div style={{ color:'#fff', fontSize:17, fontWeight:700 }}>Membres</div>
        <div style={{ color:'rgba(255,255,255,0.8)', fontSize:11, marginTop:2 }}>{members.length} membre{members.length>1?'s':''} enregistrés</div>
      </div>

      <div style={{ padding:'12px 14px 8px', display:'flex', gap:8 }}>
        <input
          style={{ flex:1, backgroundColor:C.white, border:`1px solid ${C.grb}`, borderRadius:8, padding:'8px 12px', fontSize:13, color:C.text, outline:'none' }}
          placeholder="Rechercher un membre..." value={search} onChange={e=>setSearch(e.target.value)} />
        <button onClick={onAddMember}
          style={{ backgroundColor:C.g, color:'#fff', border:'none', borderRadius:8, padding:'8px 14px', fontSize:13, fontWeight:700, cursor:'pointer' }}>
          + Ajouter
        </button>
      </div>

      <div style={{ display:'flex', gap:6, padding:'0 14px 10px', flexWrap:'wrap' }}>
        {[
          { key:'tous',   label:`Tous (${counts.tous})`      },
          { key:'actif',  label:`Actifs (${counts.actif})`   },
          { key:'impaye', label:`Impayés (${counts.impaye})` },
          { key:'sorti',  label:`Anciens (${counts.sorti})`   },
        ].map(ch => (
          <button key={ch.key} onClick={() => setFilter(ch.key)}
            style={{ padding:'5px 12px', borderRadius:20, border:`1px solid ${filter===ch.key?C.g:C.grb}`, backgroundColor:filter===ch.key?C.gl:C.white, color:filter===ch.key?C.gd:C.text2, fontSize:12, cursor:'pointer', fontWeight:500 }}>
            {ch.label}
          </button>
        ))}
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'0 14px', paddingBottom:80, display:'flex', flexDirection:'column', gap:8 }}>
        {filtered.length === 0 && (
          <div style={{ backgroundColor:C.white, borderRadius:12, border:`1px solid ${C.grb}`, padding:16, textAlign:'center', color:C.text2 }}>Aucun membre trouvé</div>
        )}
        {filtered.map((item, index) => {
          const st = getStatus(item)
          const memberPay = payments.filter(p=>p.memberId===item.id&&p.type==='cotisation')
          const pct = cycle > 0 ? (memberPay.length/cycle)*100 : 0
          return (
            <button key={item.id} onClick={() => onSelectMember(item)}
              style={{ backgroundColor:C.white, borderRadius:12, border:`1px solid ${C.grb}`, padding:12, cursor:'pointer', textAlign:'left', width:'100%' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <Avatar name={item.name} index={index} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:500, color:C.text }}>{item.name}</div>
                  <div style={{ fontSize:11, color:C.text2, marginTop:2 }}>Tour #{item.order} · {item.phone||'Sans tél.'}</div>
                </div>
                <Badge label={st==='actif'?'Payé':st==='impaye'?'En retard':'Sorti'} type={st==='actif'?'ok':st==='impaye'?'warn':'bad'} />
              </div>
              <div style={{ marginTop:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                  <span style={{ fontSize:10, color:C.text2 }}>Cotisations</span>
                  <span style={{ fontSize:10, color:C.text2 }}>{memberPay.length}/{cycle}</span>
                </div>
                <ProgBar pct={pct} color={st==='actif'?C.g:st==='impaye'?C.amb:C.rd} />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
