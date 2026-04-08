export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { userId, email } = await req.json()

    // Vérifier si l'utilisateur a déjà un abonnement actif — évite les doublons
    const { data: profile } = await admin
      .from('profiles')
      .select('is_pro, subscription_id')
      .eq('id', userId)
      .single()

    if (profile?.is_pro) {
      return NextResponse.json({ error: 'Tu as déjà un abonnement Wolf Pro actif.' }, { status: 409 })
    }

    // Si subscription_id existe, vérifier son statut réel sur Stripe
    if (profile?.subscription_id) {
      try {
        const sub = await stripe.subscriptions.retrieve(profile.subscription_id)
        if (sub.status === 'active' || sub.status === 'trialing') {
          // Corriger Supabase et renvoyer une erreur pour bloquer le paiement double
          await admin.from('profiles').update({ is_pro: true, subscription_status: 'active' }).eq('id', userId)
          return NextResponse.json({ error: 'Tu as déjà un abonnement Wolf Pro actif.' }, { status: 409 })
        }
      } catch { /* sub introuvable ou erreur Stripe — on laisse passer */ }
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price: process.env.STRIPE_PRICE_ID!,
        quantity: 1,
      }],
      customer_email: email,
      metadata: { userId },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/abonnement?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/abonnement`,
      locale: 'fr',
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json({ error: 'Erreur lors de la création du paiement.' }, { status: 500 })
  }
}
