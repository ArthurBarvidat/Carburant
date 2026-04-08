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
    const { sessionId } = await req.json()
    if (!sessionId) return NextResponse.json({ error: 'sessionId requis' }, { status: 400 })

    // Vérifier la session Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Paiement non confirmé' }, { status: 402 })
    }

    const userId = session.metadata?.userId
    const subscriptionId = session.subscription as string

    if (!userId) return NextResponse.json({ error: 'userId introuvable dans la session' }, { status: 400 })

    // Activer Wolf Pro dans Supabase
    const { error } = await admin.from('profiles').update({
      is_pro: true,
      subscription_id: subscriptionId ?? null,
      subscription_status: 'active',
    }).eq('id', userId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('confirm-payment error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
