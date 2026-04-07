export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  // Récupérer les amis acceptés
  const { data: friendships } = await admin
    .from('friends')
    .select('user_id, friend_id')
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
    .eq('status', 'accepted')

  const friendIds = (friendships ?? []).map(f =>
    f.user_id === userId ? f.friend_id : f.user_id
  )
  const allIds = [userId, ...friendIds]

  // Économies totales de chaque personne
  const { data: savings } = await admin
    .from('savings_history')
    .select('user_id, saved')
    .in('user_id', allIds)

  // Pleins de chaque personne
  const { data: fillUps } = await admin
    .from('fill_ups')
    .select('user_id, total_cost, liters')
    .in('user_id', allIds)

  // Profils
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, pseudo, avatar_url, is_pro')
    .in('id', allIds)

  // Agréger
  const aggregated = allIds.map(id => {
    const profile = profiles?.find(p => p.id === id)
    const totalSaved = (savings ?? []).filter(s => s.user_id === id).reduce((sum, s) => sum + (s.saved ?? 0), 0)
    const totalFillUps = (fillUps ?? []).filter(f => f.user_id === id).length
    const totalSpent = (fillUps ?? []).filter(f => f.user_id === id).reduce((sum, f) => sum + (f.total_cost ?? 0), 0)

    return {
      id,
      pseudo: profile?.pseudo ?? 'Anonyme',
      avatar_url: profile?.avatar_url ?? null,
      is_pro: profile?.is_pro ?? false,
      totalSaved: Math.round(totalSaved * 100) / 100,
      totalFillUps,
      totalSpent: Math.round(totalSpent * 100) / 100,
      isMe: id === userId,
    }
  })

  // Trier par économies
  aggregated.sort((a, b) => b.totalSaved - a.totalSaved)

  // Ajouter le rang
  const ranked = aggregated.map((u, i) => ({ ...u, rank: i + 1 }))

  return NextResponse.json({ leaderboard: ranked })
}
