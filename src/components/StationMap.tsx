'use client'
import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'

// Fix leaflet default icons (webpack issue)
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// ── Icônes personnalisées ────────────────────────────────────────────────────
function makeIcon(color: string, emoji: string) {
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${color};
      border:2px solid rgba(255,255,255,0.8);
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      width:28px;height:28px;
      box-shadow:0 2px 8px rgba(0,0,0,0.4);
      display:flex;align-items:center;justify-content:center;
    "><span style="transform:rotate(45deg);font-size:13px;line-height:24px;display:block;text-align:center;">${emoji}</span></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -32],
  })
}

const iconBest   = makeIcon('#a855f7', '🏆')
const iconFuel   = makeIcon('#6d28d9', '⛽')
const iconEV     = makeIcon('#0891b2', '⚡')
const iconUser   = makeIcon('#16a34a', '📍')

// ── Types ────────────────────────────────────────────────────────────────────
export interface MapFuelStation {
  kind: 'fuel'
  id: string
  lat: number
  lon: number
  city: string
  addr: string
  cp: string
  dist: number
  price: number | null
  updated: string | null
  is24h: boolean
  hasPenurie: boolean
  fuelLabel: string
  fuelColor: string
}

export interface MapEVStation {
  kind: 'ev'
  id: string
  lat: number
  lon: number
  name: string
  city: string
  addr: string
  dist: number
  prises: { label: string; color: string }[]
  puissance: number | null
  nbrePDC: number
  is24h: boolean
  operateur: string
}

export type MapStation = MapFuelStation | MapEVStation

interface StationMapProps {
  stations: MapStation[]
  userLat: number
  userLon: number
  bestId?: string
}

// Recentre la carte quand userLat/userLon changent
function Recenter({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap()
  useEffect(() => { map.setView([lat, lon], map.getZoom()) }, [lat, lon, map])
  return null
}

function fp(p: number | null) { return p != null ? p.toFixed(3) + ' €/L' : '—' }

// ── Composant carte ──────────────────────────────────────────────────────────
export default function StationMap({ stations, userLat, userLon, bestId }: StationMapProps) {
  return (
    <div style={{ height: '100%', width: '100%', borderRadius: 16, overflow: 'hidden' }}>
      <MapContainer
        center={[userLat, userLon]}
        zoom={12}
        style={{ height: '100%', width: '100%', background: '#0f172a' }}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
          maxZoom={19}
        />
        <Recenter lat={userLat} lon={userLon} />

        {/* Position utilisateur */}
        <Marker position={[userLat, userLon]} icon={iconUser}>
          <Popup>
            <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, lineHeight: 1.5 }}>
              <strong>📍 Votre position</strong>
            </div>
          </Popup>
        </Marker>

        {/* Stations */}
        {stations.filter(s => s.lat && s.lon).map((s) => {
          const isBest = s.id === bestId
          const gU = `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lon}`
          const wU = `https://waze.com/ul?ll=${s.lat}%2C${s.lon}&navigate=yes`

          if (s.kind === 'fuel') {
            return (
              <Marker
                key={s.id}
                position={[s.lat, s.lon]}
                icon={isBest ? iconBest : iconFuel}
              >
                <Popup minWidth={210}>
                  <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, lineHeight: 1.6 }}>
                    {isBest && <div style={{ color: '#a855f7', fontWeight: 800, marginBottom: 4 }}>🏆 Meilleur prix</div>}
                    {s.is24h && <span style={{ fontSize: 11, background: '#064e3b', color: '#34d399', borderRadius: 4, padding: '1px 6px', fontWeight: 700, marginBottom: 4, display: 'inline-block' }}>24h/24</span>}
                    <div style={{ fontWeight: 700, marginBottom: 2 }}>{s.city || 'Station'}</div>
                    <div style={{ color: '#64748b', fontSize: 11, marginBottom: 6 }}>{[s.addr, s.cp, s.city].filter(Boolean).join(', ')}</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: s.fuelColor, marginBottom: 2 }}>{fp(s.price)}</div>
                    <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 8 }}>{s.fuelLabel} · {s.dist.toFixed(1)} km</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <a href={gU} target="_blank" rel="noopener noreferrer"
                        style={{ flex: 1, padding: '6px 0', background: '#4285f422', color: '#4285f4', borderRadius: 8, textAlign: 'center', fontSize: 12, fontWeight: 700, textDecoration: 'none', border: '1px solid #4285f444' }}>
                        🗺️ GMaps
                      </a>
                      <a href={wU} target="_blank" rel="noopener noreferrer"
                        style={{ flex: 1, padding: '6px 0', background: '#05c8f822', color: '#05c8f8', borderRadius: 8, textAlign: 'center', fontSize: 12, fontWeight: 700, textDecoration: 'none', border: '1px solid #05c8f844' }}>
                        🔵 Waze
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          }

          // EV station
          return (
            <Marker key={s.id} position={[s.lat, s.lon]} icon={iconEV}>
              <Popup minWidth={210}>
                <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, lineHeight: 1.6 }}>
                  {s.is24h && <span style={{ fontSize: 11, background: '#064e3b', color: '#34d399', borderRadius: 4, padding: '1px 6px', fontWeight: 700, marginBottom: 4, display: 'inline-block' }}>24h/24</span>}
                  <div style={{ fontWeight: 700, marginBottom: 2 }}>{s.name || s.city || 'Borne'}</div>
                  <div style={{ color: '#64748b', fontSize: 11, marginBottom: 6 }}>{[s.addr, s.city].filter(Boolean).join(', ') || s.operateur}</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
                    {s.prises.map((p, i) => (
                      <span key={i} style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: p.color + '22', border: '1px solid ' + p.color + '66', color: p.color, fontWeight: 700 }}>{p.label}</span>
                    ))}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 8 }}>
                    {s.nbrePDC} PDC{s.puissance ? ` · ${s.puissance}kW` : ''} · {s.dist.toFixed(1)} km
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <a href={gU} target="_blank" rel="noopener noreferrer"
                      style={{ flex: 1, padding: '6px 0', background: '#4285f422', color: '#4285f4', borderRadius: 8, textAlign: 'center', fontSize: 12, fontWeight: 700, textDecoration: 'none', border: '1px solid #4285f444' }}>
                      🗺️ GMaps
                    </a>
                    <a href={wU} target="_blank" rel="noopener noreferrer"
                      style={{ flex: 1, padding: '6px 0', background: '#05c8f822', color: '#05c8f8', borderRadius: 8, textAlign: 'center', fontSize: 12, fontWeight: 700, textDecoration: 'none', border: '1px solid #05c8f844' }}>
                      🔵 Waze
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
