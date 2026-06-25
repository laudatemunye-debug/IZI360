import { useState } from 'react'

const C = {
  g: '#1D9E75', gd: '#085041', gl: '#E1F5EE',
  text: '#1A1A1A', text2: '#5F5E5A', grb: '#D3D1C7',
  white: '#FFFFFF', bg: '#F4F4F0', ambl: '#FAEEDA', ambd: '#633806',
}

const CURRENCIES = [
  { code:'FCFA', symbol:'FCFA', name:'Franc CFA BCEAO' },
  { code:'XAF',  symbol:'XAF',  name:'Franc CFA BEAC' },
  { code:'USD',  symbol:'$',    name:'Dollar américain' },
  { code:'EUR',  symbol:'€',    name:'Euro' },
  { code:'GBP',  symbol:'£',    name:'Livre sterling' },
  { code:'NGN',  symbol:'₦',    name:'Naira nigérian' },
  { code:'GHS',  symbol:'₵',    name:'Cedi ghanéen' },
  { code:'ZAR',  symbol:'R',    name:'Rand sud-africain' },
  { code:'CDF',  symbol:'FC',   name:'Franc congolais' },
  { code:'MAD',  symbol:'DH',   name:'Dirham marocain' },
]

const uid = () => Math.random().toString(36).slice(2, 10).toUpperCase()
const nowISO = () => new Date().toISOString()

const Header = ({ title, sub, step, onBack }) => (
  <div style={{ backgroundColor: C.g, padding:'16px 16px 20px' }}>
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
      {step > 0 && (
        <button onClick={onBack} style={{ background:'none', border:'none', color:'#fff', fontSize:26, cursor:'pointer', lineHeight:1, padding:'0 8px 0 0' }}>‹</button>
      )}
      <div>
        <h2 style={{ color:'#fff', fontSize:17, fontWeight:700, margin:0 }}>{title}</h2>
        {sub && <p style={{ color:'rgba(255,255,255,0.8)', fontSize:11, margin:'2px 0 0' }}>{sub}</p>}
      </div>
    </div>
  </div>
)

