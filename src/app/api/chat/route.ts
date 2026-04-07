export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const SYSTEM_PROMPT = `Tu es WolfBot, l'assistant IA de WolfFuel — une application française de comparaison de prix de carburants et de bornes de recharge électrique.

Tu réponds UNIQUEMENT en français, de façon concise et amicale. Tu utilises des emojis avec modération.

Tu es expert sur :
- Les carburants français : Gazole, SP95, SP98, SP95-E10 (E10), E85 (superéthanol), GPLc
- Les prix carburants en France, leur composition, les taxes (TICPE), les variations
- Les bornes de recharge électrique : Type 2, CCS Combo, CHAdeMO, NACS, puissances, temps de charge
- Les conseils d'économies carburant (conduite souple, pression pneus, etc.)
- L'application WolfFuel : recherche de stations, favoris, alertes prix, historique
- Les véhicules : consommation, entretien, vidange, etc.

Si la question ne concerne pas ces sujets, réponds poliment que tu ne peux aider que sur les carburants, les bornes EV et WolfFuel.

Garde tes réponses courtes (max 3-4 phrases) sauf si on te demande une explication détaillée.`

export async function POST(req: NextRequest) {
  const { messages, topic } = await req.json()

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: 'Groq non configuré' }, { status: 503 })
  }

  if (!messages?.length) {
    return NextResponse.json({ error: 'No messages' }, { status: 400 })
  }

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

    const systemMsg = topic === 'ev'
      ? SYSTEM_PROMPT + '\n\nL\'utilisateur est sur la section "Bornes de recharge électrique".'
      : SYSTEM_PROMPT + '\n\nL\'utilisateur est sur la section "Prix carburants".'

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemMsg },
        ...messages,
      ],
      max_tokens: 300,
      temperature: 0.6,
    })

    const reply = completion.choices[0]?.message?.content ?? 'Désolé, je n\'ai pas pu répondre.'
    return NextResponse.json({ reply })
  } catch (err) {
    console.error('Groq error:', err)
    return NextResponse.json({ error: 'Erreur IA' }, { status: 500 })
  }
}
