'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function ConsentPage() {
  const router = useRouter()
  const [accepted, setAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Si l'utilisateur a déjà consenti → accueil directement
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace('/login'); return }
      supabase.from('profiles').select('rgpd_consent').eq('id', data.user.id).single()
        .then(({ data: p }) => {
          if (p?.rgpd_consent) {
            router.replace('/')
          } else {
            setChecking(false)
          }
        })
    })
  }, [router])

  const handleAccept = async () => {
    setLoading(true)
    const { data } = await supabase.auth.getUser()
    if (data.user) {
      await supabase.from('profiles').upsert({ id: data.user.id, rgpd_consent: true })
    }
    router.replace('/')
  }

  const handleRefuse = async () => {
    await supabase.auth.signOut()
    router.replace('/')
  }

  if (checking) return null

  return (
    <div style={{ minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", color: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{
        background: 'rgba(15,10,40,.85)',
        border: '1.5px solid rgba(139,92,246,.25)',
        borderRadius: '24px',
        padding: '40px 32px',
        maxWidth: '440px',
        width: '100%',
        boxShadow: '0 8px 40px rgba(0,0,0,.5)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🐺</div>
          <h1 style={{
            fontSize: '22px', fontWeight: 800, marginBottom: '8px',
            background: 'linear-gradient(135deg,#c084fc,#a855f7)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>Bienvenue sur WolfFuel !</h1>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Avant de continuer, nous avons besoin de ton accord.</p>
        </div>

        <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(168,85,247,.06)', border: '1px solid rgba(168,85,247,.15)', marginBottom: '24px', fontSize: '13px', color: '#94a3b8', lineHeight: 1.7 }}>
          WolfFuel collecte ton email et ton pseudo pour faire fonctionner ton compte. Aucune donnée sensible n'est stockée. Les paiements sont gérés par Stripe.
          <br /><br />
          <Link href="/mentions-legales" style={{ color: '#a855f7', textDecoration: 'none', fontWeight: 600 }}>
            Lire la politique de confidentialité →
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '24px' }}>
          <input
            type="checkbox"
            id="consent"
            checked={accepted}
            onChange={e => setAccepted(e.target.checked)}
            style={{ marginTop: '2px', accentColor: '#a855f7', width: '16px', height: '16px', flexShrink: 0, cursor: 'pointer' }}
          />
          <label htmlFor="consent" style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6, cursor: 'pointer' }}>
            J'accepte la politique de confidentialité et le traitement de mes données conformément au RGPD.
          </label>
        </div>

        <button
          onClick={handleAccept}
          disabled={!accepted || loading}
          style={{
            width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
            background: accepted ? 'linear-gradient(135deg,#a855f7,#7c3aed)' : 'rgba(168,85,247,.2)',
            color: '#fff', fontSize: '15px', fontWeight: 800,
            cursor: accepted && !loading ? 'pointer' : 'not-allowed',
            fontFamily: "'DM Sans', sans-serif",
            marginBottom: '10px',
            transition: 'all .2s',
          }}
        >
          {loading ? 'Chargement...' : '🐺 Accéder à WolfFuel'}
        </button>

        <button
          onClick={handleRefuse}
          style={{
            width: '100%', padding: '10px', borderRadius: '12px',
            border: '1px solid rgba(100,116,139,.2)', background: 'transparent',
            color: '#475569', fontSize: '13px', cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Refuser et se déconnecter
        </button>
      </div>
    </div>
  )
}
