export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function sendInvoice(email: string, subscriptionId: string) {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-invoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, subscriptionId }),
    })
  } catch (e) {
    console.error('Erreur envoi facture:', e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const eventType = body.event_type

    if (eventType === 'BILLING.SUBSCRIPTION.ACTIVATED') {
      const subscriptionId = body.resource?.id
      const customId = body.resource?.custom_id

      if (customId && subscriptionId) {
        await supabaseAdmin.from('profiles').upsert({
          id: customId,
          is_pro: true,
          subscription_id: subscriptionId,
          subscription_status: 'active',
        })

        // Récupérer l'email de l'utilisateur pour la facture
        const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(customId)
        if (user?.email) {
          await sendInvoice(user.email, subscriptionId)
        }
      }
    }

    if (
      eventType === 'BILLING.SUBSCRIPTION.CANCELLED' ||
      eventType === 'BILLING.SUBSCRIPTION.SUSPENDED' ||
      eventType === 'BILLING.SUBSCRIPTION.EXPIRED'
    ) {
      const customId = body.resource?.custom_id
      if (customId) {
        await supabaseAdmin.from('profiles').upsert({
          id: customId,
          is_pro: false,
          subscription_status: 'canceled',
        })
      }
    }

    return NextResponse.json({ received: true })
  } catch {
    return NextResponse.json({ error: 'Erreur webhook' }, { status: 400 })
  }
}
