// À lancer UNE SEULE FOIS : crée ta clé privée (~/.likelemba) et met la clé publique dans l'app.
import { webcrypto as crypto } from 'node:crypto'
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const dir = join(homedir(), '.likelemba')
const file = join(dir, 'recovery-private.json')
if (existsSync(file)) {
  console.log('Clé déjà créée :', file, '\nNe la supprime pas : les téléphones ne reconnaîtraient plus tes codes.')
  process.exit(1)
}
const { publicKey, privateKey } = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])
mkdirSync(dir, { recursive: true, mode: 0o700 })
writeFileSync(file, JSON.stringify(await crypto.subtle.exportKey('jwk', privateKey)), { mode: 0o600 })
const pub = JSON.stringify(await crypto.subtle.exportKey('jwk', publicKey))
const target = 'src/data/recovery.js'
const src = readFileSync(target, 'utf8')
writeFileSync(target, src.replace(/export const RECOVERY_PUBLIC_JWK = .*/, () => 'export const RECOVERY_PUBLIC_JWK = ' + pub))
console.log('Clé privée :', file)
console.log('Clé publique ajoutée dans', target)
