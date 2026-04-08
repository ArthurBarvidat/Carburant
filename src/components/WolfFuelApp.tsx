'use client'
import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import BODY_HTML from './bodyHtml'

const PC = {
  bg: 'rgba(15,10,40,.9)',
  border: 'rgba(168,85,247,.4)',
  text: '#c084fc',
  grad: 'linear-gradient(135deg,#a855f7,#7c3aed)',
  font: "'DM Sans',sans-serif",
}

// ── Badge Wolf Pro dans le header résultats ──────────────────────────────────
function injectProBadge() {
  if (document.getElementById('wolf-pro-badge')) return
  const target = document.querySelector('.rh-title') ?? document.querySelector('.rh-left')
  if (!target) return
  const badge = document.createElement('span')
  badge.id = 'wolf-pro-badge'
  badge.textContent = '🐺⭐ Pro'
  badge.style.cssText = `display:inline-flex;align-items:center;margin-left:8px;padding:2px 8px;border-radius:10px;border:1px solid ${PC.border};background:${PC.bg};color:${PC.text};font-size:11px;font-weight:700;vertical-align:middle`
  target.insertAdjacentElement('afterend', badge)
}

// ── Supprimer les pubs ───────────────────────────────────────────────────────
function injectNoAds() {
  if (document.getElementById('no-ads-style')) return
  const s = document.createElement('style')
  s.id = 'no-ads-style'
  s.textContent = '.ad,.ads,.pub,.banner-pub{display:none!important}'
  document.head.appendChild(s)
}

// ── Boutons favoris sur chaque carte ────────────────────────────────────────
function addFavBtnToCard(card: Element, userId: string, savedFavs: Set<string>) {
  if (card.querySelector('.wolf-fav-btn')) return

  // Extraire les infos de la carte depuis le DOM réel
  const nameEl = card.querySelector('.station-name')
  const addrEl = card.querySelector('.station-addr')
  const priceEl = card.querySelector('.price-highlight')

  const stationName = nameEl?.textContent?.trim() ?? ''
  const stationAddr = addrEl?.textContent?.trim() ?? ''
  const priceText = priceEl?.textContent?.trim() ?? ''
  const lastPrice = parseFloat(priceText.replace(',', '.')) || 0

  // ID unique basé sur le nom + adresse
  const stationId = btoa(unescape(encodeURIComponent((stationName + stationAddr).slice(0, 60)))).slice(0, 40)

  const isSaved = savedFavs.has(stationId)

  const btn = document.createElement('button')
  btn.className = 'wolf-fav-btn'
  btn.dataset.stationId = stationId
  btn.dataset.saved = isSaved ? '1' : '0'
  btn.textContent = isSaved ? '❤️' : '🤍'
  btn.title = isSaved ? 'Retirer des favoris' : 'Ajouter aux favoris'
  btn.style.cssText = `position:absolute;top:8px;right:8px;background:rgba(15,10,40,.85);border:1px solid ${PC.border};border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px;z-index:10`

  btn.addEventListener('click', async (e) => {
    e.stopPropagation()
    const saving = btn.dataset.saved !== '1'
    try {
      if (saving) {
        await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, stationId, stationName, stationAddress: stationAddr, lastPrice }),
        })
        btn.textContent = '❤️'; btn.dataset.saved = '1'; savedFavs.add(stationId)
        localStorage.setItem('wolf_favorites', JSON.stringify([...savedFavs]))
      } else {
        await fetch('/api/favorites', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, stationId }),
        })
        btn.textContent = '🤍'; btn.dataset.saved = '0'; savedFavs.delete(stationId)
        localStorage.setItem('wolf_favorites', JSON.stringify([...savedFavs]))
      }
    } catch { /* silencieux */ }
  })

  const cardEl = card as HTMLElement
  if (getComputedStyle(cardEl).position === 'static') cardEl.style.position = 'relative'
  cardEl.appendChild(btn)
}

function injectFavoriteButtons(userId: string) {
  const savedFavs = new Set<string>(JSON.parse(localStorage.getItem('wolf_favorites') ?? '[]'))

  const observeList = (listId: string) => {
    const list = document.getElementById(listId)
    if (!list) return
    // Cartes déjà présentes
    list.querySelectorAll('.card').forEach(c => addFavBtnToCard(c, userId, savedFavs))
    // Nouvelles cartes (après rechargement innerHTML)
    const obs = new MutationObserver(() => {
      list.querySelectorAll('.card').forEach(c => addFavBtnToCard(c, userId, savedFavs))
    })
    obs.observe(list, { childList: true, subtree: true })
  }

  observeList('res-list')
  observeList('full-list')

  // Observer aussi les changements d'écran pour ré-injecter
  const screenObs = new MutationObserver(() => {
    ['res-list', 'full-list'].forEach(id => {
      document.getElementById(id)?.querySelectorAll('.card').forEach(c => addFavBtnToCard(c, userId, savedFavs))
    })
  })
  screenObs.observe(document.body, { childList: true, subtree: false })
}

