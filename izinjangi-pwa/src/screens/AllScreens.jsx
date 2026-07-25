// ============================================================
// IZI NJANGI — AllScreens.jsx
// Design cohérent, iconographie lucide-react uniquement (zéro emoji)
// ============================================================
import { useState, useRef } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import izi360Mark from '../assets/logo-light.png'
import tontineLogoDefault from '../assets/logo-tontine.jpg'
import { getAppLogo, setAppLogo, resetAppLogo } from '../data/appIdentity'
import {
  ArrowLeft, Check, X, ChevronRight, Bell, Pencil, Coins, RotateCw,
  Crown, Printer, Share2, KeyRound, Lock, Package, TriangleAlert,
  Trash2, Save, Download, ClipboardList, Clock, Phone, Mail, Wallet,
  Users, BarChart3, Settings, Plus, CircleCheck, Banknote, UserPlus,
  UserMinus, Search, Repeat2, WalletCards, ReceiptText, ShieldCheck,
  CalendarClock, Percent, ImageUp, RotateCcw, Contact,
} from 'lucide-react'

import { FREQUENCY_UNITS, WEEKDAYS, buildFrequencyLabel, getNextDueDate, formatDueDate, resolveInputMode, clampFrequencyCount, MAX_MOIS_DAY } from '../data/frequency'

const C = {
  g:'#1D9E75', gd:'#085041', gl:'#E1F5EE', g2:'#0F6E56',
  amb:'#BA7517', ambl:'#FAEEDA', ambd:'#633806',
  rd:'#E24B4A', rdl:'#FCEBEB',
  bl:'#378ADD', bll:'#E6F1FB', bld:'#0C447C',
  gr:'#F1EFE8', grb:'#D3D1C7',
  bg:'#F4F4F0', white:'#FFFFFF', text:'#1A1A1A', text2:'#5F5E5A',
  pur:'#EEEDFE', purd:'#3C3489',
}

