// Usage : node tools/recovery-sign.mjs CODE_RECU   → affiche le code de réponse à envoyer
import { webcrypto as crypto } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const code = (process.argv[2] || '').trim().toUpperCase()
if (!code) { console.log('Usage : node tools/recovery-sign.mjs CODE'); process.exit(1) }
const jwk = JSON.parse(readFileSync(join(homedir(), '.likelemba', 'recovery-private.json'), 'utf8'))
const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign'])
const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode('likelemba-recovery|' + code))
console.log(Buffer.from(sig).toString('base64url'))
