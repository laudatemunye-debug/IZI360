import { useState } from 'react'
const C={g:'#1D9E75',gd:'#085041',gl:'#E1F5EE',g2:'#0F6E56',amb:'#BA7517',ambl:'#FAEEDA',ambd:'#633806',rd:'#E24B4A',rdl:'#FCEBEB',bl:'#378ADD',bll:'#E6F1FB',bld:'#0C447C',gr:'#F1EFE8',grb:'#D3D1C7',bg:'#F4F4F0',white:'#FFFFFF',text:'#1A1A1A',text2:'#5F5E5A',pur:'#EEEDFE',purd:'#3C3489'}
const fmt=(n,sym)=>`${Number(n||0).toLocaleString('fr-FR')} ${sym}`
const fmtDate=(iso)=>iso?new Date(iso).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'}):''
const ProgBar=({pct,color=C.g})=>(<div style={{height:5,backgroundColor:C.gr,borderRadius:3,overflow:'hidden'}}><div style={{height:'100%',width:`${Math.min(pct,100)}%`,backgroundColor:color,borderRadius:3}}/></div>)
const Badge=({label,type='ok'})=>{const cols={ok:{bg:C.gl,fg:C.gd},warn:{bg:C.ambl,fg:C.ambd},bad:{bg:C.rdl,fg:'#791F1F'},info:{bg:C.bll,fg:C.bld}};const col=cols[type]||cols.ok;return<span style={{backgroundColor:col.bg,color:col.fg,fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:20}}>{label}</span>}
export default function RapportScreen({config,members,payments,payouts,cycles,onPayout,onBack}){
  const sym=config.currency?.symbol||config.currency?.code||'F'
  const nbMembers=config.nbMembers||members.length||1
  const currentCycle=config.currentCycle||1
  const cotisation=config.cotisation||0
  const [versView,setVersView]=useState(false)
  const [versForm,setVersForm]=useState({beneficiary:'',frais:'0',date:new Date().toISOString().slice(0,10),mode:'Espèces',note:''})
  const totalCollected=payments.filter(p=>p.type==='cotisation').reduce((s,p)=>s+(p.amount||0),0)
  const totalPaid=payouts.reduce((s,p)=>s+(p.amount||0),0)
  const cycleCollected=payments.filter(p=>p.type==='cotisation'&&p.cycle===currentCycle).reduce((s,p)=>s+(p.amount||0),0)
  const paidCount=new Set(payments.filter(p=>p.cycle===currentCycle&&p.type==='cotisation').map(p=>p.memberId)).size
  const unpaidCount=members.filter(m=>m.status!=='sorti').length-paidCount
  const closedCount=payouts.length
  const brut=cycleCollected
  const fraisPct=parseFloat(versForm.frais)||0
  const fraisAmt=Math.round(brut*fraisPct/100)
  const net=brut-fraisAmt
  const cycleRows=Array.from({length:nbMembers},(_,i)=>{
    const n=i+1
    const pays=payments.filter(p=>p.cycle===n&&p.type==='cotisation')
    const total=pays.reduce((s,p)=>s+(p.amount||0),0)
    const payout=payouts.find(p=>p.cycle===n)
    const pct=members.filter(m=>m.status!=='sorti').length>0?(pays.length/members.filter(m=>m.status!=='sorti').length)*100:0
    const status=payout?'cloture':n===currentCycle?'encours':n<currentCycle?'partiel':'futur'
    const benef=payout?members.find(m=>m.id===payout.memberId):members.find(m=>String(m.order)===String(n))
    return{n,pays,total,payout,pct,status,benef}
  })
  const submitVersement=()=>{
    if(!versForm.beneficiary)return alert('Sélectionnez un bénéficiaire.')
    const m=members.find(x=>x.id===versForm.beneficiary)
    const p={id:'pyt_'+Date.now(),memberId:versForm.beneficiary,memberName:m?.name||'',cycle:currentCycle,amount:net,brut,frais:fraisAmt,fraisPct,mode:versForm.mode,date:versForm.date,note:versForm.note,type:'versement'}
    onPayout(p);setVersView(false)
    alert(`✓ Versement de ${fmt(net,sym)} enregistré pour ${m?.name}`)
  }
  if(versView){
    const inp={backgroundColor:C.white,border:`1px solid ${C.grb}`,borderRadius:8,padding:'10px 12px',fontSize:14,width:'100%',color:C.text,outline:'none',fontFamily:'inherit',boxSizing:'border-box'}
    const lbl={fontSize:12,color:C.text2,fontWeight:600,marginBottom:4,display:'block'}
    return(<div style={{flex:1,overflowY:'auto',paddingBottom:80}}>
      <div style={{backgroundColor:C.gd,padding:'14px 16px 16px',display:'flex',alignItems:'center',gap:12}}>
        <button onClick={()=>setVersView(false)} style={{background:'none',border:'none',color:'#fff',fontSize:22,cursor:'pointer'}}>‹</button>
        <div><div style={{color:'#fff',fontSize:17,fontWeight:700}}>Verser la cagnotte</div><div style={{color:'rgba(255,255,255,0.8)',fontSize:11,marginTop:1}}>Cycle {currentCycle}</div></div>
      </div>
      <div style={{padding:'16px 14px',display:'flex',flexDirection:'column',gap:12}}>
        <div style={{backgroundColor:C.gl,borderRadius:10,padding:14}}>
          <div style={{fontSize:11,color:C.gd,marginBottom:4}}>Cagnotte cycle {currentCycle}</div>
          <div style={{fontSize:22,fontWeight:800,color:C.g}}>{fmt(brut,sym)}</div>
          <div style={{fontSize:11,color:C.text2,marginTop:2}}>{paidCount} membres · {members.filter(m=>m.status!=='sorti').length} actifs</div>
        </div>
        <div><label style={lbl}>Bénéficiaire *</label>
          <select style={{...inp,cursor:'pointer'}} value={versForm.beneficiary} onChange={e=>setVersForm(p=>({...p,beneficiary:e.target.value}))}>
            <option value="">— Sélectionner —</option>
            {members.filter(m=>m.status!=='sorti').sort((a,b)=>(a.order||0)-(b.order||0)).map(m=><option key={m.id} value={m.id}>{m.name} (Tour #{m.order})</option>)}
          </select>
        </div>
        <div><label style={lbl}>Frais de gestion (%)</label>
          <input style={inp} type="number" inputMode="decimal" placeholder="0" value={versForm.frais} onChange={e=>setVersForm(p=>({...p,frais:e.target.value}))}/>
        </div>
        <div><label style={lbl}>Mode</label>
          <select style={{...inp,cursor:'pointer'}} value={versForm.mode} onChange={e=>setVersForm(p=>({...p,mode:e.target.value}))}>
            {['Espèces','Mobile Money','Orange Money','Wave','MTN MoMo','Virement'].map(m=><option key={m}>{m}</option>)}
          </select>
        </div>
        <div><label style={lbl}>Date</label><input style={inp} type="date" value={versForm.date} onChange={e=>setVersForm(p=>({...p,date:e.target.value}))}/></div>
        <div><label style={lbl}>Note</label><input style={inp} type="text" placeholder="Optionnel..." value={versForm.note} onChange={e=>setVersForm(p=>({...p,note:e.target.value}))}/></div>
        <div style={{backgroundColor:C.white,border:`1px solid ${C.grb}`,borderRadius:10,overflow:'hidden'}}>
          {[[`Brut collecté`,fmt(brut,sym)],[`Frais (${fraisPct}%)`,`- ${fmt(fraisAmt,sym)}`]].map(([k,v])=>(
            <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'8px 12px',borderBottom:`0.5px solid ${C.gr}`}}>
              <span style={{fontSize:12,color:C.text2}}>{k}</span><span style={{fontSize:12,fontWeight:500}}>{v}</span>
            </div>
          ))}
          <div style={{display:'flex',justifyContent:'space-between',padding:'10px 12px',backgroundColor:C.gl}}>
            <span style={{fontSize:13,fontWeight:700,color:C.gd}}>Net à verser</span>
            <span style={{fontSize:16,fontWeight:800,color:C.g}}>{fmt(net,sym)}</span>
          </div>
        </div>
        <button onClick={submitVersement} style={{backgroundColor:C.gd,color:'#fff',border:'none',borderRadius:12,padding:14,fontSize:15,fontWeight:700,cursor:'pointer'}}>Confirmer le versement ✓</button>
      </div>
    </div>)
  }
  return(<div style={{flex:1,overflowY:'auto',paddingBottom:80}}>
    <div style={{backgroundColor:C.gd,padding:'14px 16px 16px'}}>
      <div style={{color:'#fff',fontSize:17,fontWeight:700}}>Rapports</div>
      <div style={{color:'rgba(255,255,255,0.8)',fontSize:11,marginTop:2}}>{config.tontineName} · Cycle {currentCycle}/{nbMembers}</div>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,padding:'12px 14px 8px'}}>
      {[{l:'Total collecté',v:totalCollected.toLocaleString('fr-FR'),sub:`${sym} global`,c:C.g},{l:'Impayés cycle',v:unpaidCount,sub:`membres`,c:C.amb},{l:'Cycles clôturés',v:closedCount,sub:`sur ${nbMembers}`,c:C.bl},{l:'Total versé',v:totalPaid.toLocaleString('fr-FR'),sub:`${sym}`,c:C.gd}].map(({l,v,sub,c})=>(
        <div key={l} style={{backgroundColor:C.white,border:`1px solid ${C.grb}`,borderRadius:8,padding:'10px 12px'}}>
          <div style={{fontSize:11,color:C.text2,marginBottom:3}}>{l}</div>
          <div style={{fontSize:18,fontWeight:800,color:c}}>{v}</div>
          <div style={{fontSize:10,color:C.text2,marginTop:2}}>{sub}</div>
        </div>
      ))}
    </div>
    <div style={{margin:'0 14px 8px',backgroundColor:C.white,border:`1px solid ${C.grb}`,borderRadius:10,overflow:'hidden'}}>
      <div style={{padding:'10px 12px',borderBottom:`1px solid ${C.gr}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{fontSize:11,fontWeight:700,color:C.text2,textTransform:'uppercase',letterSpacing:0.5}}>Cycle en cours — {currentCycle}</span>
        <Badge label="En cours" type="warn"/>
      </div>
      <div style={{padding:'10px 12px'}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{fontSize:11,color:C.text2}}>Progression</span><span style={{fontSize:11,color:C.text2}}>{paidCount}/{members.filter(m=>m.status!=='sorti').length}</span></div>
        <ProgBar pct={members.filter(m=>m.status!=='sorti').length>0?(paidCount/members.filter(m=>m.status!=='sorti').length)*100:0}/>
        <div style={{marginTop:8,fontSize:12,color:C.text2}}>Collecté : <strong style={{color:C.g}}>{fmt(cycleCollected,sym)}</strong></div>
      </div>
    </div>
    <button onClick={()=>setVersView(true)} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,backgroundColor:C.gd,color:'#fff',border:'none',borderRadius:10,padding:'12px 16px',margin:'0 14px 12px',width:'calc(100% - 28px)',fontSize:14,fontWeight:700,cursor:'pointer'}}>
      📤 Verser la cagnotte — Cycle {currentCycle}
    </button>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'4px 14px 6px'}}>
      <span style={{fontSize:11,fontWeight:700,color:C.text2,textTransform:'uppercase',letterSpacing:0.5}}>Progression des cycles</span>
    </div>
    <div style={{padding:'0 14px',display:'flex',flexDirection:'column',gap:8,marginBottom:8}}>
      {cycleRows.map(({n,total,payout,pct,status,benef})=>(
        <div key={n} style={{backgroundColor:C.white,border:`1px solid ${C.grb}`,borderRadius:10,padding:12}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
            <div style={{fontSize:13,fontWeight:600,color:C.text}}>Cycle {n}{benef?` — ${benef.name}`:''}</div>
            <Badge label={status==='cloture'?'Clôturé':status==='encours'?'En cours':status==='partiel'?'Partiel':'À venir'} type={status==='cloture'?'ok':status==='encours'?'warn':status==='partiel'?'info':'bad'}/>
          </div>
          <ProgBar pct={status==='cloture'?100:status==='futur'?0:pct}/>
          <div style={{fontSize:11,color:C.text2,marginTop:4}}>
            {status==='cloture'&&payout?`Versé ${fmtDate(payout.date)} · ${fmt(payout.amount,sym)}`:status==='futur'?`Prévu · ${fmt(cotisation*(config.nbMembers||members.length||1),sym)}`:`${fmt(total,sym)} collectés`}
          </div>
        </div>
      ))}
    </div>
    <div style={{display:'flex',gap:8,padding:'0 14px 8px'}}>
      <button onClick={()=>alert('Rapport imprimé sur Xprinter XP-58 !')} style={{flex:1,backgroundColor:C.g,color:'#fff',border:'none',borderRadius:8,padding:10,fontSize:12,fontWeight:700,cursor:'pointer'}}>🖨️ Imprimer</button>
      <button onClick={()=>alert('Rapport partagé via WhatsApp !')} style={{flex:1,backgroundColor:'#25D366',color:'#fff',border:'none',borderRadius:8,padding:10,fontSize:12,fontWeight:700,cursor:'pointer'}}>💬 Partager</button>
    </div>
    <div style={{textAlign:'center',padding:12,fontSize:10,color:C.text2}}>Powered by IZIsoft</div>
  </div>)
}
