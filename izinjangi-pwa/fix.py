with open('src/screens/AllScreens.jsx', 'r') as f:
    c = f.read()

# Supprimer le champ nombre de tours qui persiste
c = c.replace(
    "<label style={lbl}>Nombre de tours (places) *</label>",
    ""
)
c = c.replace(
    '<input style={inp} type="number" min="2" placeholder="Ex: 12" value={form.nbSlots} onChange={e=>setForm(p=>({...p,nbSlots:e.target.value}))}/>',
    ""
)

# Corriger la ligne blanche — padding du header Setup
c = c.replace(
    "backgroundColor:C.g,padding:'16px 16px 20px'",
    "backgroundColor:C.g,padding:'calc(env(safe-area-inset-top) + 14px) 16px 16px'"
)

# Corriger largeur des inputs qui débordent
c = c.replace(
    "width:'100%',color:C.text,outline:'none',marginTop:4,boxSizing:'border-box'",
    "width:'100%',color:C.text,outline:'none',marginTop:4,boxSizing:'border-box',maxWidth:'100%'"
)

with open('src/screens/AllScreens.jsx', 'w') as f:
    f.write(c)

print("✅ OK")
