import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, fuelType, bestPrice, avgPrice, liters = 50, city } = body
    if (!userId || !fuelType || bestPrice == null || avgPrice == null) {
      return NextResponse.json(
        { error: 'userId, fuelType, bestPrice et avgPrice requis' },
        { status: 400 }
      )
    }
    const saved = (avgPrice - bestPrice) * liters
    const supabase = getAdminClient()
    const { data, error } = await supabase
      .from('savings_history')
      .insert({
        user_id: userId,
        fuel_type: fuelType,
        best_price: bestPrice,
        avg_price: avgPrice,
        liters,
        saved,
        city: city ?? null,
      })
      .select()
      .single()
    if (error) throw error
    return NextResponse.json({ saving: data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 })
    }
    const supabase = getAdminClient()

    const now = new Date()
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const [thisMonthRes, lastMonthRes] = await Promise.all([
      supabase
        .from('savings_history')
        .select('saved')
        .eq('user_id', userId)
        .gte('recorded_at', startOfThisMonth),
      supabase
        .from('savings_history')
        .select('saved')
        .eq('user_id', userId)
        .gte('recorded_at', startOfLastMonth)
        .lt('recorded_at', endOfLastMonth),
    ])

    if (thisMonthRes.error) throw thisMonthRes.error
    if (lastMonthRes.error) throw lastMonthRes.error

    const totalThisMonth = (thisMonthRes.data ?? []).reduce(
      (sum: number, row: { saved: number }) => sum + (row.saved ?? 0),
      0
    )
    const totalLastMonth = (lastMonthRes.data ?? []).reduce(
      (sum: number, row: { saved: number }) => sum + (row.saved ?? 0),
      0
    )

    return NextResponse.json({
      thisMonth: Math.round(totalThisMonth * 100) / 100,
      lastMonth: Math.round(totalLastMonth * 100) / 100,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
