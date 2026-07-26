import { useState } from 'react'

const S = {
  card: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#fff', border: '1px solid #D3D1C7', borderRadius: 12, minWidth: 0 },
  avatar: { width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 },
  avatarFallback: { width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#4285F4,#34A853)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0 },
  info: { display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 },
  name: { fontSize: 13, fontWeight: 700, color: '#1A1A18', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  email: { fontSize: 11, color: '#5F5E5A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  badge: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: '#1D9E75', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 1 },
  dot: { width: 6, height: 6, borderRadius: '50%', background: '#1D9E75', flexShrink: 0 },
  actions: { display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 },
  syncBtn: { width: 32, height: 32, background: '#1D9E75', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  syncBtnOff: { width: 32, height: 32, background: '#1D9E7599', border: 'none', borderRadius: 8, cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  disconnectBtn: { padding: '5px 10px', background: 'transparent', border: '1px solid #D3D1C7', borderRadius: 8, fontSize: 11, color: '#5F5E5A', cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit' },
  connectBtn: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#fff', border: '1.5px solid #D3D1C7', borderRadius: 12, cursor: 'pointer', fontSize: 13.5, fontWeight: 600, color: '#1A1A18', width: '100%', boxSizing: 'border-box' },
  meta: { fontSize: 11, color: '#5F5E5A', marginTop: 6 },
  err: { marginTop: 6, fontSize: 11.5, color: '#D64545' },
  ok: { marginTop: 6, fontSize: 11.5, color: '#1D9E75' },
}

const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

const SyncIcon = ({ spinning }) => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ animation: spinning ? 'gsb-spin 0.8s linear infinite' : 'none', display: 'block' }}>
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
)

const fmtDate = (iso) => {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function GoogleSyncButton({ googleUser, connect, disconnect, onSync, storageKeySuffix = '' }) {
  const [syncingLocal, setSyncingLocal] = useState(false)
  const [msg, setMsg] = useState('')
  const [isOk, setIsOk] = useState(true)
  const lastSyncKey = 'izinjangi_last_sync' + storageKeySuffix
  const [lastSync, setLastSync] = useState(() => localStorage.getItem(lastSyncKey) || '')
  const initials = googleUser ? (googleUser.name || googleUser.email).slice(0, 1).toUpperCase() : ''

  const doSync = async () => {
    if (!navigator.onLine) { setIsOk(false); setMsg('Pas de connexion internet'); return }
    setSyncingLocal(true)
    setMsg('')
    try {
      const ok = await onSync()
      if (ok) {
        const now = new Date().toISOString()
        localStorage.setItem(lastSyncKey, now)
        setLastSync(now)
        setIsOk(true)
        setMsg('Synchronisation réussie')
      } else {
        setIsOk(false)
        setMsg('Échec de la synchronisation')
      }
    } catch (e) {
      setIsOk(false)
      setMsg('Erreur : ' + e.message)
    } finally {
      setSyncingLocal(false)
      setTimeout(() => setMsg(''), 5000)
    }
  }

  if (googleUser) {
    return (
      <div>
        <style>{'@keyframes gsb-spin { to { transform: rotate(360deg); } }'}</style>
        <div style={S.card}>
          {googleUser.picture
            ? <img src={googleUser.picture} alt="avatar" style={S.avatar} referrerPolicy="no-referrer" />
            : <div style={S.avatarFallback}>{initials}</div>}
          <div style={S.info}>
            <span style={S.name}>{googleUser.name || googleUser.email}</span>
            <span style={S.email}>{googleUser.email}</span>
            <span style={S.badge}><span style={S.dot} />{syncingLocal ? 'Synchronisation...' : 'Drive connecté'}</span>
          </div>
          <div style={S.actions}>
            <button style={syncingLocal ? S.syncBtnOff : S.syncBtn} onClick={doSync} disabled={syncingLocal} title="Synchroniser">
              <SyncIcon spinning={syncingLocal} />
            </button>
            <button style={S.disconnectBtn} onClick={disconnect}>Déconnecter</button>
          </div>
        </div>
        <div style={S.meta}>{lastSync ? 'Dernière sync : ' + fmtDate(lastSync) : 'Jamais synchronisé'}</div>
        {msg && <div style={isOk ? S.ok : S.err}>{isOk ? '✓ ' : '✗ '}{msg}</div>}
      </div>
    )
  }

  return (
    <button style={S.connectBtn} onClick={connect}>
      <GoogleLogo />
      Se connecter avec Google Drive
    </button>
  )
}