const fmt = (n,sym) => `${Number(n||0).toLocaleString('fr-FR')} ${sym}`
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'}) : ''
function daysDiffFromToday(date){ if(!date) return null; const t=new Date(); t.setHours(0,0,0,0); const d=new Date(date); d.setHours(0,0,0,0); return Math.round((d-t)/86400000) }
function isDuePassed(date){ const diff=daysDiffFromToday(date); return diff!==null && diff<0 }
function isDueTomorrow(date){ return daysDiffFromToday(date)===1 }
function isDueOneDayPassed(date){ return daysDiffFromToday(date)===-1 }
const fmtDateTime = (iso) => iso ? new Date(iso).toLocaleString('fr-FR',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : ''
const initials = (name='') => name.trim().split(' ').slice(0,2).map(w=>w[0]?.toUpperCase()||'').join('')
const genId = () => Date.now().toString(36)+Math.random().toString(36).slice(2,6)
const genRec = () => 'REC-'+Date.now().toString().slice(-6)
const uid = () => Math.random().toString(36).slice(2,10).toUpperCase()
const nowISO = () => new Date().toISOString()

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

const PAD_KEYS = [['1','2','3'],['4','5','6'],['7','8','9'],['','0','del']]

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
 try { const pdf = await elementToPDF(el); pdf.autoPrint(); window.open(pdf.output('bloburl'),'_blank') }
 catch(e){ console.error('PDF error',e); window.print() }
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
async function shareDocPDF(el,filename,phone,textMsg) {
 const digits=(phone||'').replace(/[^0-9]/g,'')
 const waUrl = digits ? `https://wa.me/${digits}?text=${encodeURIComponent(textMsg)}` : `https://wa.me/?text=${encodeURIComponent(textMsg)}`
 try {
 const pdf = await elementToPDF(el)
 const blob = pdf.output('blob')
 const file = new File([blob],filename,{type:'application/pdf'})
 if(navigator.share && navigator.canShare && navigator.canShare({files:[file]})){
 await navigator.share({files:[file],title:filename,text:textMsg}); return
 }
 const url = URL.createObjectURL(blob)
 const a = document.createElement('a'); a.href=url; a.download=filename; a.click()
 setTimeout(()=>{ URL.revokeObjectURL(url); window.open(waUrl,'_blank') },800)
 } catch(e){ window.open(waUrl,'_blank') }
}

/* ---------------------------- Composants partagés ---------------------------- */

const Avatar = ({name='',index=0,size=40}) => {
 const col = AV_COLORS[index%AV_COLORS.length]
 return <div style={{width:size,height:size,borderRadius:size/2,backgroundColor:col.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><span style={{color:col.fg,fontSize:size*0.32,fontWeight:700}}>{initials(name)}</span></div>
}
const ProgBar = ({pct,color=C.g}) => <div style={{height:5,backgroundColor:C.gr,borderRadius:3,overflow:'hidden'}}><div style={{height:'100%',width:`${Math.min(pct,100)}%`,backgroundColor:color,borderRadius:3}}/></div>
const Badge = ({label,type='ok',icon:Icon}) => {
 const cols={ok:{bg:C.gl,fg:C.gd},warn:{bg:C.ambl,fg:C.ambd},bad:{bg:C.rdl,fg:'#791F1F'},info:{bg:C.bll,fg:C.bld}}
 const col=cols[type]||cols.ok
 return <span style={{backgroundColor:col.bg,color:col.fg,fontSize:10,fontWeight:700,padding:'3px 9px',borderRadius:20,display:'inline-flex',alignItems:'center',gap:4}}>{Icon && <Icon size={11}/>}{label}</span>
}
const Toggle = ({on,onChange}) => (
 <div onClick={e=>{e.stopPropagation();onChange()}} style={{width:42,height:24,borderRadius:12,backgroundColor:on?C.g:C.grb,cursor:'pointer',position:'relative',flexShrink:0}}>
 <div style={{position:'absolute',top:3,left:on?21:3,width:18,height:18,borderRadius:9,backgroundColor:'#fff',transition:'left .15s'}}/>
 </div>
)
const IconCircle = ({icon:Icon, bg, fg, size=36, iconSize=17}) => (
  <div style={{width:size,height:size,borderRadius:size*0.28,backgroundColor:bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
    <Icon size={iconSize} color={fg} strokeWidth={2}/>
  </div>
)

// Logo de la tontine : image personnalisée si définie, sinon le symbole IZI360
const Logo = ({ src, size=36, bg='#fff', radius, border }) => (
  <div style={{width:size,height:size,borderRadius:radius??size*0.26,backgroundColor:bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,overflow:'hidden',border:border?`1px solid ${C.grb}`:'none'}}>
    {src
      ? <img src={src} alt="Logo" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
      : <img src={izi360Mark} alt="IZI360" style={{width:'78%',height:'78%',objectFit:'contain'}}/>}
  </div>
)

// Redimensionne une image uploadée en carré (max 256px) pour rester léger en localStorage
function resizeImageFile(file, maxSize=256) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const img = new window.Image()
      img.onerror = reject
      img.onload = () => {
        const side = Math.min(img.width, img.height)
        const sx = (img.width - side) / 2
        const sy = (img.height - side) / 2
        const canvas = document.createElement('canvas')
        canvas.width = maxSize
        canvas.height = maxSize
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, sx, sy, side, side, 0, 0, maxSize, maxSize)
        resolve(canvas.toDataURL('image/png', 0.9))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}
const BackBtn = ({onClick, dark}) => (
  <button onClick={onClick} style={{background:'rgba(255,255,255,0.16)',border:'none',borderRadius:9,width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0}}>
    <ArrowLeft size={18} color={dark?C.text:'#fff'}/>
  </button>
)

const PinModal = ({title,sub,onConfirm,onCancel,error,onClearError}) => {
 const [pin,setPin] = useState('')
 const press = k => { if(error) onClearError(); if(pin.length<4) setPin(p=>p+k) }
 const del = () => { if(error) onClearError(); setPin(p=>p.slice(0,-1)) }
 const confirm = () => { if(pin.length<4) return; onConfirm(pin); setPin('') }
 return (
 <div style={{position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.55)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
 <div style={{width:'100%',maxWidth:480,backgroundColor:C.gd,borderRadius:'20px 20px 0 0',padding:'24px 20px calc(env(safe-area-inset-bottom) + 24px)'}}>
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
 <button key={ki} onClick={()=>k==='del'?del():k&&press(k)} disabled={!k&&k!=='0'}
 style={{width:68,height:68,borderRadius:34,backgroundColor:k?'rgba(255,255,255,0.15)':'transparent',border:'none',color:'#fff',fontSize:20,fontWeight:600,cursor:k?'pointer':'default',opacity:k||k==='0'?1:0,fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center'}}>
   {k==='del' ? <X size={20}/> : k}
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

function ConfirmModal({title,message,confirmLabel='Confirmer',cancelLabel='Annuler',danger,onConfirm,onCancel}) {
 return (
 <div style={{position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.55)',zIndex:220,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
 <div style={{width:'100%',maxWidth:380,backgroundColor:C.white,borderRadius:16,padding:20}}>
 <div style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:10}}>{title}</div>
 <div style={{fontSize:13,color:C.text2,lineHeight:1.5}}>{message}</div>
 <div style={{display:'flex',gap:10,marginTop:20}}>
 <button onClick={onCancel} style={{flex:1,padding:12,backgroundColor:C.gr,color:C.text2,border:'none',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>{cancelLabel}</button>
 <button onClick={onConfirm} style={{flex:1,padding:12,backgroundColor:danger?C.rd:C.g,color:'#fff',border:'none',borderRadius:10,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>{confirmLabel}</button>
 </div>
 </div>
 </div>
 )
}

function EditFieldModal({title,placeholder,initialValue,multiline,type='text',onSave,onCancel}) {
 const [val,setVal]=useState(initialValue??'')
 return (
 <div style={{position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.55)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
 <div style={{width:'100%',maxWidth:480,backgroundColor:C.white,borderRadius:'20px 20px 0 0',padding:'20px 20px calc(env(safe-area-inset-bottom) + 20px)'}}>
 <div style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:14}}>{title}</div>
 {multiline ? (
 <textarea autoFocus value={val} onChange={e=>setVal(e.target.value)} placeholder={placeholder} rows={4}
 style={{width:'100%',padding:'10px 12px',fontSize:14,borderRadius:8,border:`1px solid ${C.grb}`,outline:'none',fontFamily:'inherit',resize:'none',boxSizing:'border-box'}}/>
 ) : (
 <input autoFocus type={type} value={val} onChange={e=>setVal(e.target.value)} placeholder={placeholder}
 style={{width:'100%',padding:'10px 12px',fontSize:14,borderRadius:8,border:`1px solid ${C.grb}`,outline:'none',boxSizing:'border-box'}}/>
 )}
 <div style={{display:'flex',gap:10,marginTop:18}}>
 <button onClick={onCancel} style={{flex:1,padding:12,backgroundColor:C.gr,color:C.text2,border:'none',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Annuler</button>
 <button onClick={()=>onSave(val)} style={{flex:1,padding:12,backgroundColor:C.g,color:'#fff',border:'none',borderRadius:10,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>Enregistrer</button>
 </div>
 </div>
 </div>
 )
}

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
 <div style={{color:'#fff',fontSize:16,fontWeight:700}}>Tableau des tours</div>
 <div style={{color:'rgba(255,255,255,0.8)',fontSize:11,marginTop:2}}>{nbSlots} tours · {config.tontineName}</div>
 </div>
 <button onClick={onClose} style={{background:'rgba(255,255,255,0.16)',border:'none',borderRadius:8,width:30,height:30,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}><X size={16} color="#fff"/></button>
 </div>
 <div style={{overflowY:'auto',padding:'12px 14px',display:'flex',flexDirection:'column',gap:8,paddingBottom:30}}>
 {slots.map(({order,member,payout,status})=>{
 const statusLabel=status==='cloture'?'Versé':status==='encours'?'En cours':status==='passe'?'Passé':'À venir'
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

const SetupHeader = ({title,sub,step,onBack}) => (
 <div style={{backgroundColor:C.g,padding:'calc(env(safe-area-inset-top) + 14px) 16px 16px'}}>
 <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
 {step>0&&<BackBtn onClick={onBack}/>}
 <div>
 <h2 style={{color:'#fff',fontSize:17,fontWeight:700,margin:0}}>{title}</h2>
 {sub&&<p style={{color:'rgba(255,255,255,0.8)',fontSize:11,margin:'2px 0 0'}}>{sub}</p>}
 </div>
 </div>
 </div>
)

/* ---------------------------- Sélection de tontine ---------------------------- */

export function TontineSelectScreen({tontines, onSelect, onNew, onExit}) {
 return (
 <div style={{height:'100vh',maxWidth:480,margin:'0 auto',backgroundColor:C.g,display:'flex',flexDirection:'column'}}>
 <div style={{padding:'calc(env(safe-area-inset-top) + 24px) 24px 20px',textAlign:'center'}}>
 {onExit && (
   <div style={{textAlign:'left',marginBottom:8}}>
     <BackBtn onClick={onExit}/>
   </div>
 )}
 <div style={{width:60,height:60,backgroundColor:'rgba(255,255,255,0.2)',borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px'}}>
 <img src={getAppLogo() || tontineLogoDefault} alt="Logo" style={{width:'70%',height:'70%',objectFit:'contain',borderRadius:8}}/>
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
 <ChevronRight size={18} color={C.g}/>
 </button>
 ))}
 </div>
 <button onClick={onNew} style={{width:'100%',padding:14,backgroundColor:C.g,color:'#fff',border:'none',borderRadius:14,fontSize:15,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
 <Plus size={18}/> Créer une nouvelle tontine
 </button>
 <p style={{textAlign:'center',fontSize:11,color:C.text2,marginTop:16}}>Powered by IZIsoft</p>
 </div>
 </div>
 )
}

/* ---------------------------- Setup (création) ---------------------------- */

export function SetupScreen({onDone, existingUsernames=[], onBack=null}) {
 const [step,setStep]=useState(0)
 const [form,setForm]=useState({tontineName:'',adminName:'',phone:'',cotisation:'',frequencyUnit:'mois',frequencyCount:1,cotisationDates:[],cotisationDays:[],currency:null,nbSlots:'',username:'',pin:'',pinConfirm:''})
 const [currSearch,setCurrSearch]=useState('')
 const [pinError,setPinError]=useState('')
 const filteredCurr=CURRENCIES.filter(c=>c.name.toLowerCase().includes(currSearch.toLowerCase())||c.code.toLowerCase().includes(currSearch.toLowerCase()))
 const back=()=>setStep(s=>s-1)
 const next=()=>{
 if(step===1){
 if(!form.tontineName.trim()) return alert('Nom de la tontine obligatoire.')
 if(!form.adminName.trim()) return alert('Votre nom est obligatoire.')
 if(!form.cotisation||isNaN(Number(form.cotisation))) return alert('Montant de cotisation invalide.')
 if(FREQUENCY_UNITS[form.frequencyUnit]?.needsCount){
 const {mode,effectiveCount}=resolveInputMode(form.frequencyUnit,form.frequencyCount)
 const vals=mode==='dates'?form.cotisationDates:form.cotisationDays
 if(vals.filter(Boolean).length<effectiveCount) return alert("Renseignez toutes les valeurs demandées, dans l'ordre.")
 }
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
 const config={tontineName:form.tontineName,adminName:form.adminName,phone:form.phone,cotisation:Number(form.cotisation),frequency:buildFrequencyLabel(form.frequencyUnit,form.frequencyCount),frequencyUnit:form.frequencyUnit,frequencyCount:form.frequencyCount,cotisationDates:form.cotisationDates,cotisationDays:form.cotisationDays,currency:form.currency,username:form.username.trim().toLowerCase(),pin:form.pin,createdAt:nowISO(),currentCycle:1,nbSlots:Number(form.nbSlots)||0,nbMembers:Number(form.nbSlots)||0,penaltyRate:0}
 onDone(config)
 }
 const inp={backgroundColor:C.white,border:`1px solid ${C.grb}`,borderRadius:8,padding:'10px 12px',fontSize:14,width:'100%',color:C.text,outline:'none',marginTop:4,boxSizing:'border-box',maxWidth:'100%'}
 const lbl={fontSize:12,color:C.text2,fontWeight:600}
 const btn={backgroundColor:C.g,color:'#fff',border:'none',borderRadius:12,padding:13,fontSize:15,fontWeight:700,cursor:'pointer',marginTop:8,width:'100%'}

 if(step===0) return (
 <div style={{height:'100vh',maxWidth:480,margin:'0 auto',backgroundColor:C.g,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24}}>
 <div style={{width:80,height:80,backgroundColor:'rgba(255,255,255,0.2)',borderRadius:20,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:20}}>
   <img src={getAppLogo() || tontineLogoDefault} alt="Logo" style={{width:'70%',height:'70%',objectFit:'contain',borderRadius:10}}/>
 </div>
 <h1 style={{color:'#fff',fontSize:32,fontWeight:800,letterSpacing:1,margin:0}}>IZI NJANGI</h1>
 <p style={{color:'rgba(255,255,255,0.8)',fontSize:16,textAlign:'center',marginTop:8,lineHeight:'24px'}}>Gestion de tontine<br/>simple et fiable</p>
 <button onClick={()=>setStep(1)} style={{backgroundColor:'#fff',color:C.g,border:'none',borderRadius:14,padding:'14px 28px',marginTop:40,fontSize:16,fontWeight:800,cursor:'pointer'}}>Créer ma tontine</button>
 <p style={{color:'rgba(255,255,255,0.6)',fontSize:12,textAlign:'center',marginTop:20}}>100% hors ligne · Données locales</p>
 {onBack&&<button onClick={onBack} style={{background:'none',border:'1px solid rgba(255,255,255,0.4)',borderRadius:10,padding:'10px 24px',color:'rgba(255,255,255,0.8)',fontSize:13,cursor:'pointer',marginTop:12}}>Retour à mes tontines</button>}
 </div>
 )
 if(step===1) return (
 <div style={{height:'100vh',maxWidth:480,margin:'0 auto',display:'flex',flexDirection:'column',backgroundColor:C.bg}}>
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
 <div style={{backgroundColor:C.gl,border:'1px solid #5DCAA5',borderRadius:8,padding:'10px 12px',display:'flex',gap:8,alignItems:'flex-start'}}>
 <CalendarClock size={15} color={C.gd} style={{marginTop:1,flexShrink:0}}/>
 <div>
   <div style={{fontSize:12,color:C.gd,fontWeight:600}}>Nombre de tours</div>
   <div style={{fontSize:12,color:C.g2,marginTop:2}}>Défini automatiquement selon les places attribuées aux membres.</div>
 </div>
 </div>
 <div>
 <label style={lbl}>Unité de cotisation</label>
 <div style={{display:'flex',gap:8,marginTop:6}}>
 {Object.values(FREQUENCY_UNITS).map(u=>(
 <button key={u.key} onClick={()=>setForm(p=>({...p,frequencyUnit:u.key,frequencyCount:1,cotisationDates:[],cotisationDays:[]}))}
 style={{flex:1,padding:'8px 0',borderRadius:8,border:`2px solid ${form.frequencyUnit===u.key?C.g:C.grb}`,backgroundColor:form.frequencyUnit===u.key?C.gl:C.white,color:form.frequencyUnit===u.key?C.gd:C.text2,fontSize:13,fontWeight:700,cursor:'pointer'}}>{u.label}</button>
 ))}
 </div>
 </div>
 {FREQUENCY_UNITS[form.frequencyUnit]?.needsCount && (()=>{
 const unitDef=FREQUENCY_UNITS[form.frequencyUnit]
 const {mode,effectiveCount}=resolveInputMode(form.frequencyUnit,form.frequencyCount)
 return (
 <>
 <div>
 <label style={lbl}>Nombre de fois par {form.frequencyUnit} <span style={{color:C.text2,fontWeight:400}}>(max {unitDef.maxCount})</span></label>
 <input style={inp} type="number" min="1" max={unitDef.maxCount} placeholder="Ex: 2" value={form.frequencyCount}
 onChange={e=>{
 const n=clampFrequencyCount(form.frequencyUnit,e.target.value)
 setForm(p=>({...p,frequencyCount:n,cotisationDates:[],cotisationDays:[]}))
 }}/>
 {form.frequencyUnit==='mois' && form.frequencyCount>0 && form.frequencyCount%4===0 && (
 <div style={{marginTop:6,backgroundColor:C.pur,borderRadius:6,padding:'6px 10px',fontSize:11,color:C.purd}}>
 {form.frequencyCount}x/mois équivaut à {effectiveCount>1?`${effectiveCount} jours`:'1 jour'} fixe{effectiveCount>1?'s':''} par semaine — choisissez {effectiveCount>1?'les jours':'le jour'} ci-dessous.
 </div>
 )}
 </div>
 {mode==='dates' && (
 <div>
 <label style={lbl}>Date{effectiveCount>1?'s':''} exacte{effectiveCount>1?'s':''} (jour du mois, max {MAX_MOIS_DAY})</label>
 <div style={{display:'flex',gap:8,marginTop:4,flexWrap:'wrap'}}>
 {Array.from({length:effectiveCount},(_,i)=>i).map(i=>{
 const prevVal=i>0?form.cotisationDates[i-1]:null
 const disabled=i>0 && !prevVal
 const options=Array.from({length:MAX_MOIS_DAY},(_,d)=>d+1).filter(d=>!prevVal||d>prevVal)
 return (
 <select key={i} disabled={disabled} style={{...inp,cursor:disabled?'not-allowed':'pointer',flex:'1 1 90px',opacity:disabled?0.5:1}} value={form.cotisationDates[i]||''}
 onChange={e=>{
 const v=Number(e.target.value)
 setForm(p=>{ const arr=[...p.cotisationDates]; arr[i]=v; for(let j=i+1;j<arr.length;j++) arr[j]=''; return {...p,cotisationDates:arr} })
 }}>
 <option value="">Date {i+1}</option>
 {options.map(d=><option key={d} value={d}>{d}</option>)}
 </select>
 )
 })}
 </div>
 </div>
 )}
 {mode==='days' && (
 <div>
 <label style={lbl}>Jour{effectiveCount>1?'s':''} exact{effectiveCount>1?'s':''} de la semaine</label>
 <div style={{display:'flex',gap:8,marginTop:4,flexWrap:'wrap'}}>
 {Array.from({length:effectiveCount},(_,i)=>i).map(i=>{
 const prevVal=i>0?form.cotisationDays[i-1]:null
 const prevIdx=prevVal?WEEKDAYS.indexOf(prevVal):-1
 const disabled=i>0 && !prevVal
 const options=WEEKDAYS.filter((_,idx)=>idx>prevIdx)
 return (
 <select key={i} disabled={disabled} style={{...inp,cursor:disabled?'not-allowed':'pointer',flex:'1 1 140px',opacity:disabled?0.5:1}} value={form.cotisationDays[i]||''}
 onChange={e=>{
 const v=e.target.value
 setForm(p=>{ const arr=[...p.cotisationDays]; arr[i]=v; for(let j=i+1;j<arr.length;j++) arr[j]=''; return {...p,cotisationDays:arr} })
 }}>
 <option value="">Jour {i+1}</option>
 {options.map(d=><option key={d} value={d}>{d}</option>)}
 </select>
 )
 })}
 </div>
 </div>
 )}
 </>
 )
 })()}
 <button onClick={next} style={btn}>Suivant — Choisir la devise</button>
 </div>
 </div>
 )
 if(step===2) return (
 <div style={{height:'100vh',maxWidth:480,margin:'0 auto',display:'flex',flexDirection:'column',backgroundColor:C.bg}}>
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
 {form.currency?.code===item.code&&<Check size={20} color={C.g}/>}
 </div>
 ))}
 </div>
 <div style={{padding:16}}>
 <button onClick={next} style={{...btn,marginTop:0}}>Suivant — Identifiants</button>
 </div>
 </div>
 )
 if(step===3) return (
 <div style={{height:'100vh',maxWidth:480,margin:'0 auto',display:'flex',flexDirection:'column',backgroundColor:C.bg}}>
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
 <div style={{backgroundColor:C.ambl,border:`1px solid #FAC775`,borderRadius:8,padding:10,display:'flex',gap:8}}>
   <TriangleAlert size={15} color={C.ambd} style={{marginTop:1,flexShrink:0}}/>
   <p style={{fontSize:12,color:C.ambd,margin:0}}>Notez bien vos identifiants. En cas d'oubli, vous devrez réinitialiser l'app.</p>
 </div>
 <button onClick={next} style={btn}>Créer ma tontine</button>
 </div>
 </div>
 )
 return null
}

/* ---------------------------- Verrouillage ---------------------------- */

export function LockScreen({config,onUnlock,onForgotPin}) {
 const [username,setUsername]=useState('')
 const [pin,setPin]=useState('')
 const [err,setErr]=useState('')
 const [forgot,setForgot]=useState(false)
 const [confirmName,setConfirmName]=useState('')
 const press=d=>{
 const np=pin+d; setPin(np); setErr('')
 if(np.length===4){
 if(username.trim().toLowerCase()!==config.username.trim().toLowerCase()){setErr("Nom d'utilisateur incorrect");setPin('');return}
 if(np!==config.pin){setErr('PIN incorrect');setPin('')}
 else onUnlock()
 }
 }
 const del=()=>setPin(p=>p.slice(0,-1))

 if(forgot) return (
 <div style={{height:'100vh',maxWidth:480,margin:'0 auto',backgroundColor:C.gd,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24}}>
   <IconCircle icon={TriangleAlert} bg="rgba(255,255,255,0.15)" fg="#fff" size={64} iconSize={30}/>
   <h1 style={{color:'#fff',fontSize:19,fontWeight:800,marginTop:16,textAlign:'center'}}>PIN oublié</h1>
   <p style={{color:'rgba(255,255,255,0.75)',fontSize:13,textAlign:'center',marginTop:10,lineHeight:'19px',maxWidth:320}}>
     Cette tontine n'est stockée que sur cet appareil, hors ligne. Il n'existe aucun moyen de récupérer le PIN à distance.
     La seule option est de réinitialiser <strong>{config.tontineName}</strong> : membres, paiements et historique seront <strong>définitivement supprimés</strong>.
   </p>
   <div style={{width:'100%',maxWidth:300,marginTop:20}}>
     <label style={{fontSize:12,color:'rgba(255,255,255,0.7)',fontWeight:600}}>Tapez « {config.tontineName} » pour confirmer</label>
     <input value={confirmName} onChange={e=>setConfirmName(e.target.value)}
       style={{width:'100%',backgroundColor:'rgba(255,255,255,0.12)',border:'1px solid rgba(255,255,255,0.3)',borderRadius:8,padding:'10px 12px',fontSize:14,color:'#fff',outline:'none',marginTop:6,boxSizing:'border-box'}}/>
   </div>
   <button
     disabled={confirmName.trim()!==config.tontineName.trim()}
     onClick={()=>onForgotPin?.()}
     style={{width:'100%',maxWidth:300,marginTop:14,padding:13,backgroundColor:confirmName.trim()===config.tontineName.trim()?C.rd:'rgba(255,255,255,0.12)',color:'#fff',border:'none',borderRadius:12,fontSize:14,fontWeight:700,cursor:confirmName.trim()===config.tontineName.trim()?'pointer':'default'}}>
     Réinitialiser définitivement
   </button>
   <button onClick={()=>{setForgot(false);setConfirmName('')}} style={{background:'none',border:'none',color:'rgba(255,255,255,0.75)',fontSize:13,cursor:'pointer',padding:10,marginTop:6}}>
     Annuler, retour à la connexion
   </button>
 </div>
 )

 return (
 <div style={{height:'100vh',maxWidth:480,margin:'0 auto',backgroundColor:C.g,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24}}>
 <div style={{width:64,height:64,backgroundColor:'rgba(255,255,255,0.2)',borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:12}}>
   <Lock size={30} color="#fff"/>
 </div>
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
 <button key={ki} onClick={()=>k==='del'?del():k&&press(k)} disabled={!k}
 style={{width:72,height:72,borderRadius:36,backgroundColor:k?'rgba(255,255,255,0.15)':'transparent',border:'none',color:'#fff',fontSize:22,fontWeight:600,cursor:k?'pointer':'default',opacity:k?1:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
   {k==='del' ? <X size={22}/> : k}
 </button>
 ))}
 </div>
 ))}
 </div>
 <button onClick={()=>setForgot(true)} style={{background:'none',border:'none',color:'rgba(255,255,255,0.75)',fontSize:13,fontWeight:600,cursor:'pointer',padding:12,marginTop:8,textDecoration:'underline'}}>
   PIN oublié ?
 </button>
 </div>
 )
}

/* ---------------------------- Accueil ---------------------------- */

export function HomeScreen({config,members,payments,payouts,cycles,forcedAdvances=[],nav}) {
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

 const dueDate=config.frequencyUnit?getNextDueDate(config):null
 const unpaidMembersList=unpaidMemberIds.map(id=>members.find(m=>m.id===id)).filter(Boolean)
 const notifications=[]
 if(dueDate&&isDuePassed(dueDate)&&unpaidMembersList.length>0){
 notifications.push({id:'retard',type:'retard',title:'Retard de cotisation',sub:`${unpaidMembersList.map(m=>m.name).join(', ')} — Cycle ${currentCycle}`,icon:TriangleAlert,bg:C.rdl,fg:C.rd,members:unpaidMembersList,cycle:currentCycle})
 }
 if(dueDate&&isDueTomorrow(dueDate)&&unpaidMembersList.length>0){
 notifications.push({id:'rappel',type:'rappel',title:'Rappel : demain dernier jour de paie',sub:`${unpaidMembersList.map(m=>m.name).join(', ')} n'ont pas encore payé`,icon:CalendarClock,bg:C.ambl,fg:C.ambd,members:unpaidMembersList,cycle:currentCycle})
 }
 const cycleVerse=payouts.some(p=>p.cycle===currentCycle)
 if(dueDate&&isDueOneDayPassed(dueDate)&&!cycleVerse){
 notifications.push({id:'attente',type:'attente',title:'Versement en attente',sub:`La cagnotte du cycle ${currentCycle} n'a pas encore été versée`,icon:Banknote,bg:C.pur,fg:C.purd,cycle:currentCycle})
 }
 forcedAdvances.forEach(f=>{
 const fm=members.find(m=>m.id===f.memberId)
 notifications.push({id:'forced-'+f.id,type:'forced',title:'Versement en retard',sub:`Faute de cotisation de ${f.memberName} — Cycle ${f.cycle}`,icon:TriangleAlert,bg:C.rdl,fg:C.rd,members:fm?[fm]:[],cycle:f.cycle})
 })

 const quickActions = [
   { Icon:Wallet,      label:'Enregistrer\npaiement', color:C.gl,  fg:C.gd,  screen:'paiement'  },
   { Icon:Banknote,    label:'Verser\ncagnotte',      color:C.pur, fg:C.purd,screen:'versement' },
   { Icon:Users,       label:'Membres',               color:C.bll, fg:C.bld, screen:'membres'   },
   { Icon:BarChart3,   label:'Rapports',              color:C.ambl,fg:C.ambd,screen:'rapport'   },
 ]

 return (
 <div style={{flex:1,overflowY:'auto',paddingBottom:70}}>
 {showCycles&&<CyclesModal config={config} members={members} payments={payments} payouts={payouts} onClose={()=>setShowCycles(false)}/>}
 <div style={{backgroundColor:C.g,padding:'calc(env(safe-area-inset-top) + 14px) 16px 20px'}}>
 <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
 <div style={{display:'flex',alignItems:'center',gap:9}}>
 <Logo src={config.logo} size={34} bg="#fff" radius={9}/>
 <div>
 <div style={{color:'#fff',fontSize:17,fontWeight:700,letterSpacing:0.3}}>IZI NJANGI</div>
 <div style={{color:'rgba(255,255,255,0.75)',fontSize:10,letterSpacing:0.5}}>GESTION DE TONTINE</div>
 </div>
 </div>
 <button onClick={()=>nav('notifications')} style={{width:36,height:36,borderRadius:18,backgroundColor:'rgba(255,255,255,0.18)',border:'none',cursor:'pointer',position:'relative',display:'flex',alignItems:'center',justifyContent:'center'}}>
 <Bell size={17} color="#fff"/>
 {notifications.length>0&&<span style={{position:'absolute',top:-2,right:-2,backgroundColor:C.rd,color:'#fff',fontSize:9,fontWeight:700,borderRadius:8,minWidth:16,height:16,display:'flex',alignItems:'center',justifyContent:'center',padding:'0 3px'}}>{notifications.length}</span>}
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
 {config.frequencyUnit && (()=>{
   const due=getNextDueDate(config)
   return (
     <div style={{display:'flex',alignItems:'center',gap:10,backgroundColor:C.bll,border:`1px solid ${C.bl}`,borderRadius:8,margin:'8px 14px 0',padding:10}}>
       <IconCircle icon={CalendarClock} bg={C.bl} fg="#fff" size={30} iconSize={14}/>
       <div>
         <div style={{fontSize:12,color:C.bld,fontWeight:600}}>{config.frequency}</div>
         <div style={{fontSize:11,color:C.bld,marginTop:1}}>{config.frequencyUnit==='jour'?'Cotisation attendue chaque jour':due?`Prochaine échéance : ${formatDueDate(due)}`:'Configurez les dates/jours dans les paramètres'}</div>
       </div>
     </div>
   )
 })()}

 <div style={{display:'flex',gap:8,padding:12}}>
 {quickActions.map(q=>(
 <button key={q.screen} onClick={()=>nav(q.screen)}
 style={{flex:1,backgroundColor:C.white,border:`1px solid ${C.grb}`,borderRadius:12,padding:10,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
 <IconCircle icon={q.Icon} bg={q.color} fg={q.fg} size={36} iconSize={17}/>
 <span style={{fontSize:10,color:C.text2,fontWeight:500,textAlign:'center',lineHeight:'13px',whiteSpace:'pre-line'}}>{q.label}</span>
 </button>
 ))}
 </div>

 {unpaidSlots.length>0&&(
 <button onClick={()=>nav('impayes')} style={{display:'flex',alignItems:'center',gap:10,backgroundColor:C.ambl,border:`1px solid #FAC775`,borderRadius:8,margin:'0 14px 8px',padding:10,cursor:'pointer',width:'calc(100% - 28px)',textAlign:'left'}}>
 <IconCircle icon={TriangleAlert} bg="#FAC775" fg={C.ambd} size={26} iconSize={13}/>
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
 <Badge label="Actif" type="ok" icon={CircleCheck}/>
 <span style={{fontSize:11,color:C.g,fontWeight:600}}>Voir tours</span>
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
 <div key={p.id} style={{backgroundColor:C.white,borderRadius:12,border:`1px solid ${C.grb}`,padding:12,display:'flex',alignItems:'center',gap:10}}>
 <IconCircle icon={p.type==='versement'?Banknote:Wallet} bg={p.type==='versement'?C.rdl:C.gl} fg={p.type==='versement'?C.rd:C.g} size={32} iconSize={15}/>
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

/* ---------------------------- Membres ---------------------------- */

export function MembresScreen({members,payments,config,onAddMember,onSelectMember}) {
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
 <div style={{backgroundColor:C.g,padding:'calc(env(safe-area-inset-top) + 14px) 16px 16px'}}>
 <div style={{color:'#fff',fontSize:17,fontWeight:700}}>Membres</div>
 <div style={{color:'rgba(255,255,255,0.8)',fontSize:11,marginTop:2}}>{members.length} membre{members.length>1?'s':''} · {members.reduce((s,m)=>s+(m.slots?.length||1),0)} places</div>
 </div>
 <div style={{padding:'12px 14px 8px',display:'flex',gap:8}}>
 <div style={{flex:1,position:'relative'}}>
   <Search size={15} color={C.text2} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)'}}/>
   <input style={{width:'100%',backgroundColor:C.white,border:`1px solid ${C.grb}`,borderRadius:8,padding:'8px 12px 8px 32px',fontSize:13,color:C.text,outline:'none',boxSizing:'border-box'}} placeholder="Rechercher..." value={search} onChange={e=>setSearch(e.target.value)}/>
 </div>
 <button onClick={onAddMember} style={{backgroundColor:C.g,color:'#fff',border:'none',borderRadius:8,padding:'8px 14px',fontSize:13,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:6}}><Plus size={15}/> Ajouter</button>
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
 <Badge label={st==='actif'?'Payé':st==='impaye'?'Retard':'Sorti'} type={st==='actif'?'ok':st==='impaye'?'warn':'bad'}/>
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

/* ---------------------------- Ajout membre ---------------------------- */

export function AddMembreScreen({members,config,payouts=[],onBack,onSave}) {
 const sym=config.currency?.symbol||config.currency?.code||'F'
 const usedOrders=members.flatMap(m=>m.slots?m.slots.map(s=>s.order):[m.order]).filter(Boolean)
 const maxUsed=usedOrders.length?Math.max(...usedOrders):0
 const freeOrders=Array.from({length:100},(_,i)=>maxUsed+i+1)
 const versedCycles=payouts.length
 const catchupTotal=(config?.cotisation||0)*versedCycles
 const [catchupStep,setCatchupStep]=useState(false)
 const [form,setForm]=useState({name:'',phone:'',email:'',address:'',travail:'',photo:'',joinDate:new Date().toISOString().split('T')[0],contactName:'',contactPhone:'',contactEmail:'',contactAddress:'',contactTravail:'',contactPhoto:'',photoName:'',contactPhotoName:'',contactRelation:''})
 const [nbP,setNbP]=useState(1)
 const [step,setStep]=useState(1)
 const [errors,setErrors]=useState({})
 const memberPhotoRef=useRef(null)
 const contactPhotoRef=useRef(null)
 const [photoBusy,setPhotoBusy]=useState('')
 const [savedMember,setSavedMember]=useState(null)
 const [catchupReceipt,setCatchupReceipt]=useState(null)
 const [postStage,setPostStage]=useState(null)
 const reglementRef=useRef(null)
 const catchupRef=useRef(null)
 const pickPhoto=(field)=>{ if(field==='photo') memberPhotoRef.current?.click(); else contactPhotoRef.current?.click() }
 const handlePhotoFile=(field)=>{
 return async(e)=>{
 const file=e.target.files?.[0]
 e.target.value=''
 if(!file) return
 if(!file.type.startsWith('image/')) return alert('Choisissez un fichier image.')
 setPhotoBusy(field)
 const nameField=field==='photo'?'photoName':'contactPhotoName'
 try{ const dataUrl=await resizeImageFile(file); setForm(p=>({...p,[field]:dataUrl,[nameField]:file.name})) }
 catch{ alert("Impossible de charger l'image.") }
 finally{ setPhotoBusy('') }
 }
 }

 const contactPickSupported = typeof navigator!=='undefined' && 'contacts' in navigator && typeof navigator.contacts?.select==='function'
 const [pickError,setPickError]=useState('')
 const pickContact=async(target)=>{
 if(!contactPickSupported){ setPickError("Sélection de contact non disponible sur cet appareil."); return }
 try{
 const results=await navigator.contacts.select(['name','tel'],{multiple:false})
 if(!results||!results.length) return
 const c=results[0]
 const name=(c.name&&c.name[0])||''
 const tel=(c.tel&&c.tel[0])||''
 if(target==='member') setForm(p=>({...p,name:p.name||name,phone:tel||p.phone}))
 else setForm(p=>({...p,contactName:p.contactName||name,contactPhone:tel||p.contactPhone}))
 setPickError('')
 }catch(err){ setPickError("Impossible d'accéder aux contacts.") }
 }


 const lbl={fontSize:12,fontWeight:600,color:C.text2,marginBottom:3,display:'block'}
 const inp={backgroundColor:C.white,border:`1px solid ${C.grb}`,borderRadius:8,padding:'10px 12px',fontSize:14,width:'100%',color:C.text,outline:'none',marginTop:4,boxSizing:'border-box',maxWidth:'100%'}

 const validate=()=>{
 const e={}
 if(!form.name.trim()) e.name='Le nom est obligatoire.'
 else if(members.some(m=>m.name.toLowerCase()===form.name.trim().toLowerCase())) e.name=`"${form.name.trim()}" existe déjà.`
 if(!form.phone.trim()) e.phone='Le téléphone est obligatoire.'
 setErrors(e)
 return Object.keys(e).length===0
 }

 const goNext=()=>{ if(validate()) setStep(2) }

 const buildMember=()=>{
 const assigned=Array.from({length:nbP},(_,i)=>({slotId:genId(),order:maxUsed+i+1,slotNum:i+1}))
 return {id:Date.now().toString(),name:form.name.trim(),phone:form.phone.trim(),email:form.email.trim(),address:form.address.trim(),travail:form.travail.trim(),photo:form.photo,joinDate:form.joinDate,status:'actif',slots:assigned,order:assigned[0]?.order,
   contact:(form.contactName.trim()||form.contactPhone.trim())?{name:form.contactName.trim(),phone:form.contactPhone.trim(),email:form.contactEmail.trim(),address:form.contactAddress.trim(),travail:form.contactTravail.trim(),photo:form.contactPhoto,relation:form.contactRelation}:null}
 }
 const buildCatchupPayments=(member)=>{
 const list=[]
 member.slots.forEach(s=>{
 for(let c=1;c<=versedCycles;c++){
 list.push({id:'ctp_'+genId(),memberId:member.id,memberName:member.name,slotOrder:s.order,cycle:c,type:'cotisation',amount:config.cotisation||0,mode:'Rattrapage',date:new Date().toISOString().slice(0,10),note:'Cotisation de rattrapage (adhésion tardive)',receiptNum:genRec(),lateJoin:true})
 }
 })
 return list
 }
 const save=()=>{
 if(versedCycles>0){ setCatchupStep(true); return }
 const newMember=buildMember()
 onSave(newMember,[])
 setSavedMember(newMember)
 setPostStage('reglement')
 }
 const payCatchupAndSave=()=>{
 const newMember=buildMember()
 const catchupPayments=buildCatchupPayments(newMember)
 onSave(newMember,catchupPayments)
 setSavedMember(newMember)
 setCatchupStep(false)
 setCatchupReceipt({memberName:newMember.name,total:catchupTotal*nbP,versedCycles,nbP,receiptNum:genRec(),date:new Date().toISOString()})
 setPostStage('catchup')
 }
 const catchupWhatsapp=async()=>{
 if(!catchupReceipt||!catchupRef.current) return
 await shareDocPDF(catchupRef.current,`facture-rattrapage-${catchupReceipt.receiptNum}.pdf`,form.phone,`Facture de rattrapage — ${catchupReceipt.memberName} — ${fmt(catchupReceipt.total,sym)}`)
 }
 const catchupImprimer=async()=>{ if(catchupRef.current) await printPDFElement(catchupRef.current) }

 if(catchupStep) return (
 <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
 <div style={{backgroundColor:C.amb,padding:'calc(env(safe-area-inset-top) + 14px) 16px 16px',display:'flex',alignItems:'center',gap:10}}>
 <BackBtn onClick={()=>setCatchupStep(false)}/>
 <div>
 <div style={{color:'#fff',fontSize:17,fontWeight:700}}>Cotisation de rattrapage</div>
 <div style={{color:'rgba(255,255,255,0.85)',fontSize:11,marginTop:2}}>{versedCycles} tour{versedCycles>1?'s':''} déjà versé{versedCycles>1?'s':''}</div>
 </div>
 </div>
 <div style={{flex:1,overflowY:'auto',padding:16,display:'flex',flexDirection:'column',gap:14}}>
 <div style={{backgroundColor:C.ambl,borderRadius:12,padding:14,fontSize:13,color:C.ambd,lineHeight:1.5}}>
 La tontine a déjà versé {versedCycles} tour{versedCycles>1?'s':''}. Pour rejoindre maintenant, {form.name.trim()||'ce membre'} doit d'abord cotiser le montant des tours déjà passés, pour {nbP} place{nbP>1?'s':''}.
 </div>
 <div style={{backgroundColor:C.white,border:`1px solid ${C.grb}`,borderRadius:12,padding:16}}>
 {Array.from({length:versedCycles},(_,i)=>i+1).map(c=>(
 <div key={c} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:`1px solid ${C.gr}`,fontSize:13}}>
 <span style={{color:C.text2}}>Tour {c}{nbP>1?` × ${nbP} places`:''}</span>
 <span style={{fontWeight:600,color:C.text}}>{fmt((config.cotisation||0)*nbP,sym)}</span>
 </div>
 ))}
 <div style={{display:'flex',justifyContent:'space-between',padding:'12px 0 0',fontSize:14}}>
 <span style={{fontWeight:700,color:C.text}}>Total à payer</span>
 <span style={{fontWeight:800,color:C.amb,fontSize:18}}>{fmt(catchupTotal*nbP,sym)}</span>
 </div>
 </div>
 <button onClick={payCatchupAndSave} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,backgroundColor:C.g,color:'#fff',border:'none',borderRadius:12,padding:14,fontSize:15,fontWeight:700,cursor:'pointer'}}>
 <Banknote size={16}/> Payer et confirmer le membre
 </button>
 <button onClick={()=>setCatchupStep(false)} style={{backgroundColor:C.gr,color:C.text2,border:'none',borderRadius:12,padding:13,fontSize:14,fontWeight:600,cursor:'pointer'}}>Annuler</button>
 </div>
 </div>
 )

 const welcomeMsg=savedMember?[
 `Bienvenue dans la tontine "${config.tontineName}" !`,
 config.description?`\n${config.description}`:'',
 config.reglement?`\nRèglement : ${config.reglement}`:'',
 `\nCotisation : ${config.cotisation} ${sym}${config.frequency?' ('+config.frequency+')':''}`,
 config.penaltyRate?`Pénalité de retard : ${config.penaltyRate}%`:'',
 config.fraisDeuil?`Autres frais : ${config.fraisDeuil} ${sym}`:'',
 config.fraisCaisse?`Frais de caisse : ${config.fraisCaisse} ${sym}`:'',
 `\nVotre/vos tour(s) : #${(savedMember.slots||[]).map(s=>s.order).join(', #')}`,
 ].filter(Boolean).join('\n'):''
 const sendWelcome=()=>{
 const digits=(savedMember.phone||'').replace(/[^0-9]/g,'')
 const url=digits?`https://wa.me/${digits}?text=${encodeURIComponent(welcomeMsg)}`:`https://wa.me/?text=${encodeURIComponent(welcomeMsg)}`
 window.open(url,'_blank')
 }
 const sendReglementPdf=async()=>{
 if(reglementRef.current) await shareDocPDF(reglementRef.current,`reglement-${config.tontineName||'tontine'}.pdf`,savedMember.phone,`Règlement de la tontine "${config.tontineName}" pour ${savedMember.name}`)
 }

 if(postStage==='catchup'&&catchupReceipt) return (
 <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
 <div style={{backgroundColor:C.amb,padding:'calc(env(safe-area-inset-top) + 14px) 16px 16px'}}>
 <div style={{color:'#fff',fontSize:17,fontWeight:700}}>Facture de rattrapage</div>
 <div style={{color:'rgba(255,255,255,0.85)',fontSize:11,marginTop:2}}>{catchupReceipt.memberName}</div>
 </div>
 <div style={{flex:1,overflowY:'auto',padding:16,display:'flex',flexDirection:'column',gap:14}}>
 <div ref={catchupRef} style={{backgroundColor:C.white,borderRadius:16,overflow:'hidden',border:`1px solid ${C.grb}`}}>
 <div style={{backgroundColor:C.amb,padding:'20px 16px',textAlign:'center'}}>
 <div style={{margin:'0 auto',width:56}}><Logo src={config.logo} size={56} bg="#fff" radius={28} border/></div>
 <div style={{color:'#fff',fontSize:15,fontWeight:700,marginTop:10}}>{config.tontineName}</div>
 <div style={{color:'rgba(255,255,255,0.9)',fontSize:11,marginTop:4,letterSpacing:0.5}}>COTISATION DE RATTRAPAGE</div>
 </div>
 <div style={{textAlign:'center',padding:'20px 16px 12px',borderBottom:'1px dashed '+C.grb}}>
 <div style={{fontSize:11,color:C.text2,marginBottom:4}}>Montant payé</div>
 <div style={{fontSize:32,fontWeight:800,color:C.amb,letterSpacing:-1}}>{fmt(catchupReceipt.total,sym)}</div>
 </div>
 <div style={{padding:'12px 16px',display:'flex',flexDirection:'column',gap:10}}>
 {[
 {l:'N° Facture', v:catchupReceipt.receiptNum},
 {l:'Membre', v:catchupReceipt.memberName},
 {l:'Tours rattrapés', v:`${catchupReceipt.versedCycles}`},
 {l:'Places', v:`${catchupReceipt.nbP}`},
 {l:'Date', v:fmtDateTime(catchupReceipt.date)},
 ].map(({l,v})=>(
 <div key={l} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
 <span style={{fontSize:12,color:C.text2}}>{l}</span>
 <span style={{fontSize:13,fontWeight:600,color:C.text}}>{v}</span>
 </div>
 ))}
 </div>
 <div style={{margin:'0 16px',height:1,backgroundColor:C.grb}}/>
 <div style={{padding:'10px 16px 16px',textAlign:'center'}}>
 <div style={{fontSize:10,color:C.text2,letterSpacing:0.4}}>Powered by IZIsoft — IZI NJANGI v1.0</div>
 </div>
 </div>
 <button onClick={catchupImprimer} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,backgroundColor:C.bl,color:'#fff',border:'none',borderRadius:12,padding:13,fontSize:14,fontWeight:700,cursor:'pointer'}}><Printer size={16}/> Imprimer la facture</button>
 <button onClick={catchupWhatsapp} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,backgroundColor:'#25D366',color:'#fff',border:'none',borderRadius:12,padding:13,fontSize:14,fontWeight:700,cursor:'pointer'}}><Share2 size={16}/> Envoyer la facture (WhatsApp)</button>
 <button onClick={()=>setPostStage('reglement')} style={{backgroundColor:C.g,color:'#fff',border:'none',borderRadius:12,padding:13,fontSize:15,fontWeight:700,cursor:'pointer',marginTop:4}}>Continuer</button>
 </div>
 </div>
 )

 if(postStage==='reglement') return (
 <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
 <div style={{backgroundColor:C.g,padding:'calc(env(safe-area-inset-top) + 14px) 16px 16px'}}>
 <div style={{color:'#fff',fontSize:17,fontWeight:700}}>Règlement de la tontine</div>
 <div style={{color:'rgba(255,255,255,0.8)',fontSize:11,marginTop:2}}>{savedMember?.name}</div>
 </div>
 <div style={{flex:1,overflowY:'auto',padding:16,display:'flex',flexDirection:'column',gap:14}}>
 <div style={{backgroundColor:C.white,border:`1px solid ${C.grb}`,borderRadius:12,padding:18}}>
 <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:2}}>{config.tontineName}</div>
 <div style={{fontSize:11,color:C.text2,marginBottom:12}}>Règlement de la tontine</div>
 <div style={{fontSize:13,color:C.text,whiteSpace:'pre-wrap',lineHeight:1.6}}>{config.reglement||'Aucun règlement défini.'}</div>
 </div>
 <button onClick={sendReglementPdf} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,backgroundColor:C.bl,color:'#fff',border:'none',borderRadius:12,padding:13,fontSize:14,fontWeight:700,cursor:'pointer'}}>
 <ReceiptText size={16}/> Envoyer le règlement (PDF)
 </button>
 <button onClick={()=>setPostStage('final')} style={{backgroundColor:C.g,color:'#fff',border:'none',borderRadius:12,padding:13,fontSize:15,fontWeight:700,cursor:'pointer',marginTop:4}}>Continuer</button>
 </div>
 <div ref={reglementRef} style={{position:'fixed',top:-9999,left:-9999,width:380,padding:24,backgroundColor:'#fff',color:'#111',fontFamily:'inherit'}}>
 <div style={{fontSize:18,fontWeight:700,marginBottom:12}}>{config.tontineName}</div>
 <div style={{fontSize:13,fontWeight:600,marginBottom:6}}>Règlement de la tontine</div>
 <div style={{fontSize:12,whiteSpace:'pre-wrap',lineHeight:1.5}}>{config.reglement||'Aucun règlement défini.'}</div>
 </div>
 </div>
 )

 if(postStage==='final') return (
 <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
 <div style={{backgroundColor:C.g,padding:'calc(env(safe-area-inset-top) + 14px) 16px 16px'}}>
 <div style={{color:'#fff',fontSize:17,fontWeight:700}}>Membre enregistré</div>
 <div style={{color:'rgba(255,255,255,0.8)',fontSize:11,marginTop:2}}>{savedMember?.name}</div>
 </div>
 <div style={{flex:1,overflowY:'auto',padding:16,display:'flex',flexDirection:'column',gap:14}}>
 <div style={{backgroundColor:C.gl,borderRadius:12,padding:14,fontSize:13,color:C.gd,display:'flex',alignItems:'center',gap:8}}>
 <CircleCheck size={18}/> {savedMember?.name} a bien été ajouté(e) à la tontine.
 </div>
 <button onClick={sendWelcome} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,backgroundColor:'#25D366',color:'#fff',border:'none',borderRadius:12,padding:13,fontSize:14,fontWeight:700,cursor:'pointer'}}>
 <Share2 size={16}/> Envoyer message de bienvenue (WhatsApp)
 </button>
 <button onClick={onBack} style={{backgroundColor:C.gr,color:C.text2,border:'none',borderRadius:12,padding:13,fontSize:14,fontWeight:600,cursor:'pointer',marginTop:4}}>
 Terminer
 </button>
 </div>
 </div>
 )

 return (
 <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
 <div style={{backgroundColor:C.g,padding:'calc(env(safe-area-inset-top) + 14px) 16px 16px',display:'flex',alignItems:'center',gap:10}}>
 <BackBtn onClick={()=>step===2?setStep(1):onBack()}/>
 <div>
 <div style={{color:'#fff',fontSize:17,fontWeight:700}}>Nouveau membre</div>
 <div style={{color:'rgba(255,255,255,0.8)',fontSize:11,marginTop:2}}>{step===1?'Étape 1/2 · Informations du membre':"Étape 2/2 · Contact d'urgence"}</div>
 </div>
 </div>
 <div style={{flex:1,overflowY:'auto',padding:16,display:'flex',flexDirection:'column',gap:14}}>
 {step===1 && (<>
 <div style={{display:'flex',alignItems:'center',gap:12}}>
 <div onClick={()=>pickPhoto('photo')} style={{width:64,height:64,borderRadius:12,border:`1px dashed ${C.grb}`,backgroundColor:C.gr,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',overflow:'hidden',flexShrink:0}}>
 {photoBusy==='photo' ? <span style={{fontSize:10,color:C.text2}}>…</span> : form.photo ? <img src={form.photo} alt="Photo" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : <span style={{fontSize:10,color:C.text2,textAlign:'center'}}>Photo</span>}
 </div>
 <input ref={memberPhotoRef} type="file" accept="image/*" onChange={handlePhotoFile('photo')} style={{display:'none'}}/>
 <div>
 <div style={{fontSize:12,color:C.text2}}>Photo passeport (optionnel)</div>
 {form.photoName&&<div style={{fontSize:11,color:C.text,fontWeight:600,marginTop:2}}>{form.photoName}</div>}
 </div>
 </div>
 <div>
 <label style={lbl}>Nom complet *</label>
 <input style={errors.name?{...inp,border:`1px solid ${C.rd}`}:inp} type="text" placeholder="Ex: Marie Dupont"
 value={form.name} onChange={e=>{setForm(p=>({...p,name:e.target.value}));setErrors(p=>({...p,name:''}))}}/>
 {errors.name&&<p style={{color:C.rd,fontSize:12,marginTop:4}}>{errors.name}</p>}
 </div>
 <div>
 <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
 <label style={lbl}>Téléphone *</label>
 {contactPickSupported && <button type="button" onClick={()=>pickContact('member')} title="Importer depuis les contacts" style={{background:C.gl,border:'none',borderRadius:7,width:26,height:26,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',marginBottom:3}}><Contact size={14} color={C.gd}/></button>}
 </div>
 <input style={errors.phone?{...inp,border:`1px solid ${C.rd}`}:inp} type="tel" placeholder="+243 8XX XXX XXX" value={form.phone} onChange={e=>{setForm(p=>({...p,phone:e.target.value}));setErrors(p=>({...p,phone:''}))}}/>
 {errors.phone&&<p style={{color:C.rd,fontSize:12,marginTop:4}}>{errors.phone}</p>}
 {pickError&&<p style={{color:C.rd,fontSize:12,marginTop:4}}>{pickError}</p>}
 </div>
 <div>
 <label style={lbl}>Adresse</label>
 <input style={inp} type="text" placeholder="Ex: Q. Kamwesha, Butembo" value={form.address} onChange={e=>setForm(p=>({...p,address:e.target.value}))}/>
 </div>
 <div>
 <label style={lbl}>Travail</label>
 <input style={inp} type="text" placeholder="Ex: Commerçante" value={form.travail} onChange={e=>setForm(p=>({...p,travail:e.target.value}))}/>
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
 <input style={{...inp,marginTop:4}} type="number" min="1" max={config?.maxSlotsPerMember||undefined} placeholder="Ex: 1"
 value={nbP} onChange={e=>{
 let n=parseInt(e.target.value,10)
 if(isNaN(n)||n<1) n=1
 if(config?.maxSlotsPerMember&&n>config.maxSlotsPerMember) n=config.maxSlotsPerMember
 setNbP(n)
 }}/>
 {nbP>1&&<div style={{marginTop:6,backgroundColor:C.pur,borderRadius:6,padding:'6px 10px',fontSize:11,color:C.purd}}>
 Ce membre paiera {fmt(config?.cotisation*nbP||0,config?.currency?.symbol||'F')} par cycle ({nbP}× cotisation)
 </div>}
 <div style={{marginTop:6,fontSize:11,color:C.text2}}>Tour{nbP>1?'s':''} attribué{nbP>1?'s':''} automatiquement : #{Array.from({length:nbP},(_,i)=>maxUsed+i+1).join(', #')}</div>
 {errors.nbP&&<p style={{color:C.rd,fontSize:12,marginTop:4}}>{errors.nbP}</p>}
 </div>
 <button onClick={goNext} style={{backgroundColor:C.g,color:'#fff',border:'none',borderRadius:12,padding:13,fontSize:15,fontWeight:700,cursor:'pointer',marginTop:4}}>
 Suivant
 </button>
 </>)}
 {step===2 && (<>
 <div>
 <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:10}}>Personne à contacter si introuvable</div>
 <div style={{display:'flex',flexDirection:'column',gap:14}}>
 <div style={{display:'flex',alignItems:'center',gap:12}}>
 <div onClick={()=>pickPhoto('contactPhoto')} style={{width:64,height:64,borderRadius:12,border:`1px dashed ${C.grb}`,backgroundColor:C.gr,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',overflow:'hidden',flexShrink:0}}>
 {photoBusy==='contactPhoto' ? <span style={{fontSize:10,color:C.text2}}>…</span> : form.contactPhoto ? <img src={form.contactPhoto} alt="Photo" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : <span style={{fontSize:10,color:C.text2,textAlign:'center'}}>Photo</span>}
 </div>
 <input ref={contactPhotoRef} type="file" accept="image/*" onChange={handlePhotoFile('contactPhoto')} style={{display:'none'}}/>
 <div>
 <div style={{fontSize:12,color:C.text2}}>Photo passeport (optionnel)</div>
 {form.contactPhotoName&&<div style={{fontSize:11,color:C.text,fontWeight:600,marginTop:2}}>{form.contactPhotoName}</div>}
 </div>
 </div>
 <div>
 <label style={lbl}>Lien de parenté</label>
 <select style={inp} value={form.contactRelation} onChange={e=>setForm(p=>({...p,contactRelation:e.target.value}))}>
 <option value="">Sélectionner...</option>
 <option value="Époux/Épouse">Époux/Épouse</option>
 <option value="Père">Père</option>
 <option value="Mère">Mère</option>
 <option value="Frère">Frère</option>
 <option value="Sœur">Sœur</option>
 <option value="Fils">Fils</option>
 <option value="Fille">Fille</option>
 <option value="Oncle">Oncle</option>
 <option value="Tante">Tante</option>
 <option value="Cousin(e)">Cousin(e)</option>
 <option value="Ami(e)">Ami(e)</option>
 <option value="Collègue">Collègue</option>
 <option value="Voisin(e)">Voisin(e)</option>
 <option value="Autre">Autre</option>
 </select>
 </div>
 <div>
 <label style={lbl}>Nom complet</label>
 <input style={inp} type="text" placeholder="Nom du contact" value={form.contactName} onChange={e=>setForm(p=>({...p,contactName:e.target.value}))}/>
 </div>
 <div>
 <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
 <label style={lbl}>Téléphone</label>
 {contactPickSupported && <button type="button" onClick={()=>pickContact('contact')} title="Importer depuis les contacts" style={{background:C.gl,border:'none',borderRadius:7,width:26,height:26,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',marginBottom:3}}><Contact size={14} color={C.gd}/></button>}
 </div>
 <input style={inp} type="tel" placeholder="+243 8XX XXX XXX" value={form.contactPhone} onChange={e=>setForm(p=>({...p,contactPhone:e.target.value}))}/>
 </div>
 <div>
 <label style={lbl}>Adresse</label>
 <input style={inp} type="text" placeholder="Adresse du contact" value={form.contactAddress} onChange={e=>setForm(p=>({...p,contactAddress:e.target.value}))}/>
 </div>
 <div>
 <label style={lbl}>Travail</label>
 <input style={inp} type="text" placeholder="Travail du contact" value={form.contactTravail} onChange={e=>setForm(p=>({...p,contactTravail:e.target.value}))}/>
 </div>
 <div>
 <label style={lbl}>Email (optionnel)</label>
 <input style={inp} type="email" placeholder="contact@email.com" value={form.contactEmail} onChange={e=>setForm(p=>({...p,contactEmail:e.target.value}))}/>
 </div>
 </div>
 </div>
 <button onClick={save} style={{backgroundColor:C.g,color:'#fff',border:'none',borderRadius:12,padding:13,fontSize:15,fontWeight:700,cursor:'pointer',marginTop:4}}>
 Enregistrer le membre
 </button>
 </>)}
 </div>
 </div>
 )
}

/* ---------------------------- Fiche membre ---------------------------- */

export function FicheMembreScreen({member, members, payments, payouts=[], config, onBack, onUpdate, onDelete, onAddSlot, onRemoveSlot, onExit}) {
 const sym=config.currency?.symbol||config.currency?.code||'F'
 const versedCycles=payouts.length
 const catchupAmount=(config.cotisation||0)*versedCycles
 const [catchupPlaceConfirm,setCatchupPlaceConfirm]=useState(false)
 const [addSlotReceipt,setAddSlotReceipt]=useState(null)
 const addSlotReceiptRef=useRef(null)
 const [edit,setEdit]=useState(false)
 const [form,setForm]=useState({name:member.name, phone:member.phone||'', email:member.email||'', address:member.address||'', travail:member.travail||'', joinDate:member.joinDate||'', contactName:member.contact?.name||'', contactPhone:member.contact?.phone||'', contactEmail:member.contact?.email||'', contactAddress:member.contact?.address||'', contactTravail:member.contact?.travail||'', contactRelation:member.contact?.relation||''})
 const slots = member.slots || [{slotId:'single', order:member.order||1, slotNum:1}]
 const history = payments.filter(p=>p.memberId===member.id).sort((a,b)=>new Date(b.date)-new Date(a.date))
 const isSorti = member.status==='sorti'
 const [pendingSlotAction,setPendingSlotAction]=useState(null)
 const [selectedPayment,setSelectedPayment]=useState(null)
 const [slotPinError,setSlotPinError]=useState('')
 const hasReceivedPayout=payouts.some(p=>p.memberId===member.id)
 const nbSlotsTotal=config.nbSlots||config.nbMembers||members.length||1
 const currentCycle=config.currentCycle||1
 const remainingCycles=Math.max(0,nbSlotsTotal-currentCycle+1)
 const nbMemberSlots=slots.length
 const debtAmount=(config.cotisation||0)*remainingCycles*nbMemberSlots
 const alreadyPaid=history.filter(p=>p.type==='cotisation').reduce((s,p)=>s+(p.amount||0),0)
 const [sortDebtConfirm,setSortDebtConfirm]=useState(false)
 const [sortRefundConfirm,setSortRefundConfirm]=useState(false)
 const [removeDebtConfirm,setRemoveDebtConfirm]=useState(false)
 const [exitReceipt,setExitReceipt]=useState(null)
 const exitReceiptRef=useRef(null)

 const doAddSlot=()=>{
   if(versedCycles>0){ setCatchupPlaceConfirm(true); return }
   config.pin ? setPendingSlotAction({type:'add'}) : onAddSlot(member.id)
 }
 const proceedAddSlotAfterCatchup=()=>{
   setCatchupPlaceConfirm(false)
   if(config.pin){ setPendingSlotAction({type:'add'}) } else { finalizeAddSlotWithCatchup() }
 }
 const finalizeAddSlotWithCatchup=()=>{
   onAddSlot(member.id, versedCycles)
   setAddSlotReceipt({memberName:member.name,versedCycles,amount:catchupAmount,receiptNum:'REC-'+Date.now().toString().slice(-6),date:new Date().toISOString()})
 }
 const doRemoveSlot=(slotId)=>{ if(slots.length<=1) return; config.pin ? setPendingSlotAction({type:'remove',slotId}) : onRemoveSlot(member.id,slotId) }
 const confirmSlotAction=(pin)=>{
   if(config.pin && pin!==config.pin){ setSlotPinError('PIN incorrect.'); return }
   if(pendingSlotAction.type==='add'){
     onAddSlot(member.id, versedCycles)
     if(versedCycles>0) setAddSlotReceipt({memberName:member.name,versedCycles,amount:catchupAmount,receiptNum:'REC-'+Date.now().toString().slice(-6),date:new Date().toISOString()})
   }
   else onRemoveSlot(member.id,pendingSlotAction.slotId)
   setPendingSlotAction(null); setSlotPinError('')
 }
 const cancelSlotAction=()=>{ setPendingSlotAction(null); setSlotPinError('') }

 const lbl={fontSize:12,fontWeight:600,color:C.text2,marginBottom:3,display:'block'}
 const inp={backgroundColor:C.white,border:`1px solid ${C.grb}`,borderRadius:8,padding:'10px 12px',fontSize:14,width:'100%',color:C.text,outline:'none',marginTop:4,boxSizing:'border-box'}

 const saveEdit=()=>{
   if(!form.name.trim()) return alert('Le nom est obligatoire.')
   onUpdate({...member, name:form.name.trim(), phone:form.phone.trim(), email:form.email.trim(), address:form.address.trim(), travail:form.travail.trim(), joinDate:form.joinDate,
     contact:(form.contactName.trim()||form.contactPhone.trim())?{name:form.contactName.trim(),phone:form.contactPhone.trim(),email:form.contactEmail.trim(),address:form.contactAddress.trim(),travail:form.contactTravail.trim(),relation:form.contactRelation,photo:member.contact?.photo||''}:null})
   setEdit(false)
 }

 const toggleSortie=()=>{
   if(isSorti){ onUpdate({...member, status:'actif'}); return }
   if(hasReceivedPayout){ setSortDebtConfirm(true); return }
   if(alreadyPaid>0){ setSortRefundConfirm(true); return }
   if(!window.confirm(`Marquer ${member.name} comme sorti de la tontine ?`)) return
   onUpdate({...member, status:'sorti'})
 }
 const confirmSortWithDebt=()=>{
   const exitPayments=[]
   const receiptNum=genRec()
   for(let c=currentCycle;c<currentCycle+remainingCycles;c++){
     slots.forEach(s=>{
       exitPayments.push({id:'ext_'+genId(),memberId:member.id,memberName:member.name,slotOrder:s.order,cycle:c,type:'cotisation',amount:config.cotisation||0,mode:'Solde de sortie',date:new Date().toISOString().slice(0,10),note:'Solde restant payé à la sortie (versement déjà reçu)',receiptNum})
     })
   }
   onExit && onExit(member.id, exitPayments, null)
   setSortDebtConfirm(false)
   setExitReceipt({memberName:member.name,amount:debtAmount,remainingCycles,receiptNum,date:new Date().toISOString()})
 }
 const confirmSortWithRefund=()=>{
   const minOrder=Math.min(...slots.map(s=>s.order))
   onExit && onExit(member.id, [], {amount:alreadyPaid, order:minOrder})
   setSortRefundConfirm(false)
 }

 const remove=()=>{
   if(hasReceivedPayout){ setRemoveDebtConfirm(true); return }
   if(!window.confirm(`Supprimer définitivement ${member.name} ? Cette action est irréversible.`)) return
   onDelete(member.id)
   onBack()
 }
 const proceedRemoveToDebt=()=>{ setRemoveDebtConfirm(false); setSortDebtConfirm(true) }

 if(exitReceipt) return (
   <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
     <div style={{backgroundColor:C.g,padding:'calc(env(safe-area-inset-top) + 14px) 16px 16px'}}>
       <div style={{color:'#fff',fontSize:17,fontWeight:700}}>Sortie confirmée</div>
       <div style={{color:'rgba(255,255,255,0.8)',fontSize:11,marginTop:2}}>{exitReceipt.memberName}</div>
     </div>
     <div style={{flex:1,overflowY:'auto',padding:16,display:'flex',flexDirection:'column',gap:14}}>
       <div style={{backgroundColor:C.gl,borderRadius:12,padding:14,fontSize:13,color:C.gd,display:'flex',alignItems:'center',gap:8}}>
         <CircleCheck size={18}/> Solde payé, {exitReceipt.memberName} est sorti(e) de la tontine.
       </div>
       <div ref={exitReceiptRef} style={{backgroundColor:C.white,borderRadius:16,overflow:'hidden',border:`1px solid ${C.grb}`}}>
         <div style={{backgroundColor:C.amb,padding:'20px 16px',textAlign:'center'}}>
           <div style={{margin:'0 auto',width:56}}><Logo src={config.logo} size={56} bg="#fff" radius={28} border/></div>
           <div style={{color:'#fff',fontSize:15,fontWeight:700,marginTop:10}}>{config.tontineName}</div>
           <div style={{color:'rgba(255,255,255,0.9)',fontSize:11,marginTop:4,letterSpacing:0.5}}>SOLDE DE SORTIE</div>
         </div>
         <div style={{textAlign:'center',padding:'20px 16px 12px',borderBottom:'1px dashed '+C.grb}}>
           <div style={{fontSize:11,color:C.text2,marginBottom:4}}>Montant payé</div>
           <div style={{fontSize:32,fontWeight:800,color:C.amb,letterSpacing:-1}}>{fmt(exitReceipt.amount,sym)}</div>
         </div>
         <div style={{padding:'12px 16px',display:'flex',flexDirection:'column',gap:10}}>
           {[
             {l:'N° Facture', v:exitReceipt.receiptNum},
             {l:'Type', v:'Solde de sortie'},
             {l:'Membre', v:exitReceipt.memberName},
             {l:'Cycles soldés', v:`${exitReceipt.remainingCycles}`},
             {l:'Mode', v:'Solde de sortie'},
             {l:'Date', v:new Date(exitReceipt.date).toLocaleString('fr-FR',{day:'2-digit',month:'short',year:'numeric'})},
             {l:'Émis le', v:new Date(exitReceipt.date).toLocaleString('fr-FR',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'})},
           ].map(({l,v})=>(
             <div key={l} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
               <span style={{fontSize:12,color:C.text2}}>{l}</span>
               <span style={{fontSize:13,fontWeight:600,color:C.text}}>{v}</span>
             </div>
           ))}
         </div>
         <div style={{margin:'0 16px',height:1,backgroundColor:C.grb}}/>
         <div style={{padding:'10px 16px 16px',textAlign:'center'}}>
           <div style={{fontSize:10,color:C.text2,letterSpacing:0.4}}>Powered by IZIsoft — IZI NJANGI v1.0</div>
         </div>
       </div>
       <button onClick={async()=>{ if(exitReceiptRef.current) await printPDFElement(exitReceiptRef.current) }} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,backgroundColor:C.bl,color:'#fff',border:'none',borderRadius:12,padding:13,fontSize:14,fontWeight:700,cursor:'pointer'}}><Printer size={16}/> Imprimer la facture</button>
       <button onClick={async()=>{ if(exitReceiptRef.current) await shareDocPDF(exitReceiptRef.current,`facture-sortie-${exitReceipt.receiptNum}.pdf`,member.phone,`Facture de solde de sortie — ${exitReceipt.memberName} — ${fmt(exitReceipt.amount,sym)}`) }} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,backgroundColor:'#25D366',color:'#fff',border:'none',borderRadius:12,padding:13,fontSize:14,fontWeight:700,cursor:'pointer'}}><Share2 size={16}/> Envoyer la facture (WhatsApp)</button>
       <button onClick={onBack} style={{backgroundColor:C.gr,color:C.text2,border:'none',borderRadius:12,padding:13,fontSize:14,fontWeight:600,cursor:'pointer'}}>Terminer</button>
     </div>
   </div>
 )

 if(addSlotReceipt) return (
   <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
     <div style={{backgroundColor:C.g,padding:'calc(env(safe-area-inset-top) + 14px) 16px 16px'}}>
       <div style={{color:'#fff',fontSize:17,fontWeight:700}}>Place ajoutée</div>
       <div style={{color:'rgba(255,255,255,0.8)',fontSize:11,marginTop:2}}>{addSlotReceipt.memberName}</div>
     </div>
     <div style={{flex:1,overflowY:'auto',padding:16,display:'flex',flexDirection:'column',gap:14}}>
       <div style={{backgroundColor:C.gl,borderRadius:12,padding:14,fontSize:13,color:C.gd,display:'flex',alignItems:'center',gap:8}}>
         <CircleCheck size={18}/> Nouvelle place ajoutée pour {addSlotReceipt.memberName}.
       </div>
       <div ref={addSlotReceiptRef} style={{backgroundColor:C.white,borderRadius:16,overflow:'hidden',border:`1px solid ${C.grb}`}}>
         <div style={{backgroundColor:C.amb,padding:'20px 16px',textAlign:'center'}}>
           <div style={{margin:'0 auto',width:56}}><Logo src={config.logo} size={56} bg="#fff" radius={28} border/></div>
           <div style={{color:'#fff',fontSize:15,fontWeight:700,marginTop:10}}>{config.tontineName}</div>
           <div style={{color:'rgba(255,255,255,0.9)',fontSize:11,marginTop:4,letterSpacing:0.5}}>COTISATION DE RATTRAPAGE</div>
         </div>
         <div style={{textAlign:'center',padding:'20px 16px 12px',borderBottom:'1px dashed '+C.grb}}>
           <div style={{fontSize:11,color:C.text2,marginBottom:4}}>Montant payé</div>
           <div style={{fontSize:32,fontWeight:800,color:C.amb,letterSpacing:-1}}>{fmt(addSlotReceipt.amount,sym)}</div>
         </div>
         <div style={{padding:'12px 16px',display:'flex',flexDirection:'column',gap:10}}>
           {[
             {l:'N° Facture', v:addSlotReceipt.receiptNum},
             {l:'Membre', v:addSlotReceipt.memberName},
             {l:'Tours rattrapés', v:`${addSlotReceipt.versedCycles}`},
             {l:'Date', v:new Date(addSlotReceipt.date).toLocaleString('fr-FR',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'})},
           ].map(({l,v})=>(
             <div key={l} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
               <span style={{fontSize:12,color:C.text2}}>{l}</span>
               <span style={{fontSize:13,fontWeight:600,color:C.text}}>{v}</span>
             </div>
           ))}
         </div>
         <div style={{margin:'0 16px',height:1,backgroundColor:C.grb}}/>
         <div style={{padding:'10px 16px 16px',textAlign:'center'}}>
           <div style={{fontSize:10,color:C.text2,letterSpacing:0.4}}>Powered by IZIsoft — IZI NJANGI v1.0</div>
         </div>
       </div>
       <button onClick={async()=>{ if(addSlotReceiptRef.current) await printPDFElement(addSlotReceiptRef.current) }} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,backgroundColor:C.bl,color:'#fff',border:'none',borderRadius:12,padding:13,fontSize:14,fontWeight:700,cursor:'pointer'}}><Printer size={16}/> Imprimer la facture</button>
       <button onClick={async()=>{ if(addSlotReceiptRef.current) await shareDocPDF(addSlotReceiptRef.current,`facture-rattrapage-${addSlotReceipt.receiptNum}.pdf`,member.phone,`Facture de rattrapage — ${addSlotReceipt.memberName} — ${fmt(addSlotReceipt.amount,sym)}`) }} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,backgroundColor:'#25D366',color:'#fff',border:'none',borderRadius:12,padding:13,fontSize:14,fontWeight:700,cursor:'pointer'}}><Share2 size={16}/> Envoyer la facture (WhatsApp)</button>
       <button onClick={()=>setAddSlotReceipt(null)} style={{backgroundColor:C.gr,color:C.text2,border:'none',borderRadius:12,padding:13,fontSize:14,fontWeight:600,cursor:'pointer'}}>Terminer</button>
     </div>
   </div>
 )

 if(selectedPayment) return (
   <Recu receipt={selectedPayment} config={config} onBack={()=>setSelectedPayment(null)} onNew={()=>setSelectedPayment(null)}/>
 )

 return (
 <>
 <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
   <div style={{backgroundColor:C.g,padding:'calc(env(safe-area-inset-top) + 14px) 16px 16px',display:'flex',alignItems:'center',gap:10}}>
     <BackBtn onClick={onBack}/>
     <div style={{flex:1}}>
       <div style={{color:'#fff',fontSize:17,fontWeight:700}}>{member.name}</div>
       <div style={{color:'rgba(255,255,255,0.8)',fontSize:11,marginTop:2}}>{slots.length} place{slots.length>1?'s':''} · Tour{slots.length>1?'s':''} #{slots.map(s=>s.order).join(', #')}</div>
     </div>
     {!edit && <button onClick={()=>setEdit(true)} style={{background:'rgba(255,255,255,0.16)',border:'none',borderRadius:9,width:34,height:34,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}><Pencil size={15} color="#fff"/></button>}
   </div>

   <div style={{flex:1,overflowY:'auto',padding:16,paddingBottom:40,display:'flex',flexDirection:'column',gap:14}}>

     <div style={{backgroundColor:C.white,border:`1px solid ${C.grb}`,borderRadius:12,padding:14}}>
       <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:edit?14:0}}>
         <Avatar name={member.name} size={48}/>
         {!edit && (
           <div style={{flex:1}}>
             <div style={{fontSize:15,fontWeight:700,color:C.text}}>{member.name}</div>
             <div style={{fontSize:12,color:C.text2,marginTop:2,display:'flex',alignItems:'center',gap:4}}>
               {member.phone ? <><Phone size={12}/> {member.phone}</> : 'Sans téléphone'}
             </div>
             {member.email && <div style={{fontSize:12,color:C.text2,marginTop:2,display:'flex',alignItems:'center',gap:4}}><Mail size={12}/> {member.email}</div>}
             {member.address && <div style={{fontSize:12,color:C.text2,marginTop:2}}>📍 {member.address}</div>}
             {member.travail && <div style={{fontSize:12,color:C.text2,marginTop:2}}>💼 {member.travail}</div>}
             {member.joinDate && <div style={{fontSize:12,color:C.text2,marginTop:2}}>📅 Adhésion : {fmtDate(member.joinDate)}</div>}
           </div>
         )}
         {!edit && <Badge label={isSorti?'Sorti':'Actif'} type={isSorti?'bad':'ok'}/>}
       </div>
       {edit && (
         <div style={{display:'flex',flexDirection:'column',gap:10}}>
           <div><label style={lbl}>Nom complet</label><input style={inp} value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/></div>
           <div><label style={lbl}>Téléphone</label><input style={inp} value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))}/></div>
           <div><label style={lbl}>Email</label><input style={inp} value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))}/></div>
           <div><label style={lbl}>Adresse</label><input style={inp} value={form.address} onChange={e=>setForm(p=>({...p,address:e.target.value}))}/></div>
           <div><label style={lbl}>Travail</label><input style={inp} value={form.travail} onChange={e=>setForm(p=>({...p,travail:e.target.value}))}/></div>
           <div><label style={lbl}>Date d'adhésion</label><input style={inp} type="date" value={form.joinDate} onChange={e=>setForm(p=>({...p,joinDate:e.target.value}))}/></div>
           <div style={{borderTop:`1px solid ${C.grb}`,marginTop:6,paddingTop:12,fontSize:13,fontWeight:700,color:C.text}}>Personne à contacter si introuvable</div>
           <div><label style={lbl}>Lien de parenté</label>
             <select style={inp} value={form.contactRelation} onChange={e=>setForm(p=>({...p,contactRelation:e.target.value}))}>
               <option value="">Sélectionner...</option>
               <option value="Époux/Épouse">Époux/Épouse</option>
               <option value="Père">Père</option>
               <option value="Mère">Mère</option>
               <option value="Frère">Frère</option>
               <option value="Sœur">Sœur</option>
               <option value="Fils">Fils</option>
               <option value="Fille">Fille</option>
               <option value="Oncle">Oncle</option>
               <option value="Tante">Tante</option>
               <option value="Cousin(e)">Cousin(e)</option>
               <option value="Ami(e)">Ami(e)</option>
               <option value="Collègue">Collègue</option>
               <option value="Voisin(e)">Voisin(e)</option>
               <option value="Autre">Autre</option>
             </select>
           </div>
           <div><label style={lbl}>Nom du contact</label><input style={inp} value={form.contactName} onChange={e=>setForm(p=>({...p,contactName:e.target.value}))}/></div>
           <div><label style={lbl}>Téléphone du contact</label><input style={inp} value={form.contactPhone} onChange={e=>setForm(p=>({...p,contactPhone:e.target.value}))}/></div>
           <div><label style={lbl}>Adresse du contact</label><input style={inp} value={form.contactAddress} onChange={e=>setForm(p=>({...p,contactAddress:e.target.value}))}/></div>
           <div><label style={lbl}>Travail du contact</label><input style={inp} value={form.contactTravail} onChange={e=>setForm(p=>({...p,contactTravail:e.target.value}))}/></div>
           <div><label style={lbl}>Email du contact</label><input style={inp} value={form.contactEmail} onChange={e=>setForm(p=>({...p,contactEmail:e.target.value}))}/></div>
           <div style={{display:'flex',gap:8,marginTop:4}}>
             <button onClick={()=>{setEdit(false);setForm({name:member.name,phone:member.phone||'',email:member.email||'',address:member.address||'',travail:member.travail||'',joinDate:member.joinDate||'',contactName:member.contact?.name||'',contactPhone:member.contact?.phone||'',contactEmail:member.contact?.email||'',contactAddress:member.contact?.address||'',contactTravail:member.contact?.travail||'',contactRelation:member.contact?.relation||''})}} style={{flex:1,padding:11,backgroundColor:C.gr,color:C.text2,border:'none',borderRadius:9,fontSize:13,fontWeight:600,cursor:'pointer'}}>Annuler</button>
             <button onClick={saveEdit} style={{flex:1,padding:11,backgroundColor:C.g,color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:700,cursor:'pointer'}}>Enregistrer</button>
           </div>
         </div>
       )}
     </div>

     <div>
       <div style={{fontSize:11,fontWeight:700,color:C.text2,textTransform:'uppercase',letterSpacing:0.5,marginBottom:8}}>Places dans la tontine</div>
       <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
         {slots.map(s=>(
           <div key={s.slotId||s.order} style={{backgroundColor:C.gl,borderRadius:8,padding:'8px 12px',display:'flex',alignItems:'center',gap:8}}>
             <div style={{fontSize:13,fontWeight:700,color:C.gd}}>Tour #{s.order}</div>
             {slots.length>1 && <button onClick={()=>doRemoveSlot(s.slotId)} style={{background:'none',border:'none',cursor:'pointer',display:'flex',alignItems:'center',padding:0}}><X size={13} color={C.gd}/></button>}
           </div>
         ))}
         <button onClick={doAddSlot} style={{backgroundColor:C.white,border:`1px dashed ${C.grb}`,borderRadius:8,padding:'8px 12px',display:'flex',alignItems:'center',gap:5,color:C.text2,fontSize:12,fontWeight:600,cursor:'pointer'}}>
           <Plus size={13}/> Place
         </button>
       </div>
     </div>

     {!edit && member.contact && (member.contact.name||member.contact.phone) && (
     <div>
       <div style={{fontSize:11,fontWeight:700,color:C.text2,textTransform:'uppercase',letterSpacing:0.5,marginBottom:8}}>Personne à contacter si introuvable</div>
       <div style={{backgroundColor:C.white,border:`1px solid ${C.grb}`,borderRadius:12,padding:14,display:'flex',flexDirection:'column',gap:4}}>
         <div style={{fontSize:14,fontWeight:700,color:C.text}}>{member.contact.name||'—'}{member.contact.relation&&<span style={{fontSize:11,fontWeight:600,color:C.gd,backgroundColor:C.gl,borderRadius:8,padding:'2px 8px',marginLeft:8}}>{member.contact.relation}</span>}</div>
         {member.contact.phone && <div style={{fontSize:12,color:C.text2,display:'flex',alignItems:'center',gap:4}}><Phone size={12}/> {member.contact.phone}</div>}
         {member.contact.email && <div style={{fontSize:12,color:C.text2,display:'flex',alignItems:'center',gap:4}}><Mail size={12}/> {member.contact.email}</div>}
         {member.contact.address && <div style={{fontSize:12,color:C.text2}}>📍 {member.contact.address}</div>}
         {member.contact.travail && <div style={{fontSize:12,color:C.text2}}>💼 {member.contact.travail}</div>}
       </div>
     </div>
     )}

     <div>
       <div style={{fontSize:11,fontWeight:700,color:C.text2,textTransform:'uppercase',letterSpacing:0.5,marginBottom:8}}>Historique des paiements</div>
       {history.length===0 && <div style={{backgroundColor:C.white,border:`1px solid ${C.grb}`,borderRadius:12,padding:16,textAlign:'center',color:C.text2,fontSize:12}}>Aucun paiement enregistré</div>}
       <div style={{display:'flex',flexDirection:'column',gap:6}}>
         {history.map(p=>(
           <div key={p.id} onClick={()=>setSelectedPayment(p)} style={{backgroundColor:C.white,border:`1px solid ${C.grb}`,borderRadius:10,padding:10,display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
             <IconCircle icon={ReceiptText} bg={C.gl} fg={C.gd} size={28} iconSize={13}/>
             <div style={{flex:1}}>
               <div style={{fontSize:12.5,fontWeight:500,color:C.text}}>{TYPES_PAY.find(t=>t.key===p.type)?.label||p.type} · Cycle {p.cycle}</div>
               <div style={{fontSize:11,color:C.text2,marginTop:1}}>{fmtDate(p.date)} · {p.mode}</div>
             </div>
             <span style={{fontSize:13,fontWeight:700,color:C.g}}>{fmt(p.amount,sym)}</span>
           </div>
         ))}
       </div>
     </div>

     <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:6}}>
       <button onClick={toggleSortie} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,backgroundColor:isSorti?C.gl:C.ambl,color:isSorti?C.gd:C.ambd,border:'none',borderRadius:10,padding:12,fontSize:13,fontWeight:700,cursor:'pointer'}}>
         {isSorti ? <><UserPlus size={15}/> Réactiver ce membre</> : <><UserMinus size={15}/> Marquer comme sorti</>}
       </button>
       <button onClick={remove} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,backgroundColor:C.rdl,color:C.rd,border:'none',borderRadius:10,padding:12,fontSize:13,fontWeight:700,cursor:'pointer'}}>
         <Trash2 size={15}/> Supprimer le membre
       </button>
     </div>
   </div>
 </div>
 {pendingSlotAction && <PinModal title={pendingSlotAction.type==='add'?"Confirmer l'ajout de place":"Confirmer la suppression de place"} sub="Entrez le PIN de la tontine" error={slotPinError} onClearError={()=>setSlotPinError('')} onConfirm={confirmSlotAction} onCancel={cancelSlotAction}/>}
 {catchupPlaceConfirm && <ConfirmModal title="Cotisation de rattrapage requise" message={`La tontine a déjà versé ${versedCycles} tour${versedCycles>1?'s':''}. Pour ajouter une place à ${member.name} maintenant, il/elle doit d'abord cotiser ${fmt(catchupAmount,sym)} (rattrapage des tours déjà passés).`} confirmLabel="Payer et ajouter la place" onConfirm={proceedAddSlotAfterCatchup} onCancel={()=>setCatchupPlaceConfirm(false)}/>}
 {removeDebtConfirm && <ConfirmModal title="Impossible de supprimer" message={`${member.name} a déjà reçu sa cagnotte : impossible de le supprimer. Il doit d'abord payer le solde restant (${fmt(debtAmount,sym)}) pour sortir de la tontine.`} confirmLabel="Continuer vers le paiement" danger onConfirm={proceedRemoveToDebt} onCancel={()=>setRemoveDebtConfirm(false)}/>}
 {sortDebtConfirm && <ConfirmModal title="Solde restant à payer" message={`${member.name} a déjà reçu sa cagnotte. Pour quitter la tontine, il/elle doit d'abord payer le solde des cotisations restantes : ${fmt(debtAmount,sym)} (${remainingCycles} cycle${remainingCycles>1?'s':''} restant${remainingCycles>1?'s':''}).`} confirmLabel="Payer et confirmer la sortie" danger onConfirm={confirmSortWithDebt} onCancel={()=>setSortDebtConfirm(false)}/>}
 {sortRefundConfirm && <ConfirmModal title="Remboursement à prévoir" message={`${member.name} n'a pas encore reçu sa cagnotte mais a déjà cotisé ${fmt(alreadyPaid,sym)}. Cet argent devra lui être remboursé par la tontine avant son tour normal. Confirmer la sortie ?`} confirmLabel="Confirmer la sortie" danger onConfirm={confirmSortWithRefund} onCancel={()=>setSortRefundConfirm(false)}/>}
 </>
 )
}

