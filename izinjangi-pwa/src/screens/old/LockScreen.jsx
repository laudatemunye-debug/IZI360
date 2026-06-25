import { useState, useRef } from 'react'

const C = {
  g: '#1D9E75', gd: '#085041',
  text: '#1A1A1A', text2: '#5F5E5A',
  white: '#FFFFFF', rd: '#E24B4A',
}

export default function LockScreen({ config, onUnlock }) {
  const [username, setUsername] = useState('')
  const [pin, setPin] = useState('')
  const [err, setErr] = useState('')

  const tryLogin = () => {
    if (username.trim().toLowerCase() !== config.username.trim().toLowerCase()) {
      setErr("Nom d'utilisateur incorrect"); setPin(''); return
    }
    if (pin !== config.pin) {
      setErr('PIN incorrect'); setPin(''); return
    }
    onUnlock()
  }

  const press = (d) => {
    const np = pin + d
    setPin(np)
    setErr('')
    if (np.length === 4) {
      if (username.trim().toLowerCase() !== config.username.trim().toLowerCase()) {
        setErr("Nom d'utilisateur incorrect"); setPin(''); return
      }
      if (np !== config.pin) {
        setErr('PIN incorrect'); setPin('')
      } else {
        onUnlock()
      }
    }
  }

  const del = () => setPin(p => p.slice(0, -1))

  const PAD = [['1','2','3'],['4','5','6'],['7','8','9'],['','0','⌫']]

  return (
    <div style={{ height:'100vh', backgroundColor: C.g, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ width:64, height:64, backgroundColor:'rgba(255,255,255,0.2)', borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12 }}>
        <span style={{ color:'#fff', fontSize:32, fontWeight:900 }}>✓</span>
      </div>
      <h1 style={{ color:'#fff', fontSize:24, fontWeight:800, letterSpacing:1 }}>IZI NJANGI</h1>
      <p style={{ color:'rgba(255,255,255,0.75)', fontSize:13, marginBottom:24 }}>{config.tontineName}</p>

      <input
        type="text"
        placeholder="Nom d'utilisateur"
        value={username}
        onChange={e => { setUsername(e.target.value); setErr('') }}
        style={{ width:'100%', maxWidth:280, backgroundColor:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:8, padding:'10px 14px', fontSize:14, color:'#fff', outline:'none', marginBottom:20, textAlign:'center' }}
      />

      <div style={{ display:'flex', gap:14, marginBottom:8 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ width:16, height:16, borderRadius:8, border:'2px solid rgba(255,255,255,0.6)', backgroundColor: pin.length > i ? '#fff' : 'transparent' }} />
        ))}
      </div>

      {err ? <p style={{ color:'#FFB4B4', fontSize:13, marginBottom:8 }}>{err}</p> : <div style={{ height:21 }} />}

      <div style={{ display:'flex', flexDirection:'column', gap:12, marginTop:8 }}>
        {PAD.map((row, ri) => (
          <div key={ri} style={{ display:'flex', gap:16 }}>
            {row.map((k, ki) => (
              <button key={ki} onClick={() => k === '⌫' ? del() : k && press(k)}
                disabled={!k}
                style={{ width:72, height:72, borderRadius:36, backgroundColor: k ? 'rgba(255,255,255,0.15)' : 'transparent', border:'none', color:'#fff', fontSize:24, fontWeight:600, cursor: k ? 'pointer' : 'default', opacity: k ? 1 : 0 }}>
                {k}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