// ── Bannière économies dans les résultats ────────────────────────────────────
function injectSavingsBanner(userId: string) {
  const tryInject = () => {
    if (document.getElementById('wolf-savings-banner')) return
    const cards = document.querySelectorAll('#res-list .card, #res-list-full .card')
    if (cards.length < 2) return

    const prices: number[] = []
    cards.forEach(card => {
      const t = card.querySelector('.price-highlight')?.textContent?.trim() ?? ''
      const p = parseFloat(t.replace(',', '.'))
      if (!isNaN(p) && p > 0.5) prices.push(p)
    })
    if (prices.length < 2) return

    const best = Math.min(...prices)
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length
    const saved = (avg - best) * 50
    if (saved < 0.01) return

    const banner = document.createElement('div')
    banner.id = 'wolf-savings-banner'
    banner.style.cssText = `margin:8px 20px;padding:10px 14px;border-radius:12px;background:linear-gradient(135deg,rgba(16,185,129,.15),rgba(5,150,105,.1));border:1px solid rgba(16,185,129,.35);color:#34d399;font-size:13px;font-weight:600;font-family:${PC.font}`
    banner.innerHTML = `💰 <strong>Tu vas économiser ${saved.toFixed(2).replace('.', ',')}€ sur ton plein</strong> en choisissant la station la moins chère de ta zone <span style="color:#6ee7b7;font-size:11px">(calcul sur 50L)</span>`

    const resSection = document.querySelector('.res-section') ?? document.getElementById('res-list')
    resSection?.insertAdjacentElement('beforebegin', banner)

    // Enregistrer en base (une fois par session)
    const key = `wolf_saved_${new Date().toDateString()}`
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, '1')
      fetch('/api/savings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, fuelType: 'unknown', bestPrice: best, avgPrice: avg }),
      }).catch(() => {})
    }
  }

  // Observer les résultats
  const obs = new MutationObserver(tryInject)
  const resList = document.getElementById('res-list') ?? document.querySelector('.res-section')
  if (resList) obs.observe(resList, { childList: true })
  else document.addEventListener('click', () => setTimeout(tryInject, 800), { once: true })
}

