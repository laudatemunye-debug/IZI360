import { useState, useEffect } from 'react'

const C = {
  g:'#1D9E75', gd:'#085041', gl:'#E1F5EE', g2:'#0F6E56',
  amb:'#BA7517', ambl:'#FAEEDA', ambd:'#633806',
  rd:'#E24B4A', rdl:'#FCEBEB',
  bl:'#378ADD', bll:'#E6F1FB', bld:'#0C447C',
  gr:'#F1EFE8', grt:'#5F5E5A', grb:'#D3D1C7',
  bg:'#F4F4F0', white:'#FFFFFF', text:'#1A1A1A', text2:'#5F5E5A',
  pur:'#EEEDFE', purd:'#3C3489',
}

const fmt = (n, sym) => `${Number(n||0).toLocaleString('fr-FR')} ${sym}`
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' }) : ''
const initials = (name='') => name.trim().split(' ').slice(0,2).map(w=>w[0]?.toUpperCase()||'').join('')

const AV_COLORS = [
  { bg:C.gl, fg:C.gd }, { bg:C.bll, fg:C.bld },
  { bg:C.ambl, fg:C.ambd }, { bg:C.rdl, fg:'#791F1F' }, { bg:C.pur, fg:C.purd },
]

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
  const colors = { ok:{bg:C.gl,fg:C.gd}, warn:{bg:C.ambl,fg:C.ambd}, bad:{bg:C.rdl,fg:'#791F1F'}, info:{bg:C.bll,fg:C.bld} }
  const col = colors[type]||colors.ok
  return <span style={{ backgroundColor:col.bg, color:col.fg, fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:20 }}>{label}</span>
}