/* ---------------------------- Reçu ---------------------------- */

function Recu({receipt,config,onBack,onNew}) {
 const sym=config.currency?.symbol||config.currency?.code||'F'
 const typeLabel=TYPES_PAY.find(t=>t.key===receipt.type)?.label||receipt.type
 const recuRef=useRef(null)
 const handlePrint=async()=>{ if(recuRef.current) await printPDFElement(recuRef.current) }
 const handleWhatsApp=async()=>{ if(recuRef.current) await shareViaPDF(recuRef.current,receipt,config.tontineName) }

 return (
 <div style={{flex:1,display:'flex',flexDirection:'column',backgroundColor:C.g}}>
 <div style={{padding:'calc(env(safe-area-inset-top) + 20px) 16px 12px',display:'flex',alignItems:'center',gap:10}}>
 <BackBtn onClick={onBack}/>
 <div style={{color:'#fff',fontSize:17,fontWeight:700}}>Reçu de paiement</div>
 </div>
 <div style={{flex:1,overflowY:'auto',padding:'0 16px 16px'}}>
 <div ref={recuRef} style={{backgroundColor:C.white,borderRadius:16,overflow:'hidden'}}>
 <div style={{backgroundColor:C.g,padding:'20px 16px',textAlign:'center'}}>
 <div style={{margin:'0 auto',width:56}}><Logo src={config.logo} size={56} bg="#fff" radius={28} border/></div>
 <div style={{color:'#fff',fontSize:15,fontWeight:700,marginTop:10}}>{config.tontineName}</div>
 <div style={{color:'rgba(255,255,255,0.85)',fontSize:11,marginTop:4,letterSpacing:0.5}}>PAIEMENT ENREGISTRÉ</div>
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
 ...(receipt.slotOrders&&receipt.slotOrders.length?[{l:"Tour(s)",v:receipt.slotOrders.map(o=>`#${o}`).join(', ')}]:receipt.slotOrder?[{l:'Tour',v:`#${receipt.slotOrder}`}]:[]),
 ...(receipt.cycle?[{l:'Cycle',v:`Cycle ${receipt.cycle}`}]:[]),
 {l:'Mode', v:receipt.mode},
 {l:'Date', v:fmtDate(receipt.date)},
 ...(receipt.createdAt?[{l:'Émis le',v:fmtDateTime(receipt.createdAt)}]:[]),
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
 <button onClick={handlePrint} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,backgroundColor:C.white,color:C.g,border:'2px solid '+C.g,borderRadius:12,padding:13,fontSize:14,fontWeight:700,cursor:'pointer'}}><Printer size={16}/> Imprimer le reçu (PDF)</button>
 <button onClick={handleWhatsApp} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,backgroundColor:'#25D366',color:'#fff',border:'none',borderRadius:12,padding:13,fontSize:14,fontWeight:700,cursor:'pointer'}}><Share2 size={16}/> Envoyer sur WhatsApp</button>
 <button onClick={onNew} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,backgroundColor:C.white,color:C.text2,border:'1px solid '+C.grb,borderRadius:12,padding:13,fontSize:14,fontWeight:600,cursor:'pointer'}}><Plus size={15}/> Nouveau paiement</button>
 <button onClick={onBack} style={{background:'none',border:'none',color:'rgba(255,255,255,0.8)',fontSize:13,cursor:'pointer',padding:8}}>Retour</button>
 </div>
 </div>
 </div>
 )
}

