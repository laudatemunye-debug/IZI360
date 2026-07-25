import { useState, useEffect, useCallback } from 'react'
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2,6)
import { SetupScreen, LockScreen, TontineSelectScreen, HomeScreen, MembresScreen, AddMembreScreen, FicheMembreScreen, PaiementScreen, ImpayesScreen, RapportScreen, ParametresScreen, NotificationsScreen } from '../../screens/AllScreens'
import BottomNav from '../../components/BottomNav'
import { tontineKey, getTontinesForAssociation, saveTontinesForAssociation } from '../../data/associations'

const uid = () => Math.random().toString(36).slice(2,10).toUpperCase()

export default function TontineModule({ assocId, onExit }) {
  const key = (tontineId, field) => tontineKey(assocId, tontineId, field)

  const [loading,      setLoading]      = useState(true)
  const [appState,     setAppState]     = useState('select')
  const [tontines,     setTontines]     = useState([])
  const [activeTontineId, setActiveTontineId] = useState(null)
  const [config,       setConfig]       = useState(null)
  const [members,      setMembers]      = useState([])
  const [payments,     setPayments]     = useState([])
  const [payouts,      setPayouts]      = useState([])
  const [cycles,       setCycles]       = useState([])
  const [forcedAdvances, setForcedAdvances] = useState([])
  const [screen,       setScreen]       = useState('home')
  const [subScreen,    setSubScreen]    = useState(null)
  const [selectedMember, setSelectedMember] = useState(null)
  const [prefillMemberId, setPrefillMemberId] = useState(null)

  useEffect(() => {
    const list = getTontinesForAssociation(assocId)
    setTontines(list)
    setAppState(list.length > 0 ? 'select' : 'setup')
    setLoading(false)
  }, [assocId])

  const loadTontine = (id) => {
    const cfg = localStorage.getItem(key(id, 'config'))
    if (!cfg) return
    setActiveTontineId(id)
    setConfig(JSON.parse(cfg))
    setMembers(JSON.parse(localStorage.getItem(key(id, 'members')) || '[]'))
    setPayments(JSON.parse(localStorage.getItem(key(id, 'payments')) || '[]'))
    setPayouts(JSON.parse(localStorage.getItem(key(id, 'payouts')) || '[]'))
    setCycles(JSON.parse(localStorage.getItem(key(id, 'cycles')) || '[]'))
    setForcedAdvances(JSON.parse(localStorage.getItem(key(id, 'forcedAdvances')) || '[]'))
    setScreen('home')
    setSubScreen(null)
    setAppState('locked')
  }

  const persist = useCallback((id, m, p, py, cy, cfg, fa) => {
    if (!id) return
    if (m   !== undefined) localStorage.setItem(key(id,'members'),  JSON.stringify(m))
    if (p   !== undefined) localStorage.setItem(key(id,'payments'), JSON.stringify(p))
    if (py  !== undefined) localStorage.setItem(key(id,'payouts'),  JSON.stringify(py))
    if (cy  !== undefined) localStorage.setItem(key(id,'cycles'),   JSON.stringify(cy))
    if (cfg !== undefined) localStorage.setItem(key(id,'config'),   JSON.stringify(cfg))
    if (fa  !== undefined) localStorage.setItem(key(id,'forcedAdvances'), JSON.stringify(fa))
  }, [assocId])

  const handleSetupDone = (cfg) => {
    const id = uid()
    const nowISO = new Date().toISOString()
    const fullCfg = { ...cfg, id, createdAt: nowISO, currentCycle: 1, nbSlots: 0, nbMembers: 0, penaltyRate: 0 }
    const entry = { id, tontineName: cfg.tontineName, username: cfg.username, createdAt: nowISO }
    const newList = [...tontines, entry]
    setTontines(newList)
    saveTontinesForAssociation(assocId, newList)
    localStorage.setItem(key(id,'config'),   JSON.stringify(fullCfg))
    localStorage.setItem(key(id,'members'),  JSON.stringify([]))
    localStorage.setItem(key(id,'payments'), JSON.stringify([]))
    localStorage.setItem(key(id,'payouts'),  JSON.stringify([]))
    localStorage.setItem(key(id,'cycles'),   JSON.stringify([{ id: Math.random().toString(36).slice(2), number:1, status:'en_cours', startedAt: nowISO }]))
    localStorage.setItem(key(id,'forcedAdvances'), JSON.stringify([]))
    setActiveTontineId(id)
    setConfig(fullCfg)
    setMembers([]); setPayments([]); setPayouts([]); setCycles([])
    setScreen('home'); setSubScreen(null)
    setAppState('app')
  }

  const handleUnlock = () => setAppState('app')

  // Construit et ouvre le message WhatsApp de bienvenue, envoyé automatiquement
  // après l'inscription d'un membre, avec les infos clés de la tontine.
  const sendWelcomeWhatsApp = (member) => {
    const sym = config.currency?.symbol || config.currency?.code || ''
    const lines = [
      `Bienvenue dans la tontine "${config.tontineName}" !`,
      config.description ? `\n${config.description}` : '',
      config.reglement ? `\nRèglement : ${config.reglement}` : '',
      `\nCotisation : ${config.cotisation} ${sym}${config.frequency ? ' (' + config.frequency + ')' : ''}`,
      config.penaltyRate ? `Pénalité de retard : ${config.penaltyRate}%` : '',
      config.fraisDeuil ? `Frais de deuil : ${config.fraisDeuil} ${sym}` : '',
      config.fraisCaisse ? `Frais de caisse : ${config.fraisCaisse} ${sym}` : '',
      `\nVotre/vos tour(s) : #${(member.slots || []).map(s => s.order).join(', #')}`,
    ].filter(Boolean)
    const message = lines.join('\n')
    const digits = (member.phone || '').replace(/[^0-9]/g, '')
    const url = digits
      ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  const handleAddMember = (member, catchupPayments = []) => {
    const m = [...members, member]
    setMembers(m)
    const totalSlots = m.reduce((s, mb) => s + (mb.slots?.length || 1), 0)
    const updatedConfig = { ...config, nbSlots: totalSlots, nbMembers: totalSlots }
    setConfig(updatedConfig)
    const p = catchupPayments.length ? [...payments, ...catchupPayments] : undefined
    if (p) setPayments(p)
    persist(activeTontineId, m, p, undefined, undefined, updatedConfig)
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
    let fa = forcedAdvances
    if (payment.type === 'cotisation') {
      fa = forcedAdvances.filter(f => !(f.memberId === payment.memberId && f.cycle === payment.cycle))
      if (fa.length !== forcedAdvances.length) setForcedAdvances(fa)
    }
    persist(activeTontineId, undefined, p, undefined, undefined, undefined, fa !== forcedAdvances ? fa : undefined)
  }

  const handlePaymentsBatch = (newPayments) => {
    const p = [...payments, ...newPayments]
    setPayments(p)
    const paidKeys = new Set(newPayments.filter(np => np.type === 'cotisation').map(np => np.memberId + '|' + np.cycle))
    const fa = forcedAdvances.filter(f => !paidKeys.has(f.memberId + '|' + f.cycle))
    if (fa.length !== forcedAdvances.length) {
      setForcedAdvances(fa)
      persist(activeTontineId, undefined, p, undefined, undefined, undefined, fa)
    } else {
      persist(activeTontineId, undefined, p)
    }
  }

  const handlePayout = (payout) => {
    const py = [...payouts, payout]
    setPayouts(py)
    persist(activeTontineId, undefined, undefined, py)
  }

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

  const handleForceAdvance = (unpaidMembers, cycle) => {
    const nowISO = new Date().toISOString()
    const entries = unpaidMembers.map(m => ({ id: genId(), cycle, memberId: m.id, memberName: m.name, createdAt: nowISO }))
    const fa = [...forcedAdvances, ...entries]
    setForcedAdvances(fa)
    persist(activeTontineId, undefined, undefined, undefined, undefined, undefined, fa)
    handleRenew(null)
  }

  const handleMemberExit = (memberId, exitPayments = [], refund = null) => {
    const newMembers = members.map(m => {
      if (m.id !== memberId) return m
      const updated = { ...m, status: 'sorti' }
      if (refund) { updated.refundDue = refund.amount; updated.refundOrder = refund.order; updated.refundResolved = false }
      return updated
    })
    setMembers(newMembers)
    if (selectedMember?.id === memberId) setSelectedMember(newMembers.find(m => m.id === memberId))
    let p
    if (exitPayments.length) { p = [...payments, ...exitPayments]; setPayments(p) }
    persist(activeTontineId, newMembers, p, undefined, undefined, undefined)
  }

  const handleAddSlot = (memberId, catchupCycles = 0) => {
    const allOrders = members.flatMap(m => m.slots ? m.slots.map(s => s.order) : [m.order || 1])
    const nextOrder = allOrders.length > 0 ? Math.max(...allOrders) + 1 : 1
    const targetMember = members.find(m => m.id === memberId)
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
    let p
    if (catchupCycles > 0 && targetMember) {
      const catchup = []
      for (let c = 1; c <= catchupCycles; c++) {
        catchup.push({ id: 'ctp_' + genId(), memberId, memberName: targetMember.name, slotOrder: nextOrder, cycle: c, type: 'cotisation', amount: config.cotisation || 0, mode: 'Rattrapage', date: new Date().toISOString().slice(0,10), note: 'Cotisation de rattrapage (adhésion tardive)', receiptNum: 'REC-' + Date.now().toString().slice(-6), lateJoin: true })
      }
      p = [...payments, ...catchup]
      setPayments(p)
    }
    persist(activeTontineId, newMembers, p, undefined, undefined, updatedConfig)
  }

  const handleRemoveSlot = (memberId, slotId) => {
    const newMembers = members.map(m => {
      if (m.id === memberId) {
        const currentSlots = m.slots || [{slotId: 'single', order: m.order || 1, slotNum: 1}]
        if (currentSlots.length <= 1) return m
        const filtered = currentSlots.filter(s => s.slotId !== slotId).map((s, i) => ({ ...s, slotNum: i + 1 }))
        return { ...m, slots: filtered, order: filtered[0]?.order }
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
    saveTontinesForAssociation(assocId, newList)
  }

  const handleReset = () => {
    if (!activeTontineId) return
    ;['config','members','payments','payouts','cycles','forcedAdvances'].forEach(k2 => localStorage.removeItem(key(activeTontineId, k2)))
    const newList = tontines.filter(t => t.id !== activeTontineId)
    setTontines(newList)
    saveTontinesForAssociation(assocId, newList)
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
    <TontineSelectScreen tontines={tontines} onSelect={loadTontine} onNew={() => setAppState('setup')} onExit={onExit} />
  )

  if (appState === 'setup') return (
    <SetupScreen
      existingUsernames={tontines.map(t => t.username)}
      onDone={handleSetupDone}
      onBack={tontines.length > 0 ? () => setAppState('select') : onExit}
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
    <AddMembreScreen members={members} config={config} payouts={payouts} onBack={() => setSubScreen(null)} onSave={handleAddMember} />
  )

  if (subScreen === 'fiche' && selectedMember) return wrap(
    <FicheMembreScreen
      member={selectedMember}
      members={members}
      payments={payments}
      payouts={payouts}
      config={config}
      onBack={() => { setSubScreen(null); setSelectedMember(null) }}
      onUpdate={handleUpdateMember}
      onDelete={handleDeleteMember}
      onAddSlot={handleAddSlot}
      onRemoveSlot={handleRemoveSlot}
      onExit={handleMemberExit}
    />
  )

  if (subScreen === 'paiement' || subScreen === 'versement') return wrap(
    <PaiementScreen
      config={config} members={members} payments={payments}
      preselectMemberId={prefillMemberId}
      onSave={handlePayment}
      onSaveBatch={handlePaymentsBatch}
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

  if (subScreen === 'notifications') return wrap(
    <NotificationsScreen
      config={config} members={members} payments={payments} payouts={payouts} forcedAdvances={forcedAdvances}
      onBack={() => setSubScreen(null)}
      onPay={(memberId) => { setPrefillMemberId(memberId); setSubScreen('paiement') }}
      onVerser={() => { setSubScreen(null); setScreen('rapport') }}
    />
  )

  const mainContent = () => {
    switch(screen) {
      case 'home':
        return <HomeScreen config={config} members={members} payments={payments} payouts={payouts} cycles={cycles} forcedAdvances={forcedAdvances}
          nav={(sc) => {
            if (sc === 'paiement') setSubScreen('paiement')
            else if (sc === 'impayes') setSubScreen('impayes')
            else if (sc === 'notifications') setSubScreen('notifications')
            else if (sc === 'versement') setScreen('rapport')
            else setScreen(sc)
          }} />
      case 'membres':
        return <MembresScreen members={members} payments={payments} config={config}
          onAddMember={() => setSubScreen('add-membre')}
          onSelectMember={(m) => { setSelectedMember(m); setSubScreen('fiche') }} />
      case 'paiements':
        return <PaiementScreen config={config} members={members} payments={payments} onSave={handlePayment} onSaveBatch={handlePaymentsBatch} onBack={() => setScreen('home')} />
      case 'rapport':
        return <RapportScreen config={config} members={members} payments={payments} payouts={payouts} cycles={cycles} forcedAdvances={forcedAdvances}
          onPayout={handlePayout} onRenew={handleRenew} onForceAdvance={handleForceAdvance} onUpdateConfig={handleUpdateConfig} onBack={() => setScreen('home')} />
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
