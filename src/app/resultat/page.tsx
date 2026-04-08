'use client'
import { useEffect, useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import WolfChat from '@/components/WolfChat'
import type { MapFuelStation, MapEVStation } from '@/components/StationMap'

const StationMap = dynamic(() => import('@/components/StationMap'), { ssr: false })

// ── Config carburants ───────────────────────────────────────────────────────
const FC: Record<string, { l: string; c: string; f: string; m: string }> = {
  Gazole: { l: 'Gazole',    c: '#ffc20e', f: 'gazole_prix', m: 'gazole_maj' },
  SP95:   { l: 'SP95',      c: '#009d3e', f: 'sp95_prix',   m: 'sp95_maj'  },
  SP98:   { l: 'SP98',      c: '#d61e3e', f: 'sp98_prix',   m: 'sp98_maj'  },
  E10:    { l: 'SP95-E10',  c: '#009d3e', f: 'e10_prix',    m: 'e10_maj'   },
  E85:    { l: 'E85',       c: '#e6a800', f: 'e85_prix',    m: 'e85_maj'   },
  GPLc:   { l: 'GPLc',      c: '#00a3e0', f: 'gplc_prix',   m: 'gplc_maj' },
}

// ── Types ───────────────────────────────────────────────────────────────────
interface Station {
  id: string; addr: string; city: string; cp: string
  lat: number; lon: number; dist: number
  is24h: boolean; price: number | null; updated: string | null
  hasPenurie: boolean
}

interface EVStation {
  id: string; name: string; addr: string; city: string
  lat: number; lon: number; dist: number
  prises: { label: string; color: string }[]
  puissance: number | null; puissanceEstimee: boolean
  speedCat: 'rapide' | 'semi' | 'lente' | 'inconnu'
  nbrePDC: number; is24h: boolean; operateur: string
}

// ── Utils ───────────────────────────────────────────────────────────────────
function hav(a: number, b: number, c: number, d: number) {
  const R = 6371, x = (c - a) * Math.PI / 180, y = (d - b) * Math.PI / 180
  const z = Math.sin(x / 2) ** 2 + Math.cos(a * Math.PI / 180) * Math.cos(c * Math.PI / 180) * Math.sin(y / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(z), Math.sqrt(1 - z))
}
function fp(p: number | null) { return p != null ? p.toFixed(3) + ' €' : '—' }
function fDate(d: string | null) {
  if (!d) return ''
  const dt = new Date(d)
  return 'Modifié le ' + dt.getDate() + '/' + String(dt.getMonth() + 1).padStart(2, '0') + ' à ' + dt.getHours() + 'h' + String(dt.getMinutes()).padStart(2, '0')
}
function getSpeedLabel(p: number | null, est: boolean): { label: string; color: string; icon: string } {
  if (!p) return { label: 'Inconnu', color: '#64748b', icon: '🔌' }
  const pre = est ? '~' : ''
  if (p >= 150) return { label: `Ultra-rapide ${pre}${p}kW`, color: '#dc2626', icon: '⚡⚡⚡' }
  if (p >= 50)  return { label: `Rapide ${pre}${p}kW`,       color: '#f59e0b', icon: '⚡⚡' }
  if (p >= 22)  return { label: `Semi-rapide ${pre}${p}kW`,  color: '#06b6d4', icon: '⚡' }
  return              { label: `Normale ${pre}${p}kW`,        color: '#22d3ee', icon: '🔌' }
}

const PRISE_COMPAT: Record<string, string[]> = {
  'Type 2':    ['Renault', 'Peugeot', 'Citroën', 'VW', 'BMW', 'Audi', 'Mercedes', 'Hyundai', 'Kia', 'Volvo', 'Dacia', 'Tesla*'],
  'CCS Combo': ['BMW', 'VW', 'Audi', 'Porsche', 'Hyundai', 'Kia', 'Mercedes', 'Ford', 'Volvo', 'Renault (récent)'],
  'CHAdeMO':   ['Nissan Leaf', 'Mitsubishi', 'Kia Soul (ancien)', 'Lexus'],
  'Tesla':     ['Tesla Model S', 'Model 3', 'Model X', 'Model Y'],
  'NACS':      ['Tesla', 'Ford (2024+)', 'GM / Chevrolet (2024+)'],
  'Type 1':    ['Nissan Leaf (ancien)', 'Mitsubishi', 'Chevrolet Volt'],
  'Borne':     [],
}

// ── IRVE — deux endpoints tentés en parallèle ─────────────────────────────
async function fetchIRVE(lat: number, lon: number, rad: number): Promise<Record<string, unknown>[]> {
  const fields = 'id_station_itinerance,nom_station,adresse_station,consolidated_commune,code_postal,coordonneesXY,puissance_nominale,prise_type_2,prise_type_combo_ccs,prise_type_chademo,prise_type_autre,nbre_pdc,horaires,operateur'
  const mkUrl = (base: string, geoField: string) => {
    const where = `within_distance(${geoField}, geom'POINT(${lon} ${lat})', ${rad}km)`
    return `${base}?select=${encodeURIComponent(fields)}&where=${encodeURIComponent(where)}&limit=100`
  }
  const urls = [
    mkUrl('https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/bornes-irve/records', 'coordonneesXY'),
    mkUrl('https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/bornes-irve/records', 'geo_point_2d'),
  ]
  const data = await Promise.any(
    urls.map(url =>
      fetch(url, { signal: AbortSignal.timeout(12000) })
        .then(r => { if (!r.ok) throw new Error('IRVE ' + r.status); return r.json() })
        .then(d => { if (!Array.isArray(d.results) || d.results.length === 0) throw new Error('empty'); return d.results as Record<string, unknown>[] })
    )
  )
  return data
}

// ── Overpass (fallback OSM) — 4 serveurs en parallèle, timeout généreux ───
const OVERPASS_SERVERS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter',
]
async function fetchOverpass(lat: number, lon: number, rad: number): Promise<{ elements: Record<string, unknown>[] }> {
  const radM  = Math.round(rad * 1000)
  const query = `[out:json][timeout:30];node["amenity"="charging_station"](around:${radM},${lat},${lon});out body qt 200;`
  try {
    return await Promise.any(
      OVERPASS_SERVERS.map(srv =>
        fetch(srv + '?data=' + encodeURIComponent(query), { signal: AbortSignal.timeout(22000) })
          .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json() as Promise<{ elements: Record<string, unknown>[] }> })
      )
    )
  } catch {
    throw new Error('Serveurs indisponibles. Réessayez dans quelques instants.')
  }
}

