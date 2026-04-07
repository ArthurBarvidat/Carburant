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

  const { data, error } = await admin
    .from('maintenance_reminders')
    .select('*')
    .eq('user_id', userId)
    .order('due_date', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reminders: data ?? [] })
}

export async function POST(req: NextRequest) {
  const { userId, type, label, due_km, due_date, current_km } = await req.json()
  if (!userId || !type || !label) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const { data, error } = await admin.from('maintenance_reminders').insert({
    user_id: userId, type, label, due_km, due_date, current_km,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reminder: data })
}

export async function PATCH(req: NextRequest) {
  const { id, userId, done, current_km } = await req.json()
  if (!id || !userId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (done !== undefined) updates.done = done
  if (current_km !== undefined) updates.current_km = current_km

  const { error } = await admin.from('maintenance_reminders').update(updates).eq('id', id).eq('user_id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { id, userId } = await req.json()
  if (!id || !userId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const { error } = await admin.from('maintenance_reminders').delete().eq('id', id).eq('user_id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
