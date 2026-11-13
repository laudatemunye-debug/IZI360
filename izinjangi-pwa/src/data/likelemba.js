// Likelemba : liaison avec le serveur (annonces, sondages, notifications du téléphone)
const API = 'https://izi360-backend.vercel.app/api/likelemba'
export const APP_VERSION = '1.0'
const K_ID = 'likelemba_install_id'
const K_INBOX = 'likelemba_inbox'
const K_ASKED = 'likelemba_push_asked'

export function getInstallId() {
  let id = ''
  try { id = localStorage.getItem(K_ID) || '' } catch { /* ignore */ }
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(id)) {
    let hex = ''
    try {
      hex = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('')
    } catch {
      hex = (Math.random().toString(16).slice(2) + Date.now().toString(16) + Math.random().toString(16).slice(2)).replace(/[^0-9a-f]/g, '').padEnd(32, '0').slice(0, 32)
    }
    id = hex
    try { localStorage.setItem(K_ID, id) } catch { /* ignore */ }
  }
  return id
}

const emptyInbox = () => ({ messages: [], polls: [], readMessages: [], seenPolls: [] })

export function loadInbox() {
  try { return { ...emptyInbox(), ...JSON.parse(localStorage.getItem(K_INBOX) || '{}') } } catch { return emptyInbox() }
}
export function saveInbox(inb) {
  try { localStorage.setItem(K_INBOX, JSON.stringify(inb)) } catch { /* ignore */ }
}
export function unreadCount(inb) {
  if (!inb) return 0
  const m = (inb.messages || []).filter((x) => !(inb.readMessages || []).includes(x.id)).length
  const p = (inb.polls || []).filter((x) => x.myVote == null && !(inb.seenPolls || []).includes(x.id)).length
  return m + p
}
export function markInboxRead(inb) {
  const n = { ...emptyInbox(), ...inb }
  n.readMessages = n.messages.map((m) => m.id)
  n.seenPolls = n.polls.map((p) => p.id)
  saveInbox(n)
  return n
}

const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))])
const postJSON = async (path, body, ms = 12000) => {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    return await fetch(API + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctrl.signal })
  } finally { clearTimeout(t) }
}
const urlB64ToUint8 = (b64) => {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4)
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

export const pushSupported = () =>
  typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window

export function needsPushPrompt() {
  if (!pushSupported()) return false
  if (Notification.permission !== 'default') return false
  const t = Number(localStorage.getItem(K_ASKED) || 0)
  return !t || Date.now() - t > 3 * 86400000
}
export function snoozePushPrompt() {
  try { localStorage.setItem(K_ASKED, String(Date.now())) } catch { /* ignore */ }
}

async function getPushSubscription() {
  if (!pushSupported() || Notification.permission !== 'granted') return null
  try {
    const reg = await withTimeout(navigator.serviceWorker.ready, 4000)
    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      const r = await withTimeout(fetch(API + '/vapid-public'), 8000)
      const { key } = await r.json()
      if (!key) return null
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8(key) })
    }
    return sub.toJSON()
  } catch { return null }
}

// Demande l'autorisation des notifications (à appeler directement depuis un clic)
export async function enablePush() {
  if (!pushSupported()) return false
  try {
    const perm = await Notification.requestPermission()
    if (perm !== 'granted') return false
    await getPushSubscription()
    return true
  } catch { return false }
}

// Signale l'app au serveur et récupère annonces + sondages
export async function pingServer(config, members) {
  const prev = loadInbox()
  try {
    const sub = await getPushSubscription()
    const r = await postJSON('/ping', {
      installId: getInstallId(),
      tontineName: config.tontineName || '',
      adminName: config.adminName || '',
      adminPhone: config.phone || '',
      membersCount: (members || []).length,
      appVersion: APP_VERSION,
      pushSubscription: sub,
    })
    if (!r.ok) return prev
    const data = await r.json()
    const ids = new Set((data.messages || []).map((m) => m.id))
    const inb = {
      messages: data.messages || [],
      polls: data.polls || [],
      readMessages: (prev.readMessages || []).filter((id) => ids.has(id)),
      seenPolls: prev.seenPolls || [],
    }
    saveInbox(inb)
    return inb
  } catch { return prev }
}

export async function voteOnPoll(pollId, optionIndex) {
  const inb = loadInbox()
  try {
    const r = await postJSON('/vote', { installId: getInstallId(), pollId, optionIndex })
    if (r.ok) {
      inb.polls = inb.polls.map((p) => (p.id === pollId ? { ...p, myVote: optionIndex } : p))
      saveInbox(inb)
    }
  } catch { /* hors ligne */ }
  return inb
}
