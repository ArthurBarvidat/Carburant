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

  const { data } = await admin.from('vehicles').select('*').eq('user_id', userId).maybeSingle()
  return NextResponse.json({ vehicle: data })
}

export async function POST(req: NextRequest) {
  const { userId, marque, modele, annee, carburant, capacite_reservoir, consommation, immatriculation } = await req.json()
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  const { data, error } = await admin.from('vehicles').upsert({
    user_id: userId, marque, modele, annee, carburant,
    capacite_reservoir, consommation, immatriculation,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ vehicle: data })
}