/* ---------------------------- Paiement ---------------------------- */

export function PaiementScreen({config,members,payments,onSave,onSaveBatch,onBack,preselectMemberId}) {
 const sym=config.currency?.symbol||config.currency?.code||'F'
 const base=Number(config.cotisation||0)
 const currentCycle=config.currentCycle||1
 const penaltyRate=config.penaltyRate||0

 const [view,setView]=useState('form')
 const [receipt,setReceipt]=useState(null)
 const [form,setForm]=useState({memberId:preselectMemberId||'',slotOrders:[],mode:'Espèces',date:new Date().toISOString().split('T')[0],note:'',withPenalty:false})
 const [errors,setErrors]=useState({})
 const f=patch=>{setForm(p=>({...p,...patch}));setErrors({})}

 const isSlotPaid=(memberId,order)=>payments.some(p=>p.memberId===memberId&&p.slotOrder===order&&p.cycle===currentCycle&&p.type==='cotisation')
 const activeMembers=members.filter(m=>{
 if(m.status==='sorti') return false
 const s=m.slots||[{order:m.order||1}]
 return s.some(sl=>!isSlotPaid(m.id,sl.order))
 })
 const member=members.find(m=>m.id===form.memberId)
 const memberSlots=member?.slots||(member?[{slotId:'single',order:member.order||1,slotNum:1}]:[])
 const unpaidSlots=memberSlots.filter(s=>!isSlotPaid(form.memberId,s.order)).sort((a,b)=>a.order-b.order)

 const nbSelected=form.slotOrders.length
 const penaltyAmt=form.withPenalty?Math.round(base*penaltyRate/100):0
 const totalAmt=(base+penaltyAmt)*nbSelected

 const validate=()=>{
 const e={}
 if(!form.memberId) e.memberId='Sélectionnez un membre.'
 if(form.slotOrders.length===0) e.slotOrder='Sélectionnez au moins un tour.'
 setErrors(e)
 return Object.keys(e).length===0
 }

 const [confirmOpen,setConfirmOpen]=useState(false)

 const requestSubmit=()=>{ if(validate()) setConfirmOpen(true) }

 const submit=()=>{
 const receiptNum=genRec()
 const createdAt=nowISO()
 const orders=[...form.slotOrders].sort((a,b)=>a-b)
 const newPayments=orders.map(order=>({id:genId(),type:'cotisation',memberId:form.memberId,memberName:member?.name||'',memberPhone:member?.phone||'',slotOrder:order,cycle:currentCycle,amount:base+penaltyAmt,baseAmount:base,penalty:penaltyAmt,mode:form.mode,date:form.date,note:form.note,receiptNum,createdAt}))
 onSaveBatch(newPayments)
 setReceipt({receiptNum,memberName:member?.name||'',slotOrders:orders,cycle:currentCycle,amount:totalAmt,baseAmount:base,penalty:penaltyAmt*orders.length,mode:form.mode,date:form.date,note:form.note,createdAt,type:'cotisation'})
 setConfirmOpen(false); setView('recu')
 }

 const reset=()=>{setView('form');setReceipt(null);setForm({memberId:'',slotOrders:[],mode:'Espèces',date:new Date().toISOString().split('T')[0],note:'',withPenalty:false});setErrors({})}

 if(view==='recu') return <Recu receipt={receipt} config={config} onBack={onBack} onNew={reset}/>

 const lbl={fontSize:12,fontWeight:600,color:C.text2,marginBottom:3,display:'block'}
 const inp={backgroundColor:C.white,border:`1px solid ${C.grb}`,borderRadius:8,padding:'10px 12px',fontSize:14,width:'100%',color:C.text,outline:'none',marginTop:4,boxSizing:'border-box',maxWidth:'100%'}

 return (
 <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
 <div style={{backgroundColor:C.g,padding:'calc(env(safe-area-inset-top) + 14px) 16px 16px',display:'flex',alignItems:'center',gap:10}}>
 <BackBtn onClick={onBack}/>
 <div>
 <div style={{color:'#fff',fontSize:17,fontWeight:700}}>Enregistrer un paiement</div>
 <div style={{color:'rgba(255,255,255,0.8)',fontSize:11,marginTop:2}}>Cycle {currentCycle} · {fmt(base,sym)}</div>
 </div>
 </div>
 <div style={{flex:1,overflowY:'auto',padding:16,paddingBottom:100,display:'flex',flexDirection:'column',gap:14}}>
 <div>
 <label style={lbl}>Membre *</label>
 <select style={errors.memberId?{...inp,border:`1px solid ${C.rd}`}:inp} value={form.memberId}
 onChange={e=>f({memberId:e.target.value,slotOrders:[]})}>
 <option value="">— Sélectionner un membre —</option>
 {activeMembers.sort((a,b)=>(a.slots?.[0]?.order||a.order||0)-(b.slots?.[0]?.order||b.order||0)).map(m=>(
 <option key={m.id} value={m.id}>{m.name}{m.slots?.length>1?` (${m.slots.length} places)`:''}</option>
 ))}
 </select>
 {errors.memberId&&<p style={{color:C.rd,fontSize:12,marginTop:4}}>{errors.memberId}</p>}
 </div>

 {member&&(
 <div>
 <label style={lbl}>Tour(s) à payer * <span style={{color:C.text2,fontWeight:400}}>({nbSelected}/{unpaidSlots.length})</span></label>
 {unpaidSlots.length===0 ? (
 <div style={{marginTop:6,backgroundColor:C.gl,border:`1px solid ${C.g}`,borderRadius:8,padding:'8px 12px',fontSize:12,color:C.gd}}>Tous les tours de ce membre sont déjà payés pour ce cycle.</div>
 ) : (
 <>
 <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:6}}>
 {unpaidSlots.map(slot=>{
 const active=form.slotOrders.includes(slot.order)
 return (
 <button key={slot.slotId||slot.order} onClick={()=>f({slotOrders:active?form.slotOrders.filter(o=>o!==slot.order):[...form.slotOrders,slot.order]})}
 style={{flex:'1 1 calc(50% - 4px)',padding:'12px 8px',borderRadius:10,border:`2px solid ${active?C.g:C.grb}`,backgroundColor:active?C.g:C.white,color:active?'#fff':C.text,cursor:'pointer',textAlign:'center'}}>
 <div style={{fontSize:14,fontWeight:700}}>Tour #{slot.order}</div>
 <div style={{fontSize:10,marginTop:3}}>{active?'Sélectionné':'À payer'}</div>
 </button>
 )
 })}
 </div>
 {unpaidSlots.length>1 && <button onClick={()=>f({slotOrders:nbSelected===unpaidSlots.length?[]:unpaidSlots.map(s=>s.order)})} style={{marginTop:8,background:'none',border:'none',color:C.gd,fontSize:12,fontWeight:600,cursor:'pointer',padding:0}}>{nbSelected===unpaidSlots.length?'Tout désélectionner':`Sélectionner toutes les places (${unpaidSlots.length})`}</button>}
 </>
 )}
 {errors.slotOrder&&<p style={{color:C.rd,fontSize:12,marginTop:4}}>{errors.slotOrder}</p>}
 </div>
 )}

 {member&&unpaidSlots.length===1&&form.slotOrders.length===0&&(()=>{setTimeout(()=>f({slotOrders:[unpaidSlots[0].order]}),0);return null})()}

 {penaltyRate>0&&(
 <div style={{backgroundColor:C.ambl,borderRadius:8,padding:'10px 12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
 <div>
 <div style={{fontSize:13,color:C.ambd,fontWeight:600,display:'flex',alignItems:'center',gap:5}}><Percent size={13}/> Pénalité de retard ({penaltyRate}%)</div>
 <div style={{fontSize:11,color:C.amb,marginTop:2}}>+ {fmt(Math.round(base*penaltyRate/100),sym)}</div>
 </div>
 <Toggle on={form.withPenalty} onChange={()=>f({withPenalty:!form.withPenalty})}/>
 </div>
 )}

 <div style={{backgroundColor:C.gl,borderRadius:8,padding:'10px 12px'}}>
 <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
 <span style={{fontSize:13,color:C.gd,fontWeight:600}}>Montant à payer</span>
 <span style={{fontSize:18,fontWeight:800,color:C.g}}>{fmt(totalAmt,sym)}</span>
 </div>
 {nbSelected>0&&<div style={{fontSize:11,color:C.text2,marginTop:4}}>{nbSelected} tour{nbSelected>1?'s':''} × {fmt(base,sym)}{penaltyAmt>0?` + ${fmt(penaltyAmt,sym)} pénalité/tour`:''}</div>}
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

 <button onClick={requestSubmit} disabled={unpaidSlots.length===0}
 style={{backgroundColor:unpaidSlots.length===0?C.grb:C.g,color:'#fff',border:'none',borderRadius:12,padding:14,fontSize:15,fontWeight:700,cursor:unpaidSlots.length===0?'not-allowed':'pointer',opacity:unpaidSlots.length===0?0.6:1,marginBottom:16}}>
 Enregistrer
 </button>
 </div>
 {confirmOpen && (
 <div style={{position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.55)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
 <div style={{width:'100%',maxWidth:480,backgroundColor:C.white,borderRadius:'20px 20px 0 0',padding:'22px 20px calc(env(safe-area-inset-bottom) + 20px)'}}>
 <div style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:14}}>Confirmer le paiement</div>
 <div style={{backgroundColor:C.bg,borderRadius:12,padding:14,display:'flex',flexDirection:'column',gap:8,marginBottom:18}}>
 {[
 {l:'Membre',v:member?.name||''},
 {l:'Tour(s)',v:form.slotOrders.slice().sort((a,b)=>a-b).map(o=>`#${o}`).join(', ')},
 {l:'Cycle',v:`Cycle ${currentCycle}`},
 {l:'Montant',v:fmt(totalAmt,sym)},
 {l:'Mode',v:form.mode},
 {l:'Date',v:fmtDate(form.date)},
 ].map(({l,v})=>(
 <div key={l} style={{display:'flex',justifyContent:'space-between'}}>
 <span style={{fontSize:12,color:C.text2}}>{l}</span>
 <span style={{fontSize:13,fontWeight:700,color:C.text}}>{v}</span>
 </div>
 ))}
 </div>
 <div style={{display:'flex',gap:10}}>
 <button onClick={()=>setConfirmOpen(false)} style={{flex:1,padding:13,backgroundColor:C.gr,color:C.text2,border:'none',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer'}}>Annuler</button>
 <button onClick={submit} style={{flex:1,padding:13,backgroundColor:C.g,color:'#fff',border:'none',borderRadius:10,fontSize:14,fontWeight:700,cursor:'pointer'}}>Confirmer</button>
 </div>
 </div>
 </div>
 )}
 </div>
 )
}

/* ---------------------------- Impayés ---------------------------- */

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
 <div style={{backgroundColor:C.amb,padding:'calc(env(safe-area-inset-top) + 14px) 16px 16px',display:'flex',alignItems:'center',gap:10}}>
 <BackBtn onClick={onBack}/>
 <div>
 <div style={{color:'#fff',fontSize:17,fontWeight:700}}>Impayés</div>
 <div style={{color:'rgba(255,255,255,0.8)',fontSize:11,marginTop:2}}>Cycle {currentCycle} · {unpaid.length} slot{unpaid.length>1?'s':''} en retard</div>
 {config.frequencyUnit && (()=>{const due=getNextDueDate(config);return due?<div style={{color:'rgba(255,255,255,0.85)',fontSize:11,marginTop:2}}>Prochaine échéance : {formatDueDate(due)}</div>:null})()}
 </div>
 </div>
 <div style={{flex:1,overflowY:'auto',padding:'12px 14px',paddingBottom:80,display:'flex',flexDirection:'column',gap:8}}>
 {unpaid.length===0&&(
 <div style={{backgroundColor:C.gl,borderRadius:12,border:`1px solid ${C.g}`,padding:20,textAlign:'center'}}>
 <CircleCheck size={38} color={C.g} style={{marginBottom:8}}/>
 <div style={{fontSize:14,fontWeight:700,color:C.gd}}>Tous les slots sont payés !</div>
 <div style={{fontSize:12,color:C.g2,marginTop:4}}>Cycle {currentCycle} complet</div>
 </div>
 )}
 {unpaid.map(({order,member})=>(
 <div key={order} style={{backgroundColor:C.white,borderRadius:12,border:`1px solid ${C.grb}`,padding:12}}>
 <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
 <div style={{display:'flex',alignItems:'center',gap:10}}>
 <IconCircle icon={TriangleAlert} bg={C.ambl} fg={C.ambd} size={36} iconSize={17}/>
 <div>
 <div style={{fontSize:14,fontWeight:600,color:C.text}}>{member?member.name:'— Non attribué —'}</div>
 <div style={{fontSize:11,color:C.text2,marginTop:2}}>Tour #{order} · Cycle {currentCycle} · {fmt(config.cotisation,sym)}</div>
 {member?.phone&&<div style={{fontSize:11,color:C.bl,marginTop:1,display:'flex',alignItems:'center',gap:4}}><Phone size={11}/> {member.phone}</div>}
 </div>
 </div>
 {member&&(
 <button onClick={()=>onPay(member)} style={{backgroundColor:C.g,color:'#fff',border:'none',borderRadius:8,padding:'6px 12px',fontSize:12,fontWeight:700,cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',gap:5}}>
 Payer <ChevronRight size={14}/>
 </button>
 )}
 </div>
 </div>
 ))}
 </div>
 </div>
 )
}

/* ---------------------------- Rapport ---------------------------- */

export function NotificationsScreen({config,members,payments,payouts,forcedAdvances=[],onBack,onPay,onVerser}) {
 const sym=config.currency?.symbol||config.currency?.code||'F'
 const currentCycle=config.currentCycle||1
 const nbSlots=config.nbSlots||config.nbMembers||members.length||1
 const cyclePayments=payments.filter(p=>p.cycle===currentCycle&&p.type==='cotisation')
 const paidSlotOrders=new Set(cyclePayments.map(p=>p.slotOrder))
 const closedSlots=new Set(payouts.map(p=>p.slotOrder||p.cycle))
 const activeSlots=Array.from({length:nbSlots},(_,i)=>i+1).filter(o=>!closedSlots.has(o))
 const unpaidSlots=activeSlots.filter(o=>!paidSlotOrders.has(o))
 const unpaidMembersList=[...new Set(unpaidSlots.map(order=>members.find(m=>m.slots?m.slots.some(s=>s.order===order):m.order===order)?.id))].map(id=>members.find(m=>m.id===id)).filter(Boolean)
 const dueDate=config.frequencyUnit?getNextDueDate(config):null
 const cycleVerse=payouts.some(p=>p.cycle===currentCycle)

 const notifications=[]
 if(dueDate&&isDuePassed(dueDate)&&unpaidMembersList.length>0){
 notifications.push({id:'retard',type:'retard',title:'Retard de cotisation',sub:`Cycle ${currentCycle} — le paiement était attendu le ${formatDueDate(dueDate)}`,icon:TriangleAlert,bg:C.rdl,fg:C.rd,members:unpaidMembersList,cycle:currentCycle})
 }
 if(dueDate&&isDueTomorrow(dueDate)&&unpaidMembersList.length>0){
 notifications.push({id:'rappel',type:'rappel',title:'Rappel : demain dernier jour de paie',sub:`Échéance le ${formatDueDate(dueDate)} — Cycle ${currentCycle}`,icon:CalendarClock,bg:C.ambl,fg:C.ambd,members:unpaidMembersList,cycle:currentCycle})
 }
 if(dueDate&&isDueOneDayPassed(dueDate)&&!cycleVerse){
 notifications.push({id:'attente',type:'attente',title:'Versement en attente',sub:`La cagnotte du cycle ${currentCycle} n'a pas encore été versée`,icon:Banknote,bg:C.pur,fg:C.purd,cycle:currentCycle})
 }
 forcedAdvances.forEach(f=>{
 const fm=members.find(m=>m.id===f.memberId)
 notifications.push({id:'forced-'+f.id,type:'forced',title:'Versement en retard',sub:`Faute de cotisation de ${f.memberName} — Cycle ${f.cycle}`,icon:TriangleAlert,bg:C.rdl,fg:C.rd,members:fm?[fm]:[],cycle:f.cycle})
 })

 const remind=(m)=>{
 if(!m) return
 const digits=(m.phone||'').replace(/[^0-9]/g,'')
 const msg=`Bonjour ${m.name}, ceci est un message de rappel : votre cotisation pour la tontine "${config.tontineName}" (Cycle ${currentCycle}) est attendue${dueDate?` le ${formatDueDate(dueDate)}`:''}. Merci de régulariser dès que possible.\n\n${config.adminName||config.tontineName}`
 const url=digits?`https://wa.me/${digits}?text=${encodeURIComponent(msg)}`:`https://wa.me/?text=${encodeURIComponent(msg)}`
 window.open(url,'_blank')
 }

 return (
 <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
 <div style={{backgroundColor:C.gd,padding:'calc(env(safe-area-inset-top) + 14px) 16px 16px',display:'flex',alignItems:'center',gap:10}}>
 <BackBtn onClick={onBack}/>
 <div>
 <div style={{color:'#fff',fontSize:17,fontWeight:700}}>Notifications</div>
 <div style={{color:'rgba(255,255,255,0.8)',fontSize:11,marginTop:2}}>{notifications.length} notification{notifications.length>1?'s':''}</div>
 </div>
 </div>
 <div style={{flex:1,overflowY:'auto',padding:16,display:'flex',flexDirection:'column',gap:12}}>
 {notifications.length===0&&<div style={{backgroundColor:C.white,border:`1px solid ${C.grb}`,borderRadius:12,padding:24,textAlign:'center',color:C.text2,fontSize:13}}>Aucune notification pour le moment.</div>}
 {notifications.map(n=>(
 <div key={n.id} style={{backgroundColor:C.white,border:`1px solid ${C.grb}`,borderRadius:12,padding:14}}>
 <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
 <IconCircle icon={n.icon} bg={n.bg} fg={n.fg} size={34} iconSize={16}/>
 <div style={{flex:1}}>
 <div style={{fontSize:13,fontWeight:700,color:C.text}}>{n.title}</div>
 <div style={{fontSize:12,color:C.text2,marginTop:2}}>{n.sub}</div>
 </div>
 </div>
 <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:12}}>
 {(n.type==='retard'||n.type==='rappel'||n.type==='forced')&&(n.members||[]).map(m=>(
 <div key={m.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,backgroundColor:C.gr,borderRadius:8,padding:'8px 10px',flexWrap:'wrap'}}>
 <span style={{fontSize:12,color:C.text,fontWeight:600}}>{m.name}</span>
 <div style={{display:'flex',gap:6}}>
 <button onClick={()=>remind(m)} style={{display:'flex',alignItems:'center',gap:4,backgroundColor:'#25D366',color:'#fff',border:'none',borderRadius:6,padding:'5px 8px',fontSize:11,fontWeight:700,cursor:'pointer'}}><Share2 size={11}/> Rappeler</button>
 <button onClick={()=>onPay&&onPay(m.id)} style={{backgroundColor:C.g,color:'#fff',border:'none',borderRadius:6,padding:'5px 8px',fontSize:11,fontWeight:700,cursor:'pointer'}}>Payer</button>
 </div>
 </div>
 ))}
 {n.type==='attente'&&(
 <button onClick={()=>onVerser&&onVerser()} style={{display:'flex',alignItems:'center',gap:6,backgroundColor:C.gd,color:'#fff',border:'none',borderRadius:8,padding:'8px 12px',fontSize:12,fontWeight:700,cursor:'pointer'}}><Banknote size={13}/> Verser la cagnotte</button>
 )}
 </div>
 </div>
 ))}
 </div>
 </div>
 )
}

