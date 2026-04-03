'use client'
import { useState, useRef, useEffect } from 'react'

type Topic = 'fuel' | 'ev' | null
interface Msg { role: 'user' | 'bot'; text: string }

// ── Réponses carburant ────────────────────────────────────────────────────────
const FUEL_QA: { q: string; a: string }[] = [
  { q: 'Quel carburant est le moins cher ?',
    a: '💰 En général : E85 < GPLc < SP95-E10 < SP95 < Gazole < SP98.\nL\'E85 (éthanol) est souvent 2 fois moins cher que le SP95, mais nécessite un véhicule flex-fuel ou un kit.\nUtilise le filtre "Prix" pour trier par tarif dans ta zone.' },
  { q: 'C\'est quoi le SP95-E10 ?',
    a: '🌿 Le SP95-E10 contient jusqu\'à 10% d\'éthanol (E10). Il est légèrement moins cher que le SP95 classique et compatible avec la majorité des voitures depuis 2000. Vérifie dans ton manuel si ton moteur l\'accepte.' },
  { q: 'C\'est quoi le E85 ?',
    a: '🌾 Le E85 (superéthanol) contient 65 à 85% d\'éthanol. Il est très bon marché (~0,80€/L) mais consomme plus (+20-25%). Compatible flex-fuel natif ou avec kit boîtier (€300-€500). Rentable si tu roules beaucoup.' },
  { q: 'Différence GPLc et autres ?',
    a: '🔵 Le GPLc (gaz de pétrole liquéfié carburant) est bon marché (~0,75€/L) mais consomme plus que l\'essence. Nécessite une installation spéciale. Peu de stations proposent du GPLc en France (~2 000).' },
  { q: 'Comment trouver la station la moins chère ?',
    a: '🔍 Astuce WolfFuel :\n1. Lance une recherche sur ta ville\n2. Clique sur "Tous les carburants" pour voir la vue complète\n3. Trie par "Prix" pour avoir la moins chère en premier\n4. Active le GPS pour les distances exactes' },
  { q: 'Pourquoi les prix changent autant ?',
    a: '📈 Le prix carburant dépend : du baril de pétrole brut, du taux de change €/$, des taxes (TICPE = 60% du prix), des marges de la station et de la concurrence locale. Les prix fluctuent chaque jour.' },
]

// ── Réponses bornes EV ───────────────────────────────────────────────────────
const EV_QA: { q: string; a: string }[] = [
  { q: 'C\'est quoi le Type 2 ?',
    a: '🔌 Le Type 2 (Mennekes) est la prise AC universelle en Europe. Compatible avec quasiment toutes les voitures électriques : Renault, Peugeot, VW, BMW, Audi, Tesla, Hyundai, Kia…\nC\'est le standard pour la recharge lente (3-22kW).' },
  { q: 'Différence CCS / CHAdeMO ?',
    a: '⚡ CCS Combo (DC rapide) → BMW, VW, Audi, Porsche, Hyundai, Kia, Ford, Mercedes, Renault (récents)…\n🔋 CHAdeMO (DC rapide, japonais) → Nissan Leaf, Mitsubishi, anciens Kia. En voie de disparition en Europe.' },
  { q: 'Combien de temps pour recharger ?',
    a: '⏱️ Temps de recharge (pour 80%) :\n• Ultra-rapide ≥150kW → 20-30 min\n• Rapide ≥50kW → 45-60 min\n• Semi-rapide 22kW → 1h30-2h\n• Normale 7kW → 3h-4h\n• Lente 3kW → 6h-8h' },
  { q: 'Ma voiture est-elle compatible ?',
    a: '🚗 Si ta voiture a une prise Type 2, elle est compatible avec toutes les bornes AC en Europe.\nPour la recharge rapide DC, vérifie si tu as CCS ou CHAdeMO dans ton manuel.\nLes Tesla ont leur propre connecteur (NACS) + adaptateur CCS.' },
  { q: 'Comment filtrer par vitesse de charge ?',
    a: '🎛️ Sur la page des bornes, utilise les onglets en haut :\n• "Rapide ≥50kW" pour la charge rapide\n• "Semi ≥22kW" pour charge intermédiaire\n• "Normale" pour les bornes lentes\nLe compteur dans chaque onglet montre combien de bornes sont dispo.' },
  { q: 'Les bornes sont-elles gratuites ?',
    a: '💶 Certaines bornes sont gratuites (Lidl, IKEA, certains parkings). La plupart sont payantes : à la session, à l\'heure ou au kWh. Ionity : ~0,69€/kWh. Fastned : ~0,65€/kWh. EDF Izivia : ~0,35€/kWh en abonnement.' },
]

