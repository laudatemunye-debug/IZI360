import { useState } from 'react'
const C={g:'#1D9E75',gd:'#085041',gl:'#E1F5EE',amb:'#BA7517',ambl:'#FAEEDA',ambd:'#633806',rd:'#E24B4A',rdl:'#FCEBEB',bl:'#378ADD',bll:'#E6F1FB',bld:'#0C447C',gr:'#F1EFE8',grb:'#D3D1C7',bg:'#F4F4F0',white:'#FFFFFF',text:'#1A1A1A',text2:'#5F5E5A',pur:'#EEEDFE',purd:'#3C3489'}
const fmt=(n,sym)=>`${Number(n||0).toLocaleString('fr-FR')} ${sym}`

const Toggle=({on,onChange})=>(
  <div onClick={e=>{e.stopPropagation();onChange()}} style={{width:42,height:24,borderRadius:12,backgroundColor:on?C.g:C.grb,cursor:'pointer',position:'relative',flexShrink:0}}>
    <div style={{position:'absolute',top:3,left:on?21:3,width:18,height:18,borderRadius:9,backgroundColor:'#fff',transition:'left .15s'}}/>
  </div>
)

const Section=({icon,title,sub,bgIcon,children})=>{
  const [open,setOpen]=useState(false)
  return(
    <div style={{margin:'0 14px 8px',backgroundColor:C.white,border:`1px solid ${C.grb}`,borderRadius:12,overflow:'hidden'}}>
      <button onClick={()=>setOpen(v=>!v)} style={{width:'100%',display:'flex',alignItems:'center',gap:12,padding:'14px',background:'none',border:'none',cursor:'pointer',textAlign:'left'}}>
        <div style={{width:36,height:36,borderRadius:10,backgroundColor:bgIcon||C.gl,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{icon}</div>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:600,color:C.text}}>{title}</div>
          {sub&&<div style={{fontSize:11,color:C.text2,marginTop:1}}>{sub}</div>}
        </div>
        <span style={{color:C.text2,fontSize:18,transition:'transform .2s',transform:open?'rotate(90deg)':'rotate(0deg)',display:'inline-block'}}>›</span>
      </button>
      {open&&<div style={{borderTop:`1px solid ${C.gr}`}}>{children}</div>}
    </div>
  )
}

const Item=({icon,bg,label,sub,right,onClick})=>(
  <div onClick={onClick} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 14px',borderBottom:`0.5px solid ${C.gr}`,cursor:onClick?'pointer':'default'}}>
    <div style={{display:'flex',alignItems:'center',gap:10}}>
      <div style={{width:30,height:30,borderRadius:8,backgroundColor:bg||C.gl,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,flexShrink:0}}>{icon}</div>
      <div><div style={{fontSize:13,fontWeight:500,color:C.text}}>{label}</div>{sub&&<div style={{fontSize:11,color:C.text2,marginTop:1}}>{sub}</div>}</div>
    </div>
    {right}
  </div>
)

const PAD=[['1','2','3'],['4','5','6'],['7','8','9'],['','0','⌫']]

