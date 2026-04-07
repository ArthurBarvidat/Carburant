'use client'

// Écran de chargement global avec animation pulsée
export default function LoadingScreen({ message = 'Chargement…' }: { message?: string }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ position: 'relative', marginBottom: '24px' }}>
        {/* Anneau animé */}
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%',
          border: '3px solid rgba(168,85,247,.15)',
          borderTopColor: '#a855f7',
          animation: 'wf-spin .8s linear infinite',
        }} />
        {/* Logo centré */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '28px',
        }}>🐺</div>
      </div>

      <div style={{
        fontSize: '15px', fontWeight: 700, color: '#c084fc',
        animation: 'wf-pulse 1.5s ease-in-out infinite',
      }}>{message}</div>

      <style>{`
        @keyframes wf-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes wf-pulse {
          0%,100% { opacity: .5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// Skeleton d'une carte (pour listes)
export function SkeletonCard({ lines = 2 }: { lines?: number }) {
  return (
    <div style={{
      background: 'rgba(15,10,40,.85)', border: '1.5px solid rgba(139,92,246,.1)',
      borderRadius: '14px', padding: '16px', marginBottom: '10px',
      animation: 'wf-shimmer 1.4s ease-in-out infinite',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: lines > 1 ? '10px' : 0 }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(168,85,247,.1)', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: '14px', borderRadius: '6px', background: 'rgba(168,85,247,.12)', marginBottom: '8px', width: '60%' }} />
          <div style={{ height: '11px', borderRadius: '6px', background: 'rgba(168,85,247,.07)', width: '40%' }} />
        </div>
      </div>
      {lines > 1 && (
        <div style={{ height: '11px', borderRadius: '6px', background: 'rgba(168,85,247,.07)', width: '80%' }} />
      )}
      <style>{`
        @keyframes wf-shimmer {
          0%,100% { opacity: .6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// Skeleton d'une stat (grille 2 colonnes)
export function SkeletonStat() {
  return (
    <div style={{
      background: 'rgba(15,10,40,.85)', border: '1.5px solid rgba(139,92,246,.1)',
      borderRadius: '14px', padding: '16px', textAlign: 'center',
      animation: 'wf-shimmer 1.4s ease-in-out infinite',
    }}>
      <div style={{ height: '24px', borderRadius: '6px', background: 'rgba(168,85,247,.12)', marginBottom: '8px', width: '50%', margin: '0 auto 8px' }} />
      <div style={{ height: '11px', borderRadius: '6px', background: 'rgba(168,85,247,.07)', width: '70%', margin: '0 auto' }} />
    </div>
  )
}
