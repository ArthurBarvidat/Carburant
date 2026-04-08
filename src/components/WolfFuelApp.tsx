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

// ── Bouton Signaler sur chaque carte (tous utilisateurs connectés) ───────────
function addSignalerBtnToCard(card: Element, userId: string) {
  if (card.querySelector('.wolf-signaler-btn')) return
  const navBtns = card.querySelector('.nav-btns')
  if (!navBtns) return

  const nameEl = card.querySelector('.station-name')
  const addrEl = card.querySelector('.station-addr')
  const priceEl = card.querySelector('.price-highlight') ?? card.querySelector('.price-val')
  const fuelEl = card.querySelector('.price-fuel')

  const stationName = nameEl?.textContent?.trim() ?? ''
  const stationAddr = addrEl?.textContent?.trim() ?? ''
  const officialPrice = parseFloat((priceEl?.textContent ?? '').replace(',', '.').replace('€', '')) || 0
  const fuelType = fuelEl?.textContent?.trim() ?? 'Gazole'
  const stationId = btoa(unescape(encodeURIComponent((stationName + stationAddr).slice(0, 60)))).slice(0, 40)

  // Bouton Signaler
  const btn = document.createElement('button')
  btn.className = 'wolf-signaler-btn'
  btn.textContent = '⚠️ Signaler'
  btn.style.cssText = `padding:8px 12px;border-radius:8px;border:1px solid rgba(245,158,11,.3);background:rgba(245,158,11,.06);color:#f59e0b;font-size:12px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif`

  // Panel signalement (caché par défaut)
  const panel = document.createElement('div')
  panel.className = 'wolf-report-panel'
  panel.style.cssText = `display:none;margin-top:10px;padding:12px;border-radius:10px;background:rgba(245,158,11,.06);border:1px solid rgba(245,158,11,.2)`
  panel.innerHTML = `
    <div style="font-size:12px;font-weight:700;color:#f59e0b;margin-bottom:6px">Signaler un prix incorrect</div>
    <div style="display:flex;gap:8px;align-items:center">
      <input type="number" placeholder="Prix réel (ex: 1.782)" step="0.001" class="wolf-report-input"
        style="flex:1;padding:9px 12px;border-radius:8px;border:1px solid rgba(245,158,11,.3);background:rgba(245,158,11,.05);color:#f1f5f9;font-size:13px;outline:none;font-family:'DM Sans',sans-serif"/>
      <button class="wolf-report-send" style="padding:9px 14px;border-radius:8px;border:none;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;white-space:nowrap">Envoyer</button>
    </div>
    <div class="wolf-report-msg" style="font-size:12px;margin-top:6px;font-weight:700;display:none"></div>
  `

  btn.addEventListener('click', (e) => {
    e.stopPropagation()
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none'
  })

  panel.querySelector('.wolf-report-send')?.addEventListener('click', async () => {
    const input = panel.querySelector('.wolf-report-input') as HTMLInputElement
    const msgEl = panel.querySelector('.wolf-report-msg') as HTMLElement
    const price = parseFloat(input.value)
    if (!price || isNaN(price)) { msgEl.textContent = '⚠️ Entre un prix valide'; msgEl.style.color = '#f87171'; msgEl.style.display = 'block'; return }
    try {
      const res = await fetch('/api/community-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, stationId, stationName, fuelType, reportedPrice: price, officialPrice }),
      })
      const data = await res.json()
      if (!res.ok) { msgEl.textContent = data.error ?? '❌ Erreur'; msgEl.style.color = '#f87171' }
      else { msgEl.textContent = '✅ Signalement envoyé, merci !'; msgEl.style.color = '#34d399'; input.value = '' }
      msgEl.style.display = 'block'
      setTimeout(() => { panel.style.display = 'none'; msgEl.style.display = 'none' }, 2500)
    } catch { msgEl.textContent = '❌ Erreur réseau'; msgEl.style.color = '#f87171'; msgEl.style.display = 'block' }
  })

  navBtns.appendChild(btn)
  ;(card as HTMLElement).appendChild(panel)
}

