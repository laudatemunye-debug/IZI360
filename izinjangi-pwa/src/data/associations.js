export const ASSOCIATION_TYPES = {
  ong:      { key: 'ong',      label: 'ONG',           description: 'Organisation Non Gouvernementale' },
  asbl:     { key: 'asbl',     label: 'ASBL',          description: 'Association Sans But Lucratif' },
  mutuelle: { key: 'mutuelle', label: 'Mutualité',     description: 'Mutuelle de santé / solidarité' },
  groupe:   { key: 'groupe',   label: 'Groupe simple', description: 'Un groupe qui veut juste gérer une tontine' },
}

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8)

const ASSOC_LIST_KEY = 'unionpro_associations'
const MIGRATION_FLAG_KEY = 'unionpro_migrated_v1'

export function getAssociations() {
  return JSON.parse(localStorage.getItem(ASSOC_LIST_KEY) || '[]')
}

function saveAssociations(list) {
  localStorage.setItem(ASSOC_LIST_KEY, JSON.stringify(list))
}

export function createAssociation({ type, name }) {
  const assoc = { id: genId(), type, name, createdAt: new Date().toISOString() }
  saveAssociations([...getAssociations(), assoc])
  return assoc
}

export function deleteAssociation(id) {
  saveAssociations(getAssociations().filter(a => a.id !== id))
}

export function renameAssociation(id, name) {
  saveAssociations(getAssociations().map(a => (a.id === id ? { ...a, name } : a)))
}

export function tontineKey(assocId, tontineId, field) {
  return `njangi_${assocId}_${tontineId}_${field}`
}

export function tontineListKey(assocId) {
  return `unionpro_${assocId}_tontines`
}

export function getTontinesForAssociation(assocId) {
  return JSON.parse(localStorage.getItem(tontineListKey(assocId)) || '[]')
}

export function saveTontinesForAssociation(assocId, list) {
  localStorage.setItem(tontineListKey(assocId), JSON.stringify(list))
}

export function migrateLegacyTontinesIfNeeded() {
  if (localStorage.getItem(MIGRATION_FLAG_KEY)) return null

  const legacyList = JSON.parse(localStorage.getItem('njangi_tontines') || '[]')

  if (legacyList.length === 0) {
    localStorage.setItem(MIGRATION_FLAG_KEY, 'true')
    return null
  }

  const assoc = createAssociation({ type: 'groupe', name: 'Mes tontines' })

  legacyList.forEach((t) => {
    ;['config', 'members', 'payments', 'payouts', 'cycles'].forEach((field) => {
      const oldKey = `njangi_${t.id}_${field}`
      const val = localStorage.getItem(oldKey)
      if (val !== null) {
        localStorage.setItem(tontineKey(assoc.id, t.id, field), val)
        localStorage.removeItem(oldKey)
      }
    })
  })

  saveTontinesForAssociation(assoc.id, legacyList)
  localStorage.removeItem('njangi_tontines')
  localStorage.setItem(MIGRATION_FLAG_KEY, 'true')

  return assoc
}