export function RapportScreen({config,members,payments,payouts,cycles,forcedAdvances,onPayout,onRenew,onForceAdvance,onUpdateConfig,onBack}) {
 const sym=config.currency?.symbol||config.currency?.code||'F'
 const nbSlots=config.nbSlots||config.nbMembers||members.length||1
 const currentCycle=config.currentCycle||1
 const cotisation=config.cotisation||0
 const [versView,setVersView]=useState(false)
 const [versForm,setVersForm]=useState({beneficiary:'',slotOrder:'',frais:'0',date:new Date().toISOString().slice(0,10),mode:'Espèces',note:'',targetCycle:''})
 const [confirmForce,setConfirmForce]=useState(false)
 const [versConfirm,setVersConfirm]=useState(false)
 const [versPinError,setVersPinError]=useState('')
 const [versPinStep,setVersPinStep]=useState(false)
 const [facture,setFacture]=useState(null)
 const rapportRef=useRef(null)
 const factureRef=useRef(null)

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
 const closedCycles=new Set(payouts.map(p=>p.cycle))
 const pendingCycles=Array.from({length:currentCycle},(_,i)=>i+1).filter(c=>!closedCycles.has(c))
 const targetCycle=versForm.targetCycle?Number(versForm.targetCycle):(pendingCycles[0]||currentCycle)
 const targetPayments=payments.filter(p=>p.cycle===targetCycle&&p.type==='cotisation')
 const targetBrut=targetPayments.reduce((s,p)=>s+(p.amount||0),0)
 const targetPaidSlots=new Set(targetPayments.map(p=>p.slotOrder))
 const targetUnpaidMembers=activeSlots.filter(o=>!targetPaidSlots.has(o)).map(order=>members.find(m=>m.slots?m.slots.some(s=>s.order===order):m.order===order)).filter(Boolean)
 const targetFraisAmt=Math.round(targetBrut*fraisPct/100)
 const targetNet=targetBrut-targetFraisAmt

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
 if(targetUnpaidMembers.length>0){
 const noms=targetUnpaidMembers.map(m=>m.name).join(', ')
 alert(`Vous ne pouvez pas verser cette cagnotte car ${noms} n'a/n'ont pas encore payé (Cycle ${targetCycle}).`)
 return
 }
 setVersConfirm(true)
 }
 const doSubmitVersement=()=>{
 const m=members.find(x=>x.id===versForm.beneficiary)
 const slotOrd=Number(versForm.slotOrder)||targetCycle
 const p={id:'pyt_'+Date.now(),memberId:versForm.beneficiary,memberName:m?.name||'',slotOrder:slotOrd,cycle:targetCycle,amount:targetNet,brut:targetBrut,frais:targetFraisAmt,fraisPct,mode:versForm.mode,date:versForm.date,note:versForm.note,type:'versement',receiptNum:genRec(),createdAt:new Date().toISOString()}
 onPayout(p)
 if (targetCycle===currentCycle && currentCycle < nbSlots && onRenew) onRenew(versForm.beneficiary)
 setVersConfirm(false)
 setVersPinStep(false)
 setVersPinError('')
 setVersView(false)
 setFacture(p)
 }
 const confirmVersement=()=>{
 if(config.pin){ setVersPinStep(true) } else { doSubmitVersement() }
 }
 const verifyVersPin=(pin)=>{
 if(pin!==config.pin){ setVersPinError('PIN incorrect'); return }
 doSubmitVersement()
 }
 const factureWhatsapp=async()=>{
 if(!facture||!factureRef.current) return
 const m=members.find(x=>x.id===facture.memberId)
 await shareDocPDF(factureRef.current,`facture-versement-${facture.receiptNum}.pdf`,m?.phone,`Facture de versement — ${facture.memberName} — ${fmt(facture.amount,sym)} — Cycle ${facture.cycle}`)
 }
 const factureImprimer=async()=>{ if(factureRef.current) await printPDFElement(factureRef.current) }
 const unpaidCurrentMembers=activeSlots.filter(o=>!paidSlots.has(o)).map(order=>members.find(mm=>mm.slots?mm.slots.some(s=>s.order===order):mm.order===order)).filter(Boolean)
 const confirmForceAdvance=()=>{ if(unpaidCurrentMembers.length>0) setConfirmForce(true) }
 const doForceAdvance=()=>{
 onForceAdvance && onForceAdvance(unpaidCurrentMembers.map(m=>({id:m.id,name:m.name})), currentCycle)
 setConfirmForce(false)
 setVersView(false)
 }

 const printRapport=async()=>{ if(rapportRef.current) await printPDFElement(rapportRef.current) }
 const shareRapport=async()=>{
 if(!rapportRef.current) return
 const info={receiptNum:'RPT-'+Date.now().toString().slice(-4),memberName:config.adminName||'Admin',amount:totalCollected,date:new Date().toISOString()}
 await shareViaPDF(rapportRef.current,info,config.tontineName)
 }

 const inp={backgroundColor:C.white,border:`1px solid ${C.grb}`,borderRadius:8,padding:'10px 12px',fontSize:14,width:'100%',color:C.text,outline:'none',fontFamily:'inherit',boxSizing:'border-box'}
 const lbl={fontSize:12,color:C.text2,fontWeight:600,marginBottom:4,display:'block'}

 if(confirmForce) return (
 <ConfirmModal
 title="Avancer sans verser ?"
 message={`Avancer au cycle suivant sans verser la cagnotte du cycle ${currentCycle} ? Une notification de retard restera affichée pour : ${unpaidCurrentMembers.map(m=>m.name).join(', ')}.`}
 confirmLabel="Avancer quand même"
 danger
 onConfirm={doForceAdvance}
 onCancel={()=>setConfirmForce(false)}
 />
 )

 if(facture) return (
 <div style={{flex:1,overflowY:'auto',paddingBottom:80}}>
 <div style={{backgroundColor:C.gd,padding:'calc(env(safe-area-inset-top) + 14px) 16px 16px'}}>
 <div style={{color:'#fff',fontSize:17,fontWeight:700}}>Versement confirmé</div>
 <div style={{color:'rgba(255,255,255,0.8)',fontSize:11,marginTop:2}}>{facture.memberName} · {fmt(facture.amount,sym)}</div>
 </div>
 <div style={{padding:16,display:'flex',flexDirection:'column',gap:12}}>
 <div ref={factureRef} style={{backgroundColor:C.white,borderRadius:16,overflow:'hidden',border:`1px solid ${C.grb}`}}>
 <div style={{backgroundColor:C.g,padding:'20px 16px',textAlign:'center'}}>
 <div style={{margin:'0 auto',width:56}}><Logo src={config.logo} size={56} bg="#fff" radius={28} border/></div>
 <div style={{color:'#fff',fontSize:15,fontWeight:700,marginTop:10}}>{config.tontineName}</div>
 <div style={{color:'rgba(255,255,255,0.85)',fontSize:11,marginTop:4,letterSpacing:0.5}}>VERSEMENT DE CAGNOTTE</div>
 </div>
 <div style={{textAlign:'center',padding:'20px 16px 12px',borderBottom:'1px dashed '+C.grb}}>
 <div style={{fontSize:11,color:C.text2,marginBottom:4}}>Montant net versé</div>
 <div style={{fontSize:32,fontWeight:800,color:C.g,letterSpacing:-1}}>{fmt(facture.amount,sym)}</div>
 {facture.frais>0&&<div style={{fontSize:11,color:C.amb,marginTop:4}}>dont {fmt(facture.frais,sym)} de frais de gestion</div>}
 </div>
 <div style={{padding:'12px 16px',display:'flex',flexDirection:'column',gap:10}}>
 {[
 {l:'N° Facture', v:facture.receiptNum},
 {l:'Bénéficiaire', v:facture.memberName},
 {l:'Brut collecté', v:fmt(facture.brut,sym)},
 {l:'Cycle', v:`Cycle ${facture.cycle}`},
 {l:'Mode', v:facture.mode},
 {l:'Date', v:facture.createdAt?new Date(facture.createdAt).toLocaleString('fr-FR',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'}):fmtDate(facture.date)},
 ...(facture.note?[{l:'Note',v:facture.note}]:[]),
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
 <button onClick={factureWhatsapp} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,backgroundColor:'#25D366',color:'#fff',border:'none',borderRadius:12,padding:13,fontSize:14,fontWeight:700,cursor:'pointer'}}><Share2 size={16}/> Envoyer la facture (WhatsApp)</button>
 <button onClick={factureImprimer} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,backgroundColor:C.bl,color:'#fff',border:'none',borderRadius:12,padding:13,fontSize:14,fontWeight:700,cursor:'pointer'}}><Printer size={16}/> Imprimer la facture</button>
 <button onClick={()=>setFacture(null)} style={{backgroundColor:C.gr,color:C.text2,border:'none',borderRadius:12,padding:13,fontSize:14,fontWeight:600,cursor:'pointer',marginTop:4}}>Terminer</button>
 </div>
 </div>
 )

 if(versPinStep) return (
 <PinModal title="PIN requis" sub="Confirmez le versement avec votre PIN" error={versPinError} onClearError={()=>setVersPinError('')} onConfirm={verifyVersPin} onCancel={()=>{setVersPinStep(false);setVersPinError('')}}/>
 )

 if(versConfirm) return (
 <ConfirmModal
 title="Confirmer le versement"
 message={`Verser ${fmt(targetNet,sym)} à ${members.find(x=>x.id===versForm.beneficiary)?.name||''} pour le Cycle ${targetCycle} ?`}
 confirmLabel="Confirmer"
 onConfirm={confirmVersement}
 onCancel={()=>setVersConfirm(false)}
 />
 )

 if(versView) return (
 <div style={{flex:1,overflowY:'auto',paddingBottom:80}}>
 <div style={{backgroundColor:C.gd,padding:'calc(env(safe-area-inset-top) + 14px) 16px 16px',display:'flex',alignItems:'center',gap:12}}>
 <BackBtn onClick={()=>setVersView(false)}/>
 <div>
 <div style={{color:'#fff',fontSize:17,fontWeight:700}}>Verser la cagnotte</div>
 <div style={{color:'rgba(255,255,255,0.8)',fontSize:11,marginTop:1}}>Cycle {targetCycle}{pendingCycles.length>1?` · ${pendingCycles.length} cycles en attente`:''}</div>
 </div>
 </div>
 <div style={{padding:'16px 14px',display:'flex',flexDirection:'column',gap:12}}>
 {pendingCycles.length>1&&(
 <div>
 <label style={lbl}>Cycle à verser</label>
 <select style={{...inp,cursor:'pointer'}} value={targetCycle} onChange={e=>setVersForm(p=>({...p,targetCycle:e.target.value}))}>
 {pendingCycles.map(c=><option key={c} value={c}>Cycle {c}</option>)}
 </select>
 </div>
 )}
 <div style={{backgroundColor:C.gl,borderRadius:10,padding:14}}>
 <div style={{fontSize:11,color:C.gd,marginBottom:4}}>Cagnotte cycle {targetCycle}</div>
 <div style={{fontSize:22,fontWeight:800,color:C.g}}>{fmt(targetBrut,sym)}</div>
 {currentSlotMember&&<div style={{fontSize:12,color:C.gd,marginTop:4,fontWeight:600}}>Bénéficiaire prévu : {currentSlotMember.name} (Tour #{currentCycle})</div>}
 </div>
 {targetUnpaidMembers.length>0&&(
 <div style={{backgroundColor:C.rdl,borderRadius:10,padding:12,fontSize:12,color:C.rd}}>
 Cotisation incomplète — en attente de : {targetUnpaidMembers.map(m=>m.name).join(', ')}.
 {targetCycle===currentCycle&&(
 <button onClick={confirmForceAdvance} style={{display:'block',marginTop:8,backgroundColor:'#fff',color:C.rd,border:`1px solid ${C.rd}`,borderRadius:8,padding:'8px 10px',fontSize:12,fontWeight:700,cursor:'pointer'}}>
 Avancer le cycle sans verser (laisse une notification de retard)
 </button>
 )}
 </div>
 )}
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
 {[[`Brut collecté`,fmt(targetBrut,sym)],[`Frais (${fraisPct}%)`,`- ${fmt(targetFraisAmt,sym)}`]].map(([k,v])=>(
 <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'8px 12px',borderBottom:`0.5px solid ${C.gr}`}}><span style={{fontSize:12,color:C.text2}}>{k}</span><span style={{fontSize:12,fontWeight:500}}>{v}</span></div>
 ))}
 <div style={{display:'flex',justifyContent:'space-between',padding:'10px 12px',backgroundColor:C.gl}}>
 <span style={{fontSize:13,fontWeight:700,color:C.gd}}>Net à verser</span>
 <span style={{fontSize:16,fontWeight:800,color:C.g}}>{fmt(targetNet,sym)}</span>
 </div>
 </div>
 <button onClick={submitVersement} disabled={targetUnpaidMembers.length>0} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,backgroundColor:targetUnpaidMembers.length>0?C.grb:C.gd,color:'#fff',border:'none',borderRadius:12,padding:14,fontSize:15,fontWeight:700,cursor:targetUnpaidMembers.length>0?'not-allowed':'pointer'}}><Banknote size={16}/> Confirmer le versement</button>
 </div>
 </div>
 )

 return (
 <div style={{flex:1,overflowY:'auto',paddingBottom:80}}>
 <div style={{backgroundColor:C.gd,padding:'calc(env(safe-area-inset-top) + 14px) 16px 16px'}}>
 <div style={{color:'#fff',fontSize:17,fontWeight:700}}>Rapports</div>
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
 <button onClick={()=>{setVersForm(p=>({...p,targetCycle:String(pendingCycles[0]||currentCycle)}));setVersView(true)}} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,backgroundColor:C.gd,color:'#fff',border:'none',borderRadius:10,padding:'12px 16px',margin:'0 14px 12px',width:'calc(100% - 28px)',fontSize:14,fontWeight:700,cursor:'pointer'}}>
 <Banknote size={16}/> Verser la cagnotte{pendingCycles.length>1?` (${pendingCycles.length} en attente)`:` — Cycle ${currentCycle}${currentSlotMember?` → ${currentSlotMember.name}`:''}`}
 </button>
 <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'4px 14px 6px'}}>
 <span style={{fontSize:11,fontWeight:700,color:C.text2,textTransform:'uppercase',letterSpacing:0.5}}>Tableau des tours</span>
 </div>
 <div style={{padding:'0 14px',display:'flex',flexDirection:'column',gap:8,marginBottom:8}}>
 {slotRows.map(({order,payout,total,status,member})=>(
 <div key={order} onClick={()=>status==='cloture'&&payout&&setFacture(payout)}
 style={{backgroundColor:C.white,border:`1px solid ${status==='encours'?C.g:C.grb}`,borderRadius:10,padding:12,borderLeftWidth:status==='encours'?3:1,borderLeftColor:status==='encours'?C.g:C.grb,cursor:status==='cloture'?'pointer':'default'}}>
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
 <Badge label={status==='cloture'?'Versé':status==='encours'?'En cours':status==='passe'?'Passé':'À venir'} type={status==='cloture'?'ok':status==='encours'?'warn':status==='passe'?'bad':'info'}/>
 </div>
 <div style={{fontSize:11,color:C.text2,marginTop:4}}>
 {status==='cloture'&&payout?`Versé ${fmtDate(payout.date)} · ${fmt(payout.amount,sym)}`:status==='futur'?`Prévu · ${fmt(cotisation*nbSlots,sym)}`:status==='encours'?`${fmt(total,sym)} collectés`:'Cycle passé'}
 </div>
 </div>
 ))}
 </div>
 </div>
 <div style={{display:'flex',gap:8,padding:'0 14px 8px'}}>
 <button onClick={printRapport} style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6,backgroundColor:C.g,color:'#fff',border:'none',borderRadius:8,padding:10,fontSize:12,fontWeight:700,cursor:'pointer'}}><Printer size={14}/> Imprimer PDF</button>
 <button onClick={shareRapport} style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6,backgroundColor:'#25D366',color:'#fff',border:'none',borderRadius:8,padding:10,fontSize:12,fontWeight:700,cursor:'pointer'}}><Share2 size={14}/> WhatsApp PDF</button>
 </div>
 <div style={{textAlign:'center',padding:12,fontSize:10,color:C.text2}}>Powered by IZIsoft</div>
 </div>
 )
}

