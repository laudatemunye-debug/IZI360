import { useState } from 'react'

const C = {
  g:'#1D9E75', gd:'#085041', gl:'#E1F5EE', g2:'#0F6E56',
  amb:'#BA7517', ambl:'#FAEEDA', ambd:'#633806',
  rd:'#E24B4A', rdl:'#FCEBEB',
  bl:'#378ADD', bll:'#E6F1FB', bld:'#0C447C',
  gr:'#F1EFE8', grb:'#D3D1C7',
  bg:'#F4F4F0', white:'#FFFFFF', text:'#1A1A1A', text2:'#5F5E5A',
  pur:'#EEEDFE', purd:'#3C3489',
}

const fmt = (n, sym) => `${Number(n||0).toLocaleString('fr-FR')} ${sym}`
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' }) : ''
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2,6)
const genRec = () => 'REC-' + Date.now().toString().slice(-6)

const MODES = ['Espèces','Mobile Money','Virement','Orange Money','Wave','Autre']
const TYPES = [
  { key:'cotisation',  label:'Cotisation',         icon:'💳', sub:'Cycle en cours' },
  { key:'avance',      label:'Cotisation en avance',icon:'⏩', sub:'Cycle futur'    },
  { key:'penalite',    label:'Pénalité / retard',   icon:'⚠️', sub:'Frais de retard' },
  { key:'versement',   label:'Versement cagnotte',  icon:'📤', sub:'À un bénéficiaire' },
]