// ── Bouton flottant Alertes prix ─────────────────────────────────────────────
function injectAlertsPanel(userId: string) {
  if (document.getElementById('wolf-alert-fab')) return

  const fab = document.createElement('button')
  fab.id = 'wolf-alert-fab'
  fab.textContent = '🔔'
  fab.title = 'Alertes prix Wolf Pro'
  fab.style.cssText = `position:fixed;bottom:80px;right:16px;width:48px;height:48px;border-radius:50%;border:1.5px solid ${PC.border};background:${PC.bg};color:${PC.text};font-size:20px;cursor:pointer;z-index:9999;display:none;box-shadow:0 4px 16px rgba(168,85,247,.3)`

  // Afficher le FAB seulement sur les écrans résultats
  const updateFabVisibility = () => {
    const resultsActive = document.querySelector('#screen-results.active, #screen-full.active')
    fab.style.display = resultsActive ? 'flex' : 'none'
    fab.style.alignItems = 'center'
    fab.style.justifyContent = 'center'
  }
  new MutationObserver(updateFabVisibility).observe(document.body, { subtree: true, attributeFilter: ['class'] })

  // Panel alerte
  const panel = document.createElement('div')
  panel.id = 'wolf-alert-panel'
  panel.style.cssText = `position:fixed;bottom:140px;right:16px;width:280px;background:rgba(10,6,30,.97);border:1.5px solid ${PC.border};border-radius:16px;padding:20px;z-index:9998;display:none;box-shadow:0 8px 32px rgba(0,0,0,.6)`
  panel.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
      <span style="color:${PC.text};font-weight:700;font-size:15px">🔔 Alerte prix</span>
      <button id="wolf-alert-close" style="background:none;border:none;color:#64748b;cursor:pointer;font-size:18px">✕</button>
    </div>
    <div style="margin-bottom:10px">
      <label style="font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.06em;display:block;margin-bottom:6px">Carburant</label>
      <select id="wolf-alert-fuel" style="width:100%;padding:9px 12px;border-radius:9px;border:1px solid ${PC.border};background:rgba(168,85,247,.06);color:#f1f5f9;font-size:14px;font-family:${PC.font}">
        <option value="Gazole">Gazole</option>
        <option value="SP95">SP95</option>
        <option value="SP98">SP98</option>
        <option value="E10">SP95-E10</option>
        <option value="E85">E85</option>
        <option value="GPLc">GPLc</option>
      </select>
    </div>
    <div style="margin-bottom:14px">
      <label style="font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.06em;display:block;margin-bottom:6px">Prix cible (€/L)</label>
      <input id="wolf-alert-price" type="number" step="0.01" min="0.5" max="3" placeholder="ex: 1.75" style="width:100%;padding:9px 12px;border-radius:9px;border:1px solid ${PC.border};background:rgba(168,85,247,.06);color:#f1f5f9;font-size:14px;font-family:${PC.font}" />
    </div>
    <button id="wolf-alert-save" style="width:100%;padding:11px;border-radius:10px;border:none;background:${PC.grad};color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:${PC.font}">Créer l'alerte</button>
    <div id="wolf-alert-msg" style="margin-top:8px;font-size:12px;text-align:center;display:none"></div>
  `

  document.body.appendChild(fab)
  document.body.appendChild(panel)

  fab.addEventListener('click', () => {
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none'
  })
  panel.querySelector('#wolf-alert-close')?.addEventListener('click', () => {
    panel.style.display = 'none'
  })
  panel.querySelector('#wolf-alert-save')?.addEventListener('click', async () => {
    const fuel = (panel.querySelector('#wolf-alert-fuel') as HTMLSelectElement)?.value
    const price = parseFloat((panel.querySelector('#wolf-alert-price') as HTMLInputElement)?.value)
    const msgEl = panel.querySelector('#wolf-alert-msg') as HTMLElement
    if (!price || isNaN(price)) { msgEl.textContent = '⚠️ Entre un prix valide'; msgEl.style.display = 'block'; msgEl.style.color = '#f87171'; return }
    try {
      await fetch('/api/alerts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, fuelType: fuel, targetPrice: price }) })
      msgEl.textContent = '✅ Alerte créée !'; msgEl.style.color = '#34d399'; msgEl.style.display = 'block'
      setTimeout(() => { panel.style.display = 'none'; msgEl.style.display = 'none' }, 2000)
    } catch { msgEl.textContent = '❌ Erreur'; msgEl.style.color = '#f87171'; msgEl.style.display = 'block' }
  })
}

// ── Panel Mes Favoris ────────────────────────────────────────────────────────
function injectFavoritesPanel(userId: string) {
  if (document.getElementById('wolf-favs-btn')) return
  const anchor = document.getElementById('wolf-pro-btn')
  if (!anchor) return

  const btn = document.createElement('button')
  btn.id = 'wolf-favs-btn'
  btn.textContent = '⭐ Mes favoris'
  btn.style.cssText = `display:flex;align-items:center;justify-content:center;gap:8px;margin-top:8px;padding:12px 16px;border-radius:12px;border:1.5px solid ${PC.border};background:rgba(168,85,247,.1);color:${PC.text};font-size:14px;font-weight:700;cursor:pointer;width:100%;font-family:${PC.font}`

  const overlay = document.createElement('div')
  overlay.id = 'wolf-favs-overlay'
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9999;display:none;align-items:flex-end;justify-content:center'
  overlay.innerHTML = `
    <div style="background:rgba(10,6,30,.98);border:1.5px solid ${PC.border};border-radius:20px 20px 0 0;width:100%;max-width:480px;padding:24px;max-height:70vh;overflow-y:auto">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <span style="color:${PC.text};font-weight:800;font-size:16px">⭐ Mes stations favorites</span>
        <button id="wolf-favs-close" style="background:none;border:none;color:#64748b;cursor:pointer;font-size:20px">✕</button>
      </div>
      <div id="wolf-favs-list"><p style="color:#64748b;text-align:center">Chargement...</p></div>
    </div>
  `

  const loadFavs = async () => {
    overlay.style.display = 'flex'
    const listEl = overlay.querySelector('#wolf-favs-list') as HTMLElement
    try {
      const res = await fetch(`/api/favorites?userId=${userId}`)
      const { favorites } = await res.json()
      if (!favorites?.length) { listEl.innerHTML = '<p style="color:#64748b;text-align:center;padding:20px">Aucun favori pour l\'instant.<br>Appuie sur 🤍 sur une station !</p>'; return }
      listEl.innerHTML = ''
      favorites.forEach((fav: { station_id: string; station_name?: string; station_address?: string; fuel_type?: string; last_price?: number; latitude?: number; longitude?: number }) => {
        const item = document.createElement('div')
        item.style.cssText = `padding:14px;border-radius:12px;border:1px solid rgba(168,85,247,.2);margin-bottom:10px;background:rgba(30,20,60,.7)`
        item.innerHTML = `
          <div style="color:#e2e8f0;font-weight:600;font-size:14px;margin-bottom:3px">${fav.station_name ?? 'Station'}</div>
          <div style="color:#94a3b8;font-size:12px;margin-bottom:6px">${fav.station_address ?? ''}</div>
          <div style="color:${PC.text};font-size:12px;margin-bottom:10px">${fav.fuel_type ?? ''} ${fav.last_price ? `— ${fav.last_price.toFixed(3).replace('.', ',')}€/L` : ''}</div>
          <div style="display:flex;gap:8px">
            ${fav.latitude && fav.longitude ? `<a href="https://www.google.com/maps/dir/?api=1&destination=${fav.latitude},${fav.longitude}" target="_blank" style="flex:1;padding:8px;text-align:center;border-radius:8px;background:${PC.grad};color:#fff;font-size:12px;font-weight:700;text-decoration:none">🗺️ Naviguer</a>` : ''}
            <button data-sid="${fav.station_id}" class="wolf-del-fav" style="flex:1;padding:8px;border-radius:8px;border:1px solid rgba(239,68,68,.4);background:rgba(239,68,68,.08);color:#f87171;font-size:12px;font-weight:700;cursor:pointer">🗑️ Supprimer</button>
          </div>
        `
        listEl.appendChild(item)
      })
      listEl.querySelectorAll('.wolf-del-fav').forEach(delBtn => {
        delBtn.addEventListener('click', async () => {
          const sid = (delBtn as HTMLElement).dataset.sid ?? ''
          await fetch('/api/favorites', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, stationId: sid }) }).catch(() => {})
          delBtn.closest('div[style]')?.remove()
          const favs: string[] = JSON.parse(localStorage.getItem('wolf_favorites') ?? '[]')
          localStorage.setItem('wolf_favorites', JSON.stringify(favs.filter(id => id !== sid)))
        })
      })
    } catch { listEl.innerHTML = '<p style="color:#f87171;text-align:center">Erreur de chargement.</p>' }
  }

  btn.addEventListener('click', loadFavs)
  overlay.querySelector('#wolf-favs-close')?.addEventListener('click', () => { overlay.style.display = 'none' })
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.style.display = 'none' })
  document.body.appendChild(overlay)
  anchor.insertAdjacentElement('afterend', btn)
}

// ── Panel Historique des pleins ──────────────────────────────────────────────
function injectHistoryPanel(userId: string) {
  if (document.getElementById('wolf-history-btn')) return
  const anchor = document.getElementById('wolf-favs-btn') ?? document.getElementById('wolf-pro-btn')
  if (!anchor) return

  const btn = document.createElement('button')
  btn.id = 'wolf-history-btn'
  btn.textContent = '📊 Mon historique'
  btn.style.cssText = `display:flex;align-items:center;justify-content:center;gap:8px;margin-top:8px;padding:12px 16px;border-radius:12px;border:1.5px solid ${PC.border};background:rgba(168,85,247,.1);color:${PC.text};font-size:14px;font-weight:700;cursor:pointer;width:100%;font-family:${PC.font}`

  const overlay = document.createElement('div')
  overlay.id = 'wolf-history-overlay'
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9999;display:none;align-items:flex-end;justify-content:center'
  overlay.innerHTML = `
    <div style="background:rgba(10,6,30,.98);border:1.5px solid rgba(168,85,247,.4);border-radius:20px 20px 0 0;width:100%;max-width:480px;padding:24px;max-height:88vh;overflow-y:auto">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <span style="color:#c084fc;font-weight:800;font-size:16px">📊 Mon historique</span>
        <button id="wolf-history-close" style="background:none;border:none;color:#64748b;cursor:pointer;font-size:20px">✕</button>
      </div>
      <div id="wolf-history-content"><p style="color:#64748b;text-align:center">Chargement...</p></div>
      <div style="margin-top:16px;border-top:1px solid rgba(168,85,247,.15);padding-top:16px">
        <div style="color:#c084fc;font-weight:700;font-size:14px;margin-bottom:12px">➕ Ajouter un plein</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <div>
            <label style="font-size:11px;color:#64748b;font-weight:600;display:block;margin-bottom:4px">Carburant</label>
            <select id="wh-fuel" style="width:100%;padding:8px 10px;border-radius:9px;border:1px solid rgba(168,85,247,.4);background:rgba(168,85,247,.06);color:#f1f5f9;font-size:13px;font-family:'DM Sans',sans-serif">
              <option>Gazole</option><option>SP95</option><option>SP98</option><option>E10</option><option>E85</option><option>GPLc</option>
            </select>
          </div>
          <div>
            <label style="font-size:11px;color:#64748b;font-weight:600;display:block;margin-bottom:4px">Prix/L (€)</label>
            <input id="wh-price" type="number" step="0.001" min="0.5" max="4" placeholder="1.789" style="width:100%;padding:8px 10px;border-radius:9px;border:1px solid rgba(168,85,247,.4);background:rgba(168,85,247,.06);color:#f1f5f9;font-size:13px;font-family:'DM Sans',sans-serif;box-sizing:border-box"/>
          </div>
          <div>
            <label style="font-size:11px;color:#64748b;font-weight:600;display:block;margin-bottom:4px">Litres</label>
            <input id="wh-liters" type="number" step="0.1" min="1" max="200" placeholder="45" style="width:100%;padding:8px 10px;border-radius:9px;border:1px solid rgba(168,85,247,.4);background:rgba(168,85,247,.06);color:#f1f5f9;font-size:13px;font-family:'DM Sans',sans-serif;box-sizing:border-box"/>
          </div>
          <div>
            <label style="font-size:11px;color:#64748b;font-weight:600;display:block;margin-bottom:4px">Km compteur (optionnel)</label>
            <input id="wh-km" type="number" step="1" min="0" placeholder="48500" style="width:100%;padding:8px 10px;border-radius:9px;border:1px solid rgba(168,85,247,.4);background:rgba(168,85,247,.06);color:#f1f5f9;font-size:13px;font-family:'DM Sans',sans-serif;box-sizing:border-box"/>
          </div>
        </div>
        <input id="wh-station" type="text" placeholder="Nom de la station (optionnel)" style="width:100%;padding:8px 10px;border-radius:9px;border:1px solid rgba(168,85,247,.4);background:rgba(168,85,247,.06);color:#f1f5f9;font-size:13px;font-family:'DM Sans',sans-serif;box-sizing:border-box;margin-bottom:8px"/>
        <button id="wh-submit" style="width:100%;padding:11px;border-radius:10px;border:none;background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif">Enregistrer le plein</button>
        <div id="wh-msg" style="margin-top:8px;font-size:12px;text-align:center;display:none"></div>
      </div>
    </div>
  `

  type FillUp = { id: string; station_name?: string; fuel_type: string; price_per_liter: number; liters: number; total_cost: number; km_before?: number; created_at: string }
  type Stats = { total_cost: number; total_liters: number; avg_price: number; count: number }

  const renderHistory = (fillUps: FillUp[], stats: Stats) => {
    const contentEl = overlay.querySelector('#wolf-history-content') as HTMLElement
    if (!fillUps.length) {
      contentEl.innerHTML = '<p style="color:#64748b;text-align:center;padding:16px">Aucun plein enregistré.<br>Utilise le formulaire ci-dessous !</p>'
      return
    }

    // Stats cards
    const statsHtml = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">${[
      ['⛽ Pleins', String(stats.count)],
      ['💧 Volume', stats.total_liters.toFixed(0) + ' L'],
      ['💶 Total dépensé', stats.total_cost.toFixed(2).replace('.', ',') + ' €'],
      ['📈 Prix moyen', stats.avg_price.toFixed(3).replace('.', ',') + ' €/L'],
    ].map(([label, val]) => `<div style="padding:10px;border-radius:10px;background:rgba(168,85,247,.08);border:1px solid rgba(168,85,247,.2)"><div style="font-size:11px;color:#64748b;margin-bottom:3px">${label}</div><div style="font-size:16px;font-weight:800;color:#e2e8f0">${val}</div></div>`).join('')}</div>`

    // SVG bar chart (prix/L des 12 derniers pleins, du plus ancien au plus récent)
    const chartData = [...fillUps].reverse().slice(0, 12)
    const prices = chartData.map(f => f.price_per_liter)
    const minP = Math.min(...prices)
    const maxP = Math.max(...prices)
    const pRange = maxP - minP || 0.1
    const W = 280, H = 72, padX = 32
    const barW = (W - padX * 2) / Math.max(chartData.length, 1)
    const barsHtml = chartData.map((f, i) => {
      const norm = (f.price_per_liter - minP) / pRange
      const barH = Math.max(6, norm * (H - 18) + 6)
      const x = padX + i * barW + barW * 0.1
      const y = H - barH
      const color = norm < 0.33 ? '#34d399' : norm < 0.66 ? '#fbbf24' : '#f87171'
      const dateStr = new Date(f.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
      return `<g><rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(barW * 0.8).toFixed(1)}" height="${barH.toFixed(1)}" rx="3" fill="${color}" opacity="0.85"/><text x="${(x + barW * 0.4).toFixed(1)}" y="${(H + 11).toFixed(1)}" text-anchor="middle" font-size="7" fill="#475569">${dateStr}</text></g>`
    }).join('')
    const chartHtml = `<div style="margin-bottom:14px"><div style="font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">Évolution prix/L <span style="color:#475569;font-weight:400">(vert = pas cher, rouge = cher)</span></div><div style="background:rgba(168,85,247,.05);border:1px solid rgba(168,85,247,.15);border-radius:12px;padding:12px 8px 6px"><svg viewBox="0 0 ${W} ${H + 14}" style="width:100%;height:86px;overflow:visible"><text x="0" y="8" font-size="8" fill="#475569">${maxP.toFixed(3)}</text><text x="0" y="${H - 1}" font-size="8" fill="#475569">${minP.toFixed(3)}</text><line x1="${padX}" y1="0" x2="${padX}" y2="${H}" stroke="rgba(168,85,247,.2)" stroke-width="1"/><line x1="${padX}" y1="${H}" x2="${W - padX}" y2="${H}" stroke="rgba(168,85,247,.2)" stroke-width="1"/>${barsHtml}</svg></div></div>`

    // Table
    const tableHtml = `<div style="font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">Détail des pleins</div><div id="wolf-history-table" style="display:flex;flex-direction:column;gap:6px">${fillUps.slice(0, 20).map(f => {
      const d = new Date(f.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
      const consoPer100 = f.km_before ? null : null
      void consoPer100
      return `<div data-fill-id="${f.id}" style="display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;background:rgba(30,20,60,.7);border:1px solid rgba(168,85,247,.15)"><div style="font-size:11px;color:#64748b;white-space:nowrap">${d}</div><div><div style="font-size:13px;font-weight:600;color:#e2e8f0">${f.fuel_type} · ${f.price_per_liter.toFixed(3).replace('.', ',')}€/L</div><div style="font-size:11px;color:#64748b">${f.liters.toFixed(1)}L · ${f.total_cost.toFixed(2).replace('.', ',')}€${f.station_name ? ' · ' + f.station_name : ''}</div></div><button class="wh-del" data-id="${f.id}" style="background:none;border:none;color:#475569;cursor:pointer;font-size:14px;padding:4px" title="Supprimer">🗑️</button></div>`
    }).join('')}</div>`

    contentEl.innerHTML = statsHtml + chartHtml + tableHtml

    contentEl.querySelectorAll('.wh-del').forEach(delBtn => {
      delBtn.addEventListener('click', async () => {
        const id = (delBtn as HTMLElement).dataset.id
        await fetch('/api/fill-ups', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, userId }) }).catch(() => {})
        ;(delBtn as HTMLElement).closest('[data-fill-id]')?.remove()
      })
    })
  }

  const loadHistory = async () => {
    overlay.style.display = 'flex'
    const contentEl = overlay.querySelector('#wolf-history-content') as HTMLElement
    contentEl.innerHTML = '<p style="color:#64748b;text-align:center">Chargement...</p>'
    try {
      const res = await fetch(`/api/fill-ups?userId=${userId}`)
      const { fill_ups, stats } = await res.json()
      renderHistory(fill_ups ?? [], stats ?? { total_cost: 0, total_liters: 0, avg_price: 0, count: 0 })
    } catch {
      contentEl.innerHTML = '<p style="color:#f87171;text-align:center">Erreur de chargement.</p>'
    }
  }

  btn.addEventListener('click', loadHistory)
  overlay.querySelector('#wolf-history-close')?.addEventListener('click', () => { overlay.style.display = 'none' })
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.style.display = 'none' })

  overlay.querySelector('#wh-submit')?.addEventListener('click', async () => {
    const fuel = (overlay.querySelector('#wh-fuel') as HTMLSelectElement)?.value
    const price = parseFloat((overlay.querySelector('#wh-price') as HTMLInputElement)?.value)
    const liters = parseFloat((overlay.querySelector('#wh-liters') as HTMLInputElement)?.value)
    const km = parseFloat((overlay.querySelector('#wh-km') as HTMLInputElement)?.value)
    const station = (overlay.querySelector('#wh-station') as HTMLInputElement)?.value.trim()
    const msgEl = overlay.querySelector('#wh-msg') as HTMLElement
    if (!price || isNaN(price) || !liters || isNaN(liters)) {
      msgEl.textContent = '⚠️ Prix/L et litres sont obligatoires'
      msgEl.style.cssText = 'margin-top:8px;font-size:12px;text-align:center;display:block;color:#f87171'
      return
    }
    try {
      const res = await fetch('/api/fill-ups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, fuel_type: fuel, price_per_liter: price, liters, km_before: isNaN(km) ? null : km, station_name: station || null }),
      })
      if (!res.ok) throw new Error()
      msgEl.textContent = '✅ Plein enregistré !'
      msgEl.style.cssText = 'margin-top:8px;font-size:12px;text-align:center;display:block;color:#34d399'
      ;(overlay.querySelector('#wh-price') as HTMLInputElement).value = ''
      ;(overlay.querySelector('#wh-liters') as HTMLInputElement).value = ''
      ;(overlay.querySelector('#wh-km') as HTMLInputElement).value = ''
      ;(overlay.querySelector('#wh-station') as HTMLInputElement).value = ''
      setTimeout(() => { msgEl.style.display = 'none'; loadHistory() }, 1200)
    } catch {
      msgEl.textContent = '❌ Erreur lors de l\'enregistrement'
      msgEl.style.cssText = 'margin-top:8px;font-size:12px;text-align:center;display:block;color:#f87171'
    }
  })

  document.body.appendChild(overlay)
  anchor.insertAdjacentElement('afterend', btn)
}

