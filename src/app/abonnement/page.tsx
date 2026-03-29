'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AnimatedBackground from '@/components/AnimatedBackground'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import { supabase } from '@/lib/supabase'

export default function AbonnementPage() {
  const router = useRouter()
  const [isPro, setIsPro] = useState(false)
  const [userId, setUserId] = useState('')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace('/login'); return }
      setUserId(data.user.id)
      supabase.from('profiles').select('is_pro').eq('id', data.user.id).single()
        .then(({ data: p }) => { if (p?.is_pro) setIsPro(true) })
    })
  }, [router])

  const features = [
    { free: true,  pro: true,  label: 'Recherche carburant illimitée' },
    { free: true,  pro: true,  label: 'Toutes les stations France' },
    { free: true,  pro: true,  label: 'Navigation GPS (Maps / Waze)' },
    { free: false, pro: true,  label: '🔔 Alertes prix par email' },
    { free: false, pro: true,  label: '⭐ Stations favorites' },
    { free: false, pro: true,  label: '📈 Historique des prix 30 jours' },
    { free: false, pro: true,  label: '💰 Calcul de tes économies' },
    { free: false, pro: true,  label: '🤖 Chatbot IA avancé' },
    { free: false, pro: true,  label: '🚫 Sans publicité' },
    { free: false, pro: true,  label: '🐺⭐ Badge Wolf Pro' },
  ]

  const card = {
    background: 'rgba(15,10,40,.85)',
    border: '1.5px solid rgba(139,92,246,.25)',
    borderRadius: '24px',
    padding: '32px 28px',
    position: 'relative' as const,
    boxShadow: '0 8px 40px rgba(0,0,0,.5)',
    flex: '1',
    minWidth: '280px',
    maxWidth: '360px',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(165deg,#0d0a1a 0%,#1a1130 40%,#120e20 100%)',
      fontFamily: "'DM Sans', sans-serif",
      color: '#e2e8f0',
      padding: '40px 20px',
    }}>
      <AnimatedBackground />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🐺</div>
          <h1 style={{
            fontSize: '32px', fontWeight: 800,
            background: 'linear-gradient(135deg,#c084fc,#a855f7,#7c3aed)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            marginBottom: '10px',
          }}>Wolf Pro</h1>
          <p style={{ color: '#94a3b8', fontSize: '16px' }}>Traque les prix comme un vrai loup 🐺</p>
        </div>

        {success ? (
          <div style={{
            textAlign: 'center', background: 'rgba(15,10,40,.85)',
            border: '1.5px solid rgba(16,185,129,.4)', borderRadius: '24px',
            padding: '48px 32px', maxWidth: '420px', margin: '0 auto',
            boxShadow: '0 8px 40px rgba(16,185,129,.2)',
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
            <h2 style={{
              fontSize: '24px', fontWeight: 800, marginBottom: '12px',
              background: 'linear-gradient(135deg,#34d399,#10b981)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>Bienvenue dans la meute !</h2>
            <p style={{ color: '#94a3b8', marginBottom: '28px' }}>
              Tu es maintenant <strong style={{ color: '#c084fc' }}>🐺⭐ Wolf Pro</strong>
            </p>
            <button onClick={() => router.replace('/')} style={{
              padding: '14px 32px', borderRadius: '14px', border: 'none',
              background: 'linear-gradient(135deg,#a855f7,#7c3aed)',
              color: '#fff', fontWeight: 800, fontSize: '16px', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              🐺 Commencer la chasse
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>

            {/* Free */}
            <div style={card}>
              <p style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#64748b', marginBottom: '8px' }}>Gratuit</p>
              <div style={{ fontSize: '36px', fontWeight: 800, color: '#f1f5f9', marginBottom: '4px' }}>0€</div>
              <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>Pour toujours</p>
              {features.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', opacity: f.free ? 1 : 0.3 }}>
                  <span style={{ fontSize: '16px', flexShrink: 0 }}>{f.free ? '✅' : '✗'}</span>
                  <span style={{ fontSize: '14px', color: f.free ? '#e2e8f0' : '#64748b' }}>{f.label}</span>
                </div>
              ))}
              <div style={{ marginTop: '24px', padding: '13px', borderRadius: '12px', border: '1.5px solid rgba(168,85,247,.2)', textAlign: 'center', color: '#94a3b8', fontSize: '14px', fontWeight: 600 }}>
                Plan actuel
              </div>
            </div>

            {/* Pro */}
            <div style={{ ...card, border: '1.5px solid rgba(168,85,247,.6)', boxShadow: '0 8px 40px rgba(168,85,247,.2)' }}>
              <div style={{
                position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg,#a855f7,#7c3aed)',
                padding: '4px 18px', borderRadius: '20px',
                fontSize: '12px', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap',
              }}>⭐ RECOMMANDÉ</div>

              <p style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#a855f7', marginBottom: '8px' }}>Wolf Pro</p>
              <div style={{ fontSize: '36px', fontWeight: 800, color: '#f1f5f9', marginBottom: '4px' }}>
                2,99€ <span style={{ fontSize: '16px', color: '#94a3b8', fontWeight: 500 }}>/mois</span>
              </div>
              <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>Résiliable à tout moment</p>

              {features.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '16px', flexShrink: 0 }}>✅</span>
                  <span style={{ fontSize: '14px', color: '#e2e8f0' }}>{f.label}</span>
                </div>
              ))}

              <div style={{ marginTop: '20px' }}>
                {isPro ? (
                  <div style={{ padding: '13px', borderRadius: '12px', background: 'rgba(16,185,129,.1)', border: '1.5px solid rgba(16,185,129,.4)', textAlign: 'center', color: '#34d399', fontSize: '14px', fontWeight: 700 }}>
                    🐺⭐ Tu es déjà Wolf Pro !
                  </div>
                ) : userId ? (
                  <PayPalScriptProvider options={{
                    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
                    vault: true,
                    intent: 'subscription',
                  }}>
                    <PayPalButtons
                      style={{ layout: 'vertical', color: 'blue', shape: 'pill', label: 'subscribe' }}
                      createSubscription={(_data, actions) => {
                        return actions.subscription.create({
                          plan_id: process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID!,
                          custom_id: userId,
                        })
                      }}
                      onApprove={async (data) => {
                        await supabase.from('profiles').upsert({
                          id: userId,
                          is_pro: true,
                          subscription_id: data.subscriptionID,
                          subscription_status: 'active',
                        })
                        // Envoyer la facture par email
                        const { data: authData } = await supabase.auth.getUser()
                        if (authData.user?.email && data.subscriptionID) {
                          fetch('/api/send-invoice', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              email: authData.user.email,
                              subscriptionId: data.subscriptionID,
                            }),
                          })
                        }
                        setSuccess(true)
                      }}
                      onError={() => setError('Une erreur est survenue avec PayPal.')}
                    />
                  </PayPalScriptProvider>
                ) : (
                  <div style={{ padding: '13px', borderRadius: '12px', background: 'rgba(168,85,247,.1)', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                    Chargement...
                  </div>
                )}

                {error && (
                  <p style={{ color: '#f87171', fontSize: '13px', textAlign: 'center', marginTop: '10px', fontWeight: 600 }}>
                    {error}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <p style={{ textAlign: 'center', color: '#475569', fontSize: '13px', marginTop: '32px', marginBottom: '12px' }}>
          🔒 Paiement sécurisé par PayPal · Résiliable à tout moment
        </p>

        <p style={{ textAlign: 'center', marginTop: '16px' }}>
          <a href="/" style={{ color: '#64748b', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
            ← Retour à l&apos;accueil
          </a>
        </p>
      </div>
    </div>
  )
}
