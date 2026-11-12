// Usage : node tools/recovery-sign.mjs CODE_RECU   → affiche (et copie) le code de réponse
import { webcrypto as crypto } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { execSync } from 'node:child_process'

const code = (process.argv[2] || '').trim().toUpperCase()
if (!code) { console.log('Usage : node tools/recovery-sign.mjs CODE'); process.exit(1) }
const jwk = JSON.parse(readFileSync(join(homedir(), '.likelemba', 'recovery-private.json'), 'utf8'))
const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign'])
const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode('likelemba-recovery|' + code))
const out = Buffer.from(sig).toString('base64url')
console.log(out)
if (process.platform === 'darwin') {
  try { execSync('pbcopy', { input: out }); console.log('(copié : colle-le directement dans WhatsApp)') } catch {}
}
