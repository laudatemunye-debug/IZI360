import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2,6)
import * as ScreensLight from './AllScreens'
import * as ScreensDark from './AllScreensDark'
import BottomNav from './BottomNav'

const uid = () => Math.random().toString(36).slice(2,10).toUpperCase()
const key = (id, name) => `njangi_${id}_${name}`

export default function JangiApp() {
  const navigate = useNavigate()
  const [darkMode,        setDarkMode]        = useState(true)
  const S = darkMode ? ScreensDark : ScreensLight
  const TontineSelectScreen = S.TontineSelectScreen
  const SetupScreen = S.SetupScreen
  const LockScreen = S.LockScreen
  const HomeScreen = S.HomeScreen
  const MembresScreen = S.MembresScreen
  const AddMembreScreen = S.AddMembreScreen
  const PaiementScreen = S.PaiementScreen
  const ImpayesScreen = S.ImpayesScreen
  const RapportScreen = S.RapportScreen
  const ParametresScreen = S.ParametresScreen
  const [loading,         setLoading]         = useState(true)
  const [appState,        setAppState]        = useState('select')
  const [tontines,        setTontines]        = useState([])
  const [activeTontineId, setActiveTontineId] = useState(null)
  const [config,          setConfig]          = useState(null)
  const [members,         setMembers]         = useState([])
  const [payments,        setPayments]        = useState([])
  const [payouts,         setPayouts]         = useState([])
  const [cycles,          setCycles]          = useState([])
  const [screen,          setScreen]          = useState('home')
  const [subScreen,       setSubScreen]       = useState(null)
  const [selectedMember,  setSelectedMember]  = useState(null)

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
    setScreen('home'); setSubScreen(null)
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
    setActiveTontineId(id); setConfig(fullCfg)
    setMembers([]); setPayments([]); setPayouts([]); setCycles([])
    setScreen('home'); setSubScreen(null)
    setAppState('app')
  }

  const handleUnlock     = () => setAppState('app')
  const handleAddMember  = (member) => {
    const m = [...members, member]
    setMembers(m)
    const totalSlots = m.reduce((s, mb) => s + (mb.slots?.length || 1), 0)
    const updatedConfig = { ...config, nbSlots: totalSlots, nbMembers: totalSlots }
    setConfig(updatedConfig)
    persist(activeTontineId, m, undefined, undefined, undefined, updatedConfig)
    setSubScreen(null)
  }
  const handlePayment    = (payment) => { const p = [...payments, payment]; setPayments(p); persist(activeTontineId, undefined, p) }
  const handlePayout     = (payout)  => { const py = [...payouts, payout];  setPayouts(py); persist(activeTontineId, undefined, undefined, py) }
  const handleRenew      = (lastBenefId) => {
    const newCycle = (config.currentCycle || 1) + 1
    let newMembers = [...members]
    if (lastBenefId) {
      newMembers = members.map(m => {
        if (m.id === lastBenefId) {
          const newSlot = { slotId: genId(), order: 1, slotNum: (m.slots?.length || 1) + 1, cycle: newCycle }
          return { ...m, slots: [...(m.slots || []), newSlot] }
        }
        return m
      })
    }
    const updatedConfig = { ...config, currentCycle: newCycle }
    setConfig(updatedConfig); setMembers(newMembers)
    persist(activeTontineId, newMembers, undefined, undefined, undefined, updatedConfig)
  }
  const handleAddSlot    = (memberId) => {
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
    setConfig(updatedConfig); setMembers(newMembers)
    persist(activeTontineId, newMembers, undefined, undefined, undefined, updatedConfig)
    alert(`Place ajoutée — Tour #${nextOrder} attribué`)
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

  const nav    = (sc) => { setSubScreen(null); setScreen(sc) }
  const goHome = () => navigate('/')

  // Toggle button flottant
  const ThemeToggle = () => (
    <button onClick={() => setDarkMode(d => !d)} style={{
      position: 'fixed', top: 12, right: 12, zIndex: 999,
      backgroundColor: darkMode ? 'rgba(29,158,117,0.2)' : 'rgba(29,158,117,0.1)',
      border: '1px solid rgba(29,158,117,0.4)',
      borderRadius: '8px', padding: '6px 10px',
      cursor: 'pointer', fontSize: '14px',
      color: '#1D9E75', fontWeight: '600'
    }}>
      {darkMode ? '☀️' : '🌙'}
    </button>
  )

  const dm = { darkMode }

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', backgroundColor: darkMode ? '#0F1117' : '#F7F8FA' }}>
      <p style={{ color:'#1D9E75', fontSize:18, fontWeight:600 }}>Chargement IZI JANGI...</p>
    </div>
  )

  if (appState === 'select') return (<><ThemeToggle/><TontineSelectScreen tontines={tontines} onSelect={loadTontine} onNew={() => setAppState('setup')} onBack={goHome} {...dm}/></>)
  if (appState === 'setup')  return (<><ThemeToggle/><SetupScreen existingUsernames={tontines.map(t => t.username)} onDone={handleSetupDone} onBack={tontines.length > 0 ? () => setAppState('select') : goHome} {...dm}/></>)
  if (appState === 'locked') return (<><ThemeToggle/><LockScreen config={config} onUnlock={handleUnlock} onBack={goHome} {...dm}/></>)

  const wrapStyle = { maxWidth:480, margin:'0 auto', height:'100vh', backgroundColor: darkMode ? '#0F1117' : '#F7F8FA', display:'flex', flexDirection:'column' }

  const wrap = (child) => <div style={wrapStyle}><ThemeToggle/>{child}</div>

  if (subScreen === 'add-membre') return wrap(<AddMembreScreen members={members} config={config} onBack={() => setSubScreen(null)} onSave={handleAddMember} {...dm}/>)
  if (subScreen === 'paiement')   return wrap(<PaiementScreen config={config} members={members} payments={payments} onSave={handlePayment} onBack={() => setSubScreen(null)} {...dm}/>)
  if (subScreen === 'impayes')    return wrap(<ImpayesScreen config={config} members={members} payments={payments} payouts={payouts} onBack={() => setSubScreen(null)} onPay={() => setSubScreen('paiement')} {...dm}/>)

  const mainContent = () => {
    switch(screen) {
      case 'home':      return <HomeScreen config={config} members={members} payments={payments} payouts={payouts} cycles={cycles} nav={(sc) => { if(['paiement','versement','impayes','paiements'].includes(sc)) setSubScreen(sc); else setScreen(sc) }} {...dm}/>
      case 'membres':   return <MembresScreen members={members} payments={payments} config={config} onAddMember={() => setSubScreen('add-membre')} onSelectMember={(m) => { setSelectedMember(m); setSubScreen('fiche') }} onAddSlot={handleAddSlot} {...dm}/>
      case 'paiements': return <PaiementScreen config={config} members={members} payments={payments} onSave={handlePayment} onBack={() => setScreen('home')} {...dm}/>
      case 'rapport':   return <RapportScreen config={config} members={members} payments={payments} payouts={payouts} cycles={cycles} onPayout={handlePayout} onRenew={handleRenew} onUpdateConfig={handleUpdateConfig} onBack={() => setScreen('home')} {...dm}/>
      case 'settings':  return <ParametresScreen config={config} members={members} payments={payments} payouts={payouts} onUpdateConfig={handleUpdateConfig} onReset={handleReset} onSwitchTontine={() => setAppState('select')} {...dm}/>
      default: return <div style={{ padding:20, textAlign:'center', color:'#9CA3AF', marginTop:40 }}>Écran en construction</div>
    }
  }

  return (
    <div style={{ ...wrapStyle, position:'relative' }}>
      <ThemeToggle/>
      {mainContent()}
      <BottomNav current={screen} onNav={nav} darkMode={darkMode}/>
    </div>
  )
}
