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
      .from('favorites')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json({ favorites: data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      userId,
      stationId,
      stationName,
      stationAddress,
      fuelType,
      lastPrice,
      latitude,
      longitude,
    } = body
    if (!userId || !stationId) {
      return NextResponse.json({ error: 'userId et stationId requis' }, { status: 400 })
    }
    const supabase = getAdminClient()
    if (!(await checkIsPro(supabase, userId))) {
      return NextResponse.json({ error: 'Fonctionnalité réservée aux membres Wolf Pro.' }, { status: 403 })
    }
    const { data, error } = await supabase
      .from('favorites')
      .upsert(
        {
          user_id: userId,
          station_id: stationId,
          station_name: stationName ?? null,
          station_address: stationAddress ?? null,
          fuel_type: fuelType ?? null,
          last_price: lastPrice ?? null,
          latitude: latitude ?? null,
          longitude: longitude ?? null,
        },
        { onConflict: 'user_id,station_id' }
      )
      .select()
      .single()
    if (error) throw error
    return NextResponse.json({ favorite: data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, stationId } = body
    if (!userId || !stationId) {
      return NextResponse.json({ error: 'userId et stationId requis' }, { status: 400 })
    }
    const supabase = getAdminClient()
    if (!(await checkIsPro(supabase, userId))) {
      return NextResponse.json({ error: 'Fonctionnalité réservée aux membres Wolf Pro.' }, { status: 403 })
    }
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('station_id', stationId)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