const PinModal=({title,sub,onConfirm,onCancel,error,onClearError})=>{
  const [pin,setPin]=useState('')
  const press=(k)=>{ if(error) onClearError(); if(pin.length<4) setPin(p=>p+k) }
  const del=()=>{ if(error) onClearError(); setPin(p=>p.slice(0,-1)) }
  const confirm=()=>{ if(pin.length<4) return; onConfirm(pin); setPin('') }
  return(
    <div style={{position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.55)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
      <div style={{width:'100%',maxWidth:480,backgroundColor:C.gd,borderRadius:'20px 20px 0 0',padding:'24px 20px 36px'}}>
        <div style={{textAlign:'center',marginBottom:20}}>
          <div style={{color:'#fff',fontSize:16,fontWeight:700}}>{title}</div>
          {sub&&<div style={{color:'rgba(255,255,255,0.7)',fontSize:12,marginTop:4}}>{sub}</div>}
        </div>
        <div style={{display:'flex',justifyContent:'center',gap:12,marginBottom:8}}>
          {[0,1,2,3].map(i=>(
            <div key={i} style={{width:14,height:14,borderRadius:7,backgroundColor:error?C.rd:pin.length>i?'#fff':'rgba(255,255,255,0.25)',transition:'background .2s'}}/>
          ))}
        </div>
        {error&&<div style={{textAlign:'center',color:'#fff',fontSize:12,marginBottom:4,backgroundColor:'rgba(226,75,74,0.4)',borderRadius:6,padding:'6px 10px'}}>{error}</div>}
        <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:16}}>
          {PAD.map((row,ri)=>(
            <div key={ri} style={{display:'flex',justifyContent:'center',gap:16}}>
              {row.map((k,ki)=>(
                <button key={ki} onClick={()=>k==='⌫'?del():k&&press(k)}
                  disabled={!k&&k!=='0'}
                  style={{width:68,height:68,borderRadius:34,backgroundColor:k?'rgba(255,255,255,0.15)':'transparent',border:'none',color:'#fff',fontSize:22,fontWeight:600,cursor:k?'pointer':'default',opacity:k||k==='0'?1:0,fontFamily:'inherit'}}>
                  {k}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div style={{display:'flex',gap:10,marginTop:20}}>
          <button onClick={onCancel} style={{flex:1,padding:12,backgroundColor:'rgba(255,255,255,0.1)',color:'#fff',border:'none',borderRadius:10,fontSize:14,cursor:'pointer',fontFamily:'inherit'}}>Annuler</button>
          <button onClick={confirm} disabled={pin.length<4}
            style={{flex:1,padding:12,backgroundColor:pin.length===4?C.g:'rgba(255,255,255,0.1)',color:'#fff',border:'none',borderRadius:10,fontSize:14,fontWeight:700,cursor:pin.length===4?'pointer':'default',fontFamily:'inherit'}}>
            Confirmer
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ParametresScreen({config,members,payments,payouts,onUpdateConfig,onReset}){
  const sym=config.currency?.symbol||config.currency?.code||'F'
  const [autoSave,setAutoSave]=useState(true)
  const [pinFlow,setPinFlow]=useState(null)
  const [newPin,setNewPin]=useState('')
  const [pinError,setPinError]=useState('')
  const [pinSuccess,setPinSuccess]=useState(false)
  const hasPin=!!config.pin
  const totalPay=payments.length
  const totalPayout=payouts.length
  const dataSize=JSON.stringify({config,members,payments,payouts}).length

  const startPinChange=()=>{ setPinError(''); setPinSuccess(false); setPinFlow(hasPin?'verify':'new') }
  const cancelPin=()=>{ setPinFlow(null); setNewPin(''); setPinError('') }

  const handlePinStep=(pin)=>{
    if(pinFlow==='verify'){
      if(pin!==config.pin){ setPinError('PIN incorrect'); return }
      setPinError(''); setPinFlow('new')
    } else if(pinFlow==='new'){
      setNewPin(pin); setPinFlow('confirm')
    } else if(pinFlow==='confirm'){
      if(pin!==newPin){ setPinError('Les PIN ne correspondent pas'); return }
      onUpdateConfig({...config,pin})
      setPinFlow(null); setNewPin(''); setPinError('')
      setPinSuccess(true); setTimeout(()=>setPinSuccess(false),3000)
    }
  }

  const disablePin=()=>{ setPinError(''); setPinFlow('disable') }
  const handleDisableVerify=(pin)=>{
    if(pin!==config.pin){ setPinError('PIN incorrect'); return }
    const cfg={...config}; delete cfg.pin
    onUpdateConfig(cfg)
    setPinFlow(null); setPinError('')
    setPinSuccess(true); setTimeout(()=>setPinSuccess(false),3000)
  }

  const exportData=()=>{
    const blob=new Blob([JSON.stringify({config,members,payments,payouts},null,2)],{type:'application/json'})
    const url=URL.createObjectURL(blob)
    const a=document.createElement('a');a.href=url;a.download='izinjangi_backup.njg';a.click()
    URL.revokeObjectURL(url)
  }
  const exportCSV=()=>{
    const rows=[['Date','Membre','Cycle','Montant','Mode','Type','Reçu'],...payments.map(p=>[p.date,p.memberName,p.cycle,p.amount,p.mode,p.type,p.receiptNum||''])]
    const csv=rows.map(r=>r.join(',')).join('\n')
    const blob=new Blob([csv],{type:'text/csv'})
    const url=URL.createObjectURL(blob)
    const a=document.createElement('a');a.href=url;a.download='izinjangi_paiements.csv';a.click()
    URL.revokeObjectURL(url)
  }
  const resetApp=()=>{
    if(window.confirm('⚠ Réinitialiser toute l\'application ? Toutes les données seront perdues.'))
      if(window.confirm('Dernière confirmation — cette action est IRRÉVERSIBLE.'))
        onReset()
  }

  const pinModalProps=()=>{
    if(pinFlow==='verify') return {title:'Entrez votre PIN actuel',sub:'Vérification avant modification'}
    if(pinFlow==='new')    return {title:'Nouveau PIN',sub:'Choisissez 4 chiffres'}
    if(pinFlow==='confirm')return {title:'Confirmer le nouveau PIN',sub:'Ressaisissez les 4 chiffres'}
    if(pinFlow==='disable')return {title:'Entrez votre PIN actuel',sub:'Pour désactiver la protection'}
    return {}
  }

  return(
    <div style={{flex:1,overflowY:'auto',paddingBottom:80}}>
      {pinFlow&&(
        <PinModal
          {...pinModalProps()}
          error={pinError}
          onClearError={()=>setPinError('')}
          onConfirm={pinFlow==='disable'?handleDisableVerify:handlePinStep}
          onCancel={cancelPin}
        />
      )}

      <div style={{backgroundColor:C.g,padding:'14px 16px 16px'}}>
        <div style={{color:'#fff',fontSize:17,fontWeight:700}}>Paramètres</div>
        <div style={{color:'rgba(255,255,255,0.8)',fontSize:11,marginTop:2}}>{config.tontineName}</div>
      </div>

      <div style={{backgroundColor:C.gl,border:`1px solid #5DCAA5`,borderRadius:10,margin:'12px 14px',padding:14,display:'flex',alignItems:'center',gap:10}}>
        <div style={{width:44,height:44,borderRadius:22,backgroundColor:C.g,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>🤝</div>
        <div>
          <div style={{fontSize:14,fontWeight:700,color:C.gd}}>{config.tontineName}</div>
          <div style={{fontSize:11,color:C.g2,marginTop:2}}>{members.length} membres · {fmt(config.cotisation,sym)} / {config.frequency||'mois'}</div>
          <div style={{fontSize:11,color:C.text2,marginTop:1}}>Cycle {config.currentCycle||1} en cours</div>
        </div>
      </div>

      <Section icon="⚙️" bgIcon={C.gl} title="Tontine" sub="Nom, cotisation, cycle">
        <Item icon="✏️" bg={C.gl} label="Nom de la tontine" sub={config.tontineName} right={<span style={{color:C.text2,fontSize:13}}>›</span>} onClick={()=>alert('Modification — bientôt disponible')}/>
        <Item icon="💰" bg={C.ambl} label="Montant cotisation" sub={`${fmt(config.cotisation,sym)} / ${config.frequency||'mois'}`} right={<span style={{color:C.text2,fontSize:13}}>›</span>} onClick={()=>alert('Modification — bientôt disponible')}/>
        <Item icon="🔄" bg={C.bll} label="Avancer au cycle suivant" sub={`Actuellement : Cycle ${config.currentCycle||1}`} right={<span style={{color:C.text2,fontSize:13}}>›</span>}
          onClick={()=>{if(window.confirm(`Passer au cycle ${(config.currentCycle||1)+1} ?`)){onUpdateConfig({...config,currentCycle:(config.currentCycle||1)+1});alert('Cycle avancé !')}}}/>
      </Section>

      <Section icon="🖨️" bgIcon={C.pur} title="Impression" sub="Imprimante Bluetooth, format reçu">
        <Item icon="🖨️" bg={C.pur} label="Imprimante Bluetooth" sub="Xprinter XP-58 · Connectée" right={<span style={{backgroundColor:C.gl,color:C.gd,fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:10}}>OK</span>}/>
        <Item icon="📄" bg={C.gl} label="Format de reçu" sub="58mm thermique" right={<span style={{color:C.text2,fontSize:13}}>›</span>}/>
      </Section>

      <Section icon="🔒" bgIcon={C.rdl} title="Sécurité" sub={hasPin?'PIN activé':'PIN désactivé'}>
        {pinSuccess&&(
          <div style={{margin:'10px 14px 0',backgroundColor:C.gl,border:`1px solid #5DCAA5`,borderRadius:8,padding:'8px 12px',fontSize:12,color:C.gd,fontWeight:600}}>
            ✓ {hasPin?'PIN mis à jour avec succès':'PIN désactivé'}
          </div>
        )}
        <div style={{padding:'12px 14px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:30,height:30,borderRadius:8,backgroundColor:C.rdl,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,flexShrink:0}}>🔑</div>
              <div>
                <div style={{fontSize:13,fontWeight:500,color:C.text}}>Code PIN</div>
                <div style={{fontSize:11,color:C.text2,marginTop:1}}>{hasPin?'Protection active — 4 chiffres':'Aucun PIN défini'}</div>
              </div>
            </div>
            <Toggle on={hasPin} onChange={hasPin?disablePin:startPinChange}/>
          </div>
          <button onClick={startPinChange}
            style={{width:'100%',padding:'9px 12px',backgroundColor:hasPin?C.pur:C.gl,color:hasPin?C.purd:C.gd,border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
            🔐 {hasPin?'Modifier le PIN':'Définir un PIN'}
          </button>
        </div>
      </Section>

      <Section icon="📦" bgIcon={C.bll} title="Données" sub="Export, statistiques, backup">
        <Item icon="📊" bg={C.ambl} label="Statistiques" sub={`${totalPay} paiements · ${totalPayout} versements · ${(dataSize/1024).toFixed(1)} Ko`}/>
        <Item icon="💾" bg={C.gl} label="Sauvegarde automatique" sub="Locale · Chaque action" right={<Toggle on={autoSave} onChange={()=>setAutoSave(v=>!v)}/>}/>
        <Item icon="📥" bg={C.gl} label="Exporter sauvegarde (.njg)" sub="Fichier complet de récupération" right={<span style={{color:C.text2,fontSize:13}}>›</span>} onClick={exportData}/>
        <Item icon="📋" bg={C.bll} label="Exporter CSV" sub="Tous les paiements" right={<span style={{color:C.text2,fontSize:13}}>›</span>} onClick={exportCSV}/>
      </Section>

      <Section icon="⚠️" bgIcon={C.rdl} title="Zone de danger" sub="Réinitialisation de l'application">
        <Item icon="🗑️" bg={C.rdl} label="Réinitialiser l'application" sub="Supprime toutes les données locales" right={<span style={{color:C.rd,fontSize:13}}>›</span>} onClick={resetApp}/>
      </Section>

      <div style={{textAlign:'center',padding:16,fontSize:11,color:C.text2}}>
        <div style={{fontWeight:700,color:C.g}}>IZI NJANGI v1.0</div>
        <div style={{marginTop:3,letterSpacing:0.4}}>Powered by IZIsoft</div>
      </div>
    </div>
  )
}
