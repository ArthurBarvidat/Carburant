export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET — liste des amis + demandes reçues
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId requis' }, { status: 400 })

  // Amis acceptés
  const { data: friends } = await admin
    .from('friends')
    .select('id, status, user_id, friend_id')
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`)

  if (!friends) return NextResponse.json({ friends: [], requests: [] })

  // Récupérer les profils des amis
  const friendIds = friends.map(f => f.user_id === userId ? f.friend_id : f.user_id)
  const { data: profiles } = friendIds.length
    ? await admin.from('profiles').select('id, pseudo, is_pro, last_seen, avatar_url').in('id', friendIds)
    : { data: [] }

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))

  const accepted = friends
    .filter(f => f.status === 'accepted')
    .map(f => {
      const fid = f.user_id === userId ? f.friend_id : f.user_id
      return { friendshipId: f.id, ...profileMap[fid], friendId: fid }
    })

  const requests = friends
    .filter(f => f.status === 'pending' && f.friend_id === userId)
    .map(f => ({ friendshipId: f.id, ...profileMap[f.user_id], friendId: f.user_id }))

  return NextResponse.json({ friends: accepted, requests })
}

// POST — envoyer demande ou accepter
export async function POST(req: NextRequest) {
  const { userId, friendId, action } = await req.json()
  if (!userId || !friendId) return NextResponse.json({ error: 'userId et friendId requis' }, { status: 400 })

  if (action === 'accept') {
    const { error } = await admin.from('friends')
      .update({ status: 'accepted' })
      .eq('user_id', friendId).eq('friend_id', userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  // Envoyer une demande
  const { error } = await admin.from('friends').insert({ user_id: userId, friend_id: friendId, status: 'pending' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// DELETE — supprimer ami ou refuser demande
export async function DELETE(req: NextRequest) {
  const { friendshipId } = await req.json()
  const { error } = await admin.from('friends').delete().eq('id', friendshipId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
