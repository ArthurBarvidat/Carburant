'use client'

import { useRouter } from 'next/navigation'

export default function AuRevoirPage() {
  const router = useRouter()

  return (
    <div style={{ minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", color: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{
        textAlign: 'center',
        background: 'rgba(15,10,40,.85)',
        border: '1.5px solid rgba(139,92,246,.25)',
        borderRadius: '24px',
        padding: '48px 32px',
        maxWidth: '480px',
        width: '100%',
        boxShadow: '0 8px 40px rgba(0,0,0,.5)',
      }}>
        <div style={{ fontSize: '72px', marginBottom: '8px' }}>🐺</div>
        <div style={{ fontSize: '40px', marginBottom: '20px' }}>😢</div>

        <h1 style={{
          fontSize: '26px', fontWeight: 800, marginBottom: '16px',
          background: 'linear-gradient(135deg,#c084fc,#a855f7)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          La meute va te manquer...
        </h1>

        <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: 1.7, marginBottom: '12px' }}>
          C'est avec tristesse que nous apprenons ton départ de <strong style={{ color: '#c084fc' }}>Wolf Pro</strong>. 🐺
        </p>

        <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.7, marginBottom: '24px' }}>
          Tu garderas ton accès à toutes les fonctionnalités Pro jusqu'à la fin de ta période en cours.<br />
          <strong style={{ color: '#94a3b8' }}>Aucun prélèvement ne sera effectué le mois prochain.</strong>
        </p>

        <div style={{
          padding: '16px',
          borderRadius: '14px',
          background: 'rgba(168,85,247,.06)',
          border: '1px solid rgba(168,85,247,.15)',
          marginBottom: '28px',
          fontSize: '13px',
          color: '#64748b',
          lineHeight: 1.6,
        }}>
          💡 Si tu changes d'avis, tu peux réactiver ton abonnement à tout moment depuis la page abonnement.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={() => router.replace('/')}
            style={{
              padding: '14px 32px', borderRadius: '14px', border: 'none',
              background: 'linear-gradient(135deg,#a855f7,#7c3aed)',
              color: '#fff', fontWeight: 800, fontSize: '15px', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            🏠 Retour à l'accueil
          </button>

          <button
            onClick={() => router.replace('/abonnement')}
            style={{
              padding: '12px 32px', borderRadius: '14px',
              border: '1.5px solid rgba(168,85,247,.3)',
              background: 'rgba(168,85,247,.06)',
              color: '#c084fc', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            🐺 Annuler la résiliation
          </button>
        </div>
      </div>
    </div>
  )
}
