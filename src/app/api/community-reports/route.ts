export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const stationId = new URL(req.url).searchParams.get('stationId')
  if (!stationId) return NextResponse.json({ error: 'Missing stationId' }, { status: 400 })

  const { data } = await admin
    .from('community_reports')
    .select('*')
    .eq('station_id', stationId)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(10)

  return NextResponse.json({ reports: data ?? [] })
}

export async function POST(req: NextRequest) {
  const { userId, stationId, stationName, fuelType, reportedPrice, officialPrice } = await req.json()
  if (!userId || !stationId || !fuelType || !reportedPrice) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Vérifier si l'utilisateur n'a pas déjà signalé cette station aujourd'hui
  const { data: existing } = await admin
    .from('community_reports')
    .select('id')
    .eq('user_id', userId)
    .eq('station_id', stationId)
    .eq('fuel_type', fuelType)
    .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Tu as déjà signalé cette station récemment' }, { status: 429 })
  }

  const { data, error } = await admin.from('community_reports').insert({
    user_id: userId,
    station_id: stationId,
    station_name: stationName,
    fuel_type: fuelType,
    reported_price: reportedPrice,
    official_price: officialPrice,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ report: data })
}

// Confirmer un signalement
export async function PATCH(req: NextRequest) {
  const { reportId, userId } = await req.json()
  if (!reportId || !userId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const { data, error } = await admin
    .from('community_reports')
    .update({ confirmed_count: admin.rpc as unknown as number })
    .eq('id', reportId)
    .select()
    .single()

  // Incrémenter confirmed_count
  await admin.rpc('increment_confirmed', { report_id: reportId })

  return NextResponse.json({ ok: true })
}
