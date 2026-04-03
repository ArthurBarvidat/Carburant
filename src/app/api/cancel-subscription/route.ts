import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('subscription_id')
      .eq('id', userId)
      .single()

    if (!profile?.subscription_id) {
      return NextResponse.json({ error: 'Aucun abonnement trouvé.' }, { status: 400 })
    }

    // Annule à la fin de la période en cours (pas immédiatement)
    await stripe.subscriptions.update(profile.subscription_id, {
      cancel_at_period_end: true,
    })

    await supabaseAdmin
      .from('profiles')
      .update({ subscription_status: 'cancelled' })
      .eq('id', userId)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Cancel subscription error:', err)
    return NextResponse.json({ error: 'Erreur lors de la résiliation.' }, { status: 500 })
  }
}
