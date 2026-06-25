// ============================================================
// IZI NJANGI — AllScreens.jsx (version corrigée & cohérente)
// ============================================================
import { useState, useRef } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const C = {
 g:'#1D9E75',gd:'#1D9E75',gl:'rgba(29,158,117,0.15)',g2:'#2ED4A0',
 amb:'#F59E0B',ambl:'rgba(245,158,11,0.15)',ambd:'#D97706',
 rd:'#E24B4A',rdl:'rgba(226,75,74,0.15)',
 bl:'#60A5FA',bll:'rgba(96,165,250,0.15)',bld:'#3B82F6',
 gr:'rgba(255,255,255,0.04)',grb:'rgba(255,255,255,0.08)',
 bg:'#0F1117',white:'#1A1D27',text:'#F0F0F0',text2:'#9CA3AF',
 pur:'rgba(139,92,246,0.15)',purd:'#A78BFA',
}

const fmt = (n,sym) => `${Number(n||0).toLocaleString('fr-FR')} ${sym}`
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'}) : ''
const initials = (name='') => name.trim().split(' ').slice(0,2).map(w=>w[0]?.toUpperCase()||'').join('')
const genId = () => Date.now().toString(36)+Math.random().toString(36).slice(2,6)
const genRec = () => 'REC-'+Date.now().toString().slice(-6)
const uid = () => Math.random().toString(36).slice(2,10).toUpperCase()
const nowISO = () => new Date().toISOString()

// TYPES_PAY — défini globalement (corrige le crash de Recu)
const TYPES_PAY = [
 {key:'cotisation', label:'Cotisation'},
 {key:'penalite', label:'Pénalité de retard'},
 {key:'frais', label:'Frais de gestion'},
 {key:'versement', label:'Versement cagnotte'},
]

const MODES = ['Espèces','Mobile Money','Virement','Orange Money','Wave','MTN MoMo','Autre']

const CURRENCIES = [
 {code:'FCFA',symbol:'FCFA',name:'Franc CFA BCEAO'},
 {code:'XAF', symbol:'XAF', name:'Franc CFA BEAC' },
 {code:'USD', symbol:'$', name:'Dollar américain'},
 {code:'EUR', symbol:'€', name:'Euro' },
 {code:'GBP', symbol:'£', name:'Livre sterling' },
 {code:'NGN', symbol:'₦', name:'Naira nigérian' },
 {code:'GHS', symbol:'₵', name:'Cedi ghanéen' },
 {code:'ZAR', symbol:'R', name:'Rand sud-africain'},
 {code:'CDF', symbol:'FC', name:'Franc congolais' },
 {code:'MAD', symbol:'DH', name:'Dirham marocain' },
]

const AV_COLORS = [
 {bg:C.gl, fg:C.gd },{bg:C.bll, fg:C.bld },{bg:C.ambl,fg:C.ambd},
 {bg:C.rdl, fg:'#791F1F'},{bg:C.pur, fg:C.purd},
]

const PAD_KEYS = [['1','2','3'],['4','5','6'],['7','8','9'],['','0','⌫']]

// Utilitaire PDF centralisé (impression + WhatsApp)
async function elementToPDF(el) {
 const canvas = await html2canvas(el,{scale:2,backgroundColor:'#ffffff',useCORS:true})
 const imgData = canvas.toDataURL('image/png')
 const pdf = new jsPDF({orientation:'portrait',unit:'mm',format:'a6'})
 const w = pdf.internal.pageSize.getWidth()
 const h = (canvas.height*w)/canvas.width
 pdf.addImage(imgData,'PNG',0,0,w,Math.min(h,pdf.internal.pageSize.getHeight()))
 return pdf
}

async function printPDFElement(el) {
 try {
 const pdf = await elementToPDF(el)
 pdf.autoPrint()
 window.open(pdf.output('bloburl'),'_blank')
 } catch(e){ console.error('PDF error',e); window.print() }
}

async function shareViaPDF(el,receiptInfo,tontineName) {
 const msg = `Reçu N°${receiptInfo.receiptNum}\nTontine: ${tontineName}\nMembre: ${receiptInfo.memberName}\nMontant: ${receiptInfo.amount}\nDate: ${fmtDate(receiptInfo.date)}`
 try {
 const pdf = await elementToPDF(el)
 const blob = pdf.output('blob')
 const file = new File([blob],`recu-${receiptInfo.receiptNum}.pdf`,{type:'application/pdf'})
 if(navigator.share && navigator.canShare && navigator.canShare({files:[file]})){
 await navigator.share({files:[file],title:'Reçu IZI NJANGI',text:msg}); return
 }
 const url = URL.createObjectURL(blob)
 const a = document.createElement('a'); a.href=url; a.download=`recu-${receiptInfo.receiptNum}.pdf`; a.click()
 setTimeout(()=>{ URL.revokeObjectURL(url); window.open('https://wa.me/?text='+encodeURIComponent(msg),'_blank') },800)
 } catch(e){ window.open('https://wa.me/?text='+encodeURIComponent(msg),'_blank') }
}

