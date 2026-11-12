// Récupération du PIN par le support Likelemba (signature numérique).
// La clé PRIVÉE n'est jamais dans l'app : seule la clé publique ci-dessous y figure.
export const RECOVERY_PUBLIC_JWK = {"key_ops":["verify"],"ext":true,"kty":"EC","x":"-6HE_ZpCCw513LByMzzic2bEtbqJUdnD3l8seeQ92lM","y":"KwIN6JAKjrklOsy_8DwKVFdN-Tx4JpFZHpFOdZThEpA","crv":"P-256"}

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export const recoveryAvailable = () => !!RECOVERY_PUBLIC_JWK

export function recoveryRef(config) {
  return String(config.id || config.createdAt || '').replace(/[^A-Za-z0-9]/g, '').slice(-8).toUpperCase()
}

export function newChallenge() {
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  const s = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')
  return s.slice(0, 4) + s.slice(4)
}

function b64uToBytes(str) {
  const b = str.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b + '='.repeat((4 - (b.length % 4)) % 4))
  return Uint8Array.from(bin, (c) => c.charCodeAt(0))
}

export async function verifyRecovery(code, response) {
  if (!RECOVERY_PUBLIC_JWK) return false
  try {
    const key = await crypto.subtle.importKey('jwk', RECOVERY_PUBLIC_JWK, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify'])
    const msg = new TextEncoder().encode('likelemba-recovery|' + code)
    return await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, b64uToBytes(String(response).trim()), msg)
  } catch {
    return false
  }
}