export default function HomeScreen({ config, members, payments, payouts, cycles, nav }) {
  const sym = config.currency?.symbol || config.currency?.code || 'F'
  const currentCycle = config.currentCycle || 1
  const cyclePayments = payments.filter(p => p.cycle===currentCycle && p.type==='cotisation')
  const totalCollected = cyclePayments.reduce((s,p) => s+(p.amount||0), 0)
  const paidMemberIds = [...new Set(cyclePayments.map(p=>p.memberId))]
  const activeMembers = members.filter(m=>m.status!=='sorti')
  const unpaidMembers = activeMembers.filter(m=>!paidMemberIds.includes(m.id))
  const totalUnpaid = unpaidMembers.length * (config.cotisation||0)
  const closedCycles = cycles.filter(c=>c.status==='cloture').length
  const recentPay = [...payments,...payouts].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,4)
  const pct = activeMembers.length > 0 ? (paidMemberIds.length/activeMembers.length)*100 : 0

  return (
    <div style={{ flex:1, overflowY:'auto', paddingBottom:70 }}>
      {/* Header */}
      <div style={{ backgroundColor:C.g, padding:'14px 16px 20px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:9 }}>
            <div style={{ width:34, height:34, backgroundColor:'#fff', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ color:C.g, fontSize:18, fontWeight:900 }}>✓</span>
            </div>
            <div>
              <div style={{ color:'#fff', fontSize:17, fontWeight:700, letterSpacing:0.3 }}>IZI NJANGI</div>
              <div style={{ color:'rgba(255,255,255,0.75)', fontSize:10, letterSpacing:0.5 }}>GESTION DE TONTINE</div>
            </div>
          </div>
          <button onClick={() => nav('impayes')} style={{ width:32, height:32, borderRadius:16, backgroundColor:'rgba(255,255,255,0.18)', border:'none', cursor:'pointer', position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontSize:16 }}>🔔</span>
            {unpaidMembers.length > 0 && (
              <span style={{ position:'absolute', top:-2, right:-2, backgroundColor:C.rd, color:'#fff', fontSize:9, fontWeight:700, borderRadius:8, minWidth:16, height:16, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 3px' }}>{unpaidMembers.length}</span>
            )}
          </button>
        </div>
        <div style={{ backgroundColor:'rgba(255,255,255,0.13)', borderRadius:12, padding:12 }}>
          <div style={{ color:'rgba(255,255,255,0.8)', fontSize:11, marginBottom:3 }}>Cagnotte du cycle en cours</div>
          <div style={{ color:'#fff', fontSize:26, fontWeight:700, letterSpacing:-1 }}>{fmt(totalCollected, sym)}</div>
          <div style={{ display:'flex', gap:8, marginTop:8 }}>
            {[
              { l:'Membres actifs', v:`${paidMemberIds.length}/${activeMembers.length}` },
              { l:'Cycle actuel',   v:`Cycle ${currentCycle}/${config.nbMembers||members.length||'?'}` },
              { l:'Cotisation',     v:fmt(config.cotisation, sym) },
            ].map(({ l, v }) => (
              <div key={l} style={{ flex:1, backgroundColor:'rgba(255,255,255,0.1)', borderRadius:8, padding:6 }}>
                <div style={{ color:'rgba(255,255,255,0.75)', fontSize:9 }}>{l}</div>
                <div style={{ color:'#fff', fontSize:11, fontWeight:600, marginTop:1 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div style={{ display:'flex', gap:8, padding:12 }}>
        {[
          { icon:'💳', label:'Enregistrer\npaiement', color:C.gl,   screen:'paiement'  },
          { icon:'📤', label:'Verser\ncagnotte',      color:C.pur,  screen:'versement' },
          { icon:'👥', label:'Membres',               color:C.bll,  screen:'membres'   },
          { icon:'📊', label:'Rapports',              color:C.ambl, screen:'rapport'   },
        ].map(q => (
          <button key={q.screen} onClick={() => nav(q.screen)}
            style={{ flex:1, backgroundColor:C.white, border:`1px solid ${C.grb}`, borderRadius:12, padding:10, cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
            <div style={{ width:36, height:36, borderRadius:18, backgroundColor:q.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{q.icon}</div>
            <span style={{ fontSize:10, color:C.text2, fontWeight:500, textAlign:'center', lineHeight:'13px', whiteSpace:'pre-line' }}>{q.label}</span>
          </button>
        ))}
      </div>

      {/* Alerte impayés */}
      {unpaidMembers.length > 0 && (
        <button onClick={() => nav('impayes')} style={{ display:'flex', alignItems:'center', gap:10, backgroundColor:C.ambl, border:`1px solid #FAC775`, borderRadius:8, marginHorizontal:14, margin:'0 14px 8px', padding:10, cursor:'pointer', width:'calc(100% - 28px)', textAlign:'left' }}>
          <div style={{ width:26, height:26, borderRadius:13, backgroundColor:C.amb, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <span style={{ color:'#fff', fontSize:12, fontWeight:700 }}>!</span>
          </div>
          <span style={{ fontSize:12, color:C.ambd, fontWeight:500 }}>
            {unpaidMembers.length} membre{unpaidMembers.length>1?'s':''} impayé{unpaidMembers.length>1?'s':''} — Cycle {currentCycle}
            <span style={{ color:C.g }}> · Voir liste</span>
          </span>
        </button>
      )}

      {/* Stats */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:8, padding:'8px 14px' }}>
        {[
          { l:'Total collecté', v:totalCollected.toLocaleString('fr-FR'), sub:`${sym} ce cycle`, c:C.g },
          { l:'Impayés',        v:totalUnpaid.toLocaleString('fr-FR'),    sub:`${unpaidMembers.length} membres`, c:C.amb },
          { l:'Cycles clôturés',v:closedCycles,                           sub:`sur ${config.nbMembers||members.length||'?'}`, c:C.bl },
          { l:'Membres actifs', v:activeMembers.length,                   sub:`enregistrés`, c:C.g },
        ].map(({ l, v, sub, c }) => (
          <div key={l} style={{ flex:'1 1 45%', backgroundColor:C.white, borderRadius:8, border:`1px solid ${C.grb}`, padding:10 }}>
            <div style={{ fontSize:11, color:C.text2, marginBottom:3 }}>{l}</div>
            <div style={{ fontSize:18, fontWeight:700, color:c }}>{v}</div>
            <div style={{ fontSize:10, color:C.text2, marginTop:2 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Cycle en cours */}
      <div style={{ padding:'0 14px 8px' }}>
        <div style={{ backgroundColor:C.white, borderRadius:12, border:`1px solid ${C.grb}`, padding:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:C.text }}>{config.tontineName}</div>
              <div style={{ fontSize:11, color:C.text2, marginTop:2 }}>{config.frequency} · {fmt(config.cotisation, sym)}</div>
            </div>
            <Badge label="Actif" type="ok" />
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
            <span style={{ fontSize:11, color:C.text2 }}>Progression cycle {currentCycle}</span>
            <span style={{ fontSize:11, color:C.text2 }}>{paidMemberIds.length}/{activeMembers.length}</span>
          </div>
          <ProgBar pct={pct} />
          <div style={{ display:'flex', gap:6, marginTop:10 }}>
            {[
              { v:paidMemberIds.length, l:'Ont payé', c:C.gd },
              { v:unpaidMembers.length, l:'Impayés', c:C.amb },
              { v:`${(totalCollected/1000).toFixed(0)}K`, l:'Collecté', c:C.gd },
            ].map(({ v, l, c }) => (
              <div key={l} style={{ flex:1, backgroundColor:C.gr, borderRadius:8, padding:8, textAlign:'center' }}>
                <div style={{ fontSize:15, fontWeight:700, color:c }}>{v}</div>
                <div style={{ fontSize:10, color:C.text2, marginTop:1 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Derniers paiements */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px' }}>
        <span style={{ fontSize:11, fontWeight:700, color:C.text2, textTransform:'uppercase', letterSpacing:0.5 }}>Derniers paiements</span>
        <button onClick={() => nav('paiements')} style={{ background:'none', border:'none', color:C.g, fontSize:12, fontWeight:500, cursor:'pointer' }}>Tout voir</button>
      </div>
      <div style={{ padding:'0 14px', display:'flex', flexDirection:'column', gap:8 }}>
        {recentPay.length === 0 && (
          <div style={{ backgroundColor:C.white, borderRadius:12, border:`1px solid ${C.grb}`, padding:16, textAlign:'center', color:C.text2, fontSize:13 }}>Aucun paiement enregistré</div>
        )}
        {recentPay.map(p => (
          <div key={p.id} style={{ backgroundColor:C.white, borderRadius:12, border:`1px solid ${C.grb}`, padding:12, display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:8, height:8, borderRadius:4, backgroundColor:p.type==='versement'?C.rd:C.g, flexShrink:0 }} />
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:500, color:C.text }}>{p.memberName}{p.type==='versement'?' — Versement':` · Cycle ${p.cycle}`}</div>
              <div style={{ fontSize:11, color:C.text2, marginTop:1 }}>{fmtDate(p.date)} · {p.mode}</div>
            </div>
            <span style={{ fontSize:14, fontWeight:700, color:p.type==='versement'?C.rd:C.g }}>
              {p.type==='versement'?'-':'+'}{fmt(p.amount,sym)}
            </span>
          </div>
        ))}
      </div>

      <div style={{ textAlign:'center', padding:16, fontSize:10, color:C.text2 }}>Powered by IZIsoft</div>
    </div>
  )
}
