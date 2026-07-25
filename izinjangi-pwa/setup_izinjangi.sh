#!/bin/bash
set -e
echo "IZI NJANGI — mise a jour PWA + icones + fiche membre + rotation de cycle"

mkdir -p public src/components src/screens src/assets

# Nettoyage de l'ancien code (ecrans 'old', scripts fix.py devenus inutiles)
rm -rf src/screens/old fix.py fix2.py

cat > package.json << 'FILEEOF'
{
  "name": "izinjangi-pwa",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "html2canvas": "^1.4.1",
    "jspdf": "^4.2.1",
    "lucide-react": "^0.469.0",
    "react": "^19.2.6",
    "react-dom": "^19.2.6",
    "react-router-dom": "^7.16.0"
  },
  "devDependencies": {
    "@eslint/js": "^10.0.1",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.1",
    "eslint": "^10.3.0",
    "eslint-plugin-react-hooks": "^7.1.1",
    "eslint-plugin-react-refresh": "^0.5.2",
    "globals": "^17.6.0",
    "vite": "^8.0.12",
    "vite-plugin-pwa": "^0.21.1"
  }
}

FILEEOF

cat > vite.config.js << 'FILEEOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon-32.png', 'favicon-64.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'IZI NJANGI — Gestion de tontine',
        short_name: 'IZI NJANGI',
        description: 'Gestion de tontine simple et fiable, 100% hors ligne.',
        theme_color: '#1D9E75',
        background_color: '#1D9E75',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
})

FILEEOF

cat > index.html << 'FILEEOF'
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
    <link rel="icon" type="image/png" sizes="64x64" href="/favicon-64.png" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#1D9E75" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="IZI NJANGI" />
    <meta name="description" content="Gestion de tontine simple et fiable, 100% hors ligne." />
    <title>IZI NJANGI — Gestion de tontine</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>

FILEEOF

cat > src/index.css << 'FILEEOF'
* {
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}

html, body, #root {
  height: 100%;
  margin: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background-color: #F4F4F0;
  overscroll-behavior-y: contain;
}

input, select, button {
  font-family: inherit;
}

button {
  -webkit-appearance: none;
  appearance: none;
}

::-webkit-scrollbar {
  display: none;
}

FILEEOF

cat > src/main.jsx << 'FILEEOF'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'

registerSW({ immediate: true })

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

FILEEOF

cat > src/App.jsx << 'FILEEOF'
import { useState, useEffect, useCallback } from 'react'
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2,6)
import { SetupScreen, LockScreen, TontineSelectScreen, HomeScreen, MembresScreen, AddMembreScreen, FicheMembreScreen, PaiementScreen, ImpayesScreen, RapportScreen, ParametresScreen } from './screens/AllScreens'
import BottomNav from './components/BottomNav'

const uid = () => Math.random().toString(36).slice(2,10).toUpperCase()
const key = (id, name) => `njangi_${id}_${name}`

export default function App() {
  const [loading,      setLoading]      = useState(true)
  const [appState,     setAppState]     = useState('select')
  const [tontines,     setTontines]     = useState([])
  const [activeTontineId, setActiveTontineId] = useState(null)
  const [config,       setConfig]       = useState(null)
  const [members,      setMembers]      = useState([])
  const [payments,     setPayments]     = useState([])
  const [payouts,      setPayouts]      = useState([])
  const [cycles,       setCycles]       = useState([])
  const [screen,       setScreen]       = useState('home')
  const [subScreen,    setSubScreen]    = useState(null)
  const [selectedMember, setSelectedMember] = useState(null)
  const [prefillMemberId, setPrefillMemberId] = useState(null)

  useEffect(() => {
    const list = JSON.parse(localStorage.getItem('njangi_tontines') || '[]')
    setTontines(list)
    setAppState(list.length > 0 ? 'select' : 'setup')
    setLoading(false)
  }, [])

  const loadTontine = (id) => {
    const cfg = localStorage.getItem(key(id, 'config'))
    if (!cfg) return
    setActiveTontineId(id)
    setConfig(JSON.parse(cfg))
    setMembers(JSON.parse(localStorage.getItem(key(id, 'members')) || '[]'))
    setPayments(JSON.parse(localStorage.getItem(key(id, 'payments')) || '[]'))
    setPayouts(JSON.parse(localStorage.getItem(key(id, 'payouts')) || '[]'))
    setCycles(JSON.parse(localStorage.getItem(key(id, 'cycles')) || '[]'))
    setScreen('home')
    setSubScreen(null)
    setAppState('locked')
  }

  const persist = useCallback((id, m, p, py, cy, cfg) => {
    if (!id) return
    if (m   !== undefined) localStorage.setItem(key(id,'members'),  JSON.stringify(m))
    if (p   !== undefined) localStorage.setItem(key(id,'payments'), JSON.stringify(p))
    if (py  !== undefined) localStorage.setItem(key(id,'payouts'),  JSON.stringify(py))
    if (cy  !== undefined) localStorage.setItem(key(id,'cycles'),   JSON.stringify(cy))
    if (cfg !== undefined) localStorage.setItem(key(id,'config'),   JSON.stringify(cfg))
  }, [])

  const handleSetupDone = (cfg) => {
    const id = uid()
    const nowISO = new Date().toISOString()
    const fullCfg = { ...cfg, id, createdAt: nowISO, currentCycle: 1, nbSlots: 0, nbMembers: 0, penaltyRate: 0 }
    const entry = { id, tontineName: cfg.tontineName, username: cfg.username, createdAt: nowISO }
    const newList = [...tontines, entry]
    setTontines(newList)
    localStorage.setItem('njangi_tontines', JSON.stringify(newList))
    localStorage.setItem(key(id,'config'),   JSON.stringify(fullCfg))
    localStorage.setItem(key(id,'members'),  JSON.stringify([]))
    localStorage.setItem(key(id,'payments'), JSON.stringify([]))
    localStorage.setItem(key(id,'payouts'),  JSON.stringify([]))
    localStorage.setItem(key(id,'cycles'),   JSON.stringify([{ id: Math.random().toString(36).slice(2), number:1, status:'en_cours', startedAt: nowISO }]))
    setActiveTontineId(id)
    setConfig(fullCfg)
    setMembers([]); setPayments([]); setPayouts([]); setCycles([])
    setScreen('home'); setSubScreen(null)
    setAppState('app')
  }

  const handleUnlock = () => setAppState('app')

  const handleAddMember = (member) => {
    const m = [...members, member]
    setMembers(m)
    const totalSlots = m.reduce((s, mb) => s + (mb.slots?.length || 1), 0)
    const updatedConfig = { ...config, nbSlots: totalSlots, nbMembers: totalSlots }
    setConfig(updatedConfig)
    persist(activeTontineId, m, undefined, undefined, undefined, updatedConfig)
    setSubScreen(null)
  }

  const handleUpdateMember = (updated) => {
    const m = members.map(mb => mb.id === updated.id ? updated : mb)
    setMembers(m)
    setSelectedMember(updated)
    persist(activeTontineId, m)
  }

  const handleDeleteMember = (memberId) => {
    const m = members.filter(mb => mb.id !== memberId)
    setMembers(m)
    const totalSlots = m.reduce((s, mb) => s + (mb.slots?.length || 1), 0)
    const updatedConfig = { ...config, nbSlots: totalSlots, nbMembers: totalSlots }
    setConfig(updatedConfig)
    persist(activeTontineId, m, undefined, undefined, undefined, updatedConfig)
  }

  const handlePayment = (payment) => {
    const p = [...payments, payment]
    setPayments(p)
    persist(activeTontineId, undefined, p)
  }

  const handlePayout = (payout) => {
    const py = [...payouts, payout]
    setPayouts(py)
    persist(activeTontineId, undefined, undefined, py)
  }

  // Fait tourner le bénéficiaire clôturé vers la fin de la file et avance le cycle
  const handleRenew = (lastBenefId) => {
    const newCycle = (config.currentCycle || 1) + 1
    let newMembers = [...members]
    if (lastBenefId) {
      newMembers = members.map(m => {
        if (m.id === lastBenefId) {
          const newSlot = { slotId: genId(), order: (config.nbSlots || members.length) + 1, slotNum: (m.slots?.length || 1) + 1, cycle: newCycle }
          return { ...m, slots: [...(m.slots || []), newSlot] }
        }
        return m
      })
    }
    const updatedConfig = { ...config, currentCycle: newCycle }
    setConfig(updatedConfig)
    setMembers(newMembers)
    persist(activeTontineId, newMembers, undefined, undefined, undefined, updatedConfig)
  }

  const handleAddSlot = (memberId) => {
    const allOrders = members.flatMap(m => m.slots ? m.slots.map(s => s.order) : [m.order || 1])
    const nextOrder = allOrders.length > 0 ? Math.max(...allOrders) + 1 : 1
    const newMembers = members.map(m => {
      if (m.id === memberId) {
        const newSlot = { slotId: genId(), order: nextOrder, slotNum: (m.slots?.length || 1) + 1 }
        return { ...m, slots: [...(m.slots || [{slotId: genId(), order: m.order || 1, slotNum: 1}]), newSlot] }
      }
      return m
    })
    const totalSlots = newMembers.reduce((s, mb) => s + (mb.slots?.length || 1), 0)
    const updatedConfig = { ...config, nbSlots: totalSlots, nbMembers: totalSlots }
    setConfig(updatedConfig)
    setMembers(newMembers)
    if (selectedMember?.id === memberId) {
      setSelectedMember(newMembers.find(m => m.id === memberId))
    }
    persist(activeTontineId, newMembers, undefined, undefined, undefined, updatedConfig)
  }

  const handleUpdateConfig = (cfg) => {
    setConfig(cfg)
    persist(activeTontineId, undefined, undefined, undefined, undefined, cfg)
    const newList = tontines.map(t => t.id === activeTontineId ? { ...t, tontineName: cfg.tontineName } : t)
    setTontines(newList)
    localStorage.setItem('njangi_tontines', JSON.stringify(newList))
  }

  const handleReset = () => {
    if (!activeTontineId) return
    ;['config','members','payments','payouts','cycles'].forEach(k2 => localStorage.removeItem(key(activeTontineId, k2)))
    const newList = tontines.filter(t => t.id !== activeTontineId)
    setTontines(newList)
    localStorage.setItem('njangi_tontines', JSON.stringify(newList))
    setActiveTontineId(null)
    setConfig(null); setMembers([]); setPayments([]); setPayouts([]); setCycles([])
    setAppState(newList.length > 0 ? 'select' : 'setup')
    setScreen('home'); setSubScreen(null)
  }

  const nav = (sc) => { setSubScreen(null); setScreen(sc) }

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', backgroundColor:'#1D9E75' }}>
      <p style={{ color:'#fff', fontSize:16 }}>Chargement…</p>
    </div>
  )

  if (appState === 'select') return (
    <TontineSelectScreen tontines={tontines} onSelect={loadTontine} onNew={() => setAppState('setup')} />
  )

  if (appState === 'setup') return (
    <SetupScreen
      existingUsernames={tontines.map(t => t.username)}
      onDone={handleSetupDone}
      onBack={tontines.length > 0 ? () => setAppState('select') : null}
    />
  )

  if (appState === 'locked') return (
    <LockScreen config={config} onUnlock={handleUnlock} onForgotPin={handleReset} />
  )

  const wrap = (child) => (
    <div style={{ maxWidth:480, margin:'0 auto', height:'100vh', backgroundColor:'#F4F4F0', display:'flex', flexDirection:'column' }}>
      {child}
    </div>
  )

  if (subScreen === 'add-membre') return wrap(
    <AddMembreScreen members={members} config={config} onBack={() => setSubScreen(null)} onSave={handleAddMember} />
  )

  if (subScreen === 'fiche' && selectedMember) return wrap(
    <FicheMembreScreen
      member={selectedMember}
      members={members}
      payments={payments}
      config={config}
      onBack={() => { setSubScreen(null); setSelectedMember(null) }}
      onUpdate={handleUpdateMember}
      onDelete={handleDeleteMember}
      onAddSlot={handleAddSlot}
    />
  )

  if (subScreen === 'paiement' || subScreen === 'versement') return wrap(
    <PaiementScreen
      config={config} members={members} payments={payments}
      preselectMemberId={prefillMemberId}
      onSave={handlePayment}
      onBack={() => { setSubScreen(null); setPrefillMemberId(null) }}
    />
  )

  if (subScreen === 'impayes') return wrap(
    <ImpayesScreen
      config={config} members={members} payments={payments} payouts={payouts}
      onBack={() => setSubScreen(null)}
      onPay={(m) => { setPrefillMemberId(m.id); setSubScreen('paiement') }}
    />
  )

  const mainContent = () => {
    switch(screen) {
      case 'home':
        return <HomeScreen config={config} members={members} payments={payments} payouts={payouts} cycles={cycles}
          nav={(sc) => {
            if (sc === 'paiement') setSubScreen('paiement')
            else if (sc === 'impayes') setSubScreen('impayes')
            else if (sc === 'versement') setScreen('rapport')
            else setScreen(sc)
          }} />
      case 'membres':
        return <MembresScreen members={members} payments={payments} config={config}
          onAddMember={() => setSubScreen('add-membre')}
          onSelectMember={(m) => { setSelectedMember(m); setSubScreen('fiche') }} />
      case 'paiements':
        return <PaiementScreen config={config} members={members} payments={payments} onSave={handlePayment} onBack={() => setScreen('home')} />
      case 'rapport':
        return <RapportScreen config={config} members={members} payments={payments} payouts={payouts} cycles={cycles}
          onPayout={handlePayout} onRenew={handleRenew} onUpdateConfig={handleUpdateConfig} onBack={() => setScreen('home')} />
      case 'settings':
        return <ParametresScreen config={config} members={members} payments={payments} payouts={payouts}
          onUpdateConfig={handleUpdateConfig} onReset={handleReset} onSwitchTontine={() => setAppState('select')} />
      default:
        return null
    }
  }

  return (
    <div style={{ maxWidth:480, margin:'0 auto', height:'100vh', backgroundColor:'#F4F4F0', display:'flex', flexDirection:'column', position:'relative' }}>
      {mainContent()}
      <BottomNav current={screen} onNav={nav} />
    </div>
  )
}

FILEEOF

cat > src/components/BottomNav.jsx << 'FILEEOF'
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

FILEEOF

cat > src/screens/AllScreens.jsx << 'FILEEOF'
// ============================================================
// IZI NJANGI — AllScreens.jsx
// Design cohérent, iconographie lucide-react uniquement (zéro emoji)
// ============================================================
import { useState, useRef } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import izi360Mark from '../assets/izi360-mark.png'
import {
  ArrowLeft, Check, X, ChevronRight, Bell, Pencil, Coins, RotateCw,
  Crown, Printer, Share2, KeyRound, Lock, Package, TriangleAlert,
  Trash2, Save, Download, ClipboardList, Clock, Phone, Mail, Wallet,
  Users, BarChart3, Settings, Plus, CircleCheck, Banknote, UserPlus,
  UserMinus, Search, Repeat2, WalletCards, ReceiptText, ShieldCheck,
  CalendarClock, Percent, ImageUp, RotateCcw,
} from 'lucide-react'

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

