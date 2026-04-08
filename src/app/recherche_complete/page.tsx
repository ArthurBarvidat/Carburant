'use client'
import { useEffect, useState, useCallback, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import WolfChat from '@/components/WolfChat'
import type { MapFuelStation } from '@/components/StationMap'
import { supabase } from '@/lib/supabase'

const StationMap = dynamic(() => import('@/components/StationMap'), { ssr: false })

const FC: Record<string, { l: string; c: string; f: string; m: string }> = {
  Gazole: { l: 'Gazole',   c: '#ffc20e', f: 'gazole_prix', m: 'gazole_maj' },
  SP95:   { l: 'SP95',     c: '#009d3e', f: 'sp95_prix',   m: 'sp95_maj'  },
  SP98:   { l: 'SP98',     c: '#d61e3e', f: 'sp98_prix',   m: 'sp98_maj'  },
  E10:    { l: 'SP95-E10', c: '#009d3e', f: 'e10_prix',    m: 'e10_maj'   },
  E85:    { l: 'E85',      c: '#e6a800', f: 'e85_prix',    m: 'e85_maj'   },
  GPLc:   { l: 'GPLc',     c: '#00a3e0', f: 'gplc_prix',   m: 'gplc_maj' },
}
const ALL_FUELS = ['Gazole', 'SP95', 'SP98', 'E10', 'E85', 'GPLc']
const ALL_FUELS_SELECT = [...ALL_FUELS, 'EV']
const RADII = [5, 10, 15, 20, 25, 30, 40, 50]

// Marques de voitures compatibles par type de prise
const PRISE_COMPAT: Record<string, string[]> = {
  'Type 2':    ['Renault', 'Peugeot', 'Citroën', 'VW', 'BMW', 'Audi', 'Mercedes', 'Hyundai', 'Kia', 'Volvo', 'Dacia', 'Tesla*'],
  'CCS Combo': ['BMW', 'VW', 'Audi', 'Porsche', 'Hyundai', 'Kia', 'Mercedes', 'Ford', 'Volvo', 'Renault (récent)', 'Peugeot (récent)'],
  'CHAdeMO':   ['Nissan Leaf', 'Mitsubishi', 'Kia Soul (ancien)', 'Lexus'],
  'Tesla':     ['Tesla Model S', 'Model 3', 'Model X', 'Model Y'],
  'NACS':      ['Tesla', 'Ford (2024+)', 'GM / Chevrolet (2024+)', 'Rivian (2024+)'],
  'Type 1':    ['Nissan Leaf (ancien)', 'Mitsubishi', 'Chevrolet Volt'],
  'Borne':     [],
}

// ── IRVE — deux endpoints tentés en parallèle ─────────────────────────────
async function fetchIRVE(lat: number, lon: number, rad: number): Promise<Record<string, unknown>[]> {
  const fields = 'id_station_itinerance,nom_station,adresse_station,consolidated_commune,code_postal,coordonneesXY,puissance_nominale,prise_type_2,prise_type_combo_ccs,prise_type_chademo,prise_type_autre,nbre_pdc,horaires,operateur'
  const mkUrl = (base: string, geoField: string) => {
    const where = `within_distance(${geoField}, geom'POINT(${lon} ${lat})', ${rad}km)`
    return `${base}?select=${encodeURIComponent(fields)}&where=${encodeURIComponent(where)}&limit=150`
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

function parsePower(val: string): number | null {
  if (!val) return null
  const mKW = val.match(/([\d.]+)\s*kW/i)
  if (mKW) return parseFloat(mKW[1])
  const mW = val.match(/([\d.]+)\s*W/i)
  if (mW) return parseFloat(mW[1]) / 1000
  const mNum = val.match(/([\d.]+)/)
  if (mNum) { const v = parseFloat(mNum[1]); return v > 1000 ? v / 1000 : v }
  return null
}

function getSpeedLabel(p: number | null, est: boolean): { label: string; color: string; icon: string } {
  if (!p) return { label: 'Inconnu', color: '#64748b', icon: '🔌' }
  const pre = est ? '~' : ''
  if (p >= 150) return { label: `Ultra-rapide ${pre}${p}kW`, color: '#dc2626', icon: '⚡⚡⚡' }
  if (p >= 50)  return { label: `Rapide ${pre}${p}kW`,       color: '#f59e0b', icon: '⚡⚡' }
  if (p >= 22)  return { label: `Semi-rapide ${pre}${p}kW`,  color: '#06b6d4', icon: '⚡' }
  return              { label: `Normale ${pre}${p}kW`,        color: '#22d3ee', icon: '🔌' }
}

interface Station {
  id: string; name: string; addr: string; city: string; cp: string
  lat: number; lon: number; dist: number
  is24h: boolean; cb: boolean
  prices: Record<string, { price: number | null; updated: string | null }>
}

interface EVStation {
  id: string; name: string; addr: string; city: string; cp: string
  lat: number; lon: number; dist: number
  prises: { label: string; color: string }[]
  puissance: number | null; puissanceEstimee: boolean
  speedCat: 'rapide' | 'semi' | 'lente' | 'inconnu'
  nbrePDC: number; is24h: boolean; operateur: string
}

function hav(a: number, b: number, c: number, d: number) {
  const R = 6371, x = (c - a) * Math.PI / 180, y = (d - b) * Math.PI / 180
  const z = Math.sin(x / 2) ** 2 + Math.cos(a * Math.PI / 180) * Math.cos(c * Math.PI / 180) * Math.sin(y / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(z), Math.sqrt(1 - z))
}
function fp(p: number | null) { return p != null ? p.toFixed(3) + ' €' : null }
function fDate(d: string | null) {
  if (!d) return ''
  const dt = new Date(d)
  return 'Modifié le ' + dt.getDate() + '/' + String(dt.getMonth() + 1).padStart(2, '0') + ' à ' + dt.getHours() + 'h' + String(dt.getMinutes()).padStart(2, '0')
}

// Reverse geocode via api-adresse.data.gouv.fr pour remplir les adresses manquantes
async function reverseGeocode(lat: number, lon: number): Promise<{ addr: string; city: string; cp: string }> {
  try {
    const r = await fetch(`https://api-adresse.data.gouv.fr/reverse/?lat=${lat}&lon=${lon}`, { signal: AbortSignal.timeout(4000) })
    const d = await r.json()
    const p = d.features?.[0]?.properties
    if (!p) return { addr: '', city: '', cp: '' }
    const street = [p.housenumber, p.street].filter(Boolean).join(' ')
    return { addr: street || p.name || '', city: p.city || p.municipality || '', cp: p.postcode || '' }
  } catch { return { addr: '', city: '', cp: '' } }
}

function RechercheContent() {
  const router = useRouter()
  const params = useSearchParams()

  const initLat  = parseFloat(params.get('lat')  ?? '0')
  const initLon  = parseFloat(params.get('lon')  ?? '0')
  const initName = params.get('name') ?? ''
  const initFuel = params.get('fuel') ?? 'Gazole'

  const [searchLat,  setSearchLat]  = useState(initLat)
  const [searchLon,  setSearchLon]  = useState(initLon)
  const [cityInput,  setCityInput]  = useState(initName)
  const [fuel,       setFuel]       = useState(initFuel === 'EV' ? 'EV' : initFuel)
  const [sortBy,     setSortBy]     = useState<'distance' | 'price'>('distance')
  const [evFilter,   setEvFilter]   = useState<'all' | 'rapide' | 'semi' | 'lente'>('all')
  const [radius,     setRadius]     = useState(10)
  const [stations,   setStations]   = useState<Station[]>([])
  const [evStations, setEvStations] = useState<EVStation[]>([])
  const [status,     setStatus]     = useState<'idle' | 'loading' | 'error' | 'ok'>('idle')
  const [errorMsg,   setErrorMsg]   = useState('')
  const [showMap,    setShowMap]    = useState(false)
  const [gpsStatus,  setGpsStatus]  = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [gpsLat,     setGpsLat]     = useState<number | null>(null)
  const [gpsLon,     setGpsLon]     = useState<number | null>(null)
  const [suggestions, setSuggestions] = useState<{ label: string; lat: number; lon: number }[]>([])
  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [userId,     setUserId]     = useState('')
  const [isPro,      setIsPro]      = useState(false)
  const [favorites,  setFavorites]  = useState<Set<string>>(new Set())
  const [reportingId, setReportingId] = useState<string | null>(null)
  const [reportPrice, setReportPrice] = useState('')
  const [reportMsg,   setReportMsg]   = useState('')

  const isEV = fuel === 'EV'

  // ── Auth + Pro + Favoris ──────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user
      if (!user) return
      setUserId(user.id)
      const cached = localStorage.getItem(`wolf_pro_${user.id}`) === '1'
      if (cached) setIsPro(true)
      const { data: profile } = await supabase.from('profiles').select('is_pro').eq('id', user.id).single()
      if (profile?.is_pro) { setIsPro(true); localStorage.setItem(`wolf_pro_${user.id}`, '1') }
      const saved: string[] = JSON.parse(localStorage.getItem('wolf_favorites') ?? '[]')
      setFavorites(new Set(saved))
    })
  }, [])

  async function toggleFavorite(stationId: string, stationName: string, stationAddr: string, price: number | null) {
    if (!userId || !isPro) return
    const isSaved = favorites.has(stationId)
    const next = new Set(favorites)
    if (isSaved) {
      await fetch('/api/favorites', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, stationId }) }).catch(() => {})
      next.delete(stationId)
    } else {
      await fetch('/api/favorites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, stationId, stationName, stationAddress: stationAddr, lastPrice: price }) }).catch(() => {})
      next.add(stationId)
    }
    setFavorites(next)
    localStorage.setItem('wolf_favorites', JSON.stringify([...next]))
  }

  async function submitReport(stationId: string, stationName: string, fuelType: string, officialPrice: number | null) {
    const price = parseFloat(reportPrice)
    if (!price || isNaN(price)) { setReportMsg('⚠️ Entre un prix valide'); return }
    const res = await fetch('/api/community-reports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, stationId, stationName, fuelType, reportedPrice: price, officialPrice }) }).catch(() => null)
    if (!res || !res.ok) { const d = await res?.json().catch(() => ({})); setReportMsg(d?.error ?? '❌ Erreur'); return }
    setReportMsg('✅ Signalement envoyé, merci !')
    setReportPrice('')
    setTimeout(() => { setReportingId(null); setReportMsg('') }, 2000)
  }

  function stationKey(name: string, addr: string) {
    return btoa(unescape(encodeURIComponent((name + addr).slice(0, 60)))).slice(0, 40)
  }

  // ── Geocoding autocomplete ────────────────────────────────────────────────
  function onCityChange(val: string) {
    setCityInput(val)
    if (debRef.current) clearTimeout(debRef.current)
    if (val.length < 2) { setSuggestions([]); return }
    debRef.current = setTimeout(async () => {
      try {
        const r = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(val)}&type=municipality&limit=5`)
        const d = await r.json()
        setSuggestions((d.features ?? []).map((f: { properties: { label: string; x: number; y: number } }) => ({
          label: f.properties.label,
          lat: f.properties.y,
          lon: f.properties.x,
        })))
      } catch { setSuggestions([]) }
    }, 300)
  }

  function pickSuggestion(s: { label: string; lat: number; lon: number }) {
    setCityInput(s.label); setSearchLat(s.lat); setSearchLon(s.lon); setSuggestions([])
  }

  // ── GPS ───────────────────────────────────────────────────────────────────
  function requestGps() {
    if (!navigator.geolocation) { setGpsStatus('error'); return }
    setGpsStatus('loading')
    navigator.geolocation.getCurrentPosition(
      pos => {
        setGpsLat(pos.coords.latitude); setGpsLon(pos.coords.longitude)
        setSearchLat(pos.coords.latitude); setSearchLon(pos.coords.longitude)
        setGpsStatus('ok')
        fetch(`https://api-adresse.data.gouv.fr/reverse/?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`)
          .then(r => r.json()).then(d => { if (d.features?.[0]) setCityInput(d.features[0].properties.city ?? 'Ma position') }).catch(() => {})
      },
      () => setGpsStatus('error'),
      { enableHighAccuracy: true, timeout: 15000 }
    )
  }

  // ── Fetch carburant ────────────────────────────────────────────────────────
  const load = useCallback(async (lat: number, lon: number, rad: number) => {
    if (!lat || !lon) return
    setStatus('loading')
    try {
      const fuelFields = ALL_FUELS.map(k => FC[k].f + ',' + FC[k].m).join(',')
      const fields = `id,adresse,ville,cp,geom,horaires_automate_24_24,services_service,${fuelFields}`
      const where  = `within_distance(geom, geom'POINT(${lon} ${lat})', ${rad}km)`
      const url    = `https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records?select=${encodeURIComponent(fields)}&where=${encodeURIComponent(where)}&limit=100`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Erreur ' + res.status)
      const data = await res.json()
      const dLat = gpsLat ?? lat, dLon = gpsLon ?? lon
      const list: Station[] = (data.results ?? []).map((r: Record<string, unknown>) => {
        const geom = r.geom as { lat?: number; lon?: number } | null
        const rlat = geom?.lat ?? 0, rlon = geom?.lon ?? 0
        const svc = Array.isArray(r.services_service) ? (r.services_service as string[]).join(' ') : String(r.services_service ?? '')
        const prices: Station['prices'] = {}
        ALL_FUELS.forEach(k => {
          prices[k] = { price: r[FC[k].f] != null ? parseFloat(r[FC[k].f] as string) : null, updated: r[FC[k].m] ? String(r[FC[k].m]) : null }
        })
        return {
          id: String(r.id ?? ''), name: String(r.ville ?? 'Station'),
          addr: String(r.adresse ?? ''), city: String(r.ville ?? ''), cp: String(r.cp ?? ''),
          lat: rlat, lon: rlon, dist: hav(dLat, dLon, rlat, rlon),
          is24h: r.horaires_automate_24_24 === 'Oui',
          cb: svc.toLowerCase().includes('carte bancaire') || svc.toLowerCase().includes('cb'),
          prices,
        }
      })
      setStations(list); setStatus('ok')
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Erreur'); setStatus('error')
    }
  }, [gpsLat, gpsLon])

  // ── Fetch bornes EV ───────────────────────────────────────────────────────
  const loadEV = useCallback(async (lat: number, lon: number, rad: number) => {
    if (!lat || !lon) return
    setStatus('loading')
    const dLat = gpsLat ?? lat, dLon = gpsLon ?? lon

    // Convertit un résultat IRVE en EVStation
    function fromIRVE(r: Record<string, unknown>): EVStation {
      const geom = r.coordonneesXY as { lat?: number; lon?: number } | null
      const sLat = geom?.lat ?? 0, sLon = geom?.lon ?? 0
      const prises: { label: string; color: string }[] = []
      if ((r.prise_type_2 as number) > 0)          prises.push({ label: 'Type 2',    color: '#06b6d4' })
      if ((r.prise_type_combo_ccs as number) > 0)  prises.push({ label: 'CCS Combo', color: '#8b5cf6' })
      if ((r.prise_type_chademo as number) > 0)    prises.push({ label: 'CHAdeMO',   color: '#f59e0b' })
      if ((r.prise_type_autre as number) > 0 && !prises.length) prises.push({ label: 'Borne', color: '#64748b' })
      if (!prises.length) prises.push({ label: 'Borne', color: '#64748b' })
      const puissance = r.puissance_nominale != null ? parseFloat(String(r.puissance_nominale)) : null
      const speedCat: EVStation['speedCat'] = !puissance ? 'inconnu' : puissance >= 50 ? 'rapide' : puissance >= 22 ? 'semi' : 'lente'
      return {
        id: String(r.id_station_itinerance ?? Math.random()),
        name: String(r.nom_station || r.operateur || 'Borne de recharge'),
        addr: String(r.adresse_station ?? ''),
        city: String(r.consolidated_commune ?? ''),
        cp:   String(r.code_postal ?? ''),
        lat: sLat, lon: sLon, dist: hav(dLat, dLon, sLat, sLon),
        prises, puissance, puissanceEstimee: false, speedCat,
        nbrePDC: parseInt(String(r.nbre_pdc ?? '0')) || 1,
        is24h: String(r.horaires ?? '').includes('24/7'),
        operateur: String(r.operateur ?? ''),
      }
    }

    // Convertit un nœud Overpass en EVStation
    function fromOverpass(r: Record<string, unknown>): EVStation {
      const t = (r.tags ?? {}) as Record<string, string>
      const sLat = parseFloat(String(r.lat ?? 0)), sLon = parseFloat(String(r.lon ?? 0))
      const prises: { label: string; color: string }[] = []
      if (t['socket:type2'] || t['socket:type2_cable'])                       prises.push({ label: 'Type 2',    color: '#06b6d4' })
      if (t['socket:ccs']   || t['socket:type2_combo'])                       prises.push({ label: 'CCS Combo', color: '#8b5cf6' })
      if (t['socket:chademo'])                                                 prises.push({ label: 'CHAdeMO',   color: '#f59e0b' })
      if (t['socket:type1'])                                                   prises.push({ label: 'Type 1',    color: '#22d3ee' })
      if (t['socket:nacs'])                                                    prises.push({ label: 'NACS',      color: '#ef4444' })
      if (t['socket:tesla_supercharger'] || t['socket:tesla_destination'])     prises.push({ label: 'Tesla',     color: '#ef4444' })
      if (!prises.length) prises.push({ label: 'Borne', color: '#64748b' })
      let puissance: number | null = null, puissanceEstimee = false
      for (const f of ['maxpower','charging_station:output','socket:type2:output','socket:ccs:output','socket:chademo:output','socket:tesla_supercharger:output','socket:nacs:output']) {
        if (t[f]) { const p = parsePower(t[f]); if (p) { puissance = p; break } }
      }
      if (!puissance) {
        const op = (t.operator || t.brand || '').toLowerCase()
        if (op.includes('ionity'))      { puissance = 350; puissanceEstimee = true }
        else if (op.includes('fastned')) { puissance = 300; puissanceEstimee = true }
        else if (op.includes('tesla'))   { puissance = 150; puissanceEstimee = true }
        else if (t['socket:ccs'])        { puissance = 50;  puissanceEstimee = true }
        else if (t['socket:type2'])      { puissance = 22;  puissanceEstimee = true }
        else if (t['socket:type1'])      { puissance = 7;   puissanceEstimee = true }
      }
      const speedCat: EVStation['speedCat'] = !puissance ? 'inconnu' : puissance >= 50 ? 'rapide' : puissance >= 22 ? 'semi' : 'lente'
      const addrParts = [t['addr:housenumber'], t['addr:street']].filter(Boolean)
      const addr = addrParts.join(' ') || t['addr:place'] || ''
      const city = t['addr:city'] || t['addr:municipality'] || t['addr:town'] || t['addr:village'] || ''
      const nbSockets = Object.keys(t).filter(k => k.startsWith('socket:') && !k.includes(':', 7)).reduce((s, k) => s + (parseInt(t[k]) || 1), 0)
      return {
        id: String(r.id ?? ''),
        name: t.name || t.operator || t.brand || 'Borne de recharge',
        addr, city, cp: t['addr:postcode'] || '',
        lat: sLat, lon: sLon, dist: hav(dLat, dLon, sLat, sLon),
        prises, puissance, puissanceEstimee, speedCat,
        nbrePDC: parseInt(t.capacity ?? '0') || nbSockets || 1,
        is24h: t.opening_hours === '24/7',
        operateur: t.operator || t.brand || '',
      }
    }

    try {
      let list: EVStation[] = []
      let source = 'irve'

      // 1️⃣ Essai IRVE (API officielle française — rapide, adresses complètes)
      try {
        const rows = await fetchIRVE(lat, lon, rad)
        list = rows.map(fromIRVE)
      } catch {
        // 2️⃣ Fallback Overpass (4 serveurs en parallèle, timeout 22s)
        source = 'overpass'
        const data = await fetchOverpass(lat, lon, rad)
        list = (data.elements ?? []).map(fromOverpass)
      }

      const sorted = list
        .filter(s => s.lat && s.lon)
        // Exclure les bornes sans info utile (nom générique + aucun connecteur identifié)
        .filter(s => !(s.name === 'Borne de recharge' && s.prises.length === 1 && s.prises[0].label === 'Borne'))
        .sort((a, b) => a.dist - b.dist)
      setEvStations(sorted)
      setStatus('ok')

      // Reverse geocoding uniquement pour les bornes Overpass sans adresse
      if (source === 'overpass') {
        const missing = sorted.filter(s => !s.addr && !s.city).slice(0, 20)
        if (missing.length > 0) {
          Promise.all(missing.map(s => reverseGeocode(s.lat, s.lon).then(geo => ({ id: s.id, ...geo }))))
            .then(results => {
              setEvStations(prev => prev.map(s => {
                const geo = results.find(g => g.id === s.id)
                if (geo && (geo.addr || geo.city)) return { ...s, addr: geo.addr, city: geo.city, cp: geo.cp || s.cp }
                return s
              }))
            })
        }
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Erreur'); setStatus('error')
    }
  }, [gpsLat, gpsLon])

  useEffect(() => {
    if (initLat && initLon) {
      if (initFuel === 'EV') loadEV(initLat, initLon, radius)
      else load(initLat, initLon, radius)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-relance quand le carburant ou le rayon change ────────────────────
  useEffect(() => {
    if (!searchLat || !searchLon) return
    if (fuel === 'EV') loadEV(searchLat, searchLon, radius)
    else load(searchLat, searchLon, radius)
  }, [fuel, radius]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Tri carburant ──────────────────────────────────────────────────────────
  const dLat = gpsLat ?? searchLat, dLon = gpsLon ?? searchLon
  const sorted = [...stations]
    .map(s => ({ ...s, dist: hav(dLat, dLon, s.lat, s.lon) }))
    .filter(s => { if (sortBy === 'price') return s.prices[fuel]?.price != null; return true })
    .sort((a, b) => sortBy === 'price'
      ? (a.prices[fuel]?.price ?? 999) - (b.prices[fuel]?.price ?? 999)
      : a.dist - b.dist)

  // ── Tri / filtre EV ────────────────────────────────────────────────────────
  const evMapped = [...evStations].map(s => ({ ...s, dist: hav(dLat, dLon, s.lat, s.lon) }))
  const evSorted = evMapped
    .filter(s => {
      if (evFilter === 'all')    return true
      if (evFilter === 'rapide') return s.speedCat === 'rapide'
      if (evFilter === 'semi')   return s.speedCat === 'semi'
      if (evFilter === 'lente')  return s.speedCat === 'lente' || s.speedCat === 'inconnu'
      return true
    })
    .sort((a, b) => a.dist - b.dist)

  const totalPDC = evSorted.reduce((sum, s) => sum + s.nbrePDC, 0)

  // Compteurs par catégorie
  const evCounts = {
    all:    evMapped.length,
    rapide: evMapped.filter(s => s.speedCat === 'rapide').length,
    semi:   evMapped.filter(s => s.speedCat === 'semi').length,
    lente:  evMapped.filter(s => s.speedCat === 'lente' || s.speedCat === 'inconnu').length,
  }

  const gS = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`
  const wS = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>`

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div className="rh">
        <div className="rh-inner">
          <div className="rh-left">
            <img src="/wolf-logo.png" alt="WolfFuel" className="wolf-sm-img" />
            <div>
              <div className="rh-title">Recherche complète</div>
              <div className="rh-sub">{cityInput || initName} · depuis {gpsStatus === 'ok' ? 'votre position GPS' : (cityInput || initName)}</div>
            </div>
          </div>
          <button className="back-btn" onClick={() => router.back()}>← Retour</button>
        </div>
      </div>

      {/* Barre de recherche */}
      <div style={{ maxWidth: 750, margin: '16px auto 0', padding: '0 20px', position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>🔍</span>
          <input
            value={cityInput}
            onChange={e => onCityChange(e.target.value)}
            placeholder="Ville, commune..."
            style={{ width: '100%', padding: '14px 14px 14px 40px', borderRadius: 12, border: '1px solid rgba(168,85,247,.2)', background: 'rgba(168,85,247,.06)', color: '#f1f5f9', fontSize: 15, fontFamily: 'DM Sans,sans-serif', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        {suggestions.length > 0 && (
          <div style={{ position: 'absolute', left: 20, right: 20, top: '100%', zIndex: 50, background: 'rgba(15,10,40,.98)', border: '1px solid rgba(168,85,247,.25)', borderRadius: 10, overflow: 'hidden', marginTop: 4 }}>
            {suggestions.map((s, i) => (
              <div key={i} onClick={() => pickSuggestion(s)}
                style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 14, color: '#e2e8f0', borderBottom: i < suggestions.length - 1 ? '1px solid rgba(168,85,247,.1)' : 'none' }}
                onMouseOver={e => (e.currentTarget.style.background = 'rgba(168,85,247,.1)')}
                onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
              >
                📍 {s.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filtres */}
      <div style={{ maxWidth: 750, margin: '12px auto 0', padding: '0 20px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minWidth: 120 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em' }}>Carburant</label>
          <select value={fuel} onChange={e => setFuel(e.target.value)}
            style={{ padding: '9px 12px', borderRadius: 9, border: '1px solid rgba(168,85,247,.2)', background: 'rgba(168,85,247,.06)', color: '#f1f5f9', fontSize: 14, fontFamily: 'DM Sans,sans-serif' }}>
            {ALL_FUELS_SELECT.map(k => <option key={k} value={k}>{k === 'EV' ? '⚡ Électrique' : FC[k].l}</option>)}
          </select>
        </div>
        {!isEV && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minWidth: 120 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em' }}>Trier par</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as 'distance' | 'price')}
              style={{ padding: '9px 12px', borderRadius: 9, border: '1px solid rgba(168,85,247,.2)', background: 'rgba(168,85,247,.06)', color: '#f1f5f9', fontSize: 14, fontFamily: 'DM Sans,sans-serif' }}>
              <option value="distance">Distance</option>
              <option value="price">Prix</option>
            </select>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minWidth: 100 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em' }}>Rayon</label>
          <select value={radius} onChange={e => setRadius(Number(e.target.value))}
            style={{ padding: '9px 12px', borderRadius: 9, border: '1px solid rgba(168,85,247,.2)', background: 'rgba(168,85,247,.06)', color: '#f1f5f9', fontSize: 14, fontFamily: 'DM Sans,sans-serif' }}>
            {RADII.map(r => <option key={r} value={r}>{r} km</option>)}
          </select>
        </div>
        <div style={{ paddingTop: 18 }}>
          <button
            onClick={() => isEV ? loadEV(searchLat, searchLon, radius) : load(searchLat, searchLon, radius)}
            style={{ padding: '9px 16px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#a855f7,#7c3aed)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', whiteSpace: 'nowrap' }}>
            {isEV
              ? (status === 'ok' ? `⚡ ${evSorted.length} borne${evSorted.length > 1 ? 's' : ''}` : '⚡ Chercher')
              : (status === 'ok' ? `${sorted.length} station${sorted.length > 1 ? 's' : ''}` : 'Chercher')}
          </button>
        </div>
      </div>

      {/* Filtre vitesse EV */}
      {isEV && status === 'ok' && (
        <div className="sort-tabs" style={{ gap: 6, maxWidth: 750, margin: '10px auto 0' }}>
          {([
            ['all',    'Toutes',         evCounts.all],
            ['rapide', '⚡⚡ Rapide ≥50kW', evCounts.rapide],
            ['semi',   '⚡ Semi ≥22kW',   evCounts.semi],
            ['lente',  '🔌 Normale',      evCounts.lente],
          ] as const).map(([val, label, count]) => (
            <button key={val} className={'sort-tab' + (evFilter === val ? ' active' : '')} onClick={() => setEvFilter(val)}>
              {label} <span style={{ opacity: .65, fontSize: 11 }}>({count})</span>
            </button>
          ))}
        </div>
      )}

      {/* Bouton carte */}
      {status === 'ok' && (
        <div style={{ maxWidth: 750, margin: '10px auto 0', padding: '0 20px' }}>
          <button
            onClick={() => setShowMap(v => !v)}
            style={{ width: '100%', padding: '12px', borderRadius: 12, border: showMap ? '1px solid rgba(168,85,247,.6)' : '1px solid rgba(168,85,247,.2)', background: showMap ? 'rgba(168,85,247,.18)' : 'rgba(168,85,247,.06)', color: '#c084fc', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}
          >
            {showMap ? '📋 Voir la liste' : '🗺️ Voir sur la carte'}
          </button>
        </div>
      )}

      {/* Bannière GPS */}
      <div style={{ maxWidth: 750, margin: '12px auto 0', padding: '0 20px' }}>
        {gpsStatus !== 'ok' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 16px', borderRadius: 12, background: 'rgba(168,85,247,.06)', border: '1px solid rgba(168,85,247,.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>📍</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>Distances plus précises ?</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Autorisez la localisation pour les km réels</div>
              </div>
            </div>
            <button onClick={requestGps} disabled={gpsStatus === 'loading'}
              style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#a855f7,#7c3aed)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
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

      {/* Résultats */}
      <div className="res-section">
        {status === 'loading' && (
          <div className="loading-box show">
            <div className="spinner" />
            <p style={{ color: '#94a3b8', fontSize: 14 }}>{isEV ? '⚡ Recherche des bornes...' : '🐺 Recherche en cours...'}</p>
          </div>
        )}
        {status === 'error' && (
          <div className="error-box show">
            <p style={{ fontWeight: 700, marginBottom: 4 }}>Erreur</p>
            <p style={{ fontSize: 13 }}>❌ {errorMsg}</p>
          </div>
        )}
        {status === 'idle' && (
          <div className="empty-state show">
            <p style={{ fontSize: 36, marginBottom: 12 }}>🐺</p>
            <p style={{ fontWeight: 700 }}>Entrez une ville et lancez la recherche</p>
          </div>
        )}
        {status === 'ok' && !isEV && sorted.length === 0 && (
          <div className="empty-state show">
            <p style={{ fontSize: 36, marginBottom: 12 }}>🐺</p>
            <p style={{ fontWeight: 700 }}>Aucune station dans ce rayon</p>
          </div>
        )}
        {status === 'ok' && isEV && evSorted.length === 0 && (
          <div className="empty-state show">
            <p style={{ fontSize: 36, marginBottom: 12 }}>⚡</p>
            <p style={{ fontWeight: 700 }}>Aucune borne dans ce rayon</p>
          </div>
        )}

        {/* Cards carburant — vue carte */}
        {status === 'ok' && !isEV && sorted.length > 0 && showMap && (() => {
          const mapStations: MapFuelStation[] = sorted.map(s => {
            const fuelsWithPrice = ALL_FUELS.filter(k => s.prices[k]?.price != null)
            const bestFuelKey = fuelsWithPrice.length
              ? fuelsWithPrice.reduce((a, b) => (s.prices[a]?.price ?? 999) < (s.prices[b]?.price ?? 999) ? a : b)
              : null
            return {
              kind: 'fuel' as const, id: s.id, lat: s.lat, lon: s.lon,
              city: s.city, addr: s.addr, cp: s.cp, dist: s.dist,
              price: bestFuelKey ? s.prices[bestFuelKey].price : null,
              updated: bestFuelKey ? s.prices[bestFuelKey].updated : null,
              is24h: s.is24h, hasPenurie: false,
              fuelLabel: bestFuelKey ? FC[bestFuelKey].l : 'Carburant',
              fuelColor: bestFuelKey ? FC[bestFuelKey].c : '#a855f7',
            }
          })
          return (
            <div style={{ height: '70vh', minHeight: 380, maxWidth: 750, margin: '12px auto 0', padding: '0 20px' }}>
              <StationMap stations={mapStations} userLat={dLat} userLon={dLon} />
            </div>
          )
        })()}

        {/* Cards carburant — vue liste */}
        {status === 'ok' && !isEV && sorted.length > 0 && !showMap && (
          <div className="res-list">
            {sorted.map((s, i) => {
              const gU = `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lon}`
              const wU = `https://waze.com/ul?ll=${s.lat}%2C${s.lon}&navigate=yes`
              const fuelsWithPrice = ALL_FUELS.filter(k => s.prices[k]?.price != null)
              const bestFuel = fuelsWithPrice.length
                ? fuelsWithPrice.reduce((a, b) => (s.prices[a]?.price ?? 999) < (s.prices[b]?.price ?? 999) ? a : b)
                : null
              return (
                <div key={s.id + i} className="card" style={{ animationDelay: i * 20 + 'ms' }}>
                  <div className="card-top">
                    <div className="card-left">
                      <div className="rank-col">
                        <div className="rank">{i + 1}</div>
                        {s.is24h && <span className="tag-24">24h</span>}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div className="station-name">{s.city || 'Station'}</div>
                        <div className="station-addr">{[s.addr, s.cp, s.city].filter(Boolean).join(', ')}</div>
                      </div>
                    </div>
                    <div className="dist-badge">{s.dist.toFixed(1)} km</div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '10px 0 8px' }}>
                    {ALL_FUELS.filter(k => s.prices[k]?.price != null).map(k => {
                      const p = s.prices[k]
                      const isBest = k === bestFuel
                      return (
                        <div key={k} style={{ padding: '6px 10px', borderRadius: 8, border: `1.5px solid ${isBest ? FC[k].c : FC[k].c + '55'}`, background: FC[k].c + (isBest ? '22' : '11'), minWidth: 90 }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: FC[k].c, textTransform: 'uppercase', letterSpacing: '.05em' }}>{FC[k].l}</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc', marginTop: 2 }}>{fp(p.price)}</div>
                          <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{fDate(p.updated)}</div>
                        </div>
                      )
                    })}
                  </div>
                  {s.cb && <div style={{ marginBottom: 8 }}><span className="info-tag info-tag-cb">💳 CB</span></div>}
                  <div className="nav-btns">
                    <a className="nav-btn nav-btn-gmaps" href={gU} target="_blank" rel="noopener noreferrer" dangerouslySetInnerHTML={{ __html: gS + ' Google Maps' }} />
                    <a className="nav-btn nav-btn-waze"  href={wU} target="_blank" rel="noopener noreferrer" dangerouslySetInnerHTML={{ __html: wS + ' Waze' }} />
                    {userId && (
                      <button onClick={() => { setReportingId(reportingId === s.id ? null : s.id); setReportPrice(''); setReportMsg('') }}
                        style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(245,158,11,.3)', background: 'rgba(245,158,11,.06)', color: '#f59e0b', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
                        ⚠️ Signaler
                      </button>
                    )}
                    {isPro && userId && (() => {
                      const sid = stationKey(s.name, s.addr + s.cp + s.city)
                      const isSaved = favorites.has(sid)
                      return (
                        <button onClick={() => toggleFavorite(sid, s.name, [s.addr, s.cp, s.city].filter(Boolean).join(', '), bestFuel ? s.prices[bestFuel]?.price ?? null : null)}
                          style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid rgba(168,85,247,.3)`, background: 'rgba(168,85,247,.06)', color: '#c084fc', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
                          {isSaved ? '❤️ Favori' : '🤍 Favori'}
                        </button>
                      )
                    })()}
                  </div>
                  {reportingId === s.id && (
                    <div style={{ marginTop: 10, padding: '12px', borderRadius: 10, background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.2)' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', marginBottom: 6 }}>Signaler un prix incorrect</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input type="number" placeholder="Prix réel (ex: 1.782)" step="0.001" value={reportPrice} onChange={e => setReportPrice(e.target.value)}
                          style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(245,158,11,.3)', background: 'rgba(245,158,11,.05)', color: '#f1f5f9', fontSize: 13, outline: 'none', fontFamily: 'DM Sans,sans-serif' }} />
                        <button onClick={() => submitReport(s.id, s.name, fuel, bestFuel ? s.prices[bestFuel]?.price ?? null : null)}
                          style={{ padding: '9px 14px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', whiteSpace: 'nowrap' }}>
                          Envoyer
                        </button>
                      </div>
                      {reportMsg && <div style={{ fontSize: 12, marginTop: 6, fontWeight: 700, color: reportMsg.startsWith('✅') ? '#34d399' : '#f87171' }}>{reportMsg}</div>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Cards EV — vue carte */}
        {status === 'ok' && isEV && evSorted.length > 0 && showMap && (() => {
          const mapStations = evSorted.map(s => ({
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

        {/* Cards EV — vue liste */}
        {status === 'ok' && isEV && evSorted.length > 0 && !showMap && (
          <>
            <div className="res-count">
              {evSorted.length} borne{evSorted.length > 1 ? 's' : ''} · {totalPDC} point{totalPDC > 1 ? 's' : ''} de charge
            </div>
            <div className="res-list">
              {evSorted.map((s, i) => {
                const spd = getSpeedLabel(s.puissance, s.puissanceEstimee)
                const gU = `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lon}`
                const wU = `https://waze.com/ul?ll=${s.lat}%2C${s.lon}&navigate=yes`
                const addrLine = [s.addr, [s.cp, s.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')
                const addrDisplay = addrLine || s.operateur || `${s.lat.toFixed(5)}, ${s.lon.toFixed(5)}`
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
                          <div className="station-addr">{addrDisplay}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                            {s.prises.map((p, j) => (
                              <span key={j} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 6, background: p.color + '22', border: '1px solid ' + p.color + '55', color: p.color, fontWeight: 700 }}>{p.label}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="dist-badge">{s.dist.toFixed(1)} km</div>
                    </div>

                    {/* Charge */}
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: spd.color }}>{spd.icon} {spd.label}</span>
                      <span style={{ fontSize: 12, color: '#64748b' }}>· {s.nbrePDC} point{s.nbrePDC > 1 ? 's' : ''} de charge</span>
                    </div>

                    {/* Marques compatibles */}
                    {(() => {
                      const hasType2 = s.prises.some(p => p.label === 'Type 2')
                      if (hasType2) return (
                        <div style={{ marginTop: 8, fontSize: 11, color: '#34d399', fontWeight: 600 }}>
                          ✅ Compatible avec tous les véhicules électriques
                        </div>
                      )
                      if (compatBrands.length > 0) return (
                        <div style={{ marginTop: 8, fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>
                          <span style={{ color: '#64748b', fontWeight: 700 }}>🚗 Compatible : </span>
                          {compatBrands.slice(0, 6).join(' · ')}
                          {compatBrands.length > 6 && <span style={{ color: '#64748b' }}> · …</span>}
                        </div>
                      )
                      return null
                    })()}

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

        <div style={{ paddingBottom: 80 }} />
      </div>
      <WolfChat />
    </div>
  )
}

export default function RecherchePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading-box show"><div className="spinner" /><p style={{ color: '#94a3b8', fontSize: 14 }}>🐺 Chargement...</p></div>
      </div>
    }>
      <RechercheContent />
    </Suspense>
  )
}
