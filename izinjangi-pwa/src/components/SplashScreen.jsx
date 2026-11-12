import logoLikelemba from '../assets/logo-likelemba.png'
import { getAppLogo } from '../data/appIdentity'

export default function SplashScreen({ progress = 0 }) {
  const pct = Math.min(100, Math.max(0, Math.round(progress)))
  return (
    <div style={{ height: '100dvh', maxWidth: 480, margin: '0 auto', backgroundColor: '#F4F4F0', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'calc(env(safe-area-inset-top) + 14vh) 32px calc(env(safe-area-inset-bottom) + 40px)', boxSizing: 'border-box' }}>
      <div style={{ width: 112, height: 112, borderRadius: 30, backgroundColor: '#fff', border: '1px solid #D3D1C7', boxShadow: '0 10px 28px rgba(8,80,65,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src={getAppLogo() || logoLikelemba} alt="Likelemba" style={{ width: '72%', height: '72%', objectFit: 'contain', borderRadius: 12 }} />
      </div>
      <h1 style={{ color: '#085041', fontSize: 34, fontWeight: 800, margin: '24px 0 0', letterSpacing: -0.5 }}>Likelemba</h1>
      <p style={{ color: '#5F5E5A', fontSize: 15, margin: '6px 0 0' }}>Gestion de tontine</p>
      <div style={{ flex: 1 }} />
      <div style={{ width: '100%', maxWidth: 320 }}>
        <div style={{ height: 8, borderRadius: 4, backgroundColor: '#D3D1C7', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: pct + '%', backgroundColor: '#1D9E75', borderRadius: 4, transition: 'width .1s linear' }} />
        </div>
        <p style={{ color: '#5F5E5A', fontSize: 12, textAlign: 'center', margin: '10px 0 0' }}>Chargement… {pct}%</p>
      </div>
    </div>
  )
}
