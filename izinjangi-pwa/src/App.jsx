import { useState, useEffect, useCallback } from 'react'
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2,6)
import { SetupScreen, LockScreen, TontineSelectScreen, HomeScreen, MembresScreen, AddMembreScreen, PaiementScreen, ImpayesScreen, RapportScreen, ParametresScreen } from './screens/AllScreens'
import BottomNav from './components/BottomNav'

const uid = () => Math.random().toString(36).slice(2,10).toUpperCase()

// Helpers clés isolées par tontine
const key = (id, name) => `njangi_${id}_${name}`

export default function App() {
  const [loading,      setLoading]      = useState(true)
  const [appState,     setAppState]     = useState('select') // select | setup | locked | app
  const [tontines,     setTontines]     = useState([])       // liste des tontines
  const [activeTontineId, setActiveTontineId] = useState(null)
  const [config,       setConfig]       = useState(null)
  const [members,      setMembers]      = useState([])
  const [payments,     setPayments]     = useState([])
  const [payouts,      setPayouts]      = useState([])
  const [cycles,       setCycles]       = useState([])
  const [screen,       setScreen]       = useState('home')
  const [subScreen,    setSubScreen]    = useState(null)
  const [selectedMember, setSelectedMember] = useState(null)

  // Charger la liste des tontines au démarrage
  useEffect(() => {
    const list = JSON.parse(localStorage.getItem('njangi_tontines') || '[]')
    setTontines(list)
    setAppState(list.length > 0 ? 'select' : 'setup')
    setLoading(false)
  }, [])

  // Charger les données d'une tontine spécifique
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

  // Création d'une nouvelle tontine
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

  const handleRenew = (lastBenefId) => {
    // Nouveau cycle: incrementer currentCycle
    // Le dernier beneficiaire passe en premier (ses slots sont reorganises)
    const newCycle = (config.currentCycle || 1) + 1
    let newMembers = [...members]
    if (lastBenefId) {
      // Trouver le membre et ajouter un slot en premier ordre du nouveau cycle
      newMembers = members.map(m => {
        if (m.id === lastBenefId) {
          const newSlot = { slotId: genId(), order: 1, slotNum: (m.slots?.length || 1) + 1, cycle: newCycle }
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
    // Ajouter une place automatiquement a la suite pour un membre existant
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
    persist(activeTontineId, newMembers, undefined, undefined, undefined, updatedConfig)
    alert(`Place ajoutée — Tour #${nextOrder} attribué`)
  }

  const handleUpdateConfig = (cfg) => {
    setConfig(cfg)
    persist(activeTontineId, undefined, undefined, undefined, undefined, cfg)
    // Mettre à jour le nom dans la liste si changé
    const newList = tontines.map(t => t.id === activeTontineId ? { ...t, tontineName: cfg.tontineName } : t)
    setTontines(newList)
    localStorage.setItem('njangi_tontines', JSON.stringify(newList))
  }

  const handleReset = () => {
    // Supprimer uniquement la tontine active
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

  const handleDeleteTontine = (id) => {
    ;['config','members','payments','payouts','cycles'].forEach(k2 => localStorage.removeItem(key(id, k2)))
    const newList = tontines.filter(t => t.id !== id)
    setTontines(newList)
    localStorage.setItem('njangi_tontines', JSON.stringify(newList))
  }

  const nav = (sc) => { setSubScreen(null); setScreen(sc) }

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', backgroundColor:'#1D9E75' }}>
      <p style={{ color:'#fff', fontSize:18 }}>Chargement IZI NJANGI...</p>
    </div>
  )

  if (appState === 'select') return (
    <TontineSelectScreen
      tontines={tontines}
      onSelect={loadTontine}
      onNew={() => setAppState('setup')}
    />
  )

  if (appState === 'setup') return (
    <SetupScreen
      existingUsernames={tontines.map(t => t.username)}
      onDone={handleSetupDone}
      onBack={tontines.length > 0 ? () => setAppState('select') : null}
    />
  )

  if (appState === 'locked') return (
    <LockScreen config={config} onUnlock={handleUnlock} />
  )

  const wrap = (child) => (
    <div style={{ maxWidth:480, margin:'0 auto', height:'100vh', backgroundColor:'#F4F4F0', display:'flex', flexDirection:'column' }}>
      {child}
    </div>
  )

  if (subScreen === 'add-membre')  return wrap(<AddMembreScreen members={members} config={config} onBack={() => setSubScreen(null)} onSave={handleAddMember} />)
  if (subScreen === 'paiement')    return wrap(<PaiementScreen config={config} members={members} payments={payments} onSave={handlePayment} onBack={() => setSubScreen(null)} />)
  if (subScreen === 'impayes')     return wrap(<ImpayesScreen config={config} members={members} payments={payments} payouts={payouts} onBack={() => setSubScreen(null)} onPay={(m) => { setSubScreen('paiement') }} />)

  const mainContent = () => {
    switch(screen) {
      case 'home':      return <HomeScreen config={config} members={members} payments={payments} payouts={payouts} cycles={cycles} nav={(sc) => { if(['paiement','versement','impayes','paiements'].includes(sc)) setSubScreen(sc); else setScreen(sc) }} />
      case 'membres':   return <MembresScreen members={members} payments={payments} config={config} onAddMember={() => setSubScreen('add-membre')} onSelectMember={(m) => { setSelectedMember(m); setSubScreen('fiche') }} onAddSlot={handleAddSlot} />
      case 'paiements': return <PaiementScreen config={config} members={members} payments={payments} onSave={handlePayment} onBack={() => setScreen('home')} />
      case 'rapport':   return <RapportScreen config={config} members={members} payments={payments} payouts={payouts} cycles={cycles} onPayout={handlePayout} onRenew={handleRenew} onUpdateConfig={handleUpdateConfig} onBack={() => setScreen('home')} />
      case 'settings':  return <ParametresScreen config={config} members={members} payments={payments} payouts={payouts} onUpdateConfig={handleUpdateConfig} onReset={handleReset} onSwitchTontine={() => setAppState('select')} />
      default: return <div style={{ padding:20, textAlign:'center', color:'#5F5E5A', marginTop:40 }}><p style={{ fontSize:16 }}>Ecran "{screen}" — en construction</p></div>
    }
  }

  return (
    <div style={{ maxWidth:480, margin:'0 auto', height:'100vh', backgroundColor:'#F4F4F0', display:'flex', flexDirection:'column', position:'relative' }}>
      {mainContent()}
      <BottomNav current={screen} onNav={nav} />
    </div>
  )
}
