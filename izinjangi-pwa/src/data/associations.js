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

const SYNC_FIELDS = ['config', 'members', 'payments', 'payouts', 'cycles', 'forcedAdvances']

// Rassemble toute une association (liste de tontines + toutes leurs données) en un seul objet,
// prêt à être envoyé sur Google Drive.
export function collectAssociationData(assocId) {
  const tontines = getTontinesForAssociation(assocId)
  const records = {}
  tontines.forEach((t) => {
    const rec = {}
    SYNC_FIELDS.forEach((field) => {
      const raw = localStorage.getItem(tontineKey(assocId, t.id, field))
      rec[field] = raw !== null ? JSON.parse(raw) : (field === 'config' ? null : [])
    })
    records[t.id] = rec
  })
  return { assocId, tontines, records, exported_at: new Date().toISOString() }
}

// Réécrit en local toutes les données d'une association à partir d'un objet collecté (écrase tout).
export function restoreAssociationData(assocId, data) {
  if (!data) return
  saveTontinesForAssociation(assocId, data.tontines || [])
  Object.entries(data.records || {}).forEach(([tontineId, rec]) => {
    SYNC_FIELDS.forEach((field) => {
      if (rec[field] !== undefined) {
        localStorage.setItem(tontineKey(assocId, tontineId, field), JSON.stringify(rec[field]))
      }
    })
  })
}

function unionById(localArr = [], remoteArr = []) {
  const map = {}
  remoteArr.forEach((item) => { map[item.id || item.slotId || JSON.stringify(item)] = item })
  localArr.forEach((item) => { map[item.id || item.slotId || JSON.stringify(item)] = item }) // local gagne en cas de conflit d'id
  return Object.values(map)
}

// Fusionne les données locales et celles venant de Drive, sans perte : les tableaux (membres,
// paiements, versements...) sont unifiés par id ; le plus récent des deux objets globaux
// (exported_at) l'emporte pour la config si elle diffère.
export function mergeAssociationData(localData, remoteData) {
  if (!remoteData) return localData
  if (!localData) return remoteData

  const localNewer = new Date(localData.exported_at) >= new Date(remoteData.exported_at)
  const tontineIds = new Set([
    ...(localData.tontines || []).map((t) => t.id),
    ...(remoteData.tontines || []).map((t) => t.id),
  ])
  const tontinesById = {}
;(remoteData.tontines || []).forEach((t) => { tontinesById[t.id] = t })
;(localData.tontines || []).forEach((t) => { tontinesById[t.id] = t }) // local gagne (métadonnées : nom, username...)

  const records = {}
  tontineIds.forEach((id) => {
    const l = localData.records?.[id] || {}
    const r = remoteData.records?.[id] || {}
    records[id] = {
      config: localNewer ? (l.config || r.config) : (r.config || l.config),
      members: unionById(l.members, r.members),
      payments: unionById(l.payments, r.payments),
      payouts: unionById(l.payouts, r.payouts),
      cycles: unionById(l.cycles, r.cycles),
      forcedAdvances: unionById(l.forcedAdvances, r.forcedAdvances),
    }
  })

  return {
    assocId: localData.assocId,
    tontines: Array.from(tontineIds).map((id) => tontinesById[id]).filter(Boolean),
    records,
    exported_at: new Date().toISOString(),
  }
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
