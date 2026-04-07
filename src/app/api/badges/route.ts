import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  // Tous les badges existants
  const { data: allBadges } = await admin.from('badges').select('*')

  // Badges déjà gagnés
  const { data: earned } = await admin.from('user_badges').select('badge_id, earned_at').eq('user_id', userId)
  const earnedIds = new Set((earned ?? []).map(e => e.badge_id))

  // Stats pour calculer la progression
  const [fillUpsRes, savingsRes, friendsRes, profileRes] = await Promise.all([
    admin.from('fill_ups').select('id', { count: 'exact' }).eq('user_id', userId),
    admin.from('savings_history').select('saved').eq('user_id', userId),
    admin.from('friends').select('id', { count: 'exact' }).eq('user_id', userId).eq('status', 'accepted'),
    admin.from('profiles').select('is_pro').eq('id', userId).single(),
  ])

  const fillCount = fillUpsRes.count ?? 0
  const totalSaved = (savingsRes.data ?? []).reduce((s, r) => s + (r.saved ?? 0), 0)
  const friendCount = friendsRes.count ?? 0
  const isPro = profileRes.data?.is_pro ?? false

  const stats: Record<string, number> = {
    fill_ups_count: fillCount,
    savings_total: totalSaved,
    friends_count: friendCount,
    is_pro: isPro ? 1 : 0,
  }

  // Attribuer les badges manquants automatiquement
  const toAward: string[] = []
  for (const badge of (allBadges ?? [])) {
    if (!earnedIds.has(badge.id)) {
      const val = stats[badge.condition_type] ?? 0
      if (val >= badge.condition_value) {
        toAward.push(badge.id)
      }
    }
  }

  if (toAward.length > 0) {
    await admin.from('user_badges').insert(
      toAward.map(badge_id => ({ user_id: userId, badge_id }))
    )
    toAward.forEach(id => earnedIds.add(id))
  }

  const badgesWithStatus = (allBadges ?? []).map(b => ({
    ...b,
    earned: earnedIds.has(b.id),
    earned_at: earned?.find(e => e.badge_id === b.id)?.earned_at ?? null,
    progress: Math.min(100, Math.round(((stats[b.condition_type] ?? 0) / b.condition_value) * 100)),
    current: stats[b.condition_type] ?? 0,
  }))

  return NextResponse.json({ badges: badgesWithStatus, stats })
}
