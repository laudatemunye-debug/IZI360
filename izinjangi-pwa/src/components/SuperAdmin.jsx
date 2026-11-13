import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const API = 'https://izi360-backend.vercel.app/api'
const TOKEN_KEY = 'likelemba_sa_token'
const C = { g: '#1D9E75', gd: '#085041', gl: '#E1F5EE', amb: '#BA7517', ambl: '#FAEEDA', ambd: '#633806', rd: '#E24B4A', rdl: '#FCEBEB', gr: '#F1EFE8', grb: '#D3D1C7', bg: '#F4F4F0', white: '#FFFFFF', text: '#1A1A1A', text2: '#5F5E5A', pur: '#EEEDFE', purd: '#3C3489' }

const rel = (d) => {
  if (!d) return '—'
  const s = Math.max(0, (Date.now() - new Date(d).getTime()) / 1000)
  if (s < 90) return "à l'instant"
  if (s < 3600) return `il y a ${Math.round(s / 60)} min`
  if (s < 86400) return `il y a ${Math.round(s / 3600)} h`
  return `il y a ${Math.round(s / 86400)} j`
}
const fdate = (d) => (d ? new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—')
const digits = (p) => String(p || '').replace(/[^0-9]/g, '')

const card = { backgroundColor: C.white, border: `1px solid ${C.grb}`, borderRadius: 12, padding: 12 }
const inp = { width: '100%', backgroundColor: C.white, border: `1px solid ${C.grb}`, borderRadius: 8, padding: '10px 12px', fontSize: 14, color: C.text, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }
const lbl = { display: 'block', fontSize: 12, fontWeight: 600, color: C.text2, marginBottom: 4 }
const btn = (bg = C.g, fg = '#fff') => ({ padding: '10px 14px', backgroundColor: bg, color: fg, border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' })
const chip = (on) => ({ padding: '6px 14px', borderRadius: 20, border: `1px solid ${on ? C.g : C.grb}`, backgroundColor: on ? C.gl : C.white, color: on ? C.gd : C.text2, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' })

export default function SuperAdmin({ onClose }) {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) || '')
  const [login, setLogin] = useState({ email: '', password: '' })
  const [err, setErr] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const [tab, setTab] = useState('comptes')
  const [data, setData] = useState({ stats: null, devices: [] })
  const [messages, setMessages] = useState([])
  const [polls, setPolls] = useState([])
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('last_seen')
  const [msgForm, setMsgForm] = useState({ title: '', body: '', expiresAt: '' })
  const [pollForm, setPollForm] = useState({ question: '', options: ['', ''], notify: true, closesAt: '' })

  const logout = (msg) => { sessionStorage.removeItem(TOKEN_KEY); setToken(''); setErr(msg || '') }
  const flash = (t) => { setInfo(t); setTimeout(() => setInfo(''), 7000) }

  const doLogin = async () => {
    if (!login.email.trim() || !login.password) return setErr('Email et mot de passe requis.')
    setBusy(true); setErr('')
    try {
      const res = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: login.email.trim(), password: login.password }) })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.message === 'demande_en_attente' ? 'Compte en attente de validation.' : body.message || 'Connexion impossible.')
      if (!body.user || body.user.role !== 'admin') throw new Error('Accès réservé au super admin.')
      sessionStorage.setItem(TOKEN_KEY, body.token)
      setToken(body.token)
      setLogin({ email: '', password: '' })
    } catch (e) { setErr(e.message) }
    setBusy(false)
  }

  const call = async (path, opts = {}) => {
    const res = await fetch(`${API}/likelemba/admin/${path}`, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } })
    if (res.status === 401 || res.status === 403) { logout('Session expirée ou accès refusé.'); throw new Error('Accès refusé') }
    let body = null
    try { body = await res.json() } catch { /* vide */ }
    if (!res.ok) throw new Error((body && body.message) || `Erreur ${res.status}`)
    return body
  }
  const load = async (which) => {
    try {
      if (which === 'comptes') setData(await call('devices'))
      if (which === 'annonces') setMessages(await call('messages'))
      if (which === 'sondages') setPolls(await call('polls'))
    } catch (e) { flash('❌ ' + e.message) }
  }
  useEffect(() => { if (token) load(tab) }, [tab, token]) // eslint-disable-line react-hooks/exhaustive-deps

  const act = async (path, opts, okText, confirmText, reloadTab) => {
    if (confirmText && !window.confirm(confirmText)) return
    try { await call(path, opts); if (okText) flash(okText); load(reloadTab) } catch (e) { flash('❌ ' + e.message) }
  }

  const sendMessage = async () => {
    if (!msgForm.title.trim() || !msgForm.body.trim()) return flash('Titre et message obligatoires.')
    if (!window.confirm('Envoyer cette annonce à tous les utilisateurs de Likelemba ?')) return
    setBusy(true)
    try {
      const r = await call('messages', { method: 'POST', body: JSON.stringify({ title: msgForm.title, body: msgForm.body, expiresAt: msgForm.expiresAt ? msgForm.expiresAt + 'T23:59:59' : null }) })
      flash(`✅ Annonce publiée · notifications envoyées : ${r.push.sent}${r.push.failed ? ` · échecs : ${r.push.failed}` : ''}${r.push.note ? ` · ${r.push.note}` : ''}`)
      setMsgForm({ title: '', body: '', expiresAt: '' })
      load('annonces')
    } catch (e) { flash('❌ ' + e.message) }
    setBusy(false)
  }

  const createPoll = async () => {
    const options = pollForm.options.map((o) => o.trim()).filter(Boolean)
    if (!pollForm.question.trim() || options.length < 2) return flash('Une question et au moins 2 options sont obligatoires.')
    setBusy(true)
    try {
      const r = await call('polls', { method: 'POST', body: JSON.stringify({ question: pollForm.question, options, notify: pollForm.notify, closesAt: pollForm.closesAt ? pollForm.closesAt + 'T23:59:59' : null }) })
      flash(`✅ Sondage créé${r.push ? ` · notifications envoyées : ${r.push.sent}` : ''}`)
      setPollForm({ question: '', options: ['', ''], notify: true, closesAt: '' })
      load('sondages')
    } catch (e) { flash('❌ ' + e.message) }
    setBusy(false)
  }

  const list = [...data.devices]
    .filter((d) => { const q = search.toLowerCase(); return !q || [d.tontine_name, d.admin_name, d.admin_phone].some((v) => String(v || '').toLowerCase().includes(q)) })
    .sort((a, b) => (sort === 'opens' ? b.opens_count - a.opens_count : sort === 'members' ? b.members_count - a.members_count : new Date(b.last_seen) - new Date(a.last_seen)))

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, maxWidth: 480, margin: '0 auto', backgroundColor: C.bg, display: 'flex', flexDirection: 'column' }}>
      <div style={{ backgroundColor: C.gd, padding: 'calc(env(safe-area-inset-top) + 14px) 16px 14px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, border: 'none', backgroundColor: 'rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={17} color="#fff" /></button>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontSize: 17, fontWeight: 700 }}>Super admin</div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2 }}>Likelemba</div>
        </div>
        {token && <button onClick={() => logout('')} style={{ ...btn('rgba(255,255,255,0.16)'), padding: '6px 10px', fontSize: 12 }}>Déconnexion</button>}
      </div>

      {!token ? (
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 14, color: C.text2 }}>Connectez-vous avec votre compte administrateur IZI360.</div>
            <div><label style={lbl}>Email</label><input style={inp} type="email" autoCapitalize="none" value={login.email} onChange={(e) => setLogin((p) => ({ ...p, email: e.target.value }))} /></div>
            <div><label style={lbl}>Mot de passe</label><input style={inp} type="password" value={login.password} onChange={(e) => setLogin((p) => ({ ...p, password: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter') doLogin() }} /></div>
            {err && <div style={{ color: C.rd, fontSize: 12 }}>{err}</div>}
            <button style={btn()} disabled={busy} onClick={doLogin}>{busy ? 'Connexion…' : 'Se connecter'}</button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 6, padding: '12px 14px 4px', flexShrink: 0 }}>
            {[['comptes', 'Comptes'], ['annonces', 'Annonces'], ['sondages', 'Sondages']].map(([k, l]) => <button key={k} style={chip(tab === k)} onClick={() => setTab(k)}>{l}</button>)}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px 30px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {info && <div style={{ ...card, color: C.gd, backgroundColor: C.gl, fontSize: 13 }}>{info}</div>}

            {tab === 'comptes' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[['Comptes', data.stats?.total], ['Actifs 7 jours', data.stats?.actifs_7j], ['Actifs 30 jours', data.stats?.actifs_30j], ['Avec notifications', data.stats?.avec_notifications]].map(([l, v]) => (
                    <div key={l} style={card}><div style={{ fontSize: 11, color: C.text2 }}>{l}</div><div style={{ fontSize: 22, fontWeight: 800, color: C.g }}>{v ?? '…'}</div></div>
                  ))}
                </div>
                <input style={inp} placeholder="Rechercher (tontine, admin, téléphone)…" value={search} onChange={(e) => setSearch(e.target.value)} />
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[['last_seen', 'Récents'], ['opens', 'Plus actifs'], ['members', 'Plus de membres']].map(([k, l]) => <button key={k} style={chip(sort === k)} onClick={() => setSort(k)}>{l}</button>)}
                  <button style={chip(false)} onClick={() => load('comptes')}>↻ Actualiser</button>
                </div>
                {list.map((d) => {
                  const actif = Date.now() - new Date(d.last_seen).getTime() < 7 * 86400000
                  return (
                    <div key={d.id} style={card}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: actif ? '#22c55e' : C.grb, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.tontine_name || '—'}</div>
                          <div style={{ fontSize: 12, color: C.text2 }}>
                            {d.admin_name || '—'}
                            {d.admin_phone && <> · <a href={`https://wa.me/${digits(d.admin_phone)}`} target="_blank" rel="noreferrer" style={{ color: C.g, fontWeight: 600 }}>{d.admin_phone}</a></>}
                          </div>
                        </div>
                        <button style={{ ...btn(C.rdl, C.rd), padding: '4px 10px' }} onClick={() => act(`devices/${d.id}`, { method: 'DELETE' }, '✅ Compte supprimé', `Supprimer « ${d.tontine_name || d.install_id} » de la liste ?`, 'comptes')}>✕</button>
                      </div>
                      <div style={{ fontSize: 11, color: C.text2, marginTop: 6 }}>{d.members_count} membre(s) · {d.opens_count} ouverture(s) · {d.push_on ? '🔔 notifications' : 'sans notifications'} · {rel(d.last_seen)}</div>
                    </div>
                  )
                })}
                {list.length === 0 && <div style={{ ...card, textAlign: 'center', color: C.text2, fontSize: 13 }}>Aucun compte.</div>}
              </>
            )}

            {tab === 'annonces' && (
              <>
                <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div><label style={lbl}>Titre (100 caractères max)</label><input style={inp} maxLength={100} value={msgForm.title} onChange={(e) => setMsgForm((p) => ({ ...p, title: e.target.value }))} /></div>
                  <div><label style={lbl}>Message (500 caractères max)</label><textarea style={{ ...inp, minHeight: 90, resize: 'vertical' }} maxLength={500} value={msgForm.body} onChange={(e) => setMsgForm((p) => ({ ...p, body: e.target.value }))} /></div>
                  <div style={{ minWidth: 0 }}><label style={lbl}>Visible jusqu'au (optionnel)</label><input style={inp} type="date" value={msgForm.expiresAt} onChange={(e) => setMsgForm((p) => ({ ...p, expiresAt: e.target.value }))} /></div>
                  <button style={btn()} disabled={busy} onClick={sendMessage}>📣 Envoyer à tous</button>
                </div>
                {messages.map((m) => (
                  <div key={m.id} style={card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{m.title}</div>
                      <button style={{ ...btn(C.rdl, C.rd), padding: '4px 10px' }} onClick={() => act(`messages/${m.id}`, { method: 'DELETE' }, '✅ Annonce retirée', "Retirer cette annonce de l'app ?", 'annonces')}>Retirer</button>
                    </div>
                    <div style={{ fontSize: 13, color: C.text2, margin: '4px 0', whiteSpace: 'pre-wrap' }}>{m.body}</div>
                    <div style={{ fontSize: 11, color: C.text2 }}>{fdate(m.created_at)} · {m.sent_count} notification(s){m.expires_at ? ` · jusqu'au ${fdate(m.expires_at)}` : ''}</div>
                  </div>
                ))}
                {messages.length === 0 && <div style={{ ...card, textAlign: 'center', color: C.text2, fontSize: 13 }}>Aucune annonce.</div>}
              </>
            )}

            {tab === 'sondages' && (
              <>
                <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div><label style={lbl}>Question (200 caractères max)</label><input style={inp} maxLength={200} value={pollForm.question} onChange={(e) => setPollForm((p) => ({ ...p, question: e.target.value }))} /></div>
                  {pollForm.options.map((o, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8 }}>
                      <input style={inp} maxLength={100} placeholder={`Option ${i + 1}`} value={o} onChange={(e) => setPollForm((p) => ({ ...p, options: p.options.map((x, j) => (j === i ? e.target.value : x)) }))} />
                      {pollForm.options.length > 2 && <button style={btn(C.rdl, C.rd)} onClick={() => setPollForm((p) => ({ ...p, options: p.options.filter((_, j) => j !== i) }))}>✕</button>}
                    </div>
                  ))}
                  {pollForm.options.length < 6 && <button style={btn(C.gl, C.gd)} onClick={() => setPollForm((p) => ({ ...p, options: [...p.options, ''] }))}>+ Ajouter une option</button>}
                  <div style={{ minWidth: 0 }}><label style={lbl}>Se termine le (optionnel)</label><input style={inp} type="date" value={pollForm.closesAt} onChange={(e) => setPollForm((p) => ({ ...p, closesAt: e.target.value }))} /></div>
                  <label style={{ fontSize: 13, color: C.text2, display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" checked={pollForm.notify} onChange={(e) => setPollForm((p) => ({ ...p, notify: e.target.checked }))} /> Prévenir par notification</label>
                  <button style={btn()} disabled={busy} onClick={createPoll}>📊 Lancer le sondage</button>
                </div>
                {polls.map((p) => (
                  <div key={p.id} style={card}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{p.question}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                      {p.options.map((o, i) => {
                        const pct = p.total ? Math.round((p.counts[i] * 100) / p.total) : 0
                        return (
                          <div key={i}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.text }}><span>{o}</span><span>{p.counts[i]} · {pct}%</span></div>
                            <div style={{ height: 8, borderRadius: 4, backgroundColor: C.gr, overflow: 'hidden', marginTop: 3 }}><div style={{ height: '100%', width: `${pct}%`, backgroundColor: C.g }} /></div>
                          </div>
                        )
                      })}
                    </div>
                    <div style={{ fontSize: 11, color: C.text2, marginTop: 8 }}>{p.total} vote(s) · {fdate(p.created_at)}{p.closes_at ? ` · fin le ${fdate(p.closes_at)}` : ''}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      <button style={{ ...btn(p.active ? C.gl : C.gr, p.active ? C.gd : C.text2), padding: '6px 10px', fontSize: 12 }} onClick={() => act(`polls/${p.id}`, { method: 'PATCH', body: JSON.stringify({ active: !p.active }) }, null, null, 'sondages')}>{p.active ? 'Ouvert — clore' : 'Clos — rouvrir'}</button>
                      <button style={{ ...btn(C.rdl, C.rd), padding: '6px 10px', fontSize: 12 }} onClick={() => act(`polls/${p.id}`, { method: 'DELETE' }, '✅ Sondage supprimé', 'Supprimer ce sondage et ses votes ?', 'sondages')}>Supprimer</button>
                    </div>
                  </div>
                ))}
                {polls.length === 0 && <div style={{ ...card, textAlign: 'center', color: C.text2, fontSize: 13 }}>Aucun sondage.</div>}
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
