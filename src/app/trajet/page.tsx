'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Vehicle = {
  marque?: string; modele?: string; carburant?: string
  consommation?: number; capacite_reservoir?: number
}

const FUEL_PRICES: Record<string, number> = {
  Gazole: 1.72,
  SP95: 1.82,
  SP98: 1.90,
  E10: 1.79,
  E85: 0.92,
  GPLc: 0.88,
  Électrique: 0.18,
}

const FUEL_LABELS: Record<string, string> = {
  Gazole: 'Gazole (diesel)', SP95: 'SP95 (sans plomb)', SP98: 'SP98', E10: 'SP95-E10',
  E85: 'Éthanol E85', GPLc: 'GPL carburant', Électrique: 'Électrique (kWh)',
}

export default function TrajetPage() {
  const router = useRouter()
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)

  // Inputs
  const [distance, setDistance] = useState('')
  const [fuelType, setFuelType] = useState('Gazole')
  const [conso, setConso] = useState('')
  const [pricePerL, setPricePerL] = useState('')
  const [passengers, setPassengers] = useState('1')

  // Result
  const [result, setResult] = useState<{
    totalCost: number; perPerson: number; liters: number; co2: number
    stops: number; duration: { h: number; min: number }
  } | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.replace('/login'); return }
      const res = await fetch(`/api/vehicles?userId=${data.user.id}`)
      const json = await res.json()
      if (json.vehicle) {
        setVehicle(json.vehicle)
        if (json.vehicle.carburant) setFuelType(json.vehicle.carburant)
        if (json.vehicle.consommation) setConso(String(json.vehicle.consommation))
      }
      setPricePerL(FUEL_PRICES[fuelType]?.toFixed(3) ?? '1.720')
      setLoading(false)
    })
  }, [router, fuelType])

  const calculate = () => {
    const d = parseFloat(distance)
    const c = parseFloat(conso)
    const p = parseFloat(pricePerL)
    const pass = parseInt(passengers)
    if (!d || !c || !p) return

    const isElectric = fuelType === 'Électrique'
    const consumption = (c / 100) * d
    const totalCost = consumption * p
    const perPerson = totalCost / pass
    const co2 = isElectric ? (d * 0.05) : (consumption * (fuelType === 'E85' ? 0.8 : fuelType === 'GPLc' ? 1.65 : 2.37))
    const stops = Math.max(0, Math.floor(d / (vehicle?.capacite_reservoir ? (vehicle.capacite_reservoir / c * 100) : 600)) )
    const avgSpeed = 90
    const totalMin = Math.round((d / avgSpeed) * 60)
    const h = Math.floor(totalMin / 60)
    const min = totalMin % 60

    setResult({ totalCost, perPerson, liters: consumption, co2, stops, duration: { h, min } })
  }

  const presets = [
    { label: '🏙️ Ville', km: 20 },
    { label: '🛣️ Trajet moyen', km: 150 },
    { label: '🏖️ Vacances', km: 500 },
    { label: '🌍 Long trajet', km: 1000 },
  ]

  return (
    <div style={{ minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", color: '#e2e8f0', padding: '24px 20px 60px' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <a href="/" style={{ color: '#64748b', textDecoration: 'none', fontSize: '20px' }}>←</a>
          <h1 style={{
            fontSize: '20px', fontWeight: 800,
            background: 'linear-gradient(135deg,#c084fc,#a855f7)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>🗺️ Estimateur de trajet</h1>
        </div>

        {vehicle && (
          <div style={{
            background: 'rgba(168,85,247,.08)', border: '1px solid rgba(168,85,247,.2)',
            borderRadius: '12px', padding: '12px 16px', marginBottom: '16px',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <span style={{ fontSize: '22px' }}>🚗</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9' }}>
                {vehicle.marque} {vehicle.modele}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                {vehicle.consommation}L/100km · {vehicle.carburant}
              </div>
            </div>
            <a href="/vehicule" style={{ marginLeft: 'auto', fontSize: '12px', color: '#a855f7', textDecoration: 'none', fontWeight: 700 }}>
              Modifier →
            </a>
          </div>
        )}

        {/* Presets rapides */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#64748b', marginBottom: '8px' }}>
            Raccourcis rapides
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {presets.map(p => (
              <button key={p.km} onClick={() => setDistance(String(p.km))} style={{
                padding: '7px 12px', borderRadius: '8px', border: '1px solid rgba(168,85,247,.25)',
                background: distance === String(p.km) ? 'linear-gradient(135deg,#a855f7,#7c3aed)' : 'rgba(168,85,247,.08)',
                color: distance === String(p.km) ? '#fff' : '#94a3b8',
                fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}>{p.label} · {p.km} km</button>
            ))}
          </div>
        </div>

        {/* Formulaire */}
        <div style={{
          background: 'rgba(15,10,40,.85)', border: '1.5px solid rgba(139,92,246,.25)',
          borderRadius: '16px', padding: '20px', marginBottom: '12px',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#64748b', marginBottom: '6px', display: 'block' }}>
                Distance (km) *
              </label>
              <input
                type="number" placeholder="Ex : 250" value={distance}
                onChange={e => setDistance(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1.5px solid rgba(168,85,247,.2)', background: 'rgba(168,85,247,.06)', color: '#f1f5f9', fontSize: '15px', outline: 'none', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#64748b', marginBottom: '6px', display: 'block' }}>
                Carburant
              </label>
              <select value={fuelType}
                onChange={e => { setFuelType(e.target.value); setPricePerL(FUEL_PRICES[e.target.value]?.toFixed(3) ?? '') }}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1.5px solid rgba(168,85,247,.2)', background: 'rgba(168,85,247,.06)', color: '#f1f5f9', fontSize: '14px', outline: 'none', fontFamily: "'DM Sans', sans-serif", cursor: 'pointer' }}>
                {Object.entries(FUEL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#64748b', marginBottom: '6px', display: 'block' }}>
                  {fuelType === 'Électrique' ? 'Consommation (kWh/100km)' : 'Conso (L/100km)'}
                </label>
                <input
                  type="number" placeholder={fuelType === 'Électrique' ? '18' : '7.0'} step="0.1"
                  value={conso} onChange={e => setConso(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1.5px solid rgba(168,85,247,.2)', background: 'rgba(168,85,247,.06)', color: '#f1f5f9', fontSize: '14px', outline: 'none', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#64748b', marginBottom: '6px', display: 'block' }}>
                  {fuelType === 'Électrique' ? 'Prix/kWh (€)' : 'Prix/litre (€)'}
                </label>
                <input
                  type="number" placeholder="1.720" step="0.001"
                  value={pricePerL} onChange={e => setPricePerL(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1.5px solid rgba(168,85,247,.2)', background: 'rgba(168,85,247,.06)', color: '#f1f5f9', fontSize: '14px', outline: 'none', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#64748b', marginBottom: '6px', display: 'block' }}>
                Nombre de passagers (pour partager)
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setPassengers(String(n))} style={{
                    flex: 1, padding: '10px 0', borderRadius: '8px', border: 'none',
                    background: passengers === String(n) ? 'linear-gradient(135deg,#a855f7,#7c3aed)' : 'rgba(168,85,247,.1)',
                    color: passengers === String(n) ? '#fff' : '#94a3b8',
                    fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                  }}>{n}</button>
                ))}
              </div>
            </div>

            <button onClick={calculate} disabled={!distance || !conso || !pricePerL} style={{
              width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
              background: !distance || !conso || !pricePerL ? 'rgba(168,85,247,.3)' : 'linear-gradient(135deg,#a855f7,#7c3aed)',
              color: '#fff', fontSize: '16px', fontWeight: 800, cursor: !distance || !conso || !pricePerL ? 'not-allowed' : 'pointer',
              fontFamily: "'DM Sans', sans-serif", marginTop: '4px',
            }}>
              🧮 Calculer le coût
            </button>
          </div>
        </div>

        {/* Résultat */}
        {result && (
          <div style={{
            background: 'linear-gradient(135deg,rgba(168,85,247,.12),rgba(124,58,237,.08))',
            border: '1.5px solid rgba(168,85,247,.4)',
            borderRadius: '16px', padding: '20px', marginBottom: '12px',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#a855f7', marginBottom: '16px' }}>
              Résultats pour {distance} km
            </div>

            {/* Coût principal */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '42px', fontWeight: 900, color: '#f1f5f9', lineHeight: 1 }}>
                {result.totalCost.toFixed(2)}€
              </div>
              <div style={{ fontSize: '14px', color: '#94a3b8', marginTop: '4px' }}>coût total carburant</div>
              {parseInt(passengers) > 1 && (
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#34d399', marginTop: '8px' }}>
                  {result.perPerson.toFixed(2)}€ / personne
                </div>
              )}
            </div>

            {/* Détails */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { icon: '⛽', label: fuelType === 'Électrique' ? 'Énergie' : 'Carburant', value: result.liters.toFixed(1) + (fuelType === 'Électrique' ? ' kWh' : 'L') },
                { icon: '⏱️', label: 'Durée estimée', value: result.duration.h > 0 ? result.duration.h + 'h' + String(result.duration.min).padStart(2, '0') : result.duration.min + ' min' },
                { icon: '🌿', label: 'CO₂ émis', value: result.co2.toFixed(1) + ' kg' },
                { icon: '🛑', label: 'Arrêts essence', value: result.stops > 0 ? result.stops + ' arrêt' + (result.stops > 1 ? 's' : '') : 'Aucun' },
              ].map(d => (
                <div key={d.label} style={{
                  background: 'rgba(15,10,40,.6)', borderRadius: '10px', padding: '12px',
                  textAlign: 'center', border: '1px solid rgba(139,92,246,.15)',
                }}>
                  <div style={{ fontSize: '20px', marginBottom: '4px' }}>{d.icon}</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#f1f5f9' }}>{d.value}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{d.label}</div>
                </div>
              ))}
            </div>

            {/* Comparaison carburants */}
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '8px' }}>
                Comparaison si autre carburant :
              </div>
              {['Gazole', 'SP95', 'E85', 'Électrique']
                .filter(f => f !== fuelType)
                .map(f => {
                  const altCost = (parseFloat(conso) / 100) * parseFloat(distance) * FUEL_PRICES[f]
                  const diff = altCost - result.totalCost
                  return (
                    <div key={f} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '6px 0', borderBottom: '1px solid rgba(139,92,246,.08)', fontSize: '13px',
                    }}>
                      <span style={{ color: '#94a3b8' }}>{f}</span>
                      <span style={{ fontWeight: 700 }}>
                        {altCost.toFixed(2)}€
                        <span style={{ fontSize: '12px', color: diff < 0 ? '#34d399' : '#f87171', marginLeft: '6px' }}>
                          {diff < 0 ? '−' + Math.abs(diff).toFixed(2) : '+' + diff.toFixed(2)}€
                        </span>
                      </span>
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        {/* Conseils */}
        <div style={{
          background: 'rgba(15,10,40,.85)', border: '1.5px solid rgba(139,92,246,.15)',
          borderRadius: '16px', padding: '16px',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '.06em' }}>
            💡 Conseils économies
          </div>
          {[
            '🚗 Maintenez 110 km/h sur autoroute plutôt que 130 : −20% de conso',
            '🔄 Vérifiez la pression des pneus chaque mois : jusqu\'à −3% de conso',
            '🌡️ Évitez le moteur au ralenti prolongé',
            '⚖️ Allégez le coffre : 100 kg de moins = −5% de conso',
            '📍 Utilisez WolfFuel pour trouver la station la moins chère sur votre route',
          ].map((tip, i) => (
            <div key={i} style={{ fontSize: '13px', color: '#94a3b8', padding: '6px 0', borderBottom: i < 4 ? '1px solid rgba(139,92,246,.06)' : 'none', lineHeight: '1.4' }}>
              {tip}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
