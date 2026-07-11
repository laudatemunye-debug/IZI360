p = "src/routes/beautycrmEntreprise.js"
s = open(p).read()

old = "module.exports = router"
assert s.count(old) == 1, f"module.exports: {s.count(old)}"

new_route = '''
// Liste des comptes personnels desactives (suspendu) ou supprimes en attente de purge
router.get('/admin/list-personal', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Acces refuse' })
    const result = await pool.query(
      "SELECT nom, email, suspendu, motif_suspension, suspended_at, supprime, motif_suppression, deleted_at FROM beautycrm_users WHERE suspendu=true OR supprime=true ORDER BY COALESCE(deleted_at, suspended_at) DESC"
    )
    res.json(result.rows)
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

module.exports = router'''

s = s.replace(old, new_route)
open(p, "w").write(s)
print("beautycrmEntreprise.js OK")
