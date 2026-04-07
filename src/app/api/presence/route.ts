export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST — mettre à jour last_seen
export async function POST(req: NextRequest) {
  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: 'userId requis' }, { status: 400 })
  await admin.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', userId)
  return NextResponse.json({ success: true })
}

// GET — chercher un utilisateur par pseudo
export async function GET(req: NextRequest) {
  const pseudo = req.nextUrl.searchParams.get('pseudo')
  const userId = req.nextUrl.searchParams.get('userId')
  if (!pseudo) return NextResponse.json({ error: 'pseudo requis' }, { status: 400 })

  const { data } = await admin
    .from('profiles')
    .select('id, pseudo, is_pro, last_seen')
    .ilike('pseudo', `%${pseudo}%`)
    .neq('id', userId ?? '')
    .limit(10)

  return NextResponse.json({ users: data ?? [] })
}
