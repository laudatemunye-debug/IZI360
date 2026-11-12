import { useState, useEffect } from 'react'
import { getAssociations, createAssociation, migrateLegacyTontinesIfNeeded } from './data/associations'
import TontineModule from './modules/tontine/TontineModule'

// Likelemba : app dédiée uniquement à la tontine.
// On utilise une seule association interne (type "groupe"), invisible pour l'utilisateur.
export default function App() {
  const [assoc, setAssoc] = useState(null)

  useEffect(() => {
    migrateLegacyTontinesIfNeeded()
    const list = getAssociations()
    const a = list.find(x => x.type === 'groupe') || list[0] || createAssociation({ type: 'groupe', name: 'Likelemba' })
    setAssoc(a)
  }, [])

  // Champs numériques : le contenu est sélectionné au focus, le 1er chiffre tapé remplace la valeur par défaut
  useEffect(() => {
    const onFocus = (e) => {
      const t = e.target
      if (t && t.tagName === 'INPUT' && t.type === 'number') setTimeout(() => t.select && t.select(), 0)
    }
    document.addEventListener('focusin', onFocus)
    return () => document.removeEventListener('focusin', onFocus)
  }, [])

  if (!assoc) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100dvh', backgroundColor: '#1D9E75' }}>
        <p style={{ color: '#fff', fontSize: 16 }}>Chargement…</p>
      </div>
    )
  }

  return <TontineModule assocId={assoc.id} onExit={() => {}} />
}