function getBotResponse(input: string, topic: Topic): string {
  const lower = input.toLowerCase()
  const qa = topic === 'ev' ? EV_QA : FUEL_QA
  for (const item of qa) {
    const keywords = item.q.toLowerCase().split(/\s+/).filter(w => w.length > 3)
    if (keywords.some(k => lower.includes(k))) return item.a
  }
  // Fallback cross-topic
  const allQA = [...FUEL_QA, ...EV_QA]
  for (const item of allQA) {
    const keywords = item.q.toLowerCase().split(/\s+/).filter(w => w.length > 3)
    if (keywords.some(k => lower.includes(k))) return item.a
  }
  return '🐺 Je n\'ai pas trouvé de réponse précise. Essaie une question parmi les suggestions, ou change de sujet avec le bouton ci-dessus.'
}

export default function WolfChat() {
  const [open,   setOpen]   = useState(false)
  const [topic,  setTopic]  = useState<Topic>(null)
  const [msgs,   setMsgs]   = useState<Msg[]>([])
  const [input,  setInput]  = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, open, topic])

  function chooseTopic(t: Topic) {
    setTopic(t)
    const greeting = t === 'fuel'
      ? '⛽ Parfait ! Pose-moi ta question sur les carburants, ou choisis un sujet ci-dessous.'
      : '⚡ Parfait ! Pose-moi ta question sur les bornes de recharge, ou choisis un sujet ci-dessous.'
    setMsgs([{ role: 'bot', text: greeting }])
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  function resetTopic() {
    setTopic(null)
    setMsgs([])
    setInput('')
  }

  function send(text: string) {
    if (!text.trim() || !topic) return
    const userMsg: Msg = { role: 'user', text: text.trim() }
    const botMsg:  Msg = { role: 'bot',  text: getBotResponse(text, topic) }
    setMsgs(prev => [...prev, userMsg, botMsg])
    setInput('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const qa = topic === 'ev' ? EV_QA : topic === 'fuel' ? FUEL_QA : []

  return (
    <>
      {/* Panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 80, right: 16, width: 320,
          background: 'rgba(6,3,20,.97)', border: '1.5px solid rgba(168,85,247,.35)',
          borderRadius: 20, zIndex: 99990, display: 'flex', flexDirection: 'column',
          boxShadow: '0 8px 40px rgba(0,0,0,.8)', fontFamily: "'DM Sans',sans-serif",
          maxHeight: 520, overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(168,85,247,.15)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <img src="/wolf-logo.png" alt="Wolf" style={{ width: 28, height: 28, borderRadius: '50%' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#f1f5f9' }}>WolfBot</div>
              <div style={{ fontSize: 11, color: '#a855f7' }}>
                {topic === 'fuel' ? '⛽ Carburants' : topic === 'ev' ? '⚡ Bornes EV' : 'Choisissez un sujet'}
              </div>
            </div>
            {topic && (
              <button onClick={resetTopic}
                style={{ padding: '4px 8px', borderRadius: 8, border: '1px solid rgba(168,85,247,.3)', background: 'rgba(168,85,247,.1)', color: '#c084fc', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                🔄 Sujet
              </button>
            )}
            <button onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: 0 }}>
              ✕
            </button>
          </div>

          {/* Sélection sujet */}
          {!topic && (
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', textAlign: 'center', lineHeight: 1.5 }}>
                🐺 Salut ! Sur quoi veux-tu que je t&apos;aide ?
              </p>
              <button onClick={() => chooseTopic('fuel')}
                style={{ padding: '16px 14px', borderRadius: 14, border: '1.5px solid rgba(251,191,36,.3)', background: 'rgba(251,191,36,.08)', color: '#fbbf24', fontSize: 14, fontWeight: 700, cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans',sans-serif" }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>⛽</div>
                <div>Prix carburants</div>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400, marginTop: 3 }}>Gazole, SP95, E85, GPLc, conseils économies</div>
              </button>
              <button onClick={() => chooseTopic('ev')}
                style={{ padding: '16px 14px', borderRadius: 14, border: '1.5px solid rgba(6,182,212,.3)', background: 'rgba(6,182,212,.08)', color: '#06b6d4', fontSize: 14, fontWeight: 700, cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans',sans-serif" }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>⚡</div>
                <div>Bornes de recharge EV</div>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400, marginTop: 3 }}>Type 2, CCS, CHAdeMO, temps de charge, compatibilité</div>
              </button>
            </div>
          )}

          {/* Messages */}
          {topic && (
            <>
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
                {msgs.map((m, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '88%', padding: '9px 13px',
                      borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      background: m.role === 'user' ? 'linear-gradient(135deg,#a855f7,#7c3aed)' : 'rgba(168,85,247,.1)',
                      border: m.role === 'user' ? 'none' : '1px solid rgba(168,85,247,.2)',
                      color: '#f1f5f9', fontSize: 13, lineHeight: 1.55, whiteSpace: 'pre-wrap',
                    }}>
                      {m.text}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Suggestions rapides */}
              <div style={{ padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 5, borderTop: '1px solid rgba(168,85,247,.1)', flexShrink: 0 }}>
                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 2 }}>Suggestions</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {qa.slice(0, 3).map((item, i) => (
                    <button key={i} onClick={() => send(item.q)} style={{
                      padding: '5px 9px', borderRadius: 10, border: '1px solid rgba(168,85,247,.25)',
                      background: 'rgba(168,85,247,.07)', color: '#c084fc', fontSize: 11, fontWeight: 600,
                      cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", textAlign: 'left',
                    }}>
                      {item.q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input */}
              <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(168,85,247,.12)', display: 'flex', gap: 8, flexShrink: 0 }}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') send(input) }}
                  placeholder="Pose ta question..."
                  style={{
                    flex: 1, padding: '9px 12px', borderRadius: 12,
                    border: '1px solid rgba(168,85,247,.3)',
                    background: 'rgba(168,85,247,.08)', color: '#f1f5f9', fontSize: 13,
                    fontFamily: "'DM Sans',sans-serif", outline: 'none',
                    WebkitAppearance: 'none',
                  }}
                />
                <button onClick={() => send(input)} style={{
                  padding: '9px 13px', borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg,#a855f7,#7c3aed)', color: '#fff',
                  fontSize: 16, cursor: 'pointer', flexShrink: 0,
                }}>➤</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* FAB wolf */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: 20, right: 16, width: 54, height: 54,
          borderRadius: '50%', border: '2px solid rgba(168,85,247,.6)',
          background: 'linear-gradient(135deg,#a855f7,#7c3aed)',
          cursor: 'pointer', zIndex: 99991, display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(168,85,247,.55)', transition: 'transform .2s', padding: 0,
        }}
        title="WolfBot — Assistant"
      >
        <img src="/wolf-logo.png" alt="Wolf" style={{ width: 34, height: 34, borderRadius: '50%' }} />
      </button>
    </>
  )
}
