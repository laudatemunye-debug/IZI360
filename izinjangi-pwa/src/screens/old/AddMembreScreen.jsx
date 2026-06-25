import { useState } from 'react'

const C = {
  g:'#1D9E75', gd:'#085041', gl:'#E1F5EE',
  amb:'#BA7517', ambl:'#FAEEDA', ambd:'#633806',
  rd:'#E24B4A', rdl:'#FCEBEB',
  gr:'#F1EFE8', grb:'#D3D1C7',
  bg:'#F4F4F0', white:'#FFFFFF', text:'#1A1A1A', text2:'#5F5E5A',
}

export default function AddMembreScreen({ members, onBack, onSave }) {
  const [form, setForm] = useState({ name:'', phone:'', email:'', order:'', joinDate: new Date().toISOString().split('T')[0] })
  const [errors, setErrors] = useState({})

  const lbl = { fontSize:12, fontWeight:600, color:C.text2, marginBottom:3, display:'block' }
  const inp = { backgroundColor:C.white, border:`1px solid ${C.grb}`, borderRadius:8, padding:'10px 12px', fontSize:14, width:'100%', color:C.text, outline:'none', marginTop:4, boxSizing:'border-box' }
  const errInp = { ...inp, border:`1px solid ${C.rd}` }

  const validate = () => {
    const e = {}
    const trimName = form.name.trim()
    const trimPhone = form.phone.trim()

    if (!trimName) { e.name = 'Le nom est obligatoire.' }
    else if (members.some(m => m.name.toLowerCase() === trimName.toLowerCase())) {
      e.name = `Un membre "${trimName}" existe déjà.`
    }

    if (trimPhone && members.some(m => m.phone && m.phone.replace(/\s/g,'') === trimPhone.replace(/\s/g,''))) {
      e.phone = `Ce numéro est déjà utilisé par un autre membre.`
    }

    if (!form.order) { e.order = "Le numéro d'ordre est obligatoire." }
    else if (members.some(m => String(m.order) === String(form.order))) {
      e.order = `Le numéro d'ordre ${form.order} est déjà attribué.`
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  const save = () => {
    if (!validate()) return
    onSave({
      id: Date.now().toString(),
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      order: Number(form.order),
      joinDate: form.joinDate,
      status: 'actif',
    })
  }

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <div style={{ backgroundColor:C.g, padding:'14px 16px 16px', display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={onBack} style={{ background:'none', border:'none', color:'#fff', fontSize:26, cursor:'pointer', lineHeight:1, padding:'0 8px 0 0' }}>‹</button>
        <div>
          <div style={{ color:'#fff', fontSize:17, fontWeight:700 }}>Nouveau membre</div>
          <div style={{ color:'rgba(255,255,255,0.8)', fontSize:11, marginTop:2 }}>{members.length} membre{members.length>1?'s':''} enregistrés</div>
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:12 }}>
        <div>
          <label style={lbl}>Nom complet *</label>
          <input style={errors.name ? errInp : inp} type="text" placeholder="Ex: Marie Dupont"
            value={form.name} onChange={e => { setForm(p=>({...p,name:e.target.value})); setErrors(p=>({...p,name:''})) }} />
          {errors.name && <p style={{ color:C.rd, fontSize:12, marginTop:4 }}>⚠ {errors.name}</p>}
        </div>

        <div>
          <label style={lbl}>Téléphone</label>
          <input style={errors.phone ? errInp : inp} type="tel" placeholder="Ex: 06 12 34 56 78"
            value={form.phone} onChange={e => { setForm(p=>({...p,phone:e.target.value})); setErrors(p=>({...p,phone:''})) }} />
          {errors.phone && <p style={{ color:C.rd, fontSize:12, marginTop:4 }}>⚠ {errors.phone}</p>}
        </div>

        <div>
          <label style={lbl}>Email (optionnel)</label>
          <input style={inp} type="email" placeholder="Ex: marie@email.com"
            value={form.email} onChange={e => setForm(p=>({...p,email:e.target.value}))} />
        </div>

        <div style={{ display:'flex', gap:8 }}>
          <div style={{ flex:1 }}>
            <label style={lbl}>N° d'ordre *</label>
            <input style={errors.order ? errInp : inp} type="number" min="1"
              value={form.order} onChange={e => { setForm(p=>({...p,order:e.target.value})); setErrors(p=>({...p,order:''})) }} />
            {errors.order && <p style={{ color:C.rd, fontSize:12, marginTop:4 }}>⚠ {errors.order}</p>}
          </div>
          <div style={{ flex:1 }}>
            <label style={lbl}>Date d'adhésion</label>
            <input style={inp} type="date" value={form.joinDate}
              onChange={e => setForm(p=>({...p,joinDate:e.target.value}))} />
          </div>
        </div>

        <button onClick={save} style={{ backgroundColor:C.g, color:'#fff', border:'none', borderRadius:12, padding:13, fontSize:15, fontWeight:700, cursor:'pointer', marginTop:8 }}>
          Enregistrer le membre ✓
        </button>
      </div>
    </div>
  )
}
