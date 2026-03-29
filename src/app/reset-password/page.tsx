'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AnimatedBackground from '@/components/AnimatedBackground'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) { setReady(true); return }
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY' && session) setReady(true)
      })
      return () => subscription.unsubscribe()
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('Le mot de passe doit faire au moins 6 caractères.'); return }
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return }

    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    if (err) {
      setError('Erreur : ' + err.message)
    } else {
      setDone(true)
      await supabase.auth.signOut()
      setTimeout(() => router.replace('/login'), 2500)
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(165deg,#0d0a1a 0%,#1a1130 40%,#120e20 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', fontFamily: "'DM Sans', sans-serif", color: '#e2e8f0',
    }}>
      <AnimatedBackground />
      <div style={{
        background: 'rgba(15,10,40,.85)',
        border: '1.5px solid rgba(139,92,246,.25)',
        borderRadius: '24px', padding: '40px 32px',
        maxWidth: '420px', width: '100%',
        position: 'relative', zIndex: 1,
        boxShadow: '0 8px 40px rgba(0,0,0,.5)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px',
            background: 'linear-gradient(135deg,rgba(168,85,247,.3),rgba(124,58,237,.2))',
            border: '1.5px solid rgba(168,85,247,.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px', fontSize: '28px',
            boxShadow: '0 0 24px rgba(168,85,247,.3)',
          }}>🐺</div>
          <h1 style={{
            fontSize: '22px', fontWeight: 800,
            background: 'linear-gradient(135deg,#c084fc,#a855f7,#7c3aed)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>WolfFuel</h1>
        </div>

        {done ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#f1f5f9', marginBottom: '10px' }}>
              Mot de passe mis à jour !
            </h2>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>Redirection vers la connexion…</p>
          </div>

        ) : !ready ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'spin 1.5s linear infinite', display: 'inline-block' }}>🔐</div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#f1f5f9', marginBottom: '10px' }}>
              Vérification du lien…
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b' }}>Un instant</p>
          </div>

        ) : (
          <>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#f1f5f9', marginBottom: '6px' }}>
              Nouveau mot de passe
            </h2>
            <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '24px' }}>
              Choisis un nouveau mot de passe pour ton compte.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#a855f7', display: 'block', marginBottom: '8px' }}>
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoFocus
                  style={{
                    width: '100%', padding: '13px 16px', borderRadius: '12px',
                    border: '1.5px solid rgba(168,85,247,.2)',
                    background: 'rgba(168,85,247,.06)',
                    color: '#f1f5f9', fontSize: '15px',
                    fontFamily: "'DM Sans', sans-serif", outline: 'none',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(168,85,247,.55)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(168,85,247,.2)')}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#a855f7', display: 'block', marginBottom: '8px' }}>
                  Confirmer
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%', padding: '13px 16px', borderRadius: '12px',
                    border: '1.5px solid rgba(168,85,247,.2)',
                    background: 'rgba(168,85,247,.06)',
                    color: '#f1f5f9', fontSize: '15px',
                    fontFamily: "'DM Sans', sans-serif", outline: 'none',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(168,85,247,.55)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(168,85,247,.2)')}
                />
              </div>

              {error && (
                <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)', color: '#fca5a5', fontSize: '13px', fontWeight: 600 }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '15px', borderRadius: '14px', border: 'none',
                background: loading ? 'rgba(168,85,247,.4)' : 'linear-gradient(135deg,#a855f7,#7c3aed,#6d28d9)',
                color: '#fff', fontSize: '16px', fontWeight: 800,
                fontFamily: "'DM Sans', sans-serif",
                cursor: loading ? 'not-allowed' : 'pointer', marginTop: '4px',
              }}>
                {loading ? 'Mise à jour…' : '🔑 Enregistrer le mot de passe'}
              </button>
            </form>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
