'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Vehicle = {
  marque?: string; modele?: string; annee?: number; carburant?: string
  capacite_reservoir?: number; consommation?: number; immatriculation?: string
}

type FillUp = {
  id: string; station_name?: string; fuel_type: string; price_per_liter: number
  liters: number; total_cost: number; km_before?: number; km_after?: number
  notes?: string; created_at: string
}

type Reminder = {
  id: string; type: string; label: string; due_km?: number; due_date?: string
  current_km?: number; done: boolean
}

type Stats = { total_cost: number; total_liters: number; avg_price: number; count: number }

const FUEL_TYPES = ['Gazole', 'SP95', 'SP98', 'E10', 'E85', 'GPLc', 'Électrique']
const MAINTENANCE_TYPES = [
  { id: 'vidange', label: '🛢️ Vidange' },
  { id: 'pneus', label: '🔄 Pneus' },
  { id: 'revision', label: '🔧 Révision' },
  { id: 'controle_technique', label: '📋 Contrôle technique' },
  { id: 'courroie', label: '⚙️ Courroie de distribution' },
  { id: 'filtres', label: '🔲 Filtres (air/habitacle)' },
  { id: 'autre', label: '📝 Autre' },
]

const cardStyle: React.CSSProperties = {
  background: 'rgba(15,10,40,.85)', border: '1.5px solid rgba(139,92,246,.25)',
  borderRadius: '16px', padding: '20px', marginBottom: '12px',
}
const labelStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '.08em', color: '#64748b', marginBottom: '8px', display: 'block',
}
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: '10px',
  border: '1.5px solid rgba(168,85,247,.2)', background: 'rgba(168,85,247,.06)',
  color: '#f1f5f9', fontSize: '14px', outline: 'none',
  fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box',
}
const btnPrimary: React.CSSProperties = {
  padding: '11px 20px', borderRadius: '10px', border: 'none',
  background: 'linear-gradient(135deg,#a855f7,#7c3aed)',
  color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
  fontFamily: "'DM Sans', sans-serif",
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.getDate() + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear()
}

