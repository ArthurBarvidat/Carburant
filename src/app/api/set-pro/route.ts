import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { userId, isPro } = await req.json()
    if (!userId) return NextResponse.json({ error: 'userId requis' }, { status: 400 })

    const { error } = await admin.from('profiles').upsert({
      id: userId,
      is_pro: isPro,
      subscription_status: isPro ? 'active' : 'free',
    })

    if (error) {
      console.error('Supabase error:', JSON.stringify(error))
      return NextResponse.json({ error: error.message, details: error }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Catch error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
