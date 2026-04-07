'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Message = {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  read: boolean
  created_at: string
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.getHours() + 'h' + String(d.getMinutes()).padStart(2, '0')
  return d.getDate() + '/' + String(d.getMonth() + 1).padStart(2, '0') + ' ' + d.getHours() + 'h' + String(d.getMinutes()).padStart(2, '0')
}

export default function ChatPage() {
  const router = useRouter()
  const params = useParams()
  const friendId = params.friendId as string

  const [userId, setUserId] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [friendProfile, setFriendProfile] = useState<{ pseudo?: string; avatar_url?: string; is_pro?: boolean } | null>(null)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const loadMessages = useCallback(async (uid: string) => {
    const res = await fetch(`/api/messages?userId=${uid}&friendId=${friendId}`)
    const data = await res.json()
    setMessages(data.messages ?? [])
  }, [friendId])

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.replace('/login'); return }
      const uid = data.user.id
      setUserId(uid)

      // Charger profil ami
      const { data: profile } = await supabase
        .from('profiles')
        .select('pseudo, avatar_url, is_pro')
        .eq('id', friendId)
        .single()
      setFriendProfile(profile)

      await loadMessages(uid)
      setLoading(false)

      // Realtime — écoute tous les INSERT sur messages, filtre côté client
      const channel = supabase
        .channel(`chat:${[uid, friendId].sort().join('-')}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        }, (payload) => {
          const msg = payload.new as Message
          const isConversation =
            (msg.sender_id === uid && msg.receiver_id === friendId) ||
            (msg.sender_id === friendId && msg.receiver_id === uid)
          if (!isConversation) return

          setMessages(prev => {
            // Remplacer le message optimiste si c'est le nôtre
            const tempIdx = prev.findIndex(m => m.id.startsWith('temp-') && m.sender_id === uid && m.content === msg.content)
            if (tempIdx !== -1) {
              const next = [...prev]
              next[tempIdx] = msg
              return next
            }
            // Éviter les doublons
            if (prev.some(m => m.id === msg.id)) return prev
            return [...prev, msg]
          })
        })
        .subscribe()

      channelRef.current = channel
      return () => { supabase.removeChannel(channel) }
    })
  }, [router, friendId, loadMessages])

  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || !userId || sending) return
    setSending(true)
    setInput('')

    // Optimistic
    const tempMsg: Message = {
      id: 'temp-' + Date.now(),
      sender_id: userId,
      receiver_id: friendId,
      content: text,
      read: false,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, tempMsg])

    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderId: userId, receiverId: friendId, content: text }),
    })
    const data = await res.json()
    if (data.message) {
      setMessages(prev => prev.map(m => m.id === tempMsg.id ? data.message : m))
    }
    setSending(false)
    inputRef.current?.focus()
  }

  const name = friendProfile?.pseudo ?? 'Ami'
  const avatar = friendProfile?.avatar_url

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      fontFamily: "'DM Sans', sans-serif", color: '#e2e8f0',
      background: 'linear-gradient(165deg,#0d0a1a 0%,#1a1130 40%,#120e20 100%)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '16px 20px',
        background: 'rgba(15,10,40,.95)',
        borderBottom: '1px solid rgba(139,92,246,.2)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button onClick={() => router.push('/amis')} style={{
          background: 'none', border: 'none', color: '#64748b',
          fontSize: '22px', cursor: 'pointer', padding: '0 4px',
          fontFamily: "'DM Sans', sans-serif",
        }}>←</button>
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%',
          background: 'linear-gradient(135deg,rgba(168,85,247,.3),rgba(124,58,237,.2))',
          border: '2px solid rgba(168,85,247,.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', overflow: 'hidden', flexShrink: 0,
        }}>
          {avatar ? <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : name[0]?.toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '16px', color: '#f1f5f9' }}>
            {name} {friendProfile?.is_pro ? '🐺⭐' : ''}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>Discussion privée</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px 16px 8px',
        display: 'flex', flexDirection: 'column', gap: '8px',
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#64748b', marginTop: '40px' }}>Chargement…</div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#475569', marginTop: '60px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>💬</div>
            <div style={{ fontWeight: 700, fontSize: '16px', color: '#64748b' }}>Commence la conversation !</div>
            <div style={{ fontSize: '13px', marginTop: '6px', color: '#334155' }}>
              Envoie un message à {name}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === userId
            return (
              <div key={msg.id} style={{
                display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start',
                alignItems: 'flex-end', gap: '8px',
              }}>
                {!isMe && (
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(168,85,247,.2)', border: '1.5px solid rgba(168,85,247,.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', overflow: 'hidden',
                  }}>
                    {avatar ? <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : name[0]?.toUpperCase()}
                  </div>
                )}
                <div style={{ maxWidth: '72%' }}>
                  <div style={{
                    padding: '10px 14px', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: isMe
                      ? 'linear-gradient(135deg,#a855f7,#7c3aed)'
                      : 'rgba(30,20,60,.9)',
                    border: isMe ? 'none' : '1.5px solid rgba(139,92,246,.2)',
                    color: '#f1f5f9', fontSize: '15px', lineHeight: '1.4',
                    wordBreak: 'break-word',
                    opacity: msg.id.startsWith('temp-') ? 0.6 : 1,
                  }}>
                    {msg.content}
                  </div>
                  <div style={{
                    fontSize: '11px', color: '#475569', marginTop: '3px',
                    textAlign: isMe ? 'right' : 'left', paddingLeft: '4px', paddingRight: '4px',
                  }}>
                    {formatTime(msg.created_at)}
                    {isMe && !msg.id.startsWith('temp-') && (
                      <span style={{ marginLeft: '4px', color: msg.read ? '#34d399' : '#64748b' }}>
                        {msg.read ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        display: 'flex', gap: '8px', padding: '12px 16px',
        background: 'rgba(15,10,40,.95)',
        borderTop: '1px solid rgba(139,92,246,.2)',
        position: 'sticky', bottom: 0,
      }}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder={`Message à ${name}…`}
          style={{
            flex: 1, padding: '12px 16px', borderRadius: '24px',
            border: '1.5px solid rgba(168,85,247,.25)',
            background: 'rgba(168,85,247,.07)',
            color: '#f1f5f9', fontSize: '15px', outline: 'none',
            fontFamily: "'DM Sans', sans-serif",
          }}
          onFocus={e => (e.target.style.borderColor = 'rgba(168,85,247,.55)')}
          onBlur={e => (e.target.style.borderColor = 'rgba(168,85,247,.25)')}
        />
        <button onClick={sendMessage} disabled={!input.trim() || sending} style={{
          width: '48px', height: '48px', borderRadius: '50%', border: 'none', flexShrink: 0,
          background: input.trim() && !sending
            ? 'linear-gradient(135deg,#a855f7,#7c3aed)'
            : 'rgba(168,85,247,.2)',
          color: '#fff', fontSize: '18px', cursor: input.trim() && !sending ? 'pointer' : 'not-allowed',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all .15s',
        }}>
          ➤
        </button>
      </div>
    </div>
  )
}
