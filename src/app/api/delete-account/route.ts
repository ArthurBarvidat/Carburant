import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: 'userId requis' }, { status: 400 })

    // Annuler l'abonnement Stripe si actif
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('subscription_id, subscription_status')
      .eq('id', userId)
      .single()

    if (profile?.subscription_id && profile?.subscription_status === 'active') {
      try {
        await stripe.subscriptions.cancel(profile.subscription_id)
      } catch (e) {
        console.error('Stripe cancel error:', e)
      }
    }

    // Supprimer les données utilisateur
    await Promise.all([
      supabaseAdmin.from('favorites').delete().eq('user_id', userId),
      supabaseAdmin.from('price_alerts').delete().eq('user_id', userId),
      supabaseAdmin.from('savings_history').delete().eq('user_id', userId),
      supabaseAdmin.from('friends').delete().or(`user_id.eq.${userId},friend_id.eq.${userId}`),
    ])

    // Supprimer l'avatar du storage
    const { data: files } = await supabaseAdmin.storage.from('avatars').list(userId)
    if (files && files.length > 0) {
      await supabaseAdmin.storage.from('avatars').remove(files.map(f => `${userId}/${f.name}`))
    }

    // Supprimer le profil
    await supabaseAdmin.from('profiles').delete().eq('id', userId)

    // Supprimer le compte auth
    await supabaseAdmin.auth.admin.deleteUser(userId)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Delete account error:', err)
    return NextResponse.json({ error: 'Erreur lors de la suppression.' }, { status: 500 })
  }
}
