'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function RegisterPage() {
  const router = useRouter()

  // Redirige vers l'accueil si déjà connecté
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/')
    })
  }, [router])
  const [pseudo, setPseudo] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    setLoading(true)
    const { data: signUpData, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { pseudo } },
    })
    if (err) {
      setError(err.message === 'User already registered'
        ? 'Cet email est déjà utilisé.'
        : err.message)
      setLoading(false)
      return
    }
    if (signUpData.user) {
      await supabase.from('profiles').upsert({
        id: signUpData.user.id,
        pseudo,
        is_pro: false,
      })
    }
    setLoading(false)
    setSuccess(true)
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/' } })
  }

  const handleApple = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'apple', options: { redirectTo: window.location.origin + '/' } })
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 16px', borderRadius: '12px',
    border: '1.5px solid rgba(168,85,247,.2)',
    background: 'rgba(168,85,247,.06)',
    color: '#f1f5f9', fontSize: '15px',
    fontFamily: "'DM Sans', sans-serif",
    outline: 'none',
    transition: 'border-color .2s',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '12px', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '.08em', color: '#a855f7', display: 'block', marginBottom: '8px',
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: "'DM Sans', sans-serif",
      color: '#e2e8f0',
    }}>
      {/* Grain overlay */}
      <div style={{
        position: 'fixed', inset: 0, opacity: 0.03, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }} />

      <div style={{
        background: 'rgba(15,10,40,.85)',
        border: '1.5px solid rgba(139,92,246,.25)',
        borderRadius: '24px',
        padding: '40px 32px',
        maxWidth: '420px',
        width: '100%',
        position: 'relative',
        zIndex: 1,
        boxShadow: '0 8px 40px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.04)',
      }}>
        {/* Glow de fond */}
        <div style={{
          position: 'absolute', top: '-60%', left: '-20%', width: '140%', height: '100%',
          background: 'radial-gradient(ellipse,rgba(168,85,247,.1) 0%,transparent 70%)',
          pointerEvents: 'none',
        }} />

        {success ? (
          <div style={{ textAlign: 'center', position: 'relative' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
            <h2 style={{
              fontSize: '20px', fontWeight: 800,
              background: 'linear-gradient(135deg,#c084fc,#a855f7)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text', marginBottom: '10px',
            }}>Compte créé !</h2>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>
              Bienvenue dans la meute, {pseudo} 🐺
            </p>
            <button
              onClick={() => router.replace('/')}
              style={{
                display: 'inline-block', padding: '13px 28px', borderRadius: '12px',
                background: 'linear-gradient(135deg,#a855f7,#7c3aed)',
                color: '#fff', fontWeight: 800, fontSize: '15px',
                border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Accéder à WolfFuel →
            </button>
          </div>
        ) : (
          <>
            {/* Logo */}
            <div style={{ textAlign: 'center', marginBottom: '28px', position: 'relative' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '16px',
                background: 'linear-gradient(135deg,rgba(168,85,247,.3),rgba(124,58,237,.2))',
                border: '1.5px solid rgba(168,85,247,.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px',
                fontSize: '28px',
                boxShadow: '0 0 24px rgba(168,85,247,.3)',
              }}>🐺</div>
              <h1 style={{
                fontSize: '22px', fontWeight: 800,
                background: 'linear-gradient(135deg,#c084fc,#a855f7,#7c3aed)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>WolfFuel</h1>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
                Crée ton compte gratuitement
              </p>
            </div>

            {/* Boutons sociaux */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={handleGoogle}
                style={{
                  width: '100%', padding: '13px 16px', borderRadius: '12px',
                  border: '1.5px solid rgba(255,255,255,.12)',
                  background: 'rgba(255,255,255,.05)',
                  color: '#f1f5f9', fontSize: '15px', fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  transition: 'all .2s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,.1)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,.25)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,.05)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,.12)' }}
              >
                <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-3.59-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                S&apos;inscrire avec Google
              </button>

            </div>

            {/* Séparateur */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(168,85,247,.15)' }} />
              <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>ou</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(168,85,247,.15)' }} />
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Pseudo */}
              <div>
                <label style={labelStyle}>Pseudo</label>
                <input
                  type="text"
                  value={pseudo}
                  onChange={e => setPseudo(e.target.value)}
                  placeholder="TonPseudo"
                  required
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = 'rgba(168,85,247,.55)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(168,85,247,.2)')}
                />
              </div>

              {/* Email */}
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ton@email.com"
                  required
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = 'rgba(168,85,247,.55)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(168,85,247,.2)')}
                />
              </div>

              {/* Mot de passe */}
              <div>
                <label style={labelStyle}>Mot de passe</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = 'rgba(168,85,247,.55)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(168,85,247,.2)')}
                />
              </div>

              {/* Confirmation */}
              <div>
                <label style={labelStyle}>Confirmer le mot de passe</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    ...inputStyle,
                    borderColor: confirm && confirm !== password ? 'rgba(239,68,68,.5)' : 'rgba(168,85,247,.2)',
                  }}
                  onFocus={e => (e.target.style.borderColor = confirm !== password ? 'rgba(239,68,68,.5)' : 'rgba(168,85,247,.55)')}
                  onBlur={e => (e.target.style.borderColor = confirm !== password && confirm ? 'rgba(239,68,68,.5)' : 'rgba(168,85,247,.2)')}
                />
                {confirm && confirm !== password && (
                  <p style={{ fontSize: '12px', color: '#f87171', marginTop: '5px', fontWeight: 600 }}>
                    Les mots de passe ne correspondent pas
                  </p>
                )}
              </div>

              {/* Erreur */}
              {error && (
                <div style={{
                  padding: '10px 14px', borderRadius: '10px',
                  background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)',
                  color: '#fca5a5', fontSize: '13px', fontWeight: 600,
                }}>
                  {error}
                </div>
              )}

              {/* Bouton */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '15px', borderRadius: '14px', border: 'none',
                  background: loading ? 'rgba(168,85,247,.4)' : 'linear-gradient(135deg,#a855f7,#7c3aed,#6d28d9)',
                  color: '#fff', fontSize: '16px', fontWeight: 800,
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all .2s',
                  marginTop: '4px',
                }}
              >
                {loading ? 'Création du compte…' : 'Créer mon compte'}
              </button>
            </form>

            {/* Lien connexion */}
            <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#64748b' }}>
              Déjà un compte ?{' '}
              <Link href="/login" style={{ color: '#c084fc', fontWeight: 700, textDecoration: 'none' }}>
                Se connecter
              </Link>
            </p>

          </>
        )}
      </div>
    </div>
  )
}
