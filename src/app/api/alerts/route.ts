export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function checkIsPro(supabase: ReturnType<typeof getAdminClient>, userId: string) {
  const { data } = await supabase.from('profiles').select('is_pro').eq('id', userId).single()
  return data?.is_pro === true
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 })
    }
    const supabase = getAdminClient()
    if (!(await checkIsPro(supabase, userId))) {
      return NextResponse.json({ error: 'Fonctionnalité réservée aux membres Wolf Pro.' }, { status: 403 })
    }
    const { data, error } = await supabase
      .from('price_alerts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json({ alerts: data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, fuelType, targetPrice, department, city } = body
    if (!userId || !fuelType || targetPrice == null) {
      return NextResponse.json(
        { error: 'userId, fuelType et targetPrice requis' },
        { status: 400 }
      )
    }
    const supabase = getAdminClient()
    if (!(await checkIsPro(supabase, userId))) {
      return NextResponse.json({ error: 'Fonctionnalité réservée aux membres Wolf Pro.' }, { status: 403 })
    }
    const { data, error } = await supabase
      .from('price_alerts')
      .insert({
        user_id: userId,
        fuel_type: fuelType,
        target_price: targetPrice,
        department: department ?? null,
        city: city ?? null,
        active: true,
      })
      .select()
      .single()
    if (error) throw error
    return NextResponse.json({ alert: data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, alertId } = body
    if (!userId || !alertId) {
      return NextResponse.json({ error: 'userId et alertId requis' }, { status: 400 })
    }
    const supabase = getAdminClient()
    if (!(await checkIsPro(supabase, userId))) {
      return NextResponse.json({ error: 'Fonctionnalité réservée aux membres Wolf Pro.' }, { status: 403 })
    }
    const { error } = await supabase
      .from('price_alerts')
      .delete()
      .eq('id', alertId)
      .eq('user_id', userId)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
