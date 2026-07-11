p = "src/pages/admin/Dashboard.jsx"
s = open(p).read()

old = """                        <Btn color="#EF4444" onClick={async () => {
                          if (!confirm('Supprimer cet utilisateur ?')) return
                          await fetch(`${API}/beautycrm/users/${selectedBeautyUser.id}`, { method: 'DELETE', headers })
                          setBeautyCrmUsers(p => p.filter(u => u.id !== selectedBeautyUser.id))
                          setSelectedBeautyUser(null)
                        }}>Supprimer</Btn>"""
assert s.count(old) == 1, f"bouton supprimer: {s.count(old)}"

new = """                        <Btn color="#F59E0B" onClick={async () => {
                          const motif = window.prompt('Motif de la desactivation (optionnel) :') || ''
                          await fetch(`${API}/beautycrm/entreprise/admin/suspend-personal`, {
                            method: 'POST', headers,
                            body: JSON.stringify({ email: selectedBeautyUser.email, motif })
                          })
                          setSelectedBeautyUser(null)
                          setMessage('Compte desactive : notification a la prochaine connexion.')
                        }}>Desactiver</Btn>
                        <Btn color="#EF4444" onClick={async () => {
                          const motif = window.prompt('Motif de la suppression (optionnel) :') || ''
                          if (!window.confirm('Marquer ce compte comme supprime ? L\\'utilisateur recevra une notification a sa prochaine connexion et pourra purger ses donnees.')) return
                          await fetch(`${API}/beautycrm/entreprise/admin/delete-personal`, {
                            method: 'POST', headers,
                            body: JSON.stringify({ email: selectedBeautyUser.email, motif })
                          })
                          setSelectedBeautyUser(null)
                          setMessage('Compte marque supprime : notification a la prochaine connexion.')
                        }}>Supprimer</Btn>"""

s = s.replace(old, new)
open(p, "w").write(s)
print("Dashboard.jsx OK")
