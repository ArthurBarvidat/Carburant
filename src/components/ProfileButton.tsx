'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ProfileButton() {
  const router = useRouter()
  const [isPro, setIsPro] = useState(false)
  const [initial, setInitial] = useState('?')
  const [pendingCount, setPendingCount] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const userIdRef = useRef<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 4000)
  }

  const loadPending = async (uid: string) => {
    const { data } = await supabase
      .from('friends')
      .select('id')
      .eq('friend_id', uid)
      .eq('status', 'pending')
    setPendingCount(data?.length ?? 0)
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      const uid = data.user.id
      userIdRef.current = uid
      setInitial((data.user.email?.[0] ?? '?').toUpperCase())

      supabase.from('profiles').select('is_pro,pseudo').eq('id', uid).single()
        .then(({ data: p }) => {
          if (p?.is_pro) setIsPro(true)
          if (p?.pseudo) setInitial(p.pseudo[0].toUpperCase())
        })

      loadPending(uid)

      const channel = supabase
        .channel('friend-requests')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'friends',
            filter: `friend_id=eq.${uid}`,
          },
          async (payload) => {
            if (payload.new.status === 'pending') {
              const { data: sender } = await supabase
                .from('profiles')
                .select('pseudo')
                .eq('id', payload.new.user_id)
                .single()
              const name = sender?.pseudo ?? 'Quelqu\'un'
              showToast(`👥 ${name} veut être ton ami !`)
              loadPending(uid)
            }
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    })
  }, [])

  return (
    <>
      {/* Toast notification */}
      {toast && (
        <div
          onClick={() => router.push('/amis')}
          style={{
            position: 'fixed',
            top: '70px',
            right: '16px',
            zIndex: 99998,
            background: 'rgba(15,10,40,.97)',
            border: '1.5px solid rgba(168,85,247,.5)',
            borderRadius: '14px',
            padding: '12px 16px',
            color: '#f1f5f9',
            fontSize: '14px',
            fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: '0 4px 24px rgba(168,85,247,.3)',
            cursor: 'pointer',
            maxWidth: '260px',
            animation: 'slideIn .3s ease',
          }}
        >
          {toast}
          <div style={{ fontSize: '11px', color: '#a855f7', marginTop: '3px', fontWeight: 600 }}>
            Voir les demandes →
          </div>
        </div>
      )}

      {/* Bouton profil */}
      <div style={{ position: 'fixed', top: '14px', right: '14px', zIndex: 99999 }}>
        <button
          onClick={() => router.push('/profil')}
          title="Mon profil"
          style={{
            height: '42px',
            minWidth: '42px',
            paddingLeft: '12px',
            paddingRight: '14px',
            borderRadius: '21px',
            border: isPro ? '2px solid #a855f7' : '2px solid rgba(168,85,247,.5)',
            background: isPro
              ? 'linear-gradient(135deg,#a855f7,#7c3aed)'
              : 'rgba(15,10,40,.95)',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            fontFamily: "'DM Sans',sans-serif",
            boxShadow: isPro
              ? '0 0 16px rgba(168,85,247,.6), 0 2px 12px rgba(0,0,0,.5)'
              : '0 2px 12px rgba(0,0,0,.6)',
            transition: 'all .2s',
            position: 'relative',
            backdropFilter: 'blur(8px)',
            whiteSpace: 'nowrap',
          }}
        >
          {/* Avatar cercle */}
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
            background: isPro ? 'rgba(255,255,255,.2)' : 'rgba(168,85,247,.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: 800,
            border: '1.5px solid rgba(255,255,255,.25)',
          }}>
            {isPro ? '⭐' : initial}
          </div>
          <span style={{ fontSize: '13px', fontWeight: 700, color: isPro ? '#fff' : '#e2e8f0' }}>
            Profil
          </span>
        </button>

        {/* Badge demandes */}
        {pendingCount > 0 && (
          <div
            onClick={() => router.push('/amis')}
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: '#ef4444',
              border: '2px solid #0d0a1a',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            {pendingCount > 9 ? '9+' : pendingCount}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </>
  )
}
