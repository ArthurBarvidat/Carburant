export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'userId requis' }, { status: 400 })

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('subscription_id')
      .eq('id', userId)
      .single()

    if (!profile?.subscription_id) {
      return NextResponse.json({ endDate: null })
    }

    const subscription = await stripe.subscriptions.retrieve(profile.subscription_id) as unknown as {
      status: string, current_period_end: number, cancel_at_period_end: boolean
    }

    // Synchroniser le statut réel depuis Stripe → Supabase (contourne le webhook)
    if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
      await supabaseAdmin.from('profiles').update({
        is_pro: false,
        subscription_status: 'cancelled',
      }).eq('id', userId)
    } else if (subscription.status === 'active' && !subscription.cancel_at_period_end) {
      await supabaseAdmin.from('profiles').update({
        is_pro: true,
        subscription_status: 'active',
      }).eq('id', userId)
    }

    const endDate = new Date(subscription.current_period_end * 1000).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
    })

    return NextResponse.json({ endDate, cancelAtPeriodEnd: subscription.cancel_at_period_end, status: subscription.status })
  } catch (err) {
    console.error('Subscription details error:', err)
    return NextResponse.json({ endDate: null })
  }
}
