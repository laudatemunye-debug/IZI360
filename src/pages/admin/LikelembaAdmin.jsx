import { useState, useEffect, useRef } from 'react'

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

export default function LikelembaAdmin({ api, headers, T }) {
  const [tab, setTab] = useState('comptes')
  const [info, setInfo] = useState('')
  const [data, setData] = useState({ stats: null, devices: [] })
  const [messages, setMessages] = useState([])
  const [polls, setPolls] = useState([])
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('last_seen')
  const [msgForm, setMsgForm] = useState({ title: '', body: '', expiresAt: '' })
  const [pollForm, setPollForm] = useState({ question: '', options: ['', ''], notify: true, closesAt: '' })
  const [busy, setBusy] = useState(false)

  const hdr = useRef(headers)
  hdr.current = headers

  const call = async (path, opts = {}) => {
    const res = await fetch(`${api}/likelemba/admin/${path}`, { ...opts, headers: hdr.current })
    let body = null
    try { body = await res.json() } catch { /* réponse vide */ }
    if (!res.ok) throw new Error((body && body.message) || `Erreur ${res.status}`)
    return body
  }
  const flash = (t) => { setInfo(t); setTimeout(() => setInfo(''), 7000) }
  const load = async (which) => {
    try {
      if (which === 'comptes') setData(await call('devices'))
      if (which === 'annonces') setMessages(await call('messages'))
      if (which === 'sondages') setPolls(await call('polls'))
    } catch (e) { flash('❌ ' + e.message) }
  }
  useEffect(() => { load(tab) }, [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  const box = { backgroundColor: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }
  const inp = { width: '100%', padding: '10px 12px', backgroundColor: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }
  const lbl = { display: 'block', color: T.textSub, fontSize: 12, fontWeight: 600, marginBottom: 4 }
  const btn = (color = T.accent, textColor = '#fff') => ({ padding: '9px 16px', backgroundColor: color, color: textColor, border: 'none', borderRadius: 8, cursor: busy ? 'wait' : 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' })
  const th = { textAlign: 'left', padding: '8px 10px', color: T.textSub, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }
  const td = { padding: '9px 10px', color: T.text, fontSize: 13, borderTop: `1px solid ${T.border}`, whiteSpace: 'nowrap' }

  const sendMessage = async () => {
    if (!msgForm.title.trim() || !msgForm.body.trim()) return flash('Titre et message obligatoires.')
    if (!window.confirm('Envoyer cette annonce à tous les utilisateurs de Likelemba ?')) return
    setBusy(true)
    try {
      const r = await call('messages', { method: 'POST', body: JSON.stringify({ title: msgForm.title, body: msgForm.body, expiresAt: msgForm.expiresAt ? msgForm.expiresAt + 'T23:59:59' : null }) })
      flash(`✅ Annonce publiée. Notifications envoyées : ${r.push.sent}${r.push.failed ? ` · échecs : ${r.push.failed}` : ''}${r.push.note ? ` · ${r.push.note}` : ''}`)
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

  const act = async (path, opts, okText, confirmText, reloadTab) => {
    if (confirmText && !window.confirm(confirmText)) return
    try { await call(path, opts); if (okText) flash(okText); load(reloadTab) } catch (e) { flash('❌ ' + e.message) }
  }

  const list = [...data.devices]
    .filter((d) => { const q = search.toLowerCase(); return !q || [d.tontine_name, d.admin_name, d.admin_phone].some((v) => String(v || '').toLowerCase().includes(q)) })
    .sort((a, b) => (sort === 'opens' ? b.opens_count - a.opens_count : sort === 'members' ? b.members_count - a.members_count : new Date(b.last_seen) - new Date(a.last_seen)))

  const tabBtn = (k, l) => (
    <button key={k} onClick={() => setTab(k)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: tab === k ? 700 : 500, backgroundColor: tab === k ? T.accentDim : 'transparent', color: tab === k ? T.accent : T.textSub }}>{l}</button>
  )

  return (
    <div>
      <h2 style={{ color: T.text, fontSize: 22, margin: '0 0 4px' }}>Likelemba — Super admin</h2>
      <p style={{ color: T.textSub, fontSize: 13, margin: '0 0 16px' }}>Comptes actifs, annonces (notifications) et sondages de l'app.</p>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {tabBtn('comptes', '👥 Comptes')}{tabBtn('annonces', '📣 Annonces')}{tabBtn('sondages', '📊 Sondages')}
      </div>
      {info && <div style={{ ...box, marginBottom: 16, color: T.accent, fontSize: 14 }}>{info}</div>}

      {tab === 'comptes' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, marginBottom: 14 }}>
            {[['Comptes', data.stats?.total], ['Actifs 7 jours', data.stats?.actifs_7j], ['Actifs 30 jours', data.stats?.actifs_30j], ['Avec notifications', data.stats?.avec_notifications]].map(([l, v]) => (
              <div key={l} style={box}><div style={{ color: T.textSub, fontSize: 12 }}>{l}</div><div style={{ color: T.text, fontSize: 24, fontWeight: 800 }}>{v ?? '…'}</div></div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
            <input style={{ ...inp, flex: 1, minWidth: 180 }} placeholder="Rechercher (tontine, admin, téléphone)…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <select style={{ ...inp, width: 'auto' }} value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="last_seen">Dernière activité</option>
              <option value="opens">Plus d'ouvertures</option>
              <option value="members">Plus de membres</option>
            </select>
            <button style={btn(T.accentDim, T.accent)} onClick={() => load('comptes')}>↻ Actualiser</button>
          </div>
          <div style={{ ...box, padding: 0, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
              <thead><tr><th style={th}></th><th style={th}>Tontine</th><th style={th}>Admin</th><th style={th}>Téléphone</th><th style={th}>Membres</th><th style={th}>Ouvertures</th><th style={th}>Notifs</th><th style={th}>Dernière activité</th><th style={th}></th></tr></thead>
              <tbody>
                {list.map((d) => {
                  const actif = Date.now() - new Date(d.last_seen).getTime() < 7 * 86400000
                  return (
                    <tr key={d.id}>
                      <td style={td}><span title={actif ? 'Actif (7 jours)' : 'Inactif'} style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 5, backgroundColor: actif ? '#22c55e' : T.textMuted }} /></td>
                      <td style={{ ...td, fontWeight: 700 }}>{d.tontine_name || '—'}</td>
                      <td style={td}>{d.admin_name || '—'}</td>
                      <td style={td}>{d.admin_phone ? <a href={`https://wa.me/${digits(d.admin_phone)}`} target="_blank" rel="noreferrer" style={{ color: T.accent }}>{d.admin_phone}</a> : '—'}</td>
                      <td style={td}>{d.members_count}</td>
                      <td style={td}>{d.opens_count}</td>
                      <td style={td}>{d.push_on ? '🔔 oui' : 'non'}</td>
                      <td style={td} title={fdate(d.last_seen)}>{rel(d.last_seen)}</td>
                      <td style={td}><button style={{ ...btn('rgba(226,75,74,0.15)', '#E24B4A'), padding: '4px 10px' }} onClick={() => act(`devices/${d.id}`, { method: 'DELETE' }, '✅ Compte supprimé', `Supprimer « ${d.tontine_name || d.install_id} » de la liste ?`, 'comptes')}>Supprimer</button></td>
                    </tr>
                  )
                })}
                {list.length === 0 && <tr><td style={{ ...td, color: T.textSub }} colSpan={9}>Aucun compte.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'annonces' && (
        <div>
          <div style={{ ...box, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div><label style={lbl}>Titre (100 caractères max)</label><input style={inp} maxLength={100} value={msgForm.title} onChange={(e) => setMsgForm((p) => ({ ...p, title: e.target.value }))} /></div>
            <div><label style={lbl}>Message (500 caractères max)</label><textarea style={{ ...inp, minHeight: 90, resize: 'vertical' }} maxLength={500} value={msgForm.body} onChange={(e) => setMsgForm((p) => ({ ...p, body: e.target.value }))} /></div>
            <div><label style={lbl}>Visible jusqu'au (optionnel)</label><input style={{ ...inp, maxWidth: 220 }} type="date" value={msgForm.expiresAt} onChange={(e) => setMsgForm((p) => ({ ...p, expiresAt: e.target.value }))} /></div>
            <div><button style={btn()} disabled={busy} onClick={sendMessage}>📣 Envoyer à tous</button></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages.map((m) => (
              <div key={m.id} style={{ ...box, display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                <div>
                  <div style={{ color: T.text, fontWeight: 700 }}>{m.title}</div>
                  <div style={{ color: T.textSub, fontSize: 13, margin: '4px 0' }}>{m.body}</div>
                  <div style={{ color: T.textMuted, fontSize: 11 }}>{fdate(m.created_at)} · {m.sent_count} notification(s) envoyée(s){m.expires_at ? ` · jusqu'au ${fdate(m.expires_at)}` : ''}</div>
                </div>
                <button style={{ ...btn('rgba(226,75,74,0.15)', '#E24B4A'), padding: '4px 10px' }} onClick={() => act(`messages/${m.id}`, { method: 'DELETE' }, '✅ Annonce retirée', 'Retirer cette annonce de l\'app ?', 'annonces')}>Retirer</button>
              </div>
            ))}
            {messages.length === 0 && <p style={{ color: T.textSub, fontSize: 13 }}>Aucune annonce.</p>}
          </div>
        </div>
      )}

      {tab === 'sondages' && (
        <div>
          <div style={{ ...box, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div><label style={lbl}>Question (200 caractères max)</label><input style={inp} maxLength={200} value={pollForm.question} onChange={(e) => setPollForm((p) => ({ ...p, question: e.target.value }))} /></div>
            {pollForm.options.map((o, i) => (
              <div key={i} style={{ display: 'flex', gap: 8 }}>
                <input style={inp} maxLength={100} placeholder={`Option ${i + 1}`} value={o} onChange={(e) => setPollForm((p) => ({ ...p, options: p.options.map((x, j) => (j === i ? e.target.value : x)) }))} />
                {pollForm.options.length > 2 && <button style={btn('rgba(226,75,74,0.15)', '#E24B4A')} onClick={() => setPollForm((p) => ({ ...p, options: p.options.filter((_, j) => j !== i) }))}>✕</button>}
              </div>
            ))}
            {pollForm.options.length < 6 && <div><button style={btn(T.accentDim, T.accent)} onClick={() => setPollForm((p) => ({ ...p, options: [...p.options, ''] }))}>+ Ajouter une option</button></div>}
            <div><label style={lbl}>Se termine le (optionnel)</label><input style={{ ...inp, maxWidth: 220 }} type="date" value={pollForm.closesAt} onChange={(e) => setPollForm((p) => ({ ...p, closesAt: e.target.value }))} /></div>
            <label style={{ color: T.textSub, fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" checked={pollForm.notify} onChange={(e) => setPollForm((p) => ({ ...p, notify: e.target.checked }))} /> Prévenir par notification</label>
            <div><button style={btn()} disabled={busy} onClick={createPoll}>📊 Lancer le sondage</button></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {polls.map((p) => (
              <div key={p.id} style={box}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ color: T.text, fontWeight: 700 }}>{p.question}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={{ ...btn(p.active ? T.accentDim : 'rgba(255,255,255,0.08)', p.active ? T.accent : T.textSub), padding: '4px 10px' }} onClick={() => act(`polls/${p.id}`, { method: 'PATCH', body: JSON.stringify({ active: !p.active }) }, null, null, 'sondages')}>{p.active ? 'Ouvert — clore' : 'Clos — rouvrir'}</button>
                    <button style={{ ...btn('rgba(226,75,74,0.15)', '#E24B4A'), padding: '4px 10px' }} onClick={() => act(`polls/${p.id}`, { method: 'DELETE' }, '✅ Sondage supprimé', 'Supprimer ce sondage et ses votes ?', 'sondages')}>Supprimer</button>
                  </div>
                </div>
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {p.options.map((o, i) => {
                    const pct = p.total ? Math.round((p.counts[i] * 100) / p.total) : 0
                    return (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: T.text, fontSize: 13 }}><span>{o}</span><span>{p.counts[i]} · {pct}%</span></div>
                        <div style={{ height: 8, borderRadius: 4, backgroundColor: T.bg, overflow: 'hidden', marginTop: 3 }}><div style={{ height: '100%', width: `${pct}%`, backgroundColor: T.accent }} /></div>
                      </div>
                    )
                  })}
                </div>
                <div style={{ color: T.textMuted, fontSize: 11, marginTop: 8 }}>{p.total} vote(s) · créé le {fdate(p.created_at)}{p.closes_at ? ` · fin le ${fdate(p.closes_at)}` : ''}</div>
              </div>
            ))}
            {polls.length === 0 && <p style={{ color: T.textSub, fontSize: 13 }}>Aucun sondage.</p>}
          </div>
        </div>
      )}
    </div>
  )
}