// ── Badge économies du mois ──────────────────────────────────────────────────
async function injectMonthlySavings(userId: string) {
  if (document.getElementById('wolf-monthly-savings')) return
  try {
    const res = await fetch(`/api/savings?userId=${userId}`)
    const { thisMonth } = await res.json()
    if (!thisMonth || thisMonth <= 0) return
    const badge = document.createElement('div')
    badge.id = 'wolf-monthly-savings'
    badge.style.cssText = `margin-top:8px;padding:10px 14px;border-radius:12px;background:linear-gradient(135deg,rgba(16,185,129,.15),rgba(5,150,105,.1));border:1px solid rgba(16,185,129,.35);color:#34d399;font-size:13px;font-weight:600;font-family:${PC.font};text-align:center`
    badge.innerHTML = `💰 <strong>Tu vas économiser ${thisMonth.toFixed(2).replace('.', ',')}€ ce mois</strong><br><span style="font-size:11px;opacity:.8">en choisissant toujours la station la moins chère de ta zone</span>`
    const favBtn = document.getElementById('wolf-favs-btn') ?? document.getElementById('wolf-pro-btn')
    favBtn?.insertAdjacentElement('afterend', badge)
  } catch { /* silencieux */ }
}

// ── Recherche par ville sur screen-welcome ───────────────────────────────────
function injectCitySearch() {
  if (document.getElementById('wolf-city-btn')) return
  const deptBtn = document.getElementById('btn-dept')
  if (!deptBtn) return

  // Bouton ville
  const btn = document.createElement('button')
  btn.id = 'wolf-city-btn'
  btn.type = 'button'
  btn.className = 'loc-btn'
  btn.innerHTML = '<span class="bi">🏙️</span><span class="bt">Rechercher une ville<span class="bs">Tapez le nom de votre ville</span></span>'

  // Conteneur input + suggestions
  const wrap = document.createElement('div')
  wrap.id = 'wolf-city-wrap'
  wrap.style.cssText = 'display:none;margin-top:8px;position:relative'

  const inp = document.createElement('input')
  inp.type = 'text'
  inp.placeholder = 'Ex: Lyon, Bordeaux, Strasbourg...'
  inp.autocomplete = 'off'
  inp.style.cssText = `width:100%;padding:11px 14px;border-radius:10px;border:1.5px solid ${PC.border};background:rgba(168,85,247,.06);color:#f1f5f9;font-size:14px;font-family:${PC.font};outline:none;box-sizing:border-box`

  const sug = document.createElement('div')
  sug.style.cssText = `position:absolute;top:calc(100% + 4px);left:0;right:0;background:rgba(10,6,30,.97);border:1.5px solid ${PC.border};border-radius:12px;z-index:9999;overflow:hidden;display:none`

  const status = document.createElement('div')
  status.id = 'wolf-city-status'
  status.className = 'loc-status'

  wrap.appendChild(inp)
  wrap.appendChild(sug)

  let debounce: ReturnType<typeof setTimeout> | null = null

  inp.addEventListener('input', () => {
    const v = inp.value.trim()
    if (debounce) clearTimeout(debounce)
    if (v.length < 2) { sug.style.display = 'none'; return }
    debounce = setTimeout(async () => {
      try {
        const r = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(v)}&type=municipality&limit=6`)
        const d = await r.json()
        const results: { label: string; context: string; lat: number; lon: number }[] = (d.features ?? []).map((f: { properties: { label: string; context?: string }; geometry: { coordinates: number[] } }) => ({
          label: f.properties.label,
          context: f.properties.context?.split(',').slice(0, 2).join(' ·').trim() ?? '',
          lat: f.geometry.coordinates[1],
          lon: f.geometry.coordinates[0],
        }))
        if (!results.length) { sug.style.display = 'none'; return }
        sug.innerHTML = results.map((r, i) =>
          `<div data-i="${i}" style="padding:10px 16px;cursor:pointer;border-bottom:1px solid rgba(168,85,247,.1);font-family:${PC.font}">
            <div style="font-size:14px;color:#e2e8f0">📍 ${r.label}</div>
            ${r.context ? `<div style="font-size:11px;color:#64748b;margin-top:2px">${r.context}</div>` : ''}
          </div>`
        ).join('')
        sug.style.display = 'block'
        sug.querySelectorAll('[data-i]').forEach(el => {
          (el as HTMLElement).addEventListener('mouseenter', () => { (el as HTMLElement).style.background = 'rgba(168,85,247,.12)' })
          ;(el as HTMLElement).addEventListener('mouseleave', () => { (el as HTMLElement).style.background = '' })
          el.addEventListener('click', () => {
            const i = parseInt((el as HTMLElement).dataset.i ?? '0')
            const pick = results[i]
            inp.value = pick.label
            sug.style.display = 'none'
            status.textContent = '✅ ' + pick.label
            status.className = 'loc-status show'
            // Désélectionner les autres boutons
            document.getElementById('btn-geo')?.classList.remove('selected')
            document.getElementById('btn-dept')?.classList.remove('selected')
            btn.classList.add('selected')
            document.getElementById('dw')?.classList.remove('show')
            document.getElementById('dept-status')?.classList.remove('show')
            document.getElementById('geo-status')?.classList.remove('show')
            // Passer la localisation au script principal
            const fn = (window as unknown as Record<string, (lat: number, lon: number, name: string) => void>).wolfSetLocation
            if (fn) fn(pick.lat, pick.lon, pick.label)
          })
        })
      } catch { sug.style.display = 'none' }
    }, 280)
  })

  // Fermer suggestions au clic ailleurs
  document.addEventListener('click', (e) => {
    if (!wrap.contains(e.target as Node)) sug.style.display = 'none'
  })

  btn.addEventListener('click', () => {
    const open = wrap.style.display === 'block'
    // Fermer le dropdown département
    document.getElementById('dw')?.classList.remove('show')
    document.getElementById('btn-dept')?.classList.remove('selected')
    document.getElementById('btn-geo')?.classList.remove('selected')
    if (open) {
      wrap.style.display = 'none'
      btn.classList.remove('selected')
    } else {
      wrap.style.display = 'block'
      btn.classList.add('selected')
      inp.focus()
    }
  })

  // Insérer après btn-dept
  deptBtn.insertAdjacentElement('afterend', status)
  deptBtn.insertAdjacentElement('afterend', wrap)
  deptBtn.insertAdjacentElement('afterend', btn)
}

// ── Bouton télécharger l'app Android ────────────────────────────────────────
function injectDownloadAppButton() {
  if (document.getElementById('wolf-apk-btn')) return
  const tutoLink = document.querySelector('.tuto-link')
  if (!tutoLink) return
  const btn = document.createElement('a')
  btn.id = 'wolf-apk-btn'
  btn.href = '/WolfFuel.apk'
  btn.download = 'WolfFuel.apk'
  btn.innerHTML = '📱 Télécharger l\'app Android'
  btn.style.cssText = `display:flex;align-items:center;justify-content:center;gap:8px;margin-top:10px;padding:12px 16px;border-radius:12px;border:1.5px solid rgba(16,185,129,.3);background:rgba(16,185,129,.08);color:#34d399;font-size:14px;font-weight:700;text-decoration:none;font-family:${PC.font}`
  tutoLink.insertAdjacentElement('afterend', btn)
}

// ── Bouton Wolf Pro (non-pro) ────────────────────────────────────────────────
function injectProButton() {
  if (document.getElementById('wolf-pro-btn')) return
  const tutoLink = document.querySelector('.tuto-link')
  if (!tutoLink) return
  const btn = document.createElement('a')
  btn.id = 'wolf-pro-btn'
  btn.href = '/abonnement'
  btn.textContent = '⭐ Passer Wolf Pro — 2,99€/mois'
  btn.style.cssText = `display:flex;align-items:center;justify-content:center;gap:8px;margin-top:10px;padding:12px 16px;border-radius:12px;border:1.5px solid ${PC.border};background:linear-gradient(135deg,rgba(168,85,247,.12),rgba(124,58,237,.08));color:${PC.text};font-size:14px;font-weight:700;text-decoration:none;font-family:${PC.font}`
  tutoLink.insertAdjacentElement('afterend', btn)
}

// ── Init Pro ─────────────────────────────────────────────────────────────────
async function initProFeatures(userId: string) {
  injectNoAds()
  injectFavoriteButtons(userId)
  injectAlertsPanel(userId)
  injectSavingsBanner(userId)

  // Attendre que le bouton Pro soit injecté pour ajouter les éléments suivants
  const wait = () => {
    const proBtn = document.getElementById('wolf-pro-btn')
    if (proBtn) {
      // Remplacer le bouton "Passer Wolf Pro" par un badge "Actif"
      proBtn.textContent = '🐺⭐ Wolf Pro — Actif'
      ;(proBtn as HTMLElement).style.cssText = `display:flex;align-items:center;justify-content:center;gap:8px;margin-top:10px;padding:12px 16px;border-radius:12px;border:1.5px solid rgba(16,185,129,.5);background:linear-gradient(135deg,rgba(16,185,129,.15),rgba(5,150,105,.08));color:#34d399;font-size:14px;font-weight:700;text-decoration:none;font-family:${PC.font};cursor:default;pointer-events:none`
      injectProBadge()
      injectFavoritesPanel(userId)
      injectHistoryPanel(userId)
      injectMonthlySavings(userId)
    } else {
      setTimeout(wait, 150)
    }
  }
  wait()

  // Ré-injecter badge et favoris à chaque changement d'écran
  new MutationObserver(() => {
    injectProBadge()
    ;['res-list', 'full-list'].forEach(id => {
      const favs = new Set<string>(JSON.parse(localStorage.getItem('wolf_favorites') ?? '[]'))
      document.getElementById(id)?.querySelectorAll('.card').forEach(c => addFavBtnToCard(c, userId, favs))
    })
  }).observe(document.body, { childList: true, subtree: false })
}

// ── Suppression des fonctionnalités Pro ──────────────────────────────────────
function removeProFeatures() {
  // Restaurer le bouton Pro
  const proBtn = document.getElementById('wolf-pro-btn') as HTMLAnchorElement | null
  if (proBtn) {
    proBtn.textContent = '⭐ Passer Wolf Pro — 2,99€/mois'
    proBtn.href = '/abonnement'
    proBtn.style.cssText = `display:flex;align-items:center;justify-content:center;gap:8px;margin-top:10px;padding:12px 16px;border-radius:12px;border:1.5px solid ${PC.border};background:linear-gradient(135deg,rgba(168,85,247,.12),rgba(124,58,237,.08));color:${PC.text};font-size:14px;font-weight:700;text-decoration:none;font-family:${PC.font}`
  }
  document.getElementById('wolf-favs-btn')?.remove()
  document.getElementById('wolf-favs-overlay')?.remove()
  document.getElementById('wolf-history-btn')?.remove()
  document.getElementById('wolf-history-overlay')?.remove()
  document.getElementById('wolf-alert-fab')?.remove()
  document.getElementById('wolf-alert-panel')?.remove()
  document.getElementById('wolf-savings-banner')?.remove()
  document.getElementById('wolf-monthly-savings')?.remove()
  document.getElementById('wolf-pro-badge')?.remove()
  document.getElementById('no-ads-style')?.remove()
  // Supprimer les boutons favoris des cartes
  document.querySelectorAll('.wolf-fav-btn').forEach(el => el.remove())
}

// Variable module-level — persiste entre navigations Next.js
let _scriptsLoaded = false

async function runProCheck(attempt = 0) {
  try {
    const { data: sessionData } = await supabase.auth.getSession()
    const user = sessionData.session?.user
    // Session pas encore prête — retry jusqu'à 5 fois (toutes les 600ms)
    if (!user) {
      if (attempt < 5) setTimeout(() => runProCheck(attempt + 1), 600)
      return
    }

    const cacheKey = `wolf_pro_${user.id}`

    // Affichage immédiat depuis le cache
    if (localStorage.getItem(cacheKey) === '1') {
      await initProFeatures(user.id)
    }

    // Lire le profil en base (is_pro + subscription_id)
    const { data: profile } = await supabase
      .from('profiles').select('is_pro, subscription_id').eq('id', user.id).single()

    if (profile?.is_pro) {
      // Pro confirmé en base
      localStorage.setItem(cacheKey, '1')
      await initProFeatures(user.id)
      return
    }

    // Pas Pro selon Supabase — si un subscription_id existe, syncer avec Stripe
    // (le webhook a pu mettre is_pro=false par erreur, ou après un test d'annulation)
    if (profile?.subscription_id) {
      try {
        await fetch(`/api/subscription-details?userId=${user.id}`)
        // Après sync, relire le profil
        const { data: refreshed } = await supabase
          .from('profiles').select('is_pro').eq('id', user.id).single()
        if (refreshed?.is_pro) {
          localStorage.setItem(cacheKey, '1')
          await initProFeatures(user.id)
          return
        }
      } catch { /* silencieux */ }
    }

    // Définitivement pas Pro
    localStorage.removeItem(cacheKey)
    removeProFeatures()
  } catch { /* silencieux */ }
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function WolfFuelApp() {
  useEffect(() => {
    const loadMainScript = () => {
      document.querySelectorAll('script[src^="/main-script.js"]').forEach(s => s.remove())
      const s1 = document.createElement('script')
      s1.src = '/main-script.js?t=' + Date.now()
      s1.defer = false
      document.body.appendChild(s1)
      s1.onload = () => {
        injectCitySearch()
        injectDownloadAppButton()
        injectProButton()
        // Lancer immédiatement — si session pas encore prête, runProCheck retentera
        runProCheck()
      }
    }

    if (_scriptsLoaded) {
      loadMainScript()
      return
    }
    _scriptsLoaded = true

    const s0 = document.createElement('script')
    s0.src = '/splash-script.js'
    s0.defer = false
    document.body.appendChild(s0)
    s0.onload = loadMainScript

    setTimeout(() => {
      if (!document.querySelector('script[src^="/main-script.js"]')) loadMainScript()
    }, 500)

    // Écouter les changements de session Supabase :
    // quand l'utilisateur se connecte, runProCheck est appelé dès que la session est prête
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Attendre que le bouton Pro soit injecté dans le DOM
        const waitAndCheck = (attempts = 0) => {
          if (document.getElementById('wolf-pro-btn')) {
            runProCheck()
          } else if (attempts < 20) {
            setTimeout(() => waitAndCheck(attempts + 1), 200)
          }
        }
        waitAndCheck()
      }
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('wolf_favorites')
        // Nettoyer toutes les clés wolf_pro_* du cache
        Object.keys(localStorage).filter(k => k.startsWith('wolf_pro_')).forEach(k => localStorage.removeItem(k))
        removeProFeatures()
      }
    })

    return () => { subscription.unsubscribe() }
  }, [])

  return (
    <div dangerouslySetInnerHTML={{ __html: BODY_HTML }} suppressHydrationWarning />
  )
}