// COMPOSANTS PARTAGÉS
const Avatar = ({name='',index=0,size=40}) => {
 const col = AV_COLORS[index%AV_COLORS.length]
 return <div style={{width:size,height:size,borderRadius:size/2,backgroundColor:col.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><span style={{color:col.fg,fontSize:size*0.32,fontWeight:700}}>{initials(name)}</span></div>
}
const ProgBar = ({pct,color=C.g}) => <div style={{height:5,backgroundColor:C.gr,borderRadius:3,overflow:'hidden'}}><div style={{height:'100%',width:`${Math.min(pct,100)}%`,backgroundColor:color,borderRadius:3}}/></div>
const Badge = ({label,type='ok'}) => {
 const cols={ok:{bg:C.gl,fg:C.gd},warn:{bg:C.ambl,fg:C.ambd},bad:{bg:C.rdl,fg:'#791F1F'},info:{bg:C.bll,fg:C.bld}}
 const col=cols[type]||cols.ok
 return <span style={{backgroundColor:col.bg,color:col.fg,fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:20}}>{label}</span>
}
const Toggle = ({on,onChange}) => (
 <div onClick={e=>{e.stopPropagation();onChange()}} style={{width:42,height:24,borderRadius:12,backgroundColor:on?C.g:C.grb,cursor:'pointer',position:'relative',flexShrink:0}}>
 <div style={{position:'absolute',top:3,left:on?21:3,width:18,height:18,borderRadius:9,backgroundColor:'#fff',transition:'left .15s'}}/>
 </div>
)
const PinModal = ({title,sub,onConfirm,onCancel,error,onClearError}) => {
 const [pin,setPin] = useState('')
 const press = k => { if(error) onClearError(); if(pin.length<4) setPin(p=>p+k) }
 const del = () => { if(error) onClearError(); setPin(p=>p.slice(0,-1)) }
 const confirm = () => { if(pin.length<4) return; onConfirm(pin); setPin('') }
 return (
 <div style={{position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.55)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
 <div style={{width:'100%',maxWidth:480,backgroundColor:C.gd,borderRadius:'20px 20px 0 0',padding:'24px 20px 36px'}}>
 <div style={{textAlign:'center',marginBottom:20}}>
 <div style={{color:'#fff',fontSize:16,fontWeight:700}}>{title}</div>
 {sub&&<div style={{color:'rgba(255,255,255,0.7)',fontSize:12,marginTop:4}}>{sub}</div>}
 </div>
 <div style={{display:'flex',justifyContent:'center',gap:12,marginBottom:8}}>
 {[0,1,2,3].map(i=><div key={i} style={{width:14,height:14,borderRadius:7,backgroundColor:error?C.rd:pin.length>i?'#fff':'rgba(255,255,255,0.25)',transition:'background .2s'}}/>)}
 </div>
 {error&&<div style={{textAlign:'center',color:'#fff',fontSize:12,marginBottom:4,backgroundColor:'rgba(226,75,74,0.4)',borderRadius:6,padding:'6px 10px'}}>{error}</div>}
 <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:16}}>
 {PAD_KEYS.map((row,ri)=>(
 <div key={ri} style={{display:'flex',justifyContent:'center',gap:16}}>
 {row.map((k,ki)=>(
 <button key={ki} onClick={()=>k==='⌫'?del():k&&press(k)} disabled={!k&&k!=='0'}
 style={{width:68,height:68,borderRadius:34,backgroundColor:k?'rgba(255,255,255,0.15)':'transparent',border:'none',color:'#fff',fontSize:22,fontWeight:600,cursor:k?'pointer':'default',opacity:k||k==='0'?1:0,fontFamily:'inherit'}}>{k}</button>
 ))}
 </div>
 ))}
 </div>
 <div style={{display:'flex',gap:10,marginTop:20}}>
 <button onClick={onCancel} style={{flex:1,padding:12,backgroundColor:'rgba(255,255,255,0.1)',color:'#fff',border:'none',borderRadius:10,fontSize:14,cursor:'pointer',fontFamily:'inherit'}}>Annuler</button>
 <button onClick={confirm} disabled={pin.length<4} style={{flex:1,padding:12,backgroundColor:pin.length===4?C.g:'rgba(255,255,255,0.1)',color:'#fff',border:'none',borderRadius:10,fontSize:14,fontWeight:700,cursor:pin.length===4?'pointer':'default',fontFamily:'inherit'}}>Confirmer</button>
 </div>
 </div>
 </div>
 )
}

// MODALE TABLEAU DES TOURS
function CyclesModal({config,members,payments,payouts,onClose}) {
 const sym=config.currency?.symbol||config.currency?.code||'F'
 const nbSlots=config.nbSlots||config.nbMembers||members.length||1
 const slots=Array.from({length:nbSlots},(_,i)=>{
 const order=i+1
 const member=members.find(m=>m.slots?m.slots.some(s=>s.order===order):m.order===order)
 const payout=payouts.find(p=>p.slotOrder===order||p.cycle===order)
 const currentCycle=config.currentCycle||1
 const status=payout?'cloture':order===currentCycle?'encours':order<currentCycle?'passe':'futur'
 return {order,member,payout,status}
 })
 return (
 <div style={{position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.55)',zIndex:150,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
 <div style={{width:'100%',maxWidth:480,backgroundColor:C.bg,borderRadius:'20px 20px 0 0',maxHeight:'80vh',display:'flex',flexDirection:'column'}}>
 <div style={{backgroundColor:C.g,padding:'16px 16px 14px',borderRadius:'20px 20px 0 0',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
 <div>
 <div style={{color:'#fff',fontSize:16,fontWeight:700}}> Tableau des tours</div>
 <div style={{color:'rgba(255,255,255,0.8)',fontSize:11,marginTop:2}}>{nbSlots} tours · {config.tontineName}</div>
 </div>
 <button onClick={onClose} style={{background:'none',border:'none',color:'#fff',fontSize:22,cursor:'pointer',lineHeight:1}}></button>
 </div>
 <div style={{overflowY:'auto',padding:'12px 14px',display:'flex',flexDirection:'column',gap:8,paddingBottom:30}}>
 {slots.map(({order,member,payout,status})=>{
 const statusLabel=status==='cloture'?' Versé':status==='encours'?'⏳ En cours':status==='passe'?'Passé':'À venir'
 const statusType=status==='cloture'?'ok':status==='encours'?'warn':status==='passe'?'bad':'info'
 return (
 <div key={order} style={{backgroundColor:C.white,borderRadius:12,border:`1px solid ${status==='encours'?C.g:C.grb}`,padding:12,borderLeftWidth:status==='encours'?3:1,borderLeftColor:status==='encours'?C.g:C.grb}}>
 <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
 <div style={{display:'flex',alignItems:'center',gap:10}}>
 <div style={{width:32,height:32,borderRadius:16,backgroundColor:status==='cloture'?C.gl:status==='encours'?C.g:C.gr,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
 <span style={{color:status==='encours'?'#fff':status==='cloture'?C.gd:C.text2,fontSize:13,fontWeight:700}}>#{order}</span>
 </div>
 <div>
 <div style={{fontSize:13,fontWeight:600,color:C.text}}>{member?member.name:'— Non attribué —'}</div>
 {member?.slots?.length>1&&<div style={{fontSize:10,color:C.text2,marginTop:1}}>Place {member.slots.find(s=>s.order===order)?.slotNum||1}/{member.slots.length}</div>}
 {payout&&<div style={{fontSize:11,color:C.g2,marginTop:1}}>Versé le {fmtDate(payout.date)} · {fmt(payout.amount,sym)}</div>}
 </div>
 </div>
 <Badge label={statusLabel} type={statusType}/>
 </div>
 </div>
 )
 })}
 </div>
 </div>
 </div>
 )
}

// SETUP SCREEN
const SetupHeader = ({title,sub,step,onBack}) => (
 <div style={{backgroundColor:C.g,padding:'calc(env(safe-area-inset-top) + 14px) 16px 16px'}}>
 <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
 {step>0&&<button onClick={onBack} style={{background:'none',border:'none',color:'#fff',fontSize:26,cursor:'pointer',lineHeight:1,padding:'0 8px 0 0'}}>‹</button>}
 <div>
 <h2 style={{color:'#fff',fontSize:17,fontWeight:700,margin:0}}>{title}</h2>
 {sub&&<p style={{color:'rgba(255,255,255,0.8)',fontSize:11,margin:'2px 0 0'}}>{sub}</p>}
 </div>
 </div>
 </div>
)


// -- TONTINE SELECT SCREEN
export function TontineSelectScreen({tontines, onSelect, onNew}) {
 const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('fr-FR', {day:'2-digit',month:'short',year:'numeric'}) : ''
 return (
 <div style={{height:'100vh',backgroundColor:C.g,display:'flex',flexDirection:'column'}}> 
 <div style={{padding:'calc(env(safe-area-inset-top) + 24px) 24px 20px',textAlign:'center'}}>
 <div style={{width:60,height:60,backgroundColor:'rgba(255,255,255,0.2)',borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px'}}>
 <span style={{color:'#fff',fontSize:30,fontWeight:900}}>N</span>
 </div>
 <h1 style={{color:'#fff',fontSize:26,fontWeight:800,letterSpacing:0.5,margin:0}}>IZI NJANGI</h1>
 <p style={{color:'rgba(255,255,255,0.75)',fontSize:13,marginTop:6}}>Sélectionnez votre tontine</p>
 </div>
 <div style={{flex:1,backgroundColor:C.bg,borderRadius:'24px 24px 0 0',padding:'20px 16px',overflowY:'auto'}}>
 <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:16}}>
 {tontines.map((t,i)=>(
 <button key={t.id} onClick={()=>onSelect(t.id)}
 style={{width:'100%',padding:'14px 16px',backgroundColor:C.white,border:`1px solid ${C.grb}`,borderRadius:14,cursor:'pointer',textAlign:'left',display:'flex',alignItems:'center',gap:12}}>
 <div style={{width:44,height:44,borderRadius:12,backgroundColor:[C.gl,C.bll,C.ambl,C.pur,C.rdl][i%5],display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
 <span style={{fontSize:18,fontWeight:800,color:[C.gd,C.bld,C.ambd,C.purd,'#791F1F'][i%5]}}>{t.tontineName?.[0]?.toUpperCase()||'T'}</span>
 </div>
 <div style={{flex:1}}>
 <div style={{fontSize:15,fontWeight:700,color:C.text}}>{t.tontineName}</div>
 <div style={{fontSize:11,color:C.text2,marginTop:2}}>Utilisateur : {t.username} · Créée le {fmtDate(t.createdAt)}</div>
 </div>
 <span style={{color:C.g,fontSize:20,fontWeight:300}}>›</span>
 </button>
 ))}
 </div>
 <button onClick={onNew} style={{width:'100%',padding:14,backgroundColor:C.g,color:'#fff',border:'none',borderRadius:14,fontSize:15,fontWeight:700,cursor:'pointer'}}>
 + Créer une nouvelle tontine
 </button>
 <p style={{textAlign:'center',fontSize:11,color:C.text2,marginTop:16}}>Powered by IZIsoft</p>
 </div>
 </div>
 )
}


export function SetupScreen({onDone, existingUsernames=[], onBack=null}) {
 const [step,setStep]=useState(0)
 const [form,setForm]=useState({tontineName:'',adminName:'',phone:'',cotisation:'',frequency:'Mensuel',currency:null,nbSlots:'',username:'',pin:'',pinConfirm:''})
 const [currSearch,setCurrSearch]=useState('')
 const [pinError,setPinError]=useState('')
 const filteredCurr=CURRENCIES.filter(c=>c.name.toLowerCase().includes(currSearch.toLowerCase())||c.code.toLowerCase().includes(currSearch.toLowerCase()))
 const back=()=>setStep(s=>s-1)
 const next=()=>{
 if(step===1){
 if(!form.tontineName.trim()) return alert('Nom de la tontine obligatoire.')
 if(!form.adminName.trim()) return alert('Votre nom est obligatoire.')
 if(!form.cotisation||isNaN(Number(form.cotisation))) return alert('Montant de cotisation invalide.')
 }
 if(step===2&&!form.currency) return alert('Veuillez choisir une devise.')
 if(step===3){
 if(!form.username.trim()) return alert("Nom d'utilisateur obligatoire.")
 if(form.pin.length!==4) return alert('Le PIN doit contenir 4 chiffres.')
 if(form.pin!==form.pinConfirm){setPinError('Les PINs ne correspondent pas.');return}
 handleCreate();return
 }
 setStep(s=>s+1)
 }
 const handleCreate=()=>{
 const config={tontineName:form.tontineName,adminName:form.adminName,phone:form.phone,cotisation:Number(form.cotisation),frequency:form.frequency,currency:form.currency,username:form.username.trim().toLowerCase(),pin:form.pin,createdAt:nowISO(),currentCycle:1,nbSlots:0,nbMembers:0,penaltyRate:0}
 localStorage.setItem('njangi_config', JSON.stringify(config))
 localStorage.setItem('njangi_members', JSON.stringify([]))
 localStorage.setItem('njangi_payments',JSON.stringify([]))
 localStorage.setItem('njangi_payouts', JSON.stringify([]))
 localStorage.setItem('njangi_cycles', JSON.stringify([{id:uid(),number:1,status:'en_cours',startedAt:nowISO()}]))
 onDone(config)
 }
 const inp={backgroundColor:C.white,border:`1px solid ${C.grb}`,borderRadius:8,padding:'10px 12px',fontSize:14,width:'100%',color:C.text,outline:'none',marginTop:4,boxSizing:'border-box',maxWidth:'100%'}
 const lbl={fontSize:12,color:C.text2,fontWeight:600}
 const btn={backgroundColor:C.g,color:'#fff',border:'none',borderRadius:12,padding:13,fontSize:15,fontWeight:700,cursor:'pointer',marginTop:8,width:'100%'}
 if(step===0) return (
 <div style={{height:'100vh',backgroundColor:C.g,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24}}>
 <div style={{width:80,height:80,backgroundColor:'rgba(255,255,255,0.2)',borderRadius:20,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:20}}><span style={{color:'#fff',fontSize:40,fontWeight:900}}></span></div>
 <h1 style={{color:'#fff',fontSize:32,fontWeight:800,letterSpacing:1,margin:0}}>IZI NJANGI</h1>
 <p style={{color:'rgba(255,255,255,0.8)',fontSize:16,textAlign:'center',marginTop:8,lineHeight:'24px'}}>Gestion de tontine<br/>simple et fiable</p>
 <button onClick={()=>setStep(1)} style={{backgroundColor:'#fff',color:C.g,border:'none',borderRadius:14,padding:'14px 28px',marginTop:40,fontSize:16,fontWeight:800,cursor:'pointer'}}>Créer ma tontine →</button>
 <p style={{color:'rgba(255,255,255,0.6)',fontSize:12,textAlign:'center',marginTop:20}}>100% hors ligne · Données locales</p>
 {onBack&&<button onClick={onBack} style={{background:'none',border:'1px solid rgba(255,255,255,0.4)',borderRadius:10,padding:'10px 24px',color:'rgba(255,255,255,0.8)',fontSize:13,cursor:'pointer',marginTop:12}}>Retour à mes tontines</button>}
 </div>
 )
 if(step===1) return (
 <div style={{height:'100vh',display:'flex',flexDirection:'column',backgroundColor:C.bg}}>
 <SetupHeader title="Nouvelle tontine" sub="Étape 1 / 3 — Informations" step={step} onBack={back}/>
 <div style={{flex:1,overflowY:'auto',padding:16,display:'flex',flexDirection:'column',gap:12}}>
 {[
 {label:'Nom de la tontine *', key:'tontineName',placeholder:'Ex: Tontine Espoir 2026'},
 {label:'Votre nom (administrateur) *', key:'adminName', placeholder:'Ex: Mamadou Koné'},
 {label:'Votre téléphone', key:'phone', placeholder:'+243 8XX XXX XXX'},
 {label:'Montant de cotisation *', key:'cotisation', placeholder:'Ex: 65000',type:'number'},
 ].map(f=>(
 <div key={f.key}>
 <label style={lbl}>{f.label}</label>
 <input style={inp} type={f.type||'text'} placeholder={f.placeholder} value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))}/>
 </div>
 ))}
 <div style={{backgroundColor:C.gl,border:'1px solid #5DCAA5',borderRadius:8,padding:'10px 12px'}}>
 <div style={{fontSize:12,color:C.gd,fontWeight:600}}> Nombre de tours</div>
 <div style={{fontSize:12,color:C.g2,marginTop:4}}>Défini automatiquement selon les places attribuées aux membres.</div>
 </div>
 <div>
 <label style={lbl}>Fréquence des cotisations</label>
 <div style={{display:'flex',gap:8,marginTop:6,flexWrap:'wrap'}}>
 {['Mensuel','Bi-mensuel','Hebdomadaire','Journalier'].map(fr=>(
 <button key={fr} onClick={()=>setForm(p=>({...p,frequency:fr}))}
 style={{padding:'6px 12px',borderRadius:20,border:`1px solid ${form.frequency===fr?C.g:C.grb}`,backgroundColor:form.frequency===fr?C.gl:C.white,color:form.frequency===fr?C.gd:C.text2,fontSize:12,cursor:'pointer',fontWeight:500}}>{fr}</button>
 ))}
 </div>
 </div>
 <button onClick={next} style={btn}>Suivant — Choisir la devise →</button>
 </div>
 </div>
 )
 if(step===2) return (
 <div style={{height:'100vh',display:'flex',flexDirection:'column',backgroundColor:C.bg}}>
 <SetupHeader title="Devise" sub="Étape 2 / 3 — Sélectionnez votre devise" step={step} onBack={back}/>
 <div style={{padding:'12px 16px 8px'}}>
 <input style={inp} placeholder="Rechercher..." value={currSearch} onChange={e=>setCurrSearch(e.target.value)}/>
 </div>
 <div style={{flex:1,overflowY:'auto',padding:'0 16px',display:'flex',flexDirection:'column',gap:6}}>
 {filteredCurr.map(item=>(
 <div key={item.code} onClick={()=>setForm(p=>({...p,currency:item}))}
 style={{display:'flex',justifyContent:'space-between',alignItems:'center',backgroundColor:form.currency?.code===item.code?C.gl:C.white,border:`1px solid ${form.currency?.code===item.code?C.g:C.grb}`,borderRadius:10,padding:12,cursor:'pointer'}}>
 <div>
 <div style={{fontSize:14,fontWeight:700,color:C.text}}>{item.code} — {item.symbol}</div>
 <div style={{fontSize:12,color:C.text2,marginTop:2}}>{item.name}</div>
 </div>
 {form.currency?.code===item.code&&<span style={{color:C.g,fontSize:20}}></span>}
 </div>
 ))}
 </div>
 <div style={{padding:16}}>
 <button onClick={next} style={{...btn,marginTop:0}}>Suivant — Identifiants →</button>
 </div>
 </div>
 )
 if(step===3) return (
 <div style={{height:'100vh',display:'flex',flexDirection:'column',backgroundColor:C.bg}}>
 <SetupHeader title="Identifiants de connexion" sub="Étape 3 / 3 — Sécurisez l'accès" step={step} onBack={back}/>
 <div style={{flex:1,padding:16,display:'flex',flexDirection:'column',gap:12}}>
 <p style={{fontSize:14,color:C.text2,margin:0}}>Ces identifiants protègent l'accès à votre tontine</p>
 {[
 {label:"Nom d'utilisateur *", key:'username', type:'text', placeholder:'Ex: admin', pw:false},
 {label:'Code PIN (4 chiffres) *',key:'pin', type:'password',placeholder:'••••', pw:true },
 {label:'Confirmer le PIN *', key:'pinConfirm', type:'password',placeholder:'••••', pw:true },
 ].map(f=>(
 <div key={f.key}>
 <label style={lbl}>{f.label}</label>
 <input style={inp} type={f.type} inputMode={f.pw?'numeric':undefined} maxLength={f.pw?4:undefined} placeholder={f.placeholder}
 value={form[f.key]} onChange={e=>{setForm(p=>({...p,[f.key]:e.target.value}));setPinError('')}}/>
 </div>
 ))}
 {pinError&&<p style={{color:C.rd,fontSize:12,margin:0}}>{pinError}</p>}
 <div style={{backgroundColor:C.ambl,border:`1px solid #FAC775`,borderRadius:8,padding:10}}>
 <p style={{fontSize:12,color:C.ambd,margin:0}}> Notez bien vos identifiants. En cas d'oubli, vous devrez réinitialiser l'app.</p>
 </div>
 <button onClick={next} style={btn}>Créer ma tontine </button>
 </div>
 </div>
 )
 return null
}

// LOCK SCREEN
export function LockScreen({config,onUnlock}) {
 const [username,setUsername]=useState('')
 const [pin,setPin]=useState('')
 const [err,setErr]=useState('')
 const press=d=>{
 const np=pin+d; setPin(np); setErr('')
 if(np.length===4){
 if(username.trim().toLowerCase()!==config.username.trim().toLowerCase()){setErr("Nom d'utilisateur incorrect");setPin('');return}
 if(np!==config.pin){setErr('PIN incorrect');setPin('')}
 else onUnlock()
 }
 }
 const del=()=>setPin(p=>p.slice(0,-1))
 return (
 <div style={{height:'100vh',backgroundColor:C.g,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24}}>
 <div style={{fontSize:56,marginBottom:12}}></div>
 <h1 style={{color:'#fff',fontSize:24,fontWeight:800,letterSpacing:1,margin:0}}>IZI NJANGI</h1>
 <p style={{color:'rgba(255,255,255,0.75)',fontSize:13,marginBottom:24}}>{config.tontineName}</p>
 <input type="text" placeholder="Nom d'utilisateur" value={username} onChange={e=>{setUsername(e.target.value);setErr('')}}
 style={{width:'100%',maxWidth:280,backgroundColor:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.3)',borderRadius:8,padding:'10px 14px',fontSize:14,color:'#fff',outline:'none',marginBottom:20,textAlign:'center'}}/>
 <div style={{display:'flex',gap:14,marginBottom:8}}>
 {[0,1,2,3].map(i=><div key={i} style={{width:16,height:16,borderRadius:8,border:'2px solid rgba(255,255,255,0.6)',backgroundColor:pin.length>i?'#fff':'transparent'}}/>)}
 </div>
 {err?<p style={{color:'#FFB4B4',fontSize:13,marginBottom:8}}>{err}</p>:<div style={{height:21}}/>}
 <div style={{display:'flex',flexDirection:'column',gap:12,marginTop:8}}>
 {PAD_KEYS.map((row,ri)=>(
 <div key={ri} style={{display:'flex',gap:16}}>
 {row.map((k,ki)=>(
 <button key={ki} onClick={()=>k==='⌫'?del():k&&press(k)} disabled={!k}
 style={{width:72,height:72,borderRadius:36,backgroundColor:k?'rgba(255,255,255,0.15)':'transparent',border:'none',color:'#fff',fontSize:24,fontWeight:600,cursor:k?'pointer':'default',opacity:k?1:0}}>{k}</button>
 ))}
 </div>
 ))}
 </div>
 </div>
 )
}

// HOME SCREEN
export function HomeScreen({config,members,payments,payouts,cycles,nav}) {
 const sym=config.currency?.symbol||config.currency?.code||'F'
 const currentCycle=config.currentCycle||1
 const nbSlots=config.nbSlots||config.nbMembers||members.length||1
 const [showCycles,setShowCycles]=useState(false)

 const cyclePayments=payments.filter(p=>p.cycle===currentCycle&&p.type==='cotisation')
 const totalCollected=cyclePayments.reduce((s,p)=>s+(p.amount||0),0)
 const paidSlotOrders=new Set(cyclePayments.map(p=>p.slotOrder))
 const closedSlots=new Set(payouts.map(p=>p.slotOrder||p.cycle))
 const activeSlots=Array.from({length:nbSlots},(_,i)=>i+1).filter(o=>!closedSlots.has(o))
 const unpaidSlots=activeSlots.filter(o=>!paidSlotOrders.has(o))
 const unpaidMemberIds=[...new Set(unpaidSlots.map(order=>{
 const m=members.find(m=>m.slots?m.slots.some(s=>s.order===order):m.order===order)
 return m?.id
 }).filter(Boolean))]
 const recentPay=[...payments,...payouts].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,4)
 const pct=activeSlots.length>0?(activeSlots.filter(o=>paidSlotOrders.has(o)).length/activeSlots.length)*100:0

 return (
 <div style={{flex:1,overflowY:'auto',paddingBottom:70}}>
 {showCycles&&<CyclesModal config={config} members={members} payments={payments} payouts={payouts} onClose={()=>setShowCycles(false)}/>}
 <div style={{backgroundColor:C.g,padding:'calc(env(safe-area-inset-top) + 14px) 16px 20px'}}>
 <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
 <div style={{display:'flex',alignItems:'center',gap:9}}>
 <div style={{width:34,height:34,backgroundColor:'#fff',borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{color:C.g,fontSize:18,fontWeight:900}}></span></div>
 <div>
 <div style={{color:'#fff',fontSize:17,fontWeight:700,letterSpacing:0.3}}>IZI NJANGI</div>
 <div style={{color:'rgba(255,255,255,0.75)',fontSize:10,letterSpacing:0.5}}>GESTION DE TONTINE</div>
 </div>
 </div>
 <button onClick={()=>nav('impayes')} style={{width:36,height:36,borderRadius:18,backgroundColor:'rgba(255,255,255,0.18)',border:'none',cursor:'pointer',position:'relative',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>
 
 {unpaidMemberIds.length>0&&<span style={{position:'absolute',top:-2,right:-2,backgroundColor:C.rd,color:'#fff',fontSize:9,fontWeight:700,borderRadius:8,minWidth:16,height:16,display:'flex',alignItems:'center',justifyContent:'center',padding:'0 3px'}}>{unpaidMemberIds.length}</span>}
 </button>
 </div>
 <div style={{backgroundColor:'rgba(255,255,255,0.13)',borderRadius:12,padding:12}}>
 <div style={{color:'rgba(255,255,255,0.8)',fontSize:11,marginBottom:3}}>Cagnotte du cycle en cours</div>
 <div style={{color:'#fff',fontSize:26,fontWeight:700,letterSpacing:-1}}>{fmt(totalCollected,sym)}</div>
 <div style={{display:'flex',gap:8,marginTop:8}}>
 {[
 {l:'Slots payés', v:`${activeSlots.filter(o=>paidSlotOrders.has(o)).length}/${activeSlots.length}`},
 {l:'Cycle actuel', v:`Cycle ${currentCycle}/${nbSlots}`},
 {l:'Cotisation', v:fmt(config.cotisation,sym)},
 ].map(({l,v})=>(
 <div key={l} style={{flex:1,backgroundColor:'rgba(255,255,255,0.1)',borderRadius:8,padding:6}}>
 <div style={{color:'rgba(255,255,255,0.75)',fontSize:9}}>{l}</div>
 <div style={{color:'#fff',fontSize:11,fontWeight:600,marginTop:1}}>{v}</div>
 </div>
 ))}
 </div>
 </div>
 </div>

 <div style={{display:'flex',gap:8,padding:12}}>
 {[
 {icon:'',label:'Enregistrer\npaiement',color:C.gl, screen:'paiement' },
 {icon:'',label:'Verser\ncagnotte', color:C.pur, screen:'versement'},
 {icon:'',label:'Membres', color:C.bll, screen:'membres' },
 {icon:'',label:'Rapports', color:C.ambl,screen:'rapport' },
 ].map(q=>(
 <button key={q.screen} onClick={()=>nav(q.screen)}
 style={{flex:1,backgroundColor:C.white,border:`1px solid ${C.grb}`,borderRadius:12,padding:10,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
 <div style={{width:36,height:36,borderRadius:18,backgroundColor:q.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>{q.icon}</div>
 <span style={{fontSize:10,color:C.text2,fontWeight:500,textAlign:'center',lineHeight:'13px',whiteSpace:'pre-line'}}>{q.label}</span>
 </button>
 ))}
 </div>

 {unpaidSlots.length>0&&(
 <button onClick={()=>nav('impayes')} style={{display:'flex',alignItems:'center',gap:10,backgroundColor:C.ambl,border:`1px solid #FAC775`,borderRadius:8,margin:'0 14px 8px',padding:10,cursor:'pointer',width:'calc(100% - 28px)',textAlign:'left'}}>
 <span style={{fontSize:20}}></span>
 <span style={{fontSize:12,color:C.ambd,fontWeight:500}}>
 {unpaidSlots.length} place{unpaidSlots.length>1?'s':''} impayée{unpaidSlots.length>1?'s':''} — Cycle {currentCycle}
 <span style={{color:C.g}}> · Voir liste</span>
 </span>
 </button>
 )}

 <div style={{display:'flex',flexWrap:'wrap',gap:8,padding:'8px 14px'}}>
 {[
 {l:'Total collecté', v:totalCollected.toLocaleString('fr-FR'),sub:`${sym} ce cycle`,c:C.g },
 {l:'Slots impayés', v:unpaidSlots.length, sub:'ce cycle', c:C.amb },
 {l:'Tours clôturés', v:payouts.length, sub:`sur ${nbSlots}`, c:C.bl },
 {l:'Membres actifs', v:members.filter(m=>m.status!=='sorti').length,sub:'enregistrés',c:C.g},
 ].map(({l,v,sub,c})=>(
 <div key={l} style={{flex:'1 1 45%',backgroundColor:C.white,borderRadius:8,border:`1px solid ${C.grb}`,padding:10}}>
 <div style={{fontSize:11,color:C.text2,marginBottom:3}}>{l}</div>
 <div style={{fontSize:18,fontWeight:700,color:c}}>{v}</div>
 <div style={{fontSize:10,color:C.text2,marginTop:2}}>{sub}</div>
 </div>
 ))}
 </div>

 <div style={{padding:'0 14px 8px'}}>
 <button onClick={()=>setShowCycles(true)} style={{backgroundColor:C.white,borderRadius:12,border:`1px solid ${C.g}`,padding:12,width:'100%',textAlign:'left',cursor:'pointer'}}>
 <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
 <div>
 <div style={{fontSize:15,fontWeight:700,color:C.text}}>{config.tontineName}</div>
 <div style={{fontSize:11,color:C.text2,marginTop:2}}>{config.frequency} · {fmt(config.cotisation,sym)}</div>
 </div>
 <div style={{display:'flex',alignItems:'center',gap:6}}>
 <Badge label=" Actif" type="ok"/>
 <span style={{fontSize:11,color:C.g,fontWeight:600}}>Voir tours →</span>
 </div>
 </div>
 <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
 <span style={{fontSize:11,color:C.text2}}>Progression cycle {currentCycle}</span>
 <span style={{fontSize:11,color:C.text2}}>{activeSlots.filter(o=>paidSlotOrders.has(o)).length}/{activeSlots.length}</span>
 </div>
 <ProgBar pct={pct}/>
 <div style={{display:'flex',gap:6,marginTop:10}}>
 {[
 {v:activeSlots.filter(o=>paidSlotOrders.has(o)).length,l:'Payés', c:C.gd},
 {v:unpaidSlots.length, l:'Impayés', c:C.amb},
 {v:`${(totalCollected/1000).toFixed(0)}K`, l:'Collecté',c:C.gd},
 ].map(({v,l,c})=>(
 <div key={l} style={{flex:1,backgroundColor:C.gr,borderRadius:8,padding:8,textAlign:'center'}}>
 <div style={{fontSize:15,fontWeight:700,color:c}}>{v}</div>
 <div style={{fontSize:10,color:C.text2,marginTop:1}}>{l}</div>
 </div>
 ))}
 </div>
 </button>
 </div>

 <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px'}}>
 <span style={{fontSize:11,fontWeight:700,color:C.text2,textTransform:'uppercase',letterSpacing:0.5}}>Derniers paiements</span>
 <button onClick={()=>nav('paiements')} style={{background:'none',border:'none',color:C.g,fontSize:12,fontWeight:500,cursor:'pointer'}}>Tout voir</button>
 </div>
 <div style={{padding:'0 14px',display:'flex',flexDirection:'column',gap:8,paddingBottom:20}}>
 {recentPay.length===0&&<div style={{backgroundColor:C.white,borderRadius:12,border:`1px solid ${C.grb}`,padding:16,textAlign:'center',color:C.text2,fontSize:13}}>Aucun paiement enregistré</div>}
 {recentPay.map(p=>(
 <div key={p.id} style={{backgroundColor:C.white,borderRadius:12,border:`1px solid ${C.grb}`,padding:12,display:'flex',alignItems:'center',gap:8}}>
 <span style={{fontSize:16}}>{p.type==='versement'?'':''}</span>
 <div style={{flex:1}}>
 <div style={{fontSize:13,fontWeight:500,color:C.text}}>
 {p.memberName}{p.type==='versement'?' — Versement':p.slotOrder?` · Tour #${p.slotOrder} · Cycle ${p.cycle}`:`· Cycle ${p.cycle}`}
 </div>
 <div style={{fontSize:11,color:C.text2,marginTop:1}}>{fmtDate(p.date)} · {p.mode}</div>
 </div>
 <span style={{fontSize:14,fontWeight:700,color:p.type==='versement'?C.rd:C.g}}>{p.type==='versement'?'-':'+'}{fmt(p.amount,sym)}</span>
 </div>
 ))}
 </div>
 <div style={{textAlign:'center',padding:16,fontSize:10,color:C.text2}}>Powered by IZIsoft</div>
 </div>
 )
}

// MEMBRES SCREEN
export function MembresScreen({members,payments,config,onAddMember,onSelectMember,onAddSlot}) {
 const [search,setSearch]=useState('')
 const [filter,setFilter]=useState('tous')
 const cycle=config.currentCycle||1
 const paidIds=new Set(payments.filter(p=>p.cycle===cycle&&p.type==='cotisation').map(p=>p.memberId))
 const getStatus=m=>{
 if(m.status==='sorti') return 'sorti'
 if(paidIds.has(m.id)) return 'actif'
 return 'impaye'
 }
 const filtered=members.filter(m=>m.name.toLowerCase().includes(search.toLowerCase())).filter(m=>filter==='tous'||getStatus(m)===filter)
 const counts={tous:members.length,actif:members.filter(m=>paidIds.has(m.id)).length,impaye:members.filter(m=>!paidIds.has(m.id)&&m.status!=='sorti').length,sorti:members.filter(m=>m.status==='sorti').length}
 return (
 <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
 <div style={{backgroundColor:C.g,padding:'14px 16px 16px'}}>
 <div style={{color:'#fff',fontSize:17,fontWeight:700}}> Membres</div>
 <div style={{color:'rgba(255,255,255,0.8)',fontSize:11,marginTop:2}}>{members.length} membre{members.length>1?'s':''} · {members.reduce((s,m)=>s+(m.slots?.length||1),0)} places</div>
 </div>
 <div style={{padding:'12px 14px 8px',display:'flex',gap:8}}>
 <input style={{flex:1,backgroundColor:C.white,border:`1px solid ${C.grb}`,borderRadius:8,padding:'8px 12px',fontSize:13,color:C.text,outline:'none'}} placeholder="Rechercher..." value={search} onChange={e=>setSearch(e.target.value)}/>
 <button onClick={onAddMember} style={{backgroundColor:C.g,color:'#fff',border:'none',borderRadius:8,padding:'8px 14px',fontSize:13,fontWeight:700,cursor:'pointer'}}>+ Ajouter</button>
 </div>
 <div style={{display:'flex',gap:6,padding:'0 14px 10px',flexWrap:'wrap'}}>
 {[{key:'tous',label:`Tous (${counts.tous})`},{key:'actif',label:`Payés (${counts.actif})`},{key:'impaye',label:`En retard (${counts.impaye})`},{key:'sorti',label:`Anciens (${counts.sorti})`}].map(ch=>(
 <button key={ch.key} onClick={()=>setFilter(ch.key)} style={{padding:'5px 12px',borderRadius:20,border:`1px solid ${filter===ch.key?C.g:C.grb}`,backgroundColor:filter===ch.key?C.gl:C.white,color:filter===ch.key?C.gd:C.text2,fontSize:12,cursor:'pointer',fontWeight:500}}>{ch.label}</button>
 ))}
 </div>
 <div style={{flex:1,overflowY:'auto',padding:'0 14px',paddingBottom:80,display:'flex',flexDirection:'column',gap:8}}>
 {filtered.length===0&&<div style={{backgroundColor:C.white,borderRadius:12,border:`1px solid ${C.grb}`,padding:16,textAlign:'center',color:C.text2}}>Aucun membre trouvé</div>}
 {filtered.map((item,index)=>{
 const st=getStatus(item)
 const nbSlotsMember=item.slots?.length||1
 const memberPay=payments.filter(p=>p.memberId===item.id&&p.type==='cotisation')
 const pct=cycle>0?(memberPay.length/(cycle*nbSlotsMember))*100:0
 return (
 <button key={item.id} onClick={()=>onSelectMember(item)} style={{backgroundColor:C.white,borderRadius:12,border:`1px solid ${C.grb}`,padding:12,cursor:'pointer',textAlign:'left',width:'100%'}}>
 <div style={{display:'flex',alignItems:'center',gap:10}}>
 <Avatar name={item.name} index={index}/>
 <div style={{flex:1}}>
 <div style={{fontSize:14,fontWeight:500,color:C.text}}>{item.name}</div>
 <div style={{fontSize:11,color:C.text2,marginTop:2}}>
 {nbSlotsMember>1
 ?`${nbSlotsMember} places : Tours #${item.slots.map(s=>s.order).join(', #')}`
 :`Tour #${item.slots?.[0]?.order||item.order} · ${item.phone||'Sans tél.'}`}
 </div>
 </div>
 <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
 <Badge label={st==='actif'?' Payé':st==='impaye'?' Retard':' Sorti'} type={st==='actif'?'ok':st==='impaye'?'warn':'bad'}/>
 {nbSlotsMember>1&&<span style={{fontSize:10,backgroundColor:C.pur,color:C.purd,padding:'2px 6px',borderRadius:10,fontWeight:700}}>{nbSlotsMember} places</span>}
 </div>
 </div>
 <div style={{marginTop:8}}>
 <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
 <span style={{fontSize:10,color:C.text2}}>Cotisations payées</span>
 <span style={{fontSize:10,color:C.text2}}>{memberPay.length}/{cycle*nbSlotsMember}</span>
 </div>
 <ProgBar pct={pct} color={st==='actif'?C.g:st==='impaye'?C.amb:C.rd}/>
 </div>
 </button>
 )
 })}
 </div>
 </div>
 )
}

// ADD MEMBRE SCREEN
export function AddMembreScreen({members,config,onBack,onSave}) {
 const nbSlots=config?.nbSlots||config?.nbMembers||20
 const usedOrders=members.flatMap(m=>m.slots?m.slots.map(s=>s.order):[m.order]).filter(Boolean)
 const freeOrders=Array.from({length:nbSlots},(_,i)=>i+1).filter(o=>!usedOrders.includes(o))
 const [form,setForm]=useState({name:'',phone:'',email:'',joinDate:new Date().toISOString().split('T')[0]})
 const [nbP,setNbP]=useState(1)
 const [chosen,setChosen]=useState([])
 const [errors,setErrors]=useState({})

 const toggleSlot=(order)=>{
 if(chosen.includes(order)) setChosen(p=>p.filter(o=>o!==order))
 else if(chosen.length<nbP) setChosen(p=>[...p,order].sort((a,b)=>a-b))
 }

 const lbl={fontSize:12,fontWeight:600,color:C.text2,marginBottom:3,display:'block'}
 const inp={backgroundColor:C.white,border:`1px solid ${C.grb}`,borderRadius:8,padding:'10px 12px',fontSize:14,width:'100%',color:C.text,outline:'none',marginTop:4,boxSizing:'border-box',maxWidth:'100%'}

 const validate=()=>{
 const e={}
 if(!form.name.trim()) e.name='Le nom est obligatoire.'
 else if(members.some(m=>m.name.toLowerCase()===form.name.trim().toLowerCase())) e.name=`"${form.name.trim()}" existe déjà.`
 if(chosen.length===0) e.slots='Choisissez au moins 1 tour.'
 else if(chosen.length<nbP) e.slots=`Choisissez ${nbP} tour${nbP>1?'s':''} (${chosen.length} sélectionné${chosen.length>1?'s':''}).`
 setErrors(e)
 return Object.keys(e).length===0
 }

 const save=()=>{
 if(!validate()) return
 onSave({id:Date.now().toString(),name:form.name.trim(),phone:form.phone.trim(),email:form.email.trim(),joinDate:form.joinDate,status:'actif',slots:chosen.map((order,i)=>({slotId:genId(),order,slotNum:i+1})),order:chosen[0]})
 }

 return (
 <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
 <div style={{backgroundColor:C.g,padding:'14px 16px 16px',display:'flex',alignItems:'center',gap:10}}>
 <button onClick={onBack} style={{background:'none',border:'none',color:'#fff',fontSize:26,cursor:'pointer',lineHeight:1,padding:'0 8px 0 0'}}>‹</button>
 <div>
 <div style={{color:'#fff',fontSize:17,fontWeight:700}}> Nouveau membre</div>
 <div style={{color:'rgba(255,255,255,0.8)',fontSize:11,marginTop:2}}>{freeOrders.length} tour{freeOrders.length>1?'s':''} disponible{freeOrders.length>1?'s':''}</div>
 </div>
 </div>
 <div style={{flex:1,overflowY:'auto',padding:16,display:'flex',flexDirection:'column',gap:14}}>
 <div>
 <label style={lbl}>Nom complet *</label>
 <input style={errors.name?{...inp,border:`1px solid ${C.rd}`}:inp} type="text" placeholder="Ex: Marie Dupont"
 value={form.name} onChange={e=>{setForm(p=>({...p,name:e.target.value}));setErrors(p=>({...p,name:''}))}}/>
 {errors.name&&<p style={{color:C.rd,fontSize:12,marginTop:4}}> {errors.name}</p>}
 </div>
 <div>
 <label style={lbl}>Téléphone</label>
 <input style={inp} type="tel" placeholder="+243 8XX XXX XXX" value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))}/>
 </div>
 <div style={{display:'flex',gap:8}}>
 <div style={{flex:1}}>
 <label style={lbl}>Email (optionnel)</label>
 <input style={inp} type="email" placeholder="marie@email.com" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))}/>
 </div>
 <div style={{flex:1}}>
 <label style={lbl}>Date d'adhésion</label>
 <input style={inp} type="date" value={form.joinDate} onChange={e=>setForm(p=>({...p,joinDate:e.target.value}))}/>
 </div>
 </div>
 <div>
 <label style={lbl}>Nombre de places *</label>
 <div style={{display:'flex',gap:8,marginTop:4}}>
 {[1,2,3,4].map(n=>(
 <button key={n} onClick={()=>{setNbP(n);setChosen([])}}
 style={{flex:1,padding:'10px 0',borderRadius:8,border:`2px solid ${nbP===n?C.g:C.grb}`,backgroundColor:nbP===n?C.gl:C.white,color:nbP===n?C.gd:C.text2,fontSize:14,fontWeight:700,cursor:'pointer'}}>{n}</button>
 ))}
 </div>
 {nbP>1&&<div style={{marginTop:6,backgroundColor:C.pur,borderRadius:6,padding:'6px 10px',fontSize:11,color:C.purd}}>
 Ce membre paiera {fmt(config?.cotisation*nbP||0,config?.currency?.symbol||'F')} par cycle ({nbP}× cotisation)
 </div>}
 </div>
 <div>
 <label style={lbl}>Choisir {nbP} tour{nbP>1?'s':''} * <span style={{color:C.text2,fontWeight:400}}>({chosen.length}/{nbP})</span></label>
 {errors.slots&&<p style={{color:C.rd,fontSize:12,marginBottom:6}}> {errors.slots}</p>}
 <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:4}}>
 {Array.from({length:nbSlots},(_,i)=>i+1).map(order=>{
 const used=usedOrders.includes(order)
 const selected=chosen.includes(order)
 return (
 <button key={order} onClick={()=>!used&&toggleSlot(order)} disabled={used}
 style={{width:44,height:44,borderRadius:8,border:`2px solid ${selected?C.g:C.grb}`,backgroundColor:selected?C.g:used?C.gr:C.white,color:selected?'#fff':used?C.text2:C.text,fontSize:13,fontWeight:selected?700:500,cursor:used?'default':'pointer',opacity:used?0.5:1}}>
 {order}
 </button>
 )
 })}
 </div>
 {freeOrders.length===0&&<div style={{marginTop:8,backgroundColor:C.rdl,borderRadius:6,padding:'8px 10px',fontSize:12,color:C.rd}}> Tous les tours sont attribués.</div>}
 </div>
 <button onClick={save} style={{backgroundColor:C.g,color:'#fff',border:'none',borderRadius:12,padding:13,fontSize:15,fontWeight:700,cursor:'pointer',marginTop:4}}>
 Enregistrer le membre 
 </button>
 </div>
 </div>
 )
}

// REÇU (correction complète : TYPES_PAY défini, icônes emoji, PDF pour print ET WhatsApp)
function Recu({receipt,config,onBack,onNew}) {
 const sym=config.currency?.symbol||config.currency?.code||'F'
 const typeLabel=TYPES_PAY.find(t=>t.key===receipt.type)?.label||receipt.type
 const recuRef=useRef(null)

 const handlePrint=async()=>{ if(recuRef.current) await printPDFElement(recuRef.current) }
 const handleWhatsApp=async()=>{ if(recuRef.current) await shareViaPDF(recuRef.current,receipt,config.tontineName) }

 return (
 <div style={{flex:1,display:'flex',flexDirection:'column',backgroundColor:C.g}}>
 <div style={{padding:'20px 16px 12px',display:'flex',alignItems:'center',gap:10}}>
 <button onClick={onBack} style={{background:'none',border:'none',color:'#fff',fontSize:26,cursor:'pointer'}}>‹</button>
 <div style={{color:'#fff',fontSize:17,fontWeight:700}}> Reçu de paiement</div>
 </div>
 <div style={{flex:1,overflowY:'auto',padding:'0 16px 16px'}}>
 <div ref={recuRef} style={{backgroundColor:C.white,borderRadius:16,overflow:'hidden'}}>
 <div style={{backgroundColor:C.g,padding:'20px 16px',textAlign:'center'}}>
 <div style={{fontSize:48,marginBottom:8}}></div>
 <div style={{color:'#fff',fontSize:13,fontWeight:600,letterSpacing:0.5}}>PAIEMENT ENREGISTRÉ</div>
 <div style={{color:'rgba(255,255,255,0.85)',fontSize:11,marginTop:4}}>{config.tontineName}</div>
 </div>
 <div style={{textAlign:'center',padding:'20px 16px 12px',borderBottom:'1px dashed '+C.grb}}>
 <div style={{fontSize:11,color:C.text2,marginBottom:4}}>Montant total</div>
 <div style={{fontSize:32,fontWeight:800,color:C.g,letterSpacing:-1}}>{fmt(receipt.amount,sym)}</div>
 {receipt.penalty>0&&<div style={{fontSize:11,color:C.amb,marginTop:4}}>dont {fmt(receipt.penalty,sym)} de pénalité</div>}
 </div>
 <div style={{padding:'12px 16px',display:'flex',flexDirection:'column',gap:10}}>
 {[
 {l:'N° Reçu', v:receipt.receiptNum},
 {l:'Type', v:typeLabel},
 {l:'Membre', v:receipt.memberName},
 ...(receipt.slotOrder?[{l:'Tour',v:`#${receipt.slotOrder}`}]:[]),
 ...(receipt.cycle?[{l:'Cycle',v:`Cycle ${receipt.cycle}`}]:[]),
 {l:'Mode', v:receipt.mode},
 {l:'Date', v:fmtDate(receipt.date)},
 ...(receipt.note?[{l:'Note',v:receipt.note}]:[]),
 ].map(({l,v})=>(
 <div key={l} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
 <span style={{fontSize:12,color:C.text2}}>{l}</span>
 <span style={{fontSize:13,fontWeight:600,color:C.text,maxWidth:'60%',textAlign:'right'}}>{v}</span>
 </div>
 ))}
 </div>
 <div style={{margin:'0 16px',height:1,backgroundColor:C.grb}}/>
 <div style={{padding:'10px 16px 16px',textAlign:'center'}}>
 <div style={{fontSize:10,color:C.text2,letterSpacing:0.4}}>Powered by IZIsoft — IZI NJANGI v1.0</div>
 </div>
 </div>
 <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:16}}>
 <button onClick={handlePrint}
 style={{backgroundColor:C.white,color:C.g,border:'2px solid '+C.g,borderRadius:12,padding:13,fontSize:14,fontWeight:700,cursor:'pointer'}}> Imprimer le reçu (PDF)</button>
 <button onClick={handleWhatsApp}
 style={{backgroundColor:'#25D366',color:'#fff',border:'none',borderRadius:12,padding:13,fontSize:14,fontWeight:700,cursor:'pointer'}}> Envoyer sur WhatsApp (PDF)</button>
 <button onClick={onNew}
 style={{backgroundColor:C.white,color:C.text2,border:'1px solid '+C.grb,borderRadius:12,padding:13,fontSize:14,fontWeight:600,cursor:'pointer'}}> Nouveau paiement</button>
 <button onClick={onBack}
 style={{background:'none',border:'none',color:'rgba(255,255,255,0.8)',fontSize:13,cursor:'pointer',padding:8}}>← Retour</button>
 </div>
 </div>
 </div>
 )
}

// PAIEMENT SCREEN
export function PaiementScreen({config,members,payments,onSave,onBack}) {
 const sym=config.currency?.symbol||config.currency?.code||'F'
 const base=Number(config.cotisation||0)
 const currentCycle=config.currentCycle||1
 const penaltyRate=config.penaltyRate||0

 const [view,setView]=useState('form')
 const [receipt,setReceipt]=useState(null)
 const [form,setForm]=useState({memberId:'',slotOrder:'',mode:'Espèces',date:new Date().toISOString().split('T')[0],note:'',withPenalty:false})
 const [errors,setErrors]=useState({})
 const f=patch=>{setForm(p=>({...p,...patch}));setErrors({})}

 const activeMembers=members.filter(m=>m.status!=='sorti')
 const member=members.find(m=>m.id===form.memberId)
 const memberSlots=member?.slots||(member?[{slotId:'single',order:member.order||1,slotNum:1}]:[])

 const alreadyPaid=form.memberId&&form.slotOrder
 ?payments.some(p=>p.memberId===form.memberId&&p.slotOrder===Number(form.slotOrder)&&p.cycle===currentCycle&&p.type==='cotisation')
 :false

 const penaltyAmt=form.withPenalty?Math.round(base*penaltyRate/100):0
 const totalAmt=base+penaltyAmt

 const validate=()=>{
 const e={}
 if(!form.memberId) e.memberId='Sélectionnez un membre.'
 if(!form.slotOrder) e.slotOrder='Sélectionnez un tour.'
 if(alreadyPaid) e.doublon=`Tour #${form.slotOrder} déjà payé pour le cycle ${currentCycle}.`
 setErrors(e)
 return Object.keys(e).length===0
 }

 const submit=()=>{
 if(!validate()) return
 const r={id:genId(),type:'cotisation',memberId:form.memberId,memberName:member?.name||'',memberPhone:member?.phone||'',slotOrder:Number(form.slotOrder),cycle:currentCycle,amount:totalAmt,baseAmount:base,penalty:penaltyAmt,mode:form.mode,date:form.date,note:form.note,receiptNum:genRec()}
 onSave(r); setReceipt(r); setView('recu')
 }

 const reset=()=>{setView('form');setReceipt(null);setForm({memberId:'',slotOrder:'',mode:'Espèces',date:new Date().toISOString().split('T')[0],note:'',withPenalty:false});setErrors({})}

 if(view==='recu') return <Recu receipt={receipt} config={config} onBack={onBack} onNew={reset}/>

 const lbl={fontSize:12,fontWeight:600,color:C.text2,marginBottom:3,display:'block'}
 const inp={backgroundColor:C.white,border:`1px solid ${C.grb}`,borderRadius:8,padding:'10px 12px',fontSize:14,width:'100%',color:C.text,outline:'none',marginTop:4,boxSizing:'border-box',maxWidth:'100%'}

 return (
 <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
 <div style={{backgroundColor:C.g,padding:'14px 16px 16px',display:'flex',alignItems:'center',gap:10}}>
 <button onClick={onBack} style={{background:'none',border:'none',color:'#fff',fontSize:26,cursor:'pointer'}}>‹</button>
 <div>
 <div style={{color:'#fff',fontSize:17,fontWeight:700}}> Enregistrer un paiement</div>
 <div style={{color:'rgba(255,255,255,0.8)',fontSize:11,marginTop:2}}>Cycle {currentCycle} · {fmt(base,sym)}</div>
 </div>
 </div>
 <div style={{flex:1,overflowY:'auto',padding:16,paddingBottom:100,display:'flex',flexDirection:'column',gap:14}}>
 <div>
 <label style={lbl}>Membre *</label>
 <select style={errors.memberId?{...inp,border:`1px solid ${C.rd}`}:inp} value={form.memberId}
 onChange={e=>f({memberId:e.target.value,slotOrder:''})}>
 <option value="">— Sélectionner un membre —</option>
 {activeMembers.sort((a,b)=>(a.slots?.[0]?.order||a.order||0)-(b.slots?.[0]?.order||b.order||0)).map(m=>(
 <option key={m.id} value={m.id}>{m.name}{m.slots?.length>1?` (${m.slots.length} places)`:''}</option>
 ))}
 </select>
 {errors.memberId&&<p style={{color:C.rd,fontSize:12,marginTop:4}}> {errors.memberId}</p>}
 </div>

 {member&&(
 <div>
 <label style={lbl}>Tour à payer *</label>
 {memberSlots.length===1?(
 <div style={{backgroundColor:C.gl,borderRadius:8,padding:'10px 12px',marginTop:4}}>
 <div style={{fontSize:13,fontWeight:600,color:C.gd}}>Tour #{memberSlots[0].order}</div>
 <div style={{fontSize:11,color:C.g2,marginTop:2}}>
 {payments.some(p=>p.memberId===form.memberId&&p.slotOrder===memberSlots[0].order&&p.cycle===currentCycle&&p.type==='cotisation')
 ?' Déjà payé ce cycle':'⏳ En attente de paiement'}
 </div>
 </div>
 ):(
 <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:6}}>
 {memberSlots.sort((a,b)=>a.order-b.order).map(slot=>{
 const paid=payments.some(p=>p.memberId===form.memberId&&p.slotOrder===slot.order&&p.cycle===currentCycle&&p.type==='cotisation')
 const active=form.slotOrder===String(slot.order)
 return (
 <button key={slot.slotId||slot.order} onClick={()=>!paid&&f({slotOrder:String(slot.order)})} disabled={paid}
 style={{flex:'1 1 calc(50% - 4px)',padding:'12px 8px',borderRadius:10,border:`2px solid ${active?C.g:C.grb}`,backgroundColor:active?C.g:paid?C.gr:C.white,color:active?'#fff':paid?C.text2:C.text,cursor:paid?'default':'pointer',textAlign:'center'}}>
 <div style={{fontSize:14,fontWeight:700}}>Tour #{slot.order}</div>
 <div style={{fontSize:10,marginTop:3}}>{paid?' Payé':active?' Sélectionné':'⏳ À payer'}</div>
 </button>
 )
 })}
 </div>
 )}
 {errors.slotOrder&&<p style={{color:C.rd,fontSize:12,marginTop:4}}> {errors.slotOrder}</p>}
 {alreadyPaid&&<div style={{marginTop:6,backgroundColor:C.rdl,border:`1px solid ${C.rd}`,borderRadius:8,padding:'8px 12px',fontSize:12,color:C.rd}}> Tour #${form.slotOrder} déjà payé ce cycle.</div>}
 </div>
 )}

 {member&&memberSlots.length===1&&!form.slotOrder&&(()=>{setTimeout(()=>f({slotOrder:String(memberSlots[0].order)}),0);return null})()}

 {penaltyRate>0&&(
 <div style={{backgroundColor:C.ambl,borderRadius:8,padding:'10px 12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
 <div>
 <div style={{fontSize:13,color:C.ambd,fontWeight:600}}> Pénalité de retard ({penaltyRate}%)</div>
 <div style={{fontSize:11,color:C.amb,marginTop:2}}>+ {fmt(Math.round(base*penaltyRate/100),sym)}</div>
 </div>
 <Toggle on={form.withPenalty} onChange={()=>f({withPenalty:!form.withPenalty})}/>
 </div>
 )}

 <div style={{backgroundColor:C.gl,borderRadius:8,padding:'10px 12px'}}>
 <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
 <span style={{fontSize:13,color:C.gd,fontWeight:600}}> Montant à payer</span>
 <span style={{fontSize:18,fontWeight:800,color:C.g}}>{fmt(totalAmt,sym)}</span>
 </div>
 {penaltyAmt>0&&<div style={{fontSize:11,color:C.amb,marginTop:4}}>Cotisation {fmt(base,sym)} + Pénalité {fmt(penaltyAmt,sym)}</div>}
 </div>

 <div style={{display:'flex',gap:8}}>
 <div style={{flex:1}}>
 <label style={lbl}>Mode de paiement</label>
 <select style={inp} value={form.mode} onChange={e=>f({mode:e.target.value})}>
 {MODES.map(m=><option key={m}>{m}</option>)}
 </select>
 </div>
 <div style={{flex:1}}>
 <label style={lbl}>Date</label>
 <input style={inp} type="date" value={form.date} onChange={e=>f({date:e.target.value})}/>
 </div>
 </div>

 <div>
 <label style={lbl}>Note (optionnel)</label>
 <input style={inp} type="text" placeholder="Ex: Paiement anticipé..." value={form.note} onChange={e=>f({note:e.target.value})}/>
 </div>

 <button onClick={submit}
 style={{backgroundColor:alreadyPaid?C.grb:C.g,color:'#fff',border:'none',borderRadius:12,padding:14,fontSize:15,fontWeight:700,cursor:alreadyPaid?'not-allowed':'pointer',opacity:alreadyPaid?0.6:1,marginBottom:16}}>
 Enregistrer 
 </button>
 </div>
 </div>
 )
}

// IMPAYÉS SCREEN (nouveau — corrige la navigation 'impayes')
export function ImpayesScreen({config,members,payments,payouts,onBack,onPay}) {
 const sym=config.currency?.symbol||config.currency?.code||'F'
 const currentCycle=config.currentCycle||1
 const nbSlots=config.nbSlots||config.nbMembers||members.length||1
 const closedSlots=new Set(payouts.map(p=>p.slotOrder||p.cycle))
 const activeSlots=Array.from({length:nbSlots},(_,i)=>i+1).filter(o=>!closedSlots.has(o))
 const paidSlots=new Set(payments.filter(p=>p.cycle===currentCycle&&p.type==='cotisation').map(p=>p.slotOrder))
 const unpaid=activeSlots.filter(o=>!paidSlots.has(o)).map(order=>{
 const member=members.find(m=>m.slots?m.slots.some(s=>s.order===order):m.order===order)
 return {order,member}
 })
 return (
 <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
 <div style={{backgroundColor:C.amb,padding:'14px 16px 16px',display:'flex',alignItems:'center',gap:10}}>
 <button onClick={onBack} style={{background:'none',border:'none',color:'#fff',fontSize:26,cursor:'pointer'}}>‹</button>
 <div>
 <div style={{color:'#fff',fontSize:17,fontWeight:700}}> Impayés</div>
 <div style={{color:'rgba(255,255,255,0.8)',fontSize:11,marginTop:2}}>Cycle {currentCycle} · {unpaid.length} slot{unpaid.length>1?'s':''} en retard</div>
 </div>
 </div>
 <div style={{flex:1,overflowY:'auto',padding:'12px 14px',paddingBottom:80,display:'flex',flexDirection:'column',gap:8}}>
 {unpaid.length===0&&(
 <div style={{backgroundColor:C.gl,borderRadius:12,border:`1px solid ${C.g}`,padding:20,textAlign:'center'}}>
 <div style={{fontSize:40,marginBottom:8}}></div>
 <div style={{fontSize:14,fontWeight:700,color:C.gd}}>Tous les slots sont payés !</div>
 <div style={{fontSize:12,color:C.g2,marginTop:4}}>Cycle {currentCycle} complet</div>
 </div>
 )}
 {unpaid.map(({order,member})=>(
 <div key={order} style={{backgroundColor:C.white,borderRadius:12,border:`1px solid ${C.grb}`,padding:12}}>
 <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
 <div style={{display:'flex',alignItems:'center',gap:10}}>
 <div style={{width:36,height:36,borderRadius:18,backgroundColor:C.ambl,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}></div>
 <div>
 <div style={{fontSize:14,fontWeight:600,color:C.text}}>{member?member.name:'— Non attribué —'}</div>
 <div style={{fontSize:11,color:C.text2,marginTop:2}}>Tour #{order} · Cycle {currentCycle} · {fmt(config.cotisation,sym)}</div>
 {member?.phone&&<div style={{fontSize:11,color:C.bl,marginTop:1}}> {member.phone}</div>}
 </div>
 </div>
 {member&&(
 <button onClick={()=>onPay(member)} style={{backgroundColor:C.g,color:'#fff',border:'none',borderRadius:8,padding:'6px 12px',fontSize:12,fontWeight:700,cursor:'pointer',flexShrink:0}}>
 Payer →
 </button>
 )}
 </div>
 </div>
 ))}
 </div>
 </div>
 )
}

// RAPPORT SCREEN
export function RapportScreen({config,members,payments,payouts,cycles,onPayout,onRenew,onUpdateConfig,onBack}) {
 const sym=config.currency?.symbol||config.currency?.code||'F'
 const nbSlots=config.nbSlots||config.nbMembers||members.length||1
 const currentCycle=config.currentCycle||1
 const cotisation=config.cotisation||0
 const [versView,setVersView]=useState(false)
 const [versForm,setVersForm]=useState({beneficiary:'',slotOrder:'',frais:'0',date:new Date().toISOString().slice(0,10),mode:'Espèces',note:''})
 const rapportRef=useRef(null)

 const totalCollected=payments.filter(p=>p.type==='cotisation').reduce((s,p)=>s+(p.amount||0),0)
 const totalPaid=payouts.reduce((s,p)=>s+(p.amount||0),0)
 const cycleCollected=payments.filter(p=>p.type==='cotisation'&&p.cycle===currentCycle).reduce((s,p)=>s+(p.amount||0),0)
 const paidSlots=new Set(payments.filter(p=>p.cycle===currentCycle&&p.type==='cotisation').map(p=>p.slotOrder))
 const closedSlots=new Set(payouts.map(p=>p.slotOrder||p.cycle))
 const activeSlots=Array.from({length:nbSlots},(_,i)=>i+1).filter(o=>!closedSlots.has(o))
 const unpaidCount=activeSlots.filter(o=>!paidSlots.has(o)).length
 const brut=cycleCollected
 const fraisPct=parseFloat(versForm.frais)||0
 const fraisAmt=Math.round(brut*fraisPct/100)
 const net=brut-fraisAmt

 const slotRows=Array.from({length:nbSlots},(_,i)=>{
 const order=i+1
 const payout=payouts.find(p=>p.slotOrder===order||p.cycle===order)
 const pays=payments.filter(p=>p.slotOrder===order&&p.type==='cotisation')
 const total=pays.reduce((s,p)=>s+(p.amount||0),0)
 const status=payout?'cloture':order===currentCycle?'encours':order<currentCycle?'passe':'futur'
 const member=payout
 ?members.find(m=>m.id===payout.memberId)
 :members.find(m=>m.slots?m.slots.some(s=>s.order===order):m.order===order)
 return {order,payout,total,status,member}
 })

 const currentSlotMember=members.find(m=>m.slots?m.slots.some(s=>s.order===currentCycle):m.order===currentCycle)

 const submitVersement=()=>{
 if(!versForm.beneficiary) return alert('Sélectionnez un bénéficiaire.')
 const m=members.find(x=>x.id===versForm.beneficiary)
 const slotOrd=Number(versForm.slotOrder)||currentCycle
 const p={id:'pyt_'+Date.now(),memberId:versForm.beneficiary,memberName:m?.name||'',slotOrder:slotOrd,cycle:currentCycle,amount:net,brut,frais:fraisAmt,fraisPct,mode:versForm.mode,date:versForm.date,note:versForm.note,type:'versement',receiptNum:genRec()}
 onPayout(p); setVersView(false)
 alert(` Versement de ${fmt(net,sym)} enregistré pour ${m?.name} — Tour #${slotOrd}`)
 }

 const printRapport=async()=>{ if(rapportRef.current) await printPDFElement(rapportRef.current) }
 const shareRapport=async()=>{
 if(!rapportRef.current) return
 const info={receiptNum:'RPT-'+Date.now().toString().slice(-4),memberName:config.adminName||'Admin',amount:totalCollected,date:new Date().toISOString()}
 await shareViaPDF(rapportRef.current,info,config.tontineName)
 }

 const inp={backgroundColor:C.white,border:`1px solid ${C.grb}`,borderRadius:8,padding:'10px 12px',fontSize:14,width:'100%',color:C.text,outline:'none',fontFamily:'inherit',boxSizing:'border-box'}
 const lbl={fontSize:12,color:C.text2,fontWeight:600,marginBottom:4,display:'block'}

 if(versView) return (
 <div style={{flex:1,overflowY:'auto',paddingBottom:80}}>
 <div style={{backgroundColor:C.gd,padding:'14px 16px 16px',display:'flex',alignItems:'center',gap:12}}>
 <button onClick={()=>setVersView(false)} style={{background:'none',border:'none',color:'#fff',fontSize:22,cursor:'pointer'}}>‹</button>
 <div>
 <div style={{color:'#fff',fontSize:17,fontWeight:700}}> Verser la cagnotte</div>
 <div style={{color:'rgba(255,255,255,0.8)',fontSize:11,marginTop:1}}>Cycle {currentCycle}</div>
 </div>
 </div>
 <div style={{padding:'16px 14px',display:'flex',flexDirection:'column',gap:12}}>
 <div style={{backgroundColor:C.gl,borderRadius:10,padding:14}}>
 <div style={{fontSize:11,color:C.gd,marginBottom:4}}> Cagnotte cycle {currentCycle}</div>
 <div style={{fontSize:22,fontWeight:800,color:C.g}}>{fmt(brut,sym)}</div>
 {currentSlotMember&&<div style={{fontSize:12,color:C.gd,marginTop:4,fontWeight:600}}> Bénéficiaire prévu : {currentSlotMember.name} (Tour #{currentCycle})</div>}
 </div>
 <div>
 <label style={lbl}>Bénéficiaire *</label>
 <select style={{...inp,cursor:'pointer'}} value={versForm.beneficiary} onChange={e=>setVersForm(p=>({...p,beneficiary:e.target.value}))}>
 <option value="">— Sélectionner —</option>
 {members.filter(m=>m.status!=='sorti').sort((a,b)=>(a.slots?.[0]?.order||a.order||0)-(b.slots?.[0]?.order||b.order||0)).map(m=>(
 <option key={m.id} value={m.id}>{m.name}{m.slots?.length>1?` (${m.slots.length} places)`:''}</option>
 ))}
 </select>
 </div>
 {versForm.beneficiary&&(()=>{
 const m=members.find(x=>x.id===versForm.beneficiary)
 if(!m?.slots||m.slots.length<=1) return null
 return (
 <div>
 <label style={lbl}>Tour bénéficiaire *</label>
 <select style={{...inp,cursor:'pointer'}} value={versForm.slotOrder} onChange={e=>setVersForm(p=>({...p,slotOrder:e.target.value}))}>
 <option value="">— Sélectionner le tour —</option>
 {m.slots.map(s=><option key={s.slotId||s.order} value={s.order}>Tour #{s.order}</option>)}
 </select>
 </div>
 )
 })()}
 <div><label style={lbl}>Frais de gestion (%)</label><input style={inp} type="number" min="0" max="100" placeholder="0" value={versForm.frais} onChange={e=>setVersForm(p=>({...p,frais:e.target.value}))}/></div>
 <div>
 <label style={lbl}>Mode</label>
 <select style={{...inp,cursor:'pointer'}} value={versForm.mode} onChange={e=>setVersForm(p=>({...p,mode:e.target.value}))}>
 {MODES.map(m=><option key={m}>{m}</option>)}
 </select>
 </div>
 <div><label style={lbl}>Date</label><input style={inp} type="date" value={versForm.date} onChange={e=>setVersForm(p=>({...p,date:e.target.value}))}/></div>
 <div><label style={lbl}>Note</label><input style={inp} type="text" placeholder="Optionnel..." value={versForm.note} onChange={e=>setVersForm(p=>({...p,note:e.target.value}))}/></div>
 <div style={{backgroundColor:C.white,border:`1px solid ${C.grb}`,borderRadius:10,overflow:'hidden'}}>
 {[[`Brut collecté`,fmt(brut,sym)],[`Frais (${fraisPct}%)`,`- ${fmt(fraisAmt,sym)}`]].map(([k,v])=>(
 <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'8px 12px',borderBottom:`0.5px solid ${C.gr}`}}><span style={{fontSize:12,color:C.text2}}>{k}</span><span style={{fontSize:12,fontWeight:500}}>{v}</span></div>
 ))}
 <div style={{display:'flex',justifyContent:'space-between',padding:'10px 12px',backgroundColor:C.gl}}>
 <span style={{fontSize:13,fontWeight:700,color:C.gd}}> Net à verser</span>
 <span style={{fontSize:16,fontWeight:800,color:C.g}}>{fmt(net,sym)}</span>
 </div>
 </div>
 <button onClick={submitVersement} style={{backgroundColor:C.gd,color:'#fff',border:'none',borderRadius:12,padding:14,fontSize:15,fontWeight:700,cursor:'pointer'}}>Confirmer le versement </button>
 </div>
 </div>
 )

 return (
 <div style={{flex:1,overflowY:'auto',paddingBottom:80}}>
 <div style={{backgroundColor:C.gd,padding:'14px 16px 16px'}}>
 <div style={{color:'#fff',fontSize:17,fontWeight:700}}> Rapports</div>
 <div style={{color:'rgba(255,255,255,0.8)',fontSize:11,marginTop:2}}>{config.tontineName} · Cycle {currentCycle}/{nbSlots}</div>
 </div>
 <div ref={rapportRef}>
 <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,padding:'12px 14px 8px'}}>
 {[
 {l:'Total collecté',v:totalCollected.toLocaleString('fr-FR'),sub:`${sym} global`,c:C.g },
 {l:'Slots impayés', v:unpaidCount, sub:'ce cycle', c:C.amb },
 {l:'Tours clôturés',v:payouts.length, sub:`sur ${nbSlots}`,c:C.bl },
 {l:'Total versé', v:totalPaid.toLocaleString('fr-FR'), sub:`${sym}`, c:C.gd },
 ].map(({l,v,sub,c})=>(
 <div key={l} style={{backgroundColor:C.white,border:`1px solid ${C.grb}`,borderRadius:8,padding:'10px 12px'}}>
 <div style={{fontSize:11,color:C.text2,marginBottom:3}}>{l}</div>
 <div style={{fontSize:18,fontWeight:800,color:c}}>{v}</div>
 <div style={{fontSize:10,color:C.text2,marginTop:2}}>{sub}</div>
 </div>
 ))}
 </div>
 <button onClick={()=>setVersView(true)} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,backgroundColor:C.gd,color:'#fff',border:'none',borderRadius:10,padding:'12px 16px',margin:'0 14px 12px',width:'calc(100% - 28px)',fontSize:14,fontWeight:700,cursor:'pointer'}}>
 Verser la cagnotte — Cycle {currentCycle}{currentSlotMember?` → ${currentSlotMember.name}`:''}
 </button>
 <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'4px 14px 6px'}}>
 <span style={{fontSize:11,fontWeight:700,color:C.text2,textTransform:'uppercase',letterSpacing:0.5}}>Tableau des tours</span>
 </div>
 <div style={{padding:'0 14px',display:'flex',flexDirection:'column',gap:8,marginBottom:8}}>
 {slotRows.map(({order,payout,total,status,member})=>(
 <div key={order} style={{backgroundColor:C.white,border:`1px solid ${status==='encours'?C.g:C.grb}`,borderRadius:10,padding:12,borderLeftWidth:status==='encours'?3:1,borderLeftColor:status==='encours'?C.g:C.grb}}>
 <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
 <div style={{display:'flex',alignItems:'center',gap:8}}>
 <div style={{width:28,height:28,borderRadius:14,backgroundColor:status==='cloture'?C.gl:status==='encours'?C.g:C.gr,display:'flex',alignItems:'center',justifyContent:'center'}}>
 <span style={{color:status==='encours'?'#fff':status==='cloture'?C.gd:C.text2,fontSize:11,fontWeight:700}}>#{order}</span>
 </div>
 <div>
 <div style={{fontSize:13,fontWeight:600,color:C.text}}>{member?member.name:'— Non attribué —'}</div>
 {member?.slots?.length>1&&<div style={{fontSize:10,color:C.text2}}>Place {member.slots.find(s=>s.order===order)?.slotNum||1}/{member.slots.length}</div>}
 </div>
 </div>
 <Badge label={status==='cloture'?' Versé':status==='encours'?'⏳ En cours':status==='passe'?'Passé':'À venir'} type={status==='cloture'?'ok':status==='encours'?'warn':status==='passe'?'bad':'info'}/>
 </div>
 <div style={{fontSize:11,color:C.text2,marginTop:4}}>
 {status==='cloture'&&payout?`Versé ${fmtDate(payout.date)} · ${fmt(payout.amount,sym)}`:status==='futur'?`Prévu · ${fmt(cotisation*nbSlots,sym)}`:status==='encours'?`${fmt(total,sym)} collectés`:'Cycle passé'}
 </div>
 </div>
 ))}
 </div>
 </div>
 <div style={{display:'flex',gap:8,padding:'0 14px 8px'}}>
 <button onClick={printRapport} style={{flex:1,backgroundColor:C.g,color:'#fff',border:'none',borderRadius:8,padding:10,fontSize:12,fontWeight:700,cursor:'pointer'}}> Imprimer PDF</button>
 <button onClick={shareRapport} style={{flex:1,backgroundColor:'#25D366',color:'#fff',border:'none',borderRadius:8,padding:10,fontSize:12,fontWeight:700,cursor:'pointer'}}> WhatsApp PDF</button>
 </div>
 <div style={{textAlign:'center',padding:12,fontSize:10,color:C.text2}}>Powered by IZIsoft</div>
 </div>
 )
}