/* ---------------------------- Paramètres ---------------------------- */

const Section=({icon:Icon,title,sub,bgIcon,fgIcon,children})=>{
 const [open,setOpen]=useState(false)
 return (
 <div style={{margin:'0 14px 8px',backgroundColor:C.white,border:`1px solid ${C.grb}`,borderRadius:12,overflow:'hidden'}}>
 <button onClick={()=>setOpen(v=>!v)} style={{width:'100%',display:'flex',alignItems:'center',gap:12,padding:'14px',background:'none',border:'none',cursor:'pointer',textAlign:'left'}}>
 <IconCircle icon={Icon} bg={bgIcon||C.gl} fg={fgIcon||C.gd} size={36} iconSize={17}/>
 <div style={{flex:1}}>
 <div style={{fontSize:14,fontWeight:600,color:C.text}}>{title}</div>
 {sub&&<div style={{fontSize:11,color:C.text2,marginTop:1}}>{sub}</div>}
 </div>
 <ChevronRight size={18} color={C.text2} style={{transition:'transform .2s',transform:open?'rotate(90deg)':'rotate(0deg)'}}/>
 </button>
 {open&&<div style={{borderTop:`1px solid ${C.gr}`}}>{children}</div>}
 </div>
 )
}

const Item=({icon:Icon,bg,fg,label,sub,right,onClick})=>(
 <div onClick={onClick} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 14px',borderBottom:`0.5px solid ${C.gr}`,cursor:onClick?'pointer':'default'}}>
 <div style={{display:'flex',alignItems:'center',gap:10}}>
 <IconCircle icon={Icon} bg={bg||C.gl} fg={fg||C.gd} size={30} iconSize={14}/>
 <div><div style={{fontSize:13,fontWeight:500,color:C.text}}>{label}</div>{sub&&<div style={{fontSize:11,color:C.text2,marginTop:1}}>{sub}</div>}</div>
 </div>
 {right}
 </div>
)