export default function VehiculePage() {
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [tab, setTab] = useState<'vehicle' | 'history' | 'maintenance'>('vehicle')
  const [loading, setLoading] = useState(true)

  // Vehicle
  const [vehicle, setVehicle] = useState<Vehicle>({})
  const [savingVehicle, setSavingVehicle] = useState(false)
  const [vehicleSaved, setVehicleSaved] = useState(false)

  // Fill-ups
  const [fillUps, setFillUps] = useState<FillUp[]>([])
  const [stats, setStats] = useState<Stats>({ total_cost: 0, total_liters: 0, avg_price: 0, count: 0 })
  const [showAddFill, setShowAddFill] = useState(false)
  const [newFill, setNewFill] = useState({
    station_name: '', fuel_type: 'Gazole', price_per_liter: '',
    liters: '', km_before: '', km_after: '', notes: '',
  })
  const [addingFill, setAddingFill] = useState(false)

  // Maintenance
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [showAddReminder, setShowAddReminder] = useState(false)
  const [newReminder, setNewReminder] = useState({ type: 'vidange', label: '🛢️ Vidange', due_km: '', due_date: '', current_km: '' })
  const [addingReminder, setAddingReminder] = useState(false)

  const loadData = useCallback(async (uid: string) => {
    const [vRes, fRes, rRes] = await Promise.all([
      fetch(`/api/vehicles?userId=${uid}`),
      fetch(`/api/fill-ups?userId=${uid}`),
      fetch(`/api/maintenance?userId=${uid}`),
    ])
    const [vData, fData, rData] = await Promise.all([vRes.json(), fRes.json(), rRes.json()])
    if (vData.vehicle) setVehicle(vData.vehicle)
    setFillUps(fData.fill_ups ?? [])
    setStats(fData.stats ?? { total_cost: 0, total_liters: 0, avg_price: 0, count: 0 })
    setReminders(rData.reminders ?? [])
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace('/login'); return }
      setUserId(data.user.id)
      loadData(data.user.id).then(() => setLoading(false))
    })
  }, [router, loadData])

  const saveVehicle = async () => {
    setSavingVehicle(true)
    await fetch('/api/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...vehicle }),
    })
    setSavingVehicle(false)
    setVehicleSaved(true)
    setTimeout(() => setVehicleSaved(false), 2500)
  }

  const addFillUp = async () => {
    if (!newFill.price_per_liter || !newFill.liters) return
    setAddingFill(true)
    await fetch('/api/fill-ups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        station_name: newFill.station_name || undefined,
        fuel_type: newFill.fuel_type,
        price_per_liter: parseFloat(newFill.price_per_liter),
        liters: parseFloat(newFill.liters),
        km_before: newFill.km_before ? parseFloat(newFill.km_before) : undefined,
        km_after: newFill.km_after ? parseFloat(newFill.km_after) : undefined,
        notes: newFill.notes || undefined,
      }),
    })
    setNewFill({ station_name: '', fuel_type: 'Gazole', price_per_liter: '', liters: '', km_before: '', km_after: '', notes: '' })
    setShowAddFill(false)
    setAddingFill(false)
    await loadData(userId)
  }

  const deleteFillUp = async (id: string) => {
    await fetch('/api/fill-ups', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, userId }),
    })
    setFillUps(prev => prev.filter(f => f.id !== id))
    setStats(prev => {
      const f = fillUps.find(x => x.id === id)
      if (!f) return prev
      return { ...prev, total_cost: prev.total_cost - f.total_cost, total_liters: prev.total_liters - f.liters, count: prev.count - 1 }
    })
  }

  const addReminder = async () => {
    setAddingReminder(true)
    await fetch('/api/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId, type: newReminder.type, label: newReminder.label,
        due_km: newReminder.due_km ? parseFloat(newReminder.due_km) : undefined,
        due_date: newReminder.due_date || undefined,
        current_km: newReminder.current_km ? parseFloat(newReminder.current_km) : undefined,
      }),
    })
    setNewReminder({ type: 'vidange', label: '🛢️ Vidange', due_km: '', due_date: '', current_km: '' })
    setShowAddReminder(false)
    setAddingReminder(false)
    await loadData(userId)
  }

  const toggleReminderDone = async (id: string, done: boolean) => {
    await fetch('/api/maintenance', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, userId, done: !done }),
    })
    setReminders(prev => prev.map(r => r.id === id ? { ...r, done: !done } : r))
  }

  const deleteReminder = async (id: string) => {
    await fetch('/api/maintenance', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, userId }),
    })
    setReminders(prev => prev.filter(r => r.id !== id))
  }

  const tabs = [
    { id: 'vehicle', label: '🚗 Mon véhicule' },
    { id: 'history', label: '⛽ Mes pleins' },
    { id: 'maintenance', label: '🔧 Entretien' },
  ]

  return (
    <div style={{ minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", color: '#e2e8f0', padding: '24px 20px 80px' }}>
      <div style={{ maxWidth: '520px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <a href="/" style={{ color: '#64748b', textDecoration: 'none', fontSize: '20px' }}>←</a>
          <h1 style={{
            fontSize: '20px', fontWeight: 800,
            background: 'linear-gradient(135deg,#c084fc,#a855f7)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>Mon véhicule</h1>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', overflowX: 'auto' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id as typeof tab)} style={{
              padding: '9px 14px', borderRadius: '10px', border: 'none', whiteSpace: 'nowrap',
              background: tab === t.id ? 'linear-gradient(135deg,#a855f7,#7c3aed)' : 'rgba(139,92,246,.1)',
              color: tab === t.id ? '#fff' : '#94a3b8', fontWeight: 700, fontSize: '13px',
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}>{t.label}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>Chargement…</div>
        ) : (
          <>
            {/* ── TAB VEHICLE ─────────────────────────────────────────── */}
            {tab === 'vehicle' && (
              <div style={cardStyle}>
                <span style={labelStyle}>Informations du véhicule</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  {[
                    { key: 'marque', label: 'Marque', placeholder: 'Ex : Renault', type: 'text' },
                    { key: 'modele', label: 'Modèle', placeholder: 'Ex : Clio', type: 'text' },
                    { key: 'annee', label: 'Année', placeholder: 'Ex : 2019', type: 'number' },
                    { key: 'immatriculation', label: 'Immatriculation', placeholder: 'AA-000-AA', type: 'text' },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ ...labelStyle, marginBottom: '4px' }}>{f.label}</label>
                      <input
                        type={f.type} placeholder={f.placeholder}
                        value={(vehicle as Record<string, unknown>)[f.key] as string ?? ''}
                        onChange={e => setVehicle(prev => ({ ...prev, [f.key]: e.target.value }))}
                        style={inputStyle}
                      />
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <label style={{ ...labelStyle, marginBottom: '4px' }}>Type de carburant</label>
                  <select
                    value={vehicle.carburant ?? 'Gazole'}
                    onChange={e => setVehicle(prev => ({ ...prev, carburant: e.target.value }))}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    {FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ ...labelStyle, marginBottom: '4px' }}>Capacité réservoir (L)</label>
                    <input
                      type="number" placeholder="Ex : 50"
                      value={vehicle.capacite_reservoir ?? ''}
                      onChange={e => setVehicle(prev => ({ ...prev, capacite_reservoir: parseFloat(e.target.value) }))}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, marginBottom: '4px' }}>Consommation (L/100km)</label>
                    <input
                      type="number" placeholder="Ex : 6.5" step="0.1"
                      value={vehicle.consommation ?? ''}
                      onChange={e => setVehicle(prev => ({ ...prev, consommation: parseFloat(e.target.value) }))}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <button onClick={saveVehicle} disabled={savingVehicle} style={{ ...btnPrimary, width: '100%' }}>
                  {savingVehicle ? 'Sauvegarde…' : vehicleSaved ? '✅ Sauvegardé !' : '💾 Sauvegarder le véhicule'}
                </button>

                {vehicle.consommation && vehicle.capacite_reservoir && (
                  <div style={{
                    marginTop: '16px', padding: '14px', borderRadius: '12px',
                    background: 'rgba(168,85,247,.08)', border: '1px solid rgba(168,85,247,.2)',
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#c084fc', marginBottom: '8px' }}>
                      📊 Estimations avec ce véhicule
                    </div>
                    <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.8' }}>
                      🔄 Autonomie plein : <strong style={{ color: '#f1f5f9' }}>
                        ~{Math.round((vehicle.capacite_reservoir! / vehicle.consommation!) * 100)} km
                      </strong><br />
                      💡 Coût aux 100km (à 1,80€/L) : <strong style={{ color: '#f1f5f9' }}>
                        ~{(vehicle.consommation! * 1.80).toFixed(2)}€
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB HISTORY ─────────────────────────────────────────── */}
            {tab === 'history' && (
              <>
                {/* Stats globales */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                  {[
                    { label: 'Total dépensé', value: stats.total_cost.toFixed(2) + '€', icon: '💶' },
                    { label: 'Litres achetés', value: stats.total_liters.toFixed(1) + 'L', icon: '⛽' },
                    { label: 'Prix moyen', value: stats.avg_price > 0 ? stats.avg_price.toFixed(3) + '€/L' : '—', icon: '📊' },
                    { label: 'Nombre de pleins', value: String(stats.count), icon: '🔢' },
                  ].map(s => (
                    <div key={s.label} style={{
                      ...cardStyle, padding: '14px', marginBottom: 0,
                      textAlign: 'center',
                    }}>
                      <div style={{ fontSize: '22px', marginBottom: '4px' }}>{s.icon}</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#f1f5f9' }}>{s.value}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                <button onClick={() => setShowAddFill(!showAddFill)} style={{
                  ...btnPrimary, width: '100%', marginBottom: '12px',
                  background: showAddFill ? 'rgba(168,85,247,.2)' : 'linear-gradient(135deg,#a855f7,#7c3aed)',
                  color: showAddFill ? '#c084fc' : '#fff',
                  border: showAddFill ? '1.5px solid rgba(168,85,247,.4)' : 'none',
                }}>
                  {showAddFill ? '✕ Annuler' : '+ Ajouter un plein'}
                </button>

                {showAddFill && (
                  <div style={{ ...cardStyle, marginBottom: '12px' }}>
                    <span style={labelStyle}>Nouveau plein</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div>
                        <label style={{ ...labelStyle, marginBottom: '4px' }}>Station (optionnel)</label>
                        <input type="text" placeholder="Nom de la station"
                          value={newFill.station_name}
                          onChange={e => setNewFill(p => ({ ...p, station_name: e.target.value }))}
                          style={inputStyle} />
                      </div>
                      <div>
                        <label style={{ ...labelStyle, marginBottom: '4px' }}>Carburant</label>
                        <select value={newFill.fuel_type}
                          onChange={e => setNewFill(p => ({ ...p, fuel_type: e.target.value }))}
                          style={{ ...inputStyle, cursor: 'pointer' }}>
                          {FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ ...labelStyle, marginBottom: '4px' }}>Prix/litre (€)</label>
                          <input type="number" placeholder="1.780" step="0.001"
                            value={newFill.price_per_liter}
                            onChange={e => setNewFill(p => ({ ...p, price_per_liter: e.target.value }))}
                            style={inputStyle} />
                        </div>
                        <div>
                          <label style={{ ...labelStyle, marginBottom: '4px' }}>Litres</label>
                          <input type="number" placeholder="45" step="0.1"
                            value={newFill.liters}
                            onChange={e => setNewFill(p => ({ ...p, liters: e.target.value }))}
                            style={inputStyle} />
                        </div>
                      </div>
                      {newFill.price_per_liter && newFill.liters && (
                        <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(52,211,153,.08)', border: '1px solid rgba(52,211,153,.2)', fontSize: '14px', fontWeight: 700, color: '#34d399', textAlign: 'center' }}>
                          Total : {(parseFloat(newFill.price_per_liter) * parseFloat(newFill.liters)).toFixed(2)}€
                        </div>
                      )}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ ...labelStyle, marginBottom: '4px' }}>Km avant (optionnel)</label>
                          <input type="number" placeholder="45000"
                            value={newFill.km_before}
                            onChange={e => setNewFill(p => ({ ...p, km_before: e.target.value }))}
                            style={inputStyle} />
                        </div>
                        <div>
                          <label style={{ ...labelStyle, marginBottom: '4px' }}>Km après (optionnel)</label>
                          <input type="number" placeholder="45500"
                            value={newFill.km_after}
                            onChange={e => setNewFill(p => ({ ...p, km_after: e.target.value }))}
                            style={inputStyle} />
                        </div>
                      </div>
                      <div>
                        <label style={{ ...labelStyle, marginBottom: '4px' }}>Notes (optionnel)</label>
                        <input type="text" placeholder="Ex : Autoroute, full tank..."
                          value={newFill.notes}
                          onChange={e => setNewFill(p => ({ ...p, notes: e.target.value }))}
                          style={inputStyle} />
                      </div>
                      <button onClick={addFillUp} disabled={addingFill || !newFill.price_per_liter || !newFill.liters} style={btnPrimary}>
                        {addingFill ? 'Ajout…' : '✅ Valider le plein'}
                      </button>
                    </div>
                  </div>
                )}

                {fillUps.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px', color: '#475569' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>⛽</div>
                    <div style={{ fontWeight: 600 }}>Aucun plein enregistré</div>
                    <div style={{ fontSize: '13px', marginTop: '4px' }}>Enregistre ton premier plein ci-dessus !</div>
                  </div>
                ) : (
                  fillUps.map(f => (
                    <div key={f.id} style={{ ...cardStyle, padding: '14px', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 800, fontSize: '15px', color: '#f1f5f9' }}>
                              {f.total_cost.toFixed(2)}€
                            </span>
                            <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(168,85,247,.15)', color: '#c084fc', fontWeight: 700 }}>
                              {f.fuel_type}
                            </span>
                          </div>
                          <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                            {f.liters}L · {f.price_per_liter.toFixed(3)}€/L
                            {f.station_name && <> · {f.station_name}</>}
                          </div>
                          {f.km_before && f.km_after && (
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                              📍 {f.km_before} → {f.km_after} km
                              {vehicle.consommation && (
                                <> · ~{((f.liters / (f.km_after - f.km_before)) * 100).toFixed(1)}L/100km</>
                              )}
                            </div>
                          )}
                          <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>{formatDate(f.created_at)}</div>
                          {f.notes && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', fontStyle: 'italic' }}>{f.notes}</div>}
                        </div>
                        <button onClick={() => deleteFillUp(f.id)} style={{
                          background: 'none', border: 'none', color: '#475569',
                          cursor: 'pointer', fontSize: '16px', padding: '4px', marginLeft: '8px',
                        }}>✕</button>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {/* ── TAB MAINTENANCE ─────────────────────────────────────── */}
            {tab === 'maintenance' && (
              <>
                <button onClick={() => setShowAddReminder(!showAddReminder)} style={{
                  ...btnPrimary, width: '100%', marginBottom: '12px',
                  background: showAddReminder ? 'rgba(168,85,247,.2)' : 'linear-gradient(135deg,#a855f7,#7c3aed)',
                  color: showAddReminder ? '#c084fc' : '#fff',
                  border: showAddReminder ? '1.5px solid rgba(168,85,247,.4)' : 'none',
                }}>
                  {showAddReminder ? '✕ Annuler' : '+ Ajouter un rappel'}
                </button>

                {showAddReminder && (
                  <div style={{ ...cardStyle, marginBottom: '12px' }}>
                    <span style={labelStyle}>Nouveau rappel d'entretien</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div>
                        <label style={{ ...labelStyle, marginBottom: '4px' }}>Type</label>
                        <select value={newReminder.type}
                          onChange={e => {
                            const t = MAINTENANCE_TYPES.find(x => x.id === e.target.value)
                            setNewReminder(p => ({ ...p, type: e.target.value, label: t?.label ?? e.target.value }))
                          }}
                          style={{ ...inputStyle, cursor: 'pointer' }}>
                          {MAINTENANCE_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                        </select>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ ...labelStyle, marginBottom: '4px' }}>Km actuel</label>
                          <input type="number" placeholder="Ex : 45000"
                            value={newReminder.current_km}
                            onChange={e => setNewReminder(p => ({ ...p, current_km: e.target.value }))}
                            style={inputStyle} />
                        </div>
                        <div>
                          <label style={{ ...labelStyle, marginBottom: '4px' }}>Prochain à (km)</label>
                          <input type="number" placeholder="Ex : 50000"
                            value={newReminder.due_km}
                            onChange={e => setNewReminder(p => ({ ...p, due_km: e.target.value }))}
                            style={inputStyle} />
                        </div>
                      </div>
                      <div>
                        <label style={{ ...labelStyle, marginBottom: '4px' }}>Ou date limite</label>
                        <input type="date"
                          value={newReminder.due_date}
                          onChange={e => setNewReminder(p => ({ ...p, due_date: e.target.value }))}
                          style={{ ...inputStyle, colorScheme: 'dark' }} />
                      </div>
                      <button onClick={addReminder} disabled={addingReminder} style={btnPrimary}>
                        {addingReminder ? 'Ajout…' : '✅ Ajouter le rappel'}
                      </button>
                    </div>
                  </div>
                )}

                {reminders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px', color: '#475569' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔧</div>
                    <div style={{ fontWeight: 600 }}>Aucun rappel d'entretien</div>
                    <div style={{ fontSize: '13px', marginTop: '4px' }}>Ajoute un rappel pour ne rien oublier !</div>
                  </div>
                ) : (
                  reminders.map(r => {
                    const isUrgent = !r.done && r.due_date && new Date(r.due_date) < new Date(Date.now() + 7 * 24 * 3600000)
                    const isOverdue = !r.done && r.due_date && new Date(r.due_date) < new Date()
                    return (
                      <div key={r.id} style={{
                        ...cardStyle, padding: '14px', marginBottom: '8px',
                        borderColor: r.done ? 'rgba(52,211,153,.2)' : isOverdue ? 'rgba(239,68,68,.4)' : isUrgent ? 'rgba(245,158,11,.4)' : 'rgba(139,92,246,.25)',
                        opacity: r.done ? 0.6 : 1,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                          <button onClick={() => toggleReminderDone(r.id, r.done)} style={{
                            width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                            border: `2px solid ${r.done ? '#34d399' : 'rgba(168,85,247,.4)'}`,
                            background: r.done ? 'rgba(52,211,153,.2)' : 'transparent',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '12px', color: '#34d399',
                          }}>
                            {r.done ? '✓' : ''}
                          </button>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: '15px', color: r.done ? '#64748b' : '#f1f5f9', textDecoration: r.done ? 'line-through' : 'none' }}>
                              {r.label}
                            </div>
                            {r.current_km && r.due_km && (
                              <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
                                {r.current_km.toLocaleString()} km → {r.due_km.toLocaleString()} km
                                <span style={{ marginLeft: '6px', color: isOverdue ? '#f87171' : '#64748b' }}>
                                  (encore {Math.max(0, r.due_km - r.current_km).toLocaleString()} km)
                                </span>
                              </div>
                            )}
                            {r.due_date && (
                              <div style={{ fontSize: '12px', color: isOverdue ? '#f87171' : isUrgent ? '#fbbf24' : '#64748b', marginTop: '2px', fontWeight: isUrgent || isOverdue ? 700 : 400 }}>
                                {isOverdue ? '⚠️ En retard · ' : isUrgent ? '⏰ Bientôt · ' : '📅 '}{new Date(r.due_date).toLocaleDateString('fr-FR')}
                              </div>
                            )}
                          </div>
                          <button onClick={() => deleteReminder(r.id)} style={{
                            background: 'none', border: 'none', color: '#475569',
                            cursor: 'pointer', fontSize: '16px', padding: '2px',
                          }}>✕</button>
                        </div>
                      </div>
                    )
                  })
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