// ── Injection Signaler sur toutes les cartes (tous utilisateurs connectés) ────
function injectSignalerButtons(userId: string) {
  const scan = () => {
    ['res-list', 'full-list'].forEach(id => {
      document.getElementById(id)?.querySelectorAll('.card').forEach(c => addSignalerBtnToCard(c, userId))
    })
  }
  scan()
  // Observer les deux listes directement — innerHTML= déclenche childList sur l'élément
  const obs = new MutationObserver(scan)
  const resList = document.getElementById('res-list')
  const fullList = document.getElementById('full-list')
  if (resList) obs.observe(resList, { childList: true })
  if (fullList) obs.observe(fullList, { childList: true })
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

  const scan = () => {
    ['res-list', 'full-list'].forEach(id => {
      document.getElementById(id)?.querySelectorAll('.card').forEach(c => addFavBtnToCard(c, userId, savedFavs))
    })
  }
  scan()

  const obs = new MutationObserver(scan)
  const resList = document.getElementById('res-list')
  const fullList = document.getElementById('full-list')
  if (resList) obs.observe(resList, { childList: true })
  if (fullList) obs.observe(fullList, { childList: true })
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

// ── Recherche ville+département fusionnée ────────────────────────────────────
function injectCitySearch() {
  if (document.getElementById('wolf-city-wrap')) return
  const deptBtn = document.getElementById('btn-dept')
  const dw = document.getElementById('dw')
  const deptStatus = document.getElementById('dept-status')
  if (!deptBtn || !dw) return

  // Cacher le dropdown département original
  dw.style.display = 'none'
  if (deptStatus) deptStatus.style.display = 'none'

  // Conteneur input unifié (ville + dept) — s'insère après btn-dept
  const wrap = document.createElement('div')
  wrap.id = 'wolf-city-wrap'
  wrap.style.cssText = 'display:none;margin-top:8px;position:relative'

  const inp = document.createElement('input')
  inp.type = 'text'
  inp.placeholder = 'Ville (ex: Lyon) ou département (ex: Rhône, 69)...'
  inp.autocomplete = 'off'
  inp.style.cssText = `width:100%;padding:11px 14px;border-radius:10px;border:1.5px solid ${PC.border};background:rgba(168,85,247,.06);color:#f1f5f9;font-size:14px;font-family:${PC.font};outline:none;box-sizing:border-box`

  const sug = document.createElement('div')
  sug.style.cssText = `position:absolute;top:calc(100% + 4px);left:0;right:0;background:rgba(10,6,30,.97);border:1.5px solid ${PC.border};border-radius:12px;z-index:9999;overflow:hidden;display:none`

  const status = document.createElement('div')
  status.id = 'wolf-city-status'
  status.className = 'loc-status'

  wrap.appendChild(inp)
  wrap.appendChild(sug)

  // Données départements (centre géographique)
  const DEPTS: Record<string, { name: string; lat: number; lon: number }> = {
    '01': { name: 'Ain', lat: 46.15, lon: 5.35 }, '02': { name: 'Aisne', lat: 49.55, lon: 3.52 },
    '03': { name: 'Allier', lat: 46.35, lon: 3.17 }, '04': { name: 'Alpes-de-Haute-Provence', lat: 44.06, lon: 6.23 },
    '05': { name: 'Hautes-Alpes', lat: 44.56, lon: 6.27 }, '06': { name: 'Alpes-Maritimes', lat: 43.93, lon: 7.11 },
    '07': { name: 'Ardèche', lat: 44.74, lon: 4.49 }, '08': { name: 'Ardennes', lat: 49.69, lon: 4.70 },
    '09': { name: 'Ariège', lat: 42.95, lon: 1.60 }, '10': { name: 'Aube', lat: 48.32, lon: 4.08 },
    '11': { name: 'Aude', lat: 43.07, lon: 2.49 }, '12': { name: 'Aveyron', lat: 44.35, lon: 2.57 },
    '13': { name: 'Bouches-du-Rhône', lat: 43.54, lon: 5.43 }, '14': { name: 'Calvados', lat: 49.09, lon: -0.37 },
    '15': { name: 'Cantal', lat: 45.04, lon: 2.75 }, '16': { name: 'Charente', lat: 45.70, lon: 0.16 },
    '17': { name: 'Charente-Maritime', lat: 45.75, lon: -0.67 }, '18': { name: 'Cher', lat: 47.08, lon: 2.40 },
    '19': { name: 'Corrèze', lat: 45.34, lon: 1.87 }, '21': { name: 'Côte-d\'Or', lat: 47.42, lon: 4.77 },
    '22': { name: 'Côtes-d\'Armor', lat: 48.46, lon: -2.77 }, '23': { name: 'Creuse', lat: 45.99, lon: 2.02 },
    '24': { name: 'Dordogne', lat: 45.15, lon: 0.72 }, '25': { name: 'Doubs', lat: 47.17, lon: 6.35 },
    '26': { name: 'Drôme', lat: 44.72, lon: 5.13 }, '27': { name: 'Eure', lat: 49.07, lon: 1.17 },
    '28': { name: 'Eure-et-Loir', lat: 48.44, lon: 1.37 }, '29': { name: 'Finistère', lat: 48.25, lon: -4.02 },
    '2A': { name: 'Corse-du-Sud', lat: 41.86, lon: 9.01 }, '2B': { name: 'Haute-Corse', lat: 42.40, lon: 9.21 },
    '30': { name: 'Gard', lat: 43.95, lon: 4.24 }, '31': { name: 'Haute-Garonne', lat: 43.30, lon: 1.32 },
    '32': { name: 'Gers', lat: 43.64, lon: 0.59 }, '33': { name: 'Gironde', lat: 44.84, lon: -0.58 },
    '34': { name: 'Hérault', lat: 43.61, lon: 3.41 }, '35': { name: 'Ille-et-Vilaine', lat: 48.12, lon: -1.68 },
    '36': { name: 'Indre', lat: 46.81, lon: 1.69 }, '37': { name: 'Indre-et-Loire', lat: 47.25, lon: 0.68 },
    '38': { name: 'Isère', lat: 45.27, lon: 5.72 }, '39': { name: 'Jura', lat: 46.68, lon: 5.57 },
    '40': { name: 'Landes', lat: 43.94, lon: -0.74 }, '41': { name: 'Loir-et-Cher', lat: 47.58, lon: 1.34 },
    '42': { name: 'Loire', lat: 45.74, lon: 4.08 }, '43': { name: 'Haute-Loire', lat: 45.06, lon: 3.88 },
    '44': { name: 'Loire-Atlantique', lat: 47.26, lon: -1.56 }, '45': { name: 'Loiret', lat: 47.91, lon: 2.09 },
    '46': { name: 'Lot', lat: 44.62, lon: 1.67 }, '47': { name: 'Lot-et-Garonne', lat: 44.36, lon: 0.46 },
    '48': { name: 'Lozère', lat: 44.52, lon: 3.50 }, '49': { name: 'Maine-et-Loire', lat: 47.39, lon: -0.55 },
    '50': { name: 'Manche', lat: 49.12, lon: -1.33 }, '51': { name: 'Marne', lat: 48.96, lon: 4.36 },
    '52': { name: 'Haute-Marne', lat: 48.11, lon: 5.14 }, '53': { name: 'Mayenne', lat: 48.30, lon: -0.62 },
    '54': { name: 'Meurthe-et-Moselle', lat: 48.69, lon: 6.18 }, '55': { name: 'Meuse', lat: 48.99, lon: 5.38 },
    '56': { name: 'Morbihan', lat: 47.87, lon: -2.84 }, '57': { name: 'Moselle', lat: 49.03, lon: 6.58 },
    '58': { name: 'Nièvre', lat: 47.11, lon: 3.50 }, '59': { name: 'Nord', lat: 50.52, lon: 3.08 },
    '60': { name: 'Oise', lat: 49.41, lon: 2.43 }, '61': { name: 'Orne', lat: 48.57, lon: 0.09 },
    '62': { name: 'Pas-de-Calais', lat: 50.52, lon: 2.31 }, '63': { name: 'Puy-de-Dôme', lat: 45.77, lon: 3.08 },
    '64': { name: 'Pyrénées-Atlantiques', lat: 43.29, lon: -0.36 }, '65': { name: 'Hautes-Pyrénées', lat: 43.11, lon: 0.16 },
    '66': { name: 'Pyrénées-Orientales', lat: 42.60, lon: 2.70 }, '67': { name: 'Bas-Rhin', lat: 48.54, lon: 7.52 },
    '68': { name: 'Haut-Rhin', lat: 47.84, lon: 7.33 }, '69': { name: 'Rhône', lat: 45.74, lon: 4.82 },
    '70': { name: 'Haute-Saône', lat: 47.62, lon: 6.15 }, '71': { name: 'Saône-et-Loire', lat: 46.65, lon: 4.56 },
    '72': { name: 'Sarthe', lat: 47.98, lon: 0.15 }, '73': { name: 'Savoie', lat: 45.50, lon: 6.40 },
    '74': { name: 'Haute-Savoie', lat: 46.04, lon: 6.39 }, '75': { name: 'Paris', lat: 48.86, lon: 2.35 },
    '76': { name: 'Seine-Maritime', lat: 49.67, lon: 1.07 }, '77': { name: 'Seine-et-Marne', lat: 48.62, lon: 2.97 },
    '78': { name: 'Yvelines', lat: 48.80, lon: 1.83 }, '79': { name: 'Deux-Sèvres', lat: 46.55, lon: -0.34 },
    '80': { name: 'Somme', lat: 49.92, lon: 2.30 }, '81': { name: 'Tarn', lat: 43.79, lon: 2.05 },
    '82': { name: 'Tarn-et-Garonne', lat: 44.02, lon: 1.36 }, '83': { name: 'Var', lat: 43.46, lon: 6.23 },
    '84': { name: 'Vaucluse', lat: 44.05, lon: 5.05 }, '85': { name: 'Vendée', lat: 46.67, lon: -1.43 },
    '86': { name: 'Vienne', lat: 46.58, lon: 0.34 }, '87': { name: 'Haute-Vienne', lat: 45.83, lon: 1.26 },
    '88': { name: 'Vosges', lat: 48.17, lon: 6.43 }, '89': { name: 'Yonne', lat: 47.80, lon: 3.57 },
    '90': { name: 'Territoire de Belfort', lat: 47.64, lon: 6.85 }, '91': { name: 'Essonne', lat: 48.52, lon: 2.16 },
    '92': { name: 'Hauts-de-Seine', lat: 48.83, lon: 2.22 }, '93': { name: 'Seine-Saint-Denis', lat: 48.91, lon: 2.48 },
    '94': { name: 'Val-de-Marne', lat: 48.77, lon: 2.47 }, '95': { name: 'Val-d\'Oise', lat: 49.07, lon: 2.12 },
    '971': { name: 'Guadeloupe', lat: 16.25, lon: -61.55 }, '972': { name: 'Martinique', lat: 14.64, lon: -61.02 },
    '973': { name: 'Guyane', lat: 4.00, lon: -53.00 }, '974': { name: 'La Réunion', lat: -21.11, lon: 55.53 },
    '976': { name: 'Mayotte', lat: -12.83, lon: 45.17 },
  }

  let debounce: ReturnType<typeof setTimeout> | null = null

  inp.addEventListener('input', () => {
    const v = inp.value.trim()
    if (debounce) clearTimeout(debounce)
    if (v.length < 2) { sug.style.display = 'none'; return }
    debounce = setTimeout(async () => {
      try {
        // Chercher dans les départements (par nom ou numéro)
        const vLow = v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        const deptMatches = Object.entries(DEPTS)
          .filter(([num, d]) => {
            const nameLow = d.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            return nameLow.includes(vLow) || num.startsWith(v)
          })
          .slice(0, 3)
          .map(([num, d]) => ({ label: `Département ${num} — ${d.name}`, context: `Département · ${num}`, lat: d.lat, lon: d.lon, isDept: true }))

        // Chercher les villes via API
        const r = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(v)}&type=municipality&limit=5`)
        const d = await r.json()
        const cityResults = (d.features ?? []).map((f: { properties: { label: string; context?: string }; geometry: { coordinates: number[] } }) => ({
          label: f.properties.label,
          context: f.properties.context?.split(',').slice(0, 2).join(' ·').trim() ?? '',
          lat: f.geometry.coordinates[1],
          lon: f.geometry.coordinates[0],
          isDept: false,
        }))

        const results = [...deptMatches, ...cityResults]
        if (!results.length) { sug.style.display = 'none'; return }

        sug.innerHTML = results.map((r, i) =>
          `<div data-i="${i}" style="padding:10px 16px;cursor:pointer;border-bottom:1px solid rgba(168,85,247,.1);font-family:${PC.font}">
            <div style="font-size:14px;color:#e2e8f0">${r.isDept ? '🗺️' : '📍'} ${r.label}</div>
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
            document.getElementById('btn-geo')?.classList.remove('selected')
            document.getElementById('geo-status')?.classList.remove('show')
            deptBtn.classList.add('selected')
            const fn = (window as unknown as Record<string, (lat: number, lon: number, name: string) => void>).wolfSetLocation
            if (fn) fn(pick.lat, pick.lon, pick.label)
          })
        })
      } catch { sug.style.display = 'none' }
    }, 280)
  })

  document.addEventListener('click', (e) => {
    if (!wrap.contains(e.target as Node) && e.target !== deptBtn) sug.style.display = 'none'
  })

  // Brancher le bouton btn-dept existant
  deptBtn.addEventListener('click', () => {
    const open = wrap.style.display === 'block'
    document.getElementById('btn-geo')?.classList.remove('selected')
    document.getElementById('geo-status')?.classList.remove('show')
    if (open) {
      wrap.style.display = 'none'
      sug.style.display = 'none'
      deptBtn.classList.remove('selected')
    } else {
      wrap.style.display = 'block'
      deptBtn.classList.add('selected')
      setTimeout(() => inp.focus(), 50)
    }
  })

  deptBtn.insertAdjacentElement('afterend', status)
  deptBtn.insertAdjacentElement('afterend', wrap)
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

  // Ré-injecter le badge Pro à chaque changement d'écran
  new MutationObserver(injectProBadge).observe(document.body, { childList: true, subtree: false })
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
      s1.onload = async () => {
        injectCitySearch()
        injectDownloadAppButton()
        injectProButton()
        // Injecter Signaler pour tous les utilisateurs connectés
        const { data: sessionData } = await supabase.auth.getSession()
        if (sessionData.session?.user?.id) {
          injectSignalerButtons(sessionData.session.user.id)
        }
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
