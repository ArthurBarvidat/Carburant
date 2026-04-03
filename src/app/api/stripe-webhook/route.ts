import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature error:', err)
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.CheckoutSession
      const userId = session.metadata?.userId
      const subscriptionId = session.subscription as string

      if (userId && subscriptionId) {
        await supabaseAdmin.from('profiles').update({
          is_pro: true,
          subscription_id: subscriptionId,
          subscription_status: 'active',
        }).eq('id', userId)

        // Envoyer la facture
        const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId)
        if (user?.email) {
          fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-invoice`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email, subscriptionId }),
          })
        }
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      await supabaseAdmin.from('profiles').update({
        is_pro: false,
        subscription_status: 'cancelled',
      }).eq('subscription_id', subscription.id)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const subId = invoice.subscription as string
      if (subId) {
        await supabaseAdmin.from('profiles').update({
          subscription_status: 'payment_failed',
        }).eq('subscription_id', subId)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
