'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Friend = {
  friendshipId: string
  friendId: string
  pseudo?: string
  is_pro?: boolean
  last_seen?: string
  avatar_url?: string
}

type SearchUser = {
  id: string
  pseudo?: string
  is_pro?: boolean
  last_seen?: string
  avatar_url?: string
}

function getStatus(last_seen?: string): { label: string; color: string; dot: string } {
  if (!last_seen) return { label: 'Jamais connecté', color: '#475569', dot: '#475569' }
  const diff = Date.now() - new Date(last_seen).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 5) return { label: 'En ligne', color: '#34d399', dot: '#34d399' }
  if (mins < 60) return { label: `Vu il y a ${mins} min`, color: '#94a3b8', dot: '#f59e0b' }
  const hours = Math.floor(mins / 60)
  if (hours < 24) return { label: `Vu il y a ${hours}h`, color: '#64748b', dot: '#64748b' }
  const days = Math.floor(hours / 24)
  return { label: `Vu il y a ${days}j`, color: '#475569', dot: '#475569' }
}

const card: React.CSSProperties = {
  background: 'rgba(15,10,40,.85)',
  border: '1.5px solid rgba(139,92,246,.25)',
  borderRadius: '14px',
  padding: '14px 16px',
  marginBottom: '10px',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
}

