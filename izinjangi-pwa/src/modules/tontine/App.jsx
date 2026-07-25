import { useState, useEffect } from 'react'
import { getAssociations, createAssociation, migrateLegacyTontinesIfNeeded, ASSOCIATION_TYPES } from './data/associations'
import AssociationSelectScreen from './screens/association/AssociationSelectScreen'
import AssociationSetupScreen from './screens/association/AssociationSetupScreen'
import AssociationDashboard from './screens/association/AssociationDashboard'
import ModulePlaceholder from './screens/association/ModulePlaceholder'
import TontineModule from './modules/tontine/TontineModule'

export default function App() {
  const [loading, setLoading] = useState(true)
  const [associations, setAssociations] = useState([])
  const [view, setView] = useState('assocSelect') // assocSelect | assocSetup | dashboard | module
  const [activeAssoc, setActiveAssoc] = useState(null)
  const [activeModule, setActiveModule] = useState(null)

  useEffect(() => {
    // Migration one-shot : rattache les tontines créées avant UnionPro
    // à une association "Groupe simple", sans perte de données.
    migrateLegacyTontinesIfNeeded()
    setAssociations(getAssociations())
    setLoading(false)
  }, [])

  const refreshAssociations = () => setAssociations(getAssociations())

  const openAssociation = (assoc) => {
    setActiveAssoc(assoc)
    if (assoc.type === 'groupe') {
      // Un "Groupe simple" n'a qu'un seul module : on saute le dashboard.
      setActiveModule('tontine')
      setView('module')
    } else {
      setView('dashboard')
    }
  }

  const handleCreateAssociation = ({ type, name }) => {
    const assoc = createAssociation({ type, name })
    refreshAssociations()
    openAssociation(assoc)
  }

  const openModule = (moduleKey) => {
    setActiveModule(moduleKey)
    setView('module')
  }

  const backToAssociations = () => {
    setActiveAssoc(null)
    setActiveModule(null)
    setView('assocSelect')
    refreshAssociations()
  }

  const backToDashboard = () => {
    setActiveModule(null)
    setView('dashboard')
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#1D9E75' }}>
        <p style={{ color: '#fff', fontSize: 16 }}>Chargement…</p>
      </div>
    )
  }

  if (view === 'assocSelect') {
    return (
      <AssociationSelectScreen
        associations={associations}
        onSelect={openAssociation}
        onNew={() => setView('assocSetup')}
      />
    )
  }

  if (view === 'assocSetup') {
    return (
      <AssociationSetupScreen
        onDone={handleCreateAssociation}
        onBack={associations.length > 0 ? () => setView('assocSelect') : null}
      />
    )
  }

  if (view === 'dashboard' && activeAssoc) {
    return (
      <AssociationDashboard
        association={activeAssoc}
        onOpenModule={openModule}
        onBack={backToAssociations}
      />
    )
  }

  if (view === 'module' && activeAssoc && activeModule === 'tontine') {
    return (
      <TontineModule
        assocId={activeAssoc.id}
        onExit={activeAssoc.type === 'groupe' ? backToAssociations : backToDashboard}
      />
    )
  }

  if (view === 'module' && activeAssoc) {
    const label = `Module ${activeModule}`
    return (
      <ModulePlaceholder
        moduleLabel={label}
        onBack={activeAssoc.type === 'groupe' ? backToAssociations : backToDashboard}
      />
    )
  }

  return null
}
