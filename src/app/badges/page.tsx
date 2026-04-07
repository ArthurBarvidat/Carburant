'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { SkeletonCard } from '@/components/LoadingScreen'

type Badge = {
  id: string; name: string; description: string; icon: string
  condition_type: string; condition_value: number
  earned: boolean; earned_at: string | null; progress: number; current: number
}

type Stats = {
  fill_ups_count: number; savings_total: number; friends_count: number; is_pro: number
}

export default function BadgesPage() {
  const router = useRouter()
  const [badges, setBadges] = useState<Badge[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.replace('/login'); return }
      const res = await fetch(`/api/badges?userId=${data.user.id}`)
      const json = await res.json()
      setBadges(json.badges ?? [])
      setStats(json.stats ?? null)
      setLoading(false)
    })
  }, [router])

  const earned = badges.filter(b => b.earned)
  const notEarned = badges.filter(b => !b.earned)

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  function getConditionLabel(b: Badge): string {
    const v = b.condition_value
    switch (b.condition_type) {
      case 'fill_ups_count': return `${b.current}/${v} pleins enregistrés`
      case 'savings_total': return `${(b.current ?? 0).toFixed(2)}€/${v}€ économisés`
      case 'friends_count': return `${b.current}/${v} ami${v > 1 ? 's' : ''}`
      case 'is_pro': return b.current >= 1 ? 'Abonné Pro ✓' : 'Abonnement Pro requis'
      default: return ''
    }
  }

  return (
    <div style={{ minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", color: '#e2e8f0', padding: '24px 20px 60px' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <a href="/profil" style={{ color: '#64748b', textDecoration: 'none', fontSize: '20px' }}>←</a>
          <h1 style={{
            fontSize: '20px', fontWeight: 800,
            background: 'linear-gradient(135deg,#ffd700,#f59e0b)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>🏅 Mes badges</h1>
        </div>

        {/* Compteur */}
        {!loading && (
          <div style={{
            background: 'linear-gradient(135deg,rgba(245,158,11,.12),rgba(217,119,6,.08))',
            border: '1.5px solid rgba(245,158,11,.3)', borderRadius: '14px',
            padding: '16px 20px', marginBottom: '16px',
            display: 'flex', alignItems: 'center', gap: '16px',
          }}>
            <div style={{ fontSize: '40px' }}>🏆</div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#fbbf24' }}>
                {earned.length} <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 600 }}>/ {badges.length} badges</span>
              </div>
              <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
                {earned.length === badges.length ? '🎉 Tu as tous les badges !' : `Plus que ${notEarned.length} à débloquer !`}
              </div>
            </div>
            {stats && (
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  ⛽ {stats.fill_ups_count} pleins<br />
                  💰 {stats.savings_total.toFixed(0)}€ éco.<br />
                  👥 {stats.friends_count} ami{stats.friends_count !== 1 ? 's' : ''}
                </div>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <>{[1,2,3,4,5].map(i => <SkeletonCard key={i} />)}</>
        ) : (
          <>
            {/* Badges gagnés */}
            {earned.length > 0 && (
              <>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#64748b', marginBottom: '10px' }}>
                  ✅ Obtenus ({earned.length})
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
                  {earned.map(b => (
                    <div key={b.id} style={{
                      background: 'linear-gradient(135deg,rgba(245,158,11,.12),rgba(217,119,6,.08))',
                      border: '1.5px solid rgba(245,158,11,.4)',
                      borderRadius: '14px', padding: '16px 12px',
                      textAlign: 'center', position: 'relative',
                    }}>
                      <div style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '12px' }}>✅</div>
                      <div style={{ fontSize: '36px', marginBottom: '6px' }}>{b.icon}</div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#fbbf24', marginBottom: '4px' }}>{b.name}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.3' }}>{b.description}</div>
                      {b.earned_at && (
                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '6px' }}>
                          🗓️ {formatDate(b.earned_at)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Badges à débloquer */}
            {notEarned.length > 0 && (
              <>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#64748b', marginBottom: '10px' }}>
                  🔒 À débloquer ({notEarned.length})
                </div>
                {notEarned.map(b => (
                  <div key={b.id} style={{
                    background: 'rgba(15,10,40,.7)', border: '1.5px solid rgba(139,92,246,.15)',
                    borderRadius: '14px', padding: '14px 16px', marginBottom: '8px',
                    display: 'flex', alignItems: 'center', gap: '14px', opacity: 0.7,
                  }}>
                    <div style={{ fontSize: '32px', filter: 'grayscale(100%)', opacity: 0.5, flexShrink: 0 }}>
                      {b.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#94a3b8', marginBottom: '2px' }}>{b.name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>{b.description}</div>
                      {/* Barre de progression */}
                      <div style={{ background: 'rgba(139,92,246,.1)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: '4px',
                          background: 'linear-gradient(90deg,#7c3aed,#a855f7)',
                          width: b.progress + '%', transition: 'width .3s ease',
                        }} />
                      </div>
                      <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>
                        {getConditionLabel(b)} · {b.progress}%
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