// PARAMETRES SCREEN
const Section=({icon,title,sub,bgIcon,children})=>{
 const [open,setOpen]=useState(false)
 return (
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

export function ParametresScreen({config,members,payments,payouts,onUpdateConfig,onReset,onSwitchTontine=null}) {
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

 const startPinChange=()=>{setPinError('');setPinSuccess(false);setPinFlow(hasPin?'verify':'new')}
 const cancelPin=()=>{setPinFlow(null);setNewPin('');setPinError('')}
 const handlePinStep=pin=>{
 if(pinFlow==='verify'){if(pin!==config.pin){setPinError('PIN incorrect');return}setPinError('');setPinFlow('new')}
 else if(pinFlow==='new'){setNewPin(pin);setPinFlow('confirm')}
 else if(pinFlow==='confirm'){
 if(pin!==newPin){setPinError('Les PIN ne correspondent pas');return}
 onUpdateConfig({...config,pin});setPinFlow(null);setNewPin('');setPinError('');setPinSuccess(true);setTimeout(()=>setPinSuccess(false),3000)
 }
 }
 const disablePin=()=>{setPinError('');setPinFlow('disable')}
 const handleDisableVerify=pin=>{
 if(pin!==config.pin){setPinError('PIN incorrect');return}
 const cfg={...config};delete cfg.pin;onUpdateConfig(cfg);setPinFlow(null);setPinError('');setPinSuccess(true);setTimeout(()=>setPinSuccess(false),3000)
 }
 const exportData=()=>{
 const blob=new Blob([JSON.stringify({config,members,payments,payouts},null,2)],{type:'application/json'})
 const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='izinjangi_backup.njg';a.click();URL.revokeObjectURL(url)
 }
 const exportCSV=()=>{
 const rows=[['Date','Membre','Tour','Cycle','Montant','Mode','Type','Reçu'],...payments.map(p=>[p.date,p.memberName,p.slotOrder||'',p.cycle,p.amount,p.mode,p.type,p.receiptNum||''])]
 const csv=rows.map(r=>r.join(',')).join('\n');const blob=new Blob([csv],{type:'text/csv'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='izinjangi_paiements.csv';a.click();URL.revokeObjectURL(url)
 }
 const resetApp=()=>{
 if(window.confirm(" Réinitialiser toute l'application ?"))
 if(window.confirm('IRRÉVERSIBLE — Confirmer ?')) onReset()
 }
 const pinModalProps=()=>{
 if(pinFlow==='verify') return {title:' Entrez votre PIN actuel', sub:'Vérification avant modification'}
 if(pinFlow==='new') return {title:' Nouveau PIN', sub:'Choisissez 4 chiffres'}
 if(pinFlow==='confirm') return {title:' Confirmer le nouveau PIN', sub:'Ressaisissez les 4 chiffres'}
 if(pinFlow==='disable') return {title:' Entrez votre PIN actuel', sub:'Pour désactiver la protection'}
 return {}
 }

 return (
 <div style={{flex:1,overflowY:'auto',paddingBottom:80}}>
 {pinFlow&&<PinModal {...pinModalProps()} error={pinError} onClearError={()=>setPinError('')} onConfirm={pinFlow==='disable'?handleDisableVerify:handlePinStep} onCancel={cancelPin}/>}
 <div style={{backgroundColor:C.g,padding:'14px 16px 16px'}}>
 <div style={{color:'#fff',fontSize:17,fontWeight:700}}> Paramètres</div>
 <div style={{color:'rgba(255,255,255,0.8)',fontSize:11,marginTop:2}}>{config.tontineName}</div>
 </div>
 <div style={{backgroundColor:C.gl,border:`1px solid #5DCAA5`,borderRadius:10,margin:'12px 14px',padding:14,display:'flex',alignItems:'center',gap:10}}>
 <div style={{width:36,height:36,borderRadius:9,backgroundColor:C.g,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><span style={{color:'#fff',fontSize:18,fontWeight:900}}></span></div>
 <div>
 <div style={{fontSize:14,fontWeight:700,color:C.gd}}>{config.tontineName}</div>
 <div style={{fontSize:11,color:C.g2,marginTop:2}}>{members.length} membres · {config.nbSlots||config.nbMembers||'?'} tours · {fmt(config.cotisation,sym)}/{config.frequency||'mois'}</div>
 <div style={{fontSize:11,color:C.text2,marginTop:1}}>Cycle {config.currentCycle||1} en cours</div>
 </div>
 </div>

 <Section icon="" bgIcon={C.gl} title="Tontine" sub="Nom, cotisation, cycle">
 <Item icon="" bg={C.gl} label="Nom de la tontine" sub={config.tontineName} right={<span style={{color:C.text2,fontSize:13}}>›</span>} onClick={()=>alert('Bientôt disponible')}/>
 <Item icon="" bg={C.ambl} label="Montant cotisation" sub={`${fmt(config.cotisation,sym)} / ${config.frequency||'mois'}`} right={<span style={{color:C.text2,fontSize:13}}>›</span>} onClick={()=>alert('Bientôt disponible')}/>
 <Item icon="" bg={C.bll} label="Nombre de tours" sub={`${config.nbSlots||config.nbMembers||'?'} tours`} right={<span style={{color:C.text2,fontSize:13}}>›</span>}/>
 <Item icon="" bg={C.ambl} label="Pénalité de retard (%)" sub={`${config.penaltyRate||0}% par cycle de retard`} right={<span style={{color:C.text2,fontSize:13}}>›</span>}
 onClick={()=>{
 const val=window.prompt('Taux de pénalité (%) — 0 pour désactiver :',config.penaltyRate||'0')
 if(val!==null&&!isNaN(Number(val))) onUpdateConfig({...config,penaltyRate:Number(val)})
 }}/>
 <Item icon="" bg={C.pur} label="Avancer au cycle suivant" sub={`Actuellement : Cycle ${config.currentCycle||1}`} right={<span style={{color:C.text2,fontSize:13}}>›</span>}
 onClick={()=>{if(window.confirm(`Passer au cycle ${(config.currentCycle||1)+1} ?`)){onUpdateConfig({...config,currentCycle:(config.currentCycle||1)+1});alert(' Cycle avancé !')}}}/>
 </Section>

 <Section icon="" bgIcon={C.pur} title="Impression & Partage" sub="PDF, WhatsApp, format reçu">
 <Item icon="" bg={C.pur} label="Format de reçu" sub="PDF A6 — Compatible 58mm" right={<Badge label=" Actif" type="ok"/>}/>
 <Item icon="" bg={C.gl} label="Partage WhatsApp" sub="Envoie le PDF en pièce jointe" right={<Badge label=" Actif" type="ok"/>}/>
 </Section>

 <Section icon="" bgIcon={C.rdl} title="Sécurité" sub={hasPin?' PIN activé':' PIN désactivé'}>
 {pinSuccess&&<div style={{margin:'10px 14px 0',backgroundColor:C.gl,border:`1px solid #5DCAA5`,borderRadius:8,padding:'8px 12px',fontSize:12,color:C.gd,fontWeight:600}}> {hasPin?'PIN mis à jour':'PIN désactivé'}</div>}
 <div style={{padding:'12px 14px'}}>
 <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
 <div style={{display:'flex',alignItems:'center',gap:10}}>
 <div style={{width:30,height:30,borderRadius:8,backgroundColor:C.rdl,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,flexShrink:0}}></div>
 <div>
 <div style={{fontSize:13,fontWeight:500,color:C.text}}>Code PIN</div>
 <div style={{fontSize:11,color:C.text2,marginTop:1}}>{hasPin?' Protection active — 4 chiffres':' Aucun PIN défini'}</div>
 </div>
 </div>
 <Toggle on={hasPin} onChange={hasPin?disablePin:startPinChange}/>
 </div>
 <button onClick={startPinChange} style={{width:'100%',padding:'9px 12px',backgroundColor:hasPin?C.pur:C.gl,color:hasPin?C.purd:C.gd,border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
 {hasPin?'Modifier le PIN':'Définir un PIN'}
 </button>
 </div>
 </Section>

 <Section icon="" bgIcon={C.bll} title="Données" sub="Export, statistiques, backup">
 <Item icon="" bg={C.ambl} label="Statistiques" sub={`${totalPay} paiements · ${totalPayout} versements · ${(dataSize/1024).toFixed(1)} Ko`}/>
 <Item icon="" bg={C.gl} label="Sauvegarde automatique" sub="Locale · Chaque action" right={<Toggle on={autoSave} onChange={()=>setAutoSave(v=>!v)}/>}/>
 <Item icon="" bg={C.gl} label="Exporter sauvegarde (.njg)" sub="Fichier complet JSON" right={<span style={{color:C.text2,fontSize:13}}>›</span>} onClick={exportData}/>
 <Item icon="" bg={C.bll} label="Exporter CSV" sub="Tous les paiements" right={<span style={{color:C.text2,fontSize:13}}>›</span>} onClick={exportCSV}/>
 </Section>

 <Section icon="" bgIcon={C.rdl} title="Zone de danger" sub="Réinitialisation">
 <Item icon="" bg={C.rdl} label="Réinitialiser l'application" sub="Supprime toutes les données — IRRÉVERSIBLE" right={<span style={{color:C.rd,fontSize:13}}>›</span>} onClick={resetApp}/>
 </Section>

 <div style={{textAlign:'center',padding:16,fontSize:11,color:C.text2}}>
 <div style={{fontWeight:700,color:C.g}}>IZI NJANGI v1.0</div>
 <div style={{marginTop:3,letterSpacing:0.4}}>Powered by IZIsoft</div>
 </div>
 </div>
 )
}

export default {TontineSelectScreen,SetupScreen,LockScreen,HomeScreen,MembresScreen,AddMembreScreen,PaiementScreen,ImpayesScreen,RapportScreen,ParametresScreen}