export default function AmisPage() {
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [friends, setFriends] = useState<Friend[]>([])
  const [requests, setRequests] = useState<Friend[]>([])
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<SearchUser[]>([])
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  const loadFriends = useCallback(async (uid: string) => {
    const res = await fetch(`/api/friends?userId=${uid}`)
    const data = await res.json()
    setFriends(data.friends ?? [])
    setRequests(data.requests ?? [])
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace('/login'); return }
      setUserId(data.user.id)
      // Mettre à jour la présence
      fetch('/api/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: data.user.id }),
      })
      loadFriends(data.user.id).then(() => setLoading(false))
    })
  }, [router, loadFriends])

  const handleSearch = async () => {
    if (!search.trim()) return
    setSearching(true)
    const res = await fetch(`/api/presence?pseudo=${encodeURIComponent(search)}&userId=${userId}`)
    const data = await res.json()
    setResults(data.users ?? [])
    setSearching(false)
  }

  const sendRequest = async (friendId: string, pseudo?: string) => {
    await fetch('/api/friends', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, friendId }),
    })
    setMsg(`Demande envoyée à ${pseudo ?? 'cet utilisateur'} !`)
    setResults([])
    setSearch('')
    setTimeout(() => setMsg(''), 3000)
  }

  const acceptRequest = async (friendshipId: string, friendId: string) => {
    await fetch('/api/friends', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, friendId, action: 'accept' }),
    })
    loadFriends(userId)
  }

  const removeFriend = async (friendshipId: string) => {
    await fetch('/api/friends', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ friendshipId }),
    })
    loadFriends(userId)
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '.08em', color: '#64748b', marginBottom: '10px', display: 'block',
  }

  return (
    <div style={{ minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", color: '#e2e8f0', padding: '24px 20px' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <a href="/" style={{ color: '#64748b', textDecoration: 'none', fontSize: '20px' }}>←</a>
          <h1 style={{
            fontSize: '20px', fontWeight: 800,
            background: 'linear-gradient(135deg,#c084fc,#a855f7)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>Mes amis</h1>
        </div>

        {/* Recherche */}
        <div style={{
          background: 'rgba(15,10,40,.85)', border: '1.5px solid rgba(139,92,246,.25)',
          borderRadius: '16px', padding: '16px', marginBottom: '16px',
        }}>
          <span style={labelStyle}>Ajouter un ami par pseudo</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Rechercher un pseudo..."
              style={{
                flex: 1, padding: '11px 14px', borderRadius: '10px',
                border: '1.5px solid rgba(168,85,247,.2)',
                background: 'rgba(168,85,247,.06)',
                color: '#f1f5f9', fontSize: '14px', outline: 'none',
                fontFamily: "'DM Sans', sans-serif",
              }}
            />
            <button onClick={handleSearch} disabled={searching} style={{
              padding: '11px 16px', borderRadius: '10px', border: 'none',
              background: 'linear-gradient(135deg,#a855f7,#7c3aed)',
              color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {searching ? '...' : '🔍'}
            </button>
          </div>

          {/* Résultats recherche */}
          {results.map(u => {
            const st = getStatus(u.last_seen)
            const alreadyFriend = friends.some(f => f.friendId === u.id)
            const requested = requests.some(r => r.friendId === u.id)
            return (
              <div key={u.id} style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '10px', background: 'rgba(168,85,247,.06)' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,rgba(168,85,247,.3),rgba(124,58,237,.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0, overflow: 'hidden' }}>
                  {u.avatar_url
                    ? <img src={u.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : (u.pseudo?.[0]?.toUpperCase() ?? '?')
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#f1f5f9' }}>
                    {u.pseudo ?? 'Anonyme'} {u.is_pro ? '🐺⭐' : ''}
                  </div>
                  <div style={{ fontSize: '12px', color: st.color, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: st.dot, display: 'inline-block' }} />
                    {st.label}
                  </div>
                </div>
                {!alreadyFriend && !requested && (
                  <button onClick={() => sendRequest(u.id, u.pseudo)} style={{
                    padding: '7px 12px', borderRadius: '8px', border: 'none',
                    background: 'linear-gradient(135deg,#a855f7,#7c3aed)',
                    color: '#fff', fontWeight: 700, fontSize: '12px', cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                  }}>+ Ajouter</button>
                )}
                {alreadyFriend && <span style={{ fontSize: '12px', color: '#34d399', fontWeight: 700 }}>✓ Ami</span>}
                {requested && <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 700 }}>En attente</span>}
              </div>
            )
          })}

          {msg && <p style={{ marginTop: '10px', fontSize: '13px', color: '#34d399', fontWeight: 700, textAlign: 'center' }}>{msg}</p>}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>Chargement...</div>
        ) : (
          <>
            {/* Demandes reçues */}
            {requests.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <span style={labelStyle}>Demandes reçues ({requests.length})</span>
                {requests.map(r => (
                  <div key={r.friendshipId} style={card}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg,rgba(245,158,11,.3),rgba(217,119,6,.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0, border: '2px solid rgba(245,158,11,.4)', overflow: 'hidden' }}>
                      {r.avatar_url
                        ? <img src={r.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : (r.pseudo?.[0]?.toUpperCase() ?? '?')
                      }
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: '#f1f5f9' }}>{r.pseudo ?? 'Anonyme'} {r.is_pro ? '🐺⭐' : ''}</div>
                      <div style={{ fontSize: '12px', color: '#f59e0b' }}>Veut être ton ami</div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => acceptRequest(r.friendshipId, r.friendId)} style={{ padding: '7px 12px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontWeight: 700, fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>✓ Accepter</button>
                      <button onClick={() => removeFriend(r.friendshipId)} style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid rgba(239,68,68,.4)', background: 'rgba(239,68,68,.08)', color: '#f87171', fontWeight: 700, fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>✗</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Liste amis */}
            <span style={labelStyle}>Mes amis ({friends.length})</span>
            {friends.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: '#475569' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🐺</div>
                <div style={{ fontWeight: 600 }}>Aucun ami pour l'instant</div>
                <div style={{ fontSize: '13px', marginTop: '4px' }}>Recherche un pseudo pour ajouter des amis !</div>
              </div>
            ) : (
              friends.map(f => {
                const st = getStatus(f.last_seen)
                return (
                  <div key={f.friendshipId} style={card}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: f.is_pro ? 'linear-gradient(135deg,rgba(168,85,247,.3),rgba(124,58,237,.2))' : 'rgba(30,20,60,.8)', border: f.is_pro ? '2px solid rgba(168,85,247,.5)' : '2px solid rgba(100,116,139,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', overflow: 'hidden' }}>
                        {f.avatar_url
                          ? <img src={f.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : (f.pseudo?.[0]?.toUpperCase() ?? '?')
                        }
                      </div>
                      {/* Point de statut */}
                      <span style={{ position: 'absolute', bottom: '1px', right: '1px', width: '10px', height: '10px', borderRadius: '50%', background: st.dot, border: '2px solid #0d0a1a' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '15px', color: '#f1f5f9' }}>
                        {f.pseudo ?? 'Anonyme'} {f.is_pro ? '🐺⭐' : ''}
                      </div>
                      <div style={{ fontSize: '12px', color: st.color, marginTop: '2px' }}>{st.label}</div>
                      <div style={{ fontSize: '11px', color: '#475569', marginTop: '1px' }}>
                        {f.is_pro ? 'Wolf Pro' : 'Gratuit'}
                      </div>
                    </div>
                    <button onClick={() => removeFriend(f.friendshipId)} style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid rgba(239,68,68,.3)', background: 'rgba(239,68,68,.06)', color: '#f87171', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                      Retirer
                    </button>
                  </div>
                )
              })
            )}
          </>
        )}
      </div>
    </div>
  )
}
