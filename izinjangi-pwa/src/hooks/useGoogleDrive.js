import { useState, useEffect, useRef } from 'react'
import { collectAssociationData, restoreAssociationData, mergeAssociationData } from '../data/associations'

const BACKEND_URL = 'https://izi360-backend.vercel.app/api/beautycrm/entreprise'
const DRIVE_SECRET = 'beautycrm_izi360_2026'

let _accessToken = null
let _tokenExpiry = 0
let _pendingTokenFetch = null

export function useGoogleDrive() {
  const [googleUser, setGoogleUser] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState('')
  const userRef = useRef(null)

  useEffect(() => {
    const raw = localStorage.getItem('izinjangi_google_user')
    if (raw) {
      try {
        const u = JSON.parse(raw)
        setGoogleUser(u)
        userRef.current = u
      } catch (_) {}
    }

    const handler = (event) => {
      if (event.data && event.data.type === 'izi360_personal_drive_connected') {
        const user = { email: event.data.email, name: event.data.name || event.data.email, picture: event.data.picture || null }
        setGoogleUser(user)
        userRef.current = user
        localStorage.setItem('izinjangi_google_user', JSON.stringify(user))
        setError('')
        _accessToken = null
        _tokenExpiry = 0
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  const fetchServerToken = async (email) => {
    if (_pendingTokenFetch) return _pendingTokenFetch
    _pendingTokenFetch = (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/drive-token-personal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ secret: DRIVE_SECRET, email }),
        })
        const data = await res.json()
        if (!res.ok || !data.access_token) throw new Error(data.message || 'Token indisponible')
        _accessToken = data.access_token
        _tokenExpiry = Date.now() + 50 * 60 * 1000
        return true
      } catch (e) {
        _accessToken = null
        _tokenExpiry = 0
        throw e
      } finally {
        _pendingTokenFetch = null
      }
    })()
    return _pendingTokenFetch
  }

  const ensureToken = async () => {
    if (_accessToken && Date.now() < _tokenExpiry) return true
    const email = userRef.current?.email
    if (!email) throw new Error('SESSION_EXPIRED')
    await fetchServerToken(email)
    return true
  }

  const connect = () => {
    setError('')
    const popup = window.open(`${BACKEND_URL}/oauth-start-personal`, '_blank')
    if (!popup) setError('Fenêtre bloquée, autorisez les popups et réessayez.')
  }

  const disconnect = () => {
    _accessToken = null
    _tokenExpiry = 0
    setGoogleUser(null)
    userRef.current = null
    setError('')
    localStorage.removeItem('izinjangi_google_user')
  }

  const authFetch = async (url, opts = {}) => {
    try {
      await ensureToken()
    } catch (_) {
      throw new Error('SESSION_EXPIRED')
    }
    return fetch(url, { ...opts, headers: { ...opts.headers, Authorization: `Bearer ${_accessToken}` } })
  }

  const fileNameFor = (assocId) => `izinjangi-${assocId}.json`

  const findFile = async (assocId) => {
    const name = fileNameFor(assocId)
    const res = await authFetch(`https://www.googleapis.com/drive/v3/files?q=name='${name}' and trashed=false&spaces=drive&fields=files(id,name)`)
    const data = await res.json()
    return data.files?.[0] || null
  }

  const uploadData = async (assocId, dataObj) => {
    const blob = new Blob([JSON.stringify(dataObj, null, 2)], { type: 'application/json' })
    const existing = await findFile(assocId)
    const meta = { name: fileNameFor(assocId), mimeType: 'application/json' }
    const form = new FormData()
    form.append('metadata', new Blob([JSON.stringify(meta)], { type: 'application/json' }))
    form.append('file', blob)
    const url = existing
      ? `https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=multipart`
      : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart'
    const res = await authFetch(url, { method: existing ? 'PATCH' : 'POST', body: form })
    if (!res.ok) throw new Error('Envoi Drive échoué (' + res.status + ')')
    return true
  }

  const downloadData = async (assocId) => {
    const existing = await findFile(assocId)
    if (!existing) return null
    const res = await authFetch(`https://www.googleapis.com/drive/v3/files/${existing.id}?alt=media`)
    if (!res.ok) throw new Error('Lecture Drive échouée (' + res.status + ')')
    return await res.json()
  }

  const syncAssociation = async (assocId) => {
    setSyncing(true)
    setError('')
    try {
      const localData = collectAssociationData(assocId)
      const remoteData = await downloadData(assocId)
      const merged = mergeAssociationData(localData, remoteData)
      restoreAssociationData(assocId, merged)
      await uploadData(assocId, merged)
      return true
    } catch (e) {
      setError(e.message === 'SESSION_EXPIRED' ? 'Session expirée, reconnectez Google.' : e.message)
      return false
    } finally {
      setSyncing(false)
    }
  }

  return { googleUser, syncing, error, connect, disconnect, syncAssociation }
}
