'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function AbonnementContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPro, setIsPro] = useState(false)
  const [userId, setUserId] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [subscriptionId, setSubscriptionId] = useState('')
  const [success, setSuccess] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [reactivating, setReactivating] = useState(false)
  const [subscribing, setSubscribing] = useState(false)
  const [endDate, setEndDate] = useState('')
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(5)

  // Compte à rebours auto-redirect sur la page de succès
  useEffect(() => {
    if (!success) return
    if (countdown <= 0) { router.replace('/'); return }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [success, countdown, router])

  useEffect(() => {
    // Vérifier si retour depuis Stripe
    const isSuccess = searchParams.get('success') === 'true'
    const sessionId = searchParams.get('session_id')

    if (isSuccess) {
      setSuccess(true)
      // Confirmer le paiement directement via Stripe sans attendre le webhook
      if (sessionId) {
        fetch('/api/confirm-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        }).catch(() => {/* silencieux */})
      }
    }

    supabase.auth.getUser().then(({ data }) => {
      // Ne pas rediriger vers /login si on revient d'un paiement Stripe réussi
      if (!data.user) {
        if (!isSuccess) router.replace('/login')
        return
      }
      setUserId(data.user.id)
      setUserEmail(data.user.email ?? '')
      supabase.from('profiles').select('is_pro,subscription_id,subscription_status').eq('id', data.user.id).single()
        .then(({ data: p }) => {
          if (p?.is_pro) setIsPro(true)
          if (p?.subscription_id) setSubscriptionId(p.subscription_id)
          if (p?.subscription_status === 'cancelled') setCancelled(true)
          if (p?.subscription_id) {
            fetch(`/api/subscription-details?userId=${data.user.id}`)
              .then(r => r.json())
              .then(d => { if (d.endDate) setEndDate(d.endDate) })
          }
        })
    })
  }, [router, searchParams])

  async function handleSubscribe() {
    setSubscribing(true)
    setError('')
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email: userEmail }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? 'Erreur lors de la création du paiement.')
        setSubscribing(false)
      }
    } catch {
      setError('Erreur réseau. Réessayez.')
      setSubscribing(false)
    }
  }

  async function handleReactivate() {
    setReactivating(true)
    setError('')
    try {
      const res = await fetch('/api/reactivate-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const data = await res.json()
      if (data.success) {
        setCancelled(false)
      } else {
        setError(data.error ?? 'Erreur lors de la réactivation.')
      }
    } catch {
      setError('Erreur réseau. Réessayez.')
    } finally {
      setReactivating(false)
    }
  }

  async function handleCancel() {
    if (!confirm('Confirmer la résiliation ? Ton accès Wolf Pro restera actif jusqu\'à la fin de la période en cours.')) return
    setCancelling(true)
    setError('')
    try {
      const res = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const data = await res.json()
      if (data.success) {
        router.replace('/au-revoir')
      } else {
        setError(data.error ?? 'Erreur lors de la résiliation.')
      }
    } catch {
      setError('Erreur réseau. Réessayez.')
    } finally {
      setCancelling(false)
    }
  }

  const features = [
    { free: true,  pro: true,  label: 'Recherche carburant illimitée' },
    { free: true,  pro: true,  label: 'Toutes les stations France' },
    { free: true,  pro: true,  label: 'Navigation GPS (Maps / Waze)' },
    { free: false, pro: true,  label: '🔔 Alertes prix par email' },
    { free: false, pro: true,  label: '⭐ Stations favorites' },
    { free: false, pro: true,  label: '📈 Historique des prix 30 jours' },
    { free: false, pro: true,  label: '💰 Calcul de tes économies' },
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
    <div style={{ minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", color: '#e2e8f0', padding: '40px 20px', background: 'linear-gradient(165deg,#0d0a1a 0%,#1a1130 40%,#120e20 100%)' }}>
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
            <p style={{ color: '#94a3b8', marginBottom: '16px' }}>
              Tu es maintenant <strong style={{ color: '#c084fc' }}>🐺⭐ Wolf Pro</strong>
            </p>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '8px' }}>
              Merci pour ta confiance ! 🙏
            </p>
            <div style={{
              padding: '14px 18px', borderRadius: '12px', marginBottom: '24px',
              background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.2)',
              fontSize: '13px', color: '#6ee7b7', lineHeight: 1.6,
            }}>
              📧 Une facture vient d'être envoyée à ton adresse email.<br />
              <span style={{ color: '#475569', fontSize: '12px' }}>Pense à vérifier tes spams si tu ne la reçois pas.</span>
            </div>
            <button onClick={() => router.replace('/')} style={{
              padding: '14px 32px', borderRadius: '14px', border: 'none',
              background: 'linear-gradient(135deg,#a855f7,#7c3aed)',
              color: '#fff', fontWeight: 800, fontSize: '16px', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              🐺 Commencer la chasse {countdown > 0 && `(${countdown})`}
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
                  cancelled ? (
                    <div>
                      <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(239,68,68,.08)', border: '1.5px solid rgba(239,68,68,.3)', textAlign: 'center', marginBottom: '12px' }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
                        <div style={{ color: '#fca5a5', fontWeight: 700, fontSize: '14px', marginBottom: '6px' }}>Résiliation programmée</div>
                        <div style={{ color: '#94a3b8', fontSize: '12px', lineHeight: 1.5 }}>
                          Ton accès Wolf Pro reste actif jusqu'à la fin de la période en cours.<br />
                          {endDate && <span>📅 Accès jusqu'au : <strong style={{ color: '#fca5a5' }}>{endDate}</strong><br /></span>}
                          <strong style={{ color: '#fca5a5' }}>Le prélèvement automatique sera bien arrêté le mois prochain.</strong>
                        </div>
                      </div>
                      <button
                        onClick={handleReactivate}
                        disabled={reactivating}
                        style={{
                          width: '100%', padding: '13px', borderRadius: '12px', border: 'none',
                          background: reactivating ? 'rgba(168,85,247,.4)' : 'linear-gradient(135deg,#a855f7,#7c3aed)',
                          color: '#fff', fontSize: '14px', fontWeight: 700,
                          cursor: reactivating ? 'not-allowed' : 'pointer',
                          fontFamily: "'DM Sans', sans-serif",
                        }}>
                        {reactivating ? 'Réactivation...' : '🐺 Annuler la résiliation'}
                      </button>
                      <p style={{ fontSize: '11px', color: '#475569', textAlign: 'center', marginTop: '8px' }}>
                        Aucune facturation supplémentaire — ton abonnement en cours continue normalement.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div style={{ padding: '13px', borderRadius: '12px', background: 'rgba(16,185,129,.1)', border: '1.5px solid rgba(16,185,129,.4)', textAlign: 'center', color: '#34d399', fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>
                        🐺⭐ Tu es Wolf Pro !
                      </div>
                      <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'rgba(168,85,247,.05)', border: '1px solid rgba(168,85,247,.15)', fontSize: '12px', color: '#64748b', lineHeight: 1.6, marginBottom: '12px' }}>
                        💳 Abonnement actif · renouvelé automatiquement chaque mois<br />
                        {endDate && <span>📅 Prochain renouvellement : <strong style={{ color: '#a855f7' }}>{endDate}</strong><br /></span>}
                        {subscriptionId && <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#475569' }}>Réf: {subscriptionId}</span>}
                      </div>
                      <button
                        onClick={handleCancel}
                        disabled={cancelling}
                        style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1.5px solid rgba(239,68,68,.4)', background: 'rgba(239,68,68,.08)', color: '#f87171', fontSize: '13px', fontWeight: 700, cursor: cancelling ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                        {cancelling ? 'Résiliation en cours...' : '🚫 Résilier mon abonnement'}
                      </button>
                      <p style={{ fontSize: '11px', color: '#475569', textAlign: 'center', marginTop: '8px', lineHeight: 1.5 }}>
                        Tu garderas l'accès Pro jusqu'à la fin de la période payée.<br />Aucun remboursement partiel.
                      </p>
                    </div>
                  )
                ) : userId ? (
                  <div>
                    <button
                      onClick={handleSubscribe}
                      disabled={subscribing}
                      style={{
                        width: '100%', padding: '15px', borderRadius: '14px', border: 'none',
                        background: subscribing ? 'rgba(168,85,247,.4)' : 'linear-gradient(135deg,#a855f7,#7c3aed,#6d28d9)',
                        color: '#fff', fontSize: '16px', fontWeight: 800,
                        fontFamily: "'DM Sans', sans-serif",
                        cursor: subscribing ? 'not-allowed' : 'pointer',
                        transition: 'all .2s',
                        boxShadow: subscribing ? 'none' : '0 4px 20px rgba(168,85,247,.4)',
                      }}
                    >
                      {subscribing ? '⏳ Redirection...' : '🐺 Devenir Wolf Pro — 2,99€/mois'}
                    </button>
                    <p style={{ fontSize: '11px', color: '#475569', textAlign: 'center', marginTop: '10px', lineHeight: 1.5 }}>
                      Paiement sécurisé par Stripe · Carte bancaire acceptée<br />Résiliable à tout moment
                    </p>
                  </div>
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
          🔒 Paiement sécurisé par Stripe · Résiliable à tout moment
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

export default function AbonnementPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Chargement...</div>}>
      <AbonnementContent />
    </Suspense>
  )
}
