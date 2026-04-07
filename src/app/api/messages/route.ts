export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET — charger la conversation entre deux users
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  const friendId = searchParams.get('friendId')
  const limit = parseInt(searchParams.get('limit') ?? '50')

  if (!userId || !friendId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const { data, error } = await admin
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${userId})`)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Marquer les messages reçus comme lus
  await admin
    .from('messages')
    .update({ read: true })
    .eq('receiver_id', userId)
    .eq('sender_id', friendId)
    .eq('read', false)

  return NextResponse.json({ messages: data ?? [] })
}

// POST — envoyer un message
export async function POST(req: NextRequest) {
  const { senderId, receiverId, content } = await req.json()
  if (!senderId || !receiverId || !content?.trim()) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  const { data, error } = await admin
    .from('messages')
    .insert({ sender_id: senderId, receiver_id: receiverId, content: content.trim() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: data })
}

// GET unread count — /api/messages?userId=X&unread=true
