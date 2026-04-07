export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BANNED_WORDS = [
  // Insultes générales
  'connard','connarde','salope','pute','putain','merde','enculé','enculee','fdp','batard','batarde',
  'bâtard','bâtarde','niquer','nique','couille','couilles','bite','zob','con','conne','idiot','idiote',
  'imbécile','imbecile','crétin','cretin','abruti','abrutie','débile','debile',
  // Racisme
  'nigger','negro','nègre','negre','bougnoule','bicot','bamboula','youpin','youpine','juif','arabe',
  'raton','gitan','tzigane','chinetoque','bridé','bride','feuj','pédé','pede','tapette','gouine',
  'homo','lesbian','transgenre','nazi','hitler','fasciste','kkk','raciste',
  // Sexual
  'sex','sexe','porn','porno','cul','anus','vagin','penis','seins','nichons','fesse',
  'orgasme','ejac','masturbation',
  // Violence
  'kill','tuer','mort','mourir','suicide','viol','violer','terroriste','attentat','bombe',
  // Anglais
  'fuck','shit','bitch','asshole','bastard','cunt','dick','pussy','cock','whore','slut','nigga',
]

function containsBannedWord(pseudo: string): string | null {
  const lower = pseudo.toLowerCase().replace(/[^a-z0-9]/g, '')
  for (const word of BANNED_WORDS) {
    const clean = word.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (lower.includes(clean)) return word
  }
  return null
}

export async function POST(req: NextRequest) {
  const { pseudo, userId } = await req.json()

  if (!pseudo || typeof pseudo !== 'string') {
    return NextResponse.json({ ok: false, error: 'Pseudo invalide.' })
  }

  // Longueur
  if (pseudo.length < 3) return NextResponse.json({ ok: false, error: 'Le pseudo doit faire au moins 3 caractères.' })
  if (pseudo.length > 20) return NextResponse.json({ ok: false, error: 'Le pseudo ne peut pas dépasser 20 caractères.' })

  // Caractères autorisés uniquement
  if (!/^[a-zA-Z0-9_\-\.]+$/.test(pseudo)) {
    return NextResponse.json({ ok: false, error: 'Seules les lettres, chiffres, _ - . sont autorisés.' })
  }

  // Mots interdits
  const banned = containsBannedWord(pseudo)
  if (banned) {
    return NextResponse.json({ ok: false, error: 'Ce pseudo contient un mot non autorisé.' })
  }

  // Unicité
  const { data } = await admin
    .from('profiles')
    .select('id')
    .ilike('pseudo', pseudo)
    .neq('id', userId ?? '')
    .single()

  if (data) {
    return NextResponse.json({ ok: false, error: 'Ce pseudo est déjà pris.' })
  }

  return NextResponse.json({ ok: true })
}