export default function SetupScreen({ onDone }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    tontineName: '', adminName: '', phone: '',
    cotisation: '', frequency: 'Mensuel',
    currency: null, username: '', pin: '', pinConfirm: '',
  })
  const [currSearch, setCurrSearch] = useState('')
  const [pinError, setPinError] = useState('')

  const filtered = CURRENCIES.filter(c =>
    c.name.toLowerCase().includes(currSearch.toLowerCase()) ||
    c.code.toLowerCase().includes(currSearch.toLowerCase())
  )

  const back = () => setStep(s => s - 1)

  const next = () => {
    if (step === 1) {
      if (!form.tontineName.trim()) return alert('Nom de la tontine obligatoire.')
      if (!form.adminName.trim()) return alert('Votre nom est obligatoire.')
      if (!form.cotisation || isNaN(Number(form.cotisation))) return alert('Montant de cotisation invalide.')
    }
    if (step === 2 && !form.currency) return alert('Veuillez choisir une devise.')
    if (step === 3) {
      if (!form.username.trim()) return alert("Nom d'utilisateur obligatoire.")
      if (form.pin.length !== 4) return alert('Le PIN doit contenir 4 chiffres.')
      if (form.pin !== form.pinConfirm) { setPinError('Les PINs ne correspondent pas.'); return }
      handleCreate(); return
    }
    setStep(s => s + 1)
  }

  const handleCreate = () => {
    const config = {
      tontineName: form.tontineName, adminName: form.adminName,
      phone: form.phone, cotisation: Number(form.cotisation),
      frequency: form.frequency, currency: form.currency,
      username: form.username, pin: form.pin,
      createdAt: nowISO(), currentCycle: 1, nbMembers: 0,
    }
    localStorage.setItem('njangi_config', JSON.stringify(config))
    localStorage.setItem('njangi_members', JSON.stringify([]))
    localStorage.setItem('njangi_payments', JSON.stringify([]))
    localStorage.setItem('njangi_payouts', JSON.stringify([]))
    localStorage.setItem('njangi_cycles', JSON.stringify([{ id: uid(), number: 1, status: 'en_cours', startedAt: nowISO() }]))
    onDone(config)
  }

  const inp = { backgroundColor: C.white, border: `1px solid ${C.grb}`, borderRadius: 8, padding: '10px 12px', fontSize: 14, width: '100%', color: C.text, outline: 'none', marginTop: 4 }
  const lbl = { fontSize: 12, color: C.text2, fontWeight: 600 }
  const btn = { backgroundColor: C.g, color:'#fff', border:'none', borderRadius:12, padding:13, fontSize:15, fontWeight:700, cursor:'pointer', marginTop:8, width:'100%' }

  if (step === 0) return (
    <div style={{ height:'100vh', backgroundColor: C.g, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding: 24 }}>
      <div style={{ width:80, height:80, backgroundColor:'rgba(255,255,255,0.2)', borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20 }}>
        <span style={{ color:'#fff', fontSize:40, fontWeight:900 }}>✓</span>
      </div>
      <h1 style={{ color:'#fff', fontSize:32, fontWeight:800, letterSpacing:1 }}>IZI NJANGI</h1>
      <p style={{ color:'rgba(255,255,255,0.8)', fontSize:16, textAlign:'center', marginTop:8, lineHeight:'24px' }}>Gestion de tontine<br/>simple et fiable</p>
      <button onClick={() => setStep(1)} style={{ backgroundColor:'#fff', color: C.g, border:'none', borderRadius:14, padding:'14px 28px', marginTop:40, fontSize:16, fontWeight:800, cursor:'pointer' }}>
        Créer ma tontine →
      </button>
      <p style={{ color:'rgba(255,255,255,0.6)', fontSize:12, textAlign:'center', marginTop:20 }}>100% hors ligne · Données locales</p>
    </div>
  )

  if (step === 1) return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', backgroundColor: C.bg }}>
      <Header title="Nouvelle tontine" sub="Étape 1 / 3 — Informations" step={step} onBack={back} />
      <div style={{ flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:12 }}>
        {[
          { label:'Nom de la tontine *', key:'tontineName', placeholder:'Ex: Tontine Espoir 2026' },
          { label:'Votre nom (administrateur) *', key:'adminName', placeholder:'Ex: Mamadou Koné' },
          { label:'Votre téléphone', key:'phone', placeholder:'+237 6XX XX XX XX' },
          { label:'Montant de cotisation *', key:'cotisation', placeholder:'Ex: 65000', type:'number' },
        ].map(f => (
          <div key={f.key}>
            <label style={lbl}>{f.label}</label>
            <input style={inp} type={f.type||'text'} placeholder={f.placeholder}
              value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
          </div>
        ))}
        <div>
          <label style={lbl}>Fréquence</label>
          <div style={{ display:'flex', gap:8, marginTop:6, flexWrap:'wrap' }}>
            {['Mensuel','Bi-mensuel','Hebdomadaire','Journalier'].map(f => (
              <button key={f} onClick={() => setForm(p => ({ ...p, frequency: f }))}
                style={{ padding:'6px 12px', borderRadius:20, border:`1px solid ${form.frequency===f ? C.g : C.grb}`, backgroundColor: form.frequency===f ? C.gl : C.white, color: form.frequency===f ? C.gd : C.text2, fontSize:12, cursor:'pointer', fontWeight:500 }}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <button onClick={next} style={btn}>Suivant — Choisir la devise →</button>
      </div>
    </div>
  )

  if (step === 2) return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', backgroundColor: C.bg }}>
      <Header title="Devise" sub="Étape 2 / 3 — Sélectionnez votre devise" step={step} onBack={back} />
      <div style={{ padding:'12px 16px 8px' }}>
        <input style={inp} placeholder="Rechercher une devise..." value={currSearch} onChange={e => setCurrSearch(e.target.value)} />
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'0 16px', display:'flex', flexDirection:'column', gap:6 }}>
        {filtered.map(item => (
          <div key={item.code} onClick={() => setForm(p => ({ ...p, currency: item }))}
            style={{ display:'flex', justifyContent:'space-between', alignItems:'center', backgroundColor: form.currency?.code===item.code ? C.gl : C.white, border:`1px solid ${form.currency?.code===item.code ? C.g : C.grb}`, borderRadius:10, padding:12, cursor:'pointer' }}>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color: C.text }}>{item.code} — {item.symbol}</div>
              <div style={{ fontSize:12, color: C.text2, marginTop:2 }}>{item.name}</div>
            </div>
            {form.currency?.code===item.code && <span style={{ color: C.g, fontSize:20, fontWeight:700 }}>✓</span>}
          </div>
        ))}
      </div>
      <div style={{ padding:16 }}>
        <button onClick={next} style={{ ...btn, marginTop:0 }}>Suivant — Identifiants →</button>
      </div>
    </div>
  )

  if (step === 3) return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', backgroundColor: C.bg }}>
      <Header title="Identifiants de connexion" sub="Étape 3 / 3 — Sécurisez l'accès" step={step} onBack={back} />
      <div style={{ flex:1, padding:16, display:'flex', flexDirection:'column', gap:12 }}>
        <p style={{ fontSize:14, color: C.text2 }}>Ces identifiants protègent l'accès à votre tontine</p>
        <div>
          <label style={lbl}>Nom d'utilisateur *</label>
          <input style={inp} type="text" placeholder="Ex: admin"
            value={form.username} onChange={e => { setForm(p => ({ ...p, username: e.target.value })); setPinError('') }} />
        </div>
        <div>
          <label style={lbl}>Code PIN (4 chiffres) *</label>
          <input style={inp} type="password" inputMode="numeric" maxLength={4} placeholder="••••"
            value={form.pin} onChange={e => { setForm(p => ({ ...p, pin: e.target.value })); setPinError('') }} />
        </div>
        <div>
          <label style={lbl}>Confirmer le PIN *</label>
          <input style={inp} type="password" inputMode="numeric" maxLength={4} placeholder="••••"
            value={form.pinConfirm} onChange={e => { setForm(p => ({ ...p, pinConfirm: e.target.value })); setPinError('') }} />
        </div>
        {pinError && <p style={{ color:'#E24B4A', fontSize:12 }}>{pinError}</p>}
        <div style={{ backgroundColor: C.ambl, border:`1px solid #FAC775`, borderRadius:8, padding:10 }}>
          <p style={{ fontSize:12, color: C.ambd }}>⚠ Notez bien vos identifiants. En cas d'oubli, vous devrez réinitialiser l'app.</p>
        </div>
        <button onClick={next} style={btn}>Créer ma tontine ✓</button>
      </div>
    </div>
  )

  return null
}
