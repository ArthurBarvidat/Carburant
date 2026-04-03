'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent')
    if (!consent) setVisible(true)
  }, [])

  const accept = () => {
    localStorage.setItem('cookie_consent', 'accepted')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', bottom: '16px', left: '50%', transform: 'translateX(-50%)',
      width: 'calc(100% - 32px)', maxWidth: '560px',
      background: 'rgba(15,10,40,.97)',
      border: '1.5px solid rgba(139,92,246,.3)',
      borderRadius: '16px',
      padding: '16px 20px',
      zIndex: 9999,
      boxShadow: '0 8px 40px rgba(0,0,0,.6)',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      flexWrap: 'wrap',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ flex: 1, minWidth: '200px' }}>
        <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>
          🍪 WolfFuel utilise uniquement des cookies techniques nécessaires au fonctionnement (session d'authentification). Aucun cookie publicitaire.{' '}
          <Link href="/mentions-legales" style={{ color: '#a855f7', textDecoration: 'none', fontWeight: 600 }}>
            En savoir plus
          </Link>
        </p>
      </div>
      <button
        onClick={accept}
        style={{
          padding: '10px 20px', borderRadius: '10px', border: 'none',
          background: 'linear-gradient(135deg,#a855f7,#7c3aed)',
          color: '#fff', fontSize: '13px', fontWeight: 700,
          cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          whiteSpace: 'nowrap', flexShrink: 0,
        }}
      >
        ✓ Accepter
      </button>
    </div>
  )
}
