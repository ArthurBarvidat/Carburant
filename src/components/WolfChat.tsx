'use client'
import { useState, useRef, useEffect } from 'react'

type Topic = 'fuel' | 'ev' | null
interface Msg { role: 'user' | 'assistant'; text: string }

const SUGGESTIONS = {
  fuel: [
    'Quel carburant est le moins cher ?',
    'C\'est quoi le E85 ?',
    'Comment économiser sur l\'essence ?',
    'Différence SP95 et SP98 ?',
    'C\'est quoi le GPLc ?',
    'Pourquoi les prix varient autant ?',
  ],
  ev: [
    'C\'est quoi le Type 2 ?',
    'Différence CCS et CHAdeMO ?',
    'Combien de temps pour recharger ?',
    'Les bornes sont payantes ?',
    'Ma voiture est-elle compatible ?',
    'Quel connecteur pour Tesla ?',
  ],
}

export default function WolfChat() {
  const [open,    setOpen]    = useState(false)
  const [topic,   setTopic]   = useState<Topic>(null)
  const [msgs,    setMsgs]    = useState<Msg[]>([])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, open, topic, loading])

  function chooseTopic(t: Topic) {
    setTopic(t)
    const greeting = t === 'fuel'
      ? '⛽ Salut ! Je suis WolfBot, propulsé par l\'IA Groq. Pose-moi ta question sur les carburants !'
      : '⚡ Salut ! Je suis WolfBot, propulsé par l\'IA Groq. Pose-moi ta question sur les bornes de recharge !'
    setMsgs([{ role: 'assistant', text: greeting }])
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  function resetTopic() {
    setTopic(null)
    setMsgs([])
    setInput('')
  }

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || !topic || loading) return

    const userMsg: Msg = { role: 'user', text: trimmed }
    const history = [...msgs, userMsg]
    setMsgs(history)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          messages: history.map(m => ({ role: m.role, content: m.text })),
        }),
      })
      const data = await res.json()
      const reply = data.reply ?? data.error ?? '❌ Erreur de réponse.'
      setMsgs(prev => [...prev, { role: 'assistant', text: reply }])
    } catch {
      setMsgs(prev => [...prev, { role: 'assistant', text: '❌ Impossible de contacter l\'IA. Vérifie ta connexion.' }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  const suggestions = topic ? SUGGESTIONS[topic] : []

  return (
    <>
      {open && (
        <div style={{
          position: 'fixed', bottom: 80, right: 16, width: 320,
          background: 'rgba(6,3,20,.97)', border: '1.5px solid rgba(168,85,247,.35)',
          borderRadius: 20, zIndex: 99990, display: 'flex', flexDirection: 'column',
          boxShadow: '0 8px 40px rgba(0,0,0,.8)', fontFamily: "'DM Sans',sans-serif",
          maxHeight: 540, overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(168,85,247,.15)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <img src="/wolf-logo.png" alt="Wolf" style={{ width: 28, height: 28, borderRadius: '50%' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#f1f5f9' }}>WolfBot</div>
              <div style={{ fontSize: 11, color: '#a855f7', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                {topic === 'fuel' ? '⛽ Carburants · Groq AI' : topic === 'ev' ? '⚡ Bornes EV · Groq AI' : 'Propulsé par Groq AI'}
              </div>
            </div>
            {topic && (
              <button onClick={resetTopic} style={{ padding: '4px 8px', borderRadius: 8, border: '1px solid rgba(168,85,247,.3)', background: 'rgba(168,85,247,.1)', color: '#c084fc', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                🔄 Sujet
              </button>
            )}
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: 0 }}>
              ✕
            </button>
          </div>

          {/* Sélection sujet */}
          {!topic && (
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', textAlign: 'center', lineHeight: 1.5 }}>
                🐺 Salut ! Sur quoi veux-tu que je t&apos;aide ?
              </p>
              <button onClick={() => chooseTopic('fuel')} style={{ padding: '16px 14px', borderRadius: 14, border: '1.5px solid rgba(251,191,36,.3)', background: 'rgba(251,191,36,.08)', color: '#fbbf24', fontSize: 14, fontWeight: 700, cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans',sans-serif" }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>⛽</div>
                <div>Prix carburants</div>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400, marginTop: 3 }}>Gazole, SP95, E85, GPLc, conseils économies</div>
              </button>
              <button onClick={() => chooseTopic('ev')} style={{ padding: '16px 14px', borderRadius: 14, border: '1.5px solid rgba(6,182,212,.3)', background: 'rgba(6,182,212,.08)', color: '#06b6d4', fontSize: 14, fontWeight: 700, cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans',sans-serif" }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>⚡</div>
                <div>Bornes de recharge EV</div>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400, marginTop: 3 }}>Type 2, CCS, CHAdeMO, temps de charge, compatibilité</div>
              </button>
              <div style={{ textAlign: 'center', fontSize: 10, color: '#334155', marginTop: 4 }}>
                Propulsé par <span style={{ color: '#a855f7', fontWeight: 700 }}>Groq AI · Llama 3.3 70B</span>
              </div>
            </div>
          )}

          {/* Messages */}
          {topic && (
            <>
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
                {msgs.map((m, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '88%', padding: '9px 13px',
                      borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      background: m.role === 'user' ? 'linear-gradient(135deg,#a855f7,#7c3aed)' : 'rgba(168,85,247,.1)',
                      border: m.role === 'user' ? 'none' : '1px solid rgba(168,85,247,.2)',
                      color: '#f1f5f9', fontSize: 13, lineHeight: 1.55, whiteSpace: 'pre-wrap',
                    }}>
                      {m.text}
                    </div>
                  </div>
                ))}

                {/* Indicateur de frappe */}
                {loading && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{
                      padding: '10px 14px', borderRadius: '14px 14px 14px 4px',
                      background: 'rgba(168,85,247,.1)', border: '1px solid rgba(168,85,247,.2)',
                      display: 'flex', gap: 4, alignItems: 'center',
                    }}>
                      {[0, 1, 2].map(i => (
                        <span key={i} style={{
                          width: 7, height: 7, borderRadius: '50%', background: '#a855f7',
                          display: 'inline-block',
                          animation: `wf-bounce .9s ease-in-out ${i * 0.15}s infinite`,
                        }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Suggestions */}
              <div style={{ padding: '8px 14px', borderTop: '1px solid rgba(168,85,247,.1)', flexShrink: 0 }}>
                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>Suggestions</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {suggestions.slice(0, 4).map((q, i) => (
                    <button key={i} onClick={() => send(q)} disabled={loading} style={{
                      padding: '5px 9px', borderRadius: 10, border: '1px solid rgba(168,85,247,.25)',
                      background: 'rgba(168,85,247,.07)', color: '#c084fc', fontSize: 11, fontWeight: 600,
                      cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans',sans-serif", textAlign: 'left',
                      opacity: loading ? 0.5 : 1,
                    }}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input */}
              <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(168,85,247,.12)', display: 'flex', gap: 8, flexShrink: 0 }}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) send(input) }}
                  placeholder={loading ? 'WolfBot répond…' : 'Pose ta question…'}
                  disabled={loading}
                  style={{
                    flex: 1, padding: '9px 12px', borderRadius: 12,
                    border: '1px solid rgba(168,85,247,.3)',
                    background: 'rgba(168,85,247,.08)', color: '#f1f5f9', fontSize: 13,
                    fontFamily: "'DM Sans',sans-serif", outline: 'none',
                    WebkitAppearance: 'none', opacity: loading ? 0.6 : 1,
                  }}
                />
                <button onClick={() => send(input)} disabled={loading || !input.trim()} style={{
                  padding: '9px 13px', borderRadius: 12, border: 'none',
                  background: loading || !input.trim() ? 'rgba(168,85,247,.3)' : 'linear-gradient(135deg,#a855f7,#7c3aed)',
                  color: '#fff', fontSize: 16, cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', flexShrink: 0,
                }}>➤</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* FAB */}
      <button onClick={() => setOpen(o => !o)} style={{
        position: 'fixed', bottom: 20, right: 16, width: 54, height: 54,
        borderRadius: '50%', border: '2px solid rgba(168,85,247,.6)',
        background: 'linear-gradient(135deg,#a855f7,#7c3aed)',
        cursor: 'pointer', zIndex: 99991, display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(168,85,247,.55)', transition: 'transform .2s', padding: 0,
      }} title="WolfBot — Assistant IA">
        <img src="/wolf-logo.png" alt="Wolf" style={{ width: 34, height: 34, borderRadius: '50%' }} />
      </button>

      <style>{`
        @keyframes wf-bounce {
          0%,80%,100% { transform: scale(0.6); opacity:.4; }
          40% { transform: scale(1); opacity:1; }
        }
      `}</style>
    </>
  )
}
