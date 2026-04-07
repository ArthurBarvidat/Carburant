'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { SkeletonCard } from '@/components/LoadingScreen'

type LeaderboardEntry = {
  id: string; pseudo: string; avatar_url: string | null; is_pro: boolean
  totalSaved: number; totalFillUps: number; totalSpent: number
  rank: number; isMe: boolean
}

const RANK_COLORS = ['#ffd700', '#c0c0c0', '#cd7f32']
const RANK_ICONS = ['🥇', '🥈', '🥉']

export default function ClassementPage() {
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'savings' | 'fillups' | 'spent'>('savings')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.replace('/login'); return }
      setUserId(data.user.id)
      const res = await fetch(`/api/leaderboard?userId=${data.user.id}`)
      const json = await res.json()
      setLeaderboard(json.leaderboard ?? [])
      setLoading(false)
    })
  }, [router])

  const sorted = [...leaderboard].sort((a, b) => {
    if (tab === 'savings') return b.totalSaved - a.totalSaved
    if (tab === 'fillups') return b.totalFillUps - a.totalFillUps
    return b.totalSpent - a.totalSpent
  }).map((u, i) => ({ ...u, rank: i + 1 }))

  const myEntry = sorted.find(u => u.isMe)

  return (
    <div style={{ minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", color: '#e2e8f0', padding: '24px 20px 60px' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <a href="/amis" style={{ color: '#64748b', textDecoration: 'none', fontSize: '20px' }}>←</a>
          <h1 style={{
            fontSize: '20px', fontWeight: 800,
            background: 'linear-gradient(135deg,#ffd700,#f59e0b)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>🏆 Classement amis</h1>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
          {[
            { id: 'savings', label: '💰 Économies' },
            { id: 'fillups', label: '⛽ Pleins' },
            { id: 'spent', label: '💶 Dépenses' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as typeof tab)} style={{
              flex: 1, padding: '9px 8px', borderRadius: '10px', border: 'none',
              background: tab === t.id ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'rgba(245,158,11,.1)',
              color: tab === t.id ? '#fff' : '#94a3b8',
              fontWeight: 700, fontSize: '12px', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}>{t.label}</button>
          ))}
        </div>

        {/* Ma position */}
        {myEntry && myEntry.rank > 3 && (
          <div style={{
            background: 'linear-gradient(135deg,rgba(168,85,247,.15),rgba(124,58,237,.1))',
            border: '1.5px solid rgba(168,85,247,.4)',
            borderRadius: '14px', padding: '12px 16px', marginBottom: '12px',
            display: 'flex', alignItems: 'center', gap: '12px',
          }}>
            <span style={{ fontSize: '20px', fontWeight: 800, color: '#c084fc', minWidth: '28px' }}>#{myEntry.rank}</span>
            <span style={{ flex: 1, fontWeight: 700, color: '#f1f5f9' }}>Ta position</span>
            <span style={{ fontWeight: 800, color: '#c084fc' }}>
              {tab === 'savings' ? myEntry.totalSaved.toFixed(2) + '€' :
               tab === 'fillups' ? myEntry.totalFillUps + ' pleins' :
               myEntry.totalSpent.toFixed(2) + '€'}
            </span>
          </div>
        )}

        {loading ? (
          <>{[1,2,3,4].map(i => <SkeletonCard key={i} />)}</>
        ) : sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#475569' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>👥</div>
            <div style={{ fontWeight: 700, color: '#64748b' }}>Aucun ami pour le moment</div>
            <div style={{ fontSize: '13px', marginTop: '6px' }}>Ajoute des amis pour voir le classement !</div>
            <a href="/amis" style={{
              display: 'inline-block', marginTop: '16px', padding: '10px 20px',
              borderRadius: '10px', background: 'linear-gradient(135deg,#a855f7,#7c3aed)',
              color: '#fff', fontSize: '14px', fontWeight: 700, textDecoration: 'none',
            }}>Ajouter des amis</a>
          </div>
        ) : (
          <>
            {/* Podium top 3 */}
            {sorted.length >= 3 && (
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
                {[1, 0, 2].map(idx => {
                  const u = sorted[idx]
                  if (!u) return null
                  const heights = [100, 130, 80]
                  const h = heights[idx]
                  return (
                    <div key={u.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                      {/* Avatar */}
                      <div style={{
                        width: idx === 1 ? '56px' : '44px',
                        height: idx === 1 ? '56px' : '44px',
                        borderRadius: '50%', overflow: 'hidden',
                        border: `3px solid ${RANK_COLORS[u.rank - 1] ?? '#64748b'}`,
                        background: 'rgba(168,85,247,.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: idx === 1 ? '22px' : '18px', marginBottom: '4px',
                        boxShadow: `0 0 16px ${RANK_COLORS[u.rank - 1]}44`,
                      }}>
                        {u.avatar_url
                          ? <img src={u.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : u.pseudo[0]?.toUpperCase()}
                      </div>
                      <div style={{ fontSize: '20px', marginBottom: '2px' }}>{RANK_ICONS[u.rank - 1]}</div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: u.isMe ? '#c084fc' : '#f1f5f9', textAlign: 'center', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {u.isMe ? 'Toi' : u.pseudo}
                      </div>
                      {/* Podium block */}
                      <div style={{
                        width: '100%', height: h + 'px',
                        background: `linear-gradient(180deg, ${RANK_COLORS[u.rank - 1]}33, ${RANK_COLORS[u.rank - 1]}11)`,
                        border: `1.5px solid ${RANK_COLORS[u.rank - 1]}44`,
                        borderRadius: '10px 10px 0 0', marginTop: '4px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexDirection: 'column',
                      }}>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: RANK_COLORS[u.rank - 1] }}>
                          {tab === 'savings' ? u.totalSaved.toFixed(1) + '€' :
                           tab === 'fillups' ? u.totalFillUps :
                           u.totalSpent.toFixed(0) + '€'}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Liste complète */}
            {sorted.map(u => (
              <div key={u.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 16px', borderRadius: '12px', marginBottom: '6px',
                background: u.isMe ? 'rgba(168,85,247,.12)' : 'rgba(15,10,40,.85)',
                border: `1.5px solid ${u.isMe ? 'rgba(168,85,247,.5)' : 'rgba(139,92,246,.2)'}`,
              }}>
                <span style={{
                  fontSize: '16px', fontWeight: 800, minWidth: '28px', textAlign: 'center',
                  color: u.rank <= 3 ? (RANK_COLORS[u.rank - 1] ?? '#64748b') : '#64748b',
                }}>
                  {u.rank <= 3 ? RANK_ICONS[u.rank - 1] : '#' + u.rank}
                </span>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                  background: 'rgba(168,85,247,.2)', border: '1.5px solid rgba(168,85,247,.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
                }}>
                  {u.avatar_url
                    ? <img src={u.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : u.pseudo[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: u.isMe ? '#c084fc' : '#f1f5f9' }}>
                    {u.isMe ? 'Toi' : u.pseudo} {u.is_pro ? '🐺⭐' : ''}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {u.totalFillUps} plein{u.totalFillUps !== 1 ? 's' : ''} · {u.totalSpent.toFixed(0)}€ dépensé
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: '15px', color: tab === 'savings' ? '#34d399' : tab === 'fillups' ? '#a855f7' : '#f1f5f9' }}>
                    {tab === 'savings' ? u.totalSaved.toFixed(2) + '€' :
                     tab === 'fillups' ? u.totalFillUps + ' pleins' :
                     u.totalSpent.toFixed(2) + '€'}
                  </div>
                  {tab === 'savings' && (
                    <div style={{ fontSize: '11px', color: '#475569' }}>économisé</div>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
