// Fréquence des cotisations : unité (jour/semaine/mois) + nombre de fois,
// avec les valeurs exactes (dates du mois ou jours de la semaine) associées.

export const WEEKDAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
export const MAX_MOIS_DAY = 30

export const FREQUENCY_UNITS = {
  jour:    { key: 'jour',    label: 'Jour',    needsCount: false, maxCount: null },
  semaine: { key: 'semaine', label: 'Semaine', needsCount: true,  maxCount: 7 },
  mois:    { key: 'mois',    label: 'Mois',    needsCount: true,  maxCount: 30 },
}

// Empêche toute saisie absurde (ex: 100000000) de faire ramer l'app :
// on plafonne systématiquement avant que la valeur ne serve à générer quoi que ce soit.
export function clampFrequencyCount(unit, count) {
  const def = FREQUENCY_UNITS[unit]
  if (!def || !def.needsCount) return 1
  const n = Math.round(Number(count) || 1)
  return Math.min(Math.max(n, 1), def.maxCount)
}

// Détermine comment demander les valeurs exactes : dates du mois, jours de semaine, ou rien.
// Cas spécial : un nombre de fois par mois multiple de 4 correspond à une fréquence
// hebdomadaire régulière (4x/mois = 1x/semaine, 8x/mois = 2x/semaine...),
// donc on demande des jours de semaine plutôt que des dates.
export function resolveInputMode(unit, count) {
  if (unit === 'jour') return { mode: 'none', effectiveCount: 0 }
  if (unit === 'semaine') return { mode: 'days', effectiveCount: count }
  if (unit === 'mois') {
    if (count > 0 && count % 4 === 0) return { mode: 'days', effectiveCount: count / 4 }
    return { mode: 'dates', effectiveCount: count }
  }
  return { mode: 'none', effectiveCount: 0 }
}

export function buildFrequencyLabel(unit, count) {
  if (unit === 'jour') return 'Journalier'
  if (unit === 'semaine') return count > 1 ? `${count}x par semaine` : '1x par semaine'
  if (unit === 'mois') return count > 1 ? `${count}x par mois` : '1x par mois'
  return ''
}

function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function getNextDueDate(config, from = new Date()) {
  const { mode } = resolveInputMode(config.frequencyUnit, config.frequencyCount || 1)
  const today = startOfDay(from)

  if (mode === 'none') return today

  if (mode === 'dates') {
    const dates = (config.cotisationDates || []).filter(Boolean)
    if (dates.length === 0) return null
    const candidates = dates.map((day) => {
      let due = new Date(today.getFullYear(), today.getMonth(), day)
      if (due < today) due = new Date(today.getFullYear(), today.getMonth() + 1, day)
      return due
    })
    candidates.sort((a, b) => a - b)
    return candidates[0]
  }

  if (mode === 'days') {
    const days = (config.cotisationDays || []).filter(Boolean)
    if (days.length === 0) return null
    const todayJsDay = today.getDay()
    const candidates = days.map((dayName) => {
      const idx = WEEKDAYS.indexOf(dayName)
      const targetJsDay = (idx + 1) % 7
      const diff = (targetJsDay - todayJsDay + 7) % 7
      const due = new Date(today)
      due.setDate(today.getDate() + diff)
      return due
    })
    candidates.sort((a, b) => a - b)
    return candidates[0]
  }

  return null
}

export function formatDueDate(date) {
  if (!date) return ''
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}