function Recu({ receipt, config, onBack, onNew }) {
  const sym = config.currency?.symbol || config.currency?.code || 'F'
  const typeLabel = TYPES.find(t=>t.key===receipt.type)?.label || receipt.type

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', backgroundColor:C.g }}>
      <div style={{ padding:'20px 16px 12px', display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={onBack} style={{ background:'none', border:'none', color:'#fff', fontSize:26, cursor:'pointer' }}>‹</button>
        <div style={{ color:'#fff', fontSize:17, fontWeight:700 }}>Reçu de paiement</div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'0 16px 16px' }}>
        {/* Carte reçu */}
        <div style={{ backgroundColor:C.white, borderRadius:16, overflow:'hidden', boxShadow:'0 4px 20px rgba(0,0,0,0.15)' }}>
          {/* En-tête reçu */}
          <div style={{ backgroundColor:C.g, padding:'20px 16px', textAlign:'center' }}>
            <div style={{ width:56, height:56, backgroundColor:'rgba(255,255,255,0.2)', borderRadius:28, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 10px' }}>
              <span style={{ fontSize:28 }}>✓</span>
            </div>
            <div style={{ color:'#fff', fontSize:13, fontWeight:600, letterSpacing:0.5 }}>PAIEMENT ENREGISTRÉ</div>
            <div style={{ color:'rgba(255,255,255,0.85)', fontSize:11, marginTop:4 }}>{config.tontineName}</div>
          </div>

          {/* Montant */}
          <div style={{ textAlign:'center', padding:'20px 16px 12px', borderBottom:`1px dashed ${C.grb}` }}>
            <div style={{ fontSize:11, color:C.text2, marginBottom:4 }}>Montant total</div>
            <div style={{ fontSize:32, fontWeight:800, color:C.g, letterSpacing:-1 }}>{fmt(receipt.amount, sym)}</div>
            {receipt.penalty > 0 && (
              <div style={{ fontSize:11, color:C.amb, marginTop:4 }}>
                dont {fmt(receipt.penalty, sym)} de pénalité
              </div>
            )}
          </div>

          {/* Détails */}
          <div style={{ padding:'12px 16px', display:'flex', flexDirection:'column', gap:10 }}>
            {[
              { l:'N° Reçu',     v: receipt.receiptNum },
              { l:'Type',        v: typeLabel },
              { l:'Membre',      v: receipt.memberName },
              { l:'Cycle',       v: receipt.cycle ? `Cycle ${receipt.cycle}` : '—' },
              { l:'Mode',        v: receipt.mode },
              { l:'Date',        v: fmtDate(receipt.date) },
              ...(receipt.note ? [{ l:'Note', v: receipt.note }] : []),
            ].map(({ l, v }) => (
              <div key={l} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:12, color:C.text2 }}>{l}</span>
                <span style={{ fontSize:13, fontWeight:600, color:C.text, maxWidth:'60%', textAlign:'right' }}>{v}</span>
              </div>
            ))}
          </div>

          <div style={{ margin:'0 16px', height:1, backgroundColor:C.grb }} />

          <div style={{ padding:'10px 16px 16px', textAlign:'center' }}>
            <div style={{ fontSize:10, color:C.text2, letterSpacing:0.4 }}>Powered by IZIsoft · IZI NJANGI v1.0</div>
          </div>
        </div>

        {/* Boutons */}
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:16 }}>
          <button onClick={() => window.print()} style={{ backgroundColor:C.white, color:C.g, border:`2px solid ${C.g}`, borderRadius:12, padding:13, fontSize:14, fontWeight:700, cursor:'pointer' }}>
            🖨️ Imprimer le reçu
          </button>
          <button onClick={onNew} style={{ backgroundColor:C.white, color:C.text2, border:`1px solid ${C.grb}`, borderRadius:12, padding:13, fontSize:14, fontWeight:600, cursor:'pointer' }}>
            + Nouveau paiement
          </button>
          <button onClick={onBack} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.8)', fontSize:13, cursor:'pointer', padding:8 }}>
            ← Retour
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PaiementScreen({ config, members, payments, onSave, onBack }) {
  const sym = config.currency?.symbol || config.currency?.code || 'F'
  const base = Number(config.cotisation || 0)
  const currentCycle = config.currentCycle || 1
  const maxCycle = config.nbMembers || members.length || 1

  const [view, setView] = useState('form')
  const [receipt, setReceipt] = useState(null)
  const [type, setType] = useState('cotisation')
  const [form, setForm] = useState({
    memberId: '',
    cycle: currentCycle,
    amount: base,
    penalty: 0,
    mode: 'Espèces',
    date: new Date().toISOString().split('T')[0],
    note: '',
  })
  const [errors, setErrors] = useState({})

  const f = (patch) => { setForm(p => ({ ...p, ...patch })); setErrors({}) }

  const activeMembers = members.filter(m => m.status !== 'sorti')
  const member = members.find(m => m.id === form.memberId)

  const alreadyPaid = form.memberId
    ? payments.some(p => p.memberId === form.memberId && p.cycle === Number(form.cycle) && p.type === 'cotisation')
    : false

  const isVersement = type === 'versement'
  const total = isVersement ? Number(form.amount || 0) : Number(form.amount || 0) + Number(form.penalty || 0)

  const validate = () => {
    const e = {}
    if (!form.memberId) e.memberId = 'Sélectionnez un membre.'
    if (!form.amount || Number(form.amount) <= 0) e.amount = 'Montant invalide.'
    if ((type === 'cotisation' || type === 'avance') && alreadyPaid) e.doublon = `${member?.name} a déjà payé le cycle ${form.cycle}.`
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = () => {
    if (!validate()) return
    const r = {
      id: genId(),
      type,
      memberId: form.memberId,
      memberName: member?.name || '',
      cycle: Number(form.cycle),
      amount: total,
      baseAmount: Number(form.amount),
      penalty: Number(form.penalty || 0),
      mode: form.mode,
      date: form.date,
      note: form.note,
      receiptNum: genRec(),
    }
    onSave(r)
    setReceipt(r)
    setView('recu')
  }

  const reset = () => {
    setView('form')
    setReceipt(null)
    setType('cotisation')
    setForm({ memberId:'', cycle:currentCycle, amount:base, penalty:0, mode:'Espèces', date:new Date().toISOString().split('T')[0], note:'' })
    setErrors({})
  }

  if (view === 'recu') return (
    <Recu receipt={receipt} config={config} onBack={onBack} onNew={reset} />
  )

  const lbl = { fontSize:12, fontWeight:600, color:C.text2, marginBottom:3, display:'block' }
  const inp = { backgroundColor:C.white, border:`1px solid ${C.grb}`, borderRadius:8, padding:'10px 12px', fontSize:14, width:'100%', color:C.text, outline:'none', marginTop:4, boxSizing:'border-box' }
  const errInp = { ...inp, border:`1px solid ${C.rd}` }

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ backgroundColor:C.g, padding:'14px 16px 16px', display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={onBack} style={{ background:'none', border:'none', color:'#fff', fontSize:26, cursor:'pointer' }}>‹</button>
        <div>
          <div style={{ color:'#fff', fontSize:17, fontWeight:700 }}>Enregistrer un paiement</div>
          <div style={{ color:'rgba(255,255,255,0.8)', fontSize:11, marginTop:2 }}>Cycle {currentCycle} · {config.tontineName}</div>
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:14 }}>

        {/* Type de paiement */}
        <div>
          <label style={lbl}>Type de paiement *</label>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:4 }}>
            {TYPES.map(t => (
              <button key={t.key} onClick={() => { setType(t.key); setErrors({}); if(t.key!=='versement') f({ amount: base }) }}
                style={{ backgroundColor: type===t.key ? C.gl : C.white, border:`2px solid ${type===t.key ? C.g : C.grb}`, borderRadius:10, padding:'10px 8px', cursor:'pointer', textAlign:'left' }}>
                <div style={{ fontSize:18, marginBottom:4 }}>{t.icon}</div>
                <div style={{ fontSize:12, fontWeight:700, color: type===t.key ? C.gd : C.text }}>{t.label}</div>
                <div style={{ fontSize:10, color:C.text2, marginTop:2 }}>{t.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Membre */}
        <div>
          <label style={lbl}>Membre *</label>
          <select style={errors.memberId ? errInp : inp} value={form.memberId}
            onChange={e => f({ memberId: e.target.value })}>
            <option value="">— Sélectionner un membre —</option>
            {activeMembers.sort((a,b)=>(a.order||0)-(b.order||0)).map(m => {
              const paid = payments.some(p => p.memberId===m.id && p.cycle===Number(form.cycle) && p.type==='cotisation')
              return <option key={m.id} value={m.id}>{paid ? '✓ ' : ''}{m.name} (Tour #{m.order})</option>
            })}
          </select>
          {errors.memberId && <p style={{ color:C.rd, fontSize:12, marginTop:4 }}>⚠ {errors.memberId}</p>}
        </div>

        {/* Alerte doublon */}
        {errors.doublon && (
          <div style={{ backgroundColor:C.rdl, border:`1px solid ${C.rd}`, borderRadius:8, padding:'10px 12px' }}>
            <p style={{ color:C.rd, fontSize:13, fontWeight:600, margin:0 }}>❌ {errors.doublon}</p>
          </div>
        )}

        {/* Alerte déjà payé (sans erreur submit) */}
        {alreadyPaid && !errors.doublon && (
          <div style={{ backgroundColor:C.ambl, border:`1px solid #FAC775`, borderRadius:8, padding:'8px 12px' }}>
            <p style={{ color:C.ambd, fontSize:12, margin:0 }}>⚠ Ce membre a déjà une cotisation enregistrée pour le cycle {form.cycle}.</p>
          </div>
        )}

        {/* Cycle */}
        {(type === 'cotisation' || type === 'avance' || type === 'penalite') && (
          <div>
            <label style={lbl}>Cycle concerné *</label>
            <select style={inp} value={form.cycle} onChange={e => f({ cycle: e.target.value })}>
              {Array.from({ length: maxCycle }, (_, i) => i + 1).map(n => (
                <option key={n} value={n}>Cycle {n}{n === currentCycle ? ' (en cours)' : n < currentCycle ? ' (passé)' : ' (futur)'}</option>
              ))}
            </select>
          </div>
        )}

        {/* Montant */}
        <div style={{ display:'flex', gap:8 }}>
          <div style={{ flex:2 }}>
            <label style={lbl}>{isVersement ? 'Montant versé *' : 'Cotisation *'}</label>
            <input style={errors.amount ? errInp : inp} type="number" min="0"
              value={form.amount} onChange={e => f({ amount: e.target.value })} />
            {errors.amount && <p style={{ color:C.rd, fontSize:12, marginTop:4 }}>⚠ {errors.amount}</p>}
          </div>
          {type === 'penalite' && (
            <div style={{ flex:1 }}>
              <label style={lbl}>Pénalité</label>
              <input style={inp} type="number" min="0"
                value={form.penalty} onChange={e => f({ penalty: e.target.value })} />
            </div>
          )}
        </div>

        {/* Total */}
        {total > 0 && (
          <div style={{ backgroundColor:C.gl, borderRadius:8, padding:'10px 12px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:13, color:C.gd, fontWeight:600 }}>Total à enregistrer</span>
            <span style={{ fontSize:18, fontWeight:800, color:C.g }}>{fmt(total, sym)}</span>
          </div>
        )}

        {/* Mode + Date */}
        <div style={{ display:'flex', gap:8 }}>
          <div style={{ flex:1 }}>
            <label style={lbl}>Mode de paiement</label>
            <select style={inp} value={form.mode} onChange={e => f({ mode: e.target.value })}>
              {MODES.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div style={{ flex:1 }}>
            <label style={lbl}>Date</label>
            <input style={inp} type="date" value={form.date} onChange={e => f({ date: e.target.value })} />
          </div>
        </div>

        {/* Note */}
        <div>
          <label style={lbl}>Note (optionnel)</label>
          <input style={inp} type="text" placeholder="Ex: Paiement anticipé..."
            value={form.note} onChange={e => f({ note: e.target.value })} />
        </div>

        {/* Bouton submit */}
        <button onClick={submit}
          style={{ backgroundColor: alreadyPaid && (type==='cotisation'||type==='avance') ? C.grb : C.g, color:'#fff', border:'none', borderRadius:12, padding:14, fontSize:15, fontWeight:700, cursor: alreadyPaid && (type==='cotisation'||type==='avance') ? 'not-allowed' : 'pointer', opacity: alreadyPaid && (type==='cotisation'||type==='avance') ? 0.6 : 1, marginBottom:16 }}>
          Enregistrer ✓
        </button>
      </div>
    </div>
  )
}
