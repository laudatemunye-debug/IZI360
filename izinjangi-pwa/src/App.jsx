import { useState, useEffect } from 'react'
import { getAssociations, createAssociation, migrateLegacyTontinesIfNeeded } from './data/associations'
import TontineModule from './modules/tontine/TontineModule'
import SplashScreen from './components/SplashScreen'

// Likelemba : app dédiée uniquement à la tontine.
// On utilise une seule association interne (type "groupe"), invisible pour l'utilisateur.
export default function App() {
  const [assoc, setAssoc] = useState(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    migrateLegacyTontinesIfNeeded()
    const list = getAssociations()
    const a = list.find(x => x.type === 'groupe') || list[0] || createAssociation({ type: 'groupe', name: 'Likelemba' })
    setAssoc(a)
  }, [])

  // Barre de progression du démarrage (environ 1,5 s)
  useEffect(() => {
    const id = setInterval(() => setProgress(p => (p >= 100 ? 100 : p + 100 / 15)), 100)
    return () => clearInterval(id)
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

  if (!assoc || progress < 100) return <SplashScreen progress={progress} />

  return <TontineModule assocId={assoc.id} onExit={() => {}} />
}