export function TontineSelectScreen({tontines, onSelect, onNew}) {
 return (
 <div style={{height:'100vh',backgroundColor:C.g,display:'flex',flexDirection:'column'}}>
 <div style={{padding:'calc(env(safe-area-inset-top) + 24px) 24px 20px',textAlign:'center'}}>
 <div style={{width:60,height:60,backgroundColor:'rgba(255,255,255,0.2)',borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px'}}>
 <Repeat2 size={30} color="#fff" strokeWidth={2.2}/>
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
 onDone(config)
 }
 const inp={backgroundColor:C.white,border:`1px solid ${C.grb}`,borderRadius:8,padding:'10px 12px',fontSize:14,width:'100%',color:C.text,outline:'none',marginTop:4,boxSizing:'border-box',maxWidth:'100%'}
 const lbl={fontSize:12,color:C.text2,fontWeight:600}
 const btn={backgroundColor:C.g,color:'#fff',border:'none',borderRadius:12,padding:13,fontSize:15,fontWeight:700,cursor:'pointer',marginTop:8,width:'100%'}

 if(step===0) return (
 <div style={{height:'100vh',backgroundColor:C.g,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24}}>
 <div style={{width:80,height:80,backgroundColor:'rgba(255,255,255,0.2)',borderRadius:20,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:20}}>
   <Repeat2 size={38} color="#fff" strokeWidth={2.2}/>
 </div>
 <h1 style={{color:'#fff',fontSize:32,fontWeight:800,letterSpacing:1,margin:0}}>IZI NJANGI</h1>
 <p style={{color:'rgba(255,255,255,0.8)',fontSize:16,textAlign:'center',marginTop:8,lineHeight:'24px'}}>Gestion de tontine<br/>simple et fiable</p>
 <button onClick={()=>setStep(1)} style={{backgroundColor:'#fff',color:C.g,border:'none',borderRadius:14,padding:'14px 28px',marginTop:40,fontSize:16,fontWeight:800,cursor:'pointer'}}>Créer ma tontine</button>
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
 <div style={{backgroundColor:C.gl,border:'1px solid #5DCAA5',borderRadius:8,padding:'10px 12px',display:'flex',gap:8,alignItems:'flex-start'}}>
 <CalendarClock size={15} color={C.gd} style={{marginTop:1,flexShrink:0}}/>
 <div>
   <div style={{fontSize:12,color:C.gd,fontWeight:600}}>Nombre de tours</div>
   <div style={{fontSize:12,color:C.g2,marginTop:2}}>Défini automatiquement selon les places attribuées aux membres.</div>
 </div>
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
 <button onClick={next} style={btn}>Suivant — Choisir la devise</button>
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
 <div style={{height:'100vh',backgroundColor:C.gd,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24}}>
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
 <div style={{height:'100vh',backgroundColor:C.g,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24}}>
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
 <button onClick={()=>nav('impayes')} style={{width:36,height:36,borderRadius:18,backgroundColor:'rgba(255,255,255,0.18)',border:'none',cursor:'pointer',position:'relative',display:'flex',alignItems:'center',justifyContent:'center'}}>
 <Bell size={17} color="#fff"/>
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
 <div style={{backgroundColor:C.g,padding:'calc(env(safe-area-inset-top) + 14px) 16px 16px',display:'flex',alignItems:'center',gap:10}}>
 <BackBtn onClick={onBack}/>
 <div>
 <div style={{color:'#fff',fontSize:17,fontWeight:700}}>Nouveau membre</div>
 <div style={{color:'rgba(255,255,255,0.8)',fontSize:11,marginTop:2}}>{freeOrders.length} tour{freeOrders.length>1?'s':''} disponible{freeOrders.length>1?'s':''}</div>
 </div>
 </div>
 <div style={{flex:1,overflowY:'auto',padding:16,display:'flex',flexDirection:'column',gap:14}}>
 <div>
 <label style={lbl}>Nom complet *</label>
 <input style={errors.name?{...inp,border:`1px solid ${C.rd}`}:inp} type="text" placeholder="Ex: Marie Dupont"
 value={form.name} onChange={e=>{setForm(p=>({...p,name:e.target.value}));setErrors(p=>({...p,name:''}))}}/>
 {errors.name&&<p style={{color:C.rd,fontSize:12,marginTop:4}}>{errors.name}</p>}
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
 {errors.slots&&<p style={{color:C.rd,fontSize:12,marginBottom:6}}>{errors.slots}</p>}
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
 {freeOrders.length===0&&<div style={{marginTop:8,backgroundColor:C.rdl,borderRadius:6,padding:'8px 10px',fontSize:12,color:C.rd}}>Tous les tours sont attribués.</div>}
 </div>
 <button onClick={save} style={{backgroundColor:C.g,color:'#fff',border:'none',borderRadius:12,padding:13,fontSize:15,fontWeight:700,cursor:'pointer',marginTop:4}}>
 Enregistrer le membre
 </button>
 </div>
 </div>
 )
}

/* ---------------------------- Fiche membre (NOUVEAU) ---------------------------- */

export function FicheMembreScreen({member, members, payments, config, onBack, onUpdate, onDelete, onAddSlot}) {
 const sym=config.currency?.symbol||config.currency?.code||'F'
 const [edit,setEdit]=useState(false)
 const [form,setForm]=useState({name:member.name, phone:member.phone||'', email:member.email||''})
 const slots = member.slots || [{slotId:'single', order:member.order||1, slotNum:1}]
 const history = payments.filter(p=>p.memberId===member.id).sort((a,b)=>new Date(b.date)-new Date(a.date))
 const isSorti = member.status==='sorti'

 const lbl={fontSize:12,fontWeight:600,color:C.text2,marginBottom:3,display:'block'}
 const inp={backgroundColor:C.white,border:`1px solid ${C.grb}`,borderRadius:8,padding:'10px 12px',fontSize:14,width:'100%',color:C.text,outline:'none',marginTop:4,boxSizing:'border-box'}

 const saveEdit=()=>{
   if(!form.name.trim()) return alert('Le nom est obligatoire.')
   onUpdate({...member, name:form.name.trim(), phone:form.phone.trim(), email:form.email.trim()})
   setEdit(false)
 }

 const toggleSortie=()=>{
   const next = isSorti ? 'actif' : 'sorti'
   if(next==='sorti' && !window.confirm(`Marquer ${member.name} comme sorti de la tontine ?`)) return
   onUpdate({...member, status:next})
 }

 const remove=()=>{
   if(!window.confirm(`Supprimer définitivement ${member.name} ? Cette action est irréversible.`)) return
   onDelete(member.id)
   onBack()
 }

 return (
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
           </div>
         )}
         {!edit && <Badge label={isSorti?'Sorti':'Actif'} type={isSorti?'bad':'ok'}/>}
       </div>
       {edit && (
         <div style={{display:'flex',flexDirection:'column',gap:10}}>
           <div><label style={lbl}>Nom complet</label><input style={inp} value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/></div>
           <div><label style={lbl}>Téléphone</label><input style={inp} value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))}/></div>
           <div><label style={lbl}>Email</label><input style={inp} value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))}/></div>
           <div style={{display:'flex',gap:8,marginTop:4}}>
             <button onClick={()=>{setEdit(false);setForm({name:member.name,phone:member.phone||'',email:member.email||''})}} style={{flex:1,padding:11,backgroundColor:C.gr,color:C.text2,border:'none',borderRadius:9,fontSize:13,fontWeight:600,cursor:'pointer'}}>Annuler</button>
             <button onClick={saveEdit} style={{flex:1,padding:11,backgroundColor:C.g,color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:700,cursor:'pointer'}}>Enregistrer</button>
           </div>
         </div>
       )}
     </div>

     <div>
       <div style={{fontSize:11,fontWeight:700,color:C.text2,textTransform:'uppercase',letterSpacing:0.5,marginBottom:8}}>Places dans la tontine</div>
       <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
         {slots.map(s=>(
           <div key={s.slotId||s.order} style={{backgroundColor:C.gl,borderRadius:8,padding:'8px 12px'}}>
             <div style={{fontSize:13,fontWeight:700,color:C.gd}}>Tour #{s.order}</div>
           </div>
         ))}
         <button onClick={()=>onAddSlot(member.id)} style={{backgroundColor:C.white,border:`1px dashed ${C.grb}`,borderRadius:8,padding:'8px 12px',display:'flex',alignItems:'center',gap:5,color:C.text2,fontSize:12,fontWeight:600,cursor:'pointer'}}>
           <Plus size={13}/> Place
         </button>
       </div>
     </div>

     <div>
       <div style={{fontSize:11,fontWeight:700,color:C.text2,textTransform:'uppercase',letterSpacing:0.5,marginBottom:8}}>Historique des paiements</div>
       {history.length===0 && <div style={{backgroundColor:C.white,border:`1px solid ${C.grb}`,borderRadius:12,padding:16,textAlign:'center',color:C.text2,fontSize:12}}>Aucun paiement enregistré</div>}
       <div style={{display:'flex',flexDirection:'column',gap:6}}>
         {history.map(p=>(
           <div key={p.id} style={{backgroundColor:C.white,border:`1px solid ${C.grb}`,borderRadius:10,padding:10,display:'flex',alignItems:'center',gap:8}}>
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
 <div style={{width:56,height:56,backgroundColor:'rgba(255,255,255,0.2)',borderRadius:28,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 10px'}}>
   <CircleCheck size={28} color="#fff"/>
 </div>
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

export function PaiementScreen({config,members,payments,onSave,onBack,preselectMemberId}) {
 const sym=config.currency?.symbol||config.currency?.code||'F'
 const base=Number(config.cotisation||0)
 const currentCycle=config.currentCycle||1
 const penaltyRate=config.penaltyRate||0

 const [view,setView]=useState('form')
 const [receipt,setReceipt]=useState(null)
 const [form,setForm]=useState({memberId:preselectMemberId||'',slotOrder:'',mode:'Espèces',date:new Date().toISOString().split('T')[0],note:'',withPenalty:false})
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
 onChange={e=>f({memberId:e.target.value,slotOrder:''})}>
 <option value="">— Sélectionner un membre —</option>
 {activeMembers.sort((a,b)=>(a.slots?.[0]?.order||a.order||0)-(b.slots?.[0]?.order||b.order||0)).map(m=>(
 <option key={m.id} value={m.id}>{m.name}{m.slots?.length>1?` (${m.slots.length} places)`:''}</option>
 ))}
 </select>
 {errors.memberId&&<p style={{color:C.rd,fontSize:12,marginTop:4}}>{errors.memberId}</p>}
 </div>

 {member&&(
 <div>
 <label style={lbl}>Tour à payer *</label>
 {memberSlots.length===1?(
 <div style={{backgroundColor:C.gl,borderRadius:8,padding:'10px 12px',marginTop:4}}>
 <div style={{fontSize:13,fontWeight:600,color:C.gd}}>Tour #{memberSlots[0].order}</div>
 <div style={{fontSize:11,color:C.g2,marginTop:2,display:'flex',alignItems:'center',gap:4}}>
   {payments.some(p=>p.memberId===form.memberId&&p.slotOrder===memberSlots[0].order&&p.cycle===currentCycle&&p.type==='cotisation')
   ?<><Check size={12}/> Déjà payé ce cycle</>:<><Clock size={12}/> En attente de paiement</>}
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
 <div style={{fontSize:10,marginTop:3}}>{paid?'Payé':active?'Sélectionné':'À payer'}</div>
 </button>
 )
 })}
 </div>
 )}
 {errors.slotOrder&&<p style={{color:C.rd,fontSize:12,marginTop:4}}>{errors.slotOrder}</p>}
 {alreadyPaid&&<div style={{marginTop:6,backgroundColor:C.rdl,border:`1px solid ${C.rd}`,borderRadius:8,padding:'8px 12px',fontSize:12,color:C.rd}}>Tour #{form.slotOrder} déjà payé ce cycle.</div>}
 </div>
 )}

 {member&&memberSlots.length===1&&!form.slotOrder&&(()=>{setTimeout(()=>f({slotOrder:String(memberSlots[0].order)}),0);return null})()}

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
 onPayout(p)
 // La cagnotte versée clôture ce tour : on fait automatiquement avancer le cycle.
 if (currentCycle < nbSlots && onRenew) onRenew(versForm.beneficiary)
 setVersView(false)
 alert(`Versement de ${fmt(net,sym)} enregistré pour ${m?.name} — Tour #${slotOrd}. Cycle suivant démarré.`)
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
 <div style={{backgroundColor:C.gd,padding:'calc(env(safe-area-inset-top) + 14px) 16px 16px',display:'flex',alignItems:'center',gap:12}}>
 <BackBtn onClick={()=>setVersView(false)}/>
 <div>
 <div style={{color:'#fff',fontSize:17,fontWeight:700}}>Verser la cagnotte</div>
 <div style={{color:'rgba(255,255,255,0.8)',fontSize:11,marginTop:1}}>Cycle {currentCycle}</div>
 </div>
 </div>
 <div style={{padding:'16px 14px',display:'flex',flexDirection:'column',gap:12}}>
 <div style={{backgroundColor:C.gl,borderRadius:10,padding:14}}>
 <div style={{fontSize:11,color:C.gd,marginBottom:4}}>Cagnotte cycle {currentCycle}</div>
 <div style={{fontSize:22,fontWeight:800,color:C.g}}>{fmt(brut,sym)}</div>
 {currentSlotMember&&<div style={{fontSize:12,color:C.gd,marginTop:4,fontWeight:600}}>Bénéficiaire prévu : {currentSlotMember.name} (Tour #{currentCycle})</div>}
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
 <span style={{fontSize:13,fontWeight:700,color:C.gd}}>Net à verser</span>
 <span style={{fontSize:16,fontWeight:800,color:C.g}}>{fmt(net,sym)}</span>
 </div>
 </div>
 <button onClick={submitVersement} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,backgroundColor:C.gd,color:'#fff',border:'none',borderRadius:12,padding:14,fontSize:15,fontWeight:700,cursor:'pointer'}}><Banknote size={16}/> Confirmer le versement</button>
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
 <button onClick={()=>setVersView(true)} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,backgroundColor:C.gd,color:'#fff',border:'none',borderRadius:10,padding:'12px 16px',margin:'0 14px 12px',width:'calc(100% - 28px)',fontSize:14,fontWeight:700,cursor:'pointer'}}>
 <Banknote size={16}/> Verser la cagnotte — Cycle {currentCycle}{currentSlotMember?` → ${currentSlotMember.name}`:''}
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
 const logoInputRef=useRef(null)
 const [logoBusy,setLogoBusy]=useState(false)

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
 if(window.confirm("Réinitialiser toute l'application ?"))
 if(window.confirm('IRRÉVERSIBLE — Confirmer ?')) onReset()
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
 </Section>

 <Section icon={Repeat2} bgIcon={C.gl} fgIcon={C.gd} title="Tontine" sub="Nom, cotisation, cycle">
 <Item icon={Pencil} bg={C.gl} fg={C.gd} label="Nom de la tontine" sub={config.tontineName} right={<ChevronRight size={16} color={C.text2}/>} onClick={()=>alert('Bientôt disponible')}/>
 <Item icon={Coins} bg={C.ambl} fg={C.ambd} label="Montant cotisation" sub={`${fmt(config.cotisation,sym)} / ${config.frequency||'mois'}`} right={<ChevronRight size={16} color={C.text2}/>} onClick={()=>alert('Bientôt disponible')}/>
 <Item icon={CalendarClock} bg={C.bll} fg={C.bld} label="Nombre de tours" sub={`${config.nbSlots||config.nbMembers||'?'} tours`} right={<ChevronRight size={16} color={C.text2}/>}/>
 <Item icon={Percent} bg={C.ambl} fg={C.ambd} label="Pénalité de retard" sub={`${config.penaltyRate||0}% par cycle de retard`} right={<ChevronRight size={16} color={C.text2}/>}
 onClick={()=>{
 const val=window.prompt('Taux de pénalité (%) — 0 pour désactiver :',config.penaltyRate||'0')
 if(val!==null&&!isNaN(Number(val))) onUpdateConfig({...config,penaltyRate:Number(val)})
 }}/>
 <Item icon={RotateCw} bg={C.pur} fg={C.purd} label="Avancer au cycle suivant" sub={`Actuellement : Cycle ${config.currentCycle||1}`} right={<ChevronRight size={16} color={C.text2}/>}
 onClick={()=>{if(window.confirm(`Passer au cycle ${(config.currentCycle||1)+1} ?`)){onUpdateConfig({...config,currentCycle:(config.currentCycle||1)+1})}}}/>
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

FILEEOF

base64 -d > public/pwa-192.png << 'B64EOF'
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
B64EOF

base64 -d > public/pwa-512.png << 'B64EOF'
iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAYAAAD0eNT6AAEAAElEQVR4nOz955obyZKuC37mHgo6BVXVqqV67d0zc//XMuc5p3f3
tFglKFJAhXR3s/nhEUAAmWRJVpFMe+sBoSMCgSzY5yYJyieJiMgffQyKoii/BUREf/QxKA/RL+UPQg28oihKRAXCH4Oe9N8BNfaK
oig/DxUFHx89wR8BNfiKoii/LSoIfnv0hP4GqMFXFEX5fVFB8OvRE/gLUaOvKIryaaBi4JehJ+1noEZfURTl00bFwE9HT9SPoEZf
URTl80TFwIfRk/Me1PAriqJ8GagQeBw9KSPU6CuKonzZqBg4oicCavgVRVGeGioEnrgAUMOvKIrytHnKQuBJfnA1/IqiKMqYpygE
ntQHVsOvKIqifIinJASexAdVw68oiqL8HJ6CEDB/9AF8bNT4K4qiKD+Xp2A7vliF8xS+PEVRFOXj86V6A764D6WGX1EURfkYfGlC
4IsKAajxVxRFUT4WX5qN+SLUzJf2pSiKoiifNl+CN+Cz9wCo8VcURVF+b74E2/NZC4Av4QtQFEVRPk8+dxv0WbowPveTriiKonxZ
fI4hgc/OA6DGX1EURfnU+Bxt02clAD7HE6woiqI8DT43G/VZuCw+t5OqKIqiPG0+h5DAJ+8BUOOvKIqifG58DrbrkxYAn8MJVBRF
UZTH+NRt2CcrAD71E6coiqIoP8anbMs+SQHwKZ8wRVEURfk5fKo27ZMTAJ/qiVIURVGUX8qnaNs+KQHwKZ4gRVEURfkt+NRs3Ccj
AD61E6MoiqIovzWfkq37JATAp3RCFEVRFOVj8qnYvD9cAHwqJ0JRFEVRfi8+Bdv3hwqAT+EEKIqiKMofwR9tA/8wAfBHf3BFURRF
+aP5I23hHyIA1PgriqIoSuSPsom/uwBQ468oiqIop/wRtvF3FQBq/BVFURTlcX5vG/m7CQA1/oqiKIryYX5PW/m7CAA1/oqiKIry
0/i9bOYf3gdAURRFUZTfn48uAHT1ryiKoig/j9/Ddn5UAaDGX1EURVF+GR/bhn40AaDGX1EURVF+HR/TlmoOgKIoiqI8QT6KANDV
v6IoiqL8Nnwsm/qbCwA1/oqiKIry2/IxbOtvKgDU+CuKoijKx+G3trGaA6AoiqIoT5DfTADo6l9RFEVRPi6/pa39TQSAGn9FURRF
+X34rWyuhgAURVEU5QnyqwWArv4VRVEU5fflt7C96gFQFEVRlCfIrxIAuvpXFEVRlD+GX2uDf7EAUOOvKIqiKH8sv8YWawhAURRF
UZ4gv0gA6OpfURRFUT4NfqlNVg+AoiiKojxBfrYA0NW/oiiKonxa/BLbrB4ARVEURXmC/CwBoKt/RVEURfk0+bk2Wj0AiqIoivIE
+ckCQFf/iqIoivJp83NstXoAFEVRFOUJ8pMEgK7+FUVRFOXz4KfabPUAKIqiKMoTRAWAoiiKojxBflQAqPtfURRFUT4vfortVg+A
oiiKojxBPigAdPWvKIqiKJ8nP2bD1QOgKIqiKE8QFQCKoiiK8gR5rwBQ97+iKIqifN58yJarB0BRFEVRniAqABRFURTlCfKoAFD3
v6IoiqJ8GbzPpqsHQFEURVGeICoAFEVRFOUJ8kAAqPtfURRFUb4sHrPt6gFQFEVRlCeICgBFURRFeYKoAFAURVGUJ8iJAND4v6Io
iqJ8mZzbePUAKIqiKMoTRAWAoiiKojxBVAAoiqIoyhPkIAA0/q8oiqIoXzZjW68eAEVRFEV5gqgAUBRFUZQniAoARVEURXmCqABQ
FEVRlCeIATQBUFEURVGeCoPNVw+AoiiKojxBVAAoiqIoyhNEBYCiKIqiPEFUACiKoijKE0QFgKIoiqI8QVQAKIqiKMoTRAWAoiiK
ojxBSHsAKIqiKMrTQz0AiqIoivIEUQGgKIqiKE8QFQCKoiiK8gRRAaAoiqIoTxAVAIqiKIryBFEBoCiKoihPkOSPPgBFUT4uIiIg
OnmMAHrPyxVFeSKoAFCUL5Shx4fEmyf9PgyRURGgKE8bFQCK8oVCRCQiQkQE7felKMoZ2glQURRFUZ4gmgSoKIqiKE8QFQCK8gUi
gOB4efw16v1TlCeN5gAoyhfIkOAnIuK9d51znfPei4hYa22WZWmWJBkRaSKgojxRVAAoyhcMM3NZltW77e5+W9cVE/G0KLKrxWJ5
vZhfZsbkh0RBAMzCRCAVBory5aMCQFE+Y8bGe7gvgFCf4FtVVf1uvbn/j7fv3n2/3dZMBlfLZfJ3ET+fTGaJtamIiAEMERELM4HI
Etk/8nMpivLxUQGgKJ8pQ4OfcxFAIArBh7Zp2rvdfv3dZnv3f25uq//f3b3xIPrG+W42nez/cu27WZ7NaNQliAVsSHODFOUpoAJA
UT5jWIQp2n8CYu0/AAQOXeXc5raub/+52+/+q6yT/6zbZeO8wWR6/4/OOx+CN0TmpB2Qev4V5cmgAkBRPl9ERJiO1TyCPvmvY6nW
zt+9brvtf1aV/WfA1RuTXdTszXWQah9C7UII5xsjIhijKkBRngLq6lOUzxXqE/37y/ipRmR/x2H7vffybeBnt3nxsp4tLzYmWW1F
sp3zsq3q6uEmibRFsKI8DVQAKMpnDQFEQ9lfdP+H4Evv6/vA7p3I9C7LvuoWyyu/WExckuWVl3RdVvJuvdnf39+vh34ARESGYMYl
hNorQFG+XDQEoCifMXHBfmqj67pu923bbALj3pplN1+usskC9m4Ltglt6jr//ubO/hfx/jJN3gYQL2bTWZ5l+Xg7Y+OvZYGK8uWh
AkBRPjOGrP/Dqn9km9u2bdeb7eaeubkPbLcmnZurOcik4PUOIQRsy/3kv8vddNVW+wlwywT5s3mJPMtyEYgQBCKHkkJrjJYEKsoX
iAoARfmMEEBGBp8MwQ7jfruu69br9famLO9uiLo7mElpbOHSDJ0L8G2D0LbY7cvJP7vmImuqkBNVeZ6vLxbL2fVqedUnFBIR0ZBb
cF5mqCjKl4EKAEX5jBgM8tCoJ2YAgATgpuvK+93u9l3TbN6QwY1NJjuTJDVzaLtWfFMTXEdd57K7tl1a9mGa5f7Vs237v5qmAQDt
AaAoTwcVAIrymTAM+BERxlmnPiZyNfP6nvn+B+/9tyyz1wku7qxkJQvaXcm+bkDCxomkO5g5B6F5XbdvquZ237ZtCCFYa4/b7Rf9
uvpXlC8TVfuK8nkxnvB3SNJzIdS7EDbviNofgOl3wb98y/5y3bbZZrOj/W4D3zUMYYi1ic/zfGvN4q0Py7dtZ+6qut7tdvvznRlj
9DdCUb5Q9H9uRfncGHf97Wmca9be1++Ikndpen1v0+c7wbx03pT7vTSbnfi2EYgAiTGSZ6a1ab4JPH/XNNkP213z+vb+tuu6btim
McYMIQZAywIV5UtDQwCK8jkh8sAl33Vdt6uq6r7r3C0wv02Sqy6fFhwCuvoeXdswtR1bF2K9vzUAGSBJUHVN8Xq7m/7H23d3L7L0
Jp9N0+vV6mJeFDNDMAzwsB9mZiJDse2AoiifOyoAFOUT52zVPazGGQA559xms9ndVvXunXdyIzRdJ+nczxfwVQ0WAIEFHEQQiEVI
ACAESPBo2jb/Yb25+L+NqWfGVKaYvP5XUEiTJCnSpBgqAQggFmFDYkSgVQGK8gWgAkBRPmFiCR7AAjFEBoChWApIruvcbrvd367v
b9+4sH9LsPcmy3fWJq2xcLFkAEYEJCCBMUJEwgzuOojrELy3t/tq9e9Am6fpTTGbVcv5bHu9XFwUaVKQyKHPQL850fW/onwZqABQ
lE8clriQB3De8rcry+r+rnV3b5xzt0k621guSjJw3gfnPRFzLBcwhoLAwBgQsxjnxLQtmJlKkekPTXedr3f+6n797l/2Zd11naPp
hHSlryhfLpoEqCifNiICfswOd6D9lujuraD5zoXpjcjFmnlaOoeqablrW+EQYq8AQ4Rh8C+LGOFgRQIAOJOkW9D8u6a9/q5q8ru6
7sqqbsahBxERMkYFgaJ8QagAUJRPGSKAaFz6NyAV8/be2OqNTYq3xr66hXm+D2FWtS3K3Q5N3UCEJW6AjIBIIACCGBEmDiICQpah
y/Psnnl11/nJu7IKt9vdrizLw7TAoRugMWQGEaBVAYryeaMhAEX5DGmda/bel3fG4DbNru7y8FWVZmnTtOiahrvAEjyLYSFjDEmc
GUAAQEICZiHpF/PGAEmKtuvyjXOT19sdfX9/v3uW2bskSWxRFMX7SgLVI6Aony8qABTlE4dG9f7MzN57vyvL/brtmnvmZJ3aFebP
UgIhuFv4ENi3nQiLEHPchBm3DxghAEkcASREWFfV7L9ubot/S0wzM3hr5wvz3NqrSZpOxschEGEWNgZGRYCifJ6oAFCUTwwREcRi
+77PvxAECMzBOed2u115uy/v3gXu7hI729pk6mZTOB/gDcF7T+K9RLsOnDcPFALEGGKCgQjEe0LXgURwvyuX/xXc5ZzDTUK0T+aL
d3mRp5M0nfRb6icFxvLAx1WFoiifAyoAFOXTI5pXIopBehgBhEMI1X5fbTab+7d1c39DBveTSb61MHsIKmY4EYgwHUxzvB/r94Sj
FCAQU8wJgDDgHMABQgaV8ORb1z5PRDjLspuLy8vdy6uL3Yvl8vlwcBSPS+RhXoKiKJ8RKgAU5VODCCzCFgf3OhGAIOLazu3WXXd/
431zmyT5RjCpAew7F+q2Q/DeGADGGnAIAGIrvxNLTQADhnuXPnknhg0LEQVj7Nrz6ru6DYt92f5ts73flFXtnfNpmqa/74lQFOVj
olUAivLp8VjWP5jItdZut4mt3hnK75L0Yp/a+TZwum9brtuWvXNCIiBhM0rYO14Q/fbSt/MhQAwzmxCYRATGgKdTcyeyet20y7dV
bdb7qhlXBEQozgrQ+L+ifLaoAFCUT4w+tv5AADigKhO7v89yc5PnL3bTyYudSZZ755Pdvka1KxG8F0LvOjCGCH0vX/SKQgTCMRwA
xARAQ2AjwhI8wVpIlsOlWbrxMrup2/Tddtfe3N3d11V1EAHU0ycZnLcrVhTlM0BDAIrymVB1XbkDum2eLnfAq3o6nTVB0OwrVGUd
fNcIOwcDgIwhDnxoICByFAJHBGRIiFloLDiMgcCgEc7u6ib/59399k9Fdp8nSfbs+XMqiqKwFBsMDoUBgwBQj4CifD6oAFCUT4CT
mvphMU10KPtrmra9r8r9PSBbMrOwWMzs6gKy3cfs/6aR4J0g+KFX8HFzGMIAOLoC3rNeJ0CIRZiEWi/pu105+/fEVCtrdlmeWzub
2xd5niZEJ78dcVAQmXGpoKIonzYqABTlk4DGIoAAkAh4KPtb78v1m7bd32ap3U8mE18UcImFIyBwgDALew9iGQX2BOh9AL2j/vDf
WAUIiBhiAIJwAFwHAagNIX8dwuX/1dYhEbnNislmslymy8V8Ps+yk98OGXoDQScFKsrnggoARfmDkd5+9neHbnsGELRN02y2u/Xb
fXn7jrm7I0w3WZbufcC+dWg6Bw4McCBzrNGPS/k+8W/w/8s4GaC/CDNJHBFMMBTHBLc1EUi8SHLXdRe+psTahOfLxe3L59fbb66v
qnmWzYZjj70KHokwKIrySaMCQFE+ARhg06/dKbrS4+Mibc28XQdfrQ0lO2OmNVGy77qwY0FbN8R96R+HYKLlj6V/PxWJdf1xlyHA
hMAAIYBsZ5Ps1oerrCzdq21Zvt3tu6puGlnMpZ8MpKt9RflM0SoARfnjEaLHM/+DMVWbJvsqS01ZFKu6yFd7onzXOdk3ra+7jjkE
QYAZuv3KkOnPAvB71uaj+wfjD8CIsAmBTfAMYSBNgekMd54vbqp6crsvw2a3q+q6rofEvyF0oWJAUT4v1AOgKH8wNPp3jPfOddbs
20nha4OrNklftdPppKrbfNs2tPeMqqohzEIEIjJgDrH2H8fEP+nLAE77ARxDA+hDBhBBjAdwlAdsIP2goKYN+aZzxc1uR2/v7/fP
i2xjrq8py/M8ti0mit2LI1oVoCifPioAFOUTpWrbfRVC2eRZ4tLk2mXZs5Bm1LQO+7YN+7aTrnEizCCSwxL80PBnFP//MKceAhIS
AfexBEbflhhV1+Vvd/vkv97dVqvE3lprzcXl5aooisLQKPUwZgPKWBAoivLpoQJAUf4A3rdCFhFxzrm27dr7cnd/Z6jdZ9mkKbJl
PlkQAXBk0DqPpu3AzoGEYQgwscUvWI5Z/8favx89ov76eDgkIhSCWBb2HJKy7Ypv19vZ/2VokydmnU6nNl8s8gIozrYkLMLHXgGK
onyKqABQlN+ZwyCduLAeFeqRBO/dfl/u1/v95qau7t4llu+X80mdpXkHoAHQBkEXGN4HEmYkYBDFdPyxsT8s/E86AfXVAOMQwMgD
ICTEIiYeDseSQCJI8Ni19fy/7/laupZskq6ny9X66vp6fjmfXzz2+YYKgY96MhVF+cWoAFCUP4JD69w49lcEhgjwIbiyqXe3+/3d
u64tb7I0XftismNBDWDnAxrnEEIgCcFAECXEuZGPOzn976wscHQs45tx/PDwuGshzAQR1JwUPzh+VrVNkc3m/vl6u/v7vtp9c3nh
E2sPvyWDzFDbryifNioAFOWPwJhx/3wyvbtcRLhj3u9CKNciZkdmvhOalIF5U9dh03TUtR0JC4HIgHxvZX+7EnwZwhIcRwWbIMwk
JhiydZJMmtZN/me733+33ZU3u11VVVU9n81mxhitKlKUzwgVAIryxxBL/85gEecTW3VFLpW3F24+X9VpNr133m48h33bUdN2ibCQ
ESFhUFxv81na/4lD4KQC4MQDMHgOBohiWSADxCJGmIm9kEAkByHNgDTDXeeWb/dl+vZ+3dxeLNaGyBRFkQ8iYOz614oARfk0UQGg
KL8zgyGMRXdy0jrXA5XP8sYtkHfevwzL1bQmyjdlZe+71m+bTlzXCYTJihATEQmLsIB9iBscQgCj5v/Dv4dQAEa5AGOOYwP7IyQh
CRJbFQNEBDEGtQ/5fVnl39/ebr+d5XeW2VxeXa2KosjJGBrPBRARIWPU+CvKJ4YKAEX5nRgb+9440tj4O+fcvut2jTUhzCaXnuUZ
L5emazvar7fYlpWUrYPruiFpgPqAO/Wr+2P6HR56AB6s/D94sGevEQFCALwDjAUDtCnr4p939/t/z9NdSmSTNE2yLEvzNM3PNiUQ
UQ+AonxiqABQlN8BOVjnh65w571r267ZN/Xupq6390VuqlkxTycL2wJw1qJ0Hvu6QeM82Ps48hfjhj9nLn4cnjw2+/mpFYHnxw4i
CIOYJQkhQAAWMeu6mv7nrUynhsoiz7aL1UVxCSwfvh8y9BJQFOXTQQWAovx+DHN6SAAwRCyIm7ar7rfb+9uyvH/tumZDMt0W2awF
UAEofUDjPbrg4b2H6bv1iTCBT40/h9AXFQAidNIJ8KAAHsT9+39olE84VBNQzAcAAPJe0HUiIOpE0lvIkpwHs9Bsvti9fFHv/hRC
NwEm4w89jAo+D3coivLHogJAUX4fhEXYAEbioppIYBjCTdeVd2V5/8N+t30H2F2bzffB5TU81kiwr2t03iMEJmEeYvcCYZAwRIQO
ImDc1e80BnAW38cHmgSNcweIQBw7DPkANC0AwBOSraFF47vCsdhnm137v8qq+te2qy6m09VHPZOKovwmqABQlN8J6qvk+lUwEZFh
ZvbMTRVCuROhMkkWlTWLEsauy5rvAeyripzzRCKGRBAD/wwwQ6IAOOnpc8ov9PuPtyAU2wKHAHAMCMBaOJbU2yR9Xbf03b66e7Pd
r9e7XflqMfem51ftWFGUj4oKAEX5HThk+4mcWGNmZg+pQ577TnjJWXbVTaaLPUyybltZe+Z93ZjgvYEIDQIgGn7up/711yJx+t/g
ZD9x/TMOYuC8E+BpM+LzroE0vJUAIQkigWOXf2OALEfddpO7sp6+Wa/Xb27vdi+KfD2fz6d5nseyQBEME461JFBRPh1UACjK74QB
iM/sXtM0jTdUh8nESJ5dmcnkStIkK1nsXVlh23mu2pY4sBD6+d0cKGYQ8KjGf/AEjLr6AScdAI9hAj4LBYxun90clwTi5H3Hfn8w
hF3TFG/u1sn/vH5TXibm3VfeX60uLlBMJkU09n32AwjSTxtUEaAofywqABTlI3G22iUAZM7W29u6ui+NaVyeZZImKzOZToWI6rLC
pm5l33TSdk4kBBjmaPj7pPrDqv/8gpENHyf/vc8D8PDAz/IGxqWFTEJ9duFQFhgCOu/Tt9td8R9vb3azxK6TJLH5ZJJNJpNJYkwy
GHtmYYHOCFCUTwEVAIrykRAcB/6MHiYR4abt6rrrynfb/e06z3y5mC9Dlk3JGHIAqsCoWidV28J3HoYZw2i9gNPSvzOX/bDv/iAe
MfzHLMHjiv7RxfjodcN0AQLFLACBCY6Nt8whmKa12Zuynv8/N/cuzdJmvlxurq794up82mF/xL/8rCqK8luhAkBRPgJ97XvflI8M
ehNNAHzgdlNVd+8227vvtrvtZppnZZYsy0mRBQB7AFXn0DgH5wM4eBDzaMu98e/j/2AWCAPUl+wPHgLCSCDEdxP3/QNE+hlCj3gB
Hqz+cfDgC0DCTACBghdqOxEJVCe2eNN2F363t7jJbp49L+s/t+3+Tw9K/+ggAtQLoCh/LCoAFOXjcb7aJQDSOd9sqnr9erffvGlb
2hpatZ1bNN5TkwH3TYuqacAswj6YoaB/+O9okE204hRr+IWH8ICM7PYjIYL3hA1Gh312iY8d5g5Q9ADAdYAPEIAamxR3qbe7EOYm
r/iv2/KH/09V76u6rmbT6ez0DHys060oys9BBYCifCyIMFr8EiF68X3wrgmh3ngve5usSmsvW0NF5VxY73d0X7fUNA2EGQTpm+gL
EAf+HN3/3Gf9P2rQ6XT1PrblvwIhIjl0GPIgYjEAs4hpQXlLNn9dNlffb8ubN5ttvb5Y7vIsy7UsUFE+PVQAKMpHwhARP2J2nfed
M9S5Is+9NddSFKu6KPKND7hrXdjUHbVtZ4QFhMHY9qt77jP+Dz0A+tuHSy8ORu7/9+ULvNcDcPLYIaegL+PrxxjEJkRCxEJkBcy9
xEmwa7vZm+128u3bm+13k+LWEpnFbDYriqIQopO2wFoWqCh/HCoAFOU34rFhPyYm/R0ed865ynVlyNKA5Xxp8/wyzbLC57ndbLey
brpQtq10PhCEYYCD61+EwSLgM4N/kgA4Nt7vSRIcpgUeEwWBE50yMv5Hw88UMxgwqAA5RgcYCAHiPUAE51xyd7+e/s/32e7fE7s2
IvSn58/FJolN0jQZG3tmZjKGYq8AFQGK8nuiAkBRfkPOVrRmdBsAcHt7e7/xblfnOWg5m5rJdGqTjDyAXWDa1Q3KphPvPcBMRgTc
r/5ZgKEV8GOXByv6RzwAj5cNnmUqnCQBYnT7bLsMEtPXOAQPNDXgHAyId1U5+efdfXGZ2SpL081kMsnmy/ksz7J8fE76ZEk1/ory
B6ACQFF+Qx4xaAQAnfdN2bT7N9vt27eQqrQ2a6fTmUlz8gAaZpTOoWxatJ0HCcOIUFwb44ER5xCImcHctwRmRm/t3ysAHrr8R36A
cRjg8H48FAGj5wVCsSpAiIIX67pAHJ8sW1N8uyuXWWJ4Nps3L188K/8kEs4NvVYDKMofhwoARfntEBFhxGl/MrZqVdttX2+3b7/d
l/dvIdSm6UW3mM09Ytnfvu1QO4/WBfI+kEGI3YNYqO/4J8IC9oGYwyHbPyb5jycB9sv53q0/Nvx9DUH/1NkK/+En6TclvcufDgpA
RIbVO7HACEDkgxjrmZglALbsktlr04mTXXJ5uf/hH1VT/S/nmgtgdbKbU2mhKMrviAoARfmtiKV4bIyxwHF1K4Avu273dr9fv/Fe
3kIune+u0bmiY497z9hVFTrnwcImsCeKFpcOzQRYRp3/ok2OLfplaNKLIQBxjPF/KERwdnk0BCCgk5pCgRCGksTY2Y9gogcgCNoW
sAaBrK2zUPjASVnW01e7avtDWe02VVN+dTneTcyNGPj4X5CiKGNUACjKb0lvx4YkQABwzoWq66qt935vzbK19llr05VnTqp9ybfO
U7mvELwnYiYiHMvlBhvNOGb4v68FsIzf8Bsg53fG++gf7b0B4ND3IAoQEgoilg3Z1of8XdXMf9hst2/u73d/Wi32k6IorLWWhn4C
4708aBykKMrHQgWAovxGEEDGmAfWq67qtmNufZoYsfMLm6QXNJ/ljU2wbdqw80GqurHsPQAhSwRzSLQ7GnwRAXNMCow3YvwfhzwA
Oa76MXb1n6/4gcdFwsjAf6hccLimcVUACTjEs2B6fwQRYC3uq938u3e36X/PJ7sXRf7m+uJitZjPZpOimJzsXUQ4elCMigBF+fio
AFCUX8l41WoAMzat3nu/LvfbRqSV6SRNrV1M8skkTAu0bYv77Z62PoTaORNCIOr7Bp8m8B3L/hBD7xBmAnPf7odAw6Q97o14H6WX
8cr9POb/wLAPBh2n14e7Qof3x+R/EZY46k/60cExMwDiPch1gAD7siq+e/d2+m+p2Sysffcv3ntjiLI8z44Jhf2RiMjjcwkURfmt
UQGgKL8C6RlN/LP97FuEEML9/f3mbl/e7/PMYzZdpNNJIcUMe0Nomhb7zqFuO3E+iIRY908AWORhc5/hwkOeIb2/LBA4bQM8jiXE
A3/s05x6AD7URrB/PwFCfemjDAn9woDrII0BBHDBpG/XtPh3a5tpkjRZnm9Xi8X08kIuEmMSIJYFMjMPIkA9AIry8VEBoCi/AnnU
OoJEJJRNu7nd7d+925ebEkL1fDoNWZKyIXSA1CGgcnHoj/ehX8sPG3681v80oW+0oB9uPFrmNzq8B6v78fM/0+aehASoDwlEz4AJ
galrBYbgJbH3dTf/z83WZXl2d319Xf+tcy1Fu3+6U7X7ivK7oQJAUX4h/Wo1LsFjn/+D890FbjZ1ffu2qm/fNm3YZXbJ3l90LFkL
YOc9lV0s+2ucN8xCRji+eVjVM4M5HNv/jlbzzEzS9wEYXtt7A+TQChh9190hg38oBTwr8TvtAYDT1f9jiYYnOQCjhECiOCWQWYx3
bIHgIUmXSbYJ+UIaR8muCn8tq5t101bee59lWTY+nyoAFOX3QwWAovw6zuvYBQA1zpXrpl3fOufuwIt9CC+8cxcSvCl9h3Xdoupa
uBAosNg4YleI5Njq99Dytx8CBAwNgAI4NuFBbP9z8AocHRIjV/7xeZwa8ccEwPAJHnvNiWcBEI5zAeMnPhQ9wBCx4cDUiQhAbBNT
kyk8U5JUbfi+rNY3ZVXvynJ/nWVXw24pDhpS97+i/E6oAFCUX0PfCXe4N9xou64tvWtLY7KuyK+bJL0O1hZ122HTOt7ULTVtRwwQ
mM1g4EX4tNe/nMb4H0YbxjxiqN9XKvihzfxaRGJ7wL6HgDBTAFkmY9fOL9/sqvz7+3X9+nZxt5jP59Zaa42xhsiMj0wHBSnKx0UF
gKL8Ch7rYeO9903bNo4k8LSYw0yvssmkqOYzbJsWax/Ctm5M23ZGhOPM4FGZX5/1L1EMRI/AeCXPMtjWY1KgDOWAhzLAY4levPD7
Rwefl/V9qAxw6AE4ujrc5Vgl0I8vhATf9wjoyxQhqJq2eLtZz//z9ZvqmyK7K4oivVwulovZbJ5Ye/J7xCL8aJ6Aoii/CSoAFOVn
cnBTi8AQGQA8PCYistvt9vu2qVxiBXk2TfJsVhQzbBODfVlh2zRSth13Lo78NRDwwV0fa/wPRp2iLZfQ3z8xyNGwHrr1EYkEPhhq
AQ7CQIbXf6hRkJwZ9kdf8/jzIoEIpi88YGKIoX6YoIQAdC2IAO+65Ob2fvHvqdleWqpMYt/+4+uvQpZlmbXWIlYwHM4liKBhAUX5
OKgAUJSfgfTddiGHgT+EfpXKzLzf78sf3r69XVtTNtOJpfkkT6czGyhFxx57F1DVrTRthxBYIEwGw+r/vN4f4+S+B6WAwgxiPjr2
x687HvCPXHA06McShA97Cvprip2Kjx4ACbFPABhMZMj02Yj9pEDxDkaEdwbT/7k1q5lNQp7n1WI2y55fXV7MimJqydhDjgGGLEa1
/YryMVABoCg/g35V2l+dTvxrva/vyurmh6q62SS2a/J03iW2YJPBAVwHRu0c1Z2Dcz6u9hEX+TFuLjJ27w9G9/G2v48Y5fM4/4PH
zwz+LzsBo5DBgyfHLyOY6IaIJYGdEAeBNaidLd5UzWW23obV3fr2b2VVO+899TWEhw0TPUxQVBTlN0MFgKL8HIjAImyI7NkzUjm/
edc0Nz+0Xb1mO/EhXIlg1kGw5YB901DTebQ+kA+BonefABYQszCH2OIXkEMDIBZgXAZIEBri+X2IgM8bBY0y6eQgItAv7M9FBcZp
d8ObHr0cQg3DqeiT9I4ehH57JABM3xuZZOgLAGH4YJIuzbJ1wAJlg+dlXd7UTVs1bXtyMocEQGN0+a8oHwkVAIry8xhMpgiOs+yD
iNt13ea289WtYHIneBmCPE86V3RJg/vOY19W6LxHEDEiQmAmEPVJcmHY9iHW/7AB0Cg8EAMPp3kBQxvgYzuC8eHiWP9//imGFf0o
cfBBF8CDgjgafpz2ATipMBit5ElYDIQlELEkRkBGyJhb5+27tr15uy+ru91+/6erts3zPB82NxoTqOWBivIRMD/+EkVRxgx2iEZO
8LZpu7Jtq1IYbZFfdnn+0hfFrBSy9/uKN2XJ+7KC9x4QIeK+8f7IwI9X2z/q9v9gKACjx3G6yv+QR328nZ/E+Wsffy8JCTHHEEA/
MIiNMS2Qr5t2+nqzM9/e3m7fvHt367x3zMJERIbIjM+xyM86OEVRfgT1ACjKz+CwIh095pxz2/2urNq29YlJaTm/mE2mE7da4S44
7Mqa113HZdeR994gBIJILP3DMaGPOVBfBijvS/o7mQ8wSvp7IAQGHhUKD1f1j77nsffHd/Tr+7MQAHqfSHwSEo4i5xAeEI79AUMA
iLDelvP/efdu8m+TtFom9g2yTK6Wy4t5UczOjb8AYgCdFKgovxEqABTlRzhvSEMAcW+QvPd+t9vt7zbbdQlxyNL5ZFJM88UKmyxH
W+6w7TrsqlqazglHCw+IgIWjCGBBECFhEWEGh0DR489nVQDn132OwHAbEgsKZYgRjO29oO8b+Lhn4LHmQGfCQI7FhcPT1O9pJASi
/184EJEVxKMi5j7sAYJ0HaipAWOw8830v1/LxQrcZcZskWb4V2NpOh4VLH11YYwDyFgYKIryy1EBoCg/wmAa+3E3BgBZInjvQ1mW
1Zs3b+7ftt16P8nB+TRPFzMT8gKBgDowdq1H0zlxLgiHABIGCZ/0/BeODX44GvNDZ9+xoX/08mi4YHzwP9UDIA/f89j7AURDPqiB
0f6Gs3QQCIEAAQNGCDHfQRjo2njM1qAzJnsjcvl/iFyRZXfz2Xz/bLWavby8CIm1CaQXXr0I+ChfsKI8UVQAKMqPMHJsDwz98ELZ
ddt3ZXX3xvu6zWzOqZ0iSw0TggPQOGdq59C6AO89iBlG5FD69zDRb5TJPzLu52WBJ+2Bf7IAOPtUJyIAZ+vqn2Jrz0MH420M25Te
U3DE+I6JWZAkCMbYrTXz78oqTO827k/rzf3/q6xq13UunUxSXesrysdDBYCifJjoQI+F/yelfwFot97fv2UuXwefe+AyJbNkIGkB
2bUNlW2H1nlqnTPMAWZo13vS578f+MMisZ0vCUbT/95v8HEiDsZNgKRfiZ8IB5y/d3x5xAMg49tHD8ADl/+J4Dg9dXLo5XeoCxAj
zCY4ZrDxaW4boLj3LN/v6/r1vtrelVVT7st6OplMx1szxmj8X1F+Q1QAKMqPI6CTvD8AQO39fsuyX6epvRd+Hqx9noMK17mkRgjr
ukbdtPDeUWAxGBL3INEV3k/5Gzr6ARACQR4x/jjzCrzPS3C046cWPtrqx7wFp8b99K2nQoEGL/w4PPAgBHDKQSwMuYEisSJATHw8
BZCkqGGLu9Yt35ZV9naz7d7dr9ez2XQynU6nQB8GGNl+LQtUlF+PCgBF+ZlIT1nX1S541+TZssuSF5jPl3WSoGw77ALzfVmZpo3x
boLQYDAFP+72P1/xP1z548cN+XjFz2eG+kFOAE7f974QwNhbII+95n2hg2OPgcPc40EEgSBEVIeQ3+7ryT9v7+r/nhb30yLPX720
psjzop+5cPIdADopUFF+DSoAFOURxivM2KKWDobfe++rqqrvd/t9GTy4KOZpni7T62fYG8J2s8W67aRsWu6co36FTyIhJvvh0Pdf
eg8AxZAAxedDID5m/z8sCfxQ/J/lp/X0f0w0HATCOGfgPFfg3ANwfuKON2nkNRkqAE7yBERiEyTvIdajcZK/ub9f/nue7i+tKYtJ
8S6ZTs2LJHmWWZuNdzNMCrQPOzIqivITUQGgKB+gD15Tf1ucc26/35dv392sb5mrKksszWeT2cUFuJigCx67zmNX1aiaVpwPIsxE
cjrQ5+BQFxzyATjIwfDzIAo4QHyIQqCvFhiP9R1KBHEQDNwb2WGMIHr3/SjsECUITg07HibwAQ/s/+GxR9fdR+s/DAoi07v64+cm
QCCEWBZIRAgB0ncB9iLJ2zu+/H+Em9zgNptOdpPFIp1PJ9NsOs2GoyKAmJmNMUZDAYryy1EBoChnRE+8MIiGpDMDxFVnXdfNzc3N
5tvN9nZtqKvT5YzyNLVFDgegCQGlcyibFnXrEGJ//94Anzb14VEZII/KAHm8yn/Q538c7z8fD3weAsCv8wAcHnzkMg4FnJy54z0y
5piUMNomMwwRiYAIHIC2iRMDrcXWdYtvwSHL0rBYLm5fPXu2+/Oz6/piOr04bIeoFzhaFqgovwYVAIpyxsi8DU1nCIhZ6F0I9bpu
1u/attpmSeqtmYU0TQOIO4Crzpm6c9R2Ht4HiIQ+7n00hB9y6T/m2j9P8qPHDPjPEQAH1wOOl/M19HtX+Y+87rH75yWFw/5i66C+
l3J0BVDXiQFzYGs5y81d213ku9K92uzLt9ttU1ZVwxcrNsYYHQ2sKL8dKgAU5QwCwLHj3NkTxB1ovzVmf0+wW2svTZpdCJmiDh77
IFw2DbXOURs8+eBBkFj610/wG5f9xY5/8bFRE6DB4Pf5AYPxx0GWfDhB8GiRY6DhkdX8+ar8MdFwIoPe5zE4rsHJxJDGSXw/ejco
tgEeRvv2HQopLuFJWAyBjXPsLSdUTBBFgF+9KavZzXZfbXb7qq7rejabzeKmo9vfGKOzTBTlV6ACQFEeIn27/xPL6ENoa5F9mWZc
TqbPqjz5Ksnzwolk+7qijQu0KytyIUiQfl5A8HTwlsux9p9DIMHI5T+UCPYlgYd4NxGkn/r3MATwUACcWeEzcYDR5RGX/iFTH3hU
JJx4EHDcJh3fM8T8Y2JjGA88Gs0FsBgSDAkQw4EJ5uAYEJugZcm3TTO52e3M69u78tVssrHW2qIoCqDvCdCPZhgqAvrzpS4CRfmJ
qABQlMc4MyMiImVV16X3dZMlSTCza5pNL8NsipID7quat95L3dQSvB/MdnwvHrr2f9T9H3f645dz5PDP2TbO8wVwennkM/9kzhwM
Z+ft0DH45Jjo+BmHhEEM/RCYwQKqmi5/s96m//X2XX2ZJTc2y+z11RXlWZZbwJ7tR5MBFeVnogJAURANCHDsOz+sLAVx4E/TNO3d
Zrtdd51rrZ1Rni3mz1+gyjPU2zXKtuVd20rTdcIhEJgpZtzjaNzf08d/WPmjN34Ajhn/HzD+IgLqvQlgjuH1x9z5P7Kdw3vGVQDD
ex9Z/UufGvFwFoBAQhgqJujRqoLxdofbBAgLEZGQc0LeSWDY/X4/+ee728X/1+I+J6yT2cyk02nyPMvy8++ORVgnBSrKz0MFgPLk
Ger7gYMLmRBzzeG993VdN7e3t+s3+3K9tpa7+TSn6SSzeQ6POPBn33aomk465ySEPvGvd+9D+i6/coz/i8TMfzkYchaJboNRqd/Q
Ivj4HozLCZljDsFQpsgMBI7x+OOni5fHVv4PTsTZ9cOnj8Z9JDQIEOH42Om+x9sbiQAWgBixuCIOCwJRzJFwHVDVAAE7drP/Fv8c
voWx5r64WK1XFxeTq8XiYlz/L4AwC5NV468oPwcVAIqCaERG1oMMYIVIvPftZrPZffvu9v7G+/1mWtjOzHKTZeIANBBUzqHsHNq2
Ix8COPTT/kYrf37kIqMywH7lf5gMKOd9A37WZfzBzo3/KI7/XjVwLhpOPQCnLz/ZGYQf5k4e9zfcZ4APfYGIAROfN0DXgUBCIO5C
kr317to5n6ZFwc+f39z97dXL/V+fXbfTPD+ZE6DVAYry89EsWkWJHKzU4AUgwLBI2Lft7l3bbt92Ha9FprWlwlsSB7jGd6FuW2m9
R+s9hRBwqM8fPOQ/JeZ/7t4f8gbeZ4jf68p/zJj/0tPxobP0c7bzyGUUBhCAhgxACkGsc8GyC+I9eWOSm7a9+na7u/x+vU3utrum
rquGuVdMiqL8YtQDoDx54pwZiq15z/BAU5LZbhLr33JYSmYvySbzltn6rgn7tkHVdtQ6Ty6E2OaeOTq3R/H9Q2vf8zyAUaY+s5AM
OQBnAkF6wzl+jCjaTfIeiM+extfjlh63wf07Th6Q8XvGHoPxS/ukvfHrjjs7PneGQA6tEGJZ4GiHQ1uA6D4QYh8/iklANgHSBOu2
W9zsyvR2venW681+kuXFZDKZ9FsR6jl+bE0KVJQfQwWAouDQ6efB4y1zWSa2qYq82BvziiazJWySNa6zded52zRoOifeB+JY0g4I
x0a7Qyvf4XoU/x/i+ccVf+wNLBAgyFDAPzx34n0/Lfs79twnMjGO8UAAfGAF/t4kQBm9P14PCQfHmP6pIY+lD+cCgKKTP3YopsP7
Dsd5LFkEelHDAqE+z0AAMQZNF7Jt3eRv79f192/f3k/SNCMiStM0JWuHWYGHls0/8+tXlCeJCgBFeYQhMXDftmUFBDebXvGEn9vV
Mu0Si13boPRB9nWDzrneKDNJn/l/iP//rMtgi+Vg6B8NE5we6I+EAH7Ohx5d/9hmfvJu5JHbvXCg0XE/tliXviwwMMQQbcsq//bm
xvzHJN8V1iZJliWXFxerhOjkd+wsoVNRlPegAkB5kjxiJKh/WEIIoeu6riyr+q7cl6WI4Uk+m07nKV1eoGob7Hc77OpGqrpF17mY
yCf9+nvI7ufTFf/56v+n9gF40BqYmU7UwuG1eGiYBSfvPb3gA+957IGfKy7OwguHFX/vMYjxBByaBMVnSAASZiJmMd4zJUaCh73f
7eb/8cZUE0P7LMvW06vrfL5cTlMgHe+VexVmNMdJUT6ICgDlySKIBe1jz7Ywc9M07Xq93r7b7tZvvat3RZbxZDHJl3M4k8ARoew8
dk1LddsheA8R7m0ZDkb72OFPYonbUN7XCwQwDwY9CgNGX/vPiObxYbc/Zibuy/Bio4JYOXj4RO+15j/23PnjeCAU5DBeEIcHgD40
APRx/t64GxMHDj5y1kliEkBstcBEYoagAERAbBBjGRwgXQthpgBJboCVdB2YPeWT6fb65cv1y2fXV+cVAYfAhOYBKMoHUQGgPEkk
2gcesscgYoiIgghXVVW/ublbf1fu7++skTJPipAmqViDDkDtfLy0jhrnEfpafcJZk58Hk/xGHgA+8wCM5gRE4473r9yPnyGqBKKj
oR6M7rD2jckIv6kHQIRjxv4jLgEZqimZTxMCx9s8eDgYREbi9sww4Y+YOfYFZga6BvABbMjshOdN1xYBsKuLu+5vt/f1P74qd88W
i6uTY1DDryg/CXWRKU+Ts3GyfQq5McaY1vv6zvvd27btbkPIK7JTb4x1zKEJ3tddx03n0XhPPgTq3f9ni+3HjffPr+k/M9bnjBbk
P+6h/7ku/I/J6GSd5y4MyZjMoODFhJbhHZjIdDbJ3lT19bfr/eKH+3W4Xa/3dV3X3nuvyX+K8vNQD4DyJIlL2MPAn+NqkYg7a8ud
NfWdtcUutVeUpSsmylrnpAyOy7qmzjvxzBRiohqZIav9sNL/6cl/Y3EwzgE45vU9EATyUBzIseUvcPQEPPAcvM+rcIzNHx47PHTu
KhjbWTm9eZgnJHEF/+iAgf7zcSAyJBh6AlHv/JD+62EWAgmJCAxiomCaohXJ76pq9sPN7d33b9/tX02nd6vVcj6dTidJkiT993tS
Ehi/WvUKKMoYFQDKkyR2+nloD7oQ2saYqi5y7P3kqppOXpqiyNsQsqasZc8sZV3DBS889Ps/uN8Fh+S+Q93/+HLaA+Bo+E88+9FG
00gQAEdhQCTokwCJSGCGMbvj1fTwIQk4X2m/d5H8iFEftnti/8eC4ZH3negBOc0ZGB4FR18/SEQCAbbvaWAOx9178WNSgQhiTkDM
1QAR9k07eb3eZP/5/evmMk3f/dm7YIwx0+nUGKLDTACJ1l/686UCQFFGqABQFPSGQkR2ZbXfeV93eZYJLS5pOVvxZILGddhWtd+7
Tpq2HQ386Y143MjPWvk/WuI3NtKPxP2BY93/yer/sRDAh+L8P35GfuXzP2UPQiQix8nLwzYfKwkUEAeB9wARuq5Lb7a7yX+8ftPO
rN2laWJn83kxn89nxhwbOgzfKz3uilCUJ40KAOXJcO4KHowCM7NzzlVVVb/bbtebEHxnzdIspvP58+fYk0Fz32LXdbxvG2mbVjgE
kODY8U8AjDr+8SOXYxLgTxAC8YDHcQA86r6H9BP4RmN1Tz/0Wajgg2dodH0aGRm/5LTq4BdwchxyDF/QeP84dBYaogMmBLYhhCCw
rUH2drtf/h/AJ8bsl6vl7sXLl4uXZ6v8mOkpPB4epChKRAWA8iQYVoIAgagv/Ysrd/bOhe12u3/37nb9Q9usb6xBs5xNTDHLbFqA
EdAERu1a1G0H5xw4BBBkVNInjxp9fszYMz8S0n8k/o+jGR5744cWeQKQBCYB6JDtDwbBPNyIjDdy/jiAsTE/eex4oCTH/QKHtn7H
99Hp3dNt9p/kTKCISAyjcGxnDGNiiKC34xLLNAkEUPBCXStgQROS/MaYCxd8ItbSi1ebzT/qpvQh+DRJDn0BDp9Wvf+K8gAVAMpT
Ymx9yBBZAdB1XXN/v979z3p99867ZjOdZB0WhclS8RB03qN1Dm3n0TlPIcRVPvV1+3JW0hdH/3K8PJgF8OEEwcc8AHLmARCJ2mNY
+T/MAXjEg/CTPAA/7QweZwH/3I2N3jZ+qwhEmCAhJi+aY0ng4L0ngVDwQm0jYIZHkWzrblH5MDVpKv+y2e7f7HZlWdfVxWKx+pWf
UlGeBFoGqDwlDqanL/83hsiwiN96v7vtuupd52xpzMwltmBj2LH3XduGtu3E+QAfAjHzKPZ+rONnfmToz5lxP97HI4ZwdP+Bbf0p
xvaRVfyvNfi/B4+FOgaMOZQFEgch78Qws4RAwZDtbJLd1M3lD5td8fruvr25v19/qCxQSwUV5Yh6AJQnAcV48iFfb0ww1DZJUu6y
lDaWLs18ukSWTRtm07VtKOvatM6h9Y689+AQYr76e43/IwKAceZRf9wTMF7BnwqHfn/MdOggCCHqM+lOVvljFTFuAvTA739+GbnJ
32smz1SKACDq1+gP33doDNSfr0c3PBJTJ8c6ctvH7fctlIMQkjQ+by0q5ye3293kn6/flP+znN8lIvZitVrMZrMpGXN0WOBUAGhV
gPLUUQGgPBno8M8pTeB9k6VtM5vNK3ZfFYtFHrI0Kztnq7YLVdVw23liz/3IXiFGLFgf3PwPBMBIHAz1+Q/L/049AgfbNPbgH+4/
DAEcHu8NKAmNlIZBHMH3Pkt+bvw/8LIfe+0oZDHkH8TufmfhiHHKwKjtwEmOwvChYxEfiIz0WkAwNEmUWH0hgYEQwCHQ/W47/Z/X
b9J/K7KdFSYRSJKkyWQ6KQxghm3GM03QqgBFUQGgPGFERJqmabZNs6+tAc+mqzS1V3SxgmPGvq6xb1rZNy1c18nQg79/bx/v/8BK
/lFD/+Hyv+HxoTH+g8S9Rzgk/T3efP/T4UNeBaGHn3foDESmt9uxPwCIYpdA74QcwQKhqpri29v76f+dJds0sbvpbJ5dXFws5sbM
TvYkUYXo6l9RVAAoXzDnZX8yenwo+7vb7rZv6rrcpibhSTZfPrtGyGfYtyWqrkPZtFK3LYIPIty7s4fVvDy28h+X+j1e9hcNHfcq
AhAROn/+RACcJPEN18MH6o3nAw6tAH/tWXzkvA6NFH/mxs+iDCdPnHsBzj0HiGZ7cGwYZrbsg/FWBEJl1xXf7/YrS0byYrJ79err
8i8huPfsSVEUqABQvnB683gw3AwIMYf9fl++ffvu/vvd7v51CN12NVuE2aRI8gIBQCuM0jvsupaatoMLHszHIT48uPn5mPl/uM8C
weg2HwXB0CkQGHX0G4TAoXNenPpHNMzNO36aOGUvYHiUxMhxxQwcX/1Ia98PnKT33h8Z5SEjXw7je4cVuoggTiWMnf36zzLe51l4
49HHxwKAHlELhtAPXYQhYuM8E0EcS7a3yVSMpYY32ex+4f7Xbt/s27Z++eDDxm2qB0BRVAAoXzBxcR0n/vXLVmMA8sxht6+q7zab
9T832/3amsTNi5lYYz0YDQzqrkPtPNrOU+s9hqE/58l941I/Ye5DAo95AI6egKORi51vhJkePCdnxntkIA+dAOOb32PczwUBHhrf
D77nkff/6LsfdUX85HfHt5+HPXoxEKVR9DxYKyQSywIdCzNMm4Xce0n3vp1d7+rdd5vdm5vtbveX589cmqaHvgD97MeTOQEqBpSn
ipYBKl86hzBAX/ZnIYLa+3rTuerWe9oYM2/SdOatMc47X7s6VE3LjXNonDOdcyaW/h0vR9f/eZkfzu6P6/h/9DDVQQ3gVICcYY5z
jo0EhvdACBCAgrW2s2n2bl+tvr9f2+/evtu9vbm5raqq8t77R/ekZYHKE0Y9AMoXCxENpWQn/uQQQnCGqibLfJUXq7CYX8lkMmey
Seccly6gahrbOS+OmUJg0GDQxzF/OfUGnGb047iix+P9ADiE0cofAIuQCGBIeFwEd0xeOL3w+P74kz8WBsCPiIsHfv8PnddeVIkc
wgFHh8Uj+QFn23qvc+HsWE/iH3RyNeROxPNrjq8xBru2nn775u3k/8yK8jpP3/z5VeeuLy9Xy+VycbK3EeoFUJ4iKgCUL5Yh9t//
wB8eb7qu7oyp/XxmQ2qfydXlVZjP01Ikqao6bDvPVdNK5wI49CVnzDIY3SH575ALcB4a4HMhcBQEEmP+0e3fH48MgXVDfeg8Zr6f
LE4fGPhzN708Eg4YQgdydv/8RJ0LiPeez/jC4chFoqEfbfMwJ+DnrKsP8qwPA9AoDEDv31CfPhETA0OAeAcYi8aH7PXt3eLfUtss
ErNhZk6S1E6n0wnFwc1DeCgC6LAg5UmiAkD5ojjP/I99ZI+jYVmE12V5v+fQhkkxMZPswlxezLo8Q12VWFd12DWt1E0rzDyKtUuf
AMjvWfV/+DKO449uHubgHfwU6pDGQ4Hz2CuEGDAHZRccqGsFxkKsobt9ufj/vTPNJEs20+m0fP78efVKRNLEHOcEyMH3oihPEhUA
yhdF/E2PA3+GxwggH4Kr6qYq27Z8s93e3QPSFtncFJNpulqiDQG189jXjezbTtq2Ex7ZB+kFwCHuf9LsZ5zoh58kBk7y+o7H+cgH
Orv+WSfjF77vF0Kj5fqPJwSeRGVOHx5UEj3+AYRjkyGGMRLnBYoJwsY7hmUEtnZLMvt2X/n03X149XK3/d9NU4cQAo75gP1B68Jf
ebqoAFC+GB6Jhg/uXemcb+62u7vXm/XdP9fr6j5N8jJbLmy+iAOBgkftHOq2ixP/AktgltjJb1T+J0JD8x+Ws3JAPhcEj1j54e4o
071/HcmobS/RMNpXRkYRjxv0IdT/QCyMXA6PnKwfVSBnNjqGKh7uhwChPo5ANEwi5P4lg3d9dAzj5IbzY6ajQz52NhwdBxGEw9Ai
IUYbTCxFNOLZeGLmYLxJkipNJuLZ2Kri78qmvG/auum6ZlIUk5O9E2lJoPJk0SoA5Uvj3KQZAGi6rnm32W7+5/Zu/7os7b3vVo7M
FMbABY+m61B3DrUP1PpArXMU+FjGx3Kc8nes75dDHsAw/e99Pf7ff8HYtvcFb2efZnz9S8/EBzdAH7g8fG2fxkDRCI/69Q/G/9dw
ECXvDwMMiYeCWA1IwkI+iAme4R0YMM4maZmk03eOL3+o2/ztdt/ebbbbk08yMMoV0aoA5SmhHgDly4JODBcRYAGg6Tp3X9f167Ki
O4OVyYpVXhR5UuTBW4hnppbZ1CGgcs4E78mIxOSycKzzf6zb7mGhPxj13+uzKpE+PAPvAWujpyDNKOSFLYOf3tTV5J83N9W3i+n6
YjpZzOfzWZqmqTHGjD1G5/kjivKlowJA+WKIXmI65AGMadq2K51zW8GkSYvr2epilS2WOeUTWFjPVJlOgDYwWueIvScrIMMMhCAS
wnFlep7hj8fL/x6WBh4FwiFW8eDOY8jDu+NOvx9SHMNBQc4W93S8PHYi37Prxz0D0jcF5NPuf4fwA334GA8hAjo95pOAztjTEMMj
cX/xvcJEMRwAgAyQJECWoWslvdlV8//6/s3m3wjbqbWvv3754urq+no1KYpJXwMYaw96AaBlgcpTQQWA8iVBQ/R4/CPedV1Xtm1Z
MXNNtOiy7HIxmWaU5tYzizfMgUUEQp45uv5ZiJgJ4RD/Hyy3HOrPR3H++LQcxADOjf7Y5Q9gHJvvTdiH4/uEkVv8uIl4dzCwZvzg
KWOBQSdK4PgCGr92fADvOdmmz1OItYA0NvNxGuDJzs+O56yu/xFkGOA83qe1It5TDN+THMIBLMQMI7Y33MxAiCppvS/n/4mwWAW3
zqy5gzGYzOd5URR5PO3xb0Xd/8pTQwWA8lnzWNlfHBnTWwcivH13c3NfN7tt19lGMHOBJ13bgTZbdBLQpFZCVcMGlsJaCnlOwbho
/OF7u88HA8486v3/gWS/Xxa4/yUn4Re850Nh/l98GEK/yWceeVoe84yQtQKYWA0gw1uI2JIRgBA8UJVAcEhA3BEmN8Gt/suQWy1m
++fPn+2/6bqOAJMYMqPd6spfeVKoAFA+d4bELdP/eB8S/zxQVW27eVNWr9+UVXNbtYvdvppzYNz/83vAAh17oUkOl6TICVilKWXG
UJtlcM7BWQ/nHEInYA7xEvyhMZCwEPh9Y3gfcd2PiKtbGq+9/zjOEvV/whMfb9/jREAWxIqC3k4PYQtj++wOGtoOEscsRCLXit2H
kFQkxiTGTvK0S2fLu8DhrfPdzoeu8757eBzvCYkoyheKCgDls0ZEhAG2pw5sAuBr7+9uqvrtu7bbv62bfN20V01VTt1uj90Pr+G6
Fg4B2WJmzMUF5RcXlMznmOQFamGUaSq1aeEhkOAROo/AYcgJIJIYbMB5I7mxVwDj8MCwoJXeQTGk1A/r3MH6xE6BJ0N/xhBFexh6
6SDnH324ffKm03j6YzkA5289rL7PkwLOrfV7jrEPDxxPxOMvfZRBAIDj57R8/AxkAGNBxvTjnagPFgSC8zBtw9Y5TgRMaZKk6YuU
JpN5M5maMp+Ue5vcl52rmJmNicMFBm+RMUYVgPJkUAGgfNYMTf7GDwEAi3S1c9v7pt1vRbJO8JyAZ6nnrNlusb27w3a7gZMgxWJu
pi9f0PTrjnJmSmZzmDQRBiQYgjMENgZiDLg3NmSMkAgk8KFdzSFNAPGQYj7AB47dmBj6D/wjRucsSe4klg8c++/8lGS7n2vffqoH
4EPb/RleBBl9zvFHPk9cPBj/Pu9BGBI8kWuEmkaStuZUIDSdUTEpaHJ9nWK1WjTL5fze2Pvbqtnf39+vr6+vrw5HacxhD8fD0YRA
5ctFBYDy2WOO9uXwQ101TVc2TVU7R5Sml4vp5PlLF+ZZEDJ1FXZdh+runvZVBcoSM9/u6LKuzbxuYC5WMJMJMmswAQBhWGPQpSms
IYQQEJjB3oO9RwgBzKPkP47Dgw7Ogd+D38FT/1EYvAyPKSVjAGuAxMbyPmOPQgCISX7iAe8A1wGuBboOpmuRECSbTMUs5yieP0P+
9VeUrC5snWezGxey/7lfl/Pg3iZZZqeTyTRNktSe/R4yRzfMRz8HivIHoQJA+ewxIJLR9DnnnFvvdmXpfCsi2XI+v1wmyfLPyxW9
WW0xTW1oqxq3d2vTbfeodxuq9hV1uz3a2zvkV5eg5QI0n2G6mEuWZciTBF2WoaUMLTM1zNR1HULbkm87hOAgIQDMIBYYjBavBBAI
PFrYAohJbKP0gSHjnYwRCeER3/zwxv6K+qQ70xtQii53wiOuh2OK5MPLSQXCSEmc2b7BqX84jMM0vt6zIKPPcOhpdDyOk/bAhD6+
33+gw/FKXNUTAYYgxtBhtW/M8X3OgTgAroPUdUz6q0uQMGySILu4QP7sGew330jyl78QffU1MJ1hV1fz/96Vq2Td3WBX3FCWyzcv
nr94drG6PjnFEudGGJAZt5VWlC8JFQDKZ8W4VOvYyO1Qwy0hhLDZbHb3u/26NSZkaT6fLOfz5xcrMsy4vLpANptKw8x3jcO6bc22
rKm+W6PdblC/fYvZcoHi2RWKq2sUz66QXlxItpjDTaao04SsTQFhMAjkPIkxsfFt3zI42lPqjxHoKxNBfSddAsDMMZAfEwCIRITM
0EZXDuGB/lPjcRc7DVaZ+n3JcbLfEB4YjPxpmsKJS/3cS3G+6D2flXdMVTgcbp/BcNQHgtgZsJcMItyPCqCHq/1xWsGJyz8afRma
9RFiQmDwQNcBXQs0NbDbAbsdqKlhsxTJ1RXZ1cokf/6LJP/yD5E//5nc1TWcsajarnBV/azd7ULIk/s0L+6KPE8vVstlQpQCx+aM
IsKixl/5glEBoHx2jEzckPFvDBG8936z3W6/e3vzbiuytkVBRZ5OVrNp+tJa2P7FblJg51numk62bYum7nBbldjebVDf3mJW5Fjc
3mL5agtbV8jqBlQtkSyXyGczhDRFMIYCM9gY2CSBY4YH+m6BMlgQHPTK+X3g983+P4+h/5Rdj43xrwkvHBL6hjvDdun0+nCc6Ff8
/ePcz0hgAoKLhr+qIVUZV/5lCdM0sARJsxmy5Qr2xSuDP30j8vU34i4uxacpEBhCxtZBroL3knMIl+vN+k+7/e7PTdslkyIdjkbG
OZmK8oWiAkD5/HhPdrwAXctyVwpu9yx+liSztMhnmbVJFisFJAfMYjGjr796RbumRdO2CF2HUFd4u9+j2VVod3u4piVxDmhbmWz3
ZC6WgosLyHwOO5+hyDKYNEVmCCHLxKUpHDNcELjg4XyA9x7iHNCHBmLdep8Zz6dJCxSH0pyl+slx8S8YGcz+0x5sau9CHzwQwxTj
RzvqHU/W6fP9js69BMP1yfs/pAgeMZoSk/QepGoS9at8OmTzn76dAA6xxS+Hvt2vi6v+/S5e6hoUGKlNkF9eSP7qKyR/+zvsN3+l
8OwZ+fkCsCn3HZ5Axqbp6iIpIVd3XdvdsZT3ddNsN5t9niZ5kiTJ4eyqAFC+cFQAKJ8Vfatf7u/Y8XNOZF8Dd02aupZ5NZtOLyhJ
VwSYOpoPagCygFktZ/iXv/wJYBHLAdI25OoKt96D9zvaN63Y9QYcPO02G9jpFMl8jmQxJ7taUbJaIFuugMVCZDaFy3J01qIWQuU9
yqaFb5to/L0HQgAFFoHQIAAGo3+IEwydAYmOufCDsR8bI4PoljdGYilgNPrEJBimFwI41NGzPGLsR8LgfHV+bvd6wxxD/Dgcy8nE
QvQhiMO26NgaeDTl8KhwRobfJjHBz8RzQbHUEsQs8A5oHdA1EO+AriNpaqDaQ/Z7Is9iJxPkV1cy++vfJP37v5D9y1/FvXhF3XSF
jgXYl2KSjg2BUhCKy0tk02nabbfLXUrFXdvu397erYs8y+fz+cxaa4UoCoCDljoNPf2cv1lF+VRRAaB8drzv97dxftsIas6KmSV8
k05mM5OlmQOwBqQDqALQAWZSZPTq2aVYAiwCfNOidV6CMbR+9xahaWjXdmhdB3N3jyRJkU8mKOZTmlxcorhaIXv2DNmL55LIlfg5
oS0KJMaCrIWkCYQTtJxEA0iAwB88ADT0BaDjMnvopMc8xNPfdwL6HAMRwBCIbTRWhgdhEF93CD8IThLpxheMmuzEF5/u6yd0xz0c
60l4o4+eD86asfdiWP0b02f399n+h/wBiSv+Lq72qWkETQk0LdC2kKYh+CYmAtoc6WKJ7Os/If/f/4rkf/+ryMuX4MkCDRmqqwZU
N5yYlCm1FtMpMJkiWSzBWZbXritufLf/9m69zgzSV69eYT6fz0ySGENkY1fJ/vsREU0IVL4kVAAonzUiIt5733au29T1rvEBSZFf
XWTZs6t5gQRAwyyVAbcQaj0bYxOTEcksTcQ+vxYOQcq6Re08GAKTJli/fQu/2yDUDdB1IGtQ5BlCWQBVBVQ72KaBcQ7UdqBVjWQ2
R57lCNYAAiSG0GY5nLFgDggulg+KCIIPfZlg7xofr9rHhvvcjT+eB2DifqIB7V8TkvHJiYY0eMD3K+zhYnsBcEhc7I9DhhwGxk/u
cHhyrKPHhlg+ELv2Dav/wfVPg9GXeIzDfl0XjX/bAm0D1BVQ7YGqgrQ1IAwCYJMU6cUliq//hOxvf4f529+Br75GWF3C2QRd3aBr
Oth+SqCkGZIklUAkKCYQYVs25fSHXZNlZVWn4m8ni2U6nU6LNCYEHuDe63QepFCUzxkVAMonzzCnfejaNjzMItw2TVuWZX3XtNtt
50qXZNlkNl08v1piAaABUELQsnArbDyLZFZIej9CZg2ury/xt7/9Gc6zkKHYYdZ53NY1oawAF0AC8TagazuQ7BC8h29a5GWJ5PaO
7GoJWi7Bszmy6Qx2OsGsyBGyDC7P4YmkZUbjg3Teo3EO0nWA85AQ6BDD7w2vsBCZ3qV/MMqDgZVjMp+1h7K5U8eIHAWAD4Bz0ejb
ftWd2Dgxrx93HIVAiLX13o/yCHA0zGchhKGTIdDHL8ZxfiKI0KGEj4yRYylfXxAg3O/fAc7HY3Suz/DvAB9ALmb7S90AXY1hB9ZY
ZNfPUHzzNxR/+xekf/0b+Po5uckcnUnQBCYX4vbhAiQwMRkEFu4CS82BApCskSwso+nqZp2ntrpqu/trlmUOFOd/hkS6/le+LFQA
KJ88fbP/Y1ud3v/NIqGs6vr1ent32zT3TsQXM5ov0iRbIP6CdwA8EXXxB1+EIIEEXYycEwFIixyvXlwDgCQEMYHF1ZVp60pKF2J8
OiFQkiAYktp7and7lHWNZLOltHgn6XyCfHGB9GqF7PIKxeUlkqtL0PICYZqjS1OqibD3HvvOgY2VhigaemHpF7VnH3y48VjS3ZBA
N8TQ6ZA1H8+RQCQAoQ/cCwGhb6ojDEESX2kMyPYiIBCAMOq/P64WoOgEpyEb4FjuFyfy9Q+PY+WD0bcJKEmO7n7qk/tcB7AHNQ1Q
1/HStr3x90fR0+cEjElWV5j8+a8y+ce/Iv37PyBffU1utpDGM9qyRgsGuxDPgwFx7JZAznlUVQVDgAOIJCxaGLNj5POAH1427fZP
XbdbTIrV8e/vKL3U/itfEioAlE+ePvFPRncTgMDedzvnytu2XW/atkrSNJ0aM8ltbOgeADjEeX5BAO4r7pkFLTw6gAwZSshgNp/J
V2QIItK1NXa7rTRNSz+QQb3dCoKDQOA4gL2HBAdqGpDsYY2hLE8xmd1jul6Bnu2Q1TWSEJBwNGDZdComsdFaEmASAyMJWsnhOyJY
2zcRGmXyD/30D96BURjg0A6XQGR63/SoEiAMrn8Pcb7vkueiYR0uw8p/CCsQjuEBWMSNMsCm9wDwcd9AH37AKGQxjCNG/5re2zA2
/ECfzd/X8jdNLOXb748CwLnotRhb3XDMVUgXC2Svvkb2578h/fs/YL75M7rlCo2xVLUtWh/6pkvx/MVJgcaAAPZe2n0ZRV5qLazN
XZrnTTaZ/GDS6nXT3bzb7ddXRf48z/O8/ygjZaUoXw4qAJRPnt7z+mDqTjRPUom1FaeJTfNsOcmzeWKt4WhGpANbL2K8CCFmdouI
gJkRmGGMAaU5coCmswlevHiGumllV9ZwIUiS57j54bXs7u/gmhoIDsJD8rsA3sMHRuhaSOchg3HtHKRpke32sBcXwHyGdJJjmmaw
1iIzFjNrpS0M+TyXwBxHDDODYwgABwPW5wocxxH3tzFaHYe+HW7bAm10oXPXAc7FY3K9mz2EQ0nd0JeHYsc9EJmYlJgQxCZAb/OP
IYDeOxDCQZgQGRFmOoQgDln+6LsB9jBTXNX3jXxcG43/0MWvKoG2AzkXQyA+xJ4K4F43GNi8gJ3Nkb54ifwvf4P9818hr17BrS7Q
pjla59B1Dty5XsjYOBvaWPQlBiIcxDWNGBHxeSbZakXF1RSS2Mmday6+r+r1/7y72S44vL1YzBfT6XSS53l+nvl/PoZaUT5HVAAo
nwV9adyJH9w511mblPlkItMiv1xOJleTyWSOxGYNAAZLB5EQV/40pHALIBJ7CZBAKADwfVQ9m07o2ctn8nf3D4EhybIcloDgOmya
JtbyA6A0QYIEYkMsTxOBYwbqBkEIbetQ7fbIbm6RzedIV0ski5lkizmy2Qzz2RxhMoFLc/g0hTMGwVoJIgjM8M5HTz5LH4YXsAiC
SJxF4D04uJgU13WQujzWxpcVUDfgpoE4B3G9FyAwaFjJA6A+EZCyBJRlQJpC0gxiU7CxkKRvnSQSBQkHEIuAA2iU9BdPLUkMQfSl
fCCBD4CPIoS6VqRtSYb4ftsAXROb+vRufwp92MFG74O0HRHFkYdECdLFEvlXX0v+578g+evfQa++RjdbkDMWbQjofBR1seAzJkjK
UKLQf/ccGNR10glAhmhCBJ5MQZawv7lZ/NBUs3+v9pu0rl7/6WLVvnrx/CrJskT6ksfhb5BF2BCNc1IU5bNDBYDyOUAEPOj+U3du
A2vr2WKeG0MvLyeTRW5s0iWJacDeAdLGnvRiIEYAwaF2HdJ30kdAQAMb92ENpqslvgZgEys2seK7BnVZUltVqL0DOMCmCVJrooFm
318LOghc06JuW9hdiezuDnlRYDafYXK5wvRiifziEsnFJdHFCjxfIlgDn6XijIEHIQjgjRXhWBLIiMbfA/AhoIPAe4H3DqGuIdsd
sLmHbO6B9RrY7mJ//Lo5rvx9n+R3qCCgaODTFJRnwKQAiniRbAKkeYwCDEl8Q2t/M/QbGEIHOIQj6DCdDyARkHB/0A5SlYSqAtUV
0DSQwdXPPhr+wWgfEgWHMEYAYGBnM2RXz1D85a/I/v4Poa//hG5xQY21aNoOjqMwiqEC4MRfTwSy0XZLCMQsJHCAS9D5gE4EaZKg
zbL0Xb1b5LtdY+q6lBAwmU7TxWo1S9M0ERxX/BICi7UPWhcpyueECgDlk4Q51qCNMv8PxW4+hK7zod207a2zicuKbJXk2eV1mllG
n/kfYmveYPvwrTEgQyAWDOlkRCRBBJ33xOxBFNv62jTB8tkVxBp0PqDc7bHb7hA6h1sRtE0JiMRZANaC0gQGBsKM4B1cFzP8qWnR
VoQ2ScD7PaSuYJoapmlBTQvbNjBVA8znwHQKk6ZIjAWD4kpWAGZBQFz5d8yg4MFdi1DVkKpCWG8Q7tcI6zX47g7YbGJv/LqOLvaD
23/IKxgMeZ8QmKZAlgGTCTBpgUkHTByQTYA8BaUZYM1J7wU5lC0Osf9R/T5i7B4+9L36K6AsgXIH7KtY0te2MQRwSOwbtf3twyDS
9y4wlMNOJsiunyH7+k9Iv/4G5qs/ga+u4GyOlhlt1yCEYwXCcKSPFCseyh0lMELn4duOnevYW0KXJmaX5IvXQp2tmvvVrK2/dq5m
79mkqR1yGAQQGF38K58/KgCUTxF5pN0vAYBnbjZNe79tmvvbpl2bXNIpFauLNLMzAEOhmENMAuy93SAROulGOyxpKebEiwhzDBKT
IQsCaLpcmOtXL/lP+0rqphVrDBJLcvvDD7Tb7Sh0DsZapHkGm2Zxzx317nqGhACGwIcQGwrtSwIEru2Q7itK1huY+ZxoOgOmE1CW
gdIMJknF9saGBQjC8CGAgwd7J75rYcoa2FcId1ty6y2w2QObHbCL9fLo2kOWfWz2I/31QL9atwGwDsg8kLVA0QDTOnoEJikoT2Gy
BJRYiLF94yJzzPvrcw+H0gz0pXfkHNA0hKYG2gY0CJKuX/kPeQTGgPpSRhGBhADhKAyMtUinU2SX19H4f/MN8OIr+NUKPpugY4IL
HmEQOYMHAUNZYsxdOAwlAiBBSIyQBE/irbi247ZpvLWpYbJJMpnOzfJC0v1ebkxysw9SOef8ZDI5nDkW4UMXR0X5jFEBoHySDO1+
hcjQyG53gat1097c7KvNtnMojL3IQ1gmiOYt9Nc01LD1hWtDe1303mX0hovIxKRA6qvaDcjHdbJhazFZLc3Lv3zDLCxZYsRCEFxH
Td2gbjsKQWDTtJ9aa/tEeuo7AcZEO0MAE1FnjITOUxX2MGVDZr1BkmVIiiJe8oySvECaZkhs7O5HQKwM8C7WxAcHaltBWQNlA6xL
YFcTyhaomn513cWEPRLAEsywchXTzxcYyvukrxRgoAuAaYG0BvYJUKSgSQozyWCKFJSlkCSB2ARMBoABx2bAEA40eBjIe+lr+Ym6
TtC1sRKh64gGT4QhgOJPD1kbywQBsPexdM97wBjY6aSv9f8z0m++gfnqG4TLS7gkgxNB58PR+DPHIgEyx1YEpnf7Dw2N+smHAiER
QwDEt7W0WyuSJghZmtjZnEySmXtj6T4vNvcs9baqdsvlcnH424w9AbQpkPLZowJA+SQZVlcHQ97TdF1Vdd2+dE4CcCGCZ2ApHDNK
Y9AAg4u/r0M7/ZEWliH5/WQFNwgEHxjeEgUQBESU55g/u6KvDIkhwHUd9vsd6rIEhwDn3CFz3xiCTQySJAfRsY/MkL0fIORFYoZ7
2wGlUEKENE2QZRnyPEee55Ash1jbx9SBwIzgHHzXxkvTIFQNpG5h6g5JE+vmCQEmD0gmjMQKMktIjEFioto5VhH0/X6CwHmBcz6m
CQQAru8X0FmgScBlCsn7PIE0BdJYz0/GwqDvY8DHeD31zXwoViAQBR+rBcali9YeJxAPXQEPDYUAMQST50iWK6QvXiD95hvYr/8M
vn4OVxRoOOZZOBdLMs97BBzLFHspMAiA3jsgYkgMCMwIjZNWSuEsExiDyWJp/XQ2KcHmPsHsjfP3r7f7u3mxnl1cXKwAwBJZGtU7
aEWA8rmiAkD5JImp9qe/p9573zRNHUJw1pjZPEmezfN0mVmbBpHQhsANYDyRkWhWyOPx9u1yklRIvRM7ZuBzn7sGY2GtRTotaEaX
dBU8qrLCdrcl17YwxmBzv4b3Dl3XQSRBkiZIswxpmiF2wzuWHIr0187Hcn4fWwMb72PiHwtMCEDnITbmLMRKQImdB9suGr66Qahq
kO9Q+A5p0qEoAoqMMSkERS6Y5IIiEaQWSAzDICYpDg3/YnNAgesEdSuoG0HZCNoWqB2hDhZd58FdAGoPpB7IEpjMglIiY2MIITYu
jIqCAoN8dO+Td6AQYtVBXxlw6FxoLaT36wiHWGEQh//AWAtT5LCLFdLnL2C/+hp48Qrh+hn8bIbOWLSdJ+8dmPvVvchBzMnZl9w3
Tuhj/72o7CWliECcg++/IypyOGPA0wl82+Y3bbX87321m5T7+zSxNtjEr2bTZWJMipGwHLUrUAGgfFaoAFA+GeKwlX40XryW4TER
kd1ut6/rukxAuJhOlpM8v5gldkJ5htghXrwDYejwF984NgoymINjT5245iShviwAQhJL7uKPurUxGX5S0OzqAs//9hd0voMxBlme
4bv//h/c39yiaVuwMMhaGJsgzfNYVy+MwAFJv0MWhmR9rX8IsBBYIlhjYG0iMIQwjAWWY2UdW4IYCzaWhCxsmiBPA+bWYDUhXM4E
l4uAiwVjOWPMJ4J5xsgMkFAMRUhgSKBYht9FT33TCsoG2FaC+4qw3hNudsBNJdjUgn0jQMuxZXEbSHJCkgNJElfuHAQsRqTv2mf7
tsVEBEos+sbKh5W+jBoDRQPMCCH2TyACbFEgWS6RPH+B7OtvhF59hXD1DGE6hbMpWu8pOA/2LrYi7oXFYagSy2G2kQQhkMQKgGHu
Ql/WOMxfEBJiLyaQIeMcms6hKDJIkuDdzl3Yzb5y3N3B0A3SXLIsSxZ5thr/zY7CVVoVoHxWqABQPgnGdlriim7oMSccAu92u/33
9/c3QqbMJ9Mkm0/niyybTJMEezLYgsmxiCfi2Pw1ZvkRHVPf5JELiwzLf6I+KyAOmxFhYTACAiwYIBQFzZ5f4xV7kDWwiZUgDOcc
3N09OAQwD65sgrUWEIJNLAzFRjuxSo7i3L8+P4BAMIaEhjJzEQiH2BhoqFxkBpmA1BjY1FDKFrM0wfXM4NWK8OrS4NUl4fmFw8WM
sZwwpmlATgwjAsMC8Qz2BHaAd4KuI7gO2NfAuiK82xFeb4F/3hss1gav1xY3W4PtnsBe4iq/A0gCmYRAxogREoEdfOC94TcgSvoR
BaOVuQAymgfAIX5G6l30Js2QLFfIXr5E8upr2D99A766hptM4cjC9yGX4B2JD0ePwmGkcn9S42L/2IcoMMjG8k8yIrEhdBQDIqAg
bMV4cp1DXZVIieE5oAt+0bXNV13XIU22t/PpbP1sMVuOBMBBnH6U/ykU5SOjAkD5lGAAtl/9x/5vRKid2232+5vK802SWT/LktUi
z4tlmh6ixx0LdRjW+McEgHF0+GD0R5cDNIzjHV4scYJfBwQTIGRAlpAt5lj2R+dDQNXUqKsagQOqXSwP9M7BJQ5EBklqkWQp0jSB
MQnIEIy1gDWIC9i4sd7fET0EzHHfnhG8RwgBwh6GAmYpYWII89zgep7g1UWCb65TvLpq8fKixfWixUXRYZ45TC2QiUTXfBBIEIgX
iIv9ebwTdI5QtYRNDdyWwMst4eqecHVHuLgV/HAreHMn2O5j757AAnaEwP1CngSUyKEHAJGJXQX7EMZBABABHPMQuD+/h8x8IkiW
wk5nSK6uYF+8gn31FeT6GfxsAWeT2N43CELXxaZG3B9A/92dh4s+zMgnJDE+wSIUuk7a3Q6NBBZDlBqb+DS/Mgy+dNy+qerdtizL
V4t5sLbvVqQonzEqAJRPhdhNbpRcFR8FO8F9S+ZdZ21r8mJms2xl03QCAB6QoeSPAWIIWYyj/jHb/bHV/7EwjmKznZgqd3gu1uHH
uD2TgUkskjRFulrKlIDrEFA3LVzbgazF3fevqS5L+M6jpQZkLNIiQz6ZIC/yWCVAFI1jTKQTGnz8Q9nawQkQ0HUebd2hbTuIa5Fl
govc4MXC4tVFhldXll5dW7y8THC9zHE5b7DME8ytRWGt2OjiALz0QX+MByQAToidoHWExYSwmgmuLiDPL4FvrgXfXRn890rw3wuL
728NbtaETWnQdgaBCWQMkgTIUgs7hARge7E0NBA6uuiFBRwCyPsYc2eBIQMUOVBMYC4uYZ6/BF68Al+/BC9W8GkRm/z4AAl9hYCM
/kTGfzEPFuJyenM0yfAw0RC9p0AEHIKEtuPGgjlNEzOZoHg5QbNeX2zErdeed3e7XbmdTnbz+XyWJEnS/+GetKgeh7IU5VNGBYDy
SXBw3oqY8Y9n4FA7kfuQZQ2MWSXz2XOTZUsH5CWiAGiGn/9YMgh+8PtLI6MvZ9fxdvQI9NN3EY3b0RiLBASwIYgFyFjY+VzmL17g
RechQZClObIkw7tvv8N+tyPvHLz3IENI8gxpUcSe9AQYY2CMFWNtHxYgGEi/YkZftsdoa4cKNQwLAIdFCnxzAfzvVxZ//8rgq+cp
nl9nWC1ymhYORZIhQ4LMWyDYaPgPHZRPLvHkWCEDYEKANYJpBqxY8HxG+NuVkTfXwJ8vLV6sEvyfeYL/Kiy+u7W42ybwIY4UNhmQ
FQZpQhAYsETPxmH4z2D8KfZiDMOqn2P2BdIUdlKAVheg62egl6/A188RFkuENIcTxByBzh0HFw2VA32735iJeOYFEOBQEDr8hQ1P
xe80vujwntiDwHeNtID4AiZfLEGzOWyWJl21n27YJa93++oi+JtXr17xfD6fJWmaxJJAOlQEqABQPhdUACifDEP23/ixunP72oe9
JGmeJ+nXWVG8MIklD6DpK8DbftSrideH/u+HlfyI93oCetf08P7olo+JY32meZyLQwQkCcRYJIsFVq9egYRgicCB4Z2H9wGda2Nn
wMCH4T0wh2Q/WGthrIExBtYaJIZgDB3c6BCGQQf4gIRbZBnh+Yzwj1cW/++/WPzLN4SvnxusVkCee5DxIM5i+R4T2BHEB5BnwDGk
v6YggAfM0BW4b46UGEFmgZlhXE8BMOPFHLiaMeYzwXQCpBkBFmAy2NUJYFKYzMBmBkkazxkPURQiyEF4ERgUz0N/rkli2IAmE9DF
CvTsOfD8JeTZc4TlCiHNEARx5oGPpYVxuwaxrnE8XfCY+PfAKT/8ARxmF5x6AE6KTAMLi0gnLYwhdCwIaQrM5wiQbFvvix+aele0
7Z0xxlhr7TJNF5YoG+2u1xcqApRPHxUAyh/G++qnmZmdc65xrt3UzX0F45ClV9M0efZVmhAB2CEKgA4sfeMewqi079zAP7r/917o
wQuFBYwQDSsDMBZJlmFyeQnb+y98F9C1LdgHbNf3fRzfo21aGGORE8FmcRpgktjeE2CQphZpEm+zEALHBDkig0kKLOeCVQL8+crg
f/8pw9//lNCfv0rw/MoCEwFMB3gHOANQgCCelcApKDggWEgwQKDYBCnGSnq1NPREQDSiQ2TbABcpkCQMsp6MIcASQAmEWN5ugaoz
gEkAk0CMiQP4iGD6b4Ol74rI/Yp/mCAIxPBAb1zp6hr04iX42Qvw6go+y6Pxdx7sfOxmGPraDvOIpHsYODr9kuMf20gADCWB478O
6aceEgSeQuLFh8Aewp7I1lme3bT1POtCK6GrZgt3dxG4uDBmdbI7kYPbRSsClE8dFQDKH8Lws93/bhMQf5YNIC4Etymr3V1db6qu
W0uWmUmWzFaTiZ0D6OJr0YZAHR3WcuNtH1fzvWV4zNADOCSl8dhRTkOIoE8pNNRnFfRxbAlgC6IkQ1pkSC8vsODYUMd7B8Aif/09
dpsNnHdo6hogErIGWZr2824MGRGyiDY3JQOyVjoPeB89CXAdplmH57nHNyvG315Y/OVVSn/6qsDFVQZMQUiCwJHEOH90/ZMkAEyM
rw/Ndwav+WCZortFoq0f2anhxPUtlOaZ0NcXjNR4WCNkQEIEZLnBzS6VqjOAWAS2gKU4XsDGFXlggg+x/8Ewzjhu24JsCkynwOoS
uH4ejf/lM4RiggAD7zzYe5LAoKGrIfV6Rcbf4vDXQ+9RezJ80Y97AIbyQI7hBOZgyCTCPqBrOql2lSAhgfMFGXvZkSEndHcZUL5i
3r4UeWmI7GF3RGABWzX+ymeACgDlD0OOLoAhGmsBoPG+vWua9V1Z3nUhNAWZyYxDkYpAiNCP74UDKIgQ6HEDf1zbycjgH5XHez0A
cpzANxyfMfaQvR5CIGGmYCxMakFFhuxiiYV/heA9YC3SSQb77bdY393DdS26skZirPgkhSQZmAKRAGyIRJL+dADBB3Stg29r5Cix
LGr8+crhf70C/vYqwcvnBS4uJpTm/eyBtgO6VtAK2DNMiBMEh8T4oetvvB/PgjEkB5UE4GBEh17Kvn846ggscqZ8JTAmuvCJIDY1
SGyCt9sMZQMENtErYgCTCPooBowAjNgbQJghZIDMgvICWK0gV8/AV8/Ay0uEyRSBLLxz4K6N2f5CEEN0Uu7HAphxfL//QodF/eN/
bPEyDERiiQcnx9vROWEgHEtCurJGSQDnmThCyia5qG0+C4LkFcx3f+3c9uum3S0nxcV4V9oNQPlcUAGg/GEYM+rbHtecBgBCCJ1n
3nciNQyllmieWZsSxLcgNMymM4aGxepjYd+jB+BoE/jsdYxzoXB8L8uoVHDcWlYQh/wwwRsHIcTs/jxHfnWBi0PLW0IIAd557O5j
y1rXtmjrGP9POUGaWCQmB1uGDxYsDNd5+KYG3B55VuGiaPHVVcCfX1p8/SrHajVBmhcAJQguAJ0DWkHoODbTkdhRD/2IXeJ+1C4f
PzCP6yAHz7cACLFLYHDx8YIBJIDNgUkueGVC9L5YiiOMOUPrPVqXofYU/TcAyMghT+8Qc+ChX7+NkwdXS+DyGXD9DLy8QMgn8DCx
N4BzMekveIBsDDOcl/oNGf90+OeXMRYFiGIjNo9guKZBJ8LiOoRJkaTzeWYukuxuv3nxWuj++31VfmXtXUrI0yRJrbXWEBl+nwhR
lE8MFQDKH8mQLGVPHmVurLVlXhQ2seZiVRSrPE0nDiDD7FqB9cyW48+2Qf/z/fjq/9TQn9g+ObGDx9fFToCxbB3oPQHRyxA4Dhdi
ZuIQIJ4EVpCYBDSdISfCimLs23UdfNuBmNGUJcQz2qYByKDwKVDkArIESsASIERwbQfjS+S0x0Ve48XC4/mFpRfXKVYXBdJpBsAI
OgF3sUMffCAJHhAviFFrUPC90Q2AhEMG/dh7LqOTQjFuDRkaI2GwixTLIxJgNhF6aRlsHDkxKNtONpXHvglwfYKfnBjp2I/HRL89
kaE48XA5B10/B569AF88A0/n8GRizD94SNfX+Q+hiId/NY8/9gHDKyx0+LCWTkMCJMdtMpOAQEzCXQsnAYwMyDL4LAOyHE3o5m+9
W/7XerNfNdW70NS4nM2WFxerZZam2Xi/3E8iMqTzg5VPDxUAyh/CYCZMdN8fEqaYmTnwrsgyt8qzqzxJXi6SZCJJklXGmA6QLrCw
MULMoL72/zzOj8PtY20/y7ERzSHrX0bGXwbPeOxgz8IIIhCChP690Z1uYGMbfDjvY+OeBLBZAjudIhVg4X1MCOwcrACbm3eoyj2c
8xBUgORiSIhMIgyPzhsRDiBfoUCFy2yHr+YtXiyInl3ktFwmkk5SwBqg43hxLYgbGGrImAbCHUQ6kDgBO0AcIFEIDLOQaax4jjGP
+JVItI0miY9TXwnJnmCMACnJYg6YhOHF477s6N2mxbrMpA0pnDAAC+b4dfDgRgFgjBEylmg6Ay0vQc/6uP9siWBNzPZ3LlYrSJ/w
N7j9IdGjYYeU/f6xg9YY9QQ4QU7zBgbvzCEGJL0oGp5DHB1MiJ0XGQggCsYT+RBPuTVAMcH9pln8V7mfZttQdlX19u/Pn/l8WqRZ
mqZE8VxKTAnsG0xrUqDy6aECQPndOMv6P1zGP4zvbu9uvTHbJEntYlpcTa29nhmDHUCtxDpyD0iIK87DW9+3+n9s5X+4yEPvwCAU
OB6qAADzWYlgb39EYpmfFyAERkJAkibApIiJgU2MY1Pvcw8+oKpKdE0LAiNNjMB2ACe9W94jR4MirXA9qfBy0eHFMsFqliLP+4Y1
IQhckNA5iG9AUhOhAVELoRYiLcBdvIQ4Phihz6IPcnIC6OyExez80++MhYQDkAcAIpSmwMoyvXIeX185eXnZ4s0mQ+US7FxMGvAh
rrC5Hz9I1sBQSiYrIIsF5OISsroCLxYIaY7gHLhpwV137PB3iPkPXyYD4ZjQeEj6G77p93bjpZOrk78KObvEP9LDbREQB2/EGXKd
Q9s0aCwBzLInKl77sEqa2hvmZjGd7l50brWaYWUEyTAt+PA3/56jU5Q/EhUAyu/Jucv/MK63Y64a53f3bfcGSdJkWbqYWXtxZcyh
7K8VkT48/aC9y2AORITO+wD8lMvDMIEMRqyvEJDT/gJ9C3hhpkEgBG/hCbAwMJMJimfXMV8geLiuQ1PWaNsarnEIHcO7BGRSeGfg
vYEVjyyrMclrXE9rvFg6PF9kWBQZEnJAcHHynuvArgOHBoQKghokNcD9JTT9ZWT8WQ7tEk/iHhg+9DAqDyATowAs/dskOhwS6WcX
pMBiwni28Hi+6vBs1WHXZvAVo+7HCouPvRUtcRQARQ4zmYMvLoHlCjydIiQpgkh0+3sHuK7/Mil6OvpvN/bv779klsN8oZMV/1gA
nFjbcf7G4DX4qQJASIIhMUyhc+LbNnSJZRK2NsnydTG7SELgmeDmz4Hr1sUPMB4/KYD2A1A+WVQAKL8b/U9rP5LthFA7v76r67f3
zm0MIVkwX85ikzowjt1rvYgRRAUxJH0TKLrogTgDSGKc/mjgj6V+h+S+w+3e7U90uC3988O+jyGC6B0AkQQWireNgJgEcTaAF4Ex
Fpk1sIs5ChH44FFVFU3Xa9S7LaRpQT4muznjpGOCa4VScjCmwjRtcDlr8WzhcTVlzBILwwngOHb4cx3ALhp51CJSQ7gGcS0UGoiv
gdDG3gA+RAvuBRJwIgIOVikIjRfK0chGEUAmnk8yJIaOIiFPBctpwPOlw6uLFtsmRx0CmgC0HuCOYRBAKcMWGcx8DrO6Bl1cQ+ZL
hCSFCwE+eHDrIGFQJUMHxn5wz1C3KALAgIyIPGjUgKMBP/5RxH/6x3vtNrj86RD7HwuBYTuH5AiKlQEiYO+kqyquSdgDqSmyLLm8
XGzSxNyFrt0k6f3e+TKEMMwJOPQE6AdbKconhwoA5XejH7f3wFcbmJvKufv7pt1WQJKIXBeBLwOz3RuDAKDBwRAbQIhjv7zhJ/7o
DI4zfU+M/4dK/k7d/uPH5PQ1g1iQGNuOLyXErsEGgQjBBwTxgDEIWY4iS2FWS6TeYbLdYPr2HdU3N+CqBIcGoe3gQ4XGdwgOsIlD
Mq0xzxtczhyuZh2WhUNOEHRMcA0MWwQXiNgJcQtIA0gjCDUk1ICrAd8Arh+aEzi2BB7K+85X//3JIsho3drnAVK8GdsU98+OSikm
OeNy4fDyyuG2crhrAta1wHsgOEaCgCQRUJYB8wVwcQmsLsGTaQzlNC28i6OAY9zfHkL0h/p86ePyvSM9Gm/0EnKsA8ZC4fzvDkKH
0gQcRcA4dHBY9fPg4un/0vrXeZauagTMcFlK2Wxui2lRNFme7Ntqd5fYzU3T7p7f3a2fP39+3e85NnY880lol0DlU0EFgPK7Qmc3
RUTKpqmrti0770GJvUxN8iIhmntm3jGLA6gxpi/UghnKwcYe7Mcujz33WC6APHL7Q68f5w6MS9M4hJgUCAMmA2QZ0jyDzOdIVitM
Li8wXS7h93u0lYs1/65B60wcWZsH5GgwS1ssihaLokORCAx7SNNCJIOIPWT2G3Z9rH9w+1eAawHfr/5Dv/o/W/k/EAAf+r6GHgLD
GjYcwwJpKljOAq4WDhcLh+kmwBAjBIJ3cXyxwACpBaYTyGwOns7ASRqnHDZtdP2P20GdlVwev8XxbXr4uOBQyveAwx/AaD/nLxie
G9oLEAGwMeYBAD6AmwYdBwRmcQLiyYxClqVlaeY3rs2/rZp61nWvk6Kg5Wy2tMYkCZCO98QsPA4RKMofiQoA5XdllK9NIiJN0zSb
/X7XBm4TQ/kqKa6niV3NJoUVIqmFQweCZzbx1zhQLMo7xuPZ9InuAJhGbv5HLu8TC+eegt7QU583J4fKAQEYhNCHGUB0qCqQwJDA
YIrJik4AtgDSNJYILpeYXqzQbjZwXU1tXaFpOzSdwIrAJCwZtZilDWZZjVnaILUMSCLUpfAhAUCg4dMERyRe4BtC6EDcirgO8L6f
nMdHAfDYSRg4rKgHUTP+soQwrLohxEIiQiAjyLMoAC4WAaupR5F6GAoiYhBY4o+LIcAm4CwDZwVCmiKQAQcGe3+M+1sL0Ci4PxIA
gnD8sxlW+aNowfHAj18gDS0mBCBrhGJK/iiDc7QfSB8xGkSAAIb6rI8eZohjYhGwMWidR8uMLEmxI5p969wqK/fvxOLOLhbylyTh
q8nk2fhvX0SEIRzHP6kIUP54VAAoH40hAxroM/9FhgoACSGEtm3bu7u7zcb7jdgkzIrJtJgUy6sss5wm2ABUc0DXD+KJjv/T1T+j
r3CjwZWPwWn7sOvfkNSH6M7n2Lb1EPM/5ANI3OZg+D1zDI3H/SEIE/eVZSwxFyD04mAobmABuhBAsIAAnKawswny5QL5fIZ6t4Fz
npqyQdcGFKmIDUBODhNbY5JUKGwNQywIBugsxFkQkdDQso89SDyR90DwkNARXIhlC33c/9Dd78zFMbY+RCQnnvO+U+BQqxF1ThQ8
RNF7bQyQ53FI0HQaMJ2wFFmAIRbiIaGAYuOfJAGbBMEYeKJYjCASM/4DR5EwirsPxllCv3fqD2ZY4Q+dCoZwxCAEhnyB4Q/DUnT7
i0CEKTYqGvZxvCYMrXsIZPoxhQRAhknBTH02AkkACYu0dUPVbg+bp/CdL7hpX7RlLc7Ibbbe3hdFniwnk2UCHPsCxPjGufxSlD8M
FQDKx2b4saM++98AgHOuXa83u9dNe+uZd7OJTWZ5Op1PimxhLUpEu9Uijvztt0MGj7nu5VjRRu9f/T904x/b/Z7kAAwehN64M44N
gQZb6vuGOUfPwLFtMPpGQOw9ODDgPQwRKMuRzmdIZzNQkiF4hmtb+DZOukthkBmH3LbIqUEqdT/vkABvRZyBiICIQWBQX99PwVOM
9QcRz0ej70cn6Ty2cf4FGToavjEsx4zL4Yrit5gYIM+iJyDLGIkNMPAHI0zGgJIEsBbc53IEjmJJmPtQxplK+zHb+L5sfxmLiEde
e5IfMPYA9JsyJIeGQONEQGEMHQ6ZKdYghgBXVVInRpCnpgCbzofLlimxYFyU9duX+3L31WxWribFSWOguEdd/CufBioAlI/GIenv
NDFrSNJzjujeAWtvrdg0nRdZNs2stSaaPXRxzt3B2ztOpR6778/vn7jx8Z6YvgDcD/brjXtc1QNn4uKYBBikDzFAMLx2WPkPXunD
fljgXIBHdMUn/SRAUxQwRRGNIgtC10G6DpQCFhapcUipQ4IWVto+jg+gM5DORFc0xQG7Q3e/KBIklkocDzK+DziulD8U+z/ItPMv
8T2vp967nwJpGgcAGWIQAiD9z4oxoL6mX4w5hkoEkOGkvc/wv6+u/0QAnB3cyXbosNgHAGEmMvZo8Q/Jf2eff7h9EAgy3mdcwgeB
bxvp9hRsyAOyJLWLFf3/2fvPbtmNJEsU3OYCCHHEvSSTmSVavDX//8/MrNWrp+f1q6qU5FVHRQQAdzez+eDugCNOHJKZlZVdZIaR
uKEgHThu27ap0bq7T+MxfJ/4+fvDcfzcPT51uN90XdfVzID1pazqYlzlKn9zuQKAq/xHi1ya4AQ4oPOPhjdirHnfbbbvyNpbRs75
HwCtseFCRKSZWc6+f32l1C8pfcFC96/i4LTQ+9IwAKDcsbbdfq4DUPL8q/tAM8OeAUBVanVfWoLkBEkEEYBRBZGB63ulzSaXwzW2
nHAuvk9CSiowSLAaYTTCcMgUeQQQCYi5G2E2IhUkqkYBicXqT+UiK81/ZvFrqxurcpzZ+pYB0PX9IuS6B61PvAQGmtwDCFRAiTKT
ggFyCmMA12WEYO3smNfWyp6peBQnywLzyEA1p3vM56baZCvUCxKg1BtGrbenUIJw3sjk8BEVyemhZs41ACk01z2oA5JrO0Apt6YS
AYFqBkHJhGBIgEaCqjKJvcX2bg+3v8H48PH2Iab9d8dh+KPKo+fYvXv37m673W6sc02kRXFlXUHAVf4PyhUAXOU/VOaY7ib1SVU1
iDyp78bemPed7/7Lpu86tbY/IVP+I4CIXOqXCEa0VqZdK/+qUNbfNX7+oqBnxa+LYgd0ZidEF315rvx1pv51tY/qLmBUxb+UGmZR
MCTrYwWcsSreq/oO1PWAd7AENaqkmq18ZQMVhtYa/rLk8FcQQAxU5aWSjw8mXfn6+bXyR93sEs2fB4BgztYhZNdAoV8WFaULTKjF
kVQoseSyyKWJAjmnxrvZDTAXUtKm/C5wBgYaEKAlhU+M5mh8U7r2zakC7fkv3NJ8uTXeXrFyEbRMgdbjV+WvNAMEFUBIiUoDCJgc
SyAETaoVb5ktIxoL2fZI4dYdhtPuw/js/u1hfKHhZFUVxhjaOrcxtBS/0iJX5X+V/1NyBQBX+VuIISISVUnM6eVweDmBnpO1dtP3
X+92u3e3AAKAo4hGoxwAw5m6JmNoVuIAXgGAPyuFr1mqLjh3FbwVMzBX0j1jAKqSb7evAECKghEAYgzUZmVIxmS9KgxmhjCBGUis
YFYIlwM2UfwUkYv5VDk/ScbrATln0lvlDlwGAz8kZ9sLABHKDQdLK+Js1BsY62C8h3Eecy+cGvj3FsXfiipW1v7ctKehMlZxAFgC
BF+dtF54RQMA6npn+6tAAGZ9Liz5nhsgTlFjjBo3vRrvMXC3+Tja7WYcDk7laf9ycPf393sD2NZtoQWjXOUq/6fkCgCu8tcWFVU1
r6uf6TGE08s4PT8dTg+TtYPfbPbbrrv/GkCPDAACoEGg0eQGPEDm5qvRl6d/AkOLkZtn6XXhntrop/ibGwagfs7KW6lWEMwF37RR
+Iolur/S+q9dAJUR0LJu3gchiZT1qTbJVVgLdB1M52CchTWA0awQ0wSaAhCCYIqqKWUgYGswX1CiUN4vClBXyr4FAC1CAhblVe+K
Yo6eJwLmUsDIAXGzPjxfChugVECREGIEhaBIScAsKgqQIRjvYb2HcTa3flbN6X+SmYKVRb7ytReoV6P2K0OvlY4XqBDNOfr1ggSl
bDDNwZiZ+kdeV8sAvAoWlBw3QSb7BJgL618OrOWctGxb+lAoEmkkSilonGIaugmSxD2R3flu+07HCb3S4VdkXv5RdQRw3/5ByBvu
satc5W8lVwBwlb+qaHZqVh53djWzIr5M4fnDy/Hj0+n0LM6bO2vvbnXb1UopxY1NQcRI8Srn5MGVVZ8j/vPsnI2xYs9nGp7eDvrT
mscPiAhlv3b9rLRS/qixAzpb/2sGoAQMqq72nc+nbAeU7HOCEEGdBfUdTNfDdR7OmuxmTkyJDKZJMYyK46A0BmiM2XWOpIQEUFIg
KdX+xyrVSCZdXey58ke+CVnRY1HkVf+KkrGLb121xAQ0u6BW+ZusLxODQiRMAZgmRZhEU8qAyTiTAUDXwXgPtACAGSolRaE+IPMd
LEclggoTWaszE9BcDxEyEJi7M2XgQmR1Zgba/UoJNKj5IqYFAHXnAiiBbKkaKFLGaab/URJOCEQQyXCKQ9Lh+RngpAFqyPud6bcY
+3G7NfSHfzbu9MLy8i3w6/bvpDzGryoFXuUqfyu5AoCr/LWlVT1zwZOY0jiE+PIyTS+nJGKN3BnRGwvFVFaeUNnuPL1f2ulb9D/m
z3qm9M+XlZVPZ59Xr9xu026rbQxACwB07rmTrf9ME5MxUGNyn92ug+07uM7COQNH+aKjCJ0Gg8NJcZpIx0CITNjMLgAlwwTludfs
Mhg/NEBVqgJvB5SWn+bXc4u/FQOg1usxQIqEIRgcB4PjiTCOihQFKqUDoHcwXQdyGQDk8gSpAIAfYgDa82wYgPk8i5mv7fcNJVPP
tdkHGSo9BOj1sWaYWkFAM2i1qAQKS1DSH5RMLoYAQFLScDyqxqjWW9j7+871Wz9u490H0vE7mNOHYXz6+vHx6d27d/dADvoztC4I
dI0HuMrfWq4A4Cp/VanB0s1kRgAQQmARGYgo2c7f7r1/v7VmR0QURGKC0gQyXOK9tQnp+ilLu+6sA/UHtlHM2XLVlTADCsU6Y6Bd
sAYAFQRUnbJkGShEMzRRpRwA5x2o70CbHq7r4L2FNVnJxASME+E0EoaRME2EEAnwdaetAUvVql1c3ueDcA4AcOHzxRuIVwCgzR6A
K4sCgQnH0eDpaPByMnoaFDFIrlVgCNR7UJfzBJUyABDmXKWw0hfzuf0AAJghXuu/ULwCAJcu8uymU4lHnY9FJTugsgaGQDOJVQFA
c9zmmLOuTgksAo0Rput0ursn3u8Jm44enh/f/THEj799jsfbMH0vxvJ+s9n1nd+Ys6ZYmhmja0bAVf5mcgUAV/krS3b+K60Ls4/T
NJDIsNv0rnPmV+/J3u/6bqvW2MmAg0ADchW/6vBfpvS8q1ZJF/23Cg7UVkmjGs5rKz4b1FoUNGldn3NWXbOdni2YYwf0TPlXAFGz
BOaywqpgEVIQvCFV44G+A2238Dc79bsN+a6DMRYSFVMgnAbgMAAvJ8JxINw6oIuZjW6RjSppLWKwmJBYChtc0KU/qFWIchul1tdf
jeUaH0HIDIAhSAKGYPBwMPj0ZPXLk9HjCUhJlUhhvVfqPLTroa4DGwNOsgAAySda2Qz9QQBQZfYsIavpWqIYM0uQywZT8emXiyEq
DYXy00O5MDAURNlBQwvfVHz8NYaAjClPGhW3CAFioCQlrsAAotAkJCxIZBCYMSngvccT683vp/H+JgwfXO8/BlD8p/fvv/nG3ztD
MDNGVYWKCIy5lgm+yt9MrgDgKn9teUUeD8MwDNP0aJwL95v+ljb9118T9TDGPltLg4hGEEcYVQiVCqxLeV8ACwxYPLbtIbMVTkuq
HtZg4DyiXxqbs7H8KWFhABYXwAUGoIKRygaU3ytAEFWwMAkLyBhEApwxsL5T7Law+x38fg+/28D5DhoiYgSOg+LpRfHwTHg4WNza
HPJoVLN1KqhBbovte4kGaQeIlp/aOzTrR1tS/WzO6ReHtW16FgAIAyQhHEaDT09ePzw4/fRk9XAkMKtaC1hvgL6DdD3YeSQiiCRI
YoDT2UnjDQag0u8VS9Y7VS+IVtetXDL1VxxSjg0AFLUj4MIAKKBUBrQeUXVVE6GpBIhSc5oMFGpKHIaQquZnVoVEPMIUMJyOMN4i
Qex34/TOnU4jDfQE4x63fe/vb/e3vXOblQvgTeh2lav8x8gVAFzl3y1n1CUB2bWtgMSUxg+fP384KB5672m/3dz4vt/fAxiQg9pP
CsTZhkapIKh13xeX89S9S9//4FIs9XO//xlIeBtEnB3v/FznL+p6RGBrAechmw3Mbgd/e4tut4ffHGGGhBQZx2PC50fBhy8Gn+4d
3nnNNfcNZ3cAERCBlLKhWuvftMf7QWms+1ahV4UndLYu8u+2AAQ4AEbBTDgMBp+eLL7/4vHpgXA8AcwC6xW2M6AuNwFi2+W0SBEo
p1LnEXhl5za0/Kz4V/75s6CF1QVfAA/tb+c3ZXW3ztd9A5jU9zN4WH7LQYaAMiMNg04vVm3vVJnxTPbme3Jf9Snx/Ti+/MMwHv9p
muLGud3qDK/M/1X+xnIFAFf5d4m2RnpWEbMwMByYPzwrvj+IjrfQuxtj7/fL74jI6X9RtUREUVZIsuy4VbT5fdO5T0tTH7RT+oVC
QFot88WaPwcArLQo/bNlnvvRvJ69L+WFGx2h8wCxggIZtdYS+Q56ewd3f0/9u3fU3byQPY6IIeBwSvjwoPjtR4tvbzvcbwi3VrDb
iMIiF+ZhQJhUUo1sx9Irp5U2us/8tKXawlq3y3ESxEZhrVJuFEQ6BcLjweLDQ6d//Ozx6YlwHBgKQucAtzEwvYd0PZJz4JAgIkAs
/oxSnW/V/vfiA3bh+5VCLidZTjw7KgiEWva3/n7WOrDySCrLOmXAlAsHRQZEqrNLoB1UUx4M1N+ISmyGSggaTwOP0kMJjjbbbWfc
+w/TQT6RGZ5iGodhGO/2+3s0Z1SDCq9ylb+VXAHAVf69UvSwKmX3/2zGBJbnl5Q+Ho2dRuidJ/ObaMwdAxgBnJABQG5tk6dRhYKE
ZkU+HwA/YOGrFr88LcoeWILyANRywILqq3+dObdkENT96LL+6nddb1MO1h6zCpXvWAEVJWusun4Durml7v3X1H/zDW0/P2NzOCHx
CcOY8PFB8dutxfsbg/d7wldb1vs+kS3BdwKARUmKu7u0qFnY8nrgxoJ/tdg33te4t6I7VZVyycJCr3Pu4Pv4QvjwxeBPnx0+PHg8
HAhTJHS9ge8t3NYBvQe7DslYsCYoS+ltIHnmaU+c6kHbJwgXAABhLszTBgFWP31NiTSSqX8FSIof3xZL3Zp8XZD8W+s2MAZKTdtg
lpwWWM9ljvZUaA0rAJCTKBUQgUxBI6CiTLzdGn9zi0l1/3K08kj6+UHk8OV4eLnb7++22+0W+RmU5laWw+W9X4MCr/IfJVcAcJW/
hmiZo1aT1ymEp0OIQ7RuD6f/BGu/YcAckKfKAgBWzV6BasG/rvf/Y1T8Uib4MgOwvDbb6VmwIBp3gP7AcXXZ/vwc6+c5shwo+e8C
ESFYB7+/I/PNr2jz6yfsvjxh+/SA6QSEgfHwKPhDZ3F34/DNDfCrm4Cvt1bvveRquBbwBkhmDlyvA7fIeUCfbV4tXiv+1hVQyv6S
y6/GCdku75wn4PGF9E9fLL776PD9R4MvjwbHgQjq1XQedtfDbDuId2AyiAKw5ADAuXGRUGYB5nNuaff2yToHAFXpS4NUXq9HgJK0
fYMbwLCKNyjAwdgmPuD8eC3jUD8XlY1yHTWbXwTKUdMkmiAE34O7HrLZmBPJ/pl59z2Hwx9eDg8b0f43v/nNN33f99YY2zo4rmWC
r/K3kCsAuMpfVVRVU0rpNI7Dc0zHKIKuc+83ZH719bt7YwEMIszG8AiYVPRXBgGkbUU/YG39/0VLa7ThQuzAGVvwY/v7qecEAK1P
V0QgMWadbB3czR3sN79G93LE7ssD9p++w/jZILwwjkHwvTPY7w2+unX49Z3H19sIbxk7J4BXuE7JQbM7XTKrriA9Z6pfpfVdWrCs
qzMAULIeQA8Ypznwj4HHg8FvP1r87z94/MsfDD5+UhwPAmYL7zu43Qb29gbYbMDOIYpiSoKYzqr/1VHSs3OYv5wfqNX5LQCguYFz
dT/UfkNndEh5X/sFXAo4PPf7X/rtYgzAhW1LgIYQIYWokRnBGKKudw8h3PxuOD1t43i0LB+6+3fm277/lQdetQ1W1NZGV7nKf4xc
AcBV/mx5g5pUEZEYYzwej6dPp9PDoBjE+26/292+v7kxe2Ta/6BKEZAgQgqjgIGBQEqZtdairq9zXn79/iwlT1SrC/aVUn/NBiwu
AD5nC+r6s1uh2V+76Nnr/H05r1qKtq6TGMySU+iMhe5vYL75Vv04YfvwBbcf/oDxw3cYng4YTlEfjgZ/eLC4/UD4Zt/hXZ/gTcKv
95F2NuXayQawAchNAwkiICrNe0h0KV9fT+VsmdWwLh/IAAol5wjoFNgA8AAS6eFE+P1Dp//ztx3+P/+Pw//9O4sPnwTTwCDjYLcd
2Zsb0P4GstloMgZjYkxgpFhiAFrFX+7Z2uI+kzawoVHqCtA6C0BLdH7ZDEbJ5OdUtVxtG1BY9qU15HAGEEvaH2DK5xYAlOAUlfWg
Glldh0Q2ahLFEDAOI5zzUAU+Jr4zUYZpCF9A5mU7jObm5mZ735mv2stWQNA8Q1e5yn+EXAHAVf5sUdXaaK0Sn0YBERE+Ho+n75+e
H55C+Axr0953+71z/Z0hOGQAMBEociIGaol2qppqVZCnXX7AQl9AwQUrX8/o/fN9avtem/0uPv3ZyFsZfIuhqavtLjMAEM4bGgPt
e2C7U1gLmwI2Tw/Yf/8HjB8+YHgZEfiIIMDnI+H3nwjveotb6+FAoK8F/3wjcJYJPh+MUrkvlQGofgFTQEDr629dAE30/xIEWHz+
VnMcXQn6i4H0w5PF/+8PHf7f/9Ljf/yLw+++A56ecwMgvzXwd1vQ/R3x/hbc7TDB6BQjgghSDFCVNQhZ2bi6UqDNw3b+xfq3Sser
LZp+7guc0wKBZv/59+z/b6iHs5gDMkbnJxvlHFGVf3U7MOYiQSqol1bdCAoiiEJjxHQ4qBVRscaIyD4w/uGYZNsn/P6rYXr5hxCe
7zs/A4CZW7gq/6v8B8sVAFzlzxYiqoV+gDzvWSKyIhJOiY8H5oeR+dRb5701u4011hSWOgAmYLHoLzHR54q9Xdrf32ILLlL9Z8tb
+/mhpZUf28/yfbkyVRjhJQvPOcAa2Pt36H79LXb/9b8hPD5hnAQBH3E8HBHGhI+fE/4VCVsBrBggWJhfMX59I8iNBRXGA30xYk1V
7m/5/udUvmYhbdZVwCrUlsJJgZAC8N2Twf/ze4//+a8O/+tfPX73ncGnB8EYFK4j+JsO7n4P3N8j7u+Q/BZBgRADEueOh1B9bdG+
Ff3/pjSK+3w/FZjNrMIlAr2sd84svOUCaEn4GRFWNHhhQdHcxuTTCAHpeJIpsYp3hO3G6WZ7G0LY3ROd/nkYv/vvzy+Pv7Lm1Hdd
b4wxV7//Vf5WcgUAV/mzhXITndL0b5mshJlhzIvx/mCM8bvN5rbvultjrSvZ35IAKyCTVIwhIq4sgjEqwrXHzcUAwB9T9m8BgHOL
n4tyEF06Cq6CB/WHwcOrpTIDdP5bjSdTkCqs5mbwDpnrIGdh9nv4X/0au//+/0KaEoI4JLLAH/6E4fERL48TfjclIBJSMpiiw5QU
x68NvroV3HeCTccgXxnppanPKv3vEgC4xAiURE4S4BiAh8Hiy7PTf/3O4H/+S4f/8b89fvtHg0+fgdNAUDKgTQdzu4Pe3iLd3kG2
t4iuQ4iJYkrgVFL/Ztq8SB24V9lvreI+U9Ttm/NgvibVr6YDok0JnOMP8Bp4NJ9zN8DMb9EMdBcgp1yrAFZWAMsDkF9yJQtVQERl
GjWxiGw7dbsdbW7vgL6zX46Hd38cpy+//fzl8C6GD1/td3c3Nze7vu/7c6B0zQi4yn+EXAHAVf4iqdNfO1WLymCcfd7udwSlb+96
f7vpuptgTMdACoCOZb4kIiNEZAwISsSQRbnrBTeA6krJQ0v3W12i+BULld9uw6qlk1+T0jc3Aspkf636t5wDZvdBNSx1PobOPWdW
eqQACy1WZjVCoYAhgjEEawwsFCQMIQV5D7z/GpYFG3LYmw5JFRIDdDzh9Djg87MiicEoDkOyOgaLl8D4b5HxX+4jfrURdB61SA/N
CmmmG/AaAKzel8p3mQ0gJNJjIP3+2eJ3Xzr9lz91+F+/dfjfv3X4lz85fPhkMIw5CJ42HrjZQ25ugJtbpM0O7DoEMRRZVFIEYsz1
9k2TYlAHFVoU95nS1wvvZ0tcy/PXBAEosmK2mH3zuXswMuScOwoVGr9G/4NW7YMVoNyCseyWJXckBKAqlNMwavXAAjpqWiAKk1ID
LErxCdGIJIAaog4K9h5qb3Cahv3347j7l9PhYTecPvzzzT78RuSr9199bclll4YidwyUfHC6AoCr/DXlCgCu8pPkzAKpHtLVZHSK
6VGIxs12e2ut/cdb3/VKMIMxdACURXSsfViJDBmCgqhMpT8p7e+HGIB24WZpGYBVed+39qlnx9TX+f9vLUAJaGgGiCh7pi1KlzxV
SIxgJiTrgH4D/fpbCBwcA7vpBB4PkDBARDAeBjxNQPpMSCII0eAQoMMExCSI7yy+2Qtu6CyFjc5e2/ftAC5VdAABnibg48Hpbz96
/H//0OF//FuP//t3Hn/6YPDpkXAaKLsvNg50swXu7yA3t+B+AzYWzIrEEWmaSEIAUsyBCMbOivbs4Tp72i5R96sBXrar21YDXYTm
0r3ttaJZt9I2Zx0Dl7fr0sBrl0DBH3Uf564AQXajzN/lzAdRInYWMUSElOAICM6bR9D+34bp1E3TiUSw2++72xT3G2c3bW2EFhJd
5Sp/LbkCgKv8JGkM2lmtEBGxappSGscpHB6G8TN1PXxv391uNruvABwAfAEwMGsAsgolwBCR5LauKwX8Q8u5sn5rux8CD6u5Wn8i
za9Am574owCACvGM2g+Z5pg8ocwgpBiRAIhTiOshfgO5ewf5zT/ADM/YTieIKqjb4uXDF4TDgCFM+O7zCJkY0yg4HQWHI+HxW4/f
vAfuN4ydFzirsFbhXO5ATFaz7i0DoaawJ0AuUQwgJUJKhFMweDhZfP/s8W/fOfyv33v8r987/OGDxZcngyHk1sZm52F3W9DdDfTu
Dmm7hxgLjgkcBZwYGqes/FXX6QjnboDVE1blDRBw6cms689fCTK90Sj8cwCAqqzPz+PsfbvdXLUQ9aFYfm/ByCpyNK+jyiQpgacg
HAInbxHImhff33zwm8lPx6c7luEfWU7CLPPV04zNrjUBrvJXlysAuMqPSiYyMwWp2WAHygQVRIaHYfz4dBoenqfpuCGzv9PN3Q61
b9tc8jcHqy/B1aokKDYSRNYU/NxSF0VpNtb3XJoXleans2j+s/dalK5WVmCeuVGVRNkvrRiAsl0uGYwm9fA12KifiQADgiGCJYLN
YKdsl9MPowgmZkyiCAxEJjBZKFnYm3u4f/5vahTY9nvYd79C/2+/w+FPH2j4/BnTMeL7L4JhZDwfgU8Hg9+/dPqbryy+2jNu+4Sd
Z+x6wXaj6DuF85oDBl1WxAwgKSEyYWLCGEHDZHAcLZ4Gh89Hjw+PHb77bPCHjwbffSI8PBuMgSDGAdseuN0B93vIzR30Zg/pNhBR
pNMJkgTKjLldoaESnVgfgNY0b5QqdAngq4y9NuvQvEbepPrqlx2snlqyc4vA9TEu5R42Sp90+VCrCdYd1AqCM/VfnBEk5amYT1VL
dcBSXAgKUlUOUcJwYgqdUVLfb29uLBnoC+y3vv/+ETiGFMMeqBWzIapCxoD+7IDJq1zlh+UKAK7y45InxHYqnmWM8eVpHL98Gk7H
kVOvzr2/Yd4mAFNZChVvBFCjpeWvgSpMMw3L/G8uDdzEAaiurPU1ACjgQLVY168VeK7zv64DgAwGdNmnEreKXZc2wDhjAF6NQvlY
3b+GCK4shuYKukgqmEQxCmOMgpMIxqgYiRFyE2X01mH37htsXKf9/h7d+2/Q391Sv9vg0Bm8fM+YXhI+HAJeguLTYPH7F09f3zt8
fav4ahf1/Y5xt2Pc7hW7raLvBJ3PrAAAsBICE8ZgcAoGTyPwcjD0eHL4cvB4OPV4ePF4OhBeXhTHQREFML0F+h642QP3N9Db20z9
dz1ECRIiOExAiPmRsQYoDZDWFjM1ih7L9yhPWaG+cw5+81sZbJUlSO+14kcJ3oOStgF8ulLY9aYpg1b1A0yTHlAp+PpVa9WvsgHy
j0SicyyBEuVyAkJzvQBR8DTq+GRyk6Ttxva3m63dbJwobz5tuudPivFxHJ/e3+P9+QN2ZQCu8teWKwC4yk+SOve0vn9V1SmEYYhx
CEkcyL43ZN6RqhtEZAJwBCjlJielyE+Z/QVQyI+m6721XMwS0Ne/tdZ6u37tN9iytVKu9Xz98+/qesBC8VPzailH+1fLnxWIKhhZ
cGLBwIwhlffCGFQRNO+s6zqkbgd538H0O2y2O2w6A+cMbGdBvcHz9x6nxwOepgnHz4wvR4O7R4N3N4r3tx5f3Ti82wvu9oKbXrE5
BwCcAcApGBwng5fR4Olg8HC0eDh4PA0ex5NHiEBize77rYHbeuh2C9lvwTd76G4H7nowWUhKkGmCjgMQQh6crhS3MzZTPLULoNG1
K6B1D1xS6H+uVKX9FpX/ClQ0n8+VPM728yYAqMGFWH+fewRlFKgKDRGMo04pQp1F8J2N294e47T5RHz3p8Tf/fFw+nLjH27e39/d
W2OdKeGT1PzdAVdAcJV/v1wBwFV+kpS5ZjVrhiwDqXLXd/e9t1/flrS/oCog4gkwScTOZc2pKlCdS8JnhU0/mr7XxgCkXGylug10
6e5X3QLn1r/ObMEKODRMwgwgzoISkX8nzccFSgwYEa18/BZUurnQfC5BFEEEowiGxDixYEyMMQkGyYzAJIqoCiFDTBawncL3kL0F
E6EzAuM8ut0eN7d3MLd/VPenj3j59EDh5QVfXiZ6GSIej4THwerD4HB7AvbPgo0T9E7gXSlZD0CEEAUIMfv0T9HqcSQ8DwaHk8Fx
IISguZqh83AbD7rpQPsOutlAthtwv4FYhyRKIhEyRWgIoBhzfWKi4tcp9f+p3kjOrICxxTVQKhW9VfXuFe19rtjfEi38DjA7o94C
APUBMIUfqEGAqpltqKwEmfzEVb88FXoHJhdRYp0Vfea7CFX75x4DquAEhOyOohQRVZG8h7u5xafnh3f/OgyPO0kvDvSH/2pd+Gq/
e987u6UmZLE+quYsDfcqV/lz5QoArvKmtM1IGtIWACAi8vDw8BRYThtnjff+7tZ3d1vn+tR5HIgkqaZAJALUzOh5N68VrTbKuVQE
bK338j5BSZQgyAnaOQUwr/1mtb/zz5p9ufNxQOBSEwD1WNWwA4HzLJ7tLioqgKqfH7Ov35ZebqJAEsUkgmPKFv+pvI4sCCwFGBRw
IlnhEAHMgmEKxIkwGYPBb7D96lv0poPf36N/9412X/9GN+9/i/5ff4unP/yRXr58pikEsAAMh1GdPk4OnRN4EjhS2BqAXwgcVkCY
EMUgqsEUgSkCYRKIqBJxLla074DbPeR2B95tIL0HWws2BsxCkiZIStDIuQY+sDTHAXLnP8Ss+E1R/vPiAEeA1QYENDf8or++4WW0
PJnNS/PwNk+snK1fVybM7YTnZekrkGMMls+AgMgu3QNzR0CCClTNnNxYnmaa4wRUQWRURaAAicKIIYoxYhpHjJ0DieDzlO7+9/H0
jcbpg4o+wnnpO+97Z7fNVUEzuG6dKVe5yl8kVwBwlYtSdSBlpnHV5jellJ6enp4/D+NnsnbsOt/3Nzc39973ngiPRBhFKAGaVMEz
Gbqm6C+l99V0u9Vn/QGFjpznXybGxfIvr4yl9n8bWJiNPqXKHJxT/CsXABG0xC4QqqXfBPmhvma6P2m26g9JcEiMQ0w4pewCCCJg
EaSG0TBFWbIiR4rHhEjA4By8c9j4HW6+6nGzu8PN/VfYvnuH7e0evnewFAAdMTwxhBlTAORkcIoWBAsDyen9lC3RGWlUWAdAyUAJ
qiKl0yDDGQI6C73tIbc7yM0tpO+RrAVr7uwnMYBz+kBum4tcAXdBG8WHnlIGBaYwAmIBcYuSJrcAgJVxf0m9vcEAvPpKl+9eUfTN
Bm0MQk3ha3ameWTqquu+ANmPharoS5zs8l1lIYSQw0tz2iuLWBUlhIDp5QVHSVAipBi3iPorRJHuOH68fzkefn138/LVdvOrOiD1
/ulyNVe5yl8sVwBwlbdkPRM2U3FgPhxC+Hhg/uKtw6bf7Hvvt1tjwIAmAAEoaX+FEaX1Tv86ixalv9Dy/xFLtZstLVY0lSj/6hiR
oviDKkZRnBJn5c+MY8o+/8CSi/xIKWFTt0chqVUhklPoACUwIwKajAf8Bqbv4fdbdNsOnTPYSYCOB3CcYEkxHk5gJUxRs+WtBIIB
kcnlmzORkcGAodklYIyCjGZG3hkYZ0CdB7Yb8H4L3W+h2x5sfS6qxFqs/lzkZ7H8bVbkLQOA8gDUUsAlL36x8jFbydkt0Gz7it0+
22crFzDB6xXOmYTzfZZ/3kwDbLfT9fqv0gD14m+5SqCBqpLEqOk0SFKR0HmC8+7Q9/efCfpH1em/TOHz4+F0HLebse/7fqb7m/oA
V7nKv0euAOAqb0kxkl/5GdMk8uUI+jRal5I1726d+0qN6SOACKCp9U9StSdeW9hvFtuZrfKq1AlJleZ9qqoAKlj8+2j3oUsFwKX6
XxMDUOfk5pzmQHE0MQe6nLcp/n5rqKT5ZauaVZGkKH5WnEQxcPb3H5kxsGAqln9SBYuWGgRLyV4iotzFMPsZsp4ulmRiBACDJ6XO
gbot+O49bf4hwYYId5qwr5F6H77gdBjAiXN4JVlY62BNBhvV4AaqV5xgVKAsuTKhJRjnQJsetN9lf/9uj9T1SAA4JSQR0hihKUJj
pDmwD4VQr6WICFA5M1JrpKUWTqiCAS5xAtUtUOIDFCCyVrU+f6ql0M9ywFdPbF2VmebUw2qXa0n8V4BMbmkFlKZBtsYtuLyj6nGf
+1MCqkRgWZgKY1cgYE4fVMypf6/AAQAlJRIFWJSHUYIqq6ij3Rbbr28wHV/uXsJ0/1n08ePhcPrW4un9+/d3FQRo9kXMzMQ1KPAq
f6lcAcBV3hIlIj23NCLzcWB5CNYl7fBOnP+n5Nw+Au4ZGQCMmJW8EYCgSlUzzPS6aXQAmkVfK/KU6Xeaf88z/erEaie/i4WBqkLH
Eux3HhB4bh+2MlfTrbn9yMpfkJX/IIJTEhxZ8FKi+8eS5x9VIMXXP6eXF7Ah5SJIaxaaIveRMdlrTQBSgsaAECMk9Ui9p8H2ur95
h+23E3XDiE2MSqxQITB/RDqcoMww1sE7gvMGMArloqiIQLZAAGEoJ6gwlBzEWKDfA7tbyHYH8V1O44wJmvK6klJW/BUhZYZByVB+
ZlaGui5pcMCiCLkkYYoAbABOJSaAc9qgtQAIOqfRXbhBVfm2YQLz80oZLEBBxirO2YOKAKn466WABcsg2FyvyuZWwEtlQK3/00qx
E0Alyq88jYDYEh+g0PqQt6UHNQMAQdREqolAfr+H7vdA35nh5XH3yKH703EYb8P0EQDevXt32282PZEhyrW0qIzxtUjQVf4iuQKA
q/ygtJOMiMrzOD6dYjwlY/qu3/ym23TfuM5jAjDmum8YS0sZQ2S4RFCfK9p//5IV6qVWvH/pUiX7zLNvvw0Zs+V9LlyUlfvAikNi
HJPgJTFekmCoFr80iv0H5Pz4VNIIIbmgDmIEWwNOjCg9Ju8pmg56+w7+N/+IPkwwYUI6nTC9PCMMB1AKsCTonIXrHMho3le5H1RT
7JkhksDKORbAGWjnIZtdXojAIUKmkGv6c8pKu4mMXyL4z5T8WzT1rCc172vOGLjgHkBxCwCvXQLtzTnf95ujXKPzLwx83Z7Ozn8G
boqLPXobFmBZv7mO1iXQbp4UEFaGQsggRNYEUvaeps22e5h097vTNPowPnqo6TYb1/d9bw382eG1DMcVBFzlz5IrALjKLG9RiSml
NI7jdIjx+DyFh4GIjfdf7bvu/Tc3OwC55O8ISIRQRKX/1RAVolfn6Xe20lmUpKT/ES3r5BQ6WgX8rSz6+tr8vnIraHUrrOn8S+ut
9lnmZ5MLycBU4xUKAqlqbho0iVAu6CM4cfb3H5PgWKL9p2Lxs2RlQrOCeMOIra+N8jL1djBDuShGRAgZDAKCM+i6Dfbv3usmjHDH
F/jPn+A+fAf3AIgmGAUMqZJRgKQ0tqvGcAUnAilOEqGsiNRYiM1sgEoO+EOKQAyLkkaJeoRm679eii5X1TJIbX39Cw/e8jrfWC4p
g66kDWawQc4txXYa99I8itrsswIHXY1yAQAt0GiQQHP+WO6fFiJrMfJb5T4fPgf6QVEqCJbgQJH6QK0BgUrGI0lIjNOUgkwxirXG
GjLdR+tvHUzQJIe94PE9y+Y96N166FQFEHOhp+JVrvJjcgUAVwGQJ5KSXlQt/mwpAjrGOH05np4+DcOXMfEzdd7vu/7mfrvp7gAM
yD7/CYIIhQiyD1dy9dKSKJVtJFVSykHjNZWvzvmcqVIt9QG0tuvNaX9nYKBR3qtFl0h/qSwBKkugF7dr8/2B0hV3DvJTGCLNfn7B
KIoDqx4S08C5mt+QclrfxIIotdJgOaJkZanl5KRorApIgIXBKB/r3SjWsVFqu9PFSBBBVI/oLcJ2R/H9ezVf/wq4fw+z28E4DwOj
Khk/SNKsQOtgFgAg5URyGWaC1EaCCohIdgtU5Z9S9qtX5U+1VS5h9uOQQa7HiFzFr/rei4W/uAPQZCHo8qqSXQGaKfTFLVDqBthc
zCCn4hFgTY68Xynh5n1lF14BAKxy9gmkZBb//eJdkpK+V9alNpOgtezPjq0lAHPuBm3zeVaky5xd+aLFzwZSZsQh6On5BewcopHO
GPM++s6GGNydcQ//oHj6DfO4s2a/HFJzP62rB+Aqf4FcAcBVAKDEFGmlEg0RWS1WxZB4/DJOD0/D+JRUZWfdTW9os7FmpsQjgChK
jBy8Z0qwM+S1b/5S6l99j/pda7XPAYJry13O1lVgKfnb7kPX26wULpaAOBDmvH5TafgCKCKgoyiOSfAYmV4S48TZ/x9FwSpg0WI0
Lm7wGuCYl8Xurq4LNOeyUCBa7cj8fwEACmRFnBIlFQTTI3ivYXsDe3sPvb0HbfcwvgMZmzMTWAAWqABUrHcCUPowLACATHYBgKC6
uB6UUwYAzItCbSn/JvhNqbHyVVHb6GbWQOafVjT4uetAS2yBEYAp1w7grPypI6WUdPbFaKvc35CVkm6YhioiIEtKYpebdv57ATMQ
yWjGLPn9lwEAluutf1FiSjeozCqo5F7FAjVQAwiDx0HHF0hy3qRtb2nT3U7ddpcSb761fvgupOM/DuPjrvMzACAiwlX5X+UvlCsA
uMosVPKL549lZhaRSYADGxMt0W7XudveuT5PW+AgYqKBYQB8IR7poqX+xlLXX9H+Kz9/ib+is9/10rpr0FFbA9djEDCX7AUKy0yZ
V65gIokiVcs/MV4S4ykxDkkwcmYFkqDyG/ih7OxqXVPz/se9tpXlLvvnBOWsvFPnEboOU9fD7/bg/R603cL2PaxzOVefs+9fSUEl
aK8axZWVUCCH7xMt48sMSilb4Vzo+OojeXVh50p41qSLAmwt/R+6aC13q0ZBtv70Umhpps/rYK5AyVv7LOczf1bMrLk2v126HtGF
YF9R+OcAoLnm+byb13b9eSyLAldViUHji6r0jtWS7W9vTX9zYx5T/OY70MffH08ffiPp887QbuPdpvO+s9ba1vd/zQi4yp8jVwBw
lVmIlnj0Kjn4Tw6+68attbvemm9u+/6+c3YTMinKIxRJiMSAIDM3DIWBlN57rxiAbKXrumhPXmFlwZfT4PJ7ZVGXin6vvLhYXAdr
JqGyA0BWq4ZIa9MegpKhnH3Hmqv0jaIYEmOQXLP/mHJlvxNzVv6iOa+/UaTzJE/1/Gra4bqGTHVLtMpQC4AoPeyKk3ulmVrNDSFC
NBbReaDrodsdaLeH3e5g+x5pHJGESSJl6rz+R+X4ZV9ZY+Q2v0vBhmylLtb7mUJDRWHtyNfrKZHzNUNwptRbEJAVcHnmiJZICZr3
XR4GouzYIZMUQaBWKDcZklJgyKyLD60f4Drg+Wk1ZmEysKQFvgkAKuAQ5O6Cc9pKLg6VN2tjDRZkmrMQgLmS/zzeWjI/hAim5IUK
kBgiDIGHbjaIIHDXw97c0pfTy92/no6Pdwc8mRDst7c3776+v3+3s3ZfHSjFcaSqqqbJErjKVd6SKwC4SpVqjqwQwMvLy0FUD9vt
BmTtVzfOfrsn0yXn3AkAi+AEaCEySUyujp/p+aXZTwsCshKeJ/xm6qWlYp8qVaWf9chyXss6qDUAdD5Oqe7XAojzIEICYInUgNQa
wJXUPgUod+0DRhE8J8EhJhyS4CRF6RerP5bIRiqauip/Xc5p7jpYXQAtvQLVy1VuUSLO2vUqZJiVdVZ0QoQIyp0EnYPpN8BuD7vf
gvqeEAMkcT6PUnPfWAtCrVxXFFJV/G0hHi0DXJVnG3J/btVeos7RKMDKJdX8+fm6BVCDTD6YZWjqHjXHEmRiSoAUoYlITco0vOsA
7wBXpzFaAMyrYjlVOTfnbsx8Dm8CAMXy6CnmboE5sA8zhliARLlnLKRLH2gsLgHKLgWROUixOt+UE6kYEkqkMSJME0LvASieIu9+
dxpuNxweEMIXFpHNZtvtNv1+GWGCCOfQF1s7b1zlKm/LFQD8HcsFutAsc7mKqPLDafiYrD0a5ze32+1X75y96QA8AhhFeBLRaEhF
FGoWLaE/ZWn0y6USv8t6+qYyX/bzupxvG9xHyCV8DdUgv/KKRR8lUQQoTpxT+p4j46UAgOzrRw7yw2LNN2rx4rWtv9fVdz/Ghv+Y
qCpSCTwkELz3oM0WdrOD22xAwwmICTqX4rVZ2WfzNFv49QSosaJRL4BfKfXm6IsyvShv0f263uQVJd5sT2frVVBCmdFYKPdmUOs1
1AyA1fmcn8r5zTj7HsAKpQnQFga6SPPP2+DsIT8DTavt2kMrKQtxjIjHo04GqinS0VD3EfSuY43+NL7c76fDr0MYAcDWebyCrKtc
5SfKFQD8fUshnVHDzAl5ipNjTE+nGJ++TOGjeCe3m+1t5+zdLUpvewCTqg7IiijP1waAydQ+SlAcsjVfKtxBUDv46Yqez64AehW4
N7sHNB83T5lUmgJlKjVX/FuI6rouK2bKvw3sM/WCy+Se/fycO/YJcODs6z/EXMv/xLmjHyuWgj7auKPLGKzofqx127LkLy+qzVmh
Yb0hrXaQi84Uij6JIKrAkIH1Hex2C+z2cP0G1tqchlEBgKOs9AmAcPajEOUgw2r9V8Ups/PlMgh45XjBRV3/o9IOUnktHqT8TJkG
NWEebKy+q64Ky5kNsKZkDZQSTsbk21UDDtsgCEUuklSyFxaWgECwrwphra67Wv+at8vNgwhQswCUSu/P41PZkPpel88GAAmpECFE
TdPE0TlWEmfJe7e7vfPW8S5F/i+C0zHEQUTEmAbtEP2UUb/KVQBcAcDftYhqTQ4vDPj8/XRI8eHT6fTxIaWBDG688PubXKcNE3K5
35SXxtOoUEgu7gYAIBWV4jItlQCrf35W9npG19fSvVnZMhVFjsWiz62AMxAQ5BLBQLGIa5e/Ssej+PuBpXsf8nzLUESu+fyMF2Yc
WXHi3LZ3SIJJltS+V0YcWmWvq2yFOhpa/OQrfzuwGMevrOGad16U/cwPl89QVRXK+fkCVtGoCkcG2vUw2xvQfg+73cDY0nAnpRJA
Z6DWYo5oF8mKsihJWAuqDQJUigvgLIK/nu+K5/kR0XqxF35iplpxDyhxKKL5O5QHYxVDWFiL1npnWVIGU3EJOAcglxVWFSLjcrMD
RSlRvAAITUrk3HKgwkbkjn6agUAV0dIwCLkyRCkAqCSN+6zEQGhdf7m3c3Mgk9/nfI/Kyph8OAMos6bjoCOgZMjQzU3n7u/tU9ya
T8MpfHb+9Bjj8eXl5XB/f383n1+OKZzp/2uVwKv8kFwBwN+x1JT/8+9DSuNxCk+P4zQMqrse9E0UuUsp4dm5WvWvKjojilycNFtE
8/6KZT632n2t6M8pf71g/a/Xyfuq8XEZSKjmWIHi0MgnNSdhV58/SoW9qlcUsdTtPyTGU0p45oQj5+8mycyAiKAS5XMgeNl+ftWq
7HUuKAQ0Fr8u8/883Jf0ZoMwckB+a/nPO6zN4PLxWJCgYBC064D9Fma3h+k3ua6/ao7iJwHElQC4xmquqqIAAJ2DACUzJBUAnPvT
V0imkbdUzQ/hBGlYDiIQKPvIq5VcQwJE1+15pQTkCS8pg65mLJSn0ylADgrO7XkBrFIPy+e5WA8tAX1kL9ys2Q2B5t5oBXm03Mca
W1AU/mps1seu1L1CCcbkVAwWSJh0VAV1Dt3dPaX9jZuY9y+G7j8RPn0/heNXnz5/8t673W63A4DCPczdO69ZAVf5IbkCgL9zobO3
IiLHcRzGKZxY1fWb/uuttV97om0SkQOzDACN1lKxyP88v/9fYanHuhQvQMhWPiG3mp91Li2ZAKxA5GzdH5PghRmPMTMAAyumktpX
XQyKy6nW8zlpKTakWAf26WK4rjaaz6lVpFgBgNcKpv7erMu5Sl8OlCSw89DNDrTbAZvNEhzHtdFNQ+cLZ8u5sse2xADYJtUOshz/
4tVf+Oqimik/tJusxumtYxSK/M2u99qAk5bWbwCLFhbEaokPaEsX18OcfZ7P6exa2yDG1bXp2TW8cb/a9eb1l+20rTPMAmWFCiNR
rzEmRBhKvTfHMN585Hjzr8P0sDXyoXs54B+67tdb5/Zmcee1Z3IeUXGVqwC4AoC/O2ktAlKActc1IcCIiJxOp+H5cHxJLGnj3O2+
776+MeZms91QMEYnQEYoWKSGbRMynZ/LBmIJxltZ+Nq+XrL+67ZL1b5L22s52fpd9fNXfWqoKeZTsxGyayBb/JJr9Z9qJb+5hC9T
LeqToEitKZ8hAOZgxEL3z0pftWTE6bw2yjWg/t5O+KgX/APmclUgLQDA+jtVAZIgQSko0DkHv9nA3dyq7HZQ7wsAKk6SOaWPFgag
QDg1BnDFDTArU2le60lj/f7Cqa9kpu/1bJ0GAZwrSyBb5KZBcNT8O+8YC3NQrw/IaRx1nFLKmQLWLU2G6mst/HBeRbd1L8xvCKpM
9Xi5SeZ849fbtQxBPdc3AEB2M9C8/fw5P1+k0RLbhDCOmE4n9X1PSLL5U0zv7WlMMPpij8P3fh/MP+ydd4RuuQytfy7XMsFXuShX
APB3JFX5VyEqfKeqJuY0juP08ePnLy8qz/Aed/1u1++3N185S9FajCA6SkJSVUYpFlxqslfVpgDENOystpT+Es2fA/p0rdhx7gJY
0upWqYTaAIxGPxosZXw7WrK0AoDEObr/OTGeE+MYGSdmGhMjlDK/qRwLwLxtncTr+4sAYH6t8/ps0S2KX9sRqjfk1Q3CYrM1qzdg
gJpVNXFuvUdEiQjJdZp2O9DNDWS3yy4BapTPigFYrHvNfY6L9W8Ki1EUv7Sg5fzcL4CAN3DBW+vlfgHNRRGgrKRUgkRqvn6hyTMM
aC3xQkBVHqqNXaipdlxiAkSy8icq+S61XXCrxGtkH5XxNvmGNKmAWv30tRxVpX3OgcA5IzADAFnuaz0MDKAEEirQF1BVYrAFW8TT
gOHxSU3fQVTtd5G/HiN3sPSn/jQ93p+Gz+/77t2NdzMAAADNRRR+6l25yt+ZXAHA359UwrSJjSOklIbHp6fHTzF+EqLTrqdut+n2
u03vtoBGABGgCQsxXD2mS3T+mo7Xs+8vNuQ5+3xxu7Jt9fNXg2mewstnAyqWfxYBSkEfxqEo/8eY8JwYh8gYmBE5Bx1yo9yoWc70
bwEcS07+RYa+VWjnV7Ra52xePqOEX9HF55RyKR6jRBl0OQfpN1n5b7cZAFiz7FMv7BvAnDY3FwKiFUBYn2erTt7wi7zx09vSnld7
jNZPcEmaB6Gl8NubRQ3bUW9SS/m3mQ/A4iJ4dYqNEp/HswFXfxYAuHRfW3BQGaQSICAKHgdlgxRCD/Wuc97txG92vwPjfUzTPx+H
0z9697K7v72jRs6ZlatcpZUrAPj7EkWmBF/NcEo0JGM+R2ufxRjr+s2t827vAfACAOaofLOYYGtFXWKfVtS9nilxVBagZQBoYQKa
bWrqXSrbVn1gQOqoGnM5xa+61BmKSXKDnkGkpPUJnhLjJTIOzHPLXpbF7bAMCq3naihYhWYAgLXSX94vJl0emFYxNCs217G+CX8m
AOBaN58gMBBjMwDYZgCAvgM5VyzcM39+S0/XSno1FbAqK5GFzs4Pydm2uKws6zrVsp7dAJdXBZBT6Ob9vb0iNWluihJpP5+Drl5e
nes68CBfn7U5PqDUSVjVEDDNNvVmV25IqRmbet+qewVNxUGzsAcky/btKVXSQcu2qA92CT4Rgcak6ThoYFXFRvnuluzdLR4fH77+
pPLp++Px4yfI0x5yu91uN13Xdav0wHk4rlkBV1nkCgD+jqTW+s+5S+tgIQaepeueSeDEmG9pu7mDtbuAnPZ3BBAhSJpDqbnGLVc/
e1XmxeDKijt/vyj6tV+fm/dzFH1pA1z6CkCAWfkX5atEAKmSRXZbezJqFBBSRAGCCAbWYvWnnN6XBEcWDMyYRBFFII3yXwoJESql
X0v5smoOASjriigtSp8WxQ9gWQvQlSY6l2JBtkqrBQA1dexNa1FKyIVkhtx4wFnFZgPd7YDtDajfgrrcGGhuKaxNyWJQUwGwLGTW
YGHhi964jBYMLJezKP+Grm9U9zJcSrk6HtVBg1aMWrerzL8p7YVrMD+qE745l0uBenVsucDPilRdqRvgJMcJAPlzdS20FBAK+jMF
4VIT3W+0UfLl81zpr8DdmoGg5X116Yjo7Nqoro7ZJVDWy2yMsiqCMSSbjqJzkN0eHKN7Hg+7D8NofzuNz24cPn379ft3d3d3N/1m
09Vzr9BTy9srCLgKcAUAf3eS2dL1H38IYZqYn8X75Mn+2lrzX7rNxiVr7QiAATlCDANqiKiCgDxXXQ7Wu1jQB2fvseT4L6ytFgDQ
sANlQRPNlOv4A75+RwqWXML3mARPzHiKOb3vhRlDyvn+SRUqWbGf25pz3AHacyn+/qr0G2NwBg5VQaB9j0Y5tgocZ78tq7xiCt4E
AHWfOaiPiJTgsv/ee2i/BXZbmM0WputgnANzKhcpDf1dnDimWdpKgDXAYtbWWL8CPwwMzsvx/hADIE2u3LzemSZXzWV0i4Vcc/Bf
R/HXuIDGRaCaYyCqIhcp9QNKl8N6UQTk+gGm2ders23uFRpgUN0naBgANOdxaV+UewzM41AQTN1fw9iIgsRFEmZMiTGJAM7hZFz/
IZz63/J0cnH6TAbous73m01vCNZQrs8tqpIB9FX5XyXLFQD8wuWNPGACgJQ4BU7h5TQ8nqCHaG236fuvb/bbzQ7AAODISaIlDgJI
LvULQ0Q1nvySP/+thX/k97qf3ANA522AXMa3AgAqtfttvj4EAFFyd77q639KjOeY8JQYx2L1J8lFiWrxtXkgsNZtVe+1AYbt8iMj
/qNrzOutGAC6rGDb3Z67AKpSq35uENS47Pvvt6B+A9P1IOdAwTSWfxGipWrerPwbZV+Xv7q6OL/A8wPo8tLeIG2/PwdEZT8/dK7V
mm4B2iplUJfvrAXIFsudmsAQwkI6zHY15mIR8/dnN/NNt057HuUaFFj1JyjHUAhpZEJImmKQkJIQiz1a233y3X6TxuhDGm8TP/+K
5Y4AskT27Kx+6gN6lb8DuQKAX76sSNyqdlg0vYzj4WkYnl+G4Us0Ntj99v2u72/eISvaI4AEkimJJiJRziXRFJn9VL0AABRzA592
Obf480JIpUgQkDsD5jK+ORWvNA1C6dwHSzm3Pxt0OVp6LMV8TsI4JsWBc6veI+dI/6MwguS8fi4+W1KCmanwNWOxAACdXQDVPXHR
hV7WpfJhnWhxadJvf7qg0FEKynC7nSz5b60SrFZsAQBCgBoL8R7oN7k18GYD2/XQKZSiSdXhjIX+t03wX923Yn3eKMmBcwc85POc
uaC8TQ46/zE5W+W8eq02b9pUyXMQUM/tnO6/IESkFeCoKq1SBlHcC9Aci+BcdgloBzVKuVqigaqhVU2C+VKL9q80/0UAUMZ9LrB0
DgDqs1EBAOUHEVLYDiKQQFWJY8R0HPRkvESJzlu79Zvte03BWOUv3xp3/K/A6cIwNHfvKle5AoBfvKjqXF4kzzWZAWSR+DKOz59f
Dp9epvGg3vm7zu8tyBGWev8RQMxzk0qZPKrCrIq/Ks2q1Jd0vmrJK1hpjgkQAElyRT8poVFZ+WcHZdLFrZAt/pza5yjn+KvWQD/F
IQmeUrb0D6VV71Bq9wfm3K5XclG9pSLrUra3+sQr+JgBDpaqBDPNXybplR7SZR+rRjHziL+lwC7Nw8t3VdHSHFJQwUFFcroK0qsx
DGwMyHlQ3wPbLcx2B7PZwAwDlHnpBUDI9L+zZ9T/fFFrIDD7qdfnWQBQripB65/OggJeK/oL1/36p7PxrAPwg2NZxr0oayKbK1HP
8QQGNaqDFAoRUAxaywlrSgT2UBaC8xl1VpCkaOIMdHV5c9nfFQCQ5VyQj70CVoJM90u5qPkZKmWCAZSGCJn/EkBT0nA86gkKawzZ
m93G9jsTodsuDPje+u8fWV5+M01T3/d9O3rXZkFXaeUKAH7hUgP/gMyg19z/mFKaEh9OKR0nUXSKG0O0MwQdAUkATaqUsMQsVyph
maJ+ggtAMYOBuY0vFlbgfD/5nDO9b5CpflNy+oHMICRVjKw4suApJjzEhKeUu/aNIghSgEY5JgGr1MBXBi4u0P36eqnW/mvR1cv6
60s7Al4prUsK7fzg851Ec7LLsWcAZgyM7zIL0G9yWWDvITW1L0cNFgbgzPeP5VB/tpzhnVdg6Kfu800ddWEMftJ5Fav7rfQ+Lk84
y1IdcQ6ELCekWColAuv4gle71dfn9lOehXpvVgxBuWbKsZKAAomRhgFjEpjOodvt7Ga73ZI3208nit+BHv40jC9fiXz6x2+/+Y0h
MkRElsjK8ueMa5ngq1wBwC9car3/8/SflFIEcHKdF2/du33n3vfO7sUYmiApstKUJwxIIYjzNJWj5NuAPm3eCy0ZAAwoqxIrdM4K
0Ny8p1L9FQDUudaCcmAfAbmWX7FsNVv8UYGRBUdmOqQc6PecWGtq3yTZkq+T7dyEp1EaOgOSxXKun8uWWLr71YWW/c1jUefuxgw8
03nzpD8jjLcBAKnMO88pbj8GAJb9VZdFAgBjYJ0DNlvQbgez3cJ4DwphKQtcFb+1F9oA/xgCaH47r2b4FgD4EV1NOEvve7UvrMev
fj7fz4VueLnYUDv2Z+dYv5+teFnWqwi2ZgyIW8asBU+zC6UCs+KaqUxLDWCpyr0WWCI0gZmEJVWwGQACYMziZhIGJoYkBaOTkNhE
56F9h6dhuPvjFG7+ZTh92XX2O3gn73a7+5vN5oaa2ooAUJqBzY2DrvL3J1cA8MsXaqal+Q89xHi01ozb/a73ZL69d+7Gd10/GuMG
IAVAA1QZIAXVKZGW6n2qguqq1tmiTwJSyn3OSpneqoLBKiQgZQUxFAyQlFRuFEudDOCI4EAZvCgQNdfnP7HgmIReUs7tPzZlfIOK
Ll37FiVby/dmgKEr18VM89c5+62lAIX6Qc/my0UPXVJQ9eDSRNXjLGgMucVvbfIjmiu46NL4Z2nPm69jPrFSBwCaQZIRBRGBvAft
tqCb3B2Q+h4YBiBFzH5sa3OdAJMVVG3rfNFaz2NALciZaf/8kC01oIE1+1+enEulj6n0PlxaABegRVqvnOYjtmV/6/W3+6K56eTa
Mp87CJYfasDlHPTY/IUAJZAlFeXPoNx1CTXrQtUSqFuUfptuL+3NpaUtD9FC80NWbYQhpf8CGiAwXwSWdet5z5UHEzgZxBAwTROm
zoNF+j+ehvfb8Xgia1/EGPm/vlbu+67ryGzqraR60RkAXzMD/k7lCgB+gXJG7WUGvPkDf3l5OQwxPJL3ad/378j7b+6JbDCGXoyh
ozCV5CjVUo4EIAjNc3wmK6vfWVvaP1vLcwxAUcCc9Zkyms6AQGPk5DcGNJf0BXIN/9y0h5vUPsELC42lXW8SqU76me5vlffSsW85
5zm9r/lt7QI4ZwCwWNuNZmu/Lz/Wf9ZW+isG4NVNm886K9Py+a3tdL0PLZ0LWQSkCuMc7DYDALPfgfoNyNBieQIlANAtDMA52zDf
n1Y3nB+Y1uV835J2XN5eYf2+6stZkV8CWOe7+YFjVEt7LiVZlHe9xgo1qlugNJYmqEIsVBJBulIroFr/sjAA7djWV0GpC4CyrmnW
K4BrTkspXJs2wYLzH4kux8pPIAmxUWbEYcT4/Azbd+gj41NId36IozXTp+7Jn2632+evbm/fd323MXMzY6C0m7ya/3/HcgUAv0zR
Mm9WAGAzu6kpsgxfXl6+Pyienfeu77r7vXN+j+yXDwAGVUhRyRk2UO38p63y/tF0Piy+/jYjoE5AuWvfUroXKKl9yFZ/EmBgxlEE
jyXQ7ykKnpPgKILIilhqvls0TdDrIDSv8sbrrPip2ebHlNmPjXpL88/LpfXf2Md8Uj+y/dl2ygwxBFaFtRZ2u4W5uQH2N+BND7JF
sVSpVLa1zfm/cV7/J6U9nyaJ4Sdt9NYYz5kLeiE2QJeHQstB59LIQE25BJDbDasurgBCYQaQ15HmWahMTotQVwGCaBiEspIpf3UK
zO2Z619m6YYlw6DRW5lip4DQwdjt567/2qfAX8X04b9O02kYhvG27+7RXu15nYar/N3JFQD88kSrvXH+QxQ9PIfpw2PiT0fVtBF5
b1TvLPIGEVVJ02x4LW7L7Jllaar6lQOxAlK41/xZiYuFXcv4JlEIoEzz9AVLBq7k9FcjWTRH8I+lec+Rc5vel4byH1gRZnYhh8sz
kOvC1XkWi/u2ztusSrPPXxQ5JW5h91eGO5b4gcXmr/82Crkq6/ph5T+vyrz57U0lq6UYji4W9flS15SSjyFLeqAWq1WI8413Hma7
g717B3N7B95tM90/W560dMgzS/ObV9T6RZ9+ezJ0ed0f1St69okXhzctqxCgpNk9kN0E2oaxvd7rXFIYs6ojY3V1gqogMjoXElKB
slItKNTGEeQAfGTFzaUodgUDzID3gO8zK9CCqUq+GSzZATP40sZFUix+AHN8QHvT23oHogtbkJ1EBBFISpKGE4+cIF3n7HbXHTb9
3eM4yBdHL4+Jh6fj8fhutw1d13VA9v/nazXXfgF/x3IFAL88Uc3BPU0lkTzzTZyeH8fx80ERB+BORH/VJd4P3mNEThwuhXco94ij
MtfmCVFU5vS519H+OgcBCkA1jTBnEZAKIef8q5Ijqo171BGRo6yQo+YSvatiPkXxj8Jzff+oWeERtRVzF2ofqMaUzktV6qKgzKwW
ray18h8t+voMALTK/7XSabSzvvHaKv8WAFC7F80EtGYFvyRvnClKlraOUVZmqloVlEAzi2wtaLuDvbuD3t3B7rYgZ5f9UQkALIpL
6/m2jANd0uh6dkrtB3o9PFj/fC414K/dMgdAZiBASjor5Dp2tKy5elEQ1XpHwJLxrgKyVtfrS/kp0Uz/E4GM1bnaoDk7YREoRwJz
dhHYlNsNJwb6AgQIANnCubXb1gOXNMy5I0dj1WvzWYHFBVBPu6Jnk+sTUAEvMWqCKjMTG2u293fQvnPH56e7ZyO7T6LHj8fj852z
T19//fV755xDzqxZkWbXrIC/P7kCgF+g0JI2N/8hJ+Y4TOFwimmKxtyQoV+TMV8lwD2VqXVUJSaCKd5PFM2/KNIfp/9L9H/9TNnP
mOOgXZnIbQlHtuUEa2rfwDWvn/EQGY8pW/4nFkSV2eKvF9YYiqtMgsXfv2YAztn1ql+rwm8BwLzjqk5WlnujBFdK/cLruUXdytnX
2ub+t8d/jQMu7KtYpKpQSwCZ7Pff7fPS9SBTi8JpYQBqBsBZAZv/AxahXooQ/AtOIwcqXtjROe3/1nHq9c9xATh70KorQAA2gNRS
wrJ+JlblhC+e6Y88N28soosXv8QsKDMEoqJC2kUEMkibDUKK3bOk3fdxcL87nl66afponTP39/d33jmP6kzJZZWr0+Oq/P+O5AoA
fiFyocvXPK0xMx8Ox9NxnI6Jk+k6/85Y99V2s+nJOUzMHAFlIpM05ywZEESVhLAof238+Tm9b849r4o/QsGgOTBQkZW9mf392ULN
Crum9immYuk/Jy5te3ML36MwxlzGl6q7Ns/JxVpRXc+R5TxbALC4YduAv2Wj1gWwAIWWAWhoeQA6l0TCcuD6/vy1RRw/pHjq5xXo
aD9fkEY/qWi2RK1A1UAdZXp/swU2O8B3Oehv3rYyAHapW3/eMZCAS3r5p0mjcP+Szeo1Uxnv5cSbt/T2duc7VYUKzzT/q2PO65n1
/atAAOf3krIirrWqa1EgFUC6PJ62gIBac2FO9WuAiCpUE80BidZitv5bpT+zB42rpt2HEAEJHKOGEHVKAlhnvgjf/DbyjT0Nz2bT
fdmHZDYi3gP+fIQk5yOYKwj4+5ErAPgFiBYhIsq1WvMsIUVOp9Pw6fn5yyg6kffdbrO523Xdpu97HIhwkkQJxLksLwOzIZpTw4Sw
buWroBxrPvvtqbYJTlhYgGYOz75+IlRv7KQ5Z/9YCvq8JKZjYj3mVD+cRHQUoSSau+9hnn9pdlpqSfNDLiM8K/+Z1m+i+FF1+TKR
Fz2/VASs8379Z9aDVNqo5O8IpLNSWqGHPwMAvFL+9fdW41/W/NS+IyqB4Yq5573V0uXOAf0G2G6Ari/+aQOAL7QALmmKc7GgN+TS
T3rhRzpfmV59vLiPtroeCMWb1SKSGZQoit9+3oc2yhXrDoMi87pzOmNb/XDeR7XkCyhCbedbj63LuSvKOimXy6zpgyllwOW65T4Y
h+WYi3LPffmk+G0IKsUXRU0WQBs0WBslqoAkgwZVJSWQJDYICePxBGsMEgGfJO0p4VdTFEtOH+5DeriPvL/pcLca/hz3+wM3/iq/
RLkCgF+GLFoj0wAWIGVmOZ1Ow4fPX748xfRZrU39tr/p+25z1/cAEV4ATAAxtDQqXXK7V5395tda6jczADPlr2saHsgWP0FhC91f
KqojKRBYcRTGQxQ8Fqv/lBgja/bzQ3NKG0qGFYr/YFHURXlrqYj7GgCsuvnN3xdPZ/2stdLuawCgMyVeaPnyfi7Sg/aC607nPfzl
AKA9kXn/i12mzU4yA0IABGAqDely3VvxHrrZALsdaLsDdRsY30E4rYvZ1OO3ke6X2IpzfFJ/aBXiSrH/gCH5Fhg4Hxcq4706wPKE
vbVfoiZ2oHQOVNW3GYCZ6s83GySYqaoypkvzptbBVsYt1T+GVBYBvABSKvGSKT4vux7bou6Xe91G/JfBXqUNSgYBpjBUIlAiElWj
MARhDcejWlGJhoxYs00CN8Jue1j5dYgP/zSF52/7Ljlnl/m/5p5e3f9/V3IFAL8AoeLDA869lhqnGF9eRD4PIkff9974bue8d0Qk
DChjCdirsjI4zpbzJj+p+b4cH67QptVOq7VQWBWBc1veZxY88gIAXpgxJs5Newrt3s7Lq8wpYFbobROfZdHlddZnVdk3YKABKz9o
+qx23qKEeiLlizP9cHEf7ZFW67aKv/zQ+jUquGBebT+7MmqQGSnUWoixuSvgPgE3d6CbO9ibG9jtDhonwHtoWwFwBjvtMc8Gpv3+
zYH6GSqQ1TUWyxvAnMM/Azo0bMDZNrXIz1kL3wXUoQRcAnBN6eUKSM7vQ001PH/4aypgrWlQ0g+VyBBIkUTlNEhMwtx5sjc71+1v
uxdrvvoIOX4X0vOHl8Ph16TPd/vdjXPOGfM6WOGCS/Eqv0C5AoBfhiiIXpX7VUVgYx7E+xc21vvd9t503T1b202AJkAmwBZ/vNGl
5P4b9fyr/z8H7c1GD/LcZMhka5+o1O9XiBBEc3T/KIpjyr79FxY8MeOZc4W/EwuWSn55bqt1/Jf6AjkYEQul3xT5Wb5bG95V6ZeF
mvXLax2s17o97yxP7XMZNszKua5caeEfcwEURbCw462iXTQulWNm3+6ZYmaeyXTNPhooeLYgyRmFE6hxir4HLMHc3cO+e0fu/h7+
9hY6WEjfFZdAUTa1sdDsArhEj9fzraHpDdasUjPoXoWTnSGHHyohrO0bmq83D3v7lJ7t9vz7Oqbl3mQP2eVgwyXTIC8qNcqeMBfg
IQLVCLw6PCLr/QkA8AIGRXKgIFe3gAfUA764X84ZiVqKuHamquh5BgCmPvhYGgfpkm6YkpKoiEAYqk73kN0etNvi+fnx7mMMmz88
heGbNH3iMPHt7e2+7/tejV0QN7AYFFcQ8IuWKwD4hYihUsq1kSR8YGOfabMxDvqtu735CtZtR8CFUhR2KglxZQohpbMCPqrFws+d
/TLtX18XAADCHNlfu/ZBc1BgVMGRs9X/JSQ815a9mkFB1FzxL3tEMSsgnY9d3QyF9myUd1vZL79WpV+/ayx/rHVyVcBVm57rutlP
K0K5ZG35vApKayy89hVnB5vBRAUQdb0zH3b7tWZuuA1YnOvaA8UKBLRUDoYqkBJI+zyQvlNjDex+D729hb+9Q7q9IQsFfAeuz4w2
AKDqlNbqvXR+QItkmnXojd/o7OMbvzWMCMGslFK+fqOr8T93P1w6X9Cc908mu7gqEKjljHO8QI45UOb84cxKJzKaB88sIKGi1SU6
dQZq+eFNS1xAikDXAdgA1Oc/lLYNcz3nOWWwHFvqhWoGI8ASI6AomYVGyUhGuKXFcYqGkggSCNF5DM75T+O4+32aTvfT8IWnUQDA
OWeNMbnXsQJz/en8vF0BwC9YrgDgFyT1j7Wm9Bym8DQBodts7pOhf9xuNjsCMAEInESs0Zjz6ogasjNb2mepfbpOqwPylGQbQ6+G
mBEwFwEaS17/Y4ns/xQTnlly4x5VJMwW9jJ/NvpgVWNAW2WIhsa/RPU37+elWVeXV+BMjZ0p7TymQu3nleXeWO8/BgAq8JhjDy5N
r1WhlMCwpY9x8wqAREsmWFHkkiM0yFs4YxYmxhgY53NXwM0GNE1LV7s2B/0nz/X6F6zyBlCYL+atnRDmRkHFl/8mA/DmaZXNTWUA
6PV4Xhjf/FGXXgSo97qOWVXKF05eFdACAoQLICj9BOoFq2YgZNzbYz8/OyU2oGKfuSwwmmpdmFNelImUGRwCwjjq1Dl4Y/BkzPaP
SfptCKM39HQzTf29yE1H1LfnoD/pJl/l5y5XAPAzFK1VcC4g9BBTOIUwTCmdHo7Hh+A7spvN/bub/e4OwBFABHTMSQLKmuuQae4X
ME9vrYWfNFvpta4/kBkHC8y6o7LgrLlKX27Zmyv3PSXJNfw5B/sdRTCxICGrQkOUcwoaa6/us7b11XLZdakrVCu/Tf1r9a7oDwOA
Os/l7AmsD96AjbM78Ppz2RfVbQHoHNBVBrJSt8CieFsKuE0Tq9X5CI0FWvokmNzagRQwxYLMlQATSBJM3+vGWe2E1YUAEwNUBGQI
ZIyStdm+rdQ/lVoAtXhNA3K0WoX1+4vj0ZjerQLVs1XeFLr4djmJxhquD9r5MWa6fjmoSq4KSNbq6hp+5HUOFjy/nvlc6oParKOv
BmX5XmgpekHNRQoD4kFeNPdlsFBj6GK6YG0GVc/jvO41VVZCSMkQiAkcoTEyjxNPUDhW82jc/ruuu7Mj6y1o/A2Zo2hbHzr/oSnR
tSbA34FcAcDPVFREqvav+o4AHVMaPh8On1+G8fEQ4mj22N323c0eOfGXADCUErS4GXN6fY4hQK3kN1PvVflHXZSsQW7bawvVX+ME
kuYI/kFKah8zXlLCS+3ax0KDCFJmLzVXOVWqiplAmkv05iyDavmrQvNnKRZ7psGrLloFAjYMwNot0MzT81xdXQrlIMvXZxvU7xpm
ewYrjUIs21HdpkElWpXtfNKLX3n2n5BpFH7JyDYGMBZkDawxuXyyc2pNBmA2N2omUlGNEeCohoz6FNAdA+zxADw+AIcX0WmaWQcS
JZKSRQDQAjiWJ0qF5+qEeYiE5sFG2VH9ce5014zXj6oPWijzFZV/zus3H9vXVuqq9fCkVEsIKzPVcsCX4wB0vax0/nLQebtyj/K4
LTT8KqBP22tABnw1gLPGWqQI4l6JReH9rNQVDQhYPYPNuc0MQN5GlIkkxweoFWIhAxbwOGk4vIhwR2yNd31/472nxOi/9v0f/y+y
h1Fk3AH7ZjTyfHJl/3/xcgUAP0/RYu9UayX77wEZQzg+D+Pjl+PpJULtNvlbQ9QJcqOfiGxVM0C8WFZa1EhWvGgC/7CeHgmYu/VV
yr9a2pMIDiXC/6mU8n1JjCMLAsvMIgCtQVTLDC/Wen1fFbjOJjtQqX8US/68o9+PMgArhf/G5Dp/rr8vE3G7zRyDheaAl4zBmdIv
neCqkm8ZgPp7rZrk7AwArLFwlpCVPsFByILgCJTHUQFhIiSROIKYycYICgF6eAJ/9x3Sp09Ih4OmMYATQ0igYcwoznd5tq/97esN
qUNBNfG+WNizYqBlfM703U9W/vNB3lpP1z9qe4Dm+/pxhRcyX05KOtfjX+0D6/tfX9vdngXW5GJCaBR9qRdggBobkMfILPd4tvhl
eRUBksPcY0A2+TdfOw3W/Z+dq0oBG7y4iAr4UIPcuFCsMUby5ccg8fiiMXYUtxvbb3dbt+m6KaabPzr//L3S88M0PX6133/dDCWd
M4vXrIBfplwBwM9UjDFopt5si6oqi0xJ9RQAY6y765y7JSIXAWYRHQAjJZBZoVTr/RMWq799RfnNUTV+dK5EKqpgASZVDJID/R7n
pdD9STCygIv1XssUN8VnV4bdedrheSbCSiefbXNmx/1EaSxWbT/rG4vM62m7XbttlTqRK7JCB2BmYjUrd5qjyylX5KVSOdGaPNYA
jCqMCCwLjCqsCAwEhhlWBJAETQkyTUbGEzCOkHEEDwPw/AT+9BHjn/6I6csXnY4HpDBl67Vaoj6c1QWg2RKfg+TILMGHraZdrY8L
6KeORTvkraY+B15YaPz5+/okmrP1K+V/Qfv/raTe9xKQebHOQCtzS+K0bLMCHeX5cn5p0/xWjEHblXB2I2F5VYWGCEkJEhhiLCZj
TdzujWXxnyTc/2EKz//A4csNmZu7/e6md35jDFnbhPfkMmNlsrjKL0quAOBnKHOw35nGYWYW4ZPzPvV7827n7Nc3m82tsaYbASiU
J0PKogaUE58EIFIlISo0/pLqVxlsS4RSxwxAtqKjqgbJQX5HFnrmxfp/KWDgxIJRch3/Sr1TAwJmix9orP7F+p87Dtb3MxtdLXpq
dHNlCyqFTa9091qB6WriXRVBazeSAlyUcsUh6OxbfhNttEF81ao2BqZY89YYEBkYa3MsBQEWqoagRhXWQEkExAzDSRETKI5ADMAU
oNNIlAI0Rsg0koYACRE8DeBhgI4jdByA0wA9HSEvL4iPjwgvL8QhQFMqd3PEXLLWmVIVsFE6Ob+cyBqFsQUMLAqHjNVccMfqoqga
qnwliiWeQF+PXQsc5NXGzQ8V9p4//WW/l1RUfSakWa++E6ElsyJb3LROUVjWVZ0bMdEKORZZAZezXdRrpeYLEYBTPmtFAZcesAx4
Bjqf700FZi0QqACgfa6LO4e8gYrJf2yaC0RBE1KICJExqcL6Dp+fj/f/Eqcvt4gHG+Pv/5nlq29u9l/fbPq7c36m/kXQ5RG+ys9U
rgDg5ytNdHKW5+fnF1GctpuNYWu+uvPufW9dN3pnTwASFJNAU1a6VJLtSXIlsSXND0sacrXWqzkgCkSoBlF9ikw5n1/0gZmOojiJ
YlJByCABbXDdPOc3vvnWd18VfLboS9BhnRtnCn/R2zW9r26XlxkiVNdBiwCWE0H7PV6DAV22NzXfUMrZZcBBi1JpLOA5HawBANbC
WAtnLbxx8M7CzD59gidRp6oWopYFhhMoJaUwAdMAOZ2g46hyOoKPB+LjM3QcwacTZBg1jSN4HInHEXGcoGGCTBN0moAYodMEiQEc
ApRTGfRKQ3M+V1sAAC2ABUQga5WcVbJGl9+yQiJVJetyalz1icPkFrqUU+rmhzNrOVUorS3fQmG/xRy0oo2Cn5mCM1dAG0X69o7O
1ln+kpZ0waYjIJ09wXq+r3rM9odqndPyMR+gOU3N7YsVOSAwRSB5wEcgbQDpcwnnut18ueWNKOa0wLp7Y5Q41xOuVSEFYkRgJDHC
6YShcyAVPExh92/D8SuXpoSYXpSs9J3vbjb9XXN1WhgAydj96gb4JckVAPxM5KwwR6tqoIBO4zg+DONHcW4wm+3mbre9v/duZwAM
AE4QDYAm5Nr5Wu0VoldGbFX6DcEI1RzhHyWn8B0yza8PSfCYmB6YMSowSU7tK+cMYClkVuf5aset/fzL761Pf5XWd2nRZhvUObiN
9F/qABQLCZXKn4vsYD0Aq/m9uj4IWAfKybzy0nuxsfyrSx3Z8neG4AjwYDhRGK0dERVOmVyKsJxgUoSJETRNhHGEDifgcAC/vECP
L+DDC8WXZ+LTCWkYkE4D0jCCpykvIUBihMQIiGgNPCSCkjFKxS2hIqTCNPulmTBr7oa1gLUAWygZgjFQa0iNmdch55WYdQENzTi8
pStW32t5QJpidOebkVmvP9+hN6jx119ifVfPgAR0td3MCKywBTXrnJ3/hbcXEUjlDs7HRqX43GQBZvV93W5evcZp6LKPhq2aN6hZ
ngApiFRAGhPi4YBBOfceSMl/SPqVTyqbYfz47jQM347T4Vf7XXI2lwkmIDeqvsovUq4A4OcjtdJfbelGAEhU0xDT89M4fXkI4ROI
sLfmbuPdfosl8C+waoBq0mLuUK4XXwvkACW4r6YCqlJCNjJYFZMqgggGZrzUSn6J8Zyyz//AggggitZu7ivrO9P1ugosXAMAWgBC
tb5rb3cpmQK6TOXnAGBFLZdXVYEWCr/mySuwTK7csgK0nqDRvC9KvfrpqSg6U74zNT2vuDasISXV4qdXkAqMJNioaor/HhwNxQRw
IuIImSaSMBGFCQgBGMfiyz+Bj0fw4QgeT0jHI/h0BI8jsuU/IU0TJPt6FapsVaRTsCUSY50Y58R4K+S8UgnyUxGoRFIRElajOevC
iIAEYiTXozPKnNeBmpwqaBbftLFQG0mNpXXXu0JXl3EiYzTHE5i52EN+X8e6VNijkuc/6/uyzXyPCj0vufbkzNafK/FLiroCkxLt
UmMbsmUtCwCpSn8FEOa/QNDckuKtioKFOWieo8yEtFEv633Ozy01v7fXUKsJOl/KCbslZbMBEyQFRld2xBS3C0wuYBij6jgJq0jo
exiCO/Sb28/W4I/K4Z8if3wax9PpeBxub29vWmufcqWxV5d8lZ+3XAHAz0NaI7kFAEii09M4ffo4DJ8eIkdj+J6Ev9oALgIYkUEA
QzWp0lJIFkvZcsrTX562FASC5HQpJBUaWHAUxUtivHDCMeVGPkcWnEraX3ErAICq1PyrYndLzdVfA4AKCOb3qK5Y0tb6z65oANw0
hdGq5CvA0Pn7ygLkN8XSlwwGCsJorKxmlNto/NmKRVFoxV/vLKwzWelbmyl8a9RS/mNyKrDKMKJqYkD230+KmBTDCJ1GaAxI0wgd
BpJxNCmO4NNIMg6Fvg/5NWQaX6YJMo7QGMExQKqVnxIkRuSgDiTvHHvvozOUeudD57vknU3O92y9E3IGZFylZ6DMJJIopWQ5JROZ
XUrJJmabWGyS5FIUy8I2MTuWaMEGoLSMjy2Kv45TBQBmvZC1SsZofZ8Rk0V1LeQKfZWBoKLc82M+P7GqUFEiMVrdGKpSQEC5kUvv
5+bGMhRM+doJZNCkAmo+h5nep8bybzg2UKkWaPI5FFfBUqPI6NLJDxk+Cc3bzcdrLXWiAo7qX3P+LpcXTvkPV7FUEuw6oO8Br8vY
z5NBefAZgBVVNhnUkM3khTBBjOo0SRIRURi6vaHdfmePHG6fxvHdF7IPn4dp+IKnR++9226323JO8x3Ol7BiI6/yM5YrAPi5CJGe
pyQBQOA0HEJ4egghHonuO8JvJtZ3QYFnygBgRLYLqi7V2TJprHWsmUZRpSi5mM9zYnxJpWlPSjhIbuWby/wqYtHozXSkc3CfLIq/
frdY7y3V33w3n1vFEULLb/Qqr7/S/dkqPKf/UYEIXtO41Ey8OKPwKwgAiCw8FRrfmpyOR/WV4FTIK9CRqhWGSwEmRDLjCAyDynAi
GUbo6ajxeAQPI+T4Aj6dEE8n8DjOrxwmpBChMWQFn1JOE0upXI9URQhrDFvbJb+xyXkXve3SZtOFvuvCpt/E7aYPvevYe8/OO6Gq
cGocgzAJK8UUTYzRhhBsmIKLHG0I0YUYfZiCC1PwMU0+huhY2KYUndbQDjP/8wpAkXOLwrd2jjNQa4mcU1gB1OX2xWRRyjvQ3BaX
UABCQ3XP9H1DB6F5iC7/8TQvxVquAY32gmU+K39d3s+/154CtR10/TrTEYVYaw6tpcVv2Y+gZIZIARtUyLgCv6n45EQATfmaUukl
INyMwRKnUZ/ljEZKmmAZHAUILkN8SlweIZWJjHW3BN7uIXZvD+Z59xlx86dxPNyH8Ysz5L755hvquq4jY/IdqAo/MzXXgMBfgFwB
wM9Jzpp2MTNPIR4D85hAvfHdt9a6b5z3bkpJo3c8ABRLPrQBDANky9xWlTFQpjitQYCKkXNA33NiPETGl8R4SIwDJwyiiFSpelrt
o8YOZKq9MbZRjB9qAMCFpU1JXFrUL2BCkYMDVYrBI011wOLQWLOztIxbCYwG8vW3GQlZd1GlrOfrIVU4GDgFrAocK4wUWp8IVgVW
GJYZiNFQCkC24kmHE+SUl3Q8gg8HhOMx++6HE9JpyMp/mpAKpS+clBNrruqnSipqQEIEzXS+Eec6tt6ysx37vktd76PvOu66Pm36
PvabPu36Tdxut6n3Xrz3YokUKsglIyoGEIgIUmIT40QhRBvCZEJINoTJhhDcNAY3jZMP0+hCnHyK0cYYnIgYTmxFhUTEFNaHVIVU
kANMOUHF5Nr6xuT+vMbQnHJYo9utBdkMFhREZG32wBuCsTab+BVcaHEplApUmduumQf1KcoKezbPK0ggi6VaYGHlz0Np67ooFnzj
pli5iGaw8aqR3g9LVe6wmPNp35KSdTIHbQIz3T+fj2oZxwpa3zpurTeQXWJiCCkmTSANzptT33Wfxrj/7TCdtpqePdR2u71979w7
b0y3Oi0taT1XAuBnL1cA8J9Y2uIb1bZqfxvHcRym6SRQ7rrunXHu/fvt1nWbHgHAKCwjQNHACHJ509yoh8oUuaTZsQJRFSMrDSo4
CbKfPzJeRPSp+P5HyQV/kjaza/bw1k+zH1+qQkYTxKfLfDsbcOWTFp9EMfuz5T9XBgREJMckiOT9CyBtud01nFkm7hK8R1T89ZSN
IksE50ht8eHbqhMAkEqutZ8SDKsYCUqJQZyAFEhDJCQmxAiNE6UQwOOIEEaiGoE/DJCak1/y8lO18scctCcxIoUATSxgZqMqTlWM
seK8YUuWvbPJdz75rkved9z1fXKdZ9959r5n33Xi+467znPf99J1vWz6TjrfSeedWmNhSFVZQWcZbsIKUaGUElKKFGOkGJMJYTIx
JsqswGSnYbIxBRsLS8ASTUpiUoyWRayIEEsyKYpjVcPKllUtsxqBmMTsJKefloGuFmyOK1BjM2gggznIkAhijDHOSc5IyCABlGvn
G++yVqwZCNQo6fJ9DYBUaYJMUKLvkZmAudnT/FSW9ebnZwEAc5ng+lstMKRaXATLw11ZjJoeOf9QP5//QdDZ58pYacmaSHEBH9WV
4BPgPchakHcADHQuQgRkpEcFeS9Km9gqx6jjOOY/D5b+u6j35jQEo/zYOfd4OwV/I7r3wAoAKHJ2aP6LvaKAn7NcAcB/UtFK2C8g
oAbTAwBSSunl5XAcmE/kLN1u+x5dv/l6s0E0hFFBkyREqHKmJslSnv+Ld3D2uYsqJhY6qeLAihdWPCXOuf0sOIngxIxYwplUi+Og
mNoKWqXirXL5W79/w9qeA4L8WvYhpewvoAIFs9LMBMyveZkjI6qFVA3AxqcKygV3rDVwJi+eCJ4MvCN4IjgoLEqRHRUYhpIwNAVg
nGBCUJ1GyJTT79IwIoURehpycN5pIJ1GTcOJZJwgIWT/fYi5SE9K0BQhiaHC+XO2yNSSjV3XR2tNdMayNWDnHHvrUtf5tOn7uOm7
uOk3qe+71Pcde99J13lxzqlzXq2z2vlOnbPI3zk449TaDHyIqIkSrwOFwpzkytIiAmamlJgTR6TElBJTjIHCOFHiZEIIJoRoUkwm
cTQxJJMkmZQkuxFicDFGF5ltCNFHji6G5EKKnhPbJMlxYKtVo75yudTvSqChtbk6nnWAcyDfK0RB3pXAQiqVc43mWvoghaG5PgEA
VSYIoCnRrFCLcs0K3TRMgK6UejNUORgVOUUwA47yY9u9qijZrPzz9zlOgZZxr88tsLgC2vuieG3pA/n+xViosdJgqPMAd7nVMBFg
C5PV4Dwt6YKqSmoMiZLRlIjHEePLC5QjWNialO6nMTgypPvIj7+awvOvmccd/B7tGdaoRvoz2Y+r/KeTKwD4TyxnfrZZramqDsMw
fjkcXiZjJm+35rbrfbfb0i2AF2TAz4CKKkjyvAAU912x/JMqJsnLkQUHUTwnocec24/nUswn+/mlBPnpjEQqZT/7++t3rwCAXgQA
dVs9f9WZmciKn4rxZkwxoAhGtcR+aWmRfuZ6BWZr35r1qwPgofDK8FHJqcDJQuUbSaAQCCFCpxFyGlXGI/GQlT8fXygejhTHkVL2
41MahhKZPyBNAVxS8TRlvy0VNUGGlEBqrWXvuuS9S533cbPpQ+e76L1n5yw7a7nzHfedT7vtJm43PW/7DW96L33Xi3dOvXNw1sIa
o8aY+h7GmJqhsNIEKtKqhWWsmmAuVVVmySyLiLIIMjuQKKWEGCOFEKl8ppgXkyJTSMFOU7AxRjtNwY5h9CEEF8LkpzH4GCcXQ3KJ
o4shOBa2wmpEtYbONwDAFKrf5pK51kG9J2UmOAewy4GF1ilcKURgLXJnqRxcSLZa5Dm7YClubzL9Xu7LSuGq5piEVs5iEDQjqsb/
/uoPd1H87far33W17uq+1PNpl7qucK7WNQe/FD+Zaokt8Ms5V9dXw44plAQwUIWGoPHloEhR1VkL1d1o/a5Xid8qDZ9jGk8hnN5v
N1+3Z3g1+n85cgUA/4klG8UXOv6FEF5Ow/FhGA9iTbzf9F1H5PaA7gAZADBgWHOzF4+s/BIrCaBBFZEVozAGVoyieCkR/U8seCmf
j1y79hVrG5iNnjoBtVZ8CwC4KP4cV1AAgKyBAANQlTMggNk1Me+zDcgDwVEtJ5zn4aw9cti4KcNGUNhy/QYKEoVRAXEpqysJJkay
nEAxEmIEpwiNERoDYZqgIUCmEXIawEMO0kv1/TAgNb77VPLw0zSCWNgKuCdNlkisdWycEWudWGvZOKe+86nru9h1fer7Lm02u9h1
nr3vxDkrzjv11knf97ztM6Xfe6d959E5r87aEpBoKFdnWQBO0U+ksmiXnC3RaqsVAEBbDi+7BRRS0iYTJxURZRbEGDXGRMyMxJyB
ASewKMUYaZqCSSnRFCY7TaOdpmBDCHaaBhem4LILYfIhRpditCmxE5U8ZKJGuKQjIscVCJJRVdLEpCmRxphjCJydCxJlH3iNKyiR
75by6xxpvyhSIlNYg5KZgCYQL48YzWOk1cOgUAZBudH5DTYvD69ybVfc0P4XlPlcaKhNQSzHrOfXsiJay14CmAspcQMMakEgx5kN
mGMDanxAPqfMjiggSjpNmRvRBHSd8fsdde+/wuPL0/vP5D4+MU/HEMYYY/Te++Z5mZ0tV/l5yxUA/GcVKi1yz9C2qmoIIb6cTqfn
KYzkrO4COyNiPeaipzMTbojgVIk4pwkHBY4iOKXcre/AghPnVL5BFSdWjNklgKRzDj3NEfUoQXdktCp2ocVaz1H62tD00gTxYS7v
WwMOl3a+S4YA6jXUkGoCch2aXD3PlVdPGQw4Is3eT8AIZ/+9qhoWICWYJKopQUMA0qQaInQcSIaBMI5UFXcaBtIYsm++VM/LIKB+
jpBpScPjkoY3W/uc1BsbOtvF3rnQext628Wu76LvHHtb/faeu43nruu573ruOi9934v3Xp33aizBWavOOnXWofNOvbPwzmUXhnNU
4xmsscg1forVr2WCJhQa+qLRj3MAUDO7AIBNhnsZAKg6NqTlXibnlHvR4i4AixT3gYKFKcbIkgSRI4UYKEyhxBJMJscTRBNisNM0
uRijjSnaFNlEji6FZFnYhJQcJ87piMqORQ2LWmbO8QaAmSPgawMlKhUKa1riDAxyTAE5lysaGquwDuS9kiUl49Q4qzWFUYVICgRQ
1dwjM/ulQA4KLqmH1aouEfcqTK0iX2h/WhQwmaU1cdmeNAdn5ghVoByw9uasf8VrILAcBBAGCalOpa6FjaA+lSqCHeBybILMMRb5
UgDJYJeMsgJKRD0ZSN9hGIbNydjuwKKnaZqmaQorAFDheLVQsGaRrvLzkSsA+BlKjDFOMaWUk9wxMZtJ2CQACSARkCUlW5yLBEAU
GgvV/8w5pe8x5fdDcQNEAKEo61SUdLWma1CTkoI1++aF8tQlsmrdO1v8MyNQ3xOWvH9QbWeI2R3cXCMhA4Ds5zUw1PjvrYE3Bh0R
PAFeQQ6qRhVGc6AecSLEBApRZQykYQIPJ8g45Qj8l4OR0wHpeKI0DojDQHHMFfXiNIJDpvGVEzQmIMVcRyAJVHiuIqiqMIA476Lf
9nHju2m32Yzbrpt2fRd2/SZsNpvU9x33vuPOO+m6TvvOS+e9liUrfGdhnS1ucVOCFg1Zayi7M0ybsTCDgNzIL6dqLew0IQfPLxPz
ao5Wbd7OCi+HnoBIy/1VVTJEEBFVJVgyJCWSnJkz060zy6BS4gxSSpo4ISWWlBgxRsSYcjxBSmYcJxNjMpGTiSGakKKNMZoYoh2n
yccUbZiCCyn6GJNNHF2M7BJHl5JYDsGyihUtgbEVDDQuhFwwx+R0RO+yZWwd4D2y0nYEp1DqSnithZJSdiPQnL5XdPLaf1UpeFOe
3wyWlgFuqfv2oV7ermtkV+pfFURSb0i7QrPxrILLHxwvZZ2ty5+5VhXsFoBka7lmgWYUpSRJIQRhyRlAZEDGUjJEQRVjTJxSSmeX
QYWMK92kr/JzlSsA+FnJgrattaZzziQoEpGOqjQBxiMbQR6EQIRUCvUEFbwkwUPt1tdU8BsLACiWPIAcaLek25WUO8UcOyC0KPka
nV9CshvlT5m+N9V9kMvf1nnS1ECsJkq6MW9QcxUKtZ+j9knhJPvsPQROFI4TTEyGmHPDnBQgMRGaIjoyTjl4r+Tep9MJ6XRAPA1I
w4A4jojjiBQjUpggKSkxKwkr5e5JYgypIRJDRqyzYkxJy7OWve/SZtuF7WYTbrbbabfZxv22j7vNNm36Xnrvpfeddt5q5732nYc3
Fp33ZLPFb4wp9D3mCLNMQZsSN57vxzzhUskZz4CBGmCwBILV/RARkXkbAFTdX2PYVFDcAlkVWWszC0CZWlZVSEnXW9LDl/0zM0QF
zAJmURZGTEkTM0KMEkJETEyJmWKMFGJlCqIZp9GVNEQbpminaXKJo53GyccQXEzJphBdTMHFyE5EjKgYTSkr7pyQn10GJe1QoyX4
BLHWqPOEEOaqesY7rS4EJUtql/x6IqiBkcJ8NZ4SYG7HW4MVW5njA3RR1kBmKVBZiwtG8wwGalDrwh5czDhUXYI7FaVWgGBmfmr7
6eqbq+mX5dC1AiOXZ4AzsKXAbJJYajORrvLLkysA+E8sGWW34cOkgJL33t/ud9v3ItuXxGOyhl9AtAGwQZ4nOkCmHA+gj6z0yGye
ssWvL0XxH1nxzEyxKHeuEcrI/nouVH626BVJcsMgAZBYSMp7BqBS6gGQzLzDrNJnv3QunkO0tME1ZHIr+hy7nYP7UIOzcrW+3BlP
YLh2yGNQYlCMRDGCx4FkCsrTRDyNJKGUxg1F+VfafshBejyVErrVrx8CUgjgECHCSpK4B5KDYed8cp7YOZtyZL5P3jv23ifrnDjv
xPtcbKffdLzbbuNuu+Ft1/Nu08um77XzHt5Z7ZyHdxbOWuoynU/eObKWqFjyVAFAtatKMkgu3QuUQL7W0GwUfguaZnCwKOf1RL4C
AIpq6OZ7rkshJVFtfqsW3+waQuMJb3afCeys/DNDJJpjBhiJWWNM4CXIkFJKzBkc0DSGGGKgzAwEU5gBM02jDTmmwMUp2BCDCyE4
ZjZJxIqwEVXiJJZVDUNyKqIi1yzg0STA5ZK6dvaRq7U0uw9MU5+AcmEeMcYshYNs9t+bpXbBug9CqWZY7eRq2V+w4rXUFJpvRwnq
y8WAMne2ZCkU0NDWAqm7rC2ngRIXkPL6SoAWQJAE6HI5YXWO0JW4CEOlzDVUhJESk8aEpATsnOYsTLdCN2WWuBYC+gXIFQD8JxXK
YT16FgegRGS6rvPv727vRDVhnA5H5+NT0mQA+LwtLCBERkZJeGDRj0n0IQmOzJhYMSkwiFBSpaX1bw3cK8xi8eNXSr+W+2URYioV
dvN6c73WWeFgyXyq/YuMNbDWwBgLY0pqHpmmJS7goZpz8BkmtwQEx0gmBuUpEKY4++R5GjUNI9LhgDQMlMZJw3hEHCaSkLvfSci+
e42pBvgtKXkxQGICqQgE4gzYOp8sdbzp/NQ7FztnY+9c3PR97H2X+s7zpu9T5z07a9VnAKA+W/ay6Te66Tv1zqH3Ht47ssbCEpFz
jqwhWGPJGgNnDVljyJhcat0YQ3XsqmukAoAa1aEqIJjyPc0AoDwer2j+t6y3i8bnwgQ073X9G9a/XQhTAVBTNUXZSCngBGJhFS9I
iSG9FuYol2qWsr+YksYYpQYaxhSQklBKgaYp0DTlNMQYo5kyCLApRpNETAzBsiglZhs52RijCyG4yOxCTD6k2IUQJaXkBMi8CpnM
QM00eQMATPPZGpB1Sp0vMQSuVMIodflNYQHIlmIStaJErr+EWq+iutPqbRZZgQDVbJQr8xKZaIojTZqyyAvqgrLmls2VrlEBOOZd
cqkkGWo54R7a5boBcK5kW1iQgXKMhlMEnp9B+56d9Oid913XvaoDIIBaXH3/P3e5AoD/xFIZ3fKxeh/RFQEzJtDjSfHwMoXD09MJ
er/DLYAIODZW1KoEVjqRYCLSYAy4lO8zQI6oL357LtHyNY2PYHIUfZmfagEhGAOo1poCpTdMUfwzjd1Q2OUCTGl/ayj3+SFVWBEy
yF3xrCqsMEE45zvHWBvjkA4DdJwo+/AHxGFEHAbE4wnhcEA8nRDHEWEcEEtXPI4x5+NzyZlmzkFTUHXGJG9N7L1NzvbJWiveWnbO
cu993PZd2HRd3HiXNv0mbvs+bbpONp3nbddL3+VIfO9szrnP79E5T513Jit4S7VhEAE5UK/x3RsiMobI5Oh9asDTalJdLHysfr8E
AFbyg97ZM7BQv50B4MwCtBb/7PM/Bwh1nfKqQgrRHMMgkv0WVggiAmcMtbED82UhF3liZk3MuS5Bzj7QlBJCjAghUgg5niCkQCFE
kzhRjGxijJSYTYzRhBRsCNl9ME2Tn8bgxnHoRjv2UwzdNE1dLk4kRtviPk3wYC5XbOdXtZY0uJyG6D3guvyaPGZWoTIIJQNhuQ96
8X7kDAVdRkAJipyvX9IP5nNbZzO0AQUFvLS3UxTQWJiA0tqp9L8gqMI5oOuglghkSFiMDiekcYB7epg25i5s5Za23nVtACCAklsM
vYj8rvKzkisA+E8sZ1O7AliVDLm9vb3Zh3hjj8PTMJ6enk+nDzbd7N/1m/3+ZgcGOudc2pPBnSFRK2JFKLCaiZVyk3BBKs18GIrE
xbevCjen7SkEudiPEBV/f67LX/hnreAgz0O05Ojncn35FQAJg4SXySimXCqWGcxMzCXgLoRM3U/TkopXqufFYUQaRoSSlheOB8Qx
p+XFaQLHIFaUvQg7VbYAW0NsjRNrO7bGSNe52Hdd7LxPzjlxnWfnnHjnpfOOd33Hfdfxxnve9BvZ9J323uum87rpOnTOkbPVirdk
jaFcaMiSd9aULoFz5V2sLPbq5wcVvz8Zk7+tlv36OcDMDgDFL1TWyd+/ESymc3T/BflBAKCtgq9ZAlWRnzED8wFqAGAOBswMQLtd
DiTMn1veoOQsgIggJZCQ67qKHEOQ0w41xJhjCRJrTAkxRWEWJE7IrIHkQMNcr8CEaTLjOLppCnYcBjcMp24Yxm4Yhy6G4FJKToRJ
VIwqiBVWatYoM6lq7oZIMELGqLUZAMwgoHToc24BAM4tKYqVCajFijLzNfdIyF4Gu0pTRKl3sQT7UfUH6vxAVJdAjZ49D/CsS30m
KNvtpKwll4DQ94CARMWCBXo6qDscptvDy9Pdxg23ImZj12WA5/3j7JhX+VnKFQD8TKS6CO0K+BNtnbvpU9rw4eV0jOlPfzydvn55
9859s9n1e5cJynfWJLJ92sWoR1V6iUID54wAx4woud0vqyKRlnihJdYpI4/So4RoieBHKaxjajndubFZTpcSgSSAwcqiubFNTOCU
Ske8QHEcjaSoGgLxOIFjII4hB+1NhcYvbW8lTOAQs3Ufcmc8ngJ4HMAhQDmqVY09mdg5Ezrj48aZsOn60DubOmdTZx13vee+82m7
2XDnvTjvxDmvzjo1lpCD9DrtSgpe5x2899Q5B2+t6bwjZzONX/Pwc0pepvSdtaaESdPM9xYr3lANoK7YqTAChQLQ2RytNznfeGMb
AKCzX/+MgV3oFi1e2nMze/1ELe/rjrJupzMGoLH4sSj9Zdf5oFmxL26EqvBVVQU5gDFnEJQgjwYUzWeiOeqAmSv8qBUKlUU0MWtK
iURUU/ZZo9YoyIWLGNl1kCjFhJCrGIYQEo3TaMZxtKfT4E7DyYcp2MjBpsCGJZkkYmPiHGQoYpNwLmvMsFGSSywupuQ1BMoxAG3c
gMkAgMqrqW17CxBwFmQ9cjqiV+qckiC/N1RiCRzUEomSARlVQ6SGdG6MRG3zgNYDXx+zmrXQ+BlIVRlEVhWsMIHFQEVUjNluFGEL
UAedJvjxON6+vDz/Joyff5VuwjuVfmNeA4AZFOJaCvjnLlcA8DORMtm+irvprN1uVW430zTZ0/j0EqKOSn5w/te/+Yev0QPkAXML
GGeNdACRggwJEYgmsgiSrf1UAv1y0R4hrT5FAIAp7VZopiIIqJQ+Zd99pvWVmXInOwYn1jRNxCEiTrkNrow57346DRSPJ6QwUbXs
QwhNUZ2ck599+QEaE0QYmhjKuaQuOMEBsTOIfedj533orItb76dN78N+s5l2fRe3XZd2fc8b30nfOdn23eyr987BWgtrLBERnLVw
zpI1OTrfOUu5+58ha6hY+5nzqMqfCFTAAKyp9vxi2ZZvqCj6rNSr1p/39NZcepbOdxYEeIkByCr4bQZgDQzOAcDaBVCBSbbIz3j/
s2d0AQfrfWQ2oIKCAhNE67EX9wFynKNYq9XlwMwqNvfUTcwq3uU0RBEVWcctzCmKBQykzBZIjAkhBEwh0mkYaBhHM4VgcifElF9T
NNMU3DjWjojskiQbQ7RTCN0Ugp9i6GNILobRq2qTl4nqC1viBpxfShh3XuE6qPdEXaeQHnAu+/q9m7MIVG3pg6CzZZ87ImLN/80V
P5BrECw3IbdZrhl/Mzugsxssoycmds4YZ1Wn3tgwpt04HH81jQ//vTOP/+ytfuXdtne2P7/PuTt3sQiu6v9nLVcA8HORCgCotuLM
f9ydd9195+7/wbswGHr+EtLzeBzck3926tztbtd1vussQ21UBZcWth5AT6RksuVuSMGAsq39AUw55Fy4p9TjZ8pBW7ktrVEAKsSS
65Mrc/G9J6QYwVNAnEakKSBOU/bbVz/+aUA8HWfqPo4BMQRwDCoxCoeoiEk0RTXCQsLqhNQYVUNGrDXsug2Xojtp2/vY+03cdD7u
uy5tt3282WzSbrPhfd/LbtPr1vfoO0e99+i8M95l+p6y9T4r9GrE5/d2JmhN0ZRUFDmRqeHcxboH1modi4XfAIBs0FW1T/P7t25/
+0trdRFV7ZPv1fK4zADgTWXdfDrz9c/G/sqvXxVytQAv7XO9n2L7vwYA2q4LAMVLABUhMaoqBXQAZInm+gLOWp2ZBZxVN27OVxom
QUTBLBpT0pAixinIOE0SYqTqOoilEdI4BTMOkw0pmhCjzdkHk5umyY3j5Ifx1IUx+BAmz5wsc7KcxIiIEQ5Ggdz50BpSm9MQxRqj
wVONGWDfWYzj7DqoMQawLmcklPoFubSxKQCg1jgoLoUaF1AVfX4wMBdB+v+3d6/NjRtXGoDP6QtAShpp7mOPEydxdrNV+f+/aL8k
ta7Y47mIQF/3Q3cDDYjkSBppRBLvU3aNJIIgAJI4B6cvKLdpzsvFmJszvOPoHTtrFUuZphpSklbW9VcifvrzSn/4x4tL89fnl6uX
Z+uLRkpdksByjEXOXLd9ruC4IAE4Elyf95kphBAEC9E0TfP8+fNnfwkhSK35f6/7D7969/vHDx/ir8a8Co1+pZ9ftfrigqTWFIjI
ek/eB6JArChFf0UcU0dAyglAPol64lSCDbm06ilYy945Ct5zdJ6CsxScI28dBWfJ9XlYXU4AXL6Kd32fxtp3fZ43Pw/Lyz32vbGR
QnAiRKc5WBnZas2uaVa2YXaKyEspglLKKymCECI2Svm2bVzbNL5tdFg1jV+1Oqx0G89aHdbtKq7bhla64VWrRasabrRipaTQUrIU
zEIITh3yxBCkxwl2iYXMQb90vqMx8A7Ns+XRfHV/MwFIjfjDRX8O+pTXWxKK3cZAd7PsOk0Axiv2aaeAOujPKwD138vVe71cjDeb
APJHkevfy2vOE4BIdd8CGoL4/DUo5sFvYXzWWE0IZebBSJQ+n3m+glSWFlUlIVcrypDGkKsHqR+Bi8bYNCzRO/I+hPSvp743bKyx
1jo21ubpjXthOiO6vpebzUZ13UaZ3kjremWNldY56ayVzkfpo0/NBz5KF6NyMUjnvHI+qiCcSEHf0CTIy3zVX3rml8dUNUyxmu6Y
lcozGqY+BqzKjZFSJ0FWMk+imZKBSHG4AVDwLIL3gnwg+vKZqO+IvKMzpTbvX1z98d9XL7t/vv9x/be3r1+8fPH8UjdNk7OMYdjf
2CsBjh0SgCNxMzoMncDE2dnZWkopmnat1R8fWXz49MF8/vz7/3367P/DUlz/9vGHix9/pPX5OSnJxM4SeUNSSB8EMwsZiSlK5sgx
5NuPp0560YcYvCdnLDvjyFhDrrex7zp2XUfOWLZ9T7Y3ZFO7PlnTDzfEGcv3Nrfb5zH6tqdo0pA+8j4qZtsKZZQURjfSrrXq1kr1
K6XsutH2TGvbauXTeHoVtNJRShmbND9+bJSkNKteQ42SrJWiRklutBaNUqylZK2VUFIJIVKZftoTfyjIk2DB4xV7uq4fL9zHTnh1
kC/v0dhzgoaiPg/JxVjnFyyGSn75220vqiafhWmIp9lvuwoAkwmF6goAUU4AQwjMzCGEyFxmAozlDpXbX5MnCUCMQ3k+pobp4dcx
GSjLjq89dB6sKhCcOxaGmDsHpqBexg7m5UoCUJKP1Bowjl7wIVUDXOODa130eYHSbBBiiM56ct7lvgY+2NTpkKxx1Pc9d6bnvutF
Z3rRm170xkhrnej7XlrnpbFWWu9k1/e6763ujW16b7WxvrEhKNt12sdejlMZ8ziDoRTEMs9gKASRVsSlH4HWuSmhiax0TD+3aZRC
8DFNbRwjRUFMMTJz7pATKRCVaXs5UmSKIc2j0XVE1pAyvX39+tWHn9+9/Pw/716rf/z8p9c/vH758uzsbK2UUuUtk4Jl+fyhAnAa
kAAcifkXLnfUi4KZVda2bctSku1NvP7y5cPvm+uPxpH47Uun/33dv7p4/pxWWlLjLbUieqV0JMF5cH7u5Edp8h8XAnmXJ26xjqwx
qQ3fmDTcbtPl2fN66ruOTNeTMbnM3/fk8nz5wabgT85RdI7Yu8AxBknRKyK3ZmG1kq7V2qya1qy1suumMednrTlvW3veanfRrv3F
ug0rrWOjFGmtKY2pF9TqNOxOpc53LGXukV+31+crfCklj6h0zuNSvi8X55OKAE8qAkPIH38mzrPwDu9L9Z4NQznrn+fvZ/nxoU+q
8+g/qQCIG4/VQTjGmGacSTfqS//Wwbh65vjjNAEYov2WK/3hqv7GdsXhmdVzxlEIPoQwjiaYJgC5Y+GwhsmERkRRhlSs0Epy7kdw
IztKcxMMyQY550syEK1zsTcmGmtdbwx1pufepBEHvbFsjEtJQW/kpuvVputUt9noTdc3Xd/r3vaNMU4bY7V1TnnnZKAgIjFHihxT
xklRiFQRKNWAMuJAa4pNw1FrTr83VTOCjixlGl2gdbrJUZ7LIBClkQwxpit/a4n6nmizoZUz3bu2/c9fWvXbL88v3S/v3r786Yd3
b64un11WxyTf1yvdVhzB/3QgATh+Q1ccpZR6mrUcgAAAFLtJREFU/eLqpe2uve/6YEP4ZDv7gWN0n0z/u/z0sYkhtBvbtV0MOjLr
IIUSOk8MwjxM7ZsSAEfWenImTY9rS+e8rkvt92nu/OisC7brow8uBOc8Ox+U9UFQ8CL4IGPwgjnIRgXF0isWXkv2WgjXKu0apf2q
adzZeuXSOPsmPDtb+7O2DedtE89XK7pYt6LVWmgpWSk9BHotpVBSiDShztAjf2iin5TyheQ4DH9L0xwPwTcH8hKscwIgOJfvv5IA
iOrNuFEBGH6enTznw/6+/cQ6fXruZVf9XgVa+loCsC1oj8G4eub46jzesK6O/eM6wt5+BsPzKA6jBPJEhCUBCDJGvnsCEGJuNhs6
KIaYZyfiSQVnSBZibjbwPo08SNMZh2isDda5aKyNvbXRWBesc9QbQ9Z67k1PxhrebDqxue5kGnnQq831RvW2U/3GqM70uu97bY1V
znvpg5feh3QHxBiF53R75BCj8MbI1KnWi2gtR2O4VAPqBCBKxampoKog5P/H/oKROMS4Iu7XgrvzVdu9VOtPP19dfvjn+3fX//jx
XfvjyxdXzy7OL2afhUlWhgTgdCABOFLlpDXviKu11q9evbqKkWKzbuXlxnz6d28+/mbd5y+u0x+vu9XHL5/OP/f9eefC+ZfoRRRS
cU4C8giAIQHw1uX2/DTkLpg0JI9tqpVy9E766DkEzzF6yWyVFK7Rwioi10jpGsG+kcI3QvpWKd9IGRolQiNVaJsmaq3SGPu2iSut
qdGa1m3Lq0bzqtGy1VqctY1UUgolJQuZptQROejLXLEXLDgykRAsytC7dC1f4q8YjhsRDW31uQWfSm/4EqXrBKAsO8zWN0kHaMgi
xlWPHaeGf3dcPG2rCtS2XaneRrl6r9azc53zBGDb8lUCMKkADNvN8z4DY/wofytBNpRefdu2i+fDEKmU6kXdf6Bubqhev+p7MDQB
xEhjs0ekVE0YE6+xD0e13UMfAh98SP+GaJ0LJSmw3kVrXci3RY4uT1hknQtd1wVjrTO94d703G0M5+qAuO42qtt0skxWZK1Tzjnh
Qhp+aG0ehhhJOhe0Iy9dIOWCl67zyvdGRiHSfATDTIVy7DtQ5iAY5iIgohhIUAxnzWpzuWo/vzk/++Pt+fnnn59fXv/y9o37+08/
tH//0/sXLy6fXQoxzjecrv7Dlvd9/LzWn3U4LkgAjtCkA06+Yqm/gOv1ev3mzWteX1y0L79cn//ny/WnXz9/vv7102fzr2DMv2zf
+evrTdf1nev7fhPD2gZqfAza+iCJYvQ+pI5+zpG3lti5ICh10GuI7EpEo4mtIPZasVOsvRLsVlKn3vhSuJXWfqWUb7UK66aJrVZx
rZvYakWtUqyV5FY3LKXgRimp8/h6rZSQUggtlVBSiOEqv5Twq5lP6vJ8PjgpSOfyvhiL90NHvKEsEKvgFeue9kzMcYjx4/rG16mv
2idJxb73rd7O/Jqzx6q39V4xf6K041frHFYa4hiA68eYxyF/88e+mgDM1leu/qfPz0G2CjI3nkdV4J4kFDm0D1fyHCcHcVwHRaqX
m25LzO39Zfn5cR8SgJB6I4QgRQgh+hiCkunn0h/B+xBDDMPkRXkugmht7kdg8wRGxsbeGG+spetuY7o+NR/0xqapjZ0TxlphrZO9
M9JaJ42zss/NBcY6ZW1QxhvtXJDWee1MLwOxCDGKNGeA4DH4MxFLisystHKNEmbdrvorxZ/frJpPP724+vTXd2/7/3r/A//y/v2z
929eXb1++eJqtVq11lrLzOngDklYpCiqEQdwEpAAnIDSRkdMJGXq3nZ2dnZ2tlqtrs7W569a/eyVpI+Xwf7Rmv5a26ZvnLWt95t1
cJ++ONImem1i1DaSCBQ4Rs9leuAyFlkL4RSTb4Rw50o6LYRvlfCNUqEROjRahbXWftU24UylWfPWTUOrtuF103CjpFg3rWwbLRql
pJJCaKWlEMxSSFZK5iv5FLfLVT0T5fsHjXPgl/M3V73u0x/Sj6nUL0hwuZAXQ7NACep1m3w5sY2BsGq7TyucJwBVJWD/+zNcoM4W
vDmcb+fz75UNMPMkyMbqXvLzkQT1a8xfb/rY9OFyELdt894EYMc+7UkAtvztxv6WdVBdfKj+Gf7qg9/9+jcSAB9DoCijYM9jJ8RI
VCcZQ7NKvgtiSMMQ0zpyH4JgrI2dMbHr+2icD70x3hjDzgUyrvQnMGytE72xouuMNM5I21vZGyONySMPvJXORemjEyGSiMxpfqhU
u0odCkWaW0A3rV2tlD1btf2LZ5fdu+eX3Z/evrV/++m9/Puff7r48w8/vnx+efFsvV6vmJl7aw0RlX4xaUDhjoQNjhsSgCNVl9/S
H1L7cySKXG4cKoRo1+v1C621bttGS6nXUn+8XK2+vLnYmN82m/5Tb7qNddx5y70PwjnPady0Y+/KlL0u3zdARCUoNlKGdaNjw5K0
ElFrRVpK0jJd2a+ahtvU+160WolGa9FqLbWSstVaNir9LKSQSiqZe9mPXe8nRdmyv2mOoaHtekszNHNuEqmDMxFPWvCHqD8mA8Nq
qmFzdc/+8hrjs+YJQLWO+cD04aFpY03Zhvk+bDNvr7+LXYH9K30AblwV18vMg/c0AbjReS8ZO/bvTWjmCUDVrp9euzq89ftVb8c0
VdieAIQodyYAZZ9Ld8NyxZ+aH/LVcE4AStt63oBybCmkWQ9j+cD6EIJzLjjvo3EuGGODCykpcPk2yaWjobUuWmvJWEt9b9kYw8YZ
tsaytY6tMeycFy6kqY/TTZq5nAPS51RIYhZRChmbVod12/izdRsuzy/iq6tLevfypX7/7u36h1evrp4/u3h2tl6vhBTS++C9956I
iISQxCIIwaJ+D+a+ngLDoUICcOTquBaJIm+ZnVMppc7OztbMzOv1un256c6/GNt/6Y3ZWGt753zvXLDeh3RCCuSDDzFPr0rpPMyS
mZQSrISQjZJCCclS8jAXvhg65aX/BXMq5wuR/pdSapVrFKln3bx7XeqkV7XH1/tZ2oZvHIP5DtfPoTi5epm04VcVgHl78rysPz/J
ld+FkGISvbdcKG3d5nnpYH8CsPvBr5gG7d3n6Vmb/KRJaR746/3ZdfKvA2mMMZLYvS31sU5hJrVChBByAjBG/WmiMn3NedISJ6aJ
RJh1kJzvRkkAqlEHY2ZStrO8Lzk5LB1M03NjzJW5oTmiJBPO+1CaDrwPwQcfY3oPos8dDoc+BamTYXTeRWddyLMbUu6USKFuyeFx
X4RId91UUnKTqnBivW7l2Woln63X6vL8vL18dr6+OFuvWDA774KIIr0znJvHhqoYoY3/RE0m8YDjNDkpbTlJ139L57PgfUr1nXXO
Weed9c5Z773z3qd+Trl2GcYLbpHb11Mwz4V1kW//M7siLueLEmiJ0lJSirHJ/mav+MkV/ywBmOzzrufdXGZLIlFt57bjuHtdk9/H
/dsSLLeZB87JOh+5AvC1r/m2z8ttHrtFAnDjM5n+mSQA9fNKM0N6Hu9+/fk+TROASZv/jaaHr+1HSUCGOJ4jfnla+XXHvlMcOyuW
pw7NGDkXGH6fdx6NkYYhjznQhzyHQelvEEMcRkEQEZGo6kllHgspUn8arbVsm0Y1jZJt0+hGa6WVkkpJqVWuxQnB5b+SlVf9Z3Km
Pukju/e7BMcBFYATFNPoqRCJIjMTS8mChZBMirZdBsYYg/feOed8Erz3nkIMeWx3ngaM05i31Lg+BPb6fB7yGW0ovOar+RBi4EhE
Ij3InK7288MUKcZ0o+BkSwIwObtzGXsfdwehbX/fFbjzYdgZ+HZVAB4rAdj32nexK+BtWa7++db9A+6ZAMRhGsS09Ox5VUfE/QnA
zm2ZFQBS89COBKB+L+rHQ+AYI4lQbmBQdYAc8oHpDI3DsSwJwLjsdAhk/blNs/xWn4d8M6ZUI4ihjETI36tUrWEu20PM5f4T6f6c
VQIglJRSKaV06mSrpBRSSinyBlPwOcnKx4yYhntUCJ60nXH9nUTAPw2oAJyQ+owX81m1fGtzZ57bfWljuuwZL1FmZeFZ8ApbTvDz
E/+YDGy/oi0nshozD5/PXQE4r3CrtMz2B7edwPZ9F+YBYmdyssdtg+ddtuu2bpEA3LICMH2eELzzHFL+miLw7ZsAiG42SYwL326f
0q0qpp/dXfu467NQAu10NEFVxeDt6xmWGQsAw3anvKF8jcb5B8YEIBJzuvFRKMUHKiMauHrNsepW7j01TGTFpTqXmt6UkiXupzwh
N4PlfUwbyGVOC8FSiGrGrGpyjKqadp/PPxweJAAnZluQmQTvO6xj10l4vq7piX3/9uz627b1PrZd+3HXdUyvPHcH+fp4zp83ty8g
32Xb7rOeOtDdfGze8W53UlmWrRKAW732tn/3Lbvrsdt+9vYkALG+6r+xXTsSgC3LTrbp5jGsrrFpumzViDA5HnVwLtfpw+RV5dFx
YixRSvhDn5ucBJQsjWdKv5n5Pm1LAOB4oQngxOz6YparmekJkCdX4zHWPQhvDtUafp+dQ7cGvXS6utM2fi0ofqt9wXnfdm177i77
1nHfffuWY1KfsOsE5L6vPw9e9VXhXAgxDEkI3+4YVsFycjW9Y9k7JwDbbEvgctK8LQEYlmMxNFUMk0aUn3clDSmx2JqETCpWMTUw
MMWhv8BQLSjbXAVrThWAIc7PmqfKEEUeG93iOOnVtCfuqD42tz2WcFyQACxQaesrQb60x07b+FIZch7Ib3NVNZxQ73jOeOyrivmJ
+aFe7ykC+31e47bJyXwCoduuf66eIrkeOrnPlgrA3pefPbf6OcTpw7tf+mYTRN3WT1UgH9c5T2puJgD1yAWqE4C9VYjxq5MWGW58
cHO5IU6nq/VIpQNfvRzNusjWjzNzmW5jZ+Cfvy6cFjQBLMT8yn/X+XD3I/vW9+3LEd3tJHOfz+3XKgD3fb3brucu63jo7yXz7SsA
D/Xa932Ptl09f+vr3axcjObNGJOgvyP5nV/pb/sM7NqeEOLkfZgG3Vl1jcb+BPWyaXrq9Huq+sfhHhXz7amTk/mEPvXvdQIAy4AE
AB7VIX2+niIBOOT9/9blHms9B5YA3Gpb7pLAzR+qn/q19UwCfJyW+XdVe+5yZY8EYFnQBADf1Mnsobfle7nrtj/Evt53HQ8VkG+b
qBzz+1rM92F+1T1dlibBsizLzPxICcDORHTfeuor+ToB+Np69iUAsGyoAMAN+9oojxkqAN9+RT732Pv+cBWAbw/eD7GOutlg13Pr
v+1KzO5y5T4v89frPYXvNdwfEgCAA/fU39FjTQDqbdvX/2EeWO87WuK+bhuE75sAIMjDLmgCAICTcN8g+NTt4PdJAAAeAhIAgIV4
jABy23U+1miQh/AQAXhf9eFrJf9t652X6Id2/z3bVi/z1FUjOA5oAgCAR/fU55mH6sD3GOZD8wC+F1QAAODk3aWqgFI7LAUyTwAA
gAVCEwAAAMACoQIAAACwQEgAAAAAFggJAAAAwAIhAQAAAFggJAAAAAALhAQAAABggZAAAAAALBASAAAAgAVCAgAAALBASAAAAAAW
CAkAAADAAgnc+QoAAGBZmJlRAQAAAFggJAAAAAALhAQAAABggZAAAAAALBASAAAAgAVCAgAAALBASAAAAAAWSBCl8YBPvSEAAADw
+ErMRwUAAABggZAAAAAALBASAAAAgAVCAgAAALBAQwKAjoAAAACnrY71qAAAAAAsEBIAAACABUICAAAAsECTBAD9AAAAAE7TPMaj
AgAAALBASAAAAAAWCAkAAADAAt1IANAPAAAA4LRsi+2oAAAAACwQEgAAAIAF2poAoBkAAADgNOyK6agAAAAALBASAAAAgAXamQCg
GQAAAOC47YvlqAAAAAAsEBIAAACABdqbAKAZAAAA4Dh9LYajAgAAALBAX00AUAUAAAA4LreJ3agAAAAALBASAAAAgAW6VQKAZgAA
AIDjcNuYjQoAAADAAt06AUAVAAAA4LDdJVajAgAAALBAd0oAUAUAAAA4THeN0agAAAAALNCdEwBUAQAAAA7LfWIzKgAAAAALdK8E
AFUAAACAw3DfmIwKAAAAwALdOwFAFQAAAOBpfUss/qYKAJIAAACAp/GtMRhNAAAAAAv0zQkAqgAAAADf10PEXlQAAAAAFuhBEgBU
AQAAAL6Ph4q5D1YBQBIAAADwuB4y1qIJAAAAYIEeNAFAFQAAAOBxPHSMffAKAJIAAACAh/UYsfVRmgCQBAAAADyMx4qp6AMAAACw
QI+WAKAKAAAA8G0eM5Y+agUASQAAAMD9PHYMffQmACQBAAAAd/M9Yif6AAAAACzQd0kAUAUAAAC4ne8VM79bBQBJAAAAwH7fM1Z+
1yYAJAEAAADbfe8Y+d37ACAJAAAAmHqK2PgknQCRBAAAACRPFROfbBQAkgAAAFi6p4yFTzoMEEkAAAAs1VPHwCefB+CpDwAAAMD3
dgix78kTAKLDOBAAAADfw6HEvINIAIgO54AAAAA8lkOKdQeTABAd1oEBAAB4SIcW4w4qASA6vAMEAADwrQ4xth1cAkB0mAcKAADg
Pg41ph1kAkB0uAcMAADgtg45lh1sAkB02AcOAABgn0OPYQedABAd/gEEAACYO4bYdfAbWIsxxqfeBgAAgF2OIfAXB18BqB3TgQUA
gGU5thh1VAkA0fEdYAAAOH3HGJuOboNraBIAAICndIyBvzi6CkDtmA88AAAct2OPQUedABAd/xsAAADH5xRiz9HvQA1NAgAA8JhO
IfAXR18BqJ3SGwMAAIfl1GLMSe1MDdUAAAB4CKcW+IuT3KkaEgEAALiPUw38xUk1AWxz6m8gAAA8vCXEjpPfwRqqAQAAsM8SAn+x
mB2tIREAAIDakgJ/sbgdriERAABYtiUG/mKxO15DIgAAsCxLDvzF4g9ADYkAAMBpQ+Af4UDsgGQAAOA0IOhvh4PyFUgEAACOEwL/
fjg4d4BkAADgsCHo3x4O1D0hGQAAOAwI+veDg/YAkAwAAHxfCPrfDgfwESAhAAB4WAj4Dw8H9DtAQgAAcDcI+I8PB/iJICkAAEgQ
7J8GDvqBQoIAAKcCAf4w/T9A9MKqoG/AEgAAAABJRU5ErkJggg==
B64EOF

base64 -d > public/pwa-512-maskable.png << 'B64EOF'
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
gg==
B64EOF

base64 -d > public/apple-touch-icon.png << 'B64EOF'
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
ocdbkaCSpIkAAAAASUVORK5CYII=
B64EOF

base64 -d > public/favicon-32.png << 'B64EOF'
iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAD5UlEQVR4nMWXy28bVRTGv3NnEjvvVwNWV01aiFCJFAikqgRi0V1Z
9C9gi1CXLEAFsYAVrGADC5ZFIB6iBSqgCClVlFaIoJTShAjn4SR1bGf8Go89fs6997BIrZaQ+FVqzmakc0f3+51vzh2dSzggmJkP
yj9oEBH9K9cO4Vogot3i+7VEu8X3Q4h6Lz7sEK1WzwBrZv0g4szMLTtAAAmilguoRtMADDADHHbz21/+GbxORKSBlp1oHoChCaCv
kumt8z/PTTtuPgtmMKMlJ5oCYEATQeSUjF7OZJ5KO9mu93+avSmIRKv90CwAE0CfJZIbm26+37CT8oPvrz4dc7KWILQE0TAAA5oA
kfIqoU9j1il7I6RMz1OOnel/79KVv4iIWmnIZgCYALoYje1u2plOmU5pz82ZRs5RH1++MrNhxe8IIZp2oSEAzayIWex45dXPE4mZ
1Nqa0oWCQaUCGaqiim626+1PvggT0LQLDTtARHTp1rKzHVw3JYTWbEKzH1IYplkqyq/n5k+txJNBQwhDaa3+SwAliAxHyt+mxsef
Pf7rgje0HDTG3QhOereBXBm+hMV6atp8c3WneJe2Uf26AAyAlFKFHaVG5cgQn71wATO9hKtnF3HzlUW88eQKvGfOGGpk1Pshlpz6
Jpq4YRAZirkhF2oCMKAAiJjnLZR9vmMruawX6RsRPY+NIrB8HWYXMDbphxocZSNtQe7u6teW1k7kpLQJRI00ZC0ATYBZ9LxQzDRP
L3ueinls2E6KFifP4aXVF/HWxWG8PnsSnLdIukXRYSe89XTu0XeCW0uCIJiobkMeCsB79iOkVCZlmj6rLPV6oULzls0hJnw3+TK/
+2NA2wXBtHuHdWSHpOOYZiTsfbgeee53x10ygLqfwjwkrwgwkuXyLxm///QfuUJlNuWIhXReuQVJulI0/I8MgCYCKOWzQGcnm3ZC
klZMYC719pmv3l43rz0/xdWjedA8WAtAeEqllwVNzJYkvrWLndt5BS/rwh8OozO8XQlk7bj/SCAfjcaGkoXCsKd1ByCArU1QqcTz
A4NPfLQZnTs/dvQFySzNQ7QOTDIzmFnfiiXT1yKWry9qpc642dS4quTGu3wYm57oHhke7DY6zgnHdaNRK74WikS9tchuRzAeHwwn
rSP2jdmBaKAPGDsK2jf83h81/1xSSplIpRN9Pd39vb29Pf+ABFgrpYF7U67WWheLxVI6bTulSqXy+Injxw6zvhEAxn3k1UEEzKA9
zXtr1T2IalbbLAB4b5Grm9arprpX9Ul3o2WAdoSoR/gwg4jo/78XVEnaLVzVFPsT7RQHDjky7bye/w3yQ1ydn/szyQAAAABJRU5E
rkJggg==
B64EOF

base64 -d > public/favicon-64.png << 'B64EOF'
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
B64EOF

base64 -d > src/assets/izi360-mark.png << 'B64EOF'
iVBORw0KGgoAAAANSUhEUgAAAGMAAABjCAYAAACPO76VAAAgtklEQVR4nO2debwcV3Xnv/dWdffbF+nJkvwky5Zky/tubAzGARuC
weDBQMxibLABO8YYLxgRCASHxAEmJBmWiTNJhslkPlk+wzCTkBiGzCQhLGGbsOPdlrW/vd97vVXVvefMH7equ59sYtmW9ORPdD6f
+6q6uqv73vOrs997HxyhI3SEjtAROkJH6AgdoSN0hI7QETpChyNFff22vGrN0HL340CRXe4OPBtae8WVLxh5y/X/bbn78W+eSoND
9or//fc/PPoP/kw5esOm5e7PgaDnrGSc+vo3XNJav/70VrOJueCijy13fw4EPSfB6F05Fp34jut/5yeT00ir4cymza+LNm45Ybn7
9WzpOQnGuW+97tW7Vq46tVVviFprxWXw4l/8NNaa5e7bs6HnHBgD4+vKW6699rOPTs+IVUUNkCSia9a+LNpy6rnL3b9nQ885MC66
8card69csbbVbKHiURRshNRrmIte8mkTxc+5MRX0nOr44IZj+05+85t+98HJGWIRRBVRBRTSRPzYUeeb0875heXu5zOl5xQYl9zy
nndODA4ONesNwXtUBRUFVTAGrS3CBRd91pQq0XL39ZnQcwaM0VNOHbrwrW/+zZ9Ozwne471HvaCagyECrZbo4NCJ5sxzX7Hc/X0m
9JwB45W33/bePZXevrnFhjXiUZFcMiSAoQIq6EIVnvfCz5revvJy9/np0nMCjLGzz1113utfu/U7e6aELAPnrHqPiCLiczAURCFp
iVZ61puzL7h6ufv9dOk5AcZrtr7voztKcXlifhFcJs45xHvU+wAAwWagAqLozDR62tkfN/0DPcvd96dDhz0Y4y+4+JizX/XKG761
ewpJUyRLEedQ74Nrqz7Yi+6WJWgUj5lzX/CO5e7/06HDGwxjufyO23/3ERUm5muCy/DOIc6J9wEQ0w2CFk1hfhY947yP2eEVw8s9
jP2lwxqM8YtffPKpl1165T/vCVLhXYbPsiAZLqgp8blk+LaEWLxAmoomrT6ed9F7l3sc+0uHLxilsnnl1jv/42PeM7VQA++szxze
OSveWZXcbhQS0ZEQQXwAZXZaOP6k99mVR61a7uHsDx22YGx42WXnn/aSF138/b3TolmGOofPHD5zIs6LOEHFd9SSdqmqAhSXIa1G
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
B64EOF

echo "Installation des dependances (lucide-react, vite-plugin-pwa)..."
npm install

echo "Termine. Lance npm run dev pour tester, ou npm run build pour la version PWA installable."