function CotisationDatesModal({config,onSave,onCancel}) {
 const [unit,setUnit]=useState(config.frequencyUnit||'mois')
 const [count,setCount]=useState(config.frequencyCount||1)
 const [dates,setDates]=useState(config.cotisationDates||[])
 const [days,setDays]=useState(config.cotisationDays||[])
 const {mode,effectiveCount}=resolveInputMode(unit,count)
 const inp={backgroundColor:C.white,border:`1px solid ${C.grb}`,borderRadius:8,padding:'10px 12px',fontSize:14,width:'100%',color:C.text,outline:'none',marginTop:4,boxSizing:'border-box'}
 const lbl={fontSize:12,color:C.text2,fontWeight:600}
 const changeUnit=(u)=>{ setUnit(u); setCount(1); setDates([]); setDays([]) }
 const changeCount=(v)=>{ const n=clampFrequencyCount(unit,v); setCount(n); setDates([]); setDays([]) }
 const canSave = unit==='jour' || (mode==='dates'?Array.from({length:effectiveCount}).every((_,i)=>dates[i]):Array.from({length:effectiveCount}).every((_,i)=>days[i]))
 return (
 <div style={{position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.55)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
 <div style={{width:'100%',maxWidth:480,backgroundColor:C.white,borderRadius:'20px 20px 0 0',padding:'20px 20px calc(env(safe-area-inset-bottom) + 20px)',maxHeight:'85vh',overflowY:'auto',boxSizing:'border-box'}}>
 <div style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:14}}>Dates/jours de cotisation</div>
 <div>
 <label style={lbl}>Unité de cotisation</label>
 <div style={{display:'flex',gap:8,marginTop:6}}>
 {Object.values(FREQUENCY_UNITS).map(u=>(
 <button key={u.key} onClick={()=>changeUnit(u.key)}
 style={{flex:1,padding:'8px 0',borderRadius:8,border:`2px solid ${unit===u.key?C.g:C.grb}`,backgroundColor:unit===u.key?C.gl:C.white,color:unit===u.key?C.gd:C.text2,fontSize:13,fontWeight:700,cursor:'pointer'}}>{u.label}</button>
 ))}
 </div>
 </div>
 {FREQUENCY_UNITS[unit]?.needsCount && (
 <div style={{marginTop:14}}>
 <label style={lbl}>Nombre de fois par {unit} <span style={{color:C.text2,fontWeight:400}}>(max {FREQUENCY_UNITS[unit].maxCount})</span></label>
 <input style={inp} type="number" min="1" max={FREQUENCY_UNITS[unit].maxCount} placeholder="Ex: 2" value={count} onChange={e=>changeCount(e.target.value)}/>
 {unit==='mois' && count>0 && count%4===0 && (
 <div style={{marginTop:6,backgroundColor:C.pur,borderRadius:6,padding:'6px 10px',fontSize:11,color:C.purd}}>
 {count}x/mois équivaut à {effectiveCount>1?`${effectiveCount} jours`:'1 jour'} fixe{effectiveCount>1?'s':''} par semaine — choisissez {effectiveCount>1?'les jours':'le jour'} ci-dessous.
 </div>
 )}
 </div>
 )}
 {unit==='jour' && (
 <div style={{fontSize:13,color:C.text2,lineHeight:1.4,marginTop:14}}>La cotisation est configurée pour chaque jour. Aucune date spécifique à définir.</div>
 )}
 {unit!=='jour' && mode==='dates' && (
 <div style={{marginTop:14}}>
 <label style={lbl}>Date{effectiveCount>1?'s':''} exacte{effectiveCount>1?'s':''} (jour du mois, max {MAX_MOIS_DAY})</label>
 <div style={{display:'flex',gap:8,marginTop:4,flexWrap:'wrap'}}>
 {Array.from({length:effectiveCount},(_,i)=>i).map(i=>{
 const prevVal=i>0?dates[i-1]:null
 const disabled=i>0 && !prevVal
 const options=Array.from({length:MAX_MOIS_DAY},(_,d)=>d+1).filter(d=>!prevVal||d>prevVal)
 return (
 <select key={i} disabled={disabled} style={{...inp,cursor:disabled?'not-allowed':'pointer',flex:'1 1 90px',opacity:disabled?0.5:1}} value={dates[i]||''}
 onChange={e=>{
 const v=Number(e.target.value)
 setDates(p=>{ const arr=[...p]; arr[i]=v; for(let j=i+1;j<arr.length;j++) arr[j]=''; return arr })
 }}>
 <option value="">Date {i+1}</option>
 {options.map(d=><option key={d} value={d}>{d}</option>)}
 </select>
 )
 })}
 </div>
 </div>
 )}
 {unit!=='jour' && mode==='days' && (
 <div style={{marginTop:14}}>
 <label style={lbl}>Jour{effectiveCount>1?'s':''} exact{effectiveCount>1?'s':''} de la semaine</label>
 <div style={{display:'flex',gap:8,marginTop:4,flexWrap:'wrap'}}>
 {Array.from({length:effectiveCount},(_,i)=>i).map(i=>{
 const prevVal=i>0?days[i-1]:null
 const prevIdx=prevVal?WEEKDAYS.indexOf(prevVal):-1
 const disabled=i>0 && !prevVal
 const options=WEEKDAYS.filter((_,idx)=>idx>prevIdx)
 return (
 <select key={i} disabled={disabled} style={{...inp,cursor:disabled?'not-allowed':'pointer',flex:'1 1 140px',opacity:disabled?0.5:1}} value={days[i]||''}
 onChange={e=>{
 const v=e.target.value
 setDays(p=>{ const arr=[...p]; arr[i]=v; for(let j=i+1;j<arr.length;j++) arr[j]=''; return arr })
 }}>
 <option value="">Jour {i+1}</option>
 {options.map(d=><option key={d} value={d}>{d}</option>)}
 </select>
 )
 })}
 </div>
 </div>
 )}
 <div style={{display:'flex',gap:10,marginTop:18}}>
 <button onClick={onCancel} style={{flex:1,padding:12,backgroundColor:C.gr,color:C.text2,border:'none',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Annuler</button>
 <button disabled={!canSave} onClick={()=>onSave({frequencyUnit:unit,frequencyCount:count,frequency:buildFrequencyLabel(unit,count),cotisationDates:dates,cotisationDays:days})} style={{flex:1,padding:12,backgroundColor:canSave?C.g:C.grb,color:'#fff',border:'none',borderRadius:10,fontSize:14,fontWeight:700,cursor:canSave?'pointer':'not-allowed',fontFamily:'inherit'}}>Enregistrer</button>
 </div>
 </div>
 </div>
 )
}

function CurrencyModal({current,onSave,onCancel}) {
 const [search,setSearch]=useState('')
 const [sel,setSel]=useState(current||null)
 const filtered=CURRENCIES.filter(c=>c.name.toLowerCase().includes(search.toLowerCase())||c.code.toLowerCase().includes(search.toLowerCase()))
 return (
 <div style={{position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.55)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
 <div style={{width:'100%',maxWidth:480,backgroundColor:C.white,borderRadius:'20px 20px 0 0',padding:'20px 20px calc(env(safe-area-inset-bottom) + 20px)',maxHeight:'85vh',display:'flex',flexDirection:'column',boxSizing:'border-box'}}>
 <div style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:14}}>Devise</div>
 <input autoFocus style={{backgroundColor:C.white,border:`1px solid ${C.grb}`,borderRadius:8,padding:'10px 12px',fontSize:14,width:'100%',outline:'none',boxSizing:'border-box',marginBottom:10}} placeholder="Rechercher..." value={search} onChange={e=>setSearch(e.target.value)}/>
 <div style={{overflowY:'auto',display:'flex',flexDirection:'column',gap:8,flex:1}}>
 {filtered.map(item=>(
 <div key={item.code} onClick={()=>setSel(item)}
 style={{display:'flex',justifyContent:'space-between',alignItems:'center',backgroundColor:sel?.code===item.code?C.gl:C.white,border:`1px solid ${sel?.code===item.code?C.g:C.grb}`,borderRadius:10,padding:12,cursor:'pointer'}}>
 <div>
 <div style={{fontSize:13,fontWeight:600,color:C.text}}>{item.name}</div>
 <div style={{fontSize:11,color:C.text2}}>{item.code} · {item.symbol}</div>
 </div>
 {sel?.code===item.code&&<Check size={20} color={C.g}/>}
 </div>
 ))}
 </div>
 <div style={{display:'flex',gap:10,marginTop:18}}>
 <button onClick={onCancel} style={{flex:1,padding:12,backgroundColor:C.gr,color:C.text2,border:'none',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Annuler</button>
 <button disabled={!sel} onClick={()=>onSave(sel)} style={{flex:1,padding:12,backgroundColor:sel?C.g:C.grb,color:'#fff',border:'none',borderRadius:10,fontSize:14,fontWeight:700,cursor:sel?'pointer':'not-allowed',fontFamily:'inherit'}}>Enregistrer</button>
 </div>
 </div>
 </div>
 )
}

export function ParametresScreen({config,members,payments,payouts,onUpdateConfig,onReset,onSwitchTontine=null}) {
 const sym=config.currency?.symbol||config.currency?.code||'F'
 const nbSlotsTotal=config.nbSlots||config.nbMembers||1
 const currentCycleNow=config.currentCycle||1
 const [autoSave,setAutoSave]=useState(true)
 const [pinFlow,setPinFlow]=useState(null)
 const [newPin,setNewPin]=useState('')
 const [pinError,setPinError]=useState('')
 const [pinSuccess,setPinSuccess]=useState(false)
 const [confirmCycleOpen,setConfirmCycleOpen]=useState(false)
 const [resetFlow,setResetFlow]=useState(null)
 const [resetPinError,setResetPinError]=useState('')
 const [datesModalOpen,setDatesModalOpen]=useState(false)
 const [currencyModalOpen,setCurrencyModalOpen]=useState(false)
 const hasPin=!!config.pin
 const totalPay=payments.length
 const totalPayout=payouts.length
 const dataSize=JSON.stringify({config,members,payments,payouts}).length
 const logoInputRef=useRef(null)
 const [logoBusy,setLogoBusy]=useState(false)
 const [editField,setEditField]=useState(null)
 const openEdit=(cfg)=>setEditField(cfg)
 const closeEdit=()=>setEditField(null)
 const saveEdit=(rawVal)=>{
 if(!editField) return
 const {key,kind}=editField
 if(kind==='text'){
 const v=rawVal.trim()
 if(key==='tontineName'&&!v) return
 onUpdateConfig({...config,[key]:v})
 } else if(kind==='textarea'){
 onUpdateConfig({...config,[key]:rawVal.trim()})
 } else if(kind==='number-required'){
 if(!isNaN(Number(rawVal))&&Number(rawVal)>0) onUpdateConfig({...config,[key]:Number(rawVal)})
 } else if(kind==='number-optional'){
 if(rawVal.trim()===''){ const cfg={...config}; delete cfg[key]; onUpdateConfig(cfg) }
 else if(!isNaN(Number(rawVal))&&Number(rawVal)>=0) onUpdateConfig({...config,[key]:Number(rawVal)})
 } else if(kind==='number-optional-positive'){
 if(rawVal.trim()===''){ const cfg={...config}; delete cfg[key]; onUpdateConfig(cfg) }
 else if(!isNaN(Number(rawVal))&&Number(rawVal)>0) onUpdateConfig({...config,[key]:Number(rawVal)})
 } else if(kind==='number-percent'){
 if(!isNaN(Number(rawVal))&&Number(rawVal)>=0) onUpdateConfig({...config,[key]:Number(rawVal)})
 }
 setEditField(null)
 }

 const pickLogo=()=>logoInputRef.current?.click()
 const handleLogoFile=async(e)=>{
   const file=e.target.files?.[0]
   e.target.value=''
   if(!file) return
   if(!file.type.startsWith('image/')) return alert('Choisissez un fichier image.')
   setLogoBusy(true)
   try{
     const dataUrl=await resizeImageFile(file,256)
     onUpdateConfig({...config,logo:dataUrl})
   }catch(err){
     alert("Impossible de charger cette image.")
   }finally{
     setLogoBusy(false)
   }
 }
 const resetLogo=()=>{
   const cfg={...config}; delete cfg.logo
   onUpdateConfig(cfg)
 }

 const [appLogoVersion,setAppLogoVersion]=useState(0)
 const appLogoInputRef=useRef(null)
 const [appLogoBusy,setAppLogoBusy]=useState(false)
 const pickAppLogo=()=>appLogoInputRef.current?.click()
 const handleAppLogoFile=async(e)=>{
   const file=e.target.files?.[0]
   e.target.value=''
   if(!file) return
   if(!file.type.startsWith('image/')) return alert('Choisissez un fichier image.')
   setAppLogoBusy(true)
   try{
     const dataUrl=await resizeImageFile(file,256)
     setAppLogo(dataUrl)
     setAppLogoVersion(v=>v+1)
   }catch(err){
     alert("Impossible de charger cette image.")
   }finally{
     setAppLogoBusy(false)
   }
 }
 const resetAppLogoIcon=()=>{
   resetAppLogo()
   setAppLogoVersion(v=>v+1)
 }

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
 setResetFlow('step1')
 }
 const handleResetPinVerify=pin=>{
 if(pin!==config.pin){setResetPinError('PIN incorrect');return}
 setResetPinError('');setResetFlow('step2')
 }
 const pinModalProps=()=>{
 if(pinFlow==='verify') return {title:'Entrez votre PIN actuel', sub:'Vérification avant modification'}
 if(pinFlow==='new') return {title:'Nouveau PIN', sub:'Choisissez 4 chiffres'}
 if(pinFlow==='confirm') return {title:'Confirmer le nouveau PIN', sub:'Ressaisissez les 4 chiffres'}
 if(pinFlow==='disable') return {title:'Entrez votre PIN actuel', sub:'Pour désactiver la protection'}
 return {}
 }

 return (
 <div style={{flex:1,overflowY:'auto',paddingBottom:80}}>
 {pinFlow&&<PinModal {...pinModalProps()} error={pinError} onClearError={()=>setPinError('')} onConfirm={pinFlow==='disable'?handleDisableVerify:handlePinStep} onCancel={cancelPin}/>}
 {editField&&<EditFieldModal title={editField.title} placeholder={editField.placeholder} initialValue={String(editField.value??'')} multiline={editField.kind==='textarea'} type={editField.kind.startsWith('number')?'number':'text'} onSave={saveEdit} onCancel={closeEdit}/>}
 {datesModalOpen&&<CotisationDatesModal config={config} onSave={(vals)=>{onUpdateConfig({...config,...vals});setDatesModalOpen(false)}} onCancel={()=>setDatesModalOpen(false)}/>}
 {currencyModalOpen&&<CurrencyModal current={config.currency} onSave={(cur)=>{onUpdateConfig({...config,currency:cur});setCurrencyModalOpen(false)}} onCancel={()=>setCurrencyModalOpen(false)}/>}
 {resetFlow==='pin'&&<PinModal title="Entrez votre PIN actuel" sub="Vérification avant réinitialisation" error={resetPinError} onClearError={()=>setResetPinError('')} onConfirm={handleResetPinVerify} onCancel={()=>{setResetFlow(null);setResetPinError('')}}/>}
 {resetFlow==='step1'&&(
 <div style={{position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:20}}>
 <div style={{backgroundColor:C.white,borderRadius:14,padding:20,width:'100%',maxWidth:340,boxShadow:'0 10px 40px rgba(0,0,0,0.2)'}}>
 <div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:8}}>Réinitialiser l'application ?</div>
 <div style={{fontSize:13,color:C.text2,marginBottom:18,lineHeight:1.4}}>Membres, paiements, tours et configuration seront tous supprimés.</div>
 <div style={{display:'flex',gap:8}}>
 <button onClick={()=>setResetFlow(null)} style={{flex:1,padding:12,backgroundColor:C.gr,color:C.text2,border:'none',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Annuler</button>
 <button onClick={()=>{setResetPinError('');setResetFlow(hasPin?'pin':'step2')}} style={{flex:1,padding:12,backgroundColor:'#D64545',color:'#fff',border:'none',borderRadius:10,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>Continuer</button>
 </div>
 </div>
 </div>
 )}
 {resetFlow==='step2'&&(
 <div style={{position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:20}}>
 <div style={{backgroundColor:C.white,borderRadius:14,padding:20,width:'100%',maxWidth:340,boxShadow:'0 10px 40px rgba(0,0,0,0.2)'}}>
 <div style={{fontSize:15,fontWeight:700,color:'#D64545',marginBottom:8}}>Action irréversible</div>
 <div style={{fontSize:13,color:C.text2,marginBottom:18,lineHeight:1.4}}>Cette suppression est définitive et ne peut pas être annulée.</div>
 <div style={{display:'flex',gap:8}}>
 <button onClick={()=>setResetFlow(null)} style={{flex:1,padding:12,backgroundColor:C.gr,color:C.text2,border:'none',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Annuler</button>
 <button onClick={()=>{setResetFlow(null);onReset()}} style={{flex:1,padding:12,backgroundColor:'#D64545',color:'#fff',border:'none',borderRadius:10,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>Réinitialiser</button>
 </div>
 </div>
 </div>
 )}
 {confirmCycleOpen==='confirm'&&(
 <div style={{position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:20}}>
 <div style={{backgroundColor:C.white,borderRadius:14,padding:20,width:'100%',maxWidth:340,boxShadow:'0 10px 40px rgba(0,0,0,0.2)'}}>
 <div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:8}}>Passer au cycle suivant ?</div>
 <div style={{fontSize:13,color:C.text2,marginBottom:18,lineHeight:1.4}}>Vous allez passer du cycle {currentCycleNow} au cycle {currentCycleNow+1} sur {nbSlotsTotal}.</div>
 <div style={{display:'flex',gap:8}}>
 <button onClick={()=>setConfirmCycleOpen(false)} style={{flex:1,padding:12,backgroundColor:C.gr,color:C.text2,border:'none',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Annuler</button>
 <button onClick={()=>{onUpdateConfig({...config,currentCycle:currentCycleNow+1});setConfirmCycleOpen(false)}} style={{flex:1,padding:12,backgroundColor:C.g,color:'#fff',border:'none',borderRadius:10,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>Confirmer</button>
 </div>
 </div>
 </div>
 )}
 {confirmCycleOpen==='blocked'&&(
 <div style={{position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:20}}>
 <div style={{backgroundColor:C.white,borderRadius:14,padding:20,width:'100%',maxWidth:340,boxShadow:'0 10px 40px rgba(0,0,0,0.2)'}}>
 <div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:8}}>Dernier cycle atteint</div>
 <div style={{fontSize:13,color:C.text2,marginBottom:18,lineHeight:1.4}}>Impossible d'avancer davantage : vous êtes déjà au cycle {currentCycleNow} sur {nbSlotsTotal}.</div>
 <button onClick={()=>setConfirmCycleOpen(false)} style={{width:'100%',padding:12,backgroundColor:C.g,color:'#fff',border:'none',borderRadius:10,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>OK</button>
 </div>
 </div>
 )}
 <div style={{backgroundColor:C.g,padding:'calc(env(safe-area-inset-top) + 14px) 16px 16px'}}>
 <div style={{color:'#fff',fontSize:17,fontWeight:700}}>Paramètres</div>
 <div style={{color:'rgba(255,255,255,0.8)',fontSize:11,marginTop:2}}>{config.tontineName}</div>
 </div>
 <div style={{backgroundColor:C.gl,border:`1px solid #5DCAA5`,borderRadius:10,margin:'12px 14px',padding:14,display:'flex',alignItems:'center',gap:10}}>
 <Logo src={config.logo} size={36} bg="#fff" radius={10} border/>
 <div>
 <div style={{fontSize:14,fontWeight:700,color:C.gd}}>{config.tontineName}</div>
 <div style={{fontSize:11,color:C.g2,marginTop:2}}>{members.length} membres · {config.nbSlots||config.nbMembers||'?'} tours · {fmt(config.cotisation,sym)}/{config.frequency||'mois'}</div>
 <div style={{fontSize:11,color:C.text2,marginTop:1}}>Cycle {config.currentCycle||1} en cours</div>
 </div>
 </div>

 <Section icon={ImageUp} bgIcon={C.pur} fgIcon={C.purd} title="Apparence" sub="Logo de la tontine">
   <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoFile} style={{display:'none'}}/>
   <div style={{padding:'14px',display:'flex',alignItems:'center',gap:14}}>
     <Logo src={config.logo} size={56} bg="#fff" radius={14} border/>
     <div style={{flex:1,display:'flex',flexDirection:'column',gap:8}}>
       <button onClick={pickLogo} disabled={logoBusy} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:7,backgroundColor:C.gl,color:C.gd,border:'none',borderRadius:9,padding:'9px 12px',fontSize:13,fontWeight:700,cursor:logoBusy?'default':'pointer'}}>
         <ImageUp size={15}/> {logoBusy?'Chargement…':config.logo?'Changer le logo':'Ajouter un logo'}
       </button>
       {config.logo && (
         <button onClick={resetLogo} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:7,backgroundColor:'transparent',color:C.text2,border:`1px solid ${C.grb}`,borderRadius:9,padding:'8px 12px',fontSize:12,fontWeight:600,cursor:'pointer'}}>
           <RotateCcw size={13}/> Revenir au logo par défaut
         </button>
       )}
     </div>
   </div>
   <div style={{padding:'0 14px 14px',borderTop:`1px solid ${C.gr}`}}>
     <input ref={appLogoInputRef} type="file" accept="image/*" onChange={handleAppLogoFile} style={{display:'none'}}/>
     <div style={{display:'flex',alignItems:'center',gap:14,paddingTop:14}}>
       <div style={{width:56,height:56,borderRadius:14,overflow:'hidden',border:`1px solid ${C.grb}`,flexShrink:0}}>
         <img key={appLogoVersion} src={getAppLogo() || tontineLogoDefault} alt="Icône app" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
       </div>
       <div style={{flex:1,display:'flex',flexDirection:'column',gap:8}}>
         <div style={{fontSize:12,color:C.text2}}>Icône par défaut de l'app (écrans de sélection et création de tontine)</div>
         <button onClick={pickAppLogo} disabled={appLogoBusy} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:7,backgroundColor:C.pur,color:C.purd,border:'none',borderRadius:9,padding:'9px 12px',fontSize:13,fontWeight:700,cursor:appLogoBusy?'default':'pointer'}}>
           <ImageUp size={15}/> {appLogoBusy?'Chargement…':'Changer l\'icône par défaut'}
         </button>
         {getAppLogo() && (
           <button onClick={resetAppLogoIcon} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:7,backgroundColor:'transparent',color:C.text2,border:`1px solid ${C.grb}`,borderRadius:9,padding:'8px 12px',fontSize:12,fontWeight:600,cursor:'pointer'}}>
             <RotateCcw size={13}/> Revenir à l'icône par défaut
           </button>
         )}
       </div>
     </div>
   </div>
 </Section>

 <Section icon={Repeat2} bgIcon={C.gl} fgIcon={C.gd} title="Tontine" sub="Nom, cotisation, cycle">
 <Item icon={Pencil} bg={C.gl} fg={C.gd} label="Nom de la tontine" sub={config.tontineName} right={<ChevronRight size={16} color={C.text2}/>}
 onClick={()=>openEdit({key:'tontineName',kind:'text',title:'Nom de la tontine',placeholder:'Nom de la tontine',value:config.tontineName||''})}/>
 <Item icon={ClipboardList} bg={C.bll} fg={C.bld} label="Description" sub={config.description||'Non définie'} right={<ChevronRight size={16} color={C.text2}/>}
 onClick={()=>openEdit({key:'description',kind:'textarea',title:'Description de la tontine',placeholder:'Décrivez la tontine…',value:config.description||''})}/>
 <Item icon={ShieldCheck} bg={C.pur} fg={C.purd} label="Règlement" sub={config.reglement?`${config.reglement.slice(0,40)}${config.reglement.length>40?'…':''}`:'Non défini'} right={<ChevronRight size={16} color={C.text2}/>}
 onClick={()=>openEdit({key:'reglement',kind:'textarea',title:'Règlement de la tontine',placeholder:'Règles à respecter…',value:config.reglement||''})}/>
 <Item icon={Users} bg={C.gl} fg={C.gd} label="Places max par membre" sub={config.maxSlotsPerMember?`${config.maxSlotsPerMember} places max`:'Illimité'} right={<ChevronRight size={16} color={C.text2}/>}
 onClick={()=>openEdit({key:'maxSlotsPerMember',kind:'number-optional-positive',title:'Places max par membre',placeholder:'Laisser vide = illimité',value:config.maxSlotsPerMember||''})}/>
 <Item icon={Coins} bg={C.ambl} fg={C.ambd} label="Montant cotisation" sub={`${fmt(config.cotisation,sym)} / ${config.frequency||'mois'}`} right={<ChevronRight size={16} color={C.text2}/>}
 onClick={()=>openEdit({key:'cotisation',kind:'number-required',title:'Montant de la cotisation',placeholder:'Ex: 65000',value:config.cotisation||''})}/>
 <Item icon={Coins} bg={C.gl} fg={C.gd} label="Devise" sub={config.currency?`${config.currency.name} (${config.currency.symbol||config.currency.code})`:'Non définie'} right={<ChevronRight size={16} color={C.text2}/>}
 onClick={()=>setCurrencyModalOpen(true)}/>
 <Item icon={CalendarClock} bg={C.bll} fg={C.bld} label="Dates/jours de cotisation" sub={
   config.frequencyUnit==='jour' ? 'Chaque jour'
   : (config.cotisationDates?.filter(Boolean)?.length ? `Jour(s) ${config.cotisationDates.filter(Boolean).join(', ')} du mois`
   : (config.cotisationDays?.filter(Boolean)?.length ? config.cotisationDays.filter(Boolean).join(', ') : 'Non configuré'))
 } right={<ChevronRight size={16} color={C.text2}/>} onClick={()=>setDatesModalOpen(true)}/>
 <Item icon={CalendarClock} bg={C.bll} fg={C.bld} label="Nombre de tours" sub={`${config.nbSlots||config.nbMembers||'?'} tours`} right={<ChevronRight size={16} color={C.text2}/>}/>
 <Item icon={Percent} bg={C.ambl} fg={C.ambd} label="Pénalité de retard" sub={`${config.penaltyRate||0}% par cycle de retard`} right={<ChevronRight size={16} color={C.text2}/>}
 onClick={()=>openEdit({key:'penaltyRate',kind:'number-percent',title:'Taux de pénalité',placeholder:'0 pour désactiver',value:config.penaltyRate||0})}/>
 <Item icon={RotateCw} bg={C.pur} fg={C.purd} label="Avancer au cycle suivant" sub={currentCycleNow>=nbSlotsTotal?`Dernier cycle atteint (${currentCycleNow}/${nbSlotsTotal})`:`Actuellement : Cycle ${currentCycleNow}/${nbSlotsTotal}`} right={<ChevronRight size={16} color={currentCycleNow>=nbSlotsTotal?C.grb:C.text2}/>}
 onClick={()=>{if(currentCycleNow>=nbSlotsTotal){setConfirmCycleOpen('blocked')}else{setConfirmCycleOpen('confirm')}}}/>
 </Section>

 <Section icon={WalletCards} bgIcon={C.rdl} fgIcon={C.rd} title="Cas sociaux" sub="Autres frais et de caisse">
 <Item icon={Banknote} bg={C.rdl} fg={C.rd} label="Autres frais" sub={config.fraisDeuil?`${fmt(config.fraisDeuil,sym)}`:'Non défini — les membres ne paient rien'} right={<ChevronRight size={16} color={C.text2}/>}
 onClick={()=>openEdit({key:'fraisDeuil',kind:'number-optional',title:'Autres frais',placeholder:'Laisser vide = désactivé',value:config.fraisDeuil||''})}/>
 <Item icon={WalletCards} bg={C.rdl} fg={C.rd} label="Frais de caisse" sub={config.fraisCaisse?`${fmt(config.fraisCaisse,sym)}`:'Non défini — les membres ne paient rien'} right={<ChevronRight size={16} color={C.text2}/>}
 onClick={()=>openEdit({key:'fraisCaisse',kind:'number-optional',title:'Frais de caisse',placeholder:'Laisser vide = désactivé',value:config.fraisCaisse||''})}/>
 </Section>

 <Section icon={ReceiptText} bgIcon={C.pur} fgIcon={C.purd} title="Impression & Partage" sub="PDF, WhatsApp, format reçu">
 <Item icon={Printer} bg={C.pur} fg={C.purd} label="Format de reçu" sub="PDF A6 — Compatible 58mm" right={<Badge label="Actif" type="ok"/>}/>
 <Item icon={Share2} bg={C.gl} fg={C.gd} label="Partage WhatsApp" sub="Envoie le PDF en pièce jointe" right={<Badge label="Actif" type="ok"/>}/>
 </Section>

 <Section icon={ShieldCheck} bgIcon={C.rdl} fgIcon={C.rd} title="Sécurité" sub={hasPin?'PIN activé':'PIN désactivé'}>
 {pinSuccess&&<div style={{margin:'10px 14px 0',backgroundColor:C.gl,border:`1px solid #5DCAA5`,borderRadius:8,padding:'8px 12px',fontSize:12,color:C.gd,fontWeight:600}}>{hasPin?'PIN mis à jour':'PIN désactivé'}</div>}
 <div style={{padding:'12px 14px'}}>
 <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
 <div style={{display:'flex',alignItems:'center',gap:10}}>
 <IconCircle icon={KeyRound} bg={C.rdl} fg={C.rd} size={30} iconSize={14}/>
 <div>
 <div style={{fontSize:13,fontWeight:500,color:C.text}}>Code PIN</div>
 <div style={{fontSize:11,color:C.text2,marginTop:1}}>{hasPin?'Protection active — 4 chiffres':'Aucun PIN défini'}</div>
 </div>
 </div>
 <Toggle on={hasPin} onChange={hasPin?disablePin:startPinChange}/>
 </div>
 <button onClick={startPinChange} style={{width:'100%',padding:'9px 12px',backgroundColor:hasPin?C.pur:C.gl,color:hasPin?C.purd:C.gd,border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
 {hasPin?'Modifier le PIN':'Définir un PIN'}
 </button>
 </div>
 </Section>

 <Section icon={Package} bgIcon={C.bll} fgIcon={C.bld} title="Données" sub="Export, statistiques, backup">
 <Item icon={BarChart3} bg={C.ambl} fg={C.ambd} label="Statistiques" sub={`${totalPay} paiements · ${totalPayout} versements · ${(dataSize/1024).toFixed(1)} Ko`}/>
 <Item icon={Save} bg={C.gl} fg={C.gd} label="Sauvegarde automatique" sub="Locale · Chaque action" right={<Toggle on={autoSave} onChange={()=>setAutoSave(v=>!v)}/>}/>
 <Item icon={Download} bg={C.gl} fg={C.gd} label="Exporter sauvegarde (.njg)" sub="Fichier complet JSON" right={<ChevronRight size={16} color={C.text2}/>} onClick={exportData}/>
 <Item icon={ClipboardList} bg={C.bll} fg={C.bld} label="Exporter CSV" sub="Tous les paiements" right={<ChevronRight size={16} color={C.text2}/>} onClick={exportCSV}/>
 </Section>

 <Section icon={TriangleAlert} bgIcon={C.rdl} fgIcon={C.rd} title="Zone de danger" sub="Réinitialisation">
 <Item icon={Trash2} bg={C.rdl} fg={C.rd} label="Réinitialiser l'application" sub="Supprime toutes les données — IRRÉVERSIBLE" right={<ChevronRight size={16} color={C.rd}/>} onClick={resetApp}/>
 </Section>

 <div style={{textAlign:'center',padding:16,fontSize:11,color:C.text2}}>
 <div style={{fontWeight:700,color:C.g}}>IZI NJANGI v1.0</div>
 <div style={{marginTop:3,letterSpacing:0.4}}>Powered by IZIsoft</div>
 </div>
 </div>
 )
}

export default {TontineSelectScreen,SetupScreen,LockScreen,HomeScreen,MembresScreen,AddMembreScreen,FicheMembreScreen,PaiementScreen,ImpayesScreen,RapportScreen,ParametresScreen}
