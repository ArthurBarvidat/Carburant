export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const SYSTEM_PROMPT = `Tu es WolfBot, l'assistant IA de WolfFuel — application française de comparaison de prix carburants et bornes de recharge.

Tu réponds UNIQUEMENT en français. Tu utilises des emojis avec modération.

RÈGLE ABSOLUE : Tes réponses font maximum 2-3 phrases courtes. Jamais de listes à puces, jamais de paragraphes longs. Direct et efficace.

IMPORTANT : Tu as accès à un outil "search_fuel_prices" pour rechercher les VRAIS prix carburants en France en temps réel.
Utilise-le OBLIGATOIREMENT quand l'utilisateur demande des prix, des stations, ou veut comparer des tarifs.
Ne jamais inventer ou supposer des prix — utilise toujours l'outil pour avoir les vraies données.

Tu es expert sur les carburants (Gazole, SP95, SP98, E10, E85, GPLc), les bornes de recharge (Type 2, CCS, CHAdeMO) et l'application WolfFuel.`

// Appel réel à l'API gouvernementale des prix carburants
async function searchFuelPrices(city: string, fuelType: string): Promise<string> {
  try {
    // Géocoder la ville — récupérer plusieurs résultats pour détecter les homonymes
    const geoRes = await fetch(
      `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(city)}&type=municipality&limit=5`
    )
    const geoData = await geoRes.json()
    const features = geoData.features ?? []
    if (!features.length) return `Ville "${city}" introuvable.`

    // Détecter les villes homonymes (même nom, départements différents)
    const firstName = features[0].properties.name?.toLowerCase()
    const homonymes = features.filter((f: { properties: { name?: string } }) =>
      f.properties.name?.toLowerCase() === firstName
    )

    if (homonymes.length > 1) {
      // Plusieurs villes avec le même nom — demander précision
      const options = homonymes.map((f: { properties: { label: string; context: string } }) =>
        `• ${f.properties.label} (${f.properties.context?.split(',')[0]?.trim()})`
      ).join('\n')
      return `Il existe plusieurs communes nommées "${city}" en France :\n${options}\n\nPrécise le département ou la région pour que je cherche les bons prix !`
    }

    const feature = features[0]
    const lon = feature.geometry.coordinates[0]
    const lat = feature.geometry.coordinates[1]
    const cityName = feature.properties.label

    // Map fuel type
    const fuelMap: Record<string, { field: string; label: string }> = {
      gazole: { field: 'gazole_prix', label: 'Gazole' },
      diesel: { field: 'gazole_prix', label: 'Gazole' },
      sp95: { field: 'sp95_prix', label: 'SP95' },
      sp98: { field: 'sp98_prix', label: 'SP98' },
      e10: { field: 'e10_prix', label: 'SP95-E10' },
      e85: { field: 'e85_prix', label: 'E85' },
      ethanol: { field: 'e85_prix', label: 'E85' },
      gplc: { field: 'gplc_prix', label: 'GPLc' },
      gpl: { field: 'gplc_prix', label: 'GPLc' },
    }

    const fuelKey = fuelType.toLowerCase().replace(/[-\s]/g, '')
    const fuel = fuelMap[fuelKey] ?? fuelMap['gazole']

    const where = `within_distance(geom, geom'POINT(${lon} ${lat})', 10km)`
    const url = `https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records?select=adresse,ville,${fuel.field}&where=${encodeURIComponent(where)}&limit=10&order_by=${fuel.field}%20asc`

    const res = await fetch(url)
    const data = await res.json()
    const results = (data.results ?? []).filter((r: Record<string, unknown>) => r[fuel.field] != null)

    if (!results.length) return `Aucune station avec du ${fuel.label} trouvée dans 10 km autour de ${cityName}.`

    const lines = results.slice(0, 5).map((r: Record<string, unknown>, i: number) => {
      const price = parseFloat(String(r[fuel.field])).toFixed(3)
      const addr = [r.adresse, r.ville].filter(Boolean).join(', ')
      return `${i + 1}. ${price}€/L — ${addr}`
    })

    const best = parseFloat(String(results[0][fuel.field])).toFixed(3)
    const avg = (results.reduce((s: number, r: Record<string, unknown>) => s + parseFloat(String(r[fuel.field])), 0) / results.length).toFixed(3)

    return `Prix ${fuel.label} autour de ${cityName} :\n${lines.join('\n')}\n\n💰 Meilleur prix : ${best}€/L | Moyenne : ${avg}€/L`
  } catch (err) {
    return `Erreur lors de la recherche des prix : ${err instanceof Error ? err.message : 'inconnue'}`
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tools: any[] = [
  {
    type: 'function',
    function: {
      name: 'search_fuel_prices',
      description: 'Recherche les vrais prix carburants en temps réel autour d\'une ville française. Utilise cette fonction quand l\'utilisateur demande des prix, des stations ou veut comparer des tarifs.',
      parameters: {
        type: 'object',
        properties: {
          city: {
            type: 'string',
            description: 'Nom de la ville française (ex: Lyon, Paris, Bordeaux)',
          },
          fuel_type: {
            type: 'string',
            enum: ['gazole', 'sp95', 'sp98', 'e10', 'e85', 'gplc'],
            description: 'Type de carburant recherché',
          },
        },
        required: ['city', 'fuel_type'],
      },
    },
  },
]

export async function POST(req: NextRequest) {
  const { messages, topic, pseudo } = await req.json()

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: 'Groq non configuré' }, { status: 503 })
  }
  if (!messages?.length) {
    return NextResponse.json({ error: 'No messages' }, { status: 400 })
  }

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

    const userContext = pseudo ? `\n\nL'utilisateur s'appelle "${pseudo}". Utilise son prénom/pseudo pour personnaliser tes réponses.` : ''

    const systemMsg = SYSTEM_PROMPT + userContext + (topic === 'ev'
      ? '\n\nL\'utilisateur est sur la section "Bornes de recharge électrique". Pour les bornes EV, tu ne peux pas chercher les prix mais tu peux répondre sur les connecteurs, temps de charge, compatibilité.'
      : '\n\nL\'utilisateur est sur la section "Prix carburants". Utilise search_fuel_prices quand il demande des prix réels.')

    const groqMessages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemMsg },
      ...messages,
    ]

    // Premier appel — l'IA décide si elle doit appeler un outil
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: groqMessages,
      tools: topic === 'ev' ? undefined : tools,
      tool_choice: topic === 'ev' ? undefined : 'auto',
      max_tokens: 200,
      temperature: 0.4,
    })

    const choice = response.choices[0]

    // L'IA veut appeler un outil
    if (choice.finish_reason === 'tool_calls' && choice.message.tool_calls) {
      const toolCall = choice.message.tool_calls[0]
      const args = JSON.parse(toolCall.function.arguments)

      // Exécuter la recherche réelle
      const toolResult = await searchFuelPrices(args.city, args.fuel_type)

      // Deuxième appel avec le résultat de l'outil
      const response2 = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          ...groqMessages,
          { role: 'assistant', content: null, tool_calls: choice.message.tool_calls },
          { role: 'tool', tool_call_id: toolCall.id, content: toolResult },
        ],
        max_tokens: 250,
        temperature: 0.4,
      })

      const reply = response2.choices[0]?.message?.content ?? toolResult
      return NextResponse.json({ reply })
    }

    // Réponse normale sans outil
    let reply = choice.message?.content ?? 'Désolé, je n\'ai pas pu répondre.'

    // Le modèle a parfois écrit le tool call en texte brut — détecter et exécuter
    const inlineMatch = reply.match(/<function=search_fuel_prices>\s*(\{[\s\S]*?\})\s*<\/function>/)
    if (inlineMatch) {
      try {
        const args = JSON.parse(inlineMatch[1])
        const toolResult = await searchFuelPrices(args.city, args.fuel_type)
        const response2 = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            ...groqMessages,
            { role: 'assistant', content: reply },
            { role: 'user', content: `Résultat de la recherche :\n${toolResult}\n\nRésume ces prix en 2-3 phrases courtes.` },
          ],
          max_tokens: 250,
          temperature: 0.4,
        })
        reply = response2.choices[0]?.message?.content ?? toolResult
      } catch {
        // Si parsing échoue, supprimer juste le tag de la réponse
        reply = reply.replace(/<function=search_fuel_prices>[\s\S]*?<\/function>/g, '').trim()
      }
    }

    return NextResponse.json({ reply })

  } catch (err) {
    console.error('Groq error:', err)
    return NextResponse.json({ error: 'Erreur IA' }, { status: 500 })
  }
}
