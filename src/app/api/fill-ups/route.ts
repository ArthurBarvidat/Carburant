export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  const { data, error } = await admin
    .from('fill_ups')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Stats globales
  const total_cost = (data ?? []).reduce((s, f) => s + (f.total_cost ?? 0), 0)
  const total_liters = (data ?? []).reduce((s, f) => s + (f.liters ?? 0), 0)
  const avg_price = total_liters > 0
    ? (data ?? []).reduce((s, f) => s + (f.price_per_liter ?? 0) * (f.liters ?? 0), 0) / total_liters
    : 0

  return NextResponse.json({ fill_ups: data ?? [], stats: { total_cost, total_liters, avg_price, count: (data ?? []).length } })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { userId, station_name, station_address, fuel_type, price_per_liter, liters, km_before, km_after, notes } = body
  if (!userId || !fuel_type || !price_per_liter || !liters) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const total_cost = parseFloat((price_per_liter * liters).toFixed(2))

  const { data, error } = await admin.from('fill_ups').insert({
    user_id: userId, station_name, station_address, fuel_type,
    price_per_liter, liters, total_cost, km_before, km_after, notes,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ fill_up: data })
}

export async function DELETE(req: NextRequest) {
  const { id, userId } = await req.json()
  if (!id || !userId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const { error } = await admin.from('fill_ups').delete().eq('id', id).eq('user_id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
