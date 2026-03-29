'use client'

import Link from 'next/link'
import AnimatedBackground from '@/components/AnimatedBackground'

export default function SuccessPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(165deg,#0d0a1a 0%,#1a1130 40%,#120e20 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif", color: '#e2e8f0', padding: '20px',
    }}>
      <AnimatedBackground />
      <div style={{
        position: 'relative', zIndex: 1, textAlign: 'center',
        background: 'rgba(15,10,40,.85)',
        border: '1.5px solid rgba(16,185,129,.4)',
        borderRadius: '24px', padding: '48px 32px', maxWidth: '420px', width: '100%',
        boxShadow: '0 8px 40px rgba(16,185,129,.2)',
      }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
        <h1 style={{
          fontSize: '26px', fontWeight: 800, marginBottom: '12px',
          background: 'linear-gradient(135deg,#34d399,#10b981)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>Bienvenue dans la meute !</h1>
        <p style={{ color: '#94a3b8', fontSize: '15px', marginBottom: '8px' }}>
          Tu es maintenant <strong style={{ color: '#c084fc' }}>🐺⭐ Wolf Pro</strong>
        </p>
        <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '32px' }}>
          Toutes les fonctionnalités premium sont débloquées.
        </p>
        <Link href="/" style={{
          display: 'inline-block', padding: '14px 32px', borderRadius: '14px',
          background: 'linear-gradient(135deg,#a855f7,#7c3aed)',
          color: '#fff', fontWeight: 800, fontSize: '16px', textDecoration: 'none',
        }}>
          🐺 Commencer la chasse
        </Link>
      </div>
    </div>
  )
}
