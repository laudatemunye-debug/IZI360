import { useState, useEffect } from 'react'
import { Bell, BarChart3 } from 'lucide-react'
import { enablePush, snoozePushPrompt } from '../data/likelemba'

const C = { g: '#1D9E75', gd: '#085041', gl: '#E1F5EE', gr: '#F1EFE8', grb: '#D3D1C7', white: '#FFFFFF', text: '#1A1A1A', text2: '#5F5E5A', pur: '#EEEDFE', purd: '#3C3489', rd: '#E24B4A' }
const fdate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '')

export const inboxHas = (inb) => !!inb && ((inb.messages || []).length > 0 || (inb.polls || []).length > 0)

const Round = ({ bg, children }) => (
  <div style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{children}</div>
)

export function InboxSection({ inbox, onVote, onRead }) {
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(null)
  useEffect(() => {
    const t = setTimeout(() => { if (onRead) onRead() }, 1200)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  if (!inboxHas(inbox)) return null

  const vote = async (p, i) => {
    setErr(''); setBusy(p.id)
    const n = onVote ? await onVote(p.id, i) : null
    setBusy(null)
    const cur = n && n.polls.find((x) => x.id === p.id)
    if (!cur || cur.myVote !== i) setErr('Vote non envoyé. Vérifiez votre connexion.')
  }

  return (
    <>
      {(inbox.polls || []).map((p) => (
        <div key={'p' + p.id} style={{ backgroundColor: C.white, border: `1px solid ${C.grb}`, borderRadius: 12, padding: 14 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <Round bg={C.pur}><BarChart3 size={16} color={C.purd} /></Round>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.purd, textTransform: 'uppercase', letterSpacing: 0.4 }}>Sondage</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginTop: 2 }}>{p.question}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {p.options.map((o, i) => {
              const on = p.myVote === i
              return (
                <button key={i} disabled={busy === p.id} onClick={() => vote(p, i)}
                  style={{ textAlign: 'left', padding: '10px 12px', borderRadius: 10, border: `2px solid ${on ? C.g : C.grb}`, backgroundColor: on ? C.g : C.white, color: on ? '#fff' : C.text, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {o}
                </button>
              )
            })}
          </div>
          {p.myVote != null && <div style={{ fontSize: 11, color: C.gd, marginTop: 8 }}>Merci, votre vote est enregistré. Vous pouvez le modifier.</div>}
          {err && <div style={{ fontSize: 11, color: C.rd, marginTop: 8 }}>{err}</div>}
        </div>
      ))}
      {(inbox.messages || []).map((m) => (
        <div key={'m' + m.id} style={{ backgroundColor: C.white, border: `1px solid ${C.grb}`, borderRadius: 12, padding: 14 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <Round bg={C.gl}><Bell size={16} color={C.gd} /></Round>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{m.title}</div>
              <div style={{ fontSize: 12, color: C.text2, marginTop: 2, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{m.body}</div>
              <div style={{ fontSize: 10, color: C.text2, marginTop: 6 }}>Likelemba · {fdate(m.createdAt)}</div>
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

// Fenêtre unique : autoriser Likelemba à envoyer des notifications
export function NotifPrompt({ onDone }) {
  const [busy, setBusy] = useState(false)
  const allow = async () => {
    setBusy(true)
    const ok = await enablePush()
    snoozePushPrompt()
    setBusy(false)
    onDone(ok)
  }
  const later = () => { snoozePushPrompt(); onDone(false) }
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 250, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 480, backgroundColor: C.white, borderRadius: '20px 20px 0 0', padding: '24px 20px calc(env(safe-area-inset-bottom) + 20px)', boxSizing: 'border-box', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: C.gl, margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Bell size={26} color={C.g} />
        </div>
        <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>Autoriser Likelemba à vous envoyer des notifications ?</div>
        <div style={{ fontSize: 13, color: C.text2, marginTop: 8, lineHeight: 1.5 }}>Vous recevrez les annonces et sondages importants, même quand l'app est fermée.</div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={later} style={{ flex: 1, padding: 13, backgroundColor: C.gr, color: C.text2, border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Plus tard</button>
          <button onClick={allow} disabled={busy} style={{ flex: 1, padding: 13, backgroundColor: C.g, color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Autoriser</button>
        </div>
      </div>
    </div>
  )
}