// ── Composant principal ─────────────────────────────────────────────────────
function ResultatContent() {
  const router = useRouter()
  const params = useSearchParams()

  const lat  = parseFloat(params.get('lat')  ?? '0')
  const lon  = parseFloat(params.get('lon')  ?? '0')
  const name = params.get('name') ?? ''
  const fuel = params.get('fuel') ?? 'Gazole'
  const isEV = fuel === 'EV'
  const fc   = FC[fuel]

  const [stations,   setStations]   = useState<Station[]>([])
  const [evStations, setEvStations] = useState<EVStation[]>([])
  const [sort,       setSort]       = useState<'price' | 'distance'>('price')
  const [evFilter,   setEvFilter]   = useState<'all' | 'rapide' | 'semi' | 'lente'>('all')
  const [status,     setStatus]     = useState<'loading' | 'error' | 'empty' | 'ok'>('loading')
  const [errorMsg,   setErrorMsg]   = useState('')
  const [showMap,    setShowMap]    = useState(false)
  const [reportingId, setReportingId] = useState<string | null>(null)
  const [reportPrice, setReportPrice] = useState('')
  const [reportMsg,   setReportMsg]   = useState('')
  const [currentUserId, setCurrentUserId] = useState('')
  const [isPro,       setIsPro]       = useState(false)
  const [favorites,   setFavorites]   = useState<Set<string>>(new Set())

  // ── Fetch carburant ───────────────────────────────────────────────────────
  const loadFuel = useCallback(async () => {
    setStatus('loading')
    try {
      const fields = `id,adresse,ville,cp,geom,horaires_automate_24_24,services_service,carburants_disponibles,${fc.f},${fc.m}`
      const where  = `within_distance(geom, geom'POINT(${lon} ${lat})', 20km)`
      const url    = `https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records?select=${encodeURIComponent(fields)}&where=${encodeURIComponent(where)}&limit=50`
      const res  = await fetch(url)
      if (!res.ok) throw new Error('Erreur ' + res.status)
      const data = await res.json()
      const list: Station[] = (data.results ?? []).map((r: Record<string, unknown>) => {
        const geom = r.geom as { lat?: number; lon?: number } | null
        const rlat = geom?.lat ?? 0, rlon = geom?.lon ?? 0
        const price = r[fc.f] != null ? parseFloat(r[fc.f] as string) : null
        const dispo = Array.isArray(r.carburants_disponibles) ? r.carburants_disponibles as string[] : []
        const fuelInDispo = dispo.some(x => x && (x === fuel || x.toLowerCase().includes(fuel.toLowerCase())))
        return {
          id: String(r.id ?? ''), addr: String(r.adresse ?? ''), city: String(r.ville ?? ''),
          cp: String(r.cp ?? ''), lat: rlat, lon: rlon,
          dist: hav(lat, lon, rlat, rlon),
          is24h: r.horaires_automate_24_24 === 'Oui',
          price, updated: r[fc.m] ? String(r[fc.m]) : null,
          hasPenurie: fuelInDispo && price == null,
        }
      })
      if (!list.length) { setStatus('empty'); return }
      setStations(list); setStatus('ok')
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Erreur inconnue')
      setStatus('error')
    }
  }, [lat, lon, fuel, fc])

  // ── Fetch EV ─────────────────────────────────────────────────────────────
  const loadEV = useCallback(async () => {
    setStatus('loading')
    try {
      let list: EVStation[] = []

      // 1️⃣ IRVE — API officielle française (rapide, adresses complètes)
      try {
        const rows = await fetchIRVE(lat, lon, 20)
        list = rows.map(r => {
          const geom = r.coordonneesXY as { lat?: number; lon?: number } | null
          const sLat = geom?.lat ?? 0, sLon = geom?.lon ?? 0
          const prises: { label: string; color: string }[] = []
          if ((r.prise_type_2 as number) > 0)         prises.push({ label: 'Type 2',    color: '#06b6d4' })
          if ((r.prise_type_combo_ccs as number) > 0) prises.push({ label: 'CCS Combo', color: '#8b5cf6' })
          if ((r.prise_type_chademo as number) > 0)   prises.push({ label: 'CHAdeMO',   color: '#f59e0b' })
          if ((r.prise_type_autre as number) > 0 && !prises.length) prises.push({ label: 'Borne', color: '#64748b' })
          if (!prises.length) prises.push({ label: 'Borne', color: '#64748b' })
          const puissance = r.puissance_nominale != null ? parseFloat(String(r.puissance_nominale)) : null
          const speedCat: EVStation['speedCat'] = !puissance ? 'inconnu' : puissance >= 50 ? 'rapide' : puissance >= 22 ? 'semi' : 'lente'
          return {
            id: String(r.id_station_itinerance ?? Math.random()),
            name: String(r.nom_station || r.operateur || 'Borne de recharge'),
            addr: String(r.adresse_station ?? ''),
            city: String(r.consolidated_commune ?? ''),
            lat: sLat, lon: sLon, dist: hav(lat, lon, sLat, sLon),
            prises, puissance, puissanceEstimee: false, speedCat,
            nbrePDC: parseInt(String(r.nbre_pdc ?? '0')) || 1,
            is24h: String(r.horaires ?? '').includes('24/7'),
            operateur: String(r.operateur ?? ''),
          }
        })
      } catch {
        // 2️⃣ Fallback Overpass (4 serveurs en parallèle, timeout 22s)
        const data = await fetchOverpass(lat, lon, 20)
        list = (data.elements ?? []).map(r => {
          const t = (r.tags ?? {}) as Record<string, string>
          const sLat = parseFloat(String(r.lat ?? 0)), sLon = parseFloat(String(r.lon ?? 0))
          const prises: { label: string; color: string }[] = []
          if (t['socket:type2'] || t['socket:type2_cable']) prises.push({ label: 'Type 2',    color: '#06b6d4' })
          if (t['socket:ccs']   || t['socket:type2_combo']) prises.push({ label: 'CCS Combo', color: '#8b5cf6' })
          if (t['socket:chademo'])                          prises.push({ label: 'CHAdeMO',   color: '#f59e0b' })
          if (t['socket:type1'])                            prises.push({ label: 'Type 1',    color: '#22d3ee' })
          if (t['socket:tesla_supercharger'] || t['socket:tesla_destination']) prises.push({ label: 'Tesla', color: '#ef4444' })
          if (!prises.length) prises.push({ label: 'Borne', color: '#64748b' })
          let puissance: number | null = null, puissanceEstimee = false
          for (const f of ['maxpower','socket:type2:output','socket:ccs:output','socket:chademo:output']) {
            if (t[f]) { const m = t[f].match(/([\d.]+)/); if (m) { puissance = parseFloat(m[1]); break } }
          }
          if (!puissance) {
            const op = (t.operator || t.brand || '').toLowerCase()
            if (op.includes('ionity'))    { puissance = 350; puissanceEstimee = true }
            else if (op.includes('fastned')) { puissance = 300; puissanceEstimee = true }
            else if (t['socket:ccs'])     { puissance = 50;  puissanceEstimee = true }
            else if (t['socket:type2'])   { puissance = 22;  puissanceEstimee = true }
            else if (t['socket:type1'])   { puissance = 7;   puissanceEstimee = true }
          }
          const speedCat: EVStation['speedCat'] = !puissance ? 'inconnu' : puissance >= 50 ? 'rapide' : puissance >= 22 ? 'semi' : 'lente'
          const nbSockets = Object.keys(t).filter(k => k.startsWith('socket:') && !k.includes(':', 7)).length
          return {
            id: String(r.id ?? ''),
            name: t.name || t.operator || t.brand || 'Borne de recharge',
            addr: t['addr:street'] ? ((t['addr:housenumber'] ?? '') + ' ' + t['addr:street']).trim() : '',
            city: t['addr:city'] || t['addr:municipality'] || '',
            lat: sLat, lon: sLon, dist: hav(lat, lon, sLat, sLon),
            prises, puissance, puissanceEstimee, speedCat,
            nbrePDC: parseInt(t.capacity ?? '0') || nbSockets || 1,
            is24h: t.opening_hours === '24/7',
            operateur: t.operator || t.brand || '',
          }
        })
      }

      const sorted = list
        .filter(s => s.lat && s.lon)
        .filter(s => !(s.name === 'Borne de recharge' && s.prises.length === 1 && s.prises[0].label === 'Borne'))
        .sort((a, b) => a.dist - b.dist)
      if (!sorted.length) { setStatus('empty'); return }
      setEvStations(sorted); setStatus('ok')
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Erreur inconnue')
      setStatus('error')
    }
  }, [lat, lon])

  useEffect(() => {
    if (!lat || !lon) { router.push('/'); return }
    if (isEV) loadEV()
    else loadFuel()
    // Récupérer l'userId, statut Pro et favoris
    import('@/lib/supabase').then(({ supabase }) => {
      supabase.auth.getSession().then(async ({ data }) => {
        const user = data.session?.user
        if (!user) return
        setCurrentUserId(user.id)
        const cached = localStorage.getItem(`wolf_pro_${user.id}`) === '1'
        if (cached) setIsPro(true)
        const { data: profile } = await supabase.from('profiles').select('is_pro').eq('id', user.id).single()
        if (profile?.is_pro) { setIsPro(true); localStorage.setItem(`wolf_pro_${user.id}`, '1') }
        const saved: string[] = JSON.parse(localStorage.getItem('wolf_favorites') ?? '[]')
        setFavorites(new Set(saved))
      })
    })
  }, [lat, lon, isEV, loadFuel, loadEV, router])

  const submitReport = async (s: Station, reportedPrice: number) => {
    if (!currentUserId) return
    const res = await fetch('/api/community-reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUserId,
        stationId: s.id,
        stationName: s.city,
        fuelType: fuel,
        reportedPrice,
        officialPrice: s.price,
      }),
    })
    const data = await res.json()
    if (data.error) { setReportMsg('⚠️ ' + data.error) }
    else { setReportMsg('✅ Signalement envoyé, merci !') }
    setTimeout(() => { setReportingId(null); setReportMsg(''); setReportPrice('') }, 2500)
  }

  function stationKey(addr: string, city: string, cp: string) {
    return btoa(unescape(encodeURIComponent((city + addr + cp).slice(0, 60)))).slice(0, 40)
  }

  async function toggleFavorite(s: Station) {
    if (!currentUserId || !isPro) return
    const sid = stationKey(s.addr, s.city, s.cp)
    const isSaved = favorites.has(sid)
    const next = new Set(favorites)
    if (isSaved) {
      await fetch('/api/favorites', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: currentUserId, stationId: sid }) }).catch(() => {})
      next.delete(sid)
    } else {
      await fetch('/api/favorites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: currentUserId, stationId: sid, stationName: s.city, stationAddress: [s.addr, s.cp, s.city].filter(Boolean).join(', '), lastPrice: s.price }) }).catch(() => {})
      next.add(sid)
    }
    setFavorites(next)
    localStorage.setItem('wolf_favorites', JSON.stringify([...next]))
  }

  // ── GPS précis ────────────────────────────────────────────────────────────
  const [gpsLat, setGpsLat] = useState<number | null>(null)
  const [gpsLon, setGpsLon] = useState<number | null>(null)
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')

  function requestGps() {
    if (!navigator.geolocation) { setGpsStatus('error'); return }
    setGpsStatus('loading')
    navigator.geolocation.getCurrentPosition(
      pos => { setGpsLat(pos.coords.latitude); setGpsLon(pos.coords.longitude); setGpsStatus('ok') },
      ()  => setGpsStatus('error'),
      { enableHighAccuracy: true, timeout: 15000 }
    )
  }

  // ── Données filtrées ──────────────────────────────────────────────────────
  const dLat = gpsLat ?? lat, dLon = gpsLon ?? lon
  const withPrice = stations.filter(s => s.price != null && !s.hasPenurie)
  const penuries  = stations.filter(s => s.hasPenurie)
  const withPriceDist = withPrice.map(s => ({ ...s, dist: hav(dLat, dLon, s.lat, s.lon) }))
  const sorted    = [...withPriceDist].sort((a, b) => sort === 'price' ? (a.price ?? 0) - (b.price ?? 0) : a.dist - b.dist)
  const best      = sorted[0] ?? null

  const evFiltered = evFilter === 'all' ? evStations : evStations.filter(s => s.speedCat === evFilter)
  const totalPDC   = evFiltered.reduce((a, s) => a + s.nbrePDC, 0)

  const gS = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`
  const wS = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>`

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div className="rh">
        <div className="rh-inner">
          <div className="rh-left">
            <img src="/wolf-logo.png" alt="WolfFuel" className="wolf-sm-img" />
            <div>
              <div className="rh-title">{isEV ? '⚡ Bornes électriques' : (fc?.l ?? fuel)} — {name}</div>
              <div className="rh-sub">Rayon 20 km · distances depuis {gpsStatus === 'ok' ? 'votre position GPS' : name}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="rh-badge" style={isEV ? { background: '#06b6d422', color: '#06b6d4' } : { background: (fc?.c ?? '#888') + '22', color: fc?.c ?? '#888' }}>
              {isEV ? '⚡ Électrique' : (fc?.l ?? fuel)}
            </span>
            <button className="back-btn" onClick={() => router.push('/')}>← Modifier</button>
          </div>
        </div>
      </div>

      {/* Sort / filtre */}
      {!isEV && (
        <div className="sort-tabs">
          <button className={'sort-tab' + (sort === 'price'    ? ' active' : '')} onClick={() => setSort('price')}>
            <span className="st-icon">🏷️</span>Moins cher
          </button>
          <button className={'sort-tab' + (sort === 'distance' ? ' active' : '')} onClick={() => setSort('distance')}>
            <span className="st-icon">📍</span>Plus proche
          </button>
        </div>
      )}
      {isEV && (
        <div className="sort-tabs" style={{ gap: 6 }}>
          {(['all', 'rapide', 'semi', 'lente'] as const).map(f => (
            <button key={f} className={'ev-sf' + (evFilter === f ? ' active' : '')} onClick={() => setEvFilter(f)}>
              {f === 'all' ? '⚡ Toutes' : f === 'rapide' ? '⚡⚡ Rapide (≥50kW)' : f === 'semi' ? '⚡ Semi (≥22kW)' : '🔌 Lente'}
            </button>
          ))}
        </div>
      )}

      {/* Boutons recherche complète + carte */}
      <div style={{ maxWidth: 750, margin: '12px auto 0', padding: '0 20px', display: 'flex', gap: 8 }}>
        <button
          onClick={() => router.push(`/recherche_complete?lat=${lat}&lon=${lon}&name=${encodeURIComponent(name)}&fuel=${encodeURIComponent(fuel)}`)}
          style={{ flex: 1, padding: '14px', borderRadius: 12, border: '1px solid rgba(168,85,247,.2)', background: 'rgba(168,85,247,.06)', color: '#c084fc', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}
        >
          🔄 Tous les carburants
        </button>
        {status === 'ok' && (
          <button
            onClick={() => setShowMap(v => !v)}
            style={{ padding: '14px 18px', borderRadius: 12, border: showMap ? '1px solid rgba(168,85,247,.6)' : '1px solid rgba(168,85,247,.2)', background: showMap ? 'rgba(168,85,247,.18)' : 'rgba(168,85,247,.06)', color: '#c084fc', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', whiteSpace: 'nowrap' }}
          >
            {showMap ? '📋 Liste' : '🗺️ Carte'}
          </button>
        )}
      </div>

      {/* Bannière GPS */}
      <div style={{ maxWidth: 750, margin: '12px auto 0', padding: '0 20px' }}>
        {gpsStatus !== 'ok' && (
          <div className="gps-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 16px', borderRadius: 12, background: 'rgba(168,85,247,.06)', border: '1px solid rgba(168,85,247,.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>📍</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>Distances plus précises ?</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Autorisez la localisation pour les km réels</div>
              </div>
            </div>
            <button
              onClick={requestGps}
              disabled={gpsStatus === 'loading'}
              style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#a855f7,#7c3aed)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              {gpsStatus === 'loading' ? 'Localisation...' : gpsStatus === 'error' ? '❌ Refusé' : 'Localiser'}
            </button>
          </div>
        )}
        {gpsStatus === 'ok' && (
          <div style={{ padding: '10px 16px', borderRadius: 12, background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.25)', color: '#34d399', fontSize: 13, fontWeight: 600 }}>
            ✅ Distances depuis votre position exacte
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="res-section">
        {status === 'loading' && (
          <div className="loading-box show">
            <div className="spinner" />
            <p style={{ color: '#94a3b8', fontSize: 14 }}>
              {isEV ? '⚡ Le loup cherche les bornes de recharge...' : '🐺 Le loup cherche les meilleurs prix...'}
            </p>
          </div>
        )}
        {status === 'error' && (
          <div className="error-box show">
            <p style={{ fontSize: 18, marginBottom: 8 }}>😔</p>
            <p style={{ fontWeight: 700, marginBottom: 4 }}>Erreur de chargement</p>
            <p style={{ fontSize: 13, opacity: .8 }}>❌ {errorMsg}</p>
            <button className="back-btn" style={{ marginTop: 16 }} onClick={() => isEV ? loadEV() : loadFuel()}>Réessayer</button>
          </div>
        )}
        {status === 'empty' && (
          <div className="empty-state show">
            <p style={{ fontSize: 40, marginBottom: 12 }}>{isEV ? '⚡' : '🐺'}</p>
            <p style={{ fontWeight: 700, fontSize: 16 }}>Aucun résultat trouvé</p>
            <p style={{ fontSize: 13, marginTop: 8 }}>
              {isEV ? 'Pas de borne de recharge dans un rayon de 20 km' : `Pas de ${fc?.l} dans un rayon de 20 km`}
            </p>
          </div>
        )}

        {/* Résultats carburant — vue carte */}
        {status === 'ok' && !isEV && showMap && (() => {
          const mapStations: MapFuelStation[] = sorted.map(s => ({
            kind: 'fuel' as const, id: s.id, lat: s.lat, lon: s.lon,
            city: s.city, addr: s.addr, cp: s.cp, dist: s.dist,
            price: s.price, updated: s.updated, is24h: s.is24h, hasPenurie: false,
            fuelLabel: fc?.l ?? fuel, fuelColor: fc?.c ?? '#888',
          }))
          return (
            <div style={{ height: '70vh', minHeight: 380, maxWidth: 750, margin: '12px auto 0', padding: '0 20px' }}>
              <StationMap
                stations={mapStations}
                userLat={dLat} userLon={dLon}
                bestId={best?.id}
              />
            </div>
          )
        })()}

        {/* Résultats carburant — vue liste */}
        {status === 'ok' && !isEV && !showMap && (
          <>
            <div className="res-count">
              {withPrice.length} station{withPrice.length > 1 ? 's' : ''} disponible{withPrice.length > 1 ? 's' : ''}
              {penuries.length > 0 && ` · ${penuries.length} en pénurie`}
            </div>
            <div className="res-list">
              {sorted.map((s, i) => {
                const isBest = i === 0 && s.price != null
                const gU = `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lon}`
                const wU = `https://waze.com/ul?ll=${s.lat}%2C${s.lon}&navigate=yes`
                return (
                  <div key={s.id + i} className={'card' + (isBest ? ' best' : '')} style={{ animationDelay: i * 30 + 'ms' }}>
                    <div className="card-top">
                      <div className="card-left">
                        <div className="rank-col">
                          <div className="rank">{i + 1}</div>
                          {s.is24h && <span className="tag-24">24h</span>}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          {isBest && <span className="tag-best">🏆 Meilleur prix</span>}
                          <div className="station-name">{s.city || 'Station'}</div>
                          <div className="station-addr">{[s.addr, s.cp, s.city].filter(Boolean).join(', ')}</div>
                        </div>
                      </div>
                      <div className="dist-badge">{s.dist.toFixed(1)} km</div>
                    </div>
                    <div className="price-highlight" style={{ color: fc?.c }}>{fp(s.price)}</div>
                    <div className="price-date">{fDate(s.updated)}</div>
                    <div className="nav-btns">
                      <a className="nav-btn nav-btn-gmaps" href={gU} target="_blank" rel="noopener noreferrer" dangerouslySetInnerHTML={{ __html: gS + ' Google Maps' }} />
                      <a className="nav-btn nav-btn-waze"  href={wU} target="_blank" rel="noopener noreferrer" dangerouslySetInnerHTML={{ __html: wS + ' Waze' }} />
                      {currentUserId && (
                        <button
                          onClick={() => { setReportingId(reportingId === s.id ? null : s.id); setReportPrice(''); setReportMsg('') }}
                          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(245,158,11,.3)', background: 'rgba(245,158,11,.06)', color: '#f59e0b', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}
                        >
                          ⚠️ Signaler
                        </button>
                      )}
                      {isPro && currentUserId && (() => {
                        const sid = stationKey(s.addr, s.city, s.cp)
                        const isSaved = favorites.has(sid)
                        return (
                          <button onClick={() => toggleFavorite(s)}
                            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(168,85,247,.3)', background: 'rgba(168,85,247,.06)', color: '#c084fc', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
                            {isSaved ? '❤️ Favori' : '🤍 Favori'}
                          </button>
                        )
                      })()}
                    </div>
                    {reportingId === s.id && (
                      <div style={{ marginTop: 10, padding: '12px', borderRadius: 10, background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.2)' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', marginBottom: 6 }}>
                          Signaler un prix incorrect pour {fc?.l}
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input
                            type="number" placeholder="Prix réel (ex: 1.782)" step="0.001"
                            value={reportPrice} onChange={e => setReportPrice(e.target.value)}
                            style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(245,158,11,.3)', background: 'rgba(245,158,11,.05)', color: '#f1f5f9', fontSize: 13, outline: 'none', fontFamily: 'DM Sans,sans-serif' }}
                          />
                          <button
                            onClick={() => reportPrice && submitReport(s, parseFloat(reportPrice))}
                            disabled={!reportPrice}
                            style={{ padding: '9px 14px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', whiteSpace: 'nowrap' }}
                          >
                            Envoyer
                          </button>
                        </div>
                        {reportMsg && <div style={{ fontSize: 12, marginTop: 6, fontWeight: 700, color: reportMsg.startsWith('✅') ? '#34d399' : '#f87171' }}>{reportMsg}</div>}
                      </div>
                    )}
                  </div>
                )
              })}
              {penuries.length > 0 && (
                <>
                  <div style={{ margin: '16px 0 8px', fontSize: 13, fontWeight: 800, color: '#f87171', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                    ⚠️ Stations en pénurie de {fc?.l}
                  </div>
                  {penuries.sort((a, b) => a.dist - b.dist).map((s, i) => (
                    <div key={'p' + s.id + i} className="card penurie">
                      <div className="card-top">
                        <div className="card-left">
                          <div className="rank-col"><div className="rank" style={{ background: 'rgba(239,68,68,.15)', color: '#f87171' }}>⚠️</div></div>
                          <div style={{ minWidth: 0 }}>
                            <span className="tag-penurie">PÉNURIE</span>
                            <div className="station-name">{s.city || 'Station'}</div>
                            <div className="station-addr">{[s.addr, s.cp, s.city].filter(Boolean).join(', ')}</div>
                          </div>
                        </div>
                        <div className="dist-badge">{s.dist.toFixed(1)} km</div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </>
        )}

        {/* Résultats EV — vue carte */}
        {status === 'ok' && isEV && showMap && (() => {
          const mapStations: MapEVStation[] = evFiltered.map(s => ({
            kind: 'ev' as const, id: s.id, lat: s.lat, lon: s.lon,
            name: s.name, city: s.city, addr: s.addr, dist: s.dist,
            prises: s.prises, puissance: s.puissance, nbrePDC: s.nbrePDC,
            is24h: s.is24h, operateur: s.operateur,
          }))
          return (
            <div style={{ height: '70vh', minHeight: 380, maxWidth: 750, margin: '12px auto 0', padding: '0 20px' }}>
              <StationMap stations={mapStations} userLat={dLat} userLon={dLon} />
            </div>
          )
        })()}

        {/* Résultats EV — vue liste */}
        {status === 'ok' && isEV && !showMap && (
          <>
            <div className="res-count">
              {evFiltered.length} borne{evFiltered.length > 1 ? 's' : ''} · {totalPDC} point{totalPDC > 1 ? 's' : ''} de charge
            </div>
            <div className="res-list">
              {evFiltered.map((s, i) => {
                const spd = getSpeedLabel(s.puissance, s.puissanceEstimee)
                const gU = `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lon}`
                const wU = `https://waze.com/ul?ll=${s.lat}%2C${s.lon}&navigate=yes`
                const hasType2 = s.prises.some(p => p.label === 'Type 2')
                const compatBrands = [...new Set(s.prises.flatMap(p => PRISE_COMPAT[p.label] ?? []))]
                return (
                  <div key={s.id + i} className="card" style={{ animationDelay: i * 20 + 'ms' }}>
                    <div className="card-top">
                      <div className="card-left">
                        <div className="rank-col">
                          <div className="rank" style={{ background: 'rgba(6,182,212,.2)', borderColor: 'rgba(6,182,212,.4)', color: '#06b6d4' }}>⚡</div>
                          {s.is24h && <span className="tag-24">24h</span>}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div className="station-name">{s.name}</div>
                          {([s.addr, s.city].filter(Boolean).join(', ') || s.operateur) && (
                            <div className="station-addr">{[s.addr, s.city].filter(Boolean).join(', ') || s.operateur}</div>
                          )}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                            {s.prises.map((p, j) => (
                              <span key={j} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 6, background: p.color + '22', border: '1px solid ' + p.color + '55', color: p.color, fontWeight: 700 }}>{p.label}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="dist-badge">{s.dist.toFixed(1)} km</div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: spd.color }}>{spd.icon} {spd.label}</span>
                      <span style={{ fontSize: 12, color: '#64748b' }}>· {s.nbrePDC} point{s.nbrePDC > 1 ? 's' : ''} de charge</span>
                    </div>
                    {hasType2 ? (
                      <div style={{ marginTop: 7, fontSize: 11, color: '#34d399', fontWeight: 600 }}>
                        ✅ Compatible avec tous les véhicules électriques
                      </div>
                    ) : compatBrands.length > 0 ? (
                      <div style={{ marginTop: 7, fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>
                        <span style={{ color: '#64748b', fontWeight: 700 }}>🚗 Compatible : </span>
                        {compatBrands.slice(0, 6).join(' · ')}
                        {compatBrands.length > 6 && <span style={{ color: '#64748b' }}> · …</span>}
                      </div>
                    ) : null}
                    <div className="nav-btns" style={{ marginTop: 10 }}>
                      <a className="nav-btn nav-btn-gmaps" href={gU} target="_blank" rel="noopener noreferrer" dangerouslySetInnerHTML={{ __html: gS + ' Google Maps' }} />
                      <a className="nav-btn nav-btn-waze"  href={wU} target="_blank" rel="noopener noreferrer" dangerouslySetInnerHTML={{ __html: wS + ' Waze' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {status === 'ok' && <div style={{ paddingBottom: 80 }} />}
      </div>
      <WolfChat />
    </div>
  )
}

export default function ResultatPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading-box show">
          <div className="spinner" />
          <p style={{ color: '#94a3b8', fontSize: 14 }}>🐺 Chargement...</p>
        </div>
      </div>
    }>
      <ResultatContent />
    </Suspense>
  )
}